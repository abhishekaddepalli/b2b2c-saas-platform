<?php

namespace App\Services\Payment\Gateways;

interface PaymentGatewayInterface
{
    public function createOrder(float $amount, string $currency, array $metadata = []): array;

    public function verifySignature(array $payload, string $signature, ?string $secret = null): bool;

    public function refund(string $paymentId, float $amount, string $reason = ''): array;
}
