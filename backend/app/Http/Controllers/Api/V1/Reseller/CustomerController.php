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
    public function index(Request $request): JsonResponse
    {
        $org = $request->user()->getOrganization();
        if (!$org) {
            return response()->json(['data' => [], 'total' => 0]);
        }

        $query = $org->users()->wherePivot('role_within_org', 'customer');

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('users.name', 'like', "%{$s}%")
                  ->orWhere('users.email', 'like', "%{$s}%")
                  ->orWhere('users.phone', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('users.status', $request->status);
        }

        $customers = $query->paginate($request->per_page ?? 20);

        return response()->json($customers);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $org = $request->user()->getOrganization();
        if ($org) {
            app(\App\Services\Saas\SaasMonetizationService::class)->checkCustomerQuota($org);
        }

        $customer = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'status' => 'active',
        ]);
        $customer->assignRole('USER');

        if ($org) {
            $org->users()->attach($customer->id, [
                'role_within_org' => 'customer',
                'status' => 'active',
                'joined_at' => now(),
            ]);
            $customer->update(['current_organization_id' => $org->id]);
        }

        return response()->json(['message' => 'Customer created.', 'data' => $customer], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $org = $request->user()->getOrganization();
        $customer = $org->users()->where('users.id', $id)->firstOrFail();

        return response()->json(['data' => $customer]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $org = $request->user()->getOrganization();
        $customer = $org->users()->where('users.id', $id)->firstOrFail();

        $customer->update($request->only('name', 'phone', 'status'));

        return response()->json(['message' => 'Customer updated.', 'data' => $customer]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $org = $request->user()->getOrganization();
        $customer = $org->users()->where('users.id', $id)->firstOrFail();
        $customer->delete();

        return response()->json(['message' => 'Customer deleted.']);
    }

    public function orders(Request $request, string $id): JsonResponse
    {
        $org = $request->user()->getOrganization();
        $customer = $org->users()->where('users.id', $id)->firstOrFail();

        $orders = Order::where('customer_id', $customer->id)->paginate($request->per_page ?? 20);
        return response()->json($orders);
    }

    public function subscriptions(Request $request, string $id): JsonResponse
    {
        $org = $request->user()->getOrganization();
        $customer = $org->users()->where('users.id', $id)->firstOrFail();

        $subs = Subscription::where('customer_id', $customer->id)->paginate($request->per_page ?? 20);
        return response()->json($subs);
    }
}
