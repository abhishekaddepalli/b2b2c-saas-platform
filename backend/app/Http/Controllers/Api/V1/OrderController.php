<?php

namespace App\Http\Controllers\Api\V1;

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
        $query = Order::where('customer_id', $request->user()->id);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%")
                  ->orWhereHas('items', function ($iq) use ($search) {
                      $iq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->with(['items'])
            ->latest('placed_at')
            ->paginate($request->per_page ?? 20);

        return response()->json($orders);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $order = Order::where('customer_id', $request->user()->id)
            ->where('id', $id)
            ->with(['items'])
            ->firstOrFail();

        return response()->json(['data' => $order]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'payment_method' => ['nullable', 'string', 'in:wallet,gateway,card'],
        ]);

        $order = $this->orderService->createOrder($request->user(), $request->all());

        return response()->json([
            'message' => 'Order placed successfully.',
            'data' => $order,
        ], 201);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $order = Order::where('customer_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $order->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Order cancelled.']);
    }
}
