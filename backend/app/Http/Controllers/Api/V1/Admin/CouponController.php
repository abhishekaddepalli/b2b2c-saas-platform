<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(Coupon::paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Coupon created.'], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => Coupon::findOrFail($id)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'Coupon updated.']);
    }

    public function destroy(string $id): JsonResponse
    {
        return response()->json(['message' => 'Coupon deleted.']);
    }
}
