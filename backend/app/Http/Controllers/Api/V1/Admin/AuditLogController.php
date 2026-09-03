<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with([
            'actor:id,name,email',
            'organization:id,name,slug'
        ]);

        if ($request->filled('search')) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('action', 'like', $s)
                  ->orWhere('resource_type', 'like', $s)
                  ->orWhere('resource_id', 'like', $s)
                  ->orWhere('ip_address', 'like', $s)
                  ->orWhereHas('actor', function ($aq) use ($s) {
                      $aq->where('name', 'like', $s)->orWhere('email', 'like', $s);
                  })
                  ->orWhereHas('organization', function ($oq) use ($s) {
                      $oq->where('name', 'like', $s)->orWhere('slug', 'like', $s);
                  });
            });
        }

        if ($request->filled('action')) {
            $query->where('action', 'like', $request->action . '%');
        }

        if ($request->filled('resource_type')) {
            $query->where('resource_type', 'like', '%' . $request->resource_type . '%');
        }

        if ($request->filled('actor_id')) {
            $query->where('actor_id', $request->actor_id);
        }

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $logs = $query->latest('created_at')->paginate($request->per_page ?? 25);

        // Enhance items with clean entity names and friendly metadata
        $logs->getCollection()->transform(function ($item) {
            $entityName = $item->resource_type ? class_basename($item->resource_type) : 'System';
            $item->entity_name = $entityName;
            $item->actor_display = $item->actor ? $item->actor->name : 'System Automated';
            $item->actor_email = $item->actor ? $item->actor->email : 'daemon@infiniforge.cloud';
            return $item;
        });

        return response()->json($logs);
    }

    public function show(string $id): JsonResponse
    {
        $log = AuditLog::with(['actor', 'organization'])->findOrFail($id);
        $log->entity_name = $log->resource_type ? class_basename($log->resource_type) : 'System';

        return response()->json([
            'data' => $log,
        ]);
    }

    public function stats(): JsonResponse
    {
        $totalLogs = AuditLog::count();
        $todayLogs = AuditLog::whereDate('created_at', today())->count();
        $uniqueActors = AuditLog::whereNotNull('actor_id')->distinct('actor_id')->count('actor_id');
        $uniqueIps = AuditLog::whereNotNull('ip_address')->distinct('ip_address')->count('ip_address');

        $topActions = AuditLog::select('action', DB::raw('count(*) as count'))
            ->groupBy('action')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        return response()->json([
            'data' => [
                'total_events' => $totalLogs,
                'today_events' => $todayLogs,
                'active_actors' => $uniqueActors,
                'unique_ips' => $uniqueIps,
                'top_actions' => $topActions,
            ],
        ]);
    }
}
