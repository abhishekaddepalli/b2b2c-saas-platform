<?php

namespace App\Services\Pricing;

/**
 * PricingBreakdown — full three-tier snapshot for order creation,
 * profit recording, and admin views.
 */
readonly class PricingBreakdown
{
    public function __construct(
        public float $costPrice,
        public float $resellerPrice,
        public float $customerPrice,
        public float $taxRate,
        public string $taxLabel,
        public bool $taxInclusive,
        public string $currency,
    ) {}

    public static function zero(): self
    {
        return new self(
            costPrice: 0,
            resellerPrice: 0,
            customerPrice: 0,
            taxRate: 0,
            taxLabel: 'GST',
            taxInclusive: false,
            currency: 'INR',
        );
    }

    public function platformMargin(): float
    {
        return $this->resellerPrice - $this->costPrice;
    }

    public function resellerProfit(): float
    {
        return $this->customerPrice - $this->resellerPrice;
    }

    public function toSnapshot(): array
    {
        return [
            'cost_price_at_purchase' => round($this->costPrice, 2),
            'reseller_price_at_purchase' => round($this->resellerPrice, 2),
            'customer_price_at_purchase' => round($this->customerPrice, 2),
            'tax_rate_at_purchase' => $this->taxRate,
        ];
    }
}
