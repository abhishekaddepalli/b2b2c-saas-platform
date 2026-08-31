<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
class CustomPrice extends Model {
    use HasUuids, SoftDeletes;
    protected $fillable = ['priceable_type','priceable_id','scope_type','scope_id','scope_label','override_price','override_markup_pct','currency','starts_at','ends_at','is_active','created_by'];
    protected $casts = ['override_price'=>'decimal:2','override_markup_pct'=>'decimal:4','is_active'=>'boolean','starts_at'=>'datetime','ends_at'=>'datetime'];
    public function priceable(): MorphTo { return $this->morphTo(); }
}
