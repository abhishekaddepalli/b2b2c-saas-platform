<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServicePlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(Service::with(['plans', 'plans.prices', 'category'])->paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'unique:services,slug'],
            'plans' => ['required', 'array', 'min:1'],
            'plans.*.name' => ['required', 'string'],
            'plans.*.slug' => ['required', 'string'],
            'plans.*.cost_price' => ['required', 'numeric'],
            'plans.*.reseller_price' => ['required', 'numeric'],
            'plans.*.customer_price' => ['required', 'numeric'],
        ]);

        return DB::transaction(function () use ($request) {
            $service = Service::create([
                'name' => $request->name,
                'slug' => $request->slug,
                'category_id' => $request->category_id,
                'short_description' => $request->short_description,
                'status' => $request->status ?? 'active',
                'visibility' => $request->visibility ?? 'public',
            ]);

            foreach ($request->plans as $planData) {
                $plan = $service->plans()->create([
                    'name' => $planData['name'],
                    'slug' => $planData['slug'],
                    'billing_interval' => $planData['billing_interval'] ?? 'monthly',
                    'status' => $planData['status'] ?? 'active',
                ]);

                $plan->prices()->create([
                    'pricing_type' => 'fixed',
                    'cost_price' => $planData['cost_price'],
                    'reseller_price' => $planData['reseller_price'],
                    'customer_price' => $planData['customer_price'],
                    'currency' => 'INR',
                    'is_active' => true,
                ]);
            }

            return response()->json([
                'message' => 'Service created successfully.',
                'data' => $service->load('plans'),
            ], 201);
        });
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => Service::with(['plans', 'plans.prices', 'category'])->findOrFail($id)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $service = Service::findOrFail($id);
        $service->update($request->only('name', 'short_description', 'visibility', 'status', 'category_id'));

        return response()->json(['message' => 'Service updated.', 'data' => $service->load('plans')]);
    }

    public function destroy(string $id): JsonResponse
    {
        $service = Service::findOrFail($id);
        $service->delete();

        return response()->json(['message' => 'Service deleted.']);
    }
}
