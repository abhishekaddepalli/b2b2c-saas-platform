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
        $this->ensureDefaultPlans();

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
            $data['features'] = array_values(array_filter(array_map('trim', explode("\n", $data['features']))));
        }

        $plan = SaasPlan::create($data);

        return response()->json([
            'message' => 'SaaS monetization plan created successfully.',
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
            $data['features'] = array_values(array_filter(array_map('trim', explode("\n", $data['features']))));
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

    private function ensureDefaultPlans(): void
    {
        if (SaasPlan::count() > 0) {
            return;
        }

        $defaults = [
            [
                'name' => 'Starter Plan',
                'slug' => 'starter',
                'short_description' => 'For emerging B2B agencies and individual resellers.',
                'monthly_price' => 999,
                'yearly_price' => 9990,
                'currency' => 'INR',
                'reseller_limit' => 3,
                'customer_limit' => 100,
                'products_limit' => 200,
                'services_limit' => 50,
                'wallet_limit' => 100000,
                'trial_days' => 14,
                'storage_mb' => 2048,
                'api_rate_limit' => 60,
                'white_label_available' => false,
                'features' => [
                    'Up to 100 Customers',
                    '200 Product Catalog Items',
                    'Automated Prepaid Wallet Billing',
                    'Standard Support Desk',
                ],
                'status' => 'active',
                'sort_order' => 1,
            ],
            [
                'name' => 'Business Pro',
                'slug' => 'business',
                'short_description' => 'Designed for scale-ups needing white-label branding.',
                'monthly_price' => 2999,
                'yearly_price' => 29990,
                'currency' => 'INR',
                'reseller_limit' => 10,
                'customer_limit' => 1000,
                'products_limit' => 1000,
                'services_limit' => 200,
                'wallet_limit' => 1000000,
                'trial_days' => 14,
                'storage_mb' => 10240,
                'api_rate_limit' => 120,
                'white_label_available' => true,
                'features' => [
                    'Full White-Label Branding & Logos',
                    'Up to 1,000 Customers',
                    'Custom Domain DNS Mapping',
                    'Razorpay & Stripe Webhooks',
                    'Priority 24/7 Support Desk',
                ],
                'status' => 'active',
                'sort_order' => 2,
            ],
            [
                'name' => 'Enterprise Suite',
                'slug' => 'enterprise',
                'short_description' => 'Unlimited scaling for high-volume enterprise networks.',
                'monthly_price' => 7999,
                'yearly_price' => 79990,
                'currency' => 'INR',
                'reseller_limit' => -1,
                'customer_limit' => -1,
                'products_limit' => -1,
                'services_limit' => -1,
                'wallet_limit' => -1,
                'trial_days' => 30,
                'storage_mb' => 102400,
                'api_rate_limit' => 300,
                'white_label_available' => true,
                'features' => [
                    'Unlimited Customers & Quotas',
                    'Unlimited Product & Service Catalog',
                    'Custom Domain SSL Integration',
                    'Dedicated Account Manager',
                    '99.99% Uptime SLA Guarantee',
                ],
                'status' => 'active',
                'sort_order' => 3,
            ],
        ];

        foreach ($defaults as $p) {
            SaasPlan::create($p);
        }
    }
}
