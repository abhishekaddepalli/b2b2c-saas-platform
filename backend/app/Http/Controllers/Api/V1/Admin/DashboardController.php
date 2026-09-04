<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Organization;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $stats = [
            'organizations' => Organization::where('type', 'reseller')->count(),
            'total_users' => User::count(),
            'customers' => User::whereDoesntHave('roles', fn($r) => $r->whereIn('name', ['SUPER_ADMIN', 'RESELLER']))->count(),
            'resellers' => User::role('RESELLER')->count() ?: Organization::where('type', 'reseller')->count(),
            'orders' => [
                'total' => Order::query()->count(),
                'today' => Order::query()->whereDate('placed_at', today())->count(),
                'pending' => Order::query()->where('status', 'pending')->count(),
                'this_month' => Order::query()->whereMonth('placed_at', now()->month)->whereYear('placed_at', now()->year)->count(),
            ],
            'subscriptions' => [
                'active' => Subscription::query()->where('status', 'active')->count(),
                'trial' => Subscription::query()->where('status', 'trial')->count(),
                'grace_period' => Subscription::query()->where('status', 'grace_period')->count(),
                'suspended' => Subscription::query()->where('status', 'suspended')->count(),
            ],
            'revenue' => $this->revenueStats(),
            'attention_required' => $this->attentionRequired(),
        ];

        return response()->json(['data' => $stats]);
    }

    private function revenueStats(): array
    {
        $totalRevenue = (float) DB::table('profit_records')->sum('total_revenue');
        $platformProfit = (float) DB::table('profit_records')->sum('platform_gross_profit');
        $resellerProfit = (float) DB::table('profit_records')->sum('reseller_profit');
        $todayRevenue = (float) DB::table('profit_records')->whereDate('recorded_at', today())->sum('total_revenue');
        $monthRevenue = (float) DB::table('profit_records')
            ->whereMonth('recorded_at', now()->month)
            ->whereYear('recorded_at', now()->year)
            ->sum('total_revenue');

        // Fallback to paid orders if profit_records has not yet populated
        if ($totalRevenue <= 0) {
            $totalRevenue = (float) Order::where('payment_status', 'paid')->sum('grand_total');
            $monthRevenue = (float) Order::where('payment_status', 'paid')
                ->whereMonth('placed_at', now()->month)
                ->whereYear('placed_at', now()->year)
                ->sum('grand_total');
            $todayRevenue = (float) Order::where('payment_status', 'paid')
                ->whereDate('placed_at', today())
                ->sum('grand_total');
            $platformProfit = round($totalRevenue * 0.25, 2);
            $resellerProfit = round($totalRevenue * 0.15, 2);
        }

        return [
            'total_revenue' => $totalRevenue,
            'platform_profit' => $platformProfit,
            'reseller_profit' => $resellerProfit,
            'today_revenue' => $todayRevenue,
            'month_revenue' => $monthRevenue,
        ];
    }

    private function attentionRequired(): array
    {
        return [
            'failed_payments' => Order::query()
                ->where('payment_status', 'failed')
                ->where('status', '!=', 'cancelled')
                ->count(),
            'payment_failed_subs' => Subscription::query()
                ->where('status', 'payment_failed')
                ->count(),
            'expiring_subscriptions' => Subscription::query()
                ->where('status', 'active')
                ->whereBetween('current_period_end', [now(), now()->addDays(7)])
                ->count(),
            'suspended_subscriptions' => Subscription::query()
                ->where('status', 'suspended')
                ->count(),
            'low_wallet_orgs' => Wallet::whereRaw('available_balance < 500')->count(),
            'pending_orgs' => Organization::where('status', 'pending')->count(),
        ];
    }

    public function revenueChart(): JsonResponse
    {
        $data = DB::table('profit_records')
            ->selectRaw("DATE(recorded_at) as date, SUM(total_revenue) as revenue, SUM(platform_gross_profit) as profit")
            ->where('recorded_at', '>=', now()->subDays(30))
            ->groupByRaw('DATE(recorded_at)')
            ->orderBy('date')
            ->get();

        if ($data->isEmpty()) {
            $data = Order::where('payment_status', 'paid')
                ->where('placed_at', '>=', now()->subDays(30))
                ->selectRaw("DATE(placed_at) as date, SUM(grand_total) as revenue, ROUND(SUM(grand_total) * 0.25, 2) as profit")
                ->groupByRaw('DATE(placed_at)')
                ->orderBy('date')
                ->get();
        }

        return response()->json(['data' => $data]);
    }
}
