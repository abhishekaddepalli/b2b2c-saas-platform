<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(Offer::paginate($request->per_page ?? 20));
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Offer created.'], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => Offer::findOrFail($id)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'Offer updated.']);
    }

    public function destroy(string $id): JsonResponse
    {
        return response()->json(['message' => 'Offer deleted.']);
    }
}
