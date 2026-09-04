<?php

namespace App\Services\Order;

use App\Exceptions\InsufficientWalletBalanceException;
use App\Models\AuditLog;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\User;
use App\Services\Pricing\PricingService;
use App\Services\Wallet\WalletService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderService
{
    public function __construct(
        private readonly PricingService $pricingService,
        private readonly WalletService $walletService,
    ) {}

    public function createOrder($user, array $data): Order
    {
        return DB::transaction(function () use ($user, $data) {
            $org = $user->getOrganization();
            $itemsData = $data['items'] ?? [];
            if (empty($itemsData)) {
                throw new \InvalidArgumentException('Order must contain at least one item.');
            }

            $orderItems = [];
            $totalCustomerAmount = 0;
            $totalResellerAmount = 0;
            $totalCostAmount = 0;

            foreach ($itemsData as $item) {
                $quantity = max(1, (int) ($item['quantity'] ?? 1));
                $isService = !empty($item['service_id']);
                $product = null;
                $service = null;

                if ($isService) {
                    $service = \App\Models\Service::with('plans')->findOrFail($item['service_id']);
                    $basePrice = (float) ($service->plans?->first()?->price ?? 1999);
                    $interval = $item['interval'] ?? 'monthly';
                    if ($interval === 'yearly') $basePrice = round($basePrice * 10);

                    $customerPrice = isset($item['customer_price']) ? (float) $item['customer_price'] : (isset($item['unit_price']) ? (float) $item['unit_price'] : $basePrice);
                    $resellerPrice = round($customerPrice * 0.75, 2);
                    $costPrice = round($customerPrice * 0.50, 2);

                    $productMeta = is_array($service->metadata) ? $service->metadata : (json_decode($service->metadata, true) ?: []);
                    $itemMeta = [
                        'product_type' => 'service',
                        'billing_interval' => $interval,
                        'sla_hours' => $productMeta['sla_hours'] ?? 48,
                        'revisions' => 3,
                        'service_status' => 'provisioning',
                        'client_notes' => $item['client_notes'] ?? '',
                    ];
                    $itemName = $service->name;
                    $itemSku = 'SRV-' . strtoupper(\Illuminate\Support\Str::random(6));
                    $orderableType = \App\Models\Service::class;
                    $orderableId = $service->id;
                    $currency = 'INR';
                } else {
                    $product = Product::findOrFail($item['product_id']);
                    $pricingResult = $this->pricingService->resolve($product, $user);

                    $costPrice = $pricingResult->costPrice ?? 0;
                    $resellerPrice = $pricingResult->resellerPrice ?? 0;
                    $customerPrice = isset($item['customer_price']) ? (float) $item['customer_price'] : ($pricingResult->customerPrice ?? 0);

                    $productMeta = is_array($product->metadata) ? $product->metadata : (json_decode($product->metadata, true) ?: []);
                    $itemMeta = [
                        'product_type' => $product->type ?? 'digital',
                        'live_preview_url' => $productMeta['live_preview_url'] ?? '',
                    ];
                    $itemName = $product->name;
                    $itemSku = $product->sku;
                    $orderableType = Product::class;
                    $orderableId = $product->id;
                    $currency = $product->currency ?? 'INR';
                }

                $itemSubtotal = $customerPrice * $quantity;
                $totalCostAmount += ($costPrice * $quantity);
                $totalResellerAmount += ($resellerPrice * $quantity);
                $totalCustomerAmount += $itemSubtotal;

                if ($product && $product->type === 'software_license') {
                    $licenseKeys = [];
                    for ($k = 0; $k < $quantity; $k++) {
                        $licenseKeys[] = strtoupper(Str::random(4) . '-' . Str::random(4) . '-' . Str::random(4) . '-' . Str::random(4));
                    }
                    $validityDays = (int) ($productMeta['validity_days'] ?? 365);
                    $itemMeta['license_key'] = implode(', ', $licenseKeys);
                    $itemMeta['license_keys'] = $licenseKeys;
                    $itemMeta['software_url'] = $productMeta['software_url'] ?? $productMeta['download_url'] ?? 'https://download.infiniforge.cloud';
                    $itemMeta['login_portal_url'] = $productMeta['login_portal_url'] ?? $productMeta['software_url'] ?? 'https://app.infiniforge.cloud';
                    $itemMeta['login_username'] = $user->email;
                    $itemMeta['login_password'] = 'LicPass@' . rand(1000, 9999);
                    $itemMeta['access_instructions'] = $productMeta['access_instructions'] ?? 'Log in to your software portal using your email and temporary password, then enter your license key to activate.';
                    $itemMeta['validity_days'] = $validityDays;
                    $itemMeta['activated_at'] = now()->toISOString();
                    $itemMeta['expires_at'] = now()->addDays($validityDays)->toISOString();
                    $itemMeta['max_devices'] = $productMeta['activation_limit'] ?? '3 Devices';
                } elseif ($product && $product->type === 'physical') {
                    $courier = $productMeta['courier'] ?? 'BlueDart Express';
                    $deliveryDays = (int) ($productMeta['delivery_days'] ?? 4);
                    $itemMeta['is_shippable'] = true;
                    $itemMeta['shipping_status'] = 'processing';
                    $itemMeta['courier'] = $courier;
                    $itemMeta['tracking_number'] = 'TRK-' . strtoupper(Str::random(10));
                    $itemMeta['delivery_days'] = $deliveryDays;
                    $itemMeta['estimated_delivery'] = now()->addDays($deliveryDays)->format('d M Y');
                    $itemMeta['weight'] = $product->weight ?? $productMeta['weight'] ?? '0.5 kg';
                } elseif ($product && $product->type === 'digital') {
                    $itemMeta['is_downloadable'] = true;
                    $itemMeta['download_url'] = $productMeta['download_url'] ?? 'https://resell.infiniforge.cloud/downloads/asset-pkg.zip';
                    $itemMeta['file_size'] = $productMeta['file_size'] ?? '45 MB';
                    $itemMeta['file_version'] = $productMeta['file_version'] ?? 'v2.1.0';
                    $itemMeta['download_limit'] = (int) ($productMeta['download_limit'] ?? 10);
                    $itemMeta['downloads_used'] = 0;
                }

                $orderItems[] = [
                    'id' => (string) Str::uuid(),
                    'orderable_type' => $orderableType,
                    'orderable_id' => $orderableId,
                    'name' => $itemName,
                    'sku' => $itemSku,
                    'quantity' => $quantity,
                    'unit_price' => $customerPrice,
                    'cost_price_at_purchase' => $costPrice,
                    'reseller_price_at_purchase' => $resellerPrice,
                    'customer_price_at_purchase' => $customerPrice,
                    'final_price_at_purchase' => $itemSubtotal,
                    'currency' => $currency,
                    'metadata' => json_encode($itemMeta),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $paymentMethod = $data['payment_method'] ?? 'wallet';
            $idempotencyKey = $data['idempotency_key'] ?? ('order-' . Str::uuid());

            // If reseller/customer paying via wallet
            if ($paymentMethod === 'wallet' && $org) {
                $balance = $this->walletService->getBalance($org);
                if ($balance->spendable() < $totalResellerAmount) {
                    throw new InsufficientWalletBalanceException(
                        "Insufficient wallet balance. Required: ₹{$totalResellerAmount}, Available: ₹{$balance->spendable()}"
                    );
                }

                $this->walletService->debit(
                    $org,
                    $totalResellerAmount,
                    $idempotencyKey,
                    "Order payment for " . count($orderItems) . " item(s)"
                );
            }

            $targetCustomerId = !empty($data['customer_id']) ? $data['customer_id'] : $user->id;

            $order = Order::create([
                'organization_id' => $org?->id,
                'customer_id' => $targetCustomerId,
                'order_number' => 'ORD-' . strtoupper(Str::random(8)),
                'status' => 'completed',
                'payment_status' => 'paid',
                'payment_method' => $paymentMethod,
                'subtotal' => $totalCustomerAmount,
                'tax_total' => 0,
                'discount_total' => 0,
                'grand_total' => $totalCustomerAmount,
                'currency' => 'INR',
                'placed_at' => now(),
            ]);

            foreach ($orderItems as &$item) {
                $item['order_id'] = $order->id;
            }
            DB::table('order_items')->insert($orderItems);

            // Record profit distributions per item
            if ($org && !empty($orderItems)) {
                $profitRows = [];
                foreach ($orderItems as $item) {
                    $itemCost = $item['cost_price_at_purchase'] * $item['quantity'];
                    $itemReseller = $item['reseller_price_at_purchase'] * $item['quantity'];
                    $itemCustomer = $item['customer_price_at_purchase'] * $item['quantity'];
                    $platProfit = max(0, $itemReseller - $itemCost);
                    $resProfit = max(0, $itemCustomer - $itemReseller);
                    $margin = $itemReseller > 0 ? ($platProfit / $itemReseller) : 0;

                    $profitRows[] = [
                        'id' => (string) Str::uuid(),
                        'organization_id' => $org->id,
                        'order_item_id' => $item['id'],
                        'customer_id' => $user->id,
                        'currency' => $item['currency'] ?? 'INR',
                        'platform_revenue' => $itemReseller,
                        'platform_cost' => $itemCost,
                        'platform_gross_profit' => $platProfit,
                        'reseller_revenue' => $itemCustomer,
                        'reseller_profit' => $resProfit,
                        'total_revenue' => $itemCustomer,
                        'margin_pct' => $margin,
                        'recorded_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                DB::table('profit_records')->insert($profitRows);
            }

            // 1. Provision Subscriptions for any cloud/SaaS service items in the order
            $targetUser = User::find($targetCustomerId) ?? $user;
            $createdSubscriptionId = null;

            foreach ($orderItems as $oi) {
                if ($oi['orderable_type'] === \App\Models\Service::class) {
                    $srv = \App\Models\Service::with('plans')->find($oi['orderable_id']);
                    if ($srv) {
                        $plan = $srv->plans?->first();
                        $metaData = json_decode($oi['metadata'] ?? '{}', true) ?: [];
                        $interval = $metaData['billing_interval'] ?? 'monthly';
                        $startDate = now();
                        $endDate = $interval === 'yearly' ? now()->addYear() : now()->addMonth();

                        $srvMeta = is_array($srv->metadata) ? $srv->metadata : (json_decode($srv->metadata, true) ?: []);
                        $defaultAccessUrl = $srvMeta['access_url'] ?? $srvMeta['portal_url'] ?? $srvMeta['login_url'] ?? 'https://app.infiniforge.cloud';

                        $subMetadata = [
                            'service_id' => $srv->id,
                            'service_name' => $srv->name,
                            'plan_name' => $plan?->name ?? 'Standard',
                            'service_type' => 'single',
                            'access_url' => $defaultAccessUrl,
                            'portal_url' => $defaultAccessUrl,
                            'username' => $targetUser->email,
                            'password' => 'SrvPass@' . rand(1000, 9999),
                            'server_ip' => '172.67.' . rand(10, 250) . '.' . rand(1, 254),
                            'port' => '443 / 22 (SSH)',
                            'license_key' => strtoupper(Str::random(4) . '-' . Str::random(4) . '-' . Str::random(4) . '-' . Str::random(4)),
                            'instructions' => $srvMeta['instructions'] ?? 'Log in to your cloud dashboard or connect via SSH with provided credentials.',
                            'admin_notes' => 'Auto-provisioned via order ' . $order->order_number,
                            'client_notes' => $metaData['client_notes'] ?? '',
                            'sla_hours' => $metaData['sla_hours'] ?? 48,
                        ];

                        $sub = Subscription::create([
                            'organization_id' => $org?->id,
                            'customer_id' => $targetCustomerId,
                            'service_plan_id' => $plan?->id,
                            'order_id' => $order->id,
                            'status' => 'active',
                            'currency' => $order->currency ?? 'INR',
                            'amount' => $oi['unit_price'],
                            'cost_price_snapshot' => $oi['cost_price_at_purchase'],
                            'reseller_price_snapshot' => $oi['reseller_price_at_purchase'],
                            'customer_price_snapshot' => $oi['customer_price_at_purchase'],
                            'billing_interval' => $interval,
                            'billing_interval_count' => 1,
                            'auto_renew' => true,
                            'current_period_start' => $startDate,
                            'current_period_end' => $endDate,
                            'next_billing_at' => $endDate,
                            'activated_at' => now(),
                            'metadata' => $subMetadata,
                        ]);

                        $createdSubscriptionId = $sub->id;
                    }
                }
            }

            // 2. Generate Official Tax Invoice with line items
            $sellerName = $org?->name ?? 'InfiniForge SaaS Cloud Platform';
            $sellerEmail = $org?->support_email ?? 'billing@infiniforge.cloud';
            $invoiceNumber = 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(5));

            $invoice = Invoice::create([
                'invoice_number' => $invoiceNumber,
                'organization_id' => $org?->id,
                'customer_id' => $targetCustomerId,
                'order_id' => $order->id,
                'subscription_id' => $createdSubscriptionId,
                'type' => !empty($createdSubscriptionId) ? 'subscription' : 'order',
                'status' => 'paid',
                'currency' => $order->currency ?? 'INR',
                'subtotal' => $order->subtotal,
                'discount_total' => $order->discount_total ?? 0,
                'tax_total' => $order->tax_total ?? 0,
                'grand_total' => $order->grand_total,
                'amount_paid' => $order->grand_total,
                'amount_due' => 0,
                'billing_details' => [
                    'name' => $targetUser->name,
                    'email' => $targetUser->email,
                    'phone' => $targetUser->phone ?? '',
                    'company' => $targetUser->company ?? ($org?->name ?? 'Direct Customer'),
                    'address' => $data['billing_address'] ?? 'Primary Business Address',
                ],
                'seller_details' => [
                    'company' => $sellerName,
                    'email' => $sellerEmail,
                    'gstin' => '36AABCU9603R1ZM',
                    'address' => 'Cyber Gateway, HITEC City, Hyderabad, 500081, India',
                ],
                'issued_at' => now(),
                'due_at' => now(),
                'paid_at' => now(),
                'notes' => 'Tax invoice generated for order #' . $order->order_number,
            ]);

            foreach ($orderItems as $oi) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'description' => $oi['name'] . ($oi['quantity'] > 1 ? " (Qty: {$oi['quantity']})" : ""),
                    'quantity' => $oi['quantity'],
                    'unit_price' => $oi['unit_price'],
                    'discount' => 0,
                    'tax_rate' => 0,
                    'tax_amount' => 0,
                    'total' => $oi['final_price_at_purchase'],
                ]);
            }

            // 3. Record Audit Log Entry
            try {
                AuditLog::create([
                    'organization_id' => $org?->id,
                    'actor_id' => $user->id,
                    'action' => 'order.completed',
                    'resource_type' => Order::class,
                    'resource_id' => $order->id,
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'old_values' => null,
                    'new_values' => [
                        'order_number' => $order->order_number,
                        'invoice_number' => $invoiceNumber,
                        'grand_total' => $order->grand_total,
                        'customer_id' => $targetCustomerId,
                        'items_count' => count($orderItems),
                        'subscription_created' => !empty($createdSubscriptionId),
                    ],
                ]);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Failed recording audit log in OrderService: ' . $e->getMessage());
            }

            return $order->load('items');
        });
    }

    public function refundOrder(Order $order, string $reason = 'Order refunded by Admin'): Order
    {
        return DB::transaction(function () use ($order, $reason) {
            if ($order->status === 'refunded') {
                return $order;
            }

            $org = $order->organization;
            $orderItems = $order->items;
            $totalResellerAmount = 0;

            foreach ($orderItems as $item) {
                $totalResellerAmount += ($item->reseller_price_at_purchase * $item->quantity);
            }

            // Refund reseller wallet if paid via wallet
            if ($order->payment_method === 'wallet' && $org && $totalResellerAmount > 0) {
                $idempotencyKey = 'refund-order-' . $order->id;
                $this->walletService->credit(
                    $org,
                    $totalResellerAmount,
                    $idempotencyKey,
                    "Refund for Order {$order->order_number}: {$reason}"
                );
            }

            // Update order status
            $order->update([
                'status' => 'refunded',
                'payment_status' => 'refunded',
            ]);

            // Reverse profit records
            if ($org && count($orderItems) > 0) {
                $reversalRows = [];
                foreach ($orderItems as $item) {
                    $itemCost = $item->cost_price_at_purchase * $item->quantity;
                    $itemReseller = $item->reseller_price_at_purchase * $item->quantity;
                    $itemCustomer = $item->customer_price_at_purchase * $item->quantity;
                    $platProfit = max(0, $itemReseller - $itemCost);
                    $resProfit = max(0, $itemCustomer - $itemReseller);

                    $reversalRows[] = [
                        'id' => (string) Str::uuid(),
                        'organization_id' => $org->id,
                        'order_item_id' => $item->id,
                        'customer_id' => $order->customer_id,
                        'currency' => $item->currency ?? 'INR',
                        'platform_revenue' => -$itemReseller,
                        'platform_cost' => -$itemCost,
                        'platform_gross_profit' => -$platProfit,
                        'reseller_revenue' => -$itemCustomer,
                        'reseller_profit' => -$resProfit,
                        'total_revenue' => -$itemCustomer,
                        'margin_pct' => 0,
                        'recorded_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                DB::table('profit_records')->insert($reversalRows);
            }

            return $order->fresh(['items']);
        });
    }
}
