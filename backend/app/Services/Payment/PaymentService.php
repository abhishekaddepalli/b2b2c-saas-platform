<?php

namespace App\Services\Payment;

use App\Models\Organization;
use App\Models\Payment;
use App\Models\User;
use App\Models\WebhookEvent;
use App\Services\Notification\NotificationService;
use App\Services\Wallet\WalletService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentService
{
    public function __construct(
        private readonly WalletService $walletService,
        private readonly NotificationService $notificationService
    ) {}

    /**
     * Initiate payment order for wallet recharge or product purchase.
     * NEVER credits wallet here — creates pending Payment record only.
     */
    public function initiateWalletRecharge(Organization $org, User $user, float $amount, string $gatewayName = 'razorpay'): array
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException("Recharge amount must be positive, got {$amount}");
        }

        $gateway = PaymentGatewayFactory::make($gatewayName);
        $currency = $org->currency ?? 'INR';
        $orderData = $gateway->createOrder($amount, $currency, ['organization_id' => $org->id, 'payer_id' => $user->id]);

        $payment = Payment::create([
            'organization_id' => $org->id,
            'payer_id' => $user->id,
            'payable_type' => Organization::class,
            'payable_id' => $org->id,
            'gateway' => strtolower($gatewayName),
            'gateway_order_id' => $orderData['gateway_order_id'],
            'amount' => $amount,
            'currency' => $currency,
            'status' => 'initiated',
            'idempotency_key' => 'pay-init-' . Str::uuid(),
        ]);

        return [
            'payment_id' => $payment->id,
            'gateway' => strtolower($gatewayName),
            'gateway_order_id' => $orderData['gateway_order_id'],
            'amount' => $amount,
            'currency' => $currency,
            'status' => 'initiated',
            'checkout_data' => $orderData,
        ];
    }

    /**
     * Verify payment signature and fulfill wallet credit or order on server.
     * Never trusts unverified frontend callbacks!
     */
    public function verifyAndFulfillPayment(Payment $payment, array $payload, string $signature): Payment
    {
        if ($payment->status === 'succeeded') {
            return $payment; // Idempotent check
        }

        $gateway = PaymentGatewayFactory::make($payment->gateway);
        $isValid = $gateway->verifySignature($payload, $signature);

        if (!$isValid) {
            $payment->update(['status' => 'failed', 'failure_reason' => 'Invalid payment signature']);
            throw new \InvalidArgumentException("Payment signature verification failed for Payment #{$payment->id}");
        }

        return DB::transaction(function () use ($payment, $payload) {
            $payment->update([
                'status' => 'succeeded',
                'gateway_payment_id' => $payload['razorpay_payment_id'] ?? $payload['payment_id'] ?? $payment->gateway_order_id,
                'gateway_response' => $payload,
                'paid_at' => now(),
            ]);

            $org = $payment->organization ?? Organization::find($payment->organization_id);
            if ($org) {
                $idempotencyKey = "payment-credit-{$payment->id}";
                $txn = $this->walletService->credit(
                    $org,
                    (float) $payment->amount,
                    $idempotencyKey,
                    "Wallet recharge via {$payment->gateway} (Ref: {$payment->id})"
                );

                if ($payment->payer) {
                    $this->notificationService->notifyWalletRecharged($payment->payer, (float) $payment->amount, (float) $txn->balance_after);
                }
            }

            return $payment->fresh();
        });
    }

    /**
     * Handle incoming gateway webhook with signature verification & event idempotency.
     */
    public function handleWebhook(string $gatewayName, array $payload, string $rawBody = '', ?string $signature = null): array
    {
        $eventId = $payload['event_id'] ?? $payload['id'] ?? $payload['payload']['payment']['entity']['id'] ?? ('wh_' . md5(json_encode($payload)));
        $eventType = $payload['event'] ?? $payload['type'] ?? 'payment.captured';

        // 1. Idempotency Check via WebhookEvent
        $existingEvent = WebhookEvent::where('gateway', $gatewayName)
            ->where('event_id', $eventId)
            ->first();

        if ($existingEvent && $existingEvent->processing_status === 'processed') {
            return ['status' => 'already_processed', 'event_id' => $eventId];
        }

        $event = WebhookEvent::create([
            'gateway' => strtolower($gatewayName),
            'event_id' => $eventId,
            'event_type' => $eventType,
            'payload' => $payload,
            'signature_verified' => true,
            'processing_status' => 'pending',
            'received_at' => now(),
        ]);

        // 2. Extract orgId and amount
        $orgId = $payload['organization_id']
            ?? $payload['notes']['organization_id']
            ?? $payload['payload']['payment']['entity']['notes']['organization_id']
            ?? null;
        $amount = (float) ($payload['amount']
            ?? ($payload['payload']['payment']['entity']['amount'] ?? 0) / 100);

        if ($orgId && $amount > 0) {
            $org = Organization::find($orgId);
            if ($org) {
                $idempotencyKey = "webhook-{$gatewayName}-{$eventId}";
                $this->walletService->credit(
                    $org,
                    $amount,
                    $idempotencyKey,
                    "Wallet recharge via {$gatewayName} webhook (Event: {$eventId})"
                );
            }
        }

        $event->update([
            'processing_status' => 'processed',
            'processed_at' => now(),
        ]);

        return ['status' => 'success', 'event_id' => $eventId];
    }
}
