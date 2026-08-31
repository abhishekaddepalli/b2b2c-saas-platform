<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait HasAuditLog
{
    public static function bootHasAuditLog(): void
    {
        static::created(fn ($model) => static::writeLog('created', $model, [], $model->toArray()));
        static::updated(fn ($model) => static::writeLog('updated', $model, $model->getOriginal(), $model->getChanges()));
        static::deleted(fn ($model) => static::writeLog('deleted', $model, $model->toArray(), []));
    }

    protected static function writeLog(string $action, $model, array $old, array $new): void
    {
        try {
            AuditLog::create([
                'actor_id' => Auth::id(),
                'organization_id' => $model->organization_id ?? null,
                'action' => strtolower(class_basename($model)) . '.' . $action,
                'resource_type' => get_class($model),
                'resource_id' => $model->getKey(),
                'old_values' => empty($old) ? null : $old,
                'new_values' => empty($new) ? null : $new,
                'ip_address' => Request::ip(),
                'user_agent' => Request::userAgent(),
            ]);
        } catch (\Throwable) {
            // Audit log failures must never break the main operation
        }
    }
}
