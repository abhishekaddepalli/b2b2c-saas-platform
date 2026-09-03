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
            $query->where('name', 'like', "%{$request->search}%");
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

        $subscription = DB::transaction(function () use ($org, $customer, $plan, $pricing, $interval, $months, $resellerAmount, $customerAmount, $costAmount) {
            // Debit reseller wallet for initial term
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

            return Subscription::create([
                'organization_id' => $org->id,
                'customer_id' => $customer->id,
                'service_plan_id' => $plan->id,
                'status' => 'active',
                'billing_interval' => $interval,
                'amount' => $customerAmount,
                'cost_price_snapshot' => $costAmount,
                'reseller_price_snapshot' => $resellerAmount,
                'customer_price_snapshot' => $customerAmount,
                'current_period_start' => $start,
                'current_period_end' => $end,
                'next_billing_at' => $end,
                'currency' => $pricing->currency ?? 'INR',
            ]);
        });

        return response()->json([
            'message' => "Service provisioned successfully! Debited ₹" . number_format($resellerAmount, 2) . " from wallet.",
            'data' => $subscription->load(['customer', 'servicePlan']),
        ], 201);
    }
}
