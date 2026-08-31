<?php

namespace App\Services\Payment\Gateways;

use Illuminate\Support\Str;

class PhonePeGateway implements PaymentGatewayInterface
{
    public function createOrder(float $amount, string $currency, array $metadata = []): array
    {
        $orderId = 'order_ppe_' . Str::random(14);
        return [
            'gateway' => 'phonepe',
            'gateway_order_id' => $orderId,
            'amount' => $amount,
            'currency' => $currency,
            'status' => 'created',
            'redirect_url' => "https://api.phonepe.com/pay/{$orderId}",
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
            'gateway' => 'phonepe',
            'refund_id' => 'rfnd_ppe_' . Str::random(14),
            'payment_id' => $paymentId,
            'amount' => $amount,
            'status' => 'processed',
            'reason' => $reason,
        ];
    }
}
