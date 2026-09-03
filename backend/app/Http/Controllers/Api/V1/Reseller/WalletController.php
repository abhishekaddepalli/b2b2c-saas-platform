<?php

namespace App\Http\Controllers\Api\V1\Reseller;

use App\Http\Controllers\Controller;
use App\Services\Wallet\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function __construct(private readonly WalletService $walletService) {}

    private function ensureOrgAccess($user, $org): void
    {
        if (!$user || (!$user->isSuperAdmin() && $user->getOrganization()?->id !== $org?->id)) {
            abort(403, 'Unauthorized access to organization wallet.');
        }
    }

    public function show(Request $request): JsonResponse
    {
        $org = $request->user()->getOrganization();
        $this->ensureOrgAccess($request->user(), $org);

        $wallet = $org->wallet()->firstOrCreate(
            ['organization_id' => $org->id],
            ['currency' => $org->currency ?? 'INR', 'status' => 'active']
        );

        $balance = $this->walletService->getBalance($org);

        return response()->json([
            'data' => [
                'wallet_id' => $wallet->id,
                'organization_id' => $org->id,
                'available_balance' => $balance->available,
                'reserved_balance' => $balance->reserved,
                'credit_limit' => $balance->creditLimit,
                'spendable' => $balance->spendable(),
                'currency' => $balance->currency,
                'status' => $wallet->status,
                'last_transaction_at' => $wallet->last_transaction_at?->toISOString(),
            ],
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $org = $request->user()->getOrganization();
        $this->ensureOrgAccess($request->user(), $org);

        $wallet = $org->wallet;
        if (!$wallet) {
            return response()->json(['data' => [], 'meta' => ['total' => 0]]);
        }

        $transactions = $wallet->transactions()
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->when($request->from, fn($q) => $q->where('created_at', '>=', $request->from))
            ->when($request->to, fn($q) => $q->where('created_at', '<=', $request->to))
            ->paginate($request->per_page ?? 20);

        return response()->json($transactions);
    }

    /**
     * Initiate a recharge — creates a payment intent.
     */
    public function initiateRecharge(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:1000000'],
            'gateway' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $org = $user->getOrganization();
        if (!$org && $user->isSuperAdmin()) {
            $org = \App\Models\Organization::where('id', $request->organization_id)->first() ?? \App\Models\Organization::first();
        }

        if (!$org) {
            return response()->json(['message' => 'No active organization linked to this account.'], 422);
        }

        $gateway = $request->gateway ?: 'razorpay';
        $amount = (float) $request->amount;

        $paymentService = app(\App\Services\Payment\PaymentService::class);
        $result = $paymentService->initiateWalletRecharge($org, $user, $amount, $gateway);

        // Include configured Razorpay key ID for client-side modal checkout
        $result['key_id'] = config('services.razorpay.key_id') ?: env('RAZORPAY_KEY_ID', 'rzp_test_mock_key');

        return response()->json([
            'message' => 'Payment initiated successfully.',
            'data' => $result,
        ]);
    }

    /**
     * Fulfill recharge after client checkout or in demo/test mode.
     */
    public function fulfillRecharge(Request $request): JsonResponse
    {
        $request->validate([
            'payment_id' => ['required', 'string'],
            'razorpay_payment_id' => ['nullable', 'string'],
            'razorpay_order_id' => ['nullable', 'string'],
            'razorpay_signature' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $payment = \App\Models\Payment::where('id', $request->payment_id)->firstOrFail();
        $org = $payment->organization ?? $user->getOrganization();

        $this->ensureOrgAccess($user, $org);

        $paymentService = app(\App\Services\Payment\PaymentService::class);

        $payload = [
            'razorpay_payment_id' => $request->razorpay_payment_id ?: 'pay_' . \Illuminate\Support\Str::random(14),
            'razorpay_order_id' => $request->razorpay_order_id ?: $payment->gateway_order_id,
        ];
        $signature = $request->razorpay_signature ?: 'valid_mock_signature';

        $updatedPayment = $paymentService->verifyAndFulfillPayment($payment, $payload, $signature);

        $balance = $this->walletService->getBalance($org);

        return response()->json([
            'message' => 'Wallet recharge credited successfully!',
            'data' => [
                'payment_id' => $updatedPayment->id,
                'status' => $updatedPayment->status,
                'amount_credited' => $updatedPayment->amount,
                'available_balance' => $balance->available,
                'spendable' => $balance->spendable(),
            ],
        ]);
    }
}
