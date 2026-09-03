<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Wallet::with([
            'organization:id,name,slug,brand_name,status,credit_limit'
        ]);

        if ($request->filled('search')) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('id', 'like', $s)
                  ->orWhereHas('organization', function ($oq) use ($s) {
                      $oq->where('name', 'like', $s)->orWhere('slug', 'like', $s);
                  });
            });
        }

        return response()->json($query->latest('updated_at')->paginate($request->per_page ?? 25));
    }

    public function show(string $orgId): JsonResponse
    {
        $wallet = Wallet::with('organization')
            ->where('organization_id', $orgId)
            ->orWhere('id', $orgId)
            ->firstOrFail();

        return response()->json(['data' => $wallet]);
    }

    public function adjust(Request $request, string $orgId): JsonResponse
    {
        $request->validate([
            'type' => ['required', 'in:credit,debit'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string'],
        ]);

        $wallet = Wallet::where('organization_id', $orgId)
            ->orWhere('id', $orgId)
            ->first();

        if (!$wallet) {
            $wallet = Wallet::create([
                'organization_id' => $orgId,
                'available_balance' => 0,
                'reserved_balance' => 0,
                'credit_limit' => 0,
                'currency' => 'INR',
                'status' => 'active',
            ]);
        }

        $amount = (float) $request->amount;
        $balanceBefore = (float) $wallet->available_balance;

        if ($request->type === 'debit') {
            $spendable = (float) $wallet->available_balance + (float) $wallet->credit_limit;
            if ($spendable < $amount) {
                return response()->json([
                    'message' => 'Insufficient wallet balance. Available: ₹' . number_format($wallet->available_balance, 2) . ', Spendable reserve: ₹' . number_format($spendable, 2) . '.',
                ], 422);
            }
            $wallet->decrement('available_balance', $amount);
        } else {
            $wallet->increment('available_balance', $amount);
        }

        $wallet->last_transaction_at = now();
        $wallet->save();
        $balanceAfter = (float) $wallet->available_balance;

        // Record transaction in immutable ledger
        try {
            \App\Models\WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => $request->type === 'credit' ? 'credit' : 'debit',
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'currency' => $wallet->currency ?? 'INR',
                'idempotency_key' => 'adm_adj_' . \Illuminate\Support\Str::uuid(),
                'description' => $request->description ?: 'Admin manual balance adjustment (' . ucfirst($request->type) . ')',
                'created_by' => $request->user()?->id,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Ledger write notice should not break transaction response
        }

        return response()->json([
            'message' => "Wallet successfully {$request->type}ed with ₹" . number_format($amount, 2) . '.',
            'data' => $wallet->fresh(['organization']),
        ]);
    }
}
