<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Organization;
use App\Models\Product;
use App\Models\Service;
use App\Models\Subscription;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function revenue(Request $request): JsonResponse
    {
        $ordersQuery = Order::query();

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $ordersQuery->whereBetween('created_at', [
                now()->parse($request->start_date)->startOfDay(),
                now()->parse($request->end_date)->endOfDay()
            ]);
        }

        $paidOrders = (clone $ordersQuery)->where('payment_status', 'paid');
        $refundOrders = (clone $ordersQuery)->where('status', 'refunded');

        $grossRevenue = (float) $paidOrders->sum('grand_total');
        $refunds = (float) $refundOrders->sum('grand_total');
        $netRevenue = max(0, $grossRevenue - $refunds);

        $taxes = (float) $paidOrders->sum('tax_total');
        $gatewayFees = round($grossRevenue * 0.02, 2);

        // Calculate platform and reseller profit margins
        $platformProfit = round($netRevenue * 0.35, 2); // 35% average gross platform markup
        $resellerProfit = round($netRevenue * 0.20, 2); // 20% average reseller margin
        $platformCost = max(0, $netRevenue - $platformProfit - $resellerProfit);

        $walletLiabilities = (float) Wallet::sum('available_balance');
        $outstandingCredit = (float) Organization::where('type', 'reseller')->sum('credit_limit');

        $activeSubs = Subscription::where('status', 'active')->get();
        $mrr = 0.0;
        foreach ($activeSubs as $sub) {
            $amt = (float) ($sub->amount ?? $sub->recurring_amount ?? 0);
            $mrr += match ($sub->billing_interval) {
                'yearly' => $amt / 12,
                'quarterly' => $amt / 3,
                default => $amt,
            };
        }

        // Daily trend grouped from orders table
        $daily = Order::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(grand_total) as revenue'),
                DB::raw('COUNT(id) as order_count')
            )
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'asc')
            ->get()
            ->map(function ($row) {
                $rev = (float)$row->revenue;
                return [
                    'date' => $row->date,
                    'revenue' => $rev,
                    'cost' => round($rev * 0.45, 2),
                    'platform_profit' => round($rev * 0.35, 2),
                    'reseller_profit' => round($rev * 0.20, 2),
                ];
            });

        return response()->json([
            'data' => [
                'gross_revenue' => $grossRevenue,
                'net_revenue' => $netRevenue,
                'platform_cost' => $platformCost,
                'platform_profit' => $platformProfit,
                'reseller_commissions' => $resellerProfit,
                'refunds' => $refunds,
                'taxes' => $taxes,
                'gateway_fees' => $gatewayFees,
                'wallet_liabilities' => $walletLiabilities,
                'outstanding_credit' => $outstandingCredit,
                'mrr' => round($mrr, 2),
                'arr' => round($mrr * 12, 2),
                'daily_breakdown' => $daily,
            ]
        ]);
    }

    public function resellers(Request $request): JsonResponse
    {
        $resellers = Organization::where('type', 'reseller')
            ->with('wallet')
            ->withCount('users')
            ->get()
            ->map(function ($org) {
                $totalSales = (float) Order::where('organization_id', $org->id)
                    ->where('payment_status', 'paid')
                    ->sum('grand_total');

                $marginPct = $org->metadata['margin_percentage'] ?? 15.0;
                $totalProfit = round($totalSales * ($marginPct / 100), 2);

                return [
                    'id' => $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'status' => $org->status,
                    'customer_count' => $org->users_count ?? 0,
                    'wallet_balance' => (float) ($org->wallet?->available_balance ?? 0),
                    'total_sales' => $totalSales,
                    'total_profit' => $totalProfit,
                ];
            });

        return response()->json(['data' => $resellers]);
    }

    public function subscriptions(Request $request): JsonResponse
    {
        $counts = [
            'active' => Subscription::where('status', 'active')->count(),
            'trial' => Subscription::where('status', 'trial')->count(),
            'grace_period' => Subscription::where('status', 'grace_period')->count(),
            'suspended' => Subscription::where('status', 'suspended')->count(),
            'cancelled' => Subscription::where('status', 'cancelled')->count(),
        ];

        $byInterval = Subscription::select('billing_interval', DB::raw('count(*) as count'))
            ->groupBy('billing_interval')
            ->pluck('count', 'billing_interval');

        return response()->json([
            'data' => [
                'counts' => $counts,
                'by_interval' => $byInterval,
            ]
        ]);
    }

    public function profitability(): JsonResponse
    {
        $products = Product::where('status', 'active')->get()->map(function ($p) {
            $price = $p->prices()->first();
            $cost = (float)($price?->cost_price ?? 0);
            $reseller = (float)($price?->reseller_price ?? 0);
            $customer = (float)($price?->customer_price ?? 0);

            return [
                'id' => $p->id,
                'name' => $p->name,
                'type' => 'product',
                'cost' => $cost,
                'reseller_price' => $reseller,
                'retail_price' => $customer,
                'platform_margin' => max(0, $reseller - $cost),
                'reseller_margin' => max(0, $customer - $reseller),
            ];
        });

        return response()->json(['data' => $products]);
    }

    public function exportCsv(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="financial_report_' . date('Y-m-d') . '.csv"',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Order ID', 'Organization', 'Customer', 'Grand Total', 'Payment Method', 'Payment Status', 'Created At']);

            Order::with('organization', 'customer')
                ->chunk(100, function ($orders) use ($file) {
                    foreach ($orders as $o) {
                        fputcsv($file, [
                            $o->order_number,
                            $o->organization?->name ?? 'Platform HQ',
                            $o->customer?->email ?? 'N/A',
                            $o->grand_total,
                            $o->payment_method,
                            $o->payment_status,
                            $o->created_at->toDateTimeString(),
                        ]);
                    }
                });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function productPerformance(Request $request): JsonResponse
    {
        $startDate = $request->filled('start_date') ? now()->parse($request->start_date)->startOfDay() : now()->subDays(30)->startOfDay();
        $endDate = $request->filled('end_date') ? now()->parse($request->end_date)->endOfDay() : now()->endOfDay();

        $items = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->where('orders.status', '!=', 'cancelled')
            ->select(
                'order_items.name',
                'order_items.orderable_type',
                'order_items.quantity',
                'order_items.final_price_at_purchase',
                'order_items.cost_price_at_purchase',
                'order_items.metadata'
            )
            ->get();

        $totalRevenue = 0;
        $totalUnits = 0;
        $typeBreakdown = [
            'software' => ['revenue' => 0, 'units' => 0, 'label' => 'Software Licenses'],
            'physical' => ['revenue' => 0, 'units' => 0, 'label' => 'Physical Products'],
            'digital' => ['revenue' => 0, 'units' => 0, 'label' => 'Digital Assets'],
            'service' => ['revenue' => 0, 'units' => 0, 'label' => 'Cloud Services'],
        ];

        $productSales = [];

        foreach ($items as $it) {
            $rev = (float) $it->final_price_at_purchase;
            $qty = (int) $it->quantity;
            $totalRevenue += $rev;
            $totalUnits += $qty;

            $meta = json_decode($it->metadata ?? '{}', true) ?: [];
            $type = $meta['product_type'] ?? (str_contains($it->orderable_type, 'Service') ? 'service' : 'software');
            if (!isset($typeBreakdown[$type])) {
                $type = 'software';
            }

            $typeBreakdown[$type]['revenue'] += $rev;
            $typeBreakdown[$type]['units'] += $qty;

            if (!isset($productSales[$it->name])) {
                $productSales[$it->name] = [
                    'name' => $it->name,
                    'type' => $type,
                    'units' => 0,
                    'revenue' => 0,
                ];
            }
            $productSales[$it->name]['units'] += $qty;
            $productSales[$it->name]['revenue'] += $rev;
        }

        // Sort top products
        usort($productSales, fn($a, $b) => $b['revenue'] <=> $a['revenue']);
        $topProducts = array_slice($productSales, 0, 5);

        return response()->json([
            'data' => [
                'total_revenue' => $totalRevenue,
                'total_units' => $totalUnits,
                'type_breakdown' => $typeBreakdown,
                'top_products' => $topProducts,
            ]
        ]);
    }

    public function orderAnalytics(Request $request): JsonResponse
    {
        $statusCounts = Order::select('status', DB::raw('count(*) as count'), DB::raw('sum(grand_total) as revenue'))
            ->groupBy('status')
            ->get()
            ->keyBy('status')
            ->toArray();

        $totalOrders = Order::count();
        $totalGross = (float) Order::where('status', '!=', 'cancelled')->sum('grand_total');
        $avgOrderValue = $totalOrders > 0 ? round($totalGross / $totalOrders, 2) : 0;
        $completedCount = ($statusCounts['completed']['count'] ?? 0) + ($statusCounts['paid']['count'] ?? 0);
        $fulfillmentRate = $totalOrders > 0 ? round(($completedCount / $totalOrders) * 100, 1) : 100;

        return response()->json([
            'data' => [
                'total_orders' => $totalOrders,
                'total_revenue' => $totalGross,
                'average_order_value' => $avgOrderValue,
                'fulfillment_rate' => $fulfillmentRate,
                'status_breakdown' => [
                    'completed' => $statusCounts['completed']['count'] ?? 0,
                    'paid' => $statusCounts['paid']['count'] ?? 0,
                    'processing' => $statusCounts['processing']['count'] ?? 0,
                    'pending' => $statusCounts['pending']['count'] ?? 0,
                    'cancelled' => $statusCounts['cancelled']['count'] ?? 0,
                    'refunded' => $statusCounts['refunded']['count'] ?? 0,
                ]
            ]
        ]);
    }
}
