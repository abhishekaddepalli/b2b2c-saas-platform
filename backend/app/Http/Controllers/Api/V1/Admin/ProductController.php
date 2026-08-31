<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = Product::with(['prices', 'category'])
            ->latest('created_at')
            ->paginate($request->per_page ?? 20);

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'unique:products,slug'],
            'type' => ['required', 'in:digital,license_key,downloadable,membership'],
            'status' => ['nullable', 'in:draft,active,archived'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'reseller_price' => ['required', 'numeric', 'min:0'],
            'customer_price' => ['required', 'numeric', 'min:0'],
        ]);

        $product = Product::create([
            'name' => $request->name,
            'slug' => $request->slug,
            'short_description' => $request->short_description,
            'full_description' => $request->full_description,
            'type' => $request->type,
            'category_id' => $request->category_id,
            'visibility' => $request->visibility ?? 'public',
            'status' => $request->status ?? 'active',
            'currency' => 'INR',
        ]);

        $product->prices()->create([
            'pricing_type' => 'fixed',
            'cost_price' => $request->cost_price,
            'reseller_price' => $request->reseller_price,
            'customer_price' => $request->customer_price,
            'currency' => 'INR',
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Product created with 3-tier pricing.',
            'data' => $product->load('prices'),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $product = Product::with(['prices', 'category'])->findOrFail($id);
        return response()->json(['data' => $product]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $product->update($request->only('name', 'short_description', 'full_description', 'visibility', 'status', 'category_id'));

        if ($request->has(['cost_price', 'reseller_price', 'customer_price'])) {
            $product->prices()->updateOrCreate(
                ['pricing_type' => 'fixed'],
                [
                    'cost_price' => $request->cost_price,
                    'reseller_price' => $request->reseller_price,
                    'customer_price' => $request->customer_price,
                    'currency' => 'INR',
                    'is_active' => true,
                ]
            );
        }

        return response()->json(['message' => 'Product updated.', 'data' => $product->load('prices')]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->update(['status' => $request->status ?? 'active']);

        return response()->json(['message' => 'Product status updated.', 'data' => $product]);
    }

    public function destroy(string $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Product deleted.']);
    }
}
