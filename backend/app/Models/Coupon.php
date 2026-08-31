<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Coupon extends Model {
    use HasUuids, SoftDeletes;
    protected $fillable = ['offer_id','code','description','type','value','max_discount_amount','min_order_amount','usage_limit','per_user_limit','used_count','starts_at','ends_at','status','created_by'];
    protected $casts = ['value'=>'decimal:2','max_discount_amount'=>'decimal:2','min_order_amount'=>'decimal:2','starts_at'=>'datetime','ends_at'=>'datetime'];
    public function isValid(float $orderAmount = 0): bool {
        if ($this->status !== 'active') return false;
        if ($this->starts_at && $this->starts_at->isFuture()) return false;
        if ($this->ends_at && $this->ends_at->isPast()) return false;
        if ($this->usage_limit && $this->used_count >= $this->usage_limit) return false;
        if ($orderAmount < $this->min_order_amount) return false;
        return true;
    }
}
