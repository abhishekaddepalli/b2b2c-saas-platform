<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $org = $user->getOrganization();

        // Self-heal: Ensure any paid orders for this customer (or org) have generated invoices
        $this->reconcileMissingInvoices($user, $org);

        $query = Invoice::withoutTenantScope()
            ->with(['items', 'customer:id,name,email', 'organization:id,name,support_email']);

        if ($user->hasRole('RESELLER') && $org) {
            $query->where(function ($q) use ($user, $org) {
                $q->where('organization_id', $org->id)
                  ->orWhere('customer_id', $user->id);
            });
        } else {
            $query->where('customer_id', $user->id);
        }

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('invoice_number', 'like', "%{$s}%")
                  ->orWhere('id', 'like', "%{$s}%")
                  ->orWhereHas('items', function ($iq) use ($s) {
                      $iq->where('description', 'like', "%{$s}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $invoices = $query->latest('issued_at')->paginate($request->per_page ?? 25);

        return response()->json($invoices);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $org = $user->getOrganization();

        $query = Invoice::withoutTenantScope()->where('id', $id);

        if (!($user->isSuperAdmin())) {
            if ($user->hasRole('RESELLER') && $org) {
                $query->where(function ($q) use ($user, $org) {
                    $q->where('organization_id', $org->id)
                      ->orWhere('customer_id', $user->id);
                });
            } else {
                $query->where('customer_id', $user->id);
            }
        }

        $invoice = $query->with(['items', 'customer', 'organization'])->firstOrFail();

        return response()->json(['data' => $invoice]);
    }

    public function download(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $org = $user->getOrganization();

        $query = Invoice::withoutTenantScope()->where('id', $id);

        if (!($user->isSuperAdmin())) {
            if ($user->hasRole('RESELLER') && $org) {
                $query->where(function ($q) use ($user, $org) {
                    $q->where('organization_id', $org->id)
                      ->orWhere('customer_id', $user->id);
                });
            } else {
                $query->where('customer_id', $user->id);
            }
        }

        $invoice = $query->with(['items', 'customer', 'organization'])->firstOrFail();

        return response()->json([
            'message' => 'Invoice ready for download / printing.',
            'data' => $invoice,
            'url' => $invoice->pdf_path,
        ]);
    }

    private function reconcileMissingInvoices($user, $org): void
    {
        try {
            $existingOrderIds = Invoice::withoutTenantScope()
                ->whereNotNull('order_id')
                ->where(function ($q) use ($user, $org) {
                    $q->where('customer_id', $user->id);
                    if ($org) {
                        $q->orWhere('organization_id', $org->id);
                    }
                })
                ->pluck('order_id')
                ->toArray();

            $orderQuery = Order::where('payment_status', 'paid')
                ->whereNotIn('id', $existingOrderIds);

            if ($user->hasRole('RESELLER') && $org) {
                $orderQuery->where(function ($q) use ($user, $org) {
                    $q->where('organization_id', $org->id)
                      ->orWhere('customer_id', $user->id);
                });
            } else {
                $orderQuery->where('customer_id', $user->id);
            }

            $ordersMissing = $orderQuery->with(['items', 'customer', 'organization'])->get();

            foreach ($ordersMissing as $order) {
                $sellerName = $order->organization?->name ?? 'InfiniForge Cloud Solutions';
                $sellerEmail = $order->organization?->support_email ?? 'billing@infiniforge.cloud';
                $customerUser = $order->customer ?? $user;
                $invNumber = 'INV-' . ($order->order_number ? str_replace('ORD-', '', $order->order_number) : strtoupper(Str::random(6)));

                $inv = Invoice::withoutTenantScope()->create([
                    'invoice_number' => $invNumber,
                    'organization_id' => $order->organization_id ?? $org?->id,
                    'customer_id' => $order->customer_id ?? $user->id,
                    'order_id' => $order->id,
                    'type' => 'order',
                    'status' => 'paid',
                    'currency' => $order->currency ?? 'INR',
                    'subtotal' => $order->subtotal ?? $order->grand_total,
                    'discount_total' => $order->discount_total ?? 0,
                    'tax_total' => $order->tax_total ?? 0,
                    'grand_total' => $order->grand_total,
                    'amount_paid' => $order->grand_total,
                    'amount_due' => 0,
                    'billing_details' => [
                        'name' => $customerUser->name,
                        'email' => $customerUser->email,
                        'phone' => $customerUser->phone ?? '',
                        'company' => $customerUser->company ?? ($order->organization?->name ?? ''),
                        'address' => 'Primary Registered Address',
                    ],
                    'seller_details' => [
                        'company' => $sellerName,
                        'email' => $sellerEmail,
                        'gstin' => '36AABCU9603R1ZM',
                        'address' => 'Cyber Gateway, HITEC City, Hyderabad, 500081, India',
                    ],
                    'issued_at' => $order->placed_at ?? $order->created_at ?? now(),
                    'paid_at' => $order->paid_at ?? $order->created_at ?? now(),
                    'notes' => 'Official tax invoice for order #' . $order->order_number,
                ]);

                if ($order->items && $order->items->isNotEmpty()) {
                    foreach ($order->items as $item) {
                        InvoiceItem::create([
                            'invoice_id' => $inv->id,
                            'description' => $item->name . (($item->quantity ?? 1) > 1 ? " (Qty: {$item->quantity})" : ""),
                            'quantity' => $item->quantity ?? 1,
                            'unit_price' => $item->unit_price ?? $item->customer_price_at_purchase ?? 0,
                            'discount' => 0,
                            'tax_rate' => 0,
                            'tax_amount' => 0,
                            'total' => $item->final_price_at_purchase ?? (($item->unit_price ?? 0) * ($item->quantity ?? 1)),
                        ]);
                    }
                } else {
                    InvoiceItem::create([
                        'invoice_id' => $inv->id,
                        'description' => 'Platform Service Order #' . $order->order_number,
                        'quantity' => 1,
                        'unit_price' => $order->grand_total,
                        'discount' => 0,
                        'tax_rate' => 0,
                        'tax_amount' => 0,
                        'total' => $order->grand_total,
                    ]);
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed auto-reconciling invoices in InvoiceController: ' . $e->getMessage());
        }
    }
}
