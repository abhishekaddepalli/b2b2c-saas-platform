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

        $data = [
            'wallet_balance' => (float) ($wallet?->available_balance ?? 0),
            'currency' => $wallet?->currency ?? 'INR',
            'customers_count' => $org ? $org->users()->wherePivot('role_within_org', 'customer')->count() : 0,
            'orders_count' => Order::where('organization_id', $orgId)->count(),
            'active_subscriptions' => Subscription::where('organization_id', $orgId)->where('status', 'active')->count(),
            'monthly_profit' => DB::table('profit_records')
                ->where('organization_id', $orgId)
                ->whereMonth('recorded_at', now()->month)
                ->sum('reseller_profit'),
        ];

        return response()->json(['data' => $data]);
    }
}
