<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
class WebhookEvent extends Model {
    use HasUuids;
    public const UPDATED_AT = null;
    protected $fillable = ['gateway','event_id','event_type','payload','signature_verified','processing_status','processing_error','processing_attempts','processed_at','received_at'];
    protected $casts = ['payload'=>'array','signature_verified'=>'boolean','processed_at'=>'datetime','received_at'=>'datetime','created_at'=>'datetime'];
}
