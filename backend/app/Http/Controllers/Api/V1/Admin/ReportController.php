<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Organization;
use App\Models\Product;
use App\Models\ProfitRecord;
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
        $startDate = $request->start_date ? now()->parse($request->start_date)->startOfDay() : null;
        $endDate = $request->end_date ? now()->parse($request->end_date)->endOfDay() : null;

        $ordersQuery = Order::where('payment_status', 'paid');
        $profitQuery = ProfitRecord::query();
        $refundQuery = Order::where('status', 'refunded');

        if ($startDate && $endDate) {
            $ordersQuery->whereBetween('created_at', [$startDate, $endDate]);
            $profitQuery->whereBetween('recorded_at', [$startDate, $endDate]);
            $refundQuery->whereBetween('updated_at', [$startDate, $endDate]);
        }

        $grossRevenue = (float) $ordersQuery->sum('grand_total');
        $refunds = (float) $refundQuery->sum('grand_total');
        $netRevenue = max(0, $grossRevenue - $refunds);

        $platformCost = (float) $profitQuery->sum('platform_cost');
        $platformProfit = (float) $profitQuery->sum('platform_gross_profit');
        $resellerProfit = (float) $profitQuery->sum('reseller_profit');

        $taxes = (float) $ordersQuery->sum('tax_total');
        $gatewayFees = round($grossRevenue * 0.02, 2); // 2% gateway processing estimate

        $walletLiabilities = (float) Wallet::sum('available_balance');
        $outstandingCredit = (float) Organization::where('type', 'reseller')->sum('credit_limit');

        $activeSubs = Subscription::where('status', 'active')->get();
        $mrr = 0.0;
        foreach ($activeSubs as $sub) {
            $amt = (float) ($sub->reseller_price_snapshot ?? $sub->amount ?? 0);
            $mrr += match ($sub->billing_interval) {
                'yearly' => $amt / 12,
                'quarterly' => $amt / 3,
                default => $amt,
            };
        }

        // Daily trend
        $daily = DB::table('profit_records')
            ->select(
                DB::raw('DATE(recorded_at) as date'),
                DB::raw('SUM(total_revenue) as revenue'),
                DB::raw('SUM(platform_cost) as cost'),
                DB::raw('SUM(platform_gross_profit) as platform_profit'),
                DB::raw('SUM(reseller_profit) as reseller_profit')
            )
            ->when($startDate && $endDate, fn($q) => $q->whereBetween('recorded_at', [$startDate, $endDate]))
            ->when(!$startDate, fn($q) => $q->where('recorded_at', '>=', now()->subDays(30)))
            ->groupBy(DB::raw('DATE(recorded_at)'))
            ->orderBy('date', 'asc')
            ->get();

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
            ->withCount(['users as customer_count' => function ($q) {
                $q->where('role_within_org', 'customer');
            }])
            ->with('wallet')
            ->get()
            ->map(function ($org) {
                $totalSales = (float) Order::where('organization_id', $org->id)
                    ->where('payment_status', 'paid')
                    ->sum('grand_total');
                $totalProfit = (float) ProfitRecord::where('organization_id', $org->id)->sum('reseller_profit');

                return [
                    'id' => $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'status' => $org->status,
                    'customer_count' => $org->customer_count,
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

    /**
     * Product & Service Profitability Breakdown.
     */
    public function profitability(): JsonResponse
    {
        $products = Product::where('status', 'active')->get()->map(function ($p) {
            $revenue = (float) ProfitRecord::where('product_id', $p->id)->sum('total_revenue');
            $cost = (float) ProfitRecord::where('product_id', $p->id)->sum('platform_cost');
            $profit = (float) ProfitRecord::where('product_id', $p->id)->sum('platform_gross_profit');

            return [
                'id' => $p->id,
                'name' => $p->name,
                'type' => 'product',
                'revenue' => $revenue,
                'cost' => $cost,
                'profit' => $profit,
            ];
        });

        return response()->json(['data' => $products]);
    }

    /**
     * Export Financial Reconciliation Ledger as CSV.
     */
    public function exportCsv(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="financial_report_' . date('Y-m-d') . '.csv"',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Order ID', 'Organization', 'Customer ID', 'Grand Total', 'Cost Total', 'Platform Profit', 'Reseller Profit', 'Payment Status', 'Created At']);

            Order::where('payment_status', 'paid')
                ->with('organization')
                ->chunk(100, function ($orders) use ($file) {
                    foreach ($orders as $o) {
                        fputcsv($file, [
                            $o->order_number,
                            $o->organization?->name ?? 'N/A',
                            $o->customer_id,
                            $o->grand_total,
                            $o->cost_total,
                            $o->platform_profit,
                            $o->reseller_profit,
                            $o->payment_status,
                            $o->created_at->toDateTimeString(),
                        ]);
                    }
                });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
