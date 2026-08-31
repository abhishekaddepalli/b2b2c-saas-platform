<?php
namespace App\Models;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
class Invoice extends Model {
    use HasUuids, SoftDeletes, BelongsToTenant;
    protected $fillable = [
        'invoice_number','organization_id','customer_id','order_id','subscription_id',
        'type','status','currency',
        'subtotal','discount_total','tax_total','grand_total','amount_paid','amount_due',
        'billing_details','seller_details','pdf_path','issued_at','due_at','paid_at','notes',
    ];
    protected $casts = [
        'subtotal' => 'decimal:2','discount_total' => 'decimal:2','tax_total' => 'decimal:2',
        'grand_total' => 'decimal:2','amount_paid' => 'decimal:2','amount_due' => 'decimal:2',
        'billing_details' => 'array','seller_details' => 'array',
        'issued_at' => 'datetime','due_at' => 'datetime','paid_at' => 'datetime',
    ];
    public function organization(): BelongsTo { return $this->belongsTo(Organization::class); }
    public function customer(): BelongsTo { return $this->belongsTo(User::class, 'customer_id'); }
    public function items(): HasMany { return $this->hasMany(InvoiceItem::class); }
}
