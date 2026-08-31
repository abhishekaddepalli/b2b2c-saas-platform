<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'organization_id',
        'available_balance',
        'reserved_balance',
        'credit_limit',
        'currency',
        'status',
        'last_transaction_at',
    ];

    protected $casts = [
        'available_balance' => 'decimal:2',
        'reserved_balance' => 'decimal:2',
        'credit_limit' => 'decimal:2',
        'last_transaction_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class)->latest('created_at');
    }

    public function getSpendableBalance(): float
    {
        return (float) $this->available_balance + (float) $this->credit_limit;
    }

    public function canDebit(float $amount): bool
    {
        return $this->status === 'active' && $this->getSpendableBalance() >= $amount;
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
