<?php

namespace App\Services\Payment;

interface PaymentGatewayInterface
{
    /**
     * Create a payment order on the gateway.
     * Returns gateway-specific data needed by the frontend to open the payment UI.
     */
    public function createOrder(float $amount, string $currency, string $receipt, array $options = []): array;

    /**
     * Verify the payment after the user completes it.
     * Returns true if the signature/status is valid.
     */
    public function verifyPayment(array $data): bool;

    /**
     * Verify a webhook signature.
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool;

    /**
     * Issue a full or partial refund.
     */
    public function refund(string $gatewayPaymentId, float $amount, string $reason = ''): array;

    /**
     * Fetch payment details from gateway.
     */
    public function fetchPayment(string $gatewayPaymentId): array;

    public function getGatewayName(): string;
}
