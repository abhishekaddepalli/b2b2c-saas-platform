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

        $subs = Subscription::where('organization_id', $orgId)
            ->with(['customer', 'servicePlan'])
            ->paginate($request->per_page ?? 20);

        return response()->json($subs);
    }
}
