<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class InstallerController extends Controller
{
    public function status(): JsonResponse
    {
        return response()->json([
            'installed' => file_exists(storage_path('installed')),
            'timestamp' => file_exists(storage_path('installed')) ? file_get_contents(storage_path('installed')) : null,
        ]);
    }

    public function checkRequirements(): JsonResponse
    {
        $phpVersion = PHP_VERSION;
        $phpPassed = version_compare($phpVersion, '8.2.0', '>=');

        $hasPdoMysql = extension_loaded('pdo_mysql')
            || extension_loaded('nd_pdo_mysql')
            || extension_loaded('mysqlnd')
            || (class_exists('PDO') && in_array('mysql', \PDO::getAvailableDrivers(), true));

        $requiredExtensions = [
            'openssl', 'pdo', 'mbstring', 'tokenizer', 'xml', 'ctype', 'json', 'bcmath', 'curl', 'fileinfo'
        ];

        $extensions = [];
        foreach ($requiredExtensions as $ext) {
            $extensions[$ext] = extension_loaded($ext);
        }
        $extensions['pdo_mysql'] = $hasPdoMysql;

        // Ensure storage subdirectories exist
        $storageDirs = [
            storage_path('app'),
            storage_path('app/public'),
            storage_path('framework'),
            storage_path('framework/cache'),
            storage_path('framework/sessions'),
            storage_path('framework/views'),
            storage_path('logs'),
            base_path('bootstrap/cache'),
        ];

        foreach ($storageDirs as $dir) {
            if (!file_exists($dir)) {
                @mkdir($dir, 0775, true);
            }
        }

        $permissions = [
            'storage/app' => is_writable(storage_path('app')),
            'storage/framework' => is_writable(storage_path('framework')),
            'storage/logs' => is_writable(storage_path('logs')),
            'bootstrap/cache' => is_writable(base_path('bootstrap/cache')),
        ];

        $allRequirementsMet = $phpPassed && !in_array(false, $extensions, true) && !in_array(false, $permissions, true);

        return response()->json([
            'all_met' => $allRequirementsMet,
            'php' => ['version' => $phpVersion, 'passed' => $phpPassed],
            'extensions' => $extensions,
            'permissions' => $permissions,
        ]);
    }

    public function testDatabase(Request $request): JsonResponse
    {
        $request->validate([
            'db_driver' => 'required|in:pgsql,mysql',
            'db_host' => 'required|string',
            'db_port' => 'required|numeric',
            'db_name' => 'required|string',
            'db_user' => 'required|string',
            'db_pass' => 'nullable|string',
        ]);

        $requiredDriverExt = $request->db_driver === 'mysql' ? 'pdo_mysql' : 'pdo_pgsql';
        $driverAvailable = $request->db_driver === 'mysql'
            ? (extension_loaded('pdo_mysql') || extension_loaded('nd_pdo_mysql') || extension_loaded('mysqlnd') || (class_exists('PDO') && in_array('mysql', \PDO::getAvailableDrivers(), true)))
            : (extension_loaded('pdo_pgsql') || (class_exists('PDO') && in_array('pgsql', \PDO::getAvailableDrivers(), true)));

        if (!$driverAvailable) {
            return response()->json([
                'success' => false,
                'message' => "The PHP extension '{$requiredDriverExt}' is disabled in cPanel. Enable '{$requiredDriverExt}' under cPanel -> Select PHP Version -> Extensions.",
            ], 422);
        }

        try {
            $connectionName = 'test_install_db';
            config([
                "database.connections.{$connectionName}" => [
                    'driver' => $request->db_driver,
                    'host' => $request->db_host,
                    'port' => $request->db_port,
                    'database' => $request->db_name,
                    'username' => $request->db_user,
                    'password' => $request->db_pass ?? '',
                    'charset' => 'utf8mb4',
                    'prefix' => '',
                ]
            ]);

            DB::connection($connectionName)->getPdo();

            return response()->json([
                'success' => true,
                'message' => 'Database connection successful!',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database Connection Failed: ' . $e->getMessage(),
            ], 422);
        }
    }

    public function executeInstall(Request $request): JsonResponse
    {
        if (file_exists(storage_path('installed'))) {
            return response()->json(['message' => 'Application is already installed.'], 400);
        }

        $request->validate([
            'app_name' => 'required|string',
            'app_url' => 'required|url',
            'db_driver' => 'required|in:pgsql,mysql',
            'db_host' => 'required|string',
            'db_port' => 'required|numeric',
            'db_name' => 'required|string',
            'db_user' => 'required|string',
            'db_pass' => 'nullable|string',
            'admin_name' => 'required|string',
            'admin_email' => 'required|email',
            'admin_password' => 'required|string|min:8',
            'org_name' => 'required|string',
        ]);

        try {
            // 1. Write .env File
            $this->updateEnvFile([
                'APP_NAME' => '"' . $request->app_name . '"',
                'APP_URL' => $request->app_url,
                'APP_ENV' => 'production',
                'APP_DEBUG' => 'false',
                'DB_CONNECTION' => $request->db_driver,
                'DB_HOST' => $request->db_host,
                'DB_PORT' => $request->db_port,
                'DB_DATABASE' => $request->db_name,
                'DB_USERNAME' => $request->db_user,
                'DB_PASSWORD' => '"' . ($request->db_pass ?? '') . '"',
            ]);

            // Set DB Config dynamically for current request
            config([
                "database.default" => $request->db_driver,
                "database.connections.{$request->db_driver}" => [
                    'driver' => $request->db_driver,
                    'host' => $request->db_host,
                    'port' => $request->db_port,
                    'database' => $request->db_name,
                    'username' => $request->db_user,
                    'password' => $request->db_pass ?? '',
                    'charset' => 'utf8mb4',
                    'prefix' => '',
                ]
            ]);

            DB::purge();
            DB::reconnect();

            // 2. Generate App Key
            Artisan::call('key:generate', ['--force' => true]);

            // 3. Run Migrations & Seeders
            Artisan::call('migrate:fresh', ['--force' => true]);
            Artisan::call('db:seed', ['--force' => true]);

            // 4. Create / Provision Super Admin & Master Org
            $masterOrg = Organization::firstOrCreate(
                ['type' => 'platform'],
                ['name' => $request->org_name, 'slug' => 'platform-master', 'status' => 'active']
            );

            $admin = User::updateOrCreate(
                ['email' => $request->admin_email],
                [
                    'name' => $request->admin_name,
                    'password' => Hash::make($request->admin_password),
                    'status' => 'active',
                    'email_verified_at' => now(),
                    'current_organization_id' => $masterOrg->id,
                ]
            );

            $admin->syncRoles(['SUPER_ADMIN']);
            $masterOrg->users()->syncWithoutDetaching([$admin->id => ['role_within_org' => 'owner', 'status' => 'active']]);

            // 5. Write installed lockfile
            file_put_contents(storage_path('installed'), now()->toIso8601String());

            return response()->json([
                'success' => true,
                'message' => 'Commercial SaaS Platform successfully installed!',
                'admin_email' => $admin->email,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Installation Failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function updateEnvFile(array $data): void
    {
        $envPath = base_path('.env');
        if (!file_exists($envPath)) {
            copy(base_path('.env.example'), $envPath);
        }

        $envContent = file_get_contents($envPath);
        foreach ($data as $key => $value) {
            if (preg_match("/^{$key}=.*/m", $envContent)) {
                $envContent = preg_replace("/^{$key}=.*/m", "{$key}={$value}", $envContent);
            } else {
                $envContent .= "\n{$key}={$value}";
            }
        }
        file_get_contents($envPath);
        file_put_contents($envPath, $envContent);
    }
}
