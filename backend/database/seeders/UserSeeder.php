<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Super Admin ──────────────────────────────────────────────────────
        $admin = User::updateOrCreate(
            ['email' => 'admin@saasplatform.com'],
            [
                'name' => 'Super Admin',
                'phone' => '+919000000001',
                'password' => 'Admin@1234', // 'password' => 'hashed' in User model auto-hashes
                'email_verified_at' => now(),
                'status' => 'active',
            ]
        );
        $admin->syncRoles(['SUPER_ADMIN']);

        // ─── Reseller Owners ──────────────────────────────────────────────────
        $resellers = [
            ['name' => 'Ravi Kumar', 'email' => 'ravi@techsolutions.com', 'slug' => 'techsolutions'],
            ['name' => 'Priya Sharma', 'email' => 'priya@cloudventures.com', 'slug' => 'cloudventures'],
            ['name' => 'Anil Mehta', 'email' => 'anil@digitaledge.com', 'slug' => 'digitaledge'],
        ];

        foreach ($resellers as $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => 'Reseller@1234', // auto-hashed by Eloquent cast
                    'email_verified_at' => now(),
                    'status' => 'active',
                ]
            );
            $user->syncRoles(['RESELLER']);

            $org = Organization::where('slug', $data['slug'])->first();
            if ($org) {
                $org->users()->syncWithoutDetaching([
                    $user->id => [
                        'role_within_org' => 'owner',
                        'status' => 'active',
                        'joined_at' => now(),
                    ],
                ]);
                $user->update(['current_organization_id' => $org->id]);
            }
        }

        // ─── Customers ────────────────────────────────────────────────────────
        $customers = [
            // TechSolutions customers
            ['name' => 'Anjali Singh', 'email' => 'anjali@example.com', 'org' => 'techsolutions'],
            ['name' => 'Suresh Babu', 'email' => 'suresh@example.com', 'org' => 'techsolutions'],
            ['name' => 'Neha Gupta', 'email' => 'neha@example.com', 'org' => 'techsolutions'],
            ['name' => 'Kiran Rao', 'email' => 'kiran@example.com', 'org' => 'techsolutions'],
            ['name' => 'Deepak Joshi', 'email' => 'deepak@example.com', 'org' => 'techsolutions'],
            // CloudVentures customers
            ['name' => 'Meena Pillai', 'email' => 'meena@example.com', 'org' => 'cloudventures'],
            ['name' => 'Rajesh Iyer', 'email' => 'rajesh@example.com', 'org' => 'cloudventures'],
            ['name' => 'Sonia Verma', 'email' => 'sonia@example.com', 'org' => 'cloudventures'],
            ['name' => 'Amit Patel', 'email' => 'amit@example.com', 'org' => 'cloudventures'],
            ['name' => 'Lakshmi Nair', 'email' => 'lakshmi@example.com', 'org' => 'cloudventures'],
            // Digital Edge customers
            ['name' => 'Vikram Malhotra', 'email' => 'vikram@example.com', 'org' => 'digitaledge'],
            ['name' => 'Pooja Reddy', 'email' => 'pooja@example.com', 'org' => 'digitaledge'],
            ['name' => 'Sandeep Kulkarni', 'email' => 'sandeep@example.com', 'org' => 'digitaledge'],
            ['name' => 'Divya Krishnan', 'email' => 'divya@example.com', 'org' => 'divya@example.com', 'org' => 'digitaledge'],
            ['name' => 'Rahul Tiwari', 'email' => 'rahul@example.com', 'org' => 'digitaledge'],
        ];

        foreach ($customers as $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => 'Customer@1234', // auto-hashed by Eloquent cast
                    'email_verified_at' => now(),
                    'status' => 'active',
                ]
            );
            $user->syncRoles(['USER']);

            $org = Organization::where('slug', $data['org'])->first();
            if ($org) {
                $org->users()->syncWithoutDetaching([
                    $user->id => [
                        'role_within_org' => 'customer',
                        'status' => 'active',
                        'joined_at' => now(),
                    ],
                ]);
                $user->update(['current_organization_id' => $org->id]);
            }
        }

        $this->command->info('Users seeded: 1 super admin, 3 resellers, 15 customers.');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Super Admin', 'admin@saasplatform.com', 'Admin@1234'],
                ['Reseller', 'ravi@techsolutions.com', 'Reseller@1234'],
                ['Reseller', 'priya@cloudventures.com', 'Reseller@1234'],
                ['Reseller', 'anil@digitaledge.com', 'Reseller@1234'],
                ['Customer', 'anjali@example.com', 'Customer@1234'],
            ]
        );
    }
}
