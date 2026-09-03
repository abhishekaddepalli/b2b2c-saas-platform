<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::select('id', 'name', 'email', 'phone', 'status', 'current_organization_id', 'created_at')
            ->with([
                'roles:id,name',
                'currentOrganization:id,name,slug'
            ]);

        if ($request->filled('search')) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', $s)
                  ->orWhere('email', 'like', $s)
                  ->orWhere('phone', 'like', $s);
            });
        }

        if ($request->filled('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest()->paginate($request->per_page ?? 25));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'string', 'in:SUPER_ADMIN,RESELLER,USER'],
            'phone' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'in:active,suspended,pending'],
            'organization_id' => ['nullable', 'uuid', 'exists:organizations,id'],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'status' => $request->status ?? 'active',
            'email_verified_at' => now(),
            'current_organization_id' => $request->organization_id,
        ]);

        // Ensure role exists and assign
        $role = Role::firstOrCreate(['name' => $request->role, 'guard_name' => 'web']);
        $user->assignRole($role);

        // Attach to organization if selected
        if ($request->filled('organization_id')) {
            $roleInOrg = $request->role === 'RESELLER' ? 'owner' : 'member';
            $user->organizations()->syncWithoutDetaching([
                $request->organization_id => ['role_within_org' => $roleInOrg, 'status' => 'active']
            ]);
        }

        return response()->json([
            'message' => 'User account created successfully.',
            'data' => $user->load(['roles:id,name', 'currentOrganization:id,name,slug']),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $user = User::with(['roles:id,name', 'currentOrganization:id,name,slug'])->findOrFail($id);
        return response()->json(['data' => $user]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', "unique:users,email,{$id}"],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['sometimes', 'string', 'in:SUPER_ADMIN,RESELLER,USER'],
            'phone' => ['nullable', 'string', 'max:50'],
            'status' => ['sometimes', 'in:active,suspended,pending'],
            'organization_id' => ['nullable'],
        ]);

        $data = $request->only(['name', 'email', 'phone', 'status']);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        if ($request->has('organization_id')) {
            $data['current_organization_id'] = $request->organization_id ?: null;
        }

        $user->update($data);

        if ($request->filled('role')) {
            $role = Role::firstOrCreate(['name' => $request->role, 'guard_name' => 'web']);
            $user->syncRoles([$role]);
        }

        return response()->json([
            'message' => 'User updated successfully.',
            'data' => $user->fresh(['roles:id,name', 'currentOrganization:id,name,slug']),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        if ($request->user() && $request->user()->id === $id) {
            return response()->json(['message' => 'You cannot delete your own Super Admin account.'], 422);
        }

        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }
}
