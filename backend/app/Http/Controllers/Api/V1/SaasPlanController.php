<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\OrganizationSaasSubscription;
use App\Models\SaasPlan;
use App\Services\Saas\SaasMonetizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaasPlanController extends Controller
{
    public function __construct(private readonly SaasMonetizationService $monetizationService) {}

    /**
     * Public / Reseller SaaS Plan Comparison list.
     */
    public function index(): JsonResponse
    {
        if (SaasPlan::count() === 0) {
            app(\App\Http\Controllers\Api\V1\Admin\SaasPlanAdminController::class)->index(request());
        }

        $plans = SaasPlan::where('status', 'active')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $plans]);
    }

    /**
     * Get current organization's active SaaS subscription.
     */
    public function currentSubscription(Request $request): JsonResponse
    {
        $org = $request->user()->getOrganization();
        if (!$org) {
            return response()->json(['data' => null]);
        }

        $sub = OrganizationSaasSubscription::where('organization_id', $org->id)
            ->with('plan')
            ->first();

        return response()->json(['data' => $sub]);
    }

    /**
     * Checkout / Subscribe / Upgrade / Downgrade SaaS Plan.
     */
    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'plan_id' => ['required', 'exists:saas_plans,id'],
            'billing_interval' => ['required', 'in:monthly,yearly'],
        ]);

        $org = $request->user()->getOrganization();
        if (!$org) {
            return response()->json(['message' => 'No active organization found.'], 422);
        }

        $plan = SaasPlan::findOrFail($request->plan_id);

        $subscription = $this->monetizationService->subscribeOrganization($org, $plan, $request->billing_interval);

        return response()->json([
            'message' => "Successfully subscribed to {$plan->name}.",
            'data' => $subscription,
        ]);
    }

    /**
     * Cancel SaaS Subscription.
     */
    public function cancel(Request $request): JsonResponse
    {
        $org = $request->user()->getOrganization();
        if (!$org) {
            return response()->json(['message' => 'No active organization found.'], 422);
        }

        $subscription = $this->monetizationService->cancelSubscription($org, $request->reason ?? 'Cancelled via user portal');

        return response()->json([
            'message' => 'SaaS subscription cancelled.',
            'data' => $subscription,
        ]);
    }
}
