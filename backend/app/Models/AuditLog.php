<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasUuids;

    public const UPDATED_AT = null; // Immutable

    protected $fillable = [
        'actor_id',
        'organization_id',
        'action',
        'resource_type',
        'resource_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'context',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'context'    => 'array',
        'created_at' => 'datetime',
    ];

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function scopeForOrganization($query, string $orgId)
    {
        return $query->where('organization_id', $orgId);
    }

    public function scopeForAction($query, string $action)
    {
        return $query->where('action', 'like', $action . '%');
    }
}
