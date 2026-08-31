<?php

namespace App\Services\Order;

use App\Exceptions\InsufficientWalletBalanceException;
use App\Models\Order;
use App\Models\Product;
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
                $product = Product::findOrFail($item['product_id']);
                $quantity = max(1, (int) ($item['quantity'] ?? 1));

                $pricingResult = $this->pricingService->resolve($product, $user);

                $costPrice = $pricingResult->costPrice ?? 0;
                $resellerPrice = $pricingResult->resellerPrice ?? 0;
                $customerPrice = $pricingResult->customerPrice ?? 0;

                $itemSubtotal = $customerPrice * $quantity;

                $totalCostAmount += ($costPrice * $quantity);
                $totalResellerAmount += ($resellerPrice * $quantity);
                $totalCustomerAmount += $itemSubtotal;

                $orderItems[] = [
                    'id' => (string) Str::uuid(),
                    'orderable_type' => Product::class,
                    'orderable_id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => $quantity,
                    'unit_price' => $customerPrice,
                    'cost_price_at_purchase' => $costPrice,
                    'reseller_price_at_purchase' => $resellerPrice,
                    'customer_price_at_purchase' => $customerPrice,
                    'final_price_at_purchase' => $itemSubtotal,
                    'currency' => $product->currency ?? 'INR',
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
