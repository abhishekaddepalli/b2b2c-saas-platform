<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
class Category extends Model {
    use HasUuids, SoftDeletes;
    protected $fillable = ['name','slug','description','icon','image_path','type','status','featured','sort_order','metadata'];
    protected $casts = ['featured'=>'boolean','metadata'=>'array'];
    protected static function boot(): void {
        parent::boot();
        static::creating(fn($m) => $m->slug = $m->slug ?: Str::slug($m->name));
    }
    public function subcategories(): HasMany { return $this->hasMany(Subcategory::class); }
    public function products(): HasMany { return $this->hasMany(Product::class); }
    public function services(): HasMany { return $this->hasMany(Service::class); }
}
