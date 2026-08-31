<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class SupportMessage extends Model {
    use HasUuids;
    protected $fillable = ['ticket_id','sender_id','sender_type','body','attachments','is_internal_note','read_at'];
    protected $casts = ['attachments'=>'array','is_internal_note'=>'boolean','read_at'=>'datetime'];
    public function ticket(): BelongsTo { return $this->belongsTo(SupportTicket::class); }
    public function sender(): BelongsTo { return $this->belongsTo(User::class,'sender_id'); }
}
