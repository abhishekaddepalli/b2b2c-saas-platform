<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
class OrderItem extends Model {
    use HasUuids;
    protected $fillable = ['order_id','orderable_type','orderable_id','name','sku','quantity','currency','cost_price_at_purchase','reseller_price_at_purchase','customer_price_at_purchase','unit_price','discount_at_purchase','tax_rate_at_purchase','tax_at_purchase','final_price_at_purchase','options','metadata'];
    protected $casts = ['cost_price_at_purchase'=>'decimal:2','reseller_price_at_purchase'=>'decimal:2','customer_price_at_purchase'=>'decimal:2','unit_price'=>'decimal:2','discount_at_purchase'=>'decimal:2','tax_at_purchase'=>'decimal:2','final_price_at_purchase'=>'decimal:2','tax_rate_at_purchase'=>'decimal:4','options'=>'array','metadata'=>'array'];
    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function orderable(): MorphTo { return $this->morphTo(); }
}
