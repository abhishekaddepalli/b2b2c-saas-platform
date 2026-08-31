<?php

namespace Database\Seeders;

use App\Models\SaasPlan;
use Illuminate\Database\Seeder;

class SaasPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Free Tier',
                'slug' => 'free',
                'short_description' => 'For early startups and individual resellers testing the platform.',
                'monthly_price' => 0,
                'yearly_price' => 0,
                'currency' => 'INR',
                'reseller_limit' => 1,
                'customer_limit' => 10,
                'products_limit' => 20,
                'services_limit' => 5,
                'wallet_limit' => 10000,
                'trial_days' => 7,
                'storage_mb' => 512,
                'api_rate_limit' => 30,
                'white_label_available' => false,
                'features' => [
                    'Basic Marketplace Access',
                    'Single Reseller Organization',
                    'Up to 10 Customers',
                    'Standard Email Support',
                ],
                'status' => 'active',
                'sort_order' => 1,
            ],
            [
                'name' => 'Starter Plan',
                'slug' => 'starter',
                'short_description' => 'Ideal for growing B2B agencies and emerging SaaS distributors.',
                'monthly_price' => 1999,
                'yearly_price' => 19990,
                'currency' => 'INR',
                'reseller_limit' => 3,
                'customer_limit' => 100,
                'products_limit' => 200,
                'services_limit' => 50,
                'wallet_limit' => 1000000,
                'trial_days' => 14,
                'storage_mb' => 2048,
                'api_rate_limit' => 60,
                'white_label_available' => false,
                'features' => [
                    '3 Reseller Organizations',
                    'Up to 100 Customers',
                    '200 Product Catalog Items',
                    'Automated Billing & Invoicing',
                    'Priority Email & Chat Support',
                ],
                'status' => 'active',
                'sort_order' => 2,
            ],
            [
                'name' => 'Business Pro',
                'slug' => 'business',
                'short_description' => 'Designed for scale-ups needing white-label branding and higher quotas.',
                'monthly_price' => 4999,
                'yearly_price' => 49990,
                'currency' => 'INR',
                'reseller_limit' => 10,
                'customer_limit' => 1000,
                'products_limit' => 1000,
                'services_limit' => 200,
                'wallet_limit' => 5000000,
                'trial_days' => 14,
                'storage_mb' => 10240,
                'api_rate_limit' => 120,
                'white_label_available' => true,
                'features' => [
                    'Full White-Label Branding & Logos',
                    '10 Reseller Sub-accounts',
                    'Up to 1,000 Customers',
                    'Custom Domain White-Labeling',
                    'Advanced Financial Reports & Analytics',
                    '24/7 Dedicated Account Manager',
                ],
                'status' => 'active',
                'sort_order' => 3,
            ],
            [
                'name' => 'Enterprise Suite',
                'slug' => 'enterprise',
                'short_description' => 'Unlimited scaling for high-volume enterprise organizations and networks.',
                'monthly_price' => 14999,
                'yearly_price' => 149990,
                'currency' => 'INR',
                'reseller_limit' => -1,
                'customer_limit' => -1,
                'products_limit' => -1,
                'services_limit' => -1,
                'wallet_limit' => -1,
                'trial_days' => 30,
                'storage_mb' => 102400,
                'api_rate_limit' => 300,
                'white_label_available' => true,
                'features' => [
                    'Unlimited Resellers & Customers',
                    'Unlimited Product & Service Catalog',
                    'Full Custom Domain & SSL Integration',
                    'Dedicated PostgreSQL & Redis Instances',
                    'SLA Guarantees (99.9% Uptime)',
                    'Custom ERP & CRM Webhook Integrations',
                ],
                'status' => 'active',
                'sort_order' => 4,
            ],
        ];

        foreach ($plans as $p) {
            SaasPlan::updateOrCreate(['slug' => $p['slug']], $p);
        }

        $this->command->info('SaaS Monetization Plans seeded (Free, Starter, Business, Enterprise).');
    }
}
