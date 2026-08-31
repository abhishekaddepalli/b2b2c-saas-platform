<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Products
            'products.view', 'products.create', 'products.update', 'products.delete',
            'products.publish',

            // Services
            'services.view', 'services.create', 'services.update', 'services.delete',
            'services.assign',

            // Categories
            'categories.view', 'categories.create', 'categories.update', 'categories.delete',

            // Pricing
            'pricing.view', 'pricing.update', 'pricing.cost_view',

            // Customers
            'customers.view', 'customers.create', 'customers.update', 'customers.delete',

            // Orders
            'orders.view', 'orders.create', 'orders.cancel', 'orders.refund',

            // Subscriptions
            'subscriptions.view', 'subscriptions.create', 'subscriptions.cancel',
            'subscriptions.suspend', 'subscriptions.reactivate',

            // Wallet
            'wallet.view', 'wallet.recharge', 'wallet.adjust', 'wallet.transactions',

            // Invoices
            'invoices.view', 'invoices.download',

            // Reports
            'reports.view', 'reports.export',

            // Organizations
            'organizations.view', 'organizations.create', 'organizations.update',
            'organizations.suspend',

            // Users
            'users.view', 'users.create', 'users.update', 'users.suspend',

            // Offers & Coupons
            'offers.view', 'offers.create', 'offers.update', 'offers.delete',
            'coupons.view', 'coupons.create', 'coupons.update', 'coupons.delete',

            // Advertisements
            'advertisements.view', 'advertisements.create', 'advertisements.update',

            // Support
            'support.view', 'support.respond', 'support.assign',

            // Settings
            'settings.view', 'settings.update',

            // Audit
            'audit_logs.view',

            // Profit
            'profit.view',
        ];

        $resellerPermissions = [
            'products.view', 'services.view', 'services.assign',
            'categories.view',
            'pricing.view',
            'customers.view', 'customers.create', 'customers.update',
            'orders.view', 'orders.create', 'orders.cancel',
            'subscriptions.view', 'subscriptions.create', 'subscriptions.cancel',
            'wallet.view', 'wallet.recharge', 'wallet.transactions',
            'invoices.view', 'invoices.download',
            'reports.view',
            'offers.view', 'coupons.view',
            'support.view', 'support.respond',
            'profit.view',
        ];

        $userPermissions = [
            'products.view', 'services.view', 'categories.view',
            'orders.view', 'orders.create', 'orders.cancel',
            'subscriptions.view', 'subscriptions.cancel',
            'invoices.view', 'invoices.download',
            'support.view',
        ];

        $guards = ['web', 'sanctum', 'api'];

        foreach ($guards as $guard) {
            foreach ($permissions as $permission) {
                Permission::firstOrCreate(['name' => $permission, 'guard_name' => $guard]);
            }

            $superAdmin = Role::firstOrCreate(['name' => 'SUPER_ADMIN', 'guard_name' => $guard]);
            $superAdmin->syncPermissions(Permission::where('guard_name', $guard)->get());

            $reseller = Role::firstOrCreate(['name' => 'RESELLER', 'guard_name' => $guard]);
            $reseller->syncPermissions(Permission::where('guard_name', $guard)->whereIn('name', $resellerPermissions)->get());

            $user = Role::firstOrCreate(['name' => 'USER', 'guard_name' => $guard]);
            $user->syncPermissions(Permission::where('guard_name', $guard)->whereIn('name', $userPermissions)->get());
        }

        $this->command->info('Roles and permissions seeded for web and sanctum guards.');
    }
}
