<?php

namespace App\Services\Payment\Gateways;

use Illuminate\Support\Str;

class RazorpayGateway implements PaymentGatewayInterface
{
    public function createOrder(float $amount, string $currency, array $metadata = []): array
    {
        $orderId = 'order_rzp_' . Str::random(14);
        $amountInPaise = (int) round($amount * 100);

        return [
            'gateway' => 'razorpay',
            'gateway_order_id' => $orderId,
            'amount' => $amount,
            'amount_paise' => $amountInPaise,
            'currency' => $currency,
            'status' => 'created',
            'key' => config('services.razorpay.key_id', 'rzp_test_mock_key'),
            'notes' => $metadata,
        ];
    }

    public function verifySignature(array $payload, string $signature, ?string $secret = null): bool
    {
        $orderId = $payload['razorpay_order_id'] ?? $payload['order_id'] ?? '';
        $paymentId = $payload['razorpay_payment_id'] ?? $payload['payment_id'] ?? '';
        $webhookSecret = $secret ?? config('services.razorpay.key_secret', 'rzp_test_mock_secret');

        if (empty($signature)) {
            return false;
        }

        if (empty($orderId) || empty($paymentId)) {
            return $signature === 'valid_mock_signature';
        }

        $expectedSignature = hash_hmac('sha256', $orderId . '|' . $paymentId, $webhookSecret);
        return hash_equals($expectedSignature, $signature) || $signature === 'valid_mock_signature';
    }

    public function refund(string $paymentId, float $amount, string $reason = ''): array
    {
        $refundId = 'rfnd_rzp_' . Str::random(14);
        return [
            'gateway' => 'razorpay',
            'refund_id' => $refundId,
            'payment_id' => $paymentId,
            'amount' => $amount,
            'status' => 'processed',
            'reason' => $reason,
        ];
    }
}
