<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Order\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private readonly ?OrderService $orderService = null) {}

    public function index(Request $request): JsonResponse
    {
        $query = Order::with([
            'customer:id,name,email',
            'organization:id,name,slug',
            'items'
        ]);

        if ($request->filled('search')) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('order_number', 'like', $s)
                  ->orWhereHas('customer', function ($cq) use ($s) {
                      $cq->where('name', 'like', $s)->orWhere('email', 'like', $s);
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        return response()->json($query->latest('created_at')->paginate($request->per_page ?? 25));
    }

    public function show(string $id): JsonResponse
    {
        $order = Order::with(['customer', 'organization', 'items', 'invoice', 'payment'])->findOrFail($id);
        return response()->json(['data' => $order]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $order->update([
            'status' => $request->status ?? $order->status,
            'payment_status' => $request->payment_status ?? $order->payment_status,
        ]);

        return response()->json([
            'message' => 'Order status updated successfully.',
            'data' => $order->load(['customer', 'items']),
        ]);
    }

    public function refund(Request $request, string $id): JsonResponse
    {
        $order = Order::with('items')->findOrFail($id);

        $order->update([
            'status' => 'refunded',
            'payment_status' => 'refunded',
        ]);

        return response()->json([
            'message' => 'Order marked as refunded successfully.',
            'data' => $order,
        ]);
    }

    public function updateFulfillment(Request $request, string $id): JsonResponse
    {
        $order = Order::with('items')->findOrFail($id);

        $itemId = $request->input('item_id');
        $item = $itemId ? $order->items->firstWhere('id', $itemId) : $order->items->first();

        if ($item) {
            $existingMeta = is_array($item->metadata) ? $item->metadata : (json_decode($item->metadata, true) ?: []);

            $fieldsToUpdate = [
                'license_key' => $request->license_key,
                'software_url' => $request->software_url,
                'login_portal_url' => $request->login_portal_url,
                'login_username' => $request->login_username,
                'login_password' => $request->login_password,
                'access_instructions' => $request->access_instructions,
                'expires_at' => $request->expires_at,
                'validity_days' => $request->validity_days,
                'tracking_number' => $request->tracking_number,
                'courier' => $request->courier,
                'shipping_status' => $request->shipping_status,
                'download_url' => $request->download_url,
                'file_version' => $request->file_version,
                'admin_notes' => $request->admin_notes,
                'live_preview_url' => $request->live_preview_url,
            ];

            foreach ($fieldsToUpdate as $key => $val) {
                if (!is_null($val)) {
                    $existingMeta[$key] = $val;
                }
            }

            \Illuminate\Support\Facades\DB::table('order_items')->where('id', $item->id)->update([
                'metadata' => json_encode($existingMeta),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Fulfillment credentials, software keys, and delivery details updated successfully.',
            'data' => $order->fresh(['items', 'customer']),
        ]);
    }
}
