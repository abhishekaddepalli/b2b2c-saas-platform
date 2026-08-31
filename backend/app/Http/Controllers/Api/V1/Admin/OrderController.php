<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Order\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orderService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(Order::with(['customer', 'items'])->latest('placed_at')->paginate($request->per_page ?? 20));
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => Order::with(['customer', 'items'])->findOrFail($id)]);
    }

    public function refund(Request $request, string $id): JsonResponse
    {
        $order = Order::with('items')->findOrFail($id);
        $refundedOrder = $this->orderService->refundOrder($order, $request->reason ?? 'Admin Refund');

        return response()->json([
            'message' => 'Order refunded successfully and wallet credited.',
            'data' => $refundedOrder,
        ]);
    }
}
