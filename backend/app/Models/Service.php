<?php
namespace App\Models;
use App\Traits\HasAuditLog;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
class Service extends Model {
    use HasUuids, SoftDeletes, HasAuditLog;
    protected $fillable = ['slug','category_id','subcategory_id','name','short_description','full_description','icon','status','visibility','featured','billing_type','billing_interval','billing_interval_count','trial_days','grace_period_days','auto_renewal_default','suspension_rules','tags','metadata','sort_order'];
    protected $casts = ['featured'=>'boolean','auto_renewal_default'=>'boolean','tags'=>'array','suspension_rules'=>'array','metadata'=>'array'];
    protected static function boot(): void {
        parent::boot();
        static::creating(fn($m) => $m->slug = $m->slug ?: Str::slug($m->name));
    }
    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
    public function plans(): HasMany { return $this->hasMany(ServicePlan::class); }
    public function features(): HasMany { return $this->hasMany(ServiceFeature::class)->orderBy('sort_order'); }
    public function prices(): MorphMany { return $this->morphMany(Price::class,'priceable'); }
    public function scopePublic($q) { return $q->where('status','active')->where('visibility','public'); }
    public function scopeResellerVisible($q) { return $q->where('status','active')->whereIn('visibility',['public','reseller_only']); }
}
