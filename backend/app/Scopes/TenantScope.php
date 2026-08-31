<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        // Super Admins see everything — no scope applied
        if (!Auth::check() || Auth::user()->isSuperAdmin()) {
            return;
        }

        $orgId = Auth::user()->getOrganization()?->id;

        if ($orgId) {
            $builder->where($model->getTable() . '.organization_id', $orgId);
        } else {
            // User has no org — see nothing (failsafe: impossible match)
            $builder->whereRaw('1 = 0');
        }
    }
}
