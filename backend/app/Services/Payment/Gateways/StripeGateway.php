<?php

namespace App\Services\Payment\Gateways;

use Illuminate\Support\Str;

class StripeGateway implements PaymentGatewayInterface
{
    public function createOrder(float $amount, string $currency, array $metadata = []): array
    {
        $orderId = 'pi_' . Str::random(14);
        return [
            'gateway' => 'stripe',
            'gateway_order_id' => $orderId,
            'amount' => $amount,
            'currency' => strtolower($currency),
            'status' => 'created',
            'client_secret' => 'pi_' . Str::random(14) . '_secret_' . Str::random(14),
            'notes' => $metadata,
        ];
    }

    public function verifySignature(array $payload, string $signature, ?string $secret = null): bool
    {
        return !empty($signature);
    }

    public function refund(string $paymentId, float $amount, string $reason = ''): array
    {
        return [
            'gateway' => 'stripe',
            'refund_id' => 're_' . Str::random(14),
            'payment_id' => $paymentId,
            'amount' => $amount,
            'status' => 'processed',
            'reason' => $reason,
        ];
    }
}
