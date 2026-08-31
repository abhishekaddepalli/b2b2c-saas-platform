<?php

namespace App\Services\Wallet;

use App\Models\Organization;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Exceptions\InsufficientWalletBalanceException;
use App\Exceptions\WalletFrozenException;
use App\Exceptions\DuplicateTransactionException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class WalletService
{
    /**
     * Credit an organization's wallet.
     * Safe to retry — idempotency_key prevents double-credit.
     */
    public function credit(
        Organization $organization,
        float $amount,
        string $idempotencyKey,
        string $description = '',
        array $reference = [],
        ?string $createdBy = null,
        array $metadata = [],
    ): WalletTransaction {
        return $this->executeTransaction(
            organization: $organization,
            type: 'credit',
            amount: $amount,
            idempotencyKey: $idempotencyKey,
            description: $description,
            reference: $reference,
            createdBy: $createdBy,
            metadata: $metadata,
        );
    }

    /**
     * Debit an organization's wallet.
     * Throws InsufficientWalletBalanceException if balance < amount.
     * Safe to retry — idempotency_key prevents double-debit.
     */
    public function debit(
        Organization $organization,
        float $amount,
        string $idempotencyKey,
        string $description = '',
        array $reference = [],
        ?string $createdBy = null,
        array $metadata = [],
    ): WalletTransaction {
        return $this->executeTransaction(
            organization: $organization,
            type: 'debit',
            amount: $amount,
            idempotencyKey: $idempotencyKey,
            description: $description,
            reference: $reference,
            createdBy: $createdBy,
            metadata: $metadata,
        );
    }

    /**
     * Reverse a previous transaction (creates a new reversal entry, never mutates old row).
     */
    public function reverse(
        WalletTransaction $original,
        string $reason,
        ?string $createdBy = null,
    ): WalletTransaction {
        $reverseType = $original->isDebit() ? 'reversal' : 'debit';
        $idempotencyKey = 'reversal-' . $original->id;

        return $this->executeTransaction(
            organization: $original->wallet->organization,
            type: $reverseType,
            amount: (float) $original->amount,
            idempotencyKey: $idempotencyKey,
            description: "Reversal of txn #{$original->id}: {$reason}",
            reference: ['reference_type' => 'wallet_transaction', 'reference_id' => $original->id],
            createdBy: $createdBy,
            metadata: ['original_transaction_id' => $original->id, 'reason' => $reason],
        );
    }

    /**
     * Reserve funds (moves from available to reserved — doesn't leave the wallet).
     */
    public function reserve(
        Organization $organization,
        float $amount,
        string $idempotencyKey,
        string $description = '',
        array $reference = [],
    ): WalletTransaction {
        return $this->executeTransaction(
            organization: $organization,
            type: 'reservation',
            amount: $amount,
            idempotencyKey: $idempotencyKey,
            description: $description,
            reference: $reference,
        );
    }

    /**
     * Release previously reserved funds back to available balance.
     */
    public function release(
        Organization $organization,
        float $amount,
        string $idempotencyKey,
        string $description = '',
        array $reference = [],
    ): WalletTransaction {
        return $this->executeTransaction(
            organization: $organization,
            type: 'release',
            amount: $amount,
            idempotencyKey: $idempotencyKey,
            description: $description,
            reference: $reference,
        );
    }

    public function getBalance(Organization $organization): WalletBalance
    {
        $wallet = $this->getWallet($organization);
        return new WalletBalance(
            available: (float) $wallet->available_balance,
            reserved: (float) $wallet->reserved_balance,
            creditLimit: (float) $wallet->credit_limit,
            currency: $wallet->currency,
        );
    }

    public function ensureWalletExists(Organization $organization): Wallet
    {
        return $this->getWallet($organization);
    }

    // ─── Core execution ───────────────────────────────────────────────────────

    private function executeTransaction(
        Organization $organization,
        string $type,
        float $amount,
        string $idempotencyKey,
        string $description = '',
        array $reference = [],
        ?string $createdBy = null,
        array $metadata = [],
    ): WalletTransaction {
        if ($amount <= 0) {
            throw new \InvalidArgumentException("Transaction amount must be positive, got {$amount}");
        }

        return DB::transaction(function () use (
            $organization, $type, $amount, $idempotencyKey,
            $description, $reference, $createdBy, $metadata
        ) {
            // Lock the wallet row — prevents concurrent transactions from racing
            $wallet = Wallet::where('organization_id', $organization->id)
                ->lockForUpdate()
                ->firstOrCreate(
                    ['organization_id' => $organization->id],
                    ['currency' => $organization->currency ?? 'INR', 'status' => 'active']
                );

            if (!$wallet->isActive()) {
                throw new WalletFrozenException("Wallet for organization {$organization->id} is {$wallet->status}.");
            }

            // Debit/reservation: verify sufficient balance
            if (in_array($type, ['debit', 'reservation']) && !$wallet->canDebit($amount)) {
                throw new InsufficientWalletBalanceException(
                    "Insufficient balance. Available: {$wallet->available_balance}, Required: {$amount}"
                );
            }

            $balanceBefore = (float) $wallet->available_balance;
            $reservedBefore = (float) $wallet->reserved_balance;

            // Apply to wallet balances
            [$newAvailable, $newReserved] = $this->applyToBalances(
                $type, $amount, $balanceBefore, $reservedBefore
            );

            // Write ledger entry first (will throw on duplicate idempotency_key)
            try {
                $transaction = WalletTransaction::create([
                    'wallet_id' => $wallet->id,
                    'type' => $type,
                    'amount' => $amount,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $newAvailable,
                    'currency' => $wallet->currency,
                    'reference_type' => $reference['reference_type'] ?? null,
                    'reference_id' => $reference['reference_id'] ?? null,
                    'idempotency_key' => $idempotencyKey,
                    'description' => $description,
                    'metadata' => $metadata,
                    'created_by' => $createdBy,
                ]);
            } catch (QueryException $e) {
                if (str_contains($e->getMessage(), 'unique') || str_contains($e->getMessage(), 'duplicate')) {
                    throw new DuplicateTransactionException(
                        "Transaction with idempotency key '{$idempotencyKey}' already processed."
                    );
                }
                throw $e;
            }

            // Update wallet balances
            $wallet->update([
                'available_balance' => $newAvailable,
                'reserved_balance' => $newReserved,
                'last_transaction_at' => now(),
            ]);

            return $transaction;
        });
    }

    private function applyToBalances(string $type, float $amount, float $available, float $reserved): array
    {
        return match ($type) {
            'credit', 'refund', 'reversal', 'adjustment' => [$available + $amount, $reserved],
            'debit' => [$available - $amount, $reserved],
            'reservation' => [$available - $amount, $reserved + $amount],
            'release' => [$available + $amount, max(0, $reserved - $amount)],
            default => throw new \InvalidArgumentException("Unknown transaction type: {$type}"),
        };
    }

    private function getWallet(Organization $organization): Wallet
    {
        return Wallet::firstOrCreate(
            ['organization_id' => $organization->id],
            ['currency' => $organization->currency ?? 'INR', 'status' => 'active']
        );
    }
}
