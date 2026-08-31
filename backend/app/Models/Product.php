<?php

namespace App\Models;

use App\Traits\HasAuditLog;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory, HasUuids, SoftDeletes, HasAuditLog;

    protected $fillable = [
        'sku',
        'slug',
        'category_id',
        'subcategory_id',
        'name',
        'short_description',
        'full_description',
        'type',
        'status',
        'visibility',
        'featured',
        'stock_quantity',
        'track_stock',
        'weight',
        'tags',
        'specifications',
        'metadata',
        'sort_order',
    ];

    protected $casts = [
        'featured' => 'boolean',
        'track_stock' => 'boolean',
        'tags' => 'array',
        'specifications' => 'array',
        'metadata' => 'array',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function (Product $product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
            if (empty($product->sku)) {
                $product->sku = 'PRD-' . strtoupper(Str::random(8));
            }
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(Subcategory::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function features(): HasMany
    {
        return $this->hasMany(ProductFeature::class)->orderBy('sort_order');
    }

    public function prices(): MorphMany
    {
        return $this->morphMany(Price::class, 'priceable');
    }

    public function activePrice(): MorphMany
    {
        return $this->morphMany(Price::class, 'priceable')
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('effective_from')->orWhere('effective_from', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('effective_to')->orWhere('effective_to', '>=', now());
            });
    }

    public function customPrices(): MorphMany
    {
        return $this->morphMany(CustomPrice::class, 'priceable');
    }

    public function getPrimaryImageAttribute(): ?string
    {
        return $this->images->firstWhere('is_primary', true)?->path
            ?? $this->images->first()?->path;
    }

    public function isAvailable(): bool
    {
        return $this->status === 'active'
            && ($this->stock_quantity === null || $this->stock_quantity > 0);
    }

    public function scopePublic($query)
    {
        return $query->where('status', 'active')->where('visibility', 'public');
    }

    public function scopeResellerVisible($query)
    {
        return $query->where('status', 'active')
            ->whereIn('visibility', ['public', 'reseller_only']);
    }

    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }
}
