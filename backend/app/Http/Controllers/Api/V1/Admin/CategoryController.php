<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = Category::with('parent')
            ->latest('created_at')
            ->paginate($request->per_page ?? 20);

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $category = Category::create([
            'name' => $request->name,
            'slug' => $request->slug ?? Str::slug($request->name),
            'parent_id' => $request->parent_id,
            'description' => $request->description,
            'icon' => $request->icon,
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Category created.', 'data' => $category], 201);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(['data' => Category::with('parent')->findOrFail($id)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $category->update($request->only('name', 'description', 'parent_id', 'is_active', 'icon'));

        return response()->json(['message' => 'Category updated.', 'data' => $category]);
    }

    public function destroy(string $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return response()->json(['message' => 'Category deleted.']);
    }
}
