<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OfferController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Offer::query();

        if ($request->filled('search')) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', $s)
                  ->orWhere('slug', 'like', $s)
                  ->orWhere('description', 'like', $s);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest('created_at')->paginate($request->per_page ?? 25));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'discount_value' => ['required', 'numeric', 'min:0'],
        ]);

        $slug = $request->filled('slug')
            ? Str::slug($request->slug)
            : Str::slug($request->name) . '-' . Str::random(4);

        $creatorId = $request->user()?->id
            ?? User::whereHas('roles', fn($q) => $q->where('name', 'SUPER_ADMIN'))->value('id')
            ?? User::value('id');

        $offer = Offer::create([
            'name' => $request->name,
            'slug' => $slug,
            'description' => $request->description,
            'type' => $request->type ?? 'percentage_discount',
            'discount_value' => $request->discount_value,
            'min_order_amount' => $request->min_order_amount ?? 0,
            'max_discount_amount' => $request->max_discount_amount,
            'status' => $request->status ?? 'active',
            'created_by' => $creatorId,
        ]);

        return response()->json([
            'message' => 'Promotional offer campaign created successfully.',
            'data' => $offer,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $offer = Offer::findOrFail($id);
        return response()->json(['data' => $offer]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $offer = Offer::findOrFail($id);

        $data = $request->only([
            'name', 'description', 'type', 'discount_value',
            'min_order_amount', 'max_discount_amount', 'status'
        ]);

        if ($request->filled('slug')) {
            $data['slug'] = Str::slug($request->slug);
        }

        $offer->update($data);

        return response()->json([
            'message' => 'Offer campaign updated successfully.',
            'data' => $offer,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $offer = Offer::findOrFail($id);
        $offer->delete();

        return response()->json(['message' => 'Offer deleted successfully.']);
    }
}
