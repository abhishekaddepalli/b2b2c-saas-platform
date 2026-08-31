<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class WalletTransaction extends Model
{
    use HasUuids;

    // This table is immutable — no updates allowed after insert
    public const UPDATED_AT = null;

    protected $fillable = [
        'wallet_id',
        'type',
        'amount',
        'balance_before',
        'balance_after',
        'currency',
        'reference_type',
        'reference_id',
        'idempotency_key',
        'description',
        'metadata',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public static array $types = [
        'credit',
        'debit',
        'refund',
        'reversal',
        'adjustment',
        'reservation',
        'release',
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isCredit(): bool
    {
        return in_array($this->type, ['credit', 'refund', 'reversal', 'release']);
    }

    public function isDebit(): bool
    {
        return in_array($this->type, ['debit', 'reservation']);
    }

    // Prevent updates to the immutable ledger
    public function save(array $options = []): bool
    {
        if (!$this->exists) {
            return parent::save($options);
        }
        throw new \RuntimeException('Wallet transactions are immutable and cannot be updated.');
    }
}
