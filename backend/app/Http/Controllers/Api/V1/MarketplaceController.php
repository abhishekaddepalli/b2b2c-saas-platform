<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Advertisement;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\Service;
use App\Services\Pricing\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class MarketplaceController extends Controller
{
    public function __construct(private readonly PricingService $pricingService) {}

    private function resolveUser(Request $request)
    {
        return $request->user() ?? Auth::guard('sanctum')->user();
    }

    /**
     * Homepage: featured products, services, banners, categories, active offers.
     */
    public function home(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);

        $data = [
            'banners' => $this->getActiveBanners('homepage_hero'),
            'featured_products' => $this->getProducts(['featured' => true, 'limit' => 8], $user),
            'featured_services' => $this->getServices(['featured' => true, 'limit' => 6], $user),
            'categories' => Category::where('status', 'active')->with('subcategories')->orderBy('sort_order')->get(),
            'active_offers' => Coupon::where('status', 'active')
                ->where(fn($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
                ->where(fn($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
                ->limit(6)
                ->get(),
        ];

        return response()->json(['data' => $data]);
    }

    /**
     * Product listing with search, category/subcategory, type, featured filters, sorting.
     */
    public function products(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);
        $query = $this->visibleProductsQuery($user);

        if ($request->search) {
            $query->where(fn($q) => $q
                ->where('name', 'like', "%{$request->search}%")
                ->orWhere('short_description', 'like', "%{$request->search}%")
                ->orWhere('sku', 'like', "%{$request->search}%")
            );
        }

        if ($request->category_id) $query->where('category_id', $request->category_id);
        if ($request->subcategory_id) $query->where('subcategory_id', $request->subcategory_id);
        if ($request->type) $query->where('type', $request->type);
        if ($request->boolean('featured')) $query->where('featured', true);

        $sortMap = [
            'name' => 'name',
            'newest' => 'created_at',
            'popular' => 'sort_order',
        ];
        $sort = $sortMap[$request->sort ?? 'newest'] ?? 'created_at';
        $query->orderBy($sort, $request->sort === 'name' ? 'asc' : 'desc');

        $products = $query->with(['category', 'subcategory', 'images', 'prices'])
            ->paginate($request->per_page ?? 20);

        // Attach role-aware pricing to each product
        $products->getCollection()->transform(function ($product) use ($user) {
            $data = $product->toArray();
            $data['pricing'] = $this->pricingService->resolve($product, $user)->toApiArray();
            return $data;
        });

        return response()->json($products);
    }

    /**
     * Single product detail with images, features, and role-aware pricing.
     */
    public function product(Request $request, string $slug): JsonResponse
    {
        $user = $this->resolveUser($request);
        $query = $this->visibleProductsQuery($user)->where('slug', $slug);

        $product = $query->with(['category', 'subcategory', 'images', 'features', 'prices'])->firstOrFail();

        $data = $product->toArray();
        $data['pricing'] = $this->pricingService->resolve($product, $user)->toApiArray();

        return response()->json(['data' => $data]);
    }

    /**
     * Services listing with category and billing interval filters.
     */
    public function services(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);
        $query = $this->visibleServicesQuery($user);

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }
        if ($request->category_id) $query->where('category_id', $request->category_id);
        if ($request->billing_interval) $query->where('billing_interval', $request->billing_interval);
        if ($request->boolean('featured')) $query->where('featured', true);

        $services = $query->with(['category', 'plans', 'plans.prices'])
            ->paginate($request->per_page ?? 20);

        $services->getCollection()->transform(function ($service) use ($user) {
            $data = $service->toArray();
            foreach ($data['plans'] as &$planArr) {
                $planModel = $service->plans->firstWhere('id', $planArr['id']);
                if ($planModel) {
                    $planArr['pricing'] = $this->pricingService->resolve($planModel, $user)->toApiArray();
                }
            }
            return $data;
        });

        return response()->json($services);
    }

    /**
     * Single service detail with plans and features.
     */
    public function service(Request $request, string $slug): JsonResponse
    {
        $user = $this->resolveUser($request);
        $query = $this->visibleServicesQuery($user)->where('slug', $slug);

        $service = $query->with(['category', 'plans', 'plans.prices', 'features'])->firstOrFail();

        $data = $service->toArray();
        foreach ($data['plans'] as &$planArr) {
            $planModel = $service->plans->firstWhere('id', $planArr['id']);
            if ($planModel) {
                $planArr['pricing'] = $this->pricingService->resolve($planModel, $user)->toApiArray();
            }
        }

        return response()->json(['data' => $data]);
    }

    /**
     * Categories & Subcategories hierarchy.
     */
    public function categories(): JsonResponse
    {
        $categories = Category::where('status', 'active')
            ->with(['subcategories' => fn($q) => $q->where('status', 'active')->orderBy('sort_order')])
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $categories]);
    }

    /**
     * Active promotional offers & coupons.
     */
    public function offers(): JsonResponse
    {
        $offers = Coupon::where('status', 'active')
            ->where(fn($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
            ->get();

        return response()->json(['data' => $offers]);
    }

    /**
     * Active advertisements & banners.
     */
    public function advertisements(Request $request): JsonResponse
    {
        $placement = $request->placement ?? 'homepage_hero';
        $ads = $this->getActiveBanners($placement);

        return response()->json(['data' => $ads]);
    }

    /**
     * Product & Service Recommendations and Related Items.
     */
    public function recommendations(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);

        $relatedProducts = $this->getProducts(['featured' => true, 'limit' => 4], $user);
        $relatedServices = $this->getServices(['featured' => true, 'limit' => 4], $user);

        return response()->json([
            'data' => [
                'recommended_products' => $relatedProducts,
                'recommended_services' => $relatedServices,
            ]
        ]);
    }

    /**
     * Wishlist item list for authenticated user.
     */
    public function wishlist(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['data' => []]);
        }

        $items = \App\Models\Wishlist::where('user_id', $user->id)
            ->with(['product', 'product.images', 'service', 'service.plans'])
            ->get();

        return response()->json(['data' => $items]);
    }

    /**
     * Toggle product or service in user wishlist.
     */
    public function toggleWishlist(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $productId = $request->product_id;
        $serviceId = $request->service_id;

        $existing = \App\Models\Wishlist::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->where('service_id', $serviceId)
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['message' => 'Removed from wishlist.', 'in_wishlist' => false]);
        }

        \App\Models\Wishlist::create([
            'user_id' => $user->id,
            'product_id' => $productId,
            'service_id' => $serviceId,
        ]);

        return response()->json(['message' => 'Added to wishlist.', 'in_wishlist' => true]);
    }

    /**
     * List product or service reviews.
     */
    public function reviews(Request $request, string $id): JsonResponse
    {
        $reviews = \App\Models\ProductReview::where('status', 'approved')
            ->where(fn($q) => $q->where('product_id', $id)->orWhere('service_id', $id))
            ->with('user:id,name')
            ->latest()
            ->paginate($request->per_page ?? 10);

        return response()->json($reviews);
    }

    /**
     * Submit product or service review.
     */
    public function storeReview(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'review_title' => ['nullable', 'string', 'max:255'],
            'review_text' => ['required', 'string'],
        ]);

        $isProduct = Product::where('id', $id)->exists();

        $review = \App\Models\ProductReview::create([
            'user_id' => $user->id,
            'product_id' => $isProduct ? $id : null,
            'service_id' => $isProduct ? null : $id,
            'rating' => $request->rating,
            'review_title' => $request->review_title,
            'review_text' => $request->review_text,
            'is_verified_purchase' => true,
            'status' => 'approved',
        ]);

        return response()->json(['message' => 'Review submitted successfully.', 'data' => $review], 201);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function visibleProductsQuery($user)
    {
        $query = Product::query();
        if (!$user || $user->isCustomer()) {
            return $query->public();
        }
        if ($user->isReseller()) {
            return $query->resellerVisible();
        }
        return $query->whereIn('status', ['active', 'draft']);
    }

    private function visibleServicesQuery($user)
    {
        $query = Service::query();
        if (!$user || $user->isCustomer()) {
            return $query->where('status', 'active')->where('visibility', 'public');
        }
        if ($user->isReseller()) {
            return $query->where('status', 'active')->whereIn('visibility', ['public', 'reseller_only']);
        }
        return $query->whereIn('status', ['active', 'draft']);
    }

    private function getProducts(array $filters, $user): \Illuminate\Support\Collection
    {
        $q = Product::query()
            ->where('status', 'active')
            ->where('visibility', 'public')
            ->with(['images', 'prices']);

        if ($filters['featured'] ?? false) $q->where('featured', true);
        $products = $q->limit($filters['limit'] ?? 10)->get();

        return $products->map(function ($p) use ($user) {
            $data = $p->toArray();
            $data['pricing'] = $this->pricingService->resolve($p, $user)->toApiArray();
            return $data;
        });
    }

    private function getServices(array $filters, $user): \Illuminate\Support\Collection
    {
        $q = Service::query()
            ->where('status', 'active')
            ->where('visibility', 'public')
            ->with(['plans', 'plans.prices']);

        if ($filters['featured'] ?? false) $q->where('featured', true);
        $services = $q->limit($filters['limit'] ?? 10)->get();

        return $services->map(function ($s) use ($user) {
            $data = $s->toArray();
            foreach ($data['plans'] as &$planArr) {
                $planModel = $s->plans->firstWhere('id', $planArr['id']);
                if ($planModel) {
                    $planArr['pricing'] = $this->pricingService->resolve($planModel, $user)->toApiArray();
                }
            }
            return $data;
        });
    }

    private function getActiveBanners(string $placement): \Illuminate\Support\Collection
    {
        return Advertisement::where('placement', $placement)
            ->where('status', 'active')
            ->where(fn($q) => $q->whereNull('start_at')->orWhere('start_at', '<=', now()))
            ->where(fn($q) => $q->whereNull('end_at')->orWhere('end_at', '>=', now()))
            ->orderBy('priority', 'desc')
            ->limit(5)
            ->get();
    }
}
