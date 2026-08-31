<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrganizationWebhookSubscription extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'organization_id',
        'target_url',
        'secret',
        'events',
        'status',
    ];

    protected $casts = [
        'events' => 'array',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
