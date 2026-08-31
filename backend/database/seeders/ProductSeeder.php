<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Price;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $secCategory = Category::where('slug', 'security-compliance')->first();
        $cloudCategory = Category::where('slug', 'cloud-infrastructure')->first();
        $saasCategory = Category::where('slug', 'saas-business-tools')->first();

        $products = [
            [
                'name' => 'Wildcard SSL Certificate',
                'slug' => 'wildcard-ssl-certificate',
                'sku' => 'SEC-SSL-WILD',
                'category_id' => $secCategory?->id,
                'short_description' => '256-bit encryption for main domain and unlimited subdomains',
                'full_description' => 'Secure your entire domain structure with a single Wildcard SSL certificate. Full 2048-bit root assurance with 99.9% browser recognition.',
                'pricing_type' => 'fixed',
                'cost_price' => 1200.00,
                'reseller_price' => 1800.00,
                'customer_price' => 2499.00,
                'featured' => true,
            ],
            [
                'name' => 'Cloud VPS Server 4 vCPU 8GB',
                'slug' => 'cloud-vps-4vcpu-8gb',
                'sku' => 'CLOUD-VPS-48',
                'category_id' => $cloudCategory?->id,
                'short_description' => 'Dedicated NVMe SSD cloud compute instance with static IPv4',
                'full_description' => 'High-frequency NVMe cloud server built on KVM virtualisation. Guaranteed CPU performance, automated daily backups, and 1Gbps uplink.',
                'pricing_type' => 'fixed',
                'cost_price' => 800.00,
                'reseller_price' => 1200.00,
                'customer_price' => 1599.00,
                'featured' => true,
            ],
            [
                'name' => 'Enterprise Email Suite (10 Users)',
                'slug' => 'enterprise-email-suite-10',
                'sku' => 'SAAS-MAIL-10',
                'category_id' => $saasCategory?->id,
                'short_description' => 'Professional domain email with 50GB storage per inbox',
                'full_description' => 'Ad-free corporate email hosting with integrated webmail, calendar, contact sync, DKIM/SPF anti-spam security, and 24/7 priority support.',
                'pricing_type' => 'percentage',
                'cost_price' => 500.00,
                'reseller_markup_pct' => 0.40, // reseller = 700
                'customer_markup_pct' => 0.25, // customer = 875
                'featured' => false,
            ],
        ];

        foreach ($products as $pData) {
            $cost = $pData['cost_price'];
            $reseller = $pData['reseller_price'] ?? null;
            $customer = $pData['customer_price'] ?? null;
            $resellerPct = $pData['reseller_markup_pct'] ?? null;
            $customerPct = $pData['customer_markup_pct'] ?? null;
            $pType = $pData['pricing_type'];

            unset($pData['cost_price'], $pData['reseller_price'], $pData['customer_price'], $pData['reseller_markup_pct'], $pData['customer_markup_pct'], $pData['pricing_type']);

            $product = Product::firstOrCreate(['slug' => $pData['slug']], array_merge($pData, [
                'status' => 'active',
                'visibility' => 'public',
            ]));

            Price::updateOrCreate(
                [
                    'priceable_type' => Product::class,
                    'priceable_id' => $product->id,
                ],
                [
                    'pricing_type' => $pType,
                    'cost_price' => $cost,
                    'reseller_price' => $reseller,
                    'customer_price' => $customer,
                    'reseller_markup_pct' => $resellerPct,
                    'customer_markup_pct' => $customerPct,
                    'currency' => 'INR',
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Products seeded with role-aware pricing.');
    }
}
