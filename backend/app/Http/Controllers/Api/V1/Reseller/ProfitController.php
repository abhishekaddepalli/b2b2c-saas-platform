<?php

namespace App\Http\Controllers\Api\V1\Reseller;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfitController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->getOrganization()?->id;

        $profits = DB::table('profit_records')
            ->where('organization_id', $orgId)
            ->paginate($request->per_page ?? 20);

        return response()->json($profits);
    }

    public function chart(Request $request): JsonResponse
    {
        $orgId = $request->user()->getOrganization()?->id;

        $data = DB::table('profit_records')
            ->selectRaw("DATE(recorded_at) as date, SUM(reseller_profit) as profit, SUM(total_revenue) as revenue")
            ->where('organization_id', $orgId)
            ->where('recorded_at', '>=', now()->subDays(30))
            ->groupByRaw('DATE(recorded_at)')
            ->orderBy('date')
            ->get();

        return response()->json(['data' => $data]);
    }
}
