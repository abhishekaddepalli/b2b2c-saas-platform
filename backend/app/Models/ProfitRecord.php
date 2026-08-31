<?php
namespace App\Models;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
class ProfitRecord extends Model {
    use HasUuids, BelongsToTenant;
    protected $fillable = ['organization_id','order_item_id','subscription_invoice_item_id','customer_id','currency','platform_revenue','platform_cost','platform_gross_profit','reseller_revenue','reseller_profit','total_revenue','margin_pct','recorded_at'];
    protected $casts = ['platform_revenue'=>'decimal:2','platform_cost'=>'decimal:2','platform_gross_profit'=>'decimal:2','reseller_revenue'=>'decimal:2','reseller_profit'=>'decimal:2','total_revenue'=>'decimal:2','margin_pct'=>'decimal:4','recorded_at'=>'datetime'];
}
