<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrganizationSaasSubscription extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'organization_id',
        'saas_plan_id',
        'billing_interval',
        'status',
        'trial_ends_at',
        'current_period_start',
        'current_period_end',
        'next_billing_at',
        'grace_period_ends_at',
        'cancelled_at',
        'cancellation_reason',
        'price_paid',
        'currency',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
        'next_billing_at' => 'datetime',
        'grace_period_ends_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'price_paid' => 'float',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function plan()
    {
        return $this->belongsTo(SaasPlan::class, 'saas_plan_id');
    }

    public function isTrialing(): bool
    {
        return $this->status === 'trialing' && $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    public function isActive(): bool
    {
        return in_array($this->status, ['trialing', 'active', 'grace_period']);
    }
}
