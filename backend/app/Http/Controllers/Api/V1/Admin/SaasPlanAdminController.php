<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\SaasPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaasPlanAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $plans = SaasPlan::orderBy('sort_order')->paginate($request->per_page ?? 20);
        return response()->json($plans);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'unique:saas_plans,slug'],
            'monthly_price' => ['required', 'numeric', 'min:0'],
            'yearly_price' => ['required', 'numeric', 'min:0'],
            'reseller_limit' => ['required', 'integer'],
            'customer_limit' => ['required', 'integer'],
            'products_limit' => ['required', 'integer'],
            'services_limit' => ['required', 'integer'],
            'wallet_limit' => ['required', 'numeric'],
            'trial_days' => ['required', 'integer', 'min:0'],
            'storage_mb' => ['required', 'integer', 'min:0'],
            'api_rate_limit' => ['required', 'integer', 'min:1'],
            'white_label_available' => ['required', 'boolean'],
        ]);

        $plan = SaasPlan::create($request->all());

        return response()->json([
            'message' => 'SaaS monetization plan created.',
            'data' => $plan,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $plan = SaasPlan::findOrFail($id);
        return response()->json(['data' => $plan]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $plan = SaasPlan::findOrFail($id);

        $plan->update($request->all());

        return response()->json([
            'message' => 'SaaS plan updated successfully.',
            'data' => $plan,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $plan = SaasPlan::findOrFail($id);
        $plan->delete();

        return response()->json(['message' => 'SaaS plan deleted.']);
    }
}
