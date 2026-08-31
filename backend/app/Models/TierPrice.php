<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class TierPrice extends Model {
    protected $fillable = ['price_id','min_qty','max_qty','cost_price','reseller_price','customer_price'];
    protected $casts = ['cost_price'=>'decimal:2','reseller_price'=>'decimal:2','customer_price'=>'decimal:2'];
    public function price(): BelongsTo { return $this->belongsTo(Price::class); }
}
