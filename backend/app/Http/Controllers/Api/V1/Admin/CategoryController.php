<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Service;
use Database\Seeders\InfiniforgeCatalogSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Category::with('subcategories');

        if ($request->filled('search')) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', $s)
                  ->orWhere('slug', 'like', $s)
                  ->orWhere('description', 'like', $s);
            });
        }

        if ($request->filled('type')) {
            $query->where(function ($q) use ($request) {
                $q->where('type', $request->type)->orWhere('type', 'both');
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $categories = $query->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->paginate($request->per_page ?? 100);

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:categories,slug'],
            'type' => ['nullable', 'in:product,service,both'],
        ]);

        $category = Category::create([
            'name' => $request->name,
            'slug' => $request->slug ? Str::slug($request->slug) : Str::slug($request->name),
            'description' => $request->description,
            'icon' => $request->icon,
            'image_path' => $request->image_path,
            'type' => $request->type ?? 'both',
            'status' => $request->status ?? 'active',
            'featured' => $request->boolean('featured', false),
            'sort_order' => $request->sort_order ?? 0,
            'metadata' => $request->metadata ?? [],
        ]);

        return response()->json(['message' => 'Category created successfully.', 'data' => $category], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => Category::with('subcategories')->findOrFail($id)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $data = $request->only(['name', 'description', 'icon', 'image_path', 'type', 'status', 'featured', 'sort_order', 'metadata']);

        if ($request->filled('slug')) {
            $data['slug'] = Str::slug($request->slug);
        }

        $category->update($data);

        return response()->json(['message' => 'Category updated successfully.', 'data' => $category]);
    }

    public function destroy(string $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return response()->json(['message' => 'Category deleted successfully.']);
    }

    /**
     * One-click sync from Infiniforge catalog source.
     */
    public function syncInfiniforge(): JsonResponse
    {
        try {
            $seeder = new InfiniforgeCatalogSeeder();
            // Provide a dummy command output handler if running in HTTP context
            $command = new class {
                public function info($msg) {}
            };
            $seeder->setCommand($command);
            $seeder->run();

            $categoriesCount = Category::count();
            $productsCount = Product::count();
            $servicesCount = Service::count();

            return response()->json([
                'message' => 'Infiniforge catalog successfully synchronized!',
                'data' => [
                    'categories' => $categoriesCount,
                    'products' => $productsCount,
                    'services' => $servicesCount,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to synchronize Infiniforge catalog: ' . $e->getMessage(),
            ], 500);
        }
    }
}
