<?php

namespace App\Http\Controllers\Api\V1\Reseller;

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
        $org = $request->user()->getOrganization();
        if (!$org && !$request->user()->isSuperAdmin()) {
            return response()->json(['data' => [], 'meta' => ['total' => 0]]);
        }

        $query = Order::query();
        if ($org) {
            $query->where('organization_id', $org->id);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  })
                  ->orWhereHas('items', function ($iq) use ($search) {
                      $iq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->with(['customer', 'items'])
            ->latest('placed_at')
            ->paginate($request->per_page ?? 20);

        return response()->json($orders);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'customer_id' => ['nullable', 'exists:users,id'],
            'payment_method' => ['nullable', 'string', 'in:wallet,gateway,card'],
        ]);

        $order = $this->orderService->createOrder($request->user(), $request->all());

        return response()->json([
            'message' => 'Reseller order placed successfully.',
            'data' => $order,
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $org = $request->user()->getOrganization();

        $order = Order::where('organization_id', $org?->id)
            ->where('id', $id)
            ->with(['customer', 'items'])
            ->firstOrFail();

        return response()->json(['data' => $order]);
    }
}
