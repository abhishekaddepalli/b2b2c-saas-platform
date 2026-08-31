<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfitController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(DB::table('profit_records')->latest('recorded_at')->paginate($request->per_page ?? 20));
    }

    public function summary(): JsonResponse
    {
        $data = DB::table('profit_records')
            ->selectRaw('SUM(total_revenue) as total_revenue, SUM(platform_gross_profit) as platform_profit, SUM(reseller_profit) as reseller_profit')
            ->first();

        return response()->json(['data' => $data]);
    }
}
