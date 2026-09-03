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

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'unique:saas_plans,slug'],
            'monthly_price' => ['required', 'numeric', 'min:0'],
            'yearly_price' => ['required', 'numeric', 'min:0'],
            'reseller_limit' => ['nullable', 'integer'],
            'customer_limit' => ['nullable', 'integer'],
            'products_limit' => ['nullable', 'integer'],
            'services_limit' => ['nullable', 'integer'],
            'wallet_limit' => ['nullable', 'numeric'],
            'trial_days' => ['nullable', 'integer', 'min:0'],
            'storage_mb' => ['nullable', 'integer', 'min:0'],
            'api_rate_limit' => ['nullable', 'integer', 'min:1'],
            'white_label_available' => ['nullable', 'boolean'],
            'features' => ['nullable'],
            'short_description' => ['nullable', 'string'],
        ]);

        $data = $request->all();
        if (isset($data['features']) && is_string($data['features'])) {
            $data['features'] = array_filter(array_map('trim', explode("\n", $data['features'])));
        }

        $plan = SaasPlan::create($data);

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
        $data = $request->all();

        if (isset($data['features']) && is_string($data['features'])) {
            $data['features'] = array_filter(array_map('trim', explode("\n", $data['features'])));
        }

        $plan->update($data);

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
