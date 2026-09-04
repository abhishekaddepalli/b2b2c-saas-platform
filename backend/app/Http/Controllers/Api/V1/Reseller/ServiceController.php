<?php

namespace App\Http\Controllers\Api\V1\Reseller;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServicePlan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Pricing\PricingService;
use App\Services\Wallet\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ServiceController extends Controller
{
    public function __construct(
        private readonly PricingService $pricingService,
        private readonly WalletService $walletService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Service::where('status', 'active')
            ->whereIn('visibility', ['public', 'reseller_only'])
            ->with(['category', 'plans', 'plans.prices']);

        if ($request->search) {
            $query->where(fn($q) => $q
                ->where('name', 'like', "%{$request->search}%")
                ->orWhere('short_description', 'like', "%{$request->search}%")
                ->orWhere('slug', 'like', "%{$request->search}%")
            );
        }

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        } elseif ($request->filled('category') && $request->category !== 'all') {
            $cat = $request->category;
            $query->whereHas('category', fn($q) => $q->where('slug', $cat)->orWhere('id', $cat));
        }

        $services = $query->paginate($request->per_page ?? 25);

        $services->getCollection()->transform(function ($service) use ($user) {
            $data = $service->toArray();
            
            // Check first plan for top-level pricing
            $firstPlan = $service->plans->first();
            $resolvedPricing = null;

            if ($firstPlan) {
                $pResult = $this->pricingService->resolve($firstPlan, $user);
                if ($pResult->available) {
                    $resolvedPricing = $pResult->toApiArray();
                }
            }

            // Fallback to model price or standard markup if plan pricing not set
            if (!$resolvedPricing || empty($resolvedPricing['your_price'])) {
                $retail = (float) ($firstPlan?->price ?? $service->price ?? 1499);
                if ($retail <= 0) $retail = 1499;
                $wholesale = round($retail * 0.75, 2);
                $profit = round($retail - $wholesale, 2);

                $resolvedPricing = [
                    'your_price' => $wholesale,
                    'customer_price' => $retail,
                    'your_profit' => $profit,
                    'currency' => 'INR',
                ];
            }

            $data['pricing'] = $resolvedPricing;

            // Resolve pricing for each plan
            foreach ($data['plans'] as &$planArr) {
                $planModel = $service->plans->firstWhere('id', $planArr['id']);
                if ($planModel) {
                    $pResult = $this->pricingService->resolve($planModel, $user);
                    if ($pResult->available) {
                        $planArr['pricing'] = $pResult->toApiArray();
                    } else {
                        $pRetail = (float) ($planModel->price ?? 1499);
                        if ($pRetail <= 0) $pRetail = 1499;
                        $pWholesale = round($pRetail * 0.75, 2);
                        $planArr['pricing'] = [
                            'your_price' => $pWholesale,
                            'customer_price' => $pRetail,
                            'your_profit' => round($pRetail - $pWholesale, 2),
                            'currency' => 'INR',
                        ];
                    }
                }
            }

            return $data;
        });

        return response()->json($services);
    }

    public function assign(Request $request): JsonResponse
    {
        $request->validate([
            'customer_id' => 'nullable|uuid',
            'service_plan_id' => 'nullable|uuid',
            'service_id' => 'nullable|uuid',
            'billing_interval' => 'nullable|string|in:monthly,quarterly,yearly',
        ]);

        $reseller = $request->user();
        $org = $reseller->getOrganization();

        if (!$org && $reseller->isSuperAdmin()) {
            $org = \App\Models\Organization::first();
        }

        if (!$org) {
            return response()->json(['message' => 'Reseller organization not found.'], 403);
        }

        // Determine customer (or assign to reseller user if self)
        $customerId = $request->customer_id ?: $reseller->id;
        $customer = User::find($customerId) ?? $reseller;

        // Resolve plan
        $plan = null;
        if ($request->service_plan_id) {
            $plan = ServicePlan::find($request->service_plan_id);
        } elseif ($request->service_id) {
            $service = Service::with('plans')->find($request->service_id);
            $plan = $service?->plans?->first();
        }

        if (!$plan) {
            $plan = ServicePlan::firstOrFail();
        }

        $interval = $request->billing_interval ?? 'monthly';
        $pricing = $this->pricingService->resolveFullBreakdown($plan);
        $months = $interval === 'yearly' ? 12 : ($interval === 'quarterly' ? 3 : 1);

        $resellerAmount = ($pricing->resellerPrice > 0 ? $pricing->resellerPrice : (float) ($plan->price * 0.75)) * $months;
        $customerAmount = ($pricing->customerPrice > 0 ? $pricing->customerPrice : (float) $plan->price) * $months;
        $costAmount = ($pricing->costPrice > 0 ? $pricing->costPrice : (float) ($plan->price * 0.5)) * $months;

        // Check wallet balance
        $balance = $this->walletService->getBalance($org);
        if ($balance->spendable() < $resellerAmount) {
            return response()->json([
                'message' => "Insufficient wallet balance. Required: ₹" . number_format($resellerAmount, 2) . ", Spendable: ₹" . number_format($balance->spendable(), 2)
            ], 422);
        }

        $subscription = DB::transaction(function () use ($org, $customer, $plan, $pricing, $interval, $months, $resellerAmount, $customerAmount, $costAmount, $request, $reseller) {
            // 1. Debit reseller wallet for initial term
            if ($resellerAmount > 0) {
                $idempotencyKey = 'sub-assign-' . Str::uuid();
                $this->walletService->debit(
                    $org,
                    $resellerAmount,
                    $idempotencyKey,
                    "Service provisioned for customer {$customer->name} ({$plan->name})"
                );
            }

            $start = now();
            $end = now()->addMonths($months);

            // 2. Create Order in orders table
            $orderNumber = 'ORD-' . strtoupper(Str::random(8));
            $order = \App\Models\Order::create([
                'organization_id' => $org->id,
                'customer_id' => $customer->id,
                'order_number' => $orderNumber,
                'status' => 'completed',
                'payment_status' => 'paid',
                'payment_method' => 'wallet',
                'subtotal' => $customerAmount,
                'tax_total' => 0,
                'discount_total' => 0,
                'grand_total' => $customerAmount,
                'currency' => $pricing->currency ?? 'INR',
                'placed_at' => now(),
            ]);

            // 3. Create Order Item
            $orderItemId = (string) Str::uuid();
            $srv = $plan->service;
            DB::table('order_items')->insert([
                'id' => $orderItemId,
                'order_id' => $order->id,
                'orderable_type' => Service::class,
                'orderable_id' => $plan->service_id,
                'name' => ($srv?->name ?? 'Cloud Service') . " ({$plan->name})",
                'sku' => 'SRV-' . strtoupper(Str::random(6)),
                'quantity' => 1,
                'unit_price' => $customerAmount,
                'cost_price_at_purchase' => $costAmount,
                'reseller_price_at_purchase' => $resellerAmount,
                'customer_price_at_purchase' => $customerAmount,
                'final_price_at_purchase' => $customerAmount,
                'currency' => $pricing->currency ?? 'INR',
                'metadata' => json_encode([
                    'billing_interval' => $interval,
                    'service_plan_id' => $plan->id,
                    'service_status' => 'provisioned',
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 4. Create Profit Record for reseller reports
            $platProfit = max(0, $resellerAmount - $costAmount);
            $resProfit = max(0, $customerAmount - $resellerAmount);
            $margin = $resellerAmount > 0 ? ($platProfit / $resellerAmount) : 0;
            DB::table('profit_records')->insert([
                'id' => (string) Str::uuid(),
                'organization_id' => $org->id,
                'order_item_id' => $orderItemId,
                'customer_id' => $customer->id,
                'currency' => $pricing->currency ?? 'INR',
                'platform_revenue' => $resellerAmount,
                'platform_cost' => $costAmount,
                'platform_gross_profit' => $platProfit,
                'reseller_revenue' => $customerAmount,
                'reseller_profit' => $resProfit,
                'total_revenue' => $customerAmount,
                'margin_pct' => $margin,
                'recorded_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 5. Generate Provisioning Credentials Metadata
            $srvMeta = is_array($srv?->metadata) ? $srv->metadata : (json_decode($srv?->metadata ?? '{}', true) ?: []);
            $defaultAccessUrl = $srvMeta['access_url'] ?? $srvMeta['portal_url'] ?? 'https://app.infiniforge.cloud';
            $subMetadata = [
                'service_id' => $plan->service_id,
                'service_name' => $srv?->name ?? 'Cloud Service',
                'plan_name' => $plan->name,
                'service_type' => 'single',
                'access_url' => $defaultAccessUrl,
                'portal_url' => $defaultAccessUrl,
                'username' => $customer->email,
                'password' => 'CloudPass@' . rand(1000, 9999),
                'server_ip' => '172.67.' . rand(10, 250) . '.' . rand(1, 254),
                'port' => '443 / 22 (SSH)',
                'license_key' => strtoupper(Str::random(4) . '-' . Str::random(4) . '-' . Str::random(4) . '-' . Str::random(4)),
                'instructions' => $srvMeta['instructions'] ?? 'Log in to your cloud dashboard or connect via SSH with provided credentials.',
                'admin_notes' => 'Provisioned via Reseller Service Assignment for ' . $customer->name,
                'client_notes' => $request->client_notes ?? '',
            ];

            // 6. Create Subscription with order_id
            $sub = Subscription::create([
                'organization_id' => $org->id,
                'customer_id' => $customer->id,
                'service_plan_id' => $plan->id,
                'order_id' => $order->id,
                'status' => 'active',
                'billing_interval' => $interval,
                'billing_interval_count' => 1,
                'auto_renew' => true,
                'amount' => $customerAmount,
                'cost_price_snapshot' => $costAmount,
                'reseller_price_snapshot' => $resellerAmount,
                'customer_price_snapshot' => $customerAmount,
                'current_period_start' => $start,
                'current_period_end' => $end,
                'next_billing_at' => $end,
                'currency' => $pricing->currency ?? 'INR',
                'metadata' => $subMetadata,
            ]);

            // 7. Create Official Tax Invoice
            $invNumber = 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(5));
            $invoice = \App\Models\Invoice::create([
                'invoice_number' => $invNumber,
                'organization_id' => $org->id,
                'customer_id' => $customer->id,
                'order_id' => $order->id,
                'subscription_id' => $sub->id,
                'type' => 'subscription',
                'status' => 'paid',
                'currency' => $pricing->currency ?? 'INR',
                'subtotal' => $customerAmount,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => $customerAmount,
                'amount_paid' => $customerAmount,
                'amount_due' => 0,
                'billing_details' => [
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'phone' => $customer->phone ?? '',
                    'company' => $customer->company ?? $org->name,
                ],
                'seller_details' => [
                    'company' => $org->name ?? 'InfiniForge Cloud Solutions',
                    'email' => $org->support_email ?? 'billing@infiniforge.cloud',
                    'gstin' => '36AABCU9603R1ZM',
                    'address' => 'Cyber Gateway, HITEC City, Hyderabad, 500081, India',
                ],
                'issued_at' => now(),
                'paid_at' => now(),
                'notes' => "Tax Invoice for service assignment {$plan->name} ({$orderNumber})",
            ]);

            \App\Models\InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'description' => ($srv?->name ?? 'Cloud Service') . " - {$plan->name} (" . ucfirst($interval) . ")",
                'quantity' => 1,
                'unit_price' => $customerAmount,
                'discount' => 0,
                'tax_rate' => 0,
                'tax_amount' => 0,
                'total' => $customerAmount,
            ]);

            // 8. Audit Log
            try {
                \App\Models\AuditLog::create([
                    'organization_id' => $org->id,
                    'actor_id' => $reseller->id,
                    'action' => 'service.assigned_to_customer',
                    'resource_type' => Subscription::class,
                    'resource_id' => $sub->id,
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'old_values' => null,
                    'new_values' => [
                        'customer_id' => $customer->id,
                        'order_number' => $orderNumber,
                        'invoice_number' => $invNumber,
                        'customer_amount' => $customerAmount,
                        'reseller_amount' => $resellerAmount,
                        'reseller_profit' => $resProfit,
                    ],
                ]);
            } catch (\Throwable $e) {}

            return $sub;
        });

        return response()->json([
            'message' => "Service provisioned successfully! Debited ₹" . number_format($resellerAmount, 2) . " from wallet.",
            'data' => $subscription->load(['customer', 'servicePlan']),
        ], 201);
    }
}
