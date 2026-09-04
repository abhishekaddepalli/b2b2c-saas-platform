<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Organization;
use App\Models\Product;
use App\Models\Service;
use App\Models\ServicePlan;
use App\Models\Subcategory;
use App\Models\User;
use App\Models\Wallet;
use App\Services\Wallet\WalletService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            OrganizationSeeder::class,
            UserSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            ServiceSeeder::class,
            InfiniforgeCatalogSeeder::class,
        ]);
    }
}
