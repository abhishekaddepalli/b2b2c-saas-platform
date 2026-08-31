<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\Wallet;
use Illuminate\Database\Seeder;

class OrganizationSeeder extends Seeder
{
    public function run(): void
    {
        // Platform org
        $platform = Organization::updateOrCreate(
            ['id' => '00000000-0000-0000-0000-000000000001'],
            [
                'name' => 'SaaS Platform HQ',
                'slug' => 'platform-hq',
                'type' => 'platform',
                'status' => 'active',
                'brand_name' => 'SaaS Platform',
                'support_email' => 'support@saasplatform.com',
                'currency' => 'INR',
            ]
        );

        // Reseller organizations
        $resellers = [
            [
                'name' => 'TechSolutions Pvt Ltd',
                'slug' => 'techsolutions',
                'brand_name' => 'TechSolutions',
                'city' => 'Bengaluru',
                'state' => 'Karnataka',
                'balance' => 50000,
            ],
            [
                'name' => 'CloudVentures India',
                'slug' => 'cloudventures',
                'brand_name' => 'CloudVentures',
                'city' => 'Hyderabad',
                'state' => 'Telangana',
                'balance' => 25000,
            ],
            [
                'name' => 'Digital Edge Partners',
                'slug' => 'digitaledge',
                'brand_name' => 'Digital Edge',
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'balance' => 75000,
            ],
        ];

        foreach ($resellers as $data) {
            $org = Organization::updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'name' => $data['name'],
                    'brand_name' => $data['brand_name'],
                    'type' => 'reseller',
                    'status' => 'active',
                    'city' => $data['city'],
                    'state' => $data['state'],
                    'country' => 'IN',
                    'currency' => 'INR',
                    'wallet_enabled' => true,
                    'support_email' => "support@{$data['slug']}.com",
                ]
            );

            // Create wallet with initial balance
            Wallet::firstOrCreate(
                ['organization_id' => $org->id],
                [
                    'available_balance' => $data['balance'],
                    'currency' => 'INR',
                    'status' => 'active',
                ]
            );
        }

        $this->command->info('Organizations seeded (1 platform + 3 resellers).');
    }
}
