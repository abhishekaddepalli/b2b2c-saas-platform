<?php
namespace App\Models;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
class Payment extends Model {
    use HasUuids, BelongsToTenant;
    protected $fillable = [
        'organization_id','payer_id','payable_type','payable_id',
        'gateway','gateway_payment_id','gateway_order_id',
        'amount','currency','status','amount_refunded',
        'failure_reason','gateway_response','idempotency_key','paid_at',
    ];
    protected $casts = [
        'amount' => 'decimal:2',
        'amount_refunded' => 'decimal:2',
        'gateway_response' => 'array',
        'paid_at' => 'datetime',
    ];
    public function payer(): BelongsTo { return $this->belongsTo(User::class, 'payer_id'); }
    public function payable(): MorphTo { return $this->morphTo(); }
    public function transactions(): HasMany { return $this->hasMany(PaymentTransaction::class); }
}
