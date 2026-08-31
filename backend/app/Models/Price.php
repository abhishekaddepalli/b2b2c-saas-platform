<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Price extends Model
{
    use HasUuids;

    protected $fillable = [
        'priceable_type',
        'priceable_id',
        'pricing_type',
        'currency',
        'cost_price',
        'reseller_price',
        'customer_price',
        'reseller_markup_pct',
        'customer_markup_pct',
        'tax_rate',
        'tax_label',
        'tax_inclusive',
        'effective_from',
        'effective_to',
        'is_active',
    ];

    protected $casts = [
        'cost_price'          => 'decimal:2',
        'reseller_price'      => 'decimal:2',
        'customer_price'      => 'decimal:2',
        'reseller_markup_pct' => 'decimal:4',
        'customer_markup_pct' => 'decimal:4',
        'tax_rate'            => 'decimal:4',
        'tax_inclusive'       => 'boolean',
        'is_active'           => 'boolean',
        'effective_from'      => 'datetime',
        'effective_to'        => 'datetime',
    ];

    public function priceable(): MorphTo
    {
        return $this->morphTo();
    }

    public function tierPrices(): HasMany
    {
        return $this->hasMany(TierPrice::class)->orderBy('min_qty');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(fn($q) => $q->whereNull('effective_from')->orWhere('effective_from', '<=', now()))
            ->where(fn($q) => $q->whereNull('effective_to')->orWhere('effective_to', '>=', now()));
    }
}
