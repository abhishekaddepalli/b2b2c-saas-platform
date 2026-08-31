<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
class Subcategory extends Model {
    use HasUuids, SoftDeletes;
    protected $fillable = ['category_id','name','slug','description','icon','image_path','status','sort_order'];
    protected static function boot(): void {
        parent::boot();
        static::creating(fn($m) => $m->slug = $m->slug ?: Str::slug($m->name));
    }
    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
}
