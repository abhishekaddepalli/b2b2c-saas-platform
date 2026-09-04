<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrganizationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Organization::with([
            'wallet:id,organization_id,available_balance,reserved_balance,credit_limit,currency',
            'users:id,name,email'
        ]);

        if ($request->filled('search')) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', $s)
                  ->orWhere('slug', 'like', $s)
                  ->orWhere('brand_name', 'like', $s)
                  ->orWhere('support_email', 'like', $s);
            });
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('onboarding_status')) {
            $query->where('onboarding_status', $request->onboarding_status);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        return response()->json($query->latest()->paginate($request->per_page ?? 25));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:organizations,slug'],
            'type' => ['nullable', 'in:platform,reseller'],
            'pricing_tier' => ['nullable', 'string'],
            'margin_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'owner_email' => ['nullable', 'email'],
            'owner_password' => ['nullable', 'string', 'min:6'],
        ]);

        $slug = $request->filled('slug')
            ? Str::slug($request->slug)
            : Str::slug($request->name) . '-' . Str::random(4);

        $metadata = [
            'margin_percentage' => (float)($request->margin_percentage ?? 15.0),
            'saas_plan' => $request->saas_plan ?? 'pro',
            'assigned_services' => $request->assigned_services ?? [],
            'assigned_products' => $request->assigned_products ?? [],
        ];

        $org = Organization::create([
            'name' => $request->name,
            'slug' => $slug,
            'type' => $request->type ?? 'reseller',
            'status' => $request->status ?? 'active',
            'onboarding_status' => 'approved',
            'pricing_tier' => $request->pricing_tier ?? 'standard',
            'credit_limit' => $request->credit_limit ?? 0,
            'brand_name' => $request->brand_name ?? $request->name,
            'support_email' => $request->support_email ?? $request->owner_email,
            'support_phone' => $request->support_phone,
            'wallet_enabled' => true,
            'white_label_enabled' => $request->boolean('white_label_enabled', true),
            'metadata' => $metadata,
        ]);

        // Ensure wallet exists with starting balance if specified
        $initialBalance = (float)($request->initial_wallet_balance ?? 0);
        $wallet = Wallet::firstOrCreate(
            ['organization_id' => $org->id],
            [
                'available_balance' => $initialBalance,
                'reserved_balance' => 0,
                'credit_limit' => 0,
                'currency' => 'INR',
                'status' => 'active',
            ]
        );

        // Optionally create / attach owner user
        if ($request->filled('owner_email')) {
            $owner = User::firstOrNew(['email' => $request->owner_email]);
            $owner->name = $request->owner_name ?? $request->name . ' Admin';
            if ($request->filled('owner_password')) {
                $owner->password = $request->owner_password;
            } elseif (!$owner->exists) {
                $owner->password = 'Reseller@1234';
            }
            $owner->status = 'active';
            $owner->email_verified_at = now();
            $owner->current_organization_id = $org->id;
            $owner->save();

            $resellerRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'RESELLER', 'guard_name' => 'web']);
            $owner->assignRole($resellerRole);

            $org->users()->syncWithoutDetaching([$owner->id => ['role_within_org' => 'owner', 'status' => 'active']]);
        }

        return response()->json([
            'message' => 'Reseller organization created successfully.',
            'data' => $org->load(['wallet', 'users']),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $org = Organization::with(['wallet', 'users'])->findOrFail($id);
        return response()->json(['data' => $org]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $org = Organization::findOrFail($id);

        $data = $request->only([
            'name', 'brand_name', 'support_email', 'support_phone',
            'pricing_tier', 'credit_limit', 'min_wallet_balance', 'auto_recharge_threshold',
            'wallet_enabled', 'white_label_enabled', 'custom_domain_enabled', 'status'
        ]);

        if ($request->filled('slug')) {
            $data['slug'] = Str::slug($request->slug);
        }

        // Merge metadata (margin_percentage, saas_plan, assigned_services, assigned_products)
        $meta = $org->metadata ?? [];
        if ($request->has('margin_percentage')) {
            $meta['margin_percentage'] = (float)$request->margin_percentage;
        }
        if ($request->has('saas_plan')) {
            $meta['saas_plan'] = $request->saas_plan;
        }
        if ($request->has('assigned_services')) {
            $meta['assigned_services'] = $request->assigned_services;
        }
        if ($request->has('assigned_products')) {
            $meta['assigned_products'] = $request->assigned_products;
        }
        $data['metadata'] = $meta;

        $org->update($data);

        // Adjust wallet balance directly if requested
        if ($request->filled('wallet_adjustment') && (float)$request->wallet_adjustment != 0) {
            $adj = (float)$request->wallet_adjustment;
            $wallet = $org->wallet ?? Wallet::create([
                'organization_id' => $org->id,
                'available_balance' => 0,
                'reserved_balance' => 0,
                'credit_limit' => 0,
                'currency' => 'INR',
                'status' => 'active',
            ]);
            $balanceBefore = (float) $wallet->available_balance;
            if ($adj < 0) {
                $wallet->decrement('available_balance', abs($adj));
            } else {
                $wallet->increment('available_balance', $adj);
            }
            $wallet->last_transaction_at = now();
            $wallet->save();
            $balanceAfter = (float) $wallet->available_balance;

            try {
                \App\Models\WalletTransaction::create([
                    'wallet_id' => $wallet->id,
                    'type' => $adj >= 0 ? 'credit' : 'debit',
                    'amount' => abs($adj),
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                    'currency' => $wallet->currency ?? 'INR',
                    'idempotency_key' => 'adm_org_adj_' . \Illuminate\Support\Str::uuid(),
                    'description' => $request->wallet_note ?: ('Admin organization balance adjustment (' . ($adj >= 0 ? '+Credit' : '-Debit') . ')'),
                    'created_by' => $request->user()?->id,
                    'created_at' => now(),
                ]);

                \App\Models\AuditLog::create([
                    'organization_id' => $org->id,
                    'actor_id' => $request->user()?->id,
                    'action' => 'wallet.adjusted',
                    'resource_type' => \App\Models\Organization::class,
                    'resource_id' => $org->id,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'old_values' => ['available_balance' => $balanceBefore],
                    'new_values' => [
                        'available_balance' => $balanceAfter,
                        'adjustment' => $adj,
                        'note' => $request->wallet_note ?: ('Admin balance adjustment (' . ($adj >= 0 ? '+Credit' : '-Debit') . ')'),
                        'organization_name' => $org->name,
                    ],
                ]);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Failed writing wallet transaction in org update: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Organization updated successfully.',
            'data' => $org->fresh(['wallet', 'users']),
        ]);
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
     * Adjust Reseller Margin & Pricing Tier
     */
    public function adjustMargin(Request $request, string $id): JsonResponse
    {
        $org = Organization::findOrFail($id);

        $request->validate([
            'margin_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'pricing_tier' => ['nullable', 'string'],
        ]);

        $meta = $org->metadata ?? [];
        $meta['margin_percentage'] = (float)$request->margin_percentage;

        $org->update([
            'metadata' => $meta,
            'pricing_tier' => $request->pricing_tier ?? $org->pricing_tier ?? 'standard',
        ]);

        return response()->json([
            'message' => 'Reseller margin updated successfully.',
            'data' => $org,
        ]);
    }

    /**
     * Change Reseller SaaS Subscription Plan
     */
    public function assignPlan(Request $request, string $id): JsonResponse
    {
        $org = Organization::findOrFail($id);

        $request->validate([
            'saas_plan' => ['required', 'string'],
        ]);

        $meta = $org->metadata ?? [];
        $meta['saas_plan'] = $request->saas_plan;
        $org->update(['metadata' => $meta]);

        return response()->json([
            'message' => "SaaS plan updated to '{$request->saas_plan}' successfully.",
            'data' => $org,
        ]);
    }

    /**
     * Assign / Unassign Products and Services to Reseller
     */
    public function assignServices(Request $request, string $id): JsonResponse
    {
        $org = Organization::findOrFail($id);

        $meta = $org->metadata ?? [];
        if ($request->has('assigned_services')) {
            $meta['assigned_services'] = (array)$request->assigned_services;
        }
        if ($request->has('assigned_products')) {
            $meta['assigned_products'] = (array)$request->assigned_products;
        }
        if ($request->has('service_margins')) {
            $meta['service_margins'] = (array)$request->service_margins;
        }

        $org->update(['metadata' => $meta]);

        return response()->json([
            'message' => 'Assigned services & products saved successfully.',
            'data' => $org,
        ]);
    }

    /**
     * Approve Reseller Onboarding Application & Configure Governance Controls.
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        $org = Organization::findOrFail($id);

        $org->update([
            'status' => 'active',
            'onboarding_status' => 'approved',
            'pricing_tier' => $request->pricing_tier ?? $org->pricing_tier ?? 'standard',
            'credit_limit' => $request->credit_limit ?? $org->credit_limit ?? 0,
            'min_wallet_balance' => $request->min_wallet_balance ?? $org->min_wallet_balance ?? 0,
            'wallet_enabled' => true,
            'white_label_enabled' => true,
            'approved_at' => now(),
            'approved_by' => $request->user()?->id,
            'rejection_reason' => null,
        ]);

        // Ensure wallet exists
        if (!$org->wallet) {
            Wallet::create([
                'organization_id' => $org->id,
                'available_balance' => 0,
                'reserved_balance' => 0,
                'credit_limit' => 0,
                'currency' => 'INR',
                'status' => 'active',
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

    public function impersonate(Request $request, string $id): JsonResponse
    {
        $admin = $request->user();
        if (!$admin || !$admin->hasRole('SUPER_ADMIN')) {
            return response()->json(['message' => 'Unauthorized. Only Super Admin can impersonate organizations.'], 403);
        }

        $org = Organization::with('users')->findOrFail($id);
        $owner = $org->users()->first();

        if (!$owner) {
            return response()->json(['message' => 'No active user found associated with this organization.'], 404);
        }

        return (new UserController())->impersonate($request, $owner->id);
    }
}
