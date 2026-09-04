<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Subscription::with([
            'customer:id,name,email',
            'servicePlan:id,name,slug'
        ]);

        if ($request->filled('search')) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('id', 'like', $s)
                  ->orWhereHas('customer', function ($cq) use ($s) {
                      $cq->where('name', 'like', $s)->orWhere('email', 'like', $s);
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest('created_at')->paginate($request->per_page ?? 25));
    }

    public function suspend(Request $request, string $id): JsonResponse
    {
        $sub = Subscription::findOrFail($id);
        $sub->update(['status' => 'suspended', 'suspended_at' => now()]);

        return response()->json(['message' => 'Subscription suspended.', 'data' => $sub]);
    }

    public function reactivate(Request $request, string $id): JsonResponse
    {
        $sub = Subscription::findOrFail($id);
        $sub->update(['status' => 'active', 'suspended_at' => null]);

        return response()->json(['message' => 'Subscription reactivated.', 'data' => $sub]);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $sub = Subscription::findOrFail($id);
        $sub->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        return response()->json(['message' => 'Subscription cancelled.', 'data' => $sub]);
    }

    public function updateAccess(Request $request, string $id): JsonResponse
    {
        $sub = Subscription::findOrFail($id);

        $existingMeta = is_array($sub->metadata) ? $sub->metadata : (json_decode($sub->metadata, true) ?: []);

        $fieldsToUpdate = [
            'service_type' => $request->service_type,
            'bundled_apps' => $request->bundled_apps,
            'access_url' => $request->access_url,
            'portal_url' => $request->portal_url,
            'username' => $request->username,
            'password' => $request->password,
            'instructions' => $request->instructions,
            'admin_notes' => $request->admin_notes,
            'live_preview_url' => $request->live_preview_url,
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

        return response()->json([
            'message' => 'Cloud service credentials & bundled app access updated successfully.',
            'data' => $sub->fresh(['customer', 'servicePlan']),
        ]);
    }
}
