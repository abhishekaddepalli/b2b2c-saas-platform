<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
class ServicePlan extends Model {
    use HasUuids, SoftDeletes;
    protected $fillable = ['service_id','name','slug','description','features','status','is_popular','sort_order'];
    protected $casts = ['features'=>'array','is_popular'=>'boolean'];
    public function service(): BelongsTo { return $this->belongsTo(Service::class); }
    public function prices(): MorphMany { return $this->morphMany(Price::class,'priceable'); }
    public function subscriptions(): HasMany { return $this->hasMany(Subscription::class); }
    public function activePrice(): MorphMany { return $this->morphMany(Price::class,'priceable')->where('is_active',true); }
}
