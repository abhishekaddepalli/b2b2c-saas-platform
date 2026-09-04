<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\WooCommerce\WooCommerceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WooCommerceController extends Controller
{
    protected WooCommerceService $wooCommerceService;

    public function __construct(WooCommerceService $wooCommerceService)
    {
        $this->wooCommerceService = $wooCommerceService;
    }

    /**
     * Test connection to WooCommerce REST API.
     */
    public function test(Request $request): JsonResponse
    {
        $result = $this->wooCommerceService->testConnection(
            $request->input('store_url'),
            $request->input('consumer_key'),
            $request->input('consumer_secret')
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Trigger WooCommerce catalog sync.
     */
    public function sync(Request $request): JsonResponse
    {
        $request->validate([
            'import_as' => ['nullable', 'in:product,service,auto'],
            'reseller_discount_percent' => ['nullable', 'numeric', 'min:0', 'max:90'],
            'overwrite_existing' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'category_id' => ['nullable', 'string'],
        ]);

        $result = $this->wooCommerceService->syncCatalog($request->all());

        return response()->json($result, $result['success'] ? 200 : 400);
    }
}
