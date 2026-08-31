<?php

namespace App\Services\Payment\Gateways;

use Illuminate\Support\Str;

class CashfreeGateway implements PaymentGatewayInterface
{
    public function createOrder(float $amount, string $currency, array $metadata = []): array
    {
        $orderId = 'order_cf_' . Str::random(14);
        return [
            'gateway' => 'cashfree',
            'gateway_order_id' => $orderId,
            'amount' => $amount,
            'currency' => $currency,
            'status' => 'created',
            'payment_session_id' => 'session_' . Str::random(14),
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
            'gateway' => 'cashfree',
            'refund_id' => 'rfnd_cf_' . Str::random(14),
            'payment_id' => $paymentId,
            'amount' => $amount,
            'status' => 'processed',
            'reason' => $reason,
        ];
    }
}
