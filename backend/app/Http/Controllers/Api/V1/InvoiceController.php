<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $invoices = Invoice::where('customer_id', $request->user()->id)
            ->latest('issued_at')
            ->paginate($request->per_page ?? 20);

        return response()->json($invoices);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $invoice = Invoice::where('customer_id', $request->user()->id)
            ->where('id', $id)
            ->with(['items'])
            ->firstOrFail();

        return response()->json(['data' => $invoice]);
    }

    public function download(Request $request, string $id): JsonResponse
    {
        $invoice = Invoice::where('customer_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        return response()->json(['message' => 'Invoice download URL generated.', 'url' => $invoice->pdf_path]);
    }
}
