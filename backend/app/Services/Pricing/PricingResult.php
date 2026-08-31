<?php

namespace App\Services\Pricing;

/**
 * PricingResult — role-aware pricing view for a single priceable item.
 *
 * Admin  → sees cost, reseller, customer, platform_margin, reseller_margin
 * Reseller → sees your_price, customer_price, your_profit
 * Customer → sees price (customer_price only)
 */
class PricingResult
{
    public readonly float $platformMargin;
    public readonly float $resellerProfit;
    public readonly float $effectiveUnitPrice;
    public readonly float $taxAmount;
    public readonly float $totalPrice;
    public readonly bool $available;

    public function __construct(
        public readonly string $role,
        public readonly float $costPrice,
        public readonly float $resellerPrice,
        public readonly float $customerPrice,
        public readonly float $taxRate,
        public readonly string $taxLabel,
        public readonly bool $taxInclusive,
        public readonly string $currency,
        public readonly int $quantity = 1,
    ) {
        $this->platformMargin = $resellerPrice - $costPrice;
        $this->resellerProfit = $customerPrice - $resellerPrice;
        $this->effectiveUnitPrice = match ($role) {
            'admin', 'reseller' => $resellerPrice,
            default => $customerPrice,
        };
        $this->taxAmount = $taxInclusive
            ? $this->effectiveUnitPrice - ($this->effectiveUnitPrice / (1 + $taxRate))
            : $this->effectiveUnitPrice * $taxRate;
        $this->totalPrice = $taxInclusive
            ? $this->effectiveUnitPrice * $quantity
            : ($this->effectiveUnitPrice + $this->taxAmount) * $quantity;
        $this->available = true;
    }

    public static function unavailable(): self
    {
        $result = new self(
            role: 'customer',
            costPrice: 0,
            resellerPrice: 0,
            customerPrice: 0,
            taxRate: 0,
            taxLabel: 'GST',
            taxInclusive: false,
            currency: 'INR',
        );
        // Hack: override available after construction
        (function () { $this->available = false; })->bindTo($result, self::class)();
        return $result;
    }

    /**
     * Serialize to role-appropriate shape for API Resources.
     * CRITICAL: customers must never see cost_price.
     */
    public function toApiArray(): array
    {
        return match ($this->role) {
            'admin' => [
                'cost_price' => round($this->costPrice, 2),
                'reseller_price' => round($this->resellerPrice, 2),
                'customer_price' => round($this->customerPrice, 2),
                'platform_margin' => round($this->platformMargin, 2),
                'reseller_margin' => round($this->resellerProfit, 2),
                'tax_rate' => $this->taxRate,
                'tax_label' => $this->taxLabel,
                'tax_inclusive' => $this->taxInclusive,
                'currency' => $this->currency,
            ],
            'reseller' => [
                'your_price' => round($this->resellerPrice, 2),
                'customer_price' => round($this->customerPrice, 2),
                'your_profit' => round($this->resellerProfit, 2),
                'tax_rate' => $this->taxRate,
                'tax_label' => $this->taxLabel,
                'tax_inclusive' => $this->taxInclusive,
                'currency' => $this->currency,
            ],
            default => [
                'price' => round($this->customerPrice, 2),
                'tax_rate' => $this->taxRate,
                'tax_label' => $this->taxLabel,
                'tax_inclusive' => $this->taxInclusive,
                'currency' => $this->currency,
            ],
        };
    }
}
