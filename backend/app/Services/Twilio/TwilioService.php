<?php

namespace App\Services\Twilio;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TwilioService
{
    protected string $settingsFile;

    public function __construct()
    {
        $this->settingsFile = storage_path('app/settings.json');
    }

    /**
     * Retrieve Twilio credentials.
     */
    public function getCredentials(?string $sid = null, ?string $token = null, ?string $smsFrom = null, ?string $waFrom = null): array
    {
        $settings = [];
        if (File::exists($this->settingsFile)) {
            $settings = json_decode(File::get($this->settingsFile), true) ?: [];
        }

        return [
            'account_sid' => trim($sid ?: ($settings['twilio_account_sid'] ?? '')),
            'auth_token' => trim($token ?: ($settings['twilio_auth_token'] ?? '')),
            'phone_number' => trim($smsFrom ?: ($settings['twilio_phone_number'] ?? '')),
            'whatsapp_number' => trim($waFrom ?: ($settings['twilio_whatsapp_number'] ?? '')),
        ];
    }

    /**
     * Send Twilio SMS.
     */
    public function sendSms(string $to, string $message, ?string $sid = null, ?string $token = null, ?string $smsFrom = null): array
    {
        $creds = $this->getCredentials($sid, $token, $smsFrom, null);

        if (empty($creds['account_sid']) || empty($creds['auth_token']) || empty($creds['phone_number'])) {
            return [
                'success' => false,
                'message' => 'Twilio Account SID, Auth Token, and Sender Phone Number are required.',
            ];
        }

        try {
            $url = "https://api.twilio.com/2010-04-01/Accounts/{$creds['account_sid']}/Messages.json";
            $response = Http::asForm()
                ->withBasicAuth($creds['account_sid'], $creds['auth_token'])
                ->post($url, [
                    'To' => $to,
                    'From' => $creds['phone_number'],
                    'Body' => $message,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'message' => 'SMS queued successfully via Twilio.',
                    'sid' => $data['sid'] ?? null,
                    'status' => $data['status'] ?? 'queued',
                ];
            }

            return [
                'success' => false,
                'message' => 'Twilio SMS failed: ' . ($response->json('message') ?? 'HTTP ' . $response->status()),
            ];
        } catch (\Throwable $e) {
            Log::error('Twilio SMS Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Twilio Error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Send Twilio WhatsApp message.
     */
    public function sendWhatsApp(string $to, string $message, ?string $sid = null, ?string $token = null, ?string $waFrom = null): array
    {
        $creds = $this->getCredentials($sid, $token, null, $waFrom);

        if (empty($creds['account_sid']) || empty($creds['auth_token']) || empty($creds['whatsapp_number'])) {
            return [
                'success' => false,
                'message' => 'Twilio Account SID, Auth Token, and Sender WhatsApp Number are required.',
            ];
        }

        // Format sender and recipient for Twilio WhatsApp
        $fromFormatted = str_starts_with($creds['whatsapp_number'], 'whatsapp:')
            ? $creds['whatsapp_number']
            : 'whatsapp:' . $creds['whatsapp_number'];

        $toFormatted = str_starts_with($to, 'whatsapp:')
            ? $to
            : 'whatsapp:' . $to;

        try {
            $url = "https://api.twilio.com/2010-04-01/Accounts/{$creds['account_sid']}/Messages.json";
            $response = Http::asForm()
                ->withBasicAuth($creds['account_sid'], $creds['auth_token'])
                ->post($url, [
                    'To' => $toFormatted,
                    'From' => $fromFormatted,
                    'Body' => $message,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'message' => 'WhatsApp message dispatched successfully via Twilio.',
                    'sid' => $data['sid'] ?? null,
                    'status' => $data['status'] ?? 'queued',
                ];
            }

            return [
                'success' => false,
                'message' => 'Twilio WhatsApp failed: ' . ($response->json('message') ?? 'HTTP ' . $response->status()),
            ];
        } catch (\Throwable $e) {
            Log::error('Twilio WhatsApp Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Twilio WhatsApp Error: ' . $e->getMessage(),
            ];
        }
    }
}
