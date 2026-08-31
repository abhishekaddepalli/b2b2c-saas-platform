<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Subcategory;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Cloud Infrastructure',
                'slug' => 'cloud-infrastructure',
                'description' => 'Scalable cloud compute, storage, and networking solutions',
                'type' => 'both',
                'featured' => true,
                'sort_order' => 1,
                'subcategories' => [
                    ['name' => 'VPS & Compute', 'slug' => 'vps-compute'],
                    ['name' => 'Object Storage', 'slug' => 'object-storage'],
                    ['name' => 'Managed Databases', 'slug' => 'managed-databases'],
                ],
            ],
            [
                'name' => 'SaaS & Business Tools',
                'slug' => 'saas-business-tools',
                'description' => 'Enterprise productivity, CRM, and automation software',
                'type' => 'both',
                'featured' => true,
                'sort_order' => 2,
                'subcategories' => [
                    ['name' => 'Email & Productivity', 'slug' => 'email-productivity'],
                    ['name' => 'CRM & Sales', 'slug' => 'crm-sales'],
                    ['name' => 'Helpdesk & Support', 'slug' => 'helpdesk-support'],
                ],
            ],
            [
                'name' => 'Security & Compliance',
                'slug' => 'security-compliance',
                'description' => 'SSL certificates, firewalls, and security auditing services',
                'type' => 'both',
                'featured' => true,
                'sort_order' => 3,
                'subcategories' => [
                    ['name' => 'SSL Certificates', 'slug' => 'ssl-certificates'],
                    ['name' => 'WAF & DDoS Protection', 'slug' => 'waf-ddos'],
                ],
            ],
        ];

        foreach ($categories as $catData) {
            $subcats = $catData['subcategories'];
            unset($catData['subcategories']);

            $category = Category::firstOrCreate(['slug' => $catData['slug']], $catData);

            foreach ($subcats as $sub) {
                Subcategory::firstOrCreate(
                    ['slug' => $sub['slug']],
                    [
                        'category_id' => $category->id,
                        'name' => $sub['name'],
                        'status' => 'active',
                    ]
                );
            }
        }

        $this->command->info('Categories and subcategories seeded.');
    }
}
