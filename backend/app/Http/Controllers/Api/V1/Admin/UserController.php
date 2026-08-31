<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(User::with('roles')->paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['message' => 'User created.'], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => User::with('roles')->findOrFail($id)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'User updated.']);
    }

    public function destroy(string $id): JsonResponse
    {
        return response()->json(['message' => 'User deleted.']);
    }
}
