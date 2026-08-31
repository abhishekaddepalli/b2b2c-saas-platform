<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\HasAuditLog;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subscription extends Model
{
    use HasUuids, SoftDeletes, BelongsToTenant, HasAuditLog;

    protected $fillable = [
        'organization_id','customer_id','service_plan_id','order_id',
        'status','currency','amount',
        'cost_price_snapshot','reseller_price_snapshot','customer_price_snapshot',
        'billing_interval','billing_interval_count','auto_renew',
        'trial_ends_at','current_period_start','current_period_end','next_billing_at',
        'grace_period_days','max_retry_count','retry_count','next_retry_at',
        'activated_at','suspended_at','cancelled_at','ended_at','cancellation_reason',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'cost_price_snapshot' => 'decimal:2',
        'reseller_price_snapshot' => 'decimal:2',
        'customer_price_snapshot' => 'decimal:2',
        'auto_renew' => 'boolean',
        'trial_ends_at' => 'datetime',
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
        'next_billing_at' => 'datetime',
        'next_retry_at' => 'datetime',
        'activated_at' => 'datetime',
        'suspended_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'ended_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function organization(): BelongsTo { return $this->belongsTo(Organization::class); }
    public function customer(): BelongsTo { return $this->belongsTo(User::class, 'customer_id'); }
    public function servicePlan(): BelongsTo { return $this->belongsTo(ServicePlan::class); }
    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function items(): HasMany { return $this->hasMany(SubscriptionItem::class); }

    public function isActive(): bool { return $this->status === 'active'; }
    public function isInGrace(): bool { return $this->status === 'grace_period'; }
    public function isCancellable(): bool { return in_array($this->status, ['active','trial','grace_period']); }
}
