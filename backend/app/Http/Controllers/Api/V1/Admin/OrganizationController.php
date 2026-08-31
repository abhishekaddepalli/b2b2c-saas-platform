<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Organization::with(['wallet', 'users']);

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->onboarding_status) {
            $query->where('onboarding_status', $request->onboarding_status);
        }
        if ($request->type) {
            $query->where('type', $request->type);
        }

        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'unique:organizations,slug'],
            'type' => ['nullable', 'in:platform,reseller'],
        ]);

        $org = Organization::create([
            'name' => $request->name,
            'slug' => $request->slug,
            'type' => $request->type ?? 'reseller',
            'status' => 'pending',
            'onboarding_status' => 'draft',
        ]);

        return response()->json(['message' => 'Organization created.', 'data' => $org], 201);
    }

    public function show(string $id): JsonResponse
    {
        $org = Organization::with(['wallet', 'users'])->findOrFail($id);
        return response()->json(['data' => $org]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $org = Organization::findOrFail($id);

        $org->update($request->only([
            'name', 'brand_name', 'support_email', 'support_phone',
            'pricing_tier', 'credit_limit', 'min_wallet_balance', 'auto_recharge_threshold',
            'wallet_enabled', 'white_label_enabled', 'custom_domain_enabled', 'status'
        ]));

        return response()->json(['message' => 'Organization updated.', 'data' => $org]);
    }

    public function destroy(string $id): JsonResponse
    {
        $org = Organization::findOrFail($id);
        $org->delete();

        return response()->json(['message' => 'Organization deleted.']);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $org = Organization::findOrFail($id);
        $org->update(['status' => $request->status ?? 'active']);
        return response()->json(['message' => 'Organization status updated.', 'data' => $org]);
    }

    /**
     * Approve Reseller Onboarding Application & Configure Governance Controls.
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        $org = Organization::findOrFail($id);

        $request->validate([
            'pricing_tier' => ['nullable', 'string', 'in:standard,vip,enterprise,custom'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'min_wallet_balance' => ['nullable', 'numeric', 'min:0'],
            'wallet_enabled' => ['nullable', 'boolean'],
            'white_label_enabled' => ['nullable', 'boolean'],
            'custom_domain_enabled' => ['nullable', 'boolean'],
        ]);

        $org->update([
            'status' => 'active',
            'onboarding_status' => 'approved',
            'pricing_tier' => $request->pricing_tier ?? $org->pricing_tier ?? 'standard',
            'credit_limit' => $request->credit_limit ?? $org->credit_limit ?? 0,
            'min_wallet_balance' => $request->min_wallet_balance ?? $org->min_wallet_balance ?? 0,
            'wallet_enabled' => $request->has('wallet_enabled') ? $request->boolean('wallet_enabled') : $org->wallet_enabled,
            'white_label_enabled' => $request->has('white_label_enabled') ? $request->boolean('white_label_enabled') : $org->white_label_enabled,
            'custom_domain_enabled' => $request->has('custom_domain_enabled') ? $request->boolean('custom_domain_enabled') : $org->custom_domain_enabled,
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
            'rejection_reason' => null,
        ]);

        // Ensure wallet exists
        if (!$org->wallet) {
            \App\Models\Wallet::create([
                'organization_id' => $org->id,
                'balance' => 0,
                'available_balance' => 0,
                'currency' => 'INR',
            ]);
        }

        return response()->json([
            'message' => 'Reseller organization approved and governed successfully.',
            'data' => $org->fresh(['wallet']),
        ]);
    }

    /**
     * Reject Reseller Onboarding Application.
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        $org = Organization::findOrFail($id);

        $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $org->update([
            'status' => 'suspended',
            'onboarding_status' => 'rejected',
            'rejection_reason' => $request->reason,
        ]);

        return response()->json([
            'message' => 'Reseller onboarding application rejected.',
            'data' => $org,
        ]);
    }
}
