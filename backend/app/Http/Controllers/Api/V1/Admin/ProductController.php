<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['prices', 'category:id,name,slug', 'images']);

        if ($request->filled('search')) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', $s)
                  ->orWhere('sku', 'like', $s)
                  ->orWhere('short_description', 'like', $s);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $products = $query->latest('created_at')->paginate($request->per_page ?? 25);

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:products,slug'],
            'sku' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,active,archived'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'reseller_price' => ['required', 'numeric', 'min:0'],
            'customer_price' => ['required', 'numeric', 'min:0'],
            'image_url' => ['nullable', 'string'],
        ]);

        $slug = $request->filled('slug')
            ? Str::slug($request->slug)
            : Str::slug($request->name) . '-' . Str::random(4);

        $sku = $request->filled('sku')
            ? strtoupper($request->sku)
            : 'SKU-' . strtoupper(Str::random(6));

        $product = Product::create([
            'name' => $request->name,
            'slug' => $slug,
            'sku' => $sku,
            'short_description' => $request->short_description,
            'full_description' => $request->full_description,
            'type' => $request->type ?? 'digital',
            'category_id' => $request->category_id,
            'visibility' => $request->visibility ?? 'public',
            'status' => $request->status ?? 'active',
            'featured' => $request->boolean('featured', false),
        ]);

        if ($request->filled('image_url')) {
            $product->images()->create([
                'path' => $request->image_url,
                'alt_text' => $product->name,
                'is_primary' => true,
                'sort_order' => 0,
            ]);
        }

        $product->prices()->create([
            'pricing_type' => 'fixed',
            'cost_price' => $request->cost_price,
            'reseller_price' => $request->reseller_price,
            'customer_price' => $request->customer_price,
            'currency' => 'INR',
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Product created with 3-tier wholesale pricing.',
            'data' => $product->load(['prices', 'images']),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $product = Product::with(['prices', 'category', 'images'])->findOrFail($id);
        return response()->json(['data' => $product]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $data = $request->only([
            'name', 'sku', 'short_description', 'full_description',
            'visibility', 'status', 'category_id', 'type', 'featured'
        ]);

        if ($request->filled('slug')) {
            $data['slug'] = Str::slug($request->slug);
        }

        $product->update($data);

        if ($request->filled('image_url')) {
            $product->images()->updateOrCreate(
                ['is_primary' => true],
                ['path' => $request->image_url, 'alt_text' => $product->name, 'sort_order' => 0]
            );
        }

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

        return response()->json([
            'message' => 'Product updated successfully.',
            'data' => $product->load(['prices', 'images']),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Product deleted successfully.']);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $request->validate(['status' => ['required', 'in:draft,active,archived']]);

        $product = Product::findOrFail($id);
        $product->update(['status' => $request->status]);

        return response()->json(['message' => 'Status updated.', 'data' => $product]);
    }
}
