<?php

namespace App\Services\Wallet;

readonly class WalletBalance
{
    public function __construct(
        public float $available,
        public float $reserved,
        public float $creditLimit,
        public string $currency,
    ) {}

    public function spendable(): float
    {
        return $this->available + $this->creditLimit;
    }

    public function total(): float
    {
        return $this->available + $this->reserved;
    }
}
