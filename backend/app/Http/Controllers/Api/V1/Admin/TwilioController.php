<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\Twilio\TwilioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TwilioController extends Controller
{
    protected TwilioService $twilioService;

    public function __construct(TwilioService $twilioService)
    {
        $this->twilioService = $twilioService;
    }

    /**
     * Send test SMS or WhatsApp message.
     */
    public function test(Request $request): JsonResponse
    {
        $request->validate([
            'channel' => ['required', 'in:sms,whatsapp'],
            'recipient' => ['required', 'string'],
            'message' => ['nullable', 'string'],
            'account_sid' => ['nullable', 'string'],
            'auth_token' => ['nullable', 'string'],
            'phone_number' => ['nullable', 'string'],
            'whatsapp_number' => ['nullable', 'string'],
        ]);

        $channel = $request->input('channel');
        $recipient = $request->input('recipient');
        $message = $request->input('message') ?: 'Hello from Infiniforge Cloud Platform! Your Twilio integration is working successfully. 🚀';

        if ($channel === 'whatsapp') {
            $result = $this->twilioService->sendWhatsApp(
                $recipient,
                $message,
                $request->input('account_sid'),
                $request->input('auth_token'),
                $request->input('whatsapp_number')
            );
        } else {
            $result = $this->twilioService->sendSms(
                $recipient,
                $message,
                $request->input('account_sid'),
                $request->input('auth_token'),
                $request->input('phone_number')
            );
        }

        return response()->json($result, $result['success'] ? 200 : 400);
    }
}
