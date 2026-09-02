<?php

/**
 * Pure Standalone Web Installer API (Backend Entrypoint)
 * Direct 1-click execution under active PHP version (PHP 8.3)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

$action = $_REQUEST['action'] ?? '';
$inputRaw = file_get_contents('php://input');
$body = json_decode($inputRaw, true) ?? [];
$params = array_merge($_REQUEST, $body);

$basePath = dirname(__DIR__);
$storagePath = $basePath . '/storage';

switch ($action) {
    case 'status':
        echo json_encode([
            'installed' => file_exists($storagePath . '/installed'),
        ]);
        exit;

    case 'requirements':
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

        $storageDirs = [
            $storagePath . '/app',
            $storagePath . '/app/public',
            $storagePath . '/framework',
            $storagePath . '/framework/cache',
            $storagePath . '/framework/sessions',
            $storagePath . '/framework/views',
            $storagePath . '/logs',
            $basePath . '/bootstrap/cache',
        ];

        foreach ($storageDirs as $dir) {
            if (!file_exists($dir)) {
                @mkdir($dir, 0775, true);
            }
        }

        $permissions = [
            'storage/app' => is_writable($storagePath . '/app'),
            'storage/framework' => is_writable($storagePath . '/framework'),
            'storage/logs' => is_writable($storagePath . '/logs'),
            'bootstrap/cache' => is_writable($basePath . '/bootstrap/cache'),
        ];

        $allRequirementsMet = $phpPassed && !in_array(false, $extensions, true) && !in_array(false, $permissions, true);

        echo json_encode([
            'all_met' => $allRequirementsMet,
            'php' => ['version' => $phpVersion, 'passed' => $phpPassed],
            'extensions' => $extensions,
            'permissions' => $permissions,
        ]);
        exit;

    case 'test-db':
        $driver = $params['db_driver'] ?? 'mysql';
        $host = $params['db_host'] ?? 'localhost';
        $port = $params['db_port'] ?? '3306';
        $dbName = $params['db_name'] ?? '';
        $user = $params['db_user'] ?? '';
        $pass = $params['db_pass'] ?? '';

        $hostsToTry = [$host];
        if ($host === 'localhost') {
            $hostsToTry[] = '127.0.0.1';
        } elseif ($host === '127.0.0.1') {
            $hostsToTry[] = 'localhost';
        }

        $lastError = '';
        foreach ($hostsToTry as $h) {
            try {
                if ($driver === 'mysql') {
                    $dsn = "mysql:host={$h};port={$port};dbname={$dbName};charset=utf8mb4";
                    $pdo = new \PDO($dsn, $user, $pass, [
                        \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                        \PDO::ATTR_TIMEOUT => 5,
                    ]);
                } else {
                    $dsn = "pgsql:host={$h};port={$port};dbname={$dbName}";
                    $pdo = new \PDO($dsn, $user, $pass, [
                        \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                        \PDO::ATTR_TIMEOUT => 5,
                    ]);
                }

                echo json_encode([
                    'success' => true,
                    'message' => 'Database connection successful!',
                ]);
                exit;
            } catch (\Throwable $e) {
                $lastError = $e->getMessage();
                if ($driver === 'mysql' && function_exists('mysqli_connect')) {
                    $conn = @mysqli_connect($h, $user, $pass, $dbName, (int)$port);
                    if ($conn) {
                        mysqli_close($conn);
                        echo json_encode([
                            'success' => true,
                            'message' => 'Database connection successful!',
                        ]);
                        exit;
                    }
                    $mErr = mysqli_connect_error();
                    if ($mErr) {
                        $lastError = $mErr;
                    }
                }
            }
        }

        $drivers = class_exists('PDO') ? implode(', ', \PDO::getAvailableDrivers()) : 'none';
        http_response_code(422);
        echo json_encode([
            'success' => false,
            'message' => 'Database Connection Failed: ' . $lastError . " (Active PDO Drivers: {$drivers})",
        ]);
        exit;

    case 'execute':
        if (file_exists($storagePath . '/installed')) {
            http_response_code(400);
            echo json_encode(['message' => 'Application is already installed.']);
            exit;
        }

        try {
            // Write .env
            $envPath = $basePath . '/.env';
            if (!file_exists($envPath)) {
                copy($basePath . '/.env.example', $envPath);
            }

            $envContent = file_get_contents($envPath);
            $envData = [
                'APP_NAME' => '"' . ($params['app_name'] ?? 'SaaS Platform') . '"',
                'APP_URL' => $params['app_url'] ?? 'http://localhost',
                'APP_ENV' => 'production',
                'APP_DEBUG' => 'false',
                'DB_CONNECTION' => $params['db_driver'] ?? 'mysql',
                'DB_HOST' => $params['db_host'] ?? 'localhost',
                'DB_PORT' => $params['db_port'] ?? '3306',
                'DB_DATABASE' => $params['db_name'] ?? '',
                'DB_USERNAME' => $params['db_user'] ?? '',
                'DB_PASSWORD' => '"' . ($params['db_pass'] ?? '') . '"',
            ];

            foreach ($envData as $k => $v) {
                if (preg_match("/^{$k}=.*/m", $envContent)) {
                    $envContent = preg_replace("/^{$k}=.*/m", "{$k}={$v}", $envContent);
                } else {
                    $envContent .= "\n{$k}={$v}";
                }
            }
            file_put_contents($envPath, $envContent);

            // Boot Laravel for Artisan Migrations & Admin Provisioning
            if (!defined('LARAVEL_START')) {
                define('LARAVEL_START', microtime(true));
            }

            require $basePath . '/vendor/autoload.php';
            $app = require_once $basePath . '/bootstrap/app.php';

            $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
            $kernel->bootstrap();

            $dbDriver = $params['db_driver'] ?? 'mysql';
            $dbHost = $params['db_host'] ?? 'localhost';
            $dbPort = $params['db_port'] ?? '3306';
            $dbName = $params['db_name'] ?? '';
            $dbUser = $params['db_user'] ?? '';
            $dbPass = $params['db_pass'] ?? '';

            config([
                'app.name' => $params['app_name'] ?? 'Commercial SaaS Platform',
                'app.url' => $params['app_url'] ?? 'http://localhost',
                'database.default' => $dbDriver,
                "database.connections.{$dbDriver}" => [
                    'driver' => $dbDriver,
                    'host' => $dbHost,
                    'port' => $dbPort,
                    'database' => $dbName,
                    'username' => $dbUser,
                    'password' => $dbPass,
                    'charset' => 'utf8mb4',
                    'prefix' => '',
                ]
            ]);

            \Illuminate\Support\Facades\DB::purge();
            \Illuminate\Support\Facades\DB::reconnect();

            \Illuminate\Support\Facades\Artisan::call('key:generate', ['--force' => true]);
            \Illuminate\Support\Facades\Artisan::call('migrate:fresh', ['--force' => true]);
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);

            $masterOrg = \App\Models\Organization::firstOrCreate(
                ['type' => 'platform'],
                ['name' => $params['org_name'] ?? 'Platform Master', 'slug' => 'platform-master', 'status' => 'active']
            );

            $admin = \App\Models\User::updateOrCreate(
                ['email' => $params['admin_email']],
                [
                    'name' => $params['admin_name'] ?? 'Super Admin',
                    'password' => \Illuminate\Support\Facades\Hash::make($params['admin_password']),
                    'status' => 'active',
                    'email_verified_at' => now(),
                    'current_organization_id' => $masterOrg->id,
                ]
            );

            $admin->syncRoles(['SUPER_ADMIN']);
            $masterOrg->users()->syncWithoutDetaching([$admin->id => ['role_within_org' => 'owner', 'status' => 'active']]);

            file_put_contents($storagePath . '/installed', date('c'));

            echo json_encode([
                'success' => true,
                'message' => 'Commercial SaaS Platform successfully installed!',
                'admin_email' => $admin->email,
            ]);
            exit;
        } catch (\Throwable $e) {
            http_response_code(422);
            echo json_encode([
                'success' => false,
                'message' => 'Installation Failed: ' . $e->getMessage(),
            ]);
            exit;
        }

    default:
        http_response_code(400);
        echo json_encode(['message' => 'Invalid action parameter']);
        exit;
}
