<?php
namespace App\Models;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
class SupportTicket extends Model {
    use HasUuids, SoftDeletes, BelongsToTenant;
    protected $fillable = ['ticket_number','organization_id','customer_id','assigned_to','subject','description','priority','status','channel','related_type','related_id','first_response_at','resolved_at','closed_at','tags'];
    protected $casts = ['tags'=>'array','first_response_at'=>'datetime','resolved_at'=>'datetime','closed_at'=>'datetime'];
    protected static function boot(): void {
        parent::boot();
        static::creating(fn($m) => $m->ticket_number = $m->ticket_number ?: 'TKT-'.strtoupper(Str::random(8)));
    }
    public function customer(): BelongsTo { return $this->belongsTo(User::class,'customer_id'); }
    public function assignee(): BelongsTo { return $this->belongsTo(User::class,'assigned_to'); }
    public function messages(): HasMany { return $this->hasMany(SupportMessage::class,'ticket_id')->latest(); }
}
