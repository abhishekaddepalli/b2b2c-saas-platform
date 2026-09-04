<?php

namespace App\Http\Controllers\Api\V1\Reseller;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CustomerController extends Controller
{
    private function findOrgCustomer($org, string $id): User
    {
        return User::where('id', $id)
            ->where(function ($q) use ($org) {
                $q->where('current_organization_id', $org->id)
                  ->orWhereHas('organizations', function ($sub) use ($org) {
                      $sub->where('organizations.id', $org->id);
                  })
                  ->orWhereHas('orders', function ($sub) use ($org) {
                      $sub->where('organization_id', $org->id);
                  });
            })
            ->whereDoesntHave('roles', fn($r) => $r->whereIn('name', ['SUPER_ADMIN', 'RESELLER']))
            ->firstOrFail();
    }

    public function index(Request $request): JsonResponse
    {
        $org = $request->user()->getOrganization();
        if (!$org) {
            return response()->json(['data' => [], 'total' => 0]);
        }

        $query = User::query()
            ->where(function ($q) use ($org) {
                $q->where('current_organization_id', $org->id)
                  ->orWhereHas('organizations', function ($sub) use ($org) {
                      $sub->where('organizations.id', $org->id)
                          ->whereIn('organization_users.role_within_org', ['customer', 'member', 'client', 'user']);
                  })
                  ->orWhereHas('orders', function ($sub) use ($org) {
                      $sub->where('organization_id', $org->id);
                  });
            })
            ->whereDoesntHave('roles', function ($r) {
                $r->whereIn('name', ['SUPER_ADMIN', 'RESELLER']);
            });

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('phone', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $customers = $query->withCount([
            'orders' => fn($q) => $q->where('organization_id', $org->id)
        ])->latest()->paginate($request->per_page ?? 50);

        return response()->json($customers);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        $org = $request->user()->getOrganization();
        if ($org) {
            app(\App\Services\Saas\SaasMonetizationService::class)->checkCustomerQuota($org);
        }

        $customer = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'status' => 'active',
            'email_verified_at' => now(),
            'current_organization_id' => $org?->id,
        ]);
        $customer->assignRole('USER');

        if ($org) {
            $org->users()->syncWithoutDetaching([
                $customer->id => [
                    'role_within_org' => 'customer',
                    'status' => 'active',
                    'joined_at' => now(),
                ]
            ]);
        }

        return response()->json(['message' => 'Customer created.', 'data' => $customer], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $org = $request->user()->getOrganization();
        $customer = $this->findOrgCustomer($org, $id);

        $ordersCount = Order::where('customer_id', $customer->id)
            ->when($org, fn($q) => $q->where('organization_id', $org->id))
            ->count();

        $totalSpent = (float) Order::where('customer_id', $customer->id)
            ->when($org, fn($q) => $q->where('organization_id', $org->id))
            ->whereIn('payment_status', ['paid', 'completed'])
            ->sum('grand_total');

        $subsCount = Subscription::withoutTenantScope()
            ->where('customer_id', $customer->id)
            ->when($org, fn($q) => $q->where('organization_id', $org->id))
            ->count();

        $activeSubsCount = Subscription::withoutTenantScope()
            ->where('customer_id', $customer->id)
            ->when($org, fn($q) => $q->where('organization_id', $org->id))
            ->where('status', 'active')
            ->count();

        $customer->setAttribute('orders_count', $ordersCount);
        $customer->setAttribute('total_spent', $totalSpent);
        $customer->setAttribute('subscriptions_count', $subsCount);
        $customer->setAttribute('active_subscriptions_count', $activeSubsCount);

        return response()->json(['data' => $customer]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $org = $request->user()->getOrganization();
        $customer = $this->findOrgCustomer($org, $id);

        $customer->update($request->only('name', 'phone', 'status'));

        return response()->json(['message' => 'Customer updated.', 'data' => $customer]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $org = $request->user()->getOrganization();
        $customer = $this->findOrgCustomer($org, $id);
        $customer->delete();

        return response()->json(['message' => 'Customer deleted.']);
    }

    public function orders(Request $request, string $id): JsonResponse
    {
        $org = $request->user()->getOrganization();
        $customer = $this->findOrgCustomer($org, $id);

        $orders = Order::where('customer_id', $customer->id)
            ->when($org, fn($q) => $q->where('organization_id', $org->id))
            ->with(['items', 'customer'])
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json($orders);
    }

    public function subscriptions(Request $request, string $id): JsonResponse
    {
        $org = $request->user()->getOrganization();
        $customer = $this->findOrgCustomer($org, $id);

        $subs = Subscription::withoutTenantScope()
            ->where('customer_id', $customer->id)
            ->when($org, fn($q) => $q->where('organization_id', $org->id))
            ->with(['servicePlan.service'])
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json($subs);
    }
}
