<?php

namespace App\Services\Pricing;

use App\Models\CustomPrice;
use App\Models\Price;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * PricingService
 *
 * Resolves the authoritative price for a given product/service_plan and user.
 * Called during marketplace listing AND re-verified at checkout — frontend
 * prices are NEVER trusted.
 *
 * Resolution order (highest priority first):
 * 1. Customer-specific custom price
 * 2. Reseller-specific custom price (from user's org)
 * 3. Active offer/campaign price
 * 4. Tier price (quantity-based)
 * 5. Category-level override
 * 6. Base price from prices table
 */
class PricingService
{
    /**
     * Resolve pricing for a priceable item and user.
     * Returns a PricingResult with role-appropriate visibility.
     */
    public function resolve(Model $priceable, ?User $user, int $quantity = 1): PricingResult
    {
        if (!$user) {
            return $this->resolveGuest($priceable, $quantity);
        }

        $role = $user->getPricingRole();
        $orgId = $user->getOrganization()?->id;

        // 1. Customer-specific override
        $customPrice = $this->resolveCustomPrice($priceable, 'customer', $user->id, $quantity);

        // 2. Reseller-specific override
        if (!$customPrice && $orgId && $role !== 'customer') {
            $customPrice = $this->resolveCustomPrice($priceable, 'reseller', $orgId, $quantity);
        }

        if ($customPrice) {
            return $this->buildResultFromCustomPrice($customPrice, $role, $quantity);
        }

        // 3–6. Fall through to base price (tier, category, fixed/percentage)
        $basePrice = $this->resolveBasePrice($priceable);
        if (!$basePrice) {
            return PricingResult::unavailable();
        }

        return $this->buildResultFromBasePrice($basePrice, $role, $quantity);
    }

    public function resolveGuest(Model $priceable, int $quantity = 1): PricingResult
    {
        $basePrice = $this->resolveBasePrice($priceable);
        if (!$basePrice) {
            return PricingResult::unavailable();
        }

        return $this->buildResultFromBasePrice($basePrice, 'customer', $quantity);
    }

    /**
     * Resolve full pricing breakdown (for admin use, order creation, snapshot).
     * Always returns cost/reseller/customer regardless of calling user.
     */
    public function resolveFullBreakdown(Model $priceable, int $quantity = 1): PricingBreakdown
    {
        $basePrice = $this->resolveBasePrice($priceable, $quantity);

        if (!$basePrice) {
            return PricingBreakdown::zero();
        }

        [$cost, $resellerPrice, $customerPrice] = $this->extractPrices($basePrice, $quantity);

        return new PricingBreakdown(
            costPrice: $cost,
            resellerPrice: $resellerPrice,
            customerPrice: $customerPrice,
            taxRate: (float) $basePrice->tax_rate,
            taxLabel: $basePrice->tax_label,
            taxInclusive: $basePrice->tax_inclusive,
            currency: $basePrice->currency,
        );
    }

    // ─── Private resolution logic ─────────────────────────────────────────────

    private function resolveCustomPrice(Model $priceable, string $scopeType, string $scopeId, int $quantity): ?CustomPrice
    {
        return CustomPrice::where('priceable_type', get_class($priceable))
            ->where('priceable_id', $priceable->id)
            ->where('scope_type', $scopeType)
            ->where('scope_id', $scopeId)
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            })
            ->first();
    }

    private function resolveBasePrice(Model $priceable, int $quantity = 1): ?Price
    {
        $prices = Price::where('priceable_type', get_class($priceable))
            ->where('priceable_id', $priceable->id)
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('effective_from')->orWhere('effective_from', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>=', now());
            })
            ->with('tierPrices')
            ->get();

        // Prefer tier pricing for this quantity
        $tierPrice = $prices->firstWhere('pricing_type', 'tier');
        if ($tierPrice && $tierBand = $this->matchTierBand($tierPrice, $quantity)) {
            return $tierBand; // we inject tier band values back as a synthetic Price-like object
        }

        // Otherwise first active price (fixed or percentage)
        return $prices->whereIn('pricing_type', ['fixed', 'percentage'])->first();
    }

    private function matchTierBand(Price $tierPrice, int $quantity): ?object
    {
        foreach ($tierPrice->tierPrices->sortBy('min_qty') as $band) {
            if ($quantity >= $band->min_qty && ($band->max_qty === null || $quantity <= $band->max_qty)) {
                // Return a value object mimicking Price fields for uniform handling
                return (object) [
                    'cost_price' => $band->cost_price,
                    'reseller_price' => $band->reseller_price,
                    'customer_price' => $band->customer_price,
                    'tax_rate' => $tierPrice->tax_rate,
                    'tax_label' => $tierPrice->tax_label,
                    'tax_inclusive' => $tierPrice->tax_inclusive,
                    'currency' => $tierPrice->currency,
                    'pricing_type' => 'tier',
                    'reseller_markup_pct' => null,
                    'customer_markup_pct' => null,
                ];
            }
        }
        return null;
    }

    private function extractPrices(object $price, int $quantity = 1): array
    {
        $cost = (float) $price->cost_price;

        if ($price->pricing_type === 'percentage') {
            $resellerPrice = $cost * (1 + (float) $price->reseller_markup_pct);
            $customerPrice = $resellerPrice * (1 + (float) $price->customer_markup_pct);
        } else {
            $resellerPrice = (float) ($price->reseller_price ?? $cost);
            $customerPrice = (float) ($price->customer_price ?? $resellerPrice);
        }

        return [$cost, $resellerPrice, $customerPrice];
    }

    private function buildResultFromBasePrice(Price $price, string $role, int $quantity): PricingResult
    {
        [$cost, $resellerPrice, $customerPrice] = $this->extractPrices($price, $quantity);

        $taxRate = (float) $price->tax_rate;

        return new PricingResult(
            role: $role,
            costPrice: $cost,
            resellerPrice: $resellerPrice,
            customerPrice: $customerPrice,
            taxRate: $taxRate,
            taxLabel: $price->tax_label,
            taxInclusive: $price->tax_inclusive,
            currency: $price->currency,
            quantity: $quantity,
        );
    }

    private function buildResultFromCustomPrice(CustomPrice $custom, string $role, int $quantity): PricingResult
    {
        // Fetch the base price to get cost and the other tier for margin calculation
        // This is needed so profit can still be computed correctly
        $baseBreakdown = $this->resolveFullBreakdown($custom->priceable ?? new \stdClass(), $quantity);

        $overridePrice = $custom->override_price !== null
            ? (float) $custom->override_price
            : $baseBreakdown->costPrice * (1 + (float) $custom->override_markup_pct);

        // Override only the price visible to this scope
        $resellerPrice = $role === 'reseller' ? $overridePrice : ($baseBreakdown->resellerPrice ?? $overridePrice);
        $customerPrice = $role === 'customer' ? $overridePrice : ($baseBreakdown->customerPrice ?? $overridePrice);

        return new PricingResult(
            role: $role,
            costPrice: $baseBreakdown->costPrice,
            resellerPrice: $resellerPrice,
            customerPrice: $customerPrice,
            taxRate: $baseBreakdown->taxRate,
            taxLabel: $baseBreakdown->taxLabel,
            taxInclusive: $baseBreakdown->taxInclusive,
            currency: $custom->currency,
            quantity: $quantity,
        );
    }
}
