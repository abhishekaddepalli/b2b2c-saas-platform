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
}
