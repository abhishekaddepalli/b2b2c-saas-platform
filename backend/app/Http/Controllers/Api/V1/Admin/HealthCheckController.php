<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\System\HealthCheckService;
use Illuminate\Http\JsonResponse;

class HealthCheckController extends Controller
{
    public function __construct(private readonly HealthCheckService $healthCheckService) {}

    /**
     * Public Application Health Endpoint probe for load balancers & monitoring.
     */
    public function health(): JsonResponse
    {
        $health = $this->healthCheckService->checkAll();
        $code = $health['status'] === 'critical' ? 503 : 200;

        return response()->json($health, $code);
    }

    /**
     * Admin System Health Dashboard Detailed Metrics.
     */
    public function detailedHealth(): JsonResponse
    {
        $health = $this->healthCheckService->checkAll();
        return response()->json(['data' => $health]);
    }
}
