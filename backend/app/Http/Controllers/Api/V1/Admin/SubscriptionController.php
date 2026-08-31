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
        return response()->json(Subscription::with(['customer', 'servicePlan'])->latest('created_at')->paginate($request->per_page ?? 20));
    }

    public function suspend(Request $request, string $id): JsonResponse
    {
        $sub = Subscription::findOrFail($id);
        $sub->update(['status' => 'suspended', 'suspended_at' => now()]);
        return response()->json(['message' => 'Subscription suspended.']);
    }

    public function reactivate(Request $request, string $id): JsonResponse
    {
        $sub = Subscription::findOrFail($id);
        $sub->update(['status' => 'active', 'suspended_at' => null]);
        return response()->json(['message' => 'Subscription reactivated.']);
    }
}
