<?php

namespace App\Http\Controllers\Api\V1\Reseller;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->getOrganization()?->id;

        $query = Subscription::where('organization_id', $orgId)
            ->with(['customer', 'servicePlan']);

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('id', 'like', "%{$s}%")
                  ->orWhereHas('customer', function ($cq) use ($s) {
                      $cq->where('name', 'like', "%{$s}%")
                         ->orWhere('email', 'like', "%{$s}%");
                  })
                  ->orWhereHas('servicePlan', function ($pq) use ($s) {
                      $pq->where('name', 'like', "%{$s}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $subs = $query->latest('created_at')->paginate($request->per_page ?? 20);

        return response()->json($subs);
    }
}
