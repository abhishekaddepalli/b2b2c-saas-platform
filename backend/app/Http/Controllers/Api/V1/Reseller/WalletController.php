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
     * Wallet is ONLY credited via the webhook callback, never here.
     */
    public function initiateRecharge(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:1000000'],
            'gateway' => ['required', 'in:razorpay,phonepe,cashfree,stripe'],
        ]);

        $org = $request->user()->getOrganization();
        $this->ensureOrgAccess($request->user(), $org);

        $paymentService = app(\App\Services\Payment\PaymentService::class);
        $result = $paymentService->initiateWalletRecharge($org, $request->amount, $request->gateway);

        return response()->json([
            'message' => 'Payment initiated. Complete payment to credit wallet.',
            'data' => $result,
        ]);
    }
}
