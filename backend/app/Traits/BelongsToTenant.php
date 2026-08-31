<?php

namespace App\Traits;

use App\Scopes\TenantScope;
use Illuminate\Support\Facades\Auth;

/**
 * BelongsToTenant
 *
 * Apply to any model that must be tenant-isolated.
 * Automatically adds a global query scope that filters by the authenticated
 * user's organization, so tenant data never leaks across orgs.
 *
 * Super Admin bypasses the scope entirely.
 * Models can temporarily bypass with: Model::withoutTenantScope()->...
 */
trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope());

        // Auto-fill organization_id on create from auth context
        static::creating(function ($model) {
            if (empty($model->organization_id) && Auth::check()) {
                $user = Auth::user();
                if (!$user->isSuperAdmin()) {
                    $model->organization_id = $user->getOrganization()?->id;
                }
            }
        });
    }

    public static function withoutTenantScope()
    {
        return static::withoutGlobalScope(TenantScope::class);
    }
}
