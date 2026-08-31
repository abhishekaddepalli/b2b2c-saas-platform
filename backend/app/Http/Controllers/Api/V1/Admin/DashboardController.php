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
        $stats = Cache::remember('admin.dashboard.stats', 60, function () {
            return [
                'organizations' => Organization::where('type', 'reseller')->count(),
                'total_users' => User::count(),
                'customers' => User::role('USER')->count(),
                'resellers' => User::role('RESELLER')->count(),
                'orders' => [
                    'total' => Order::query()->count(),
                    'today' => Order::query()->whereDate('placed_at', today())->count(),
                    'pending' => Order::query()->where('status', 'pending')->count(),
                    'this_month' => Order::query()->whereMonth('placed_at', now()->month)->count(),
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
        });

        return response()->json(['data' => $stats]);
    }

    private function revenueStats(): array
    {
        $row = DB::table('profit_records')
            ->selectRaw('
                COALESCE(SUM(total_revenue), 0) as total_revenue,
                COALESCE(SUM(platform_gross_profit), 0) as platform_profit,
                COALESCE(SUM(reseller_profit), 0) as reseller_profit,
                COALESCE(SUM(CASE WHEN DATE(recorded_at) = CURRENT_DATE THEN total_revenue ELSE 0 END), 0) as today_revenue,
                COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM recorded_at) = EXTRACT(MONTH FROM NOW()) THEN total_revenue ELSE 0 END), 0) as month_revenue
            ')
            ->first();

        return [
            'total_revenue' => (float) ($row->total_revenue ?? 0),
            'platform_profit' => (float) ($row->platform_profit ?? 0),
            'reseller_profit' => (float) ($row->reseller_profit ?? 0),
            'today_revenue' => (float) ($row->today_revenue ?? 0),
            'month_revenue' => (float) ($row->month_revenue ?? 0),
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

        return response()->json(['data' => $data]);
    }
}
