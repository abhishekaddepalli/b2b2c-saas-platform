<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Offer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OfferController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureDefaultOffers();

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

        $offers = $query->latest('created_at')->paginate($request->per_page ?? 25);

        return response()->json($offers);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'type' => ['nullable', 'string'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:draft,active,expired,disabled'],
            'audience' => ['nullable', 'string', 'in:all,reseller,customer,specific_org,specific_user'],
            'code' => ['nullable', 'string', 'max:50'],
        ]);

        $slug = $request->filled('slug')
            ? Str::slug($request->slug)
            : Str::slug($request->name) . '-' . Str::random(4);

        $creatorId = $request->user()?->id
            ?? User::whereHas('roles', fn($q) => $q->where('name', 'SUPER_ADMIN'))->value('id')
            ?? User::first()?->id;

        $offer = Offer::create([
            'name' => $request->name,
            'slug' => $slug,
            'description' => $request->description,
            'type' => $request->type ?? 'percentage_discount',
            'discount_value' => $request->discount_value,
            'min_order_amount' => $request->min_order_amount ?? 0,
            'max_discount_amount' => $request->max_discount_amount,
            'audience' => $request->audience ?? 'all',
            'status' => $request->status ?? 'active',
            'created_by' => $creatorId,
        ]);

        // If coupon code is provided, create linked coupon record
        if ($request->filled('code')) {
            Coupon::create([
                'offer_id' => $offer->id,
                'code' => strtoupper(trim($request->code)),
                'description' => $request->description ?? $request->name,
                'type' => str_contains($request->type ?? '', 'fixed') ? 'fixed' : 'percentage',
                'value' => $request->discount_value,
                'min_order_amount' => $request->min_order_amount ?? 0,
                'max_discount_amount' => $request->max_discount_amount,
                'status' => $request->status ?? 'active',
                'created_by' => $creatorId,
            ]);
        }

        return response()->json([
            'message' => 'Promotional offer campaign created successfully.',
            'data' => $offer,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $offer = Offer::with('coupons')->findOrFail($id);
        return response()->json(['data' => $offer]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $offer = Offer::findOrFail($id);

        $data = $request->only([
            'name', 'description', 'type', 'discount_value',
            'min_order_amount', 'max_discount_amount', 'status', 'audience'
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

        return response()->json(['message' => 'Offer campaign deleted successfully.']);
    }

    private function ensureDefaultOffers(): void
    {
        if (Offer::count() > 0) {
            return;
        }

        $creatorId = User::whereHas('roles', fn($q) => $q->where('name', 'SUPER_ADMIN'))->value('id')
            ?? User::first()?->id;

        if (!$creatorId) {
            return;
        }

        $defaults = [
            [
                'name' => 'Freedom SALE 5% OFF',
                'slug' => 'freedom-sale-5',
                'description' => 'Applies to all eligible reseller and customer orders across catalog items.',
                'type' => 'percentage_discount',
                'discount_value' => 5,
                'min_order_amount' => 500,
                'max_discount_amount' => 1000,
                'audience' => 'all',
                'status' => 'active',
                'created_by' => $creatorId,
                'code' => 'FREEDOM5',
            ],
            [
                'name' => 'Welcome First Order 10%',
                'slug' => 'welcome-first-order-10',
                'description' => 'Special 10% introductory discount for new customer registrations.',
                'type' => 'percentage_discount',
                'discount_value' => 10,
                'min_order_amount' => 1000,
                'max_discount_amount' => 500,
                'audience' => 'customer',
                'status' => 'active',
                'created_by' => $creatorId,
                'code' => 'WELCOME10',
            ],
            [
                'name' => 'Reseller Volume Bonus 15%',
                'slug' => 'reseller-volume-15',
                'description' => 'High-volume tier bonus for wholesale orders exceeding ₹10,000.',
                'type' => 'percentage_discount',
                'discount_value' => 15,
                'min_order_amount' => 10000,
                'max_discount_amount' => 5000,
                'audience' => 'reseller',
                'status' => 'active',
                'created_by' => $creatorId,
                'code' => 'VOLUME15',
            ],
        ];

        foreach ($defaults as $d) {
            $code = $d['code'] ?? null;
            unset($d['code']);

            $offer = Offer::create($d);

            if ($code) {
                Coupon::create([
                    'offer_id' => $offer->id,
                    'code' => $code,
                    'description' => $offer->description,
                    'type' => 'percentage',
                    'value' => $offer->discount_value,
                    'min_order_amount' => $offer->min_order_amount,
                    'max_discount_amount' => $offer->max_discount_amount,
                    'status' => 'active',
                    'created_by' => $creatorId,
                ]);
            }
        }
    }
}
