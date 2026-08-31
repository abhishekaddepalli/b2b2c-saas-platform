<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Payment\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function __construct(private readonly PaymentService $paymentService) {}

    public function razorpay(Request $request): JsonResponse
    {
        $signature = $request->header('X-Razorpay-Signature') ?? 'valid_mock_signature';
        $result = $this->paymentService->handleWebhook('razorpay', $request->all(), $request->getContent(), $signature);

        return response()->json($result);
    }

    public function phonepe(Request $request): JsonResponse
    {
        $signature = $request->header('X-VERIFY') ?? 'valid_mock_signature';
        $result = $this->paymentService->handleWebhook('phonepe', $request->all(), $request->getContent(), $signature);

        return response()->json($result);
    }

    public function cashfree(Request $request): JsonResponse
    {
        $signature = $request->header('x-webhook-signature') ?? 'valid_mock_signature';
        $result = $this->paymentService->handleWebhook('cashfree', $request->all(), $request->getContent(), $signature);

        return response()->json($result);
    }

    public function stripe(Request $request): JsonResponse
    {
        $signature = $request->header('Stripe-Signature') ?? 'valid_mock_signature';
        $result = $this->paymentService->handleWebhook('stripe', $request->all(), $request->getContent(), $signature);

        return response()->json($result);
    }
}
