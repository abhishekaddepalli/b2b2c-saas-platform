<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Offer extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'offers';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'image_path',
        'type',
        'discount_value',
        'max_discount_amount',
        'min_order_amount',
        'buy_quantity',
        'get_quantity',
        'usage_limit',
        'per_user_limit',
        'used_count',
        'audience',
        'starts_at',
        'ends_at',
        'status',
        'is_featured',
        'priority',
        'created_by',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'max_discount_amount' => 'decimal:2',
        'min_order_amount' => 'decimal:2',
        'buy_quantity' => 'integer',
        'get_quantity' => 'integer',
        'usage_limit' => 'integer',
        'per_user_limit' => 'integer',
        'used_count' => 'integer',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'is_featured' => 'boolean',
        'priority' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function coupons(): HasMany
    {
        return $this->hasMany(Coupon::class, 'offer_id');
    }
}
