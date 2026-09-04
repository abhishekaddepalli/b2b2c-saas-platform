<?php

namespace App\Http\Controllers\Api\V1\Reseller;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Subscription;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $org = $request->user()->getOrganization();
        $orgId = $org?->id;

        $wallet = $org ? Wallet::where('organization_id', $orgId)->first() : null;

        $customersCount = 0;
        if ($org) {
            $customersCount = \App\Models\User::query()
                ->where(function ($q) use ($org) {
                    $q->where('current_organization_id', $org->id)
                      ->orWhereHas('organizations', function ($sub) use ($org) {
                          $sub->where('organizations.id', $org->id)
                              ->whereIn('organization_users.role_within_org', ['customer', 'member', 'client', 'user']);
                      })
                      ->orWhereHas('orders', function ($sub) use ($org) {
                          $sub->where('organization_id', $org->id);
                      })
                      ->orWhereHas('subscriptions', function ($sub) use ($org) {
                          $sub->where('organization_id', $org->id);
                      });
                })
                ->whereDoesntHave('roles', function ($r) {
                    $r->whereIn('name', ['SUPER_ADMIN', 'RESELLER']);
                })
                ->count();
        }

        $monthRevenue = (float) Order::where('organization_id', $orgId)
            ->where('payment_status', 'paid')
            ->whereMonth('placed_at', now()->month)
            ->whereYear('placed_at', now()->year)
            ->sum('grand_total');

        $monthProfit = (float) DB::table('profit_records')
            ->where('organization_id', $orgId)
            ->whereMonth('recorded_at', now()->month)
            ->whereYear('recorded_at', now()->year)
            ->sum('reseller_profit');

        if ($monthProfit <= 0 && $monthRevenue > 0) {
            $monthProfit = round($monthRevenue * 0.15, 2);
        }

        $data = [
            'wallet_balance' => (float) ($wallet?->available_balance ?? 0),
            'currency' => $wallet?->currency ?? 'INR',
            'total_customers' => $customersCount,
            'customers_count' => $customersCount,
            'orders_count' => Order::where('organization_id', $orgId)->count(),
            'active_subscriptions' => Subscription::where('organization_id', $orgId)->where('status', 'active')->count(),
            'month_revenue' => $monthRevenue,
            'month_profit' => $monthProfit,
            'monthly_profit' => $monthProfit,
        ];

        return response()->json(['data' => $data]);
    }
}
