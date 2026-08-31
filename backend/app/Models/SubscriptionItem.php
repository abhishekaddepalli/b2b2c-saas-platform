<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
class SubscriptionItem extends Model {
    use HasUuids;
    protected $fillable = ['subscription_id','itemable_type','itemable_id','name','quantity','unit_price','cost_price_snapshot','reseller_price_snapshot','customer_price_snapshot'];
    protected $casts = ['unit_price'=>'decimal:2','cost_price_snapshot'=>'decimal:2','reseller_price_snapshot'=>'decimal:2','customer_price_snapshot'=>'decimal:2'];
    public function subscription(): BelongsTo { return $this->belongsTo(Subscription::class); }
    public function itemable(): MorphTo { return $this->morphTo(); }
}
