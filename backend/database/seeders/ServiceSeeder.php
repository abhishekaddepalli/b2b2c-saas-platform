<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Service;
use App\Models\ServicePlan;
use App\Models\Price;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $saasCategory = Category::where('slug', 'saas-business-tools')->first();
        $cloudCategory = Category::where('slug', 'cloud-infrastructure')->first();

        $services = [
            [
                'name' => 'OmniChannel Cloud CRM',
                'slug' => 'omnichannel-cloud-crm',
                'category_id' => $saasCategory?->id,
                'short_description' => 'Complete customer relationship management with WhatsApp & Email integration',
                'full_description' => 'Scale sales and customer support with automated lead tracking, deal pipelines, live chat widgets, and omni-channel messaging.',
                'billing_type' => 'recurring',
                'featured' => true,
                'plans' => [
                    [
                        'name' => 'Starter Plan',
                        'slug' => 'crm-starter',
                        'cost_price' => 300.00,
                        'reseller_price' => 500.00,
                        'customer_price' => 799.00,
                    ],
                    [
                        'name' => 'Pro Enterprise Plan',
                        'slug' => 'crm-pro-enterprise',
                        'cost_price' => 1000.00,
                        'reseller_price' => 1600.00,
                        'customer_price' => 2499.00,
                    ],
                ],
            ],
            [
                'name' => 'Automated Cloud Backup & DR',
                'slug' => 'automated-cloud-backup-dr',
                'category_id' => $cloudCategory?->id,
                'short_description' => 'Continuous block-level server backups with 1-click restore',
                'full_description' => 'Protect mission-critical data with instant snapshot replication, ransomware detection, end-to-end AES-256 encryption, and zero-downtime failover.',
                'billing_type' => 'recurring',
                'featured' => true,
                'plans' => [
                    [
                        'name' => 'Standard Server Backup',
                        'slug' => 'backup-standard-server',
                        'cost_price' => 400.00,
                        'reseller_price' => 650.00,
                        'customer_price' => 999.00,
                    ],
                ],
            ],
        ];

        foreach ($services as $sData) {
            $plans = $sData['plans'];
            unset($sData['plans']);

            $service = Service::firstOrCreate(['slug' => $sData['slug']], array_merge($sData, [
                'status' => 'active',
                'visibility' => 'public',
            ]));

            foreach ($plans as $planData) {
                $cost = $planData['cost_price'];
                $reseller = $planData['reseller_price'];
                $customer = $planData['customer_price'];
                unset($planData['cost_price'], $planData['reseller_price'], $planData['customer_price']);

                $plan = ServicePlan::firstOrCreate(['slug' => $planData['slug'], 'service_id' => $service->id], array_merge($planData, [
                    'status' => 'active',
                ]));

                Price::updateOrCreate(
                    [
                        'priceable_type' => ServicePlan::class,
                        'priceable_id' => $plan->id,
                    ],
                    [
                        'pricing_type' => 'fixed',
                        'cost_price' => $cost,
                        'reseller_price' => $reseller,
                        'customer_price' => $customer,
                        'currency' => 'INR',
                        'is_active' => true,
                    ]
                );
            }
        }

        $this->command->info('Services and service plans seeded.');
    }
}
