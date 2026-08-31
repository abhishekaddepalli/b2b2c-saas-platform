<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class PaymentTransaction extends Model {
    public const UPDATED_AT = null;
    protected $fillable = ['payment_id','action','status','request_payload','response_payload','gateway_transaction_id','error_message','amount'];
    protected $casts = ['request_payload'=>'array','response_payload'=>'array','amount'=>'decimal:2','created_at'=>'datetime'];
    public function payment(): BelongsTo { return $this->belongsTo(Payment::class); }
}
