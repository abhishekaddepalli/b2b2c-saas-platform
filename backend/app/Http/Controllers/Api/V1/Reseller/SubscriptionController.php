<?php

namespace App\Http\Controllers\Api\V1\Reseller;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->getOrganization()?->id;

        $query = Subscription::where('organization_id', $orgId)
            ->with(['customer', 'servicePlan']);

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('id', 'like', "%{$s}%")
                  ->orWhereHas('customer', function ($cq) use ($s) {
                      $cq->where('name', 'like', "%{$s}%")
                         ->orWhere('email', 'like', "%{$s}%");
                  })
                  ->orWhereHas('servicePlan', function ($pq) use ($s) {
                      $pq->where('name', 'like', "%{$s}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $subs = $query->latest('created_at')->paginate($request->per_page ?? 20);

        return response()->json($subs);
    }

    private function findOrgSubscription(Request $request, string $id): Subscription
    {
        $org = $request->user()->getOrganization();
        $query = Subscription::where('id', $id);

        if ($org && !$request->user()->isSuperAdmin()) {
            $query->where('organization_id', $org->id);
        }

        return $query->with(['customer', 'servicePlan'])->firstOrFail();
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $sub = $this->findOrgSubscription($request, $id);
        return response()->json(['data' => $sub]);
    }

    public function suspend(Request $request, string $id): JsonResponse
    {
        $sub = $this->findOrgSubscription($request, $id);
        $sub->update([
            'status' => 'suspended',
            'suspended_at' => now(),
        ]);

        try {
            \App\Models\AuditLog::create([
                'organization_id' => $sub->organization_id,
                'actor_id' => $request->user()->id,
                'action' => 'subscription.suspended',
                'resource_type' => Subscription::class,
                'resource_id' => $sub->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'old_values' => ['status' => 'active'],
                'new_values' => ['status' => 'suspended'],
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'message' => 'Subscription suspended successfully.',
            'data' => $sub->fresh(['customer', 'servicePlan']),
        ]);
    }

    public function reactivate(Request $request, string $id): JsonResponse
    {
        $sub = $this->findOrgSubscription($request, $id);
        $sub->update([
            'status' => 'active',
            'suspended_at' => null,
        ]);

        try {
            \App\Models\AuditLog::create([
                'organization_id' => $sub->organization_id,
                'actor_id' => $request->user()->id,
                'action' => 'subscription.reactivated',
                'resource_type' => Subscription::class,
                'resource_id' => $sub->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'old_values' => ['status' => 'suspended'],
                'new_values' => ['status' => 'active'],
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'message' => 'Subscription reactivated successfully.',
            'data' => $sub->fresh(['customer', 'servicePlan']),
        ]);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $sub = $this->findOrgSubscription($request, $id);
        $sub->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        try {
            \App\Models\AuditLog::create([
                'organization_id' => $sub->organization_id,
                'actor_id' => $request->user()->id,
                'action' => 'subscription.cancelled',
                'resource_type' => Subscription::class,
                'resource_id' => $sub->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'old_values' => ['status' => $sub->getOriginal('status')],
                'new_values' => ['status' => 'cancelled'],
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'message' => 'Subscription cancelled successfully.',
            'data' => $sub->fresh(['customer', 'servicePlan']),
        ]);
    }

    public function updateAccess(Request $request, string $id): JsonResponse
    {
        $sub = $this->findOrgSubscription($request, $id);
        $existingMeta = is_array($sub->metadata) ? $sub->metadata : (json_decode($sub->metadata, true) ?: []);

        $fieldsToUpdate = [
            'service_type' => $request->service_type,
            'bundled_apps' => $request->bundled_apps,
            'access_url' => $request->access_url,
            'portal_url' => $request->portal_url,
            'username' => $request->username,
            'password' => $request->password,
            'server_ip' => $request->server_ip,
            'port' => $request->port,
            'license_key' => $request->license_key,
            'instructions' => $request->instructions,
            'admin_notes' => $request->admin_notes,
            'client_notes' => $request->client_notes,
        ];

        foreach ($fieldsToUpdate as $key => $val) {
            if (!is_null($val)) {
                $existingMeta[$key] = $val;
            }
        }

        $sub->update([
            'metadata' => $existingMeta,
            'current_period_end' => $request->current_period_end ?: $sub->current_period_end,
        ]);

        try {
            \App\Models\AuditLog::create([
                'organization_id' => $sub->organization_id,
                'actor_id' => $request->user()->id,
                'action' => 'subscription.credentials_updated',
                'resource_type' => Subscription::class,
                'resource_id' => $sub->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'old_values' => ['portal_url' => $existingMeta['portal_url'] ?? null],
                'new_values' => [
                    'portal_url' => $request->portal_url ?? $request->access_url,
                    'username' => $request->username,
                    'server_ip' => $request->server_ip,
                ],
            ]);
        } catch (\Throwable $e) {}

        return response()->json([
            'message' => 'Access credentials and provisioning settings updated successfully.',
            'data' => $sub->fresh(['customer', 'servicePlan']),
        ]);
    }
}
