<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class SettingController extends Controller
{
    private string $settingsFile;

    public function __construct()
    {
        $this->settingsFile = storage_path('app/settings.json');
    }

    private function getDefaultSettings(): array
    {
        return [
            // Platform Branding
            'platform_name' => 'B2B2C Enterprise SaaS Platform',
            'brand_title' => 'Resell Cloud HQ',
            'support_email' => 'support@infiniforge.cloud',
            'support_phone' => '+91 9876543210',
            'currency' => 'INR',
            'default_tax_rate' => 18,
            'primary_color' => '#6366f1',
            'accent_color' => '#8b5cf6',
            'logo_url' => '',
            'favicon_url' => '',
            'custom_domain' => 'resell.infiniforge.cloud',

            // White-label & Reseller Governance
            'enable_whitelabel_reseller' => true,
            'auto_approve_resellers' => true,
            'default_reseller_margin' => 15,
            'min_wallet_recharge' => 500,
            'max_credit_limit' => 50000,

            // Razorpay Gateway
            'enable_razorpay' => true,
            'razorpay_key_id' => 'rzp_live_default_key',
            'razorpay_key_secret' => 'rzp_live_secret_key',
            'razorpay_webhook_secret' => '',
            'razorpay_mode' => 'live',

            // Stripe Gateway
            'enable_stripe' => true,
            'stripe_publishable_key' => 'pk_live_default_key',
            'stripe_secret_key' => 'sk_live_default_secret',
            'stripe_webhook_secret' => '',
            'stripe_mode' => 'live',

            // PhonePe Gateway
            'enable_phonepe' => false,
            'phonepe_merchant_id' => '',
            'phonepe_salt_key' => '',
            'phonepe_salt_index' => '1',
            'phonepe_mode' => 'sandbox',

            // Cashfree Gateway
            'enable_cashfree' => false,
            'cashfree_app_id' => '',
            'cashfree_secret_key' => '',
            'cashfree_mode' => 'sandbox',

            // Bank Transfer / Manual IMPS/NEFT
            'enable_bank_transfer' => true,
            'bank_name' => 'HDFC Bank',
            'bank_account_name' => 'Infiniforge Cloud Solutions',
            'bank_account_number' => '50200012345678',
            'bank_ifsc' => 'HDFC0001234',
            'bank_branch' => 'Corporate Banking Branch',

            // Real-Time Alerts & Notification Triggers
            'alert_email_enabled' => true,
            'alert_email_recipient' => 'abhishek123.as42@gmail.com',
            'alert_low_wallet_threshold' => 1000,
            'alert_on_new_order' => true,
            'alert_on_failed_payment' => true,
            'alert_on_new_reseller' => true,
            'alert_on_system_error' => true,

            // Email / SMTP Dispatch Configuration
            'enable_smtp' => false,
            'smtp_host' => 'smtp.mailgun.org',
            'smtp_port' => 587,
            'smtp_username' => '',
            'smtp_password' => '',
            'smtp_encryption' => 'tls',
            'smtp_from_address' => 'notifications@infiniforge.cloud',
            'smtp_from_name' => 'SaaS Platform Alerts',

            // WhatsApp, Telegram & Slack Alert Channels
            'enable_whatsapp' => false,
            'whatsapp_phone_number_id' => '',
            'whatsapp_access_token' => '',
            'enable_telegram' => false,
            'telegram_bot_token' => '',
            'telegram_chat_id' => '',
            'enable_slack' => false,
            'slack_webhook_url' => '',

            // Third-Party Ecosystem Integrations
            'enable_openai' => false,
            'openai_api_key' => '',
            'openai_model' => 'gpt-4o-mini',
            'enable_ga4' => false,
            'ga4_measurement_id' => '',
            'enable_sentry' => false,
            'sentry_dsn' => '',
            'enable_cloudflare' => false,
            'cloudflare_zone_id' => '',
            'cloudflare_api_token' => '',

            // Social Auth & SSO Integrations
            'enable_google_oauth' => true,
            'google_client_id' => '',
            'google_client_secret' => '',
            'google_redirect_uri' => 'https://resell.infiniforge.cloud/api/v1/auth/callback/google',

            'enable_facebook_oauth' => true,
            'facebook_app_id' => '',
            'facebook_app_secret' => '',
            'facebook_redirect_uri' => 'https://resell.infiniforge.cloud/api/v1/auth/callback/facebook',

            'enable_github_oauth' => true,
            'github_client_id' => '',
            'github_client_secret' => '',
            'github_redirect_uri' => 'https://resell.infiniforge.cloud/api/v1/auth/callback/github',

            'enable_microsoft_oauth' => false,
            'microsoft_client_id' => '',
            'microsoft_client_secret' => '',
            'microsoft_tenant_id' => 'common',
            'microsoft_redirect_uri' => 'https://resell.infiniforge.cloud/api/v1/auth/callback/microsoft',

            // Anti-Bot & CAPTCHA Shield
            'enable_captcha' => true,
            'captcha_provider' => 'turnstile', // turnstile, recaptcha_v2, recaptcha_v3, builtin_math
            'captcha_site_key' => '0x4AAAAAAtest_site_key',
            'captcha_secret_key' => '0x4AAAAAAtest_secret_key',
            'captcha_on_login' => true,
            'captcha_on_register' => true,
            'captcha_on_forgot_password' => true,

            // WooCommerce Integration
            'enable_woocommerce' => false,
            'woocommerce_store_url' => '',
            'woocommerce_consumer_key' => '',
            'woocommerce_consumer_secret' => '',
            'woocommerce_webhook_secret' => '',
            'woocommerce_default_import_type' => 'auto', // 'product', 'service', 'auto'
            'woocommerce_reseller_margin' => 15,
            'woocommerce_auto_sync_interval' => 'disabled', // 'hourly', 'daily', 'disabled'

            // Twilio SMS & WhatsApp Dispatcher
            'enable_twilio' => false,
            'twilio_account_sid' => '',
            'twilio_auth_token' => '',
            'twilio_phone_number' => '', // e.g. +1234567890
            'twilio_whatsapp_number' => '', // e.g. +14155238886 or whatsapp:+14155238886
            'twilio_alert_orders_sms' => true,
            'twilio_alert_orders_whatsapp' => true,
            'twilio_alert_credentials_sms' => true,
            'twilio_alert_credentials_whatsapp' => true,
            'twilio_alert_otp_sms' => false,

            // Live Chat Widget & Support Desk
            'enable_chat_widget' => true,
            'chat_widget_title' => 'Infiniforge Live Support',
            'chat_widget_subtitle' => 'Typically replies in under 5 minutes',
            'chat_widget_greeting' => 'Hello! 👋 How can our cloud architecture team assist you today?',
            'chat_widget_primary_color' => '#6366f1',
            'chat_widget_position' => 'bottom_right', // bottom_right, bottom_left
            'chat_widget_whatsapp_number' => '+919876543210',
            'chat_widget_agent_name' => 'Alex (Cloud Specialist)',
            'chat_widget_agent_avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            'support_hours' => '24/7 Mon - Sun',
            'support_sla_hours' => '2 Hours',
            'support_ticketing_enabled' => true,
        ];
    }

    public function index(): JsonResponse
    {
        $defaults = $this->getDefaultSettings();

        if (File::exists($this->settingsFile)) {
            $saved = json_decode(File::get($this->settingsFile), true) ?: [];
            $settings = array_merge($defaults, $saved);
        } else {
            $settings = $defaults;
        }

        return response()->json(['data' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        $defaults = $this->getDefaultSettings();
        $current = [];

        if (File::exists($this->settingsFile)) {
            $current = json_decode(File::get($this->settingsFile), true) ?: [];
        }

        $merged = array_merge($defaults, $current, $request->all());

        if (!File::isDirectory(dirname($this->settingsFile))) {
            File::makeDirectory(dirname($this->settingsFile), 0755, true);
        }

        File::put($this->settingsFile, json_encode($merged, JSON_PRETTY_PRINT));

        return response()->json([
            'message' => 'Platform settings and payment gateway credentials saved successfully.',
            'data' => $merged,
        ]);
    }
}
