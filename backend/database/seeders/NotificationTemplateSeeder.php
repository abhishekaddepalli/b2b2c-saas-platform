<?php

namespace Database\Seeders;

use App\Models\NotificationTemplate;
use Illuminate\Database\Seeder;

class NotificationTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            // Welcome Message
            [
                'event_trigger' => 'welcome_message',
                'channel' => 'email',
                'name' => 'Welcome Email',
                'subject' => 'Welcome to {{platform_name}}, {{customer_name}}!',
                'template_body' => "Hi {{customer_name}},\n\nWelcome to {{platform_name}}! Your account has been activated. You can now access your dashboard and explore our services.\n\nBest regards,\nThe Team",
                'supported_variables' => ['customer_name', 'platform_name'],
                'is_enabled' => true,
            ],
            [
                'event_trigger' => 'welcome_message',
                'channel' => 'whatsapp',
                'name' => 'Welcome WhatsApp Alert',
                'subject' => null,
                'template_body' => "Welcome to {{platform_name}}, {{customer_name}}! We are thrilled to have you on board.",
                'supported_variables' => ['customer_name', 'platform_name'],
                'is_enabled' => true,
            ],

            // Renewal Reminder
            [
                'event_trigger' => 'renewal_reminder',
                'channel' => 'email',
                'name' => 'Subscription Renewal Reminder Email',
                'subject' => 'Renewal Notice: {{service_name}} renews on {{renewal_date}}',
                'template_body' => "Dear {{customer_name}},\n\nThis is a friendly reminder that your subscription for {{service_name}} will renew on {{renewal_date}} for {{amount}}.\n\nPlease ensure your wallet has sufficient balance.",
                'supported_variables' => ['customer_name', 'service_name', 'amount', 'renewal_date'],
                'is_enabled' => true,
            ],
            [
                'event_trigger' => 'renewal_reminder',
                'channel' => 'sms',
                'name' => 'Renewal Reminder SMS',
                'subject' => null,
                'template_body' => "Hi {{customer_name}}, {{service_name}} renews on {{renewal_date}} for {{amount}}. Please maintain adequate wallet balance.",
                'supported_variables' => ['customer_name', 'service_name', 'amount', 'renewal_date'],
                'is_enabled' => true,
            ],
            [
                'event_trigger' => 'renewal_reminder',
                'channel' => 'in_app',
                'name' => 'Renewal Reminder In-App',
                'subject' => 'Subscription Renewal Pending',
                'template_body' => "{{service_name}} renews on {{renewal_date}} for {{amount}}.",
                'supported_variables' => ['customer_name', 'service_name', 'amount', 'renewal_date'],
                'is_enabled' => true,
            ],

            // Low Wallet Alert
            [
                'event_trigger' => 'low_wallet_alert',
                'channel' => 'email',
                'name' => 'Low Wallet Balance Alert Email',
                'subject' => 'Action Required: Low Wallet Balance Alert',
                'template_body' => "Attention Reseller Partner,\n\nYour organization wallet balance has dropped below the threshold. Current available balance: {{amount}}.\n\nPlease top up your wallet to ensure uninterrupted service renewals.",
                'supported_variables' => ['customer_name', 'amount'],
                'is_enabled' => true,
            ],

            // Failed Payment Retry
            [
                'event_trigger' => 'failed_payment_retry',
                'channel' => 'email',
                'name' => 'Failed Renewal Payment Retry Email',
                'subject' => 'Urgent: Renewal payment failed for {{service_name}}',
                'template_body' => "Hello {{customer_name}},\n\nWe were unable to process your renewal for {{service_name}} (Amount: {{amount}}). Your subscription is now in grace period.\n\nPlease recharge your wallet to prevent suspension.",
                'supported_variables' => ['customer_name', 'service_name', 'amount'],
                'is_enabled' => true,
            ],

            // Order Placed
            [
                'event_trigger' => 'order_placed',
                'channel' => 'in_app',
                'name' => 'Order Confirmation Notification',
                'subject' => null,
                'template_body' => "Order #{{invoice_number}} placed successfully for {{amount}}.",
                'supported_variables' => ['invoice_number', 'amount'],
                'is_enabled' => true,
            ],

            // Invoice Generated
            [
                'event_trigger' => 'invoice_generated',
                'channel' => 'email',
                'name' => 'Tax Invoice PDF Notification',
                'subject' => 'Tax Invoice #{{invoice_number}} from {{platform_name}}',
                'template_body' => "Dear {{customer_name}},\n\nYour invoice #{{invoice_number}} for {{amount}} has been generated and is attached to this email.",
                'supported_variables' => ['customer_name', 'invoice_number', 'amount', 'platform_name'],
                'is_enabled' => true,
            ],
        ];

        foreach ($templates as $t) {
            $t['event_key'] = $t['event_trigger'];
            $t['body_template'] = $t['template_body'];
            NotificationTemplate::updateOrCreate([
                'event_trigger' => $t['event_trigger'],
                'channel' => $t['channel'],
            ], $t);
        }

        $this->command->info('Notification Automation Templates seeded across Email, SMS, WhatsApp, and In-App channels.');
    }
}
