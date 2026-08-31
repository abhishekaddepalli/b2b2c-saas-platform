<?php

namespace App\Http\Controllers\Api\V1\Reseller;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->getOrganization()?->id;

        $invoices = Invoice::where('organization_id', $orgId)
            ->with(['customer'])
            ->latest('issued_at')
            ->paginate($request->per_page ?? 20);

        return response()->json($invoices);
    }
}
