<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Advertisement extends Model {
    use HasUuids, SoftDeletes;
    protected $fillable = ['title','description','image_path','cta_text','cta_url','placement','audience','target_org_id','priority','start_at','end_at','status','impression_count','click_count','created_by'];
    protected $casts = ['start_at'=>'datetime','end_at'=>'datetime'];
    public function scopeActive($q) {
        return $q->where('status','active')
            ->where(fn($q) => $q->whereNull('start_at')->orWhere('start_at','<=',now()))
            ->where(fn($q) => $q->whereNull('end_at')->orWhere('end_at','>=',now()));
    }
}
