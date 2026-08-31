<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class InvoiceItem extends Model {
    use HasUuids;
    protected $fillable = ['invoice_id','description','quantity','unit_price','discount','tax_rate','tax_amount','total'];
    protected $casts = ['unit_price'=>'decimal:2','discount'=>'decimal:2','tax_rate'=>'decimal:4','tax_amount'=>'decimal:2','total'=>'decimal:2'];
    public function invoice(): BelongsTo { return $this->belongsTo(Invoice::class); }
}
