<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Subscription::where('customer_id', $request->user()->id)
            ->with(['servicePlan']);

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('id', 'like', "%{$s}%")
                  ->orWhereHas('servicePlan', function ($pq) use ($s) {
                      $pq->where('name', 'like', "%{$s}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $subscriptions = $query->latest('created_at')->paginate($request->per_page ?? 20);

        return response()->json($subscriptions);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $sub = Subscription::where('customer_id', $request->user()->id)
            ->where('id', $id)
            ->with(['servicePlan'])
            ->firstOrFail();

        return response()->json(['data' => $sub]);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $sub = Subscription::where('customer_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $sub->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => $request->reason ?? 'Cancelled by customer',
        ]);

        return response()->json(['message' => 'Subscription cancelled.']);
    }
}
