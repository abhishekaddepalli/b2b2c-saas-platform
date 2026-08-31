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
        $services = Service::where('status', 'active')
            ->whereIn('visibility', ['public', 'reseller_only'])
            ->with(['plans', 'plans.prices'])
            ->paginate($request->per_page ?? 20);

        return response()->json($services);
    }

    public function assign(Request $request): JsonResponse
    {
        $request->validate([
            'customer_id' => 'required|uuid|exists:users,id',
            'service_plan_id' => 'required|uuid|exists:service_plans,id',
            'billing_interval' => 'nullable|string|in:monthly,quarterly,yearly',
        ]);

        $reseller = $request->user();
        $org = $reseller->getOrganization();

        if (!$org) {
            return response()->json(['message' => 'Reseller organization not found.'], 403);
        }

        // Verify customer belongs to reseller's org
        $customer = User::where('id', $request->customer_id)
            ->whereHas('organizations', fn($q) => $q->where('organizations.id', $org->id))
            ->firstOrFail();

        $plan = ServicePlan::findOrFail($request->service_plan_id);
        $interval = $request->billing_interval ?? 'monthly';

        $pricing = $this->pricingService->resolveFullBreakdown($plan);
        $months = $interval === 'yearly' ? 12 : ($interval === 'quarterly' ? 3 : 1);

        $subscription = DB::transaction(function () use ($org, $customer, $plan, $pricing, $interval, $months) {
            $resellerAmount = $pricing->resellerPrice * $months;
            $customerAmount = $pricing->customerPrice * $months;
            $costAmount = $pricing->costPrice * $months;

            // Debit reseller wallet for initial term
            if ($resellerAmount > 0) {
                $idempotencyKey = 'sub-assign-' . Str::uuid();
                $this->walletService->debit(
                    $org,
                    $resellerAmount,
                    $idempotencyKey,
                    "Service assignment for customer {$customer->name} ({$plan->name})"
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
            'message' => 'Service assigned successfully.',
            'data' => $subscription->load(['customer', 'servicePlan']),
        ], 201);
    }
}
