<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServicePlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Service::with(['plans.prices', 'category:id,name,slug']);

        if ($request->filled('search')) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', $s)
                  ->orWhere('slug', 'like', $s)
                  ->orWhere('short_description', 'like', $s);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('billing_type')) {
            $query->where('billing_type', $request->billing_type);
        }

        $services = $query->latest('created_at')->paginate($request->per_page ?? 25);

        return response()->json($services);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:services,slug'],
            'short_description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:active,draft,archived'],
            'visibility' => ['nullable', 'in:public,reseller_only,hidden'],
            'billing_interval' => ['nullable', 'string'],
        ]);

        $slug = $request->filled('slug')
            ? Str::slug($request->slug)
            : Str::slug($request->name) . '-' . Str::random(4);

        return DB::transaction(function () use ($request, $slug) {
            $service = Service::create([
                'name' => $request->name,
                'slug' => $slug,
                'category_id' => $request->category_id,
                'short_description' => $request->short_description,
                'full_description' => $request->full_description,
                'status' => $request->status ?? 'active',
                'visibility' => $request->visibility ?? 'public',
                'billing_type' => ($request->billing_interval === 'one_time' || $request->billing_type === 'one_time') ? 'one_time' : 'recurring',
                'billing_interval' => in_array($request->billing_interval, ['monthly', 'quarterly', 'half_yearly', 'yearly', 'custom']) ? $request->billing_interval : 'monthly',
                'trial_days' => (int)($request->trial_days ?? 0),
                'featured' => $request->boolean('featured', false),
            ]);

            // Handle multi-plan array or default plan
            if ($request->has('plans') && is_array($request->plans) && count($request->plans) > 0) {
                foreach ($request->plans as $planData) {
                    $plan = $service->plans()->create([
                        'name' => $planData['name'],
                        'slug' => Str::slug($planData['name']) . '-' . Str::random(3),
                        'status' => $planData['status'] ?? 'active',
                        'is_popular' => !empty($planData['is_popular']),
                    ]);

                    $plan->prices()->create([
                        'pricing_type' => 'fixed',
                        'cost_price' => (float)($planData['cost_price'] ?? 0),
                        'reseller_price' => (float)($planData['reseller_price'] ?? 0),
                        'customer_price' => (float)($planData['customer_price'] ?? 0),
                        'currency' => 'INR',
                        'is_active' => true,
                    ]);
                }
            } else {
                // Default Base Plan
                $planName = $request->plan_name ?: 'Standard Plan';
                $plan = $service->plans()->create([
                    'name' => $planName,
                    'slug' => Str::slug($planName) . '-' . Str::random(3),
                    'status' => 'active',
                    'is_popular' => true,
                ]);

                $plan->prices()->create([
                    'pricing_type' => 'fixed',
                    'cost_price' => (float)($request->cost_price ?? 0),
                    'reseller_price' => (float)($request->reseller_price ?? 0),
                    'customer_price' => (float)($request->customer_price ?? 0),
                    'currency' => 'INR',
                    'is_active' => true,
                ]);
            }

            return response()->json([
                'message' => 'Service and recurring pricing plan created successfully.',
                'data' => $service->load(['plans.prices']),
            ], 201);
        });
    }

    public function show(string $id): JsonResponse
    {
        $service = Service::with(['plans.prices', 'category'])->findOrFail($id);
        return response()->json(['data' => $service]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $service = Service::findOrFail($id);

        $data = $request->only([
            'name', 'short_description', 'full_description', 'visibility',
            'status', 'category_id', 'billing_type', 'billing_interval', 'featured'
        ]);

        if ($request->filled('slug')) {
            $data['slug'] = Str::slug($request->slug);
        }

        $service->update($data);

        // Update default plan price if provided
        if ($request->has(['cost_price', 'reseller_price', 'customer_price'])) {
            $plan = $service->plans()->first();
            if (!$plan) {
                $plan = $service->plans()->create([
                    'name' => 'Standard Plan',
                    'slug' => 'standard-' . Str::random(3),
                    'status' => 'active',
                ]);
            }

            $plan->prices()->updateOrCreate(
                ['pricing_type' => 'fixed'],
                [
                    'cost_price' => (float)$request->cost_price,
                    'reseller_price' => (float)$request->reseller_price,
                    'customer_price' => (float)$request->customer_price,
                    'currency' => 'INR',
                    'is_active' => true,
                ]
            );
        }

        return response()->json([
            'message' => 'Service updated successfully.',
            'data' => $service->load(['plans.prices']),
        ]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $service = Service::findOrFail($id);
        $service->update(['status' => $request->status ?? 'active']);

        return response()->json(['message' => 'Service status updated.', 'data' => $service]);
    }

    public function destroy(string $id): JsonResponse
    {
        $service = Service::findOrFail($id);
        $service->delete();

        return response()->json(['message' => 'Service deleted successfully.']);
    }
}
