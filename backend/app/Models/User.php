<?php

namespace App\Models;

use App\Traits\HasAuditLog;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, HasUuids, SoftDeletes, HasAuditLog;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'status',
        'current_organization_id',
        'avatar_path',
        'timezone',
        'locale',
        'metadata',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'two_factor_confirmed_at' => 'datetime',
        'last_login_at' => 'datetime',
        'password' => 'hashed',
        'metadata' => 'array',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class, 'organization_users')
            ->withPivot(['role_within_org', 'status', 'joined_at', 'permissions_override'])
            ->withTimestamps();
    }

    public function currentOrganization()
    {
        return $this->belongsTo(Organization::class, 'current_organization_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'customer_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'customer_id');
    }

    public function supportTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class, 'customer_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'actor_id');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('SUPER_ADMIN');
    }

    public function isReseller(): bool
    {
        return $this->hasRole('RESELLER');
    }

    public function isCustomer(): bool
    {
        return $this->hasRole('USER');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function getPricingRole(): string
    {
        if ($this->isSuperAdmin()) return 'admin';
        if ($this->isReseller()) return 'reseller';
        return 'customer';
    }

    public function getOrganization(): ?Organization
    {
        if ($this->current_organization_id) {
            return $this->currentOrganization;
        }
        return $this->organizations()->wherePivot('status', 'active')->first();
    }

    public function markLoginActivity(string $ip, string $userAgent): void
    {
        $this->update([
            'last_login_at' => now(),
            'last_login_ip' => $ip,
            'last_login_user_agent' => $userAgent,
        ]);
    }
}
