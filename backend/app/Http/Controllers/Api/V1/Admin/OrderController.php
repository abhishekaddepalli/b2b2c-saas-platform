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
                  ->orWhere('id', 'like', $s)
                  ->orWhereHas('customer', function ($cq) use ($s) {
                      $cq->where('name', 'like', $s)->orWhere('email', 'like', $s);
                  })
                  ->orWhereHas('items', function ($iq) use ($s) {
                      $iq->where('name', 'like', $s);
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

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'customer_id' => ['nullable', 'string'],
            'new_customer_name' => ['nullable', 'string'],
            'new_customer_email' => ['nullable', 'email'],
            'organization_id' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
            'payment_status' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'string'],
            'admin_notes' => ['nullable', 'string'],
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
            $customerId = $request->customer_id;
            if (!$customerId && $request->filled('new_customer_email')) {
                $customer = \App\Models\User::firstOrCreate(
                    ['email' => trim($request->new_customer_email)],
                    [
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'name' => $request->new_customer_name ?: explode('@', $request->new_customer_email)[0],
                        'password' => \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(16)),
                        'status' => 'active',
                    ]
                );
                $customerId = $customer->id;
            } elseif (!$customerId) {
                $customerId = $request->user()?->id ?? \App\Models\User::first()?->id;
            }

            $orgId = $request->organization_id ?: (\App\Models\Organization::where('type', 'platform')->value('id') ?? \App\Models\Organization::first()?->id);
            $itemsData = $request->items;
            $orderItems = [];
            $subtotal = 0;

            foreach ($itemsData as $it) {
                $qty = max(1, (int) ($it['quantity'] ?? 1));
                $unitPrice = isset($it['unit_price']) ? (float) $it['unit_price'] : 999;
                $costPrice = isset($it['cost_price']) ? (float) $it['cost_price'] : round($unitPrice * 0.7, 2);
                $resellerPrice = isset($it['reseller_price']) ? (float) $it['reseller_price'] : round($unitPrice * 0.85, 2);
                $lineSubtotal = $unitPrice * $qty;
                $subtotal += $lineSubtotal;

                $name = $it['name'] ?? 'Manual Item';
                $sku = $it['sku'] ?? ('SKU-' . strtoupper(\Illuminate\Support\Str::random(6)));
                $orderableType = \App\Models\Product::class;
                $orderableId = $it['product_id'] ?? null;

                if (!empty($it['service_id'])) {
                    $orderableType = \App\Models\Service::class;
                    $orderableId = $it['service_id'];
                    $srv = \App\Models\Service::find($orderableId);
                    if ($srv) $name = $srv->name;
                } elseif (!empty($it['product_id'])) {
                    $prd = \App\Models\Product::find($orderableId);
                    if ($prd) {
                        $name = $prd->name;
                        $sku = $prd->sku ?? $sku;
                    }
                }

                if (!$orderableId) {
                    $orderableId = (string) \Illuminate\Support\Str::uuid();
                }

                $itemMeta = [
                    'product_type' => $it['type'] ?? 'digital',
                    'admin_notes' => $request->admin_notes ?? '',
                ];

                if (($it['type'] ?? '') === 'software' || ($it['type'] ?? '') === 'license') {
                    $keys = [];
                    for ($k = 0; $k < $qty; $k++) {
                        $keys[] = strtoupper(\Illuminate\Support\Str::random(4) . '-' . \Illuminate\Support\Str::random(4) . '-' . \Illuminate\Support\Str::random(4) . '-' . \Illuminate\Support\Str::random(4));
                    }
                    $itemMeta['license_key'] = implode(', ', $keys);
                    $itemMeta['license_keys'] = $keys;
                    $itemMeta['software_url'] = $it['software_url'] ?? 'https://app.infiniforge.cloud';
                    $itemMeta['validity_days'] = 365;
                } elseif (($it['type'] ?? '') === 'physical') {
                    $itemMeta['is_shippable'] = true;
                    $itemMeta['shipping_status'] = 'shipped';
                    $itemMeta['courier'] = $it['courier'] ?? 'BlueDart Express';
                    $itemMeta['tracking_number'] = $it['tracking_number'] ?? ('TRK-' . strtoupper(\Illuminate\Support\Str::random(10)));
                } elseif (($it['type'] ?? '') === 'digital') {
                    $itemMeta['is_downloadable'] = true;
                    $itemMeta['download_url'] = $it['download_url'] ?? 'https://resell.infiniforge.cloud/downloads/asset-pkg.zip';
                }

                $orderItems[] = [
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'orderable_type' => $orderableType,
                    'orderable_id' => $orderableId,
                    'name' => $name,
                    'sku' => $sku,
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'cost_price_at_purchase' => $costPrice,
                    'reseller_price_at_purchase' => $resellerPrice,
                    'customer_price_at_purchase' => $unitPrice,
                    'final_price_at_purchase' => $lineSubtotal,
                    'currency' => 'INR',
                    'metadata' => json_encode($itemMeta),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $order = Order::create([
                'organization_id' => $orgId,
                'customer_id' => $customerId,
                'placed_by' => $request->user()?->id,
                'order_number' => 'ORD-' . strtoupper(\Illuminate\Support\Str::random(8)),
                'status' => $request->status ?? 'completed',
                'payment_status' => $request->payment_status ?? 'paid',
                'payment_method' => $request->payment_method ?? 'manual',
                'subtotal' => $subtotal,
                'discount_total' => 0,
                'tax_total' => round($subtotal * 0.18, 2),
                'grand_total' => round($subtotal * 1.18, 2),
                'currency' => 'INR',
                'placed_at' => now(),
            ]);

            foreach ($orderItems as &$item) {
                $item['order_id'] = $order->id;
            }
            \Illuminate\Support\Facades\DB::table('order_items')->insert($orderItems);

            return response()->json([
                'message' => 'Manual order created successfully.',
                'data' => $order->fresh(['items', 'customer', 'organization']),
            ], 201);
        });
    }

    public function assign(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'organization_id' => ['required', 'exists:organizations,id'],
        ]);

        $order = Order::findOrFail($id);
        $order->update([
            'organization_id' => $request->organization_id,
        ]);

        return response()->json([
            'message' => 'Order reassigned to organization successfully.',
            'data' => $order->fresh(['customer', 'organization', 'items']),
        ]);
    }

    public function bulkAction(Request $request): JsonResponse
    {
        $request->validate([
            'action' => ['required', 'string', 'in:status,delete'],
            'ids' => ['required', 'array', 'min:1'],
            'status' => ['nullable', 'string'],
        ]);

        $ids = $request->ids;

        if ($request->action === 'status') {
            $status = $request->status ?? 'completed';
            Order::whereIn('id', $ids)->update([
                'status' => $status,
                'updated_at' => now(),
            ]);
            return response()->json(['message' => count($ids) . ' orders status updated to ' . $status . '.']);
        }

        if ($request->action === 'delete') {
            Order::whereIn('id', $ids)->delete();
            return response()->json(['message' => count($ids) . ' orders removed successfully.']);
        }

        return response()->json(['message' => 'Action executed successfully.']);
    }
}
