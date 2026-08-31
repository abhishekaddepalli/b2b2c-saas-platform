<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Advertisement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdvertisementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(Advertisement::paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Advertisement created.'], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => Advertisement::findOrFail($id)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'Advertisement updated.']);
    }

    public function destroy(string $id): JsonResponse
    {
        return response()->json(['message' => 'Advertisement deleted.']);
    }
}
