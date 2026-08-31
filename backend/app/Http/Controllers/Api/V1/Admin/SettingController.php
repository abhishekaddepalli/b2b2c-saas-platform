<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'platform_name' => 'SaaS Platform',
                'currency' => 'INR',
                'support_email' => 'support@saasplatform.com',
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Settings updated successfully.']);
    }
}
