<?php

namespace App\Models;

use App\Traits\HasAuditLog;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    use HasFactory, HasUuids, SoftDeletes, HasAuditLog;

    protected $fillable = [
        'name',
        'slug',
        'type',
        'status',
        'brand_name',
        'logo_path',
        'favicon_path',
        'primary_color',
        'secondary_color',
        'custom_domain',
        'support_email',
        'support_phone',
        'invoice_logo_path',
        'email_logo_path',
        'footer_text',
        'custom_css',
        'gstin',
        'pan',
        'address',
        'city',
        'state',
        'country',
        'pincode',
        'credit_limit',
        'currency',
        'wallet_enabled',
        'white_label_enabled',
        'custom_domain_enabled',
        'onboarding_status',
        'rejection_reason',
        'kyc_documents',
        'pricing_tier',
        'min_wallet_balance',
        'auto_recharge_threshold',
        'terms_accepted_at',
        'terms_accepted_ip',
        'onboarding_checklist',
        'approved_at',
        'approved_by',
        'parent_id',
        'metadata',
    ];

    protected $casts = [
        'wallet_enabled' => 'boolean',
        'white_label_enabled' => 'boolean',
        'custom_domain_enabled' => 'boolean',
        'credit_limit' => 'decimal:2',
        'min_wallet_balance' => 'decimal:2',
        'auto_recharge_threshold' => 'decimal:2',
        'kyc_documents' => 'array',
        'onboarding_checklist' => 'array',
        'terms_accepted_at' => 'datetime',
        'approved_at' => 'datetime',
        'metadata' => 'array',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_users')
            ->withPivot(['role_within_org', 'status', 'joined_at'])
            ->withTimestamps();
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(Wallet::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function profitRecords(): HasMany
    {
        return $this->hasMany(ProfitRecord::class);
    }

    public function customPrices(): HasMany
    {
        return $this->hasMany(CustomPrice::class, 'scope_id')
            ->where('scope_type', 'reseller');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isPlatform(): bool
    {
        return $this->type === 'platform';
    }

    public function isReseller(): bool
    {
        return $this->type === 'reseller';
    }

    public function getDisplayName(): string
    {
        return $this->brand_name ?: $this->name;
    }
}
