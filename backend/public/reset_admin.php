<?php

/**
 * Emergency Direct Password Sync & Environment Sanitization Utility (backend entrypoint)
 * Usage: https://resell.infiniforge.cloud/reset_admin.php
 */

header('Content-Type: text/html; charset=utf-8');

$basePath = dirname(__DIR__);
$envPath = $basePath . '/.env';

// Emergency 1-Click Git Updater
if (isset($_GET['git_sync'])) {
    header('Content-Type: application/json');
    $projectRoot = dirname($basePath);
    $output = [];
    $ret = -1;
    if (file_exists($envPath)) {
        @copy($envPath, $basePath . '/.env.backup');
    }
    $cmd = "cd {$projectRoot} && git fetch origin main 2>&1 && git reset --hard origin/main 2>&1";
    exec($cmd, $output, $ret);
    if (file_exists($basePath . '/.env.backup')) {
        @copy($basePath . '/.env.backup', $envPath);
    }
    @unlink($basePath . '/bootstrap/cache/config.php');
    @unlink($basePath . '/bootstrap/cache/routes-v7.php');
    @unlink($basePath . '/bootstrap/cache/packages.php');
    @unlink($basePath . '/bootstrap/cache/services.php');

    $commit = @exec("cd {$projectRoot} && git rev-parse --short HEAD");
    echo json_encode([
        'status' => $ret === 0 ? 'success' : 'completed_with_output',
        'current_commit' => $commit,
        'git_output' => $output,
    ], JSON_PRETTY_PRINT);
    exit;
}

// Clear any stale config cache
@unlink($basePath . '/bootstrap/cache/config.php');
@unlink($basePath . '/bootstrap/cache/routes-v7.php');
@unlink($basePath . '/bootstrap/cache/packages.php');
@unlink($basePath . '/bootstrap/cache/services.php');

// Handle DB Settings Submission from form or query
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_db_config'])) {
    $dbHost = $_POST['db_host'] ?? '127.0.0.1';
    $dbPort = $_POST['db_port'] ?? '3306';
    $dbName = $_POST['db_name'] ?? 'spideclo_resellsaas_db';
    $dbUser = $_POST['db_user'] ?? 'spideclo_resellsaasdb_user';
    $dbPass = $_POST['db_pass'] ?? '';

    $envContent = file_exists($envPath) ? file_get_contents($envPath) : '';
    $updates = [
        'DB_CONNECTION' => 'mysql',
        'DB_HOST' => $dbHost,
        'DB_PORT' => $dbPort,
        'DB_DATABASE' => $dbName,
        'DB_USERNAME' => $dbUser,
        'DB_PASSWORD' => $dbPass,
        'CACHE_DRIVER' => 'file',
        'SESSION_DRIVER' => 'file',
        'QUEUE_CONNECTION' => 'sync',
    ];

    foreach ($updates as $k => $v) {
        if (preg_match("/^{$k}=.*/m", $envContent)) {
            $envContent = preg_replace("/^{$k}=.*/m", "{$k}={$v}", $envContent);
        } else {
            $envContent .= "\n{$k}={$v}";
        }
    }
    file_put_contents($envPath, $envContent);
    header('Location: /reset_admin.php?db_updated=1');
    exit;
}

// Read current .env to test DB Connection
$currentEnv = file_exists($envPath) ? file_get_contents($envPath) : '';
preg_match('/^DB_CONNECTION=(.*)$/m', $currentEnv, $mConn);
preg_match('/^DB_HOST=(.*)$/m', $currentEnv, $mHost);
preg_match('/^DB_PORT=(.*)$/m', $currentEnv, $mPort);
preg_match('/^DB_DATABASE=(.*)$/m', $currentEnv, $mDb);
preg_match('/^DB_USERNAME=(.*)$/m', $currentEnv, $mUser);
preg_match('/^DB_PASSWORD=(.*)$/m', $currentEnv, $mPass);

$dbConn = trim($mConn[1] ?? 'mysql');
$dbHost = trim($mHost[1] ?? '127.0.0.1');
$dbPort = trim($mPort[1] ?? '3306');
$dbName = trim($mDb[1] ?? 'spideclo_resellsaas_db');
$dbUser = trim($mUser[1] ?? 'spideclo_resellsaasdb_user');
$dbPass = trim($mPass[1] ?? '');

// Test connection via PDO before booting Laravel
$pdoError = null;
if ($dbConn === 'pgsql' || empty($dbPass)) {
    $pdoError = ($dbConn === 'pgsql')
        ? 'Database is configured as pgsql instead of MySQL. Please configure your MySQL credentials.'
        : 'Database password is not set in backend/.env.';
} else {
    try {
        $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
        $pdo = new PDO($dsn, $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 4,
        ]);
    } catch (\Throwable $e) {
        $pdoError = $e->getMessage();
    }
}

// If DB connection fails, show clean config form
if ($pdoError) {
    echo "<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Database Setup & Admin Sync</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; box-sizing: border-box; }
        .card { background: #161f30; padding: 2.5rem; border-radius: 1.5rem; border: 1px solid #23324a; max-width: 500px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }
        h1 { color: #6366f1; font-size: 1.5rem; margin-top: 0; margin-bottom: 0.5rem; }
        p { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.5rem; line-height: 1.5; }
        .alert { background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 0.85rem; border-radius: 0.75rem; font-size: 0.82rem; margin-bottom: 1.5rem; }
        .field { margin-bottom: 1rem; text-align: left; }
        label { display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 0.4rem; }
        input { width: 100%; box-sizing: border-box; background: #0b0f19; border: 1px solid #23324a; border-radius: 0.75rem; padding: 0.75rem 1rem; color: #f8fafc; font-size: 0.9rem; font-family: monospace; outline: none; transition: border-color 0.2s; }
        input:focus { border-color: #6366f1; }
        button { width: 100%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; padding: 0.85rem; border-radius: 0.75rem; font-weight: 700; font-size: 0.95rem; cursor: pointer; margin-top: 0.75rem; transition: opacity 0.2s; }
        button:hover { opacity: 0.92; }
    </style>
</head>
<body>
    <div class='card'>
        <h1>MySQL Database Setup</h1>
        <p>Your database credentials must be configured so Laravel can connect to your cPanel MySQL database.</p>
        <div class='alert'>⚠️ <strong>Connection Notice:</strong> " . htmlspecialchars($pdoError) . "</div>
        <form method='POST'>
            <input type='hidden' name='save_db_config' value='1'>
            <div class='field'>
                <label>Database Host</label>
                <input type='text' name='db_host' value='" . htmlspecialchars($dbHost) . "' required>
            </div>
            <div class='field'>
                <label>Database Port</label>
                <input type='text' name='db_port' value='" . htmlspecialchars($dbPort) . "' required>
            </div>
            <div class='field'>
                <label>Database Name</label>
                <input type='text' name='db_name' value='" . htmlspecialchars($dbName) . "' required>
            </div>
            <div class='field'>
                <label>Database User</label>
                <input type='text' name='db_user' value='" . htmlspecialchars($dbUser) . "' required>
            </div>
            <div class='field'>
                <label>Database Password</label>
                <input type='password' name='db_pass' placeholder='Enter your cPanel MySQL password' required autofocus>
            </div>
            <button type='submit'>Save Database Credentials &rarr;</button>
        </form>
    </div>
</body>
</html>";
    exit;
}

// Database connects! Now bootstrap Laravel and synchronize Super Admin
$email = $_GET['email'] ?? 'abhishek123.as42@gmail.com';
$password = $_GET['password'] ?? 'Admin@1234';

if (!defined('LARAVEL_START')) {
    define('LARAVEL_START', microtime(true));
}

require $basePath . '/vendor/autoload.php';
$app = require_once $basePath . '/bootstrap/app.php';

$console = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$console->bootstrap();

$masterOrg = \App\Models\Organization::firstOrCreate(
    ['type' => 'platform'],
    ['name' => 'Platform Master', 'slug' => 'platform-master', 'status' => 'active']
);

$user = \App\Models\User::firstOrNew(['email' => $email]);
$user->name = 'Super Admin';
$user->password = $password; // Eloquent 'password' => 'hashed' cast hashes it ONCE
$user->status = 'active';
$user->email_verified_at = now();
$user->current_organization_id = $masterOrg->id;
$user->save();

$superRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'SUPER_ADMIN', 'guard_name' => 'web']);
$user->syncRoles([$superRole]);
$masterOrg->users()->syncWithoutDetaching([$user->id => ['role_within_org' => 'owner', 'status' => 'active']]);

// Purge all dummy demo accounts so only master admin remains
\App\Models\User::where('email', '!=', $email)->forceDelete();

if (!file_exists($basePath . '/storage/installed')) {
    file_put_contents($basePath . '/storage/installed', date('c'));
}

echo "<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Super Admin Account Synchronized</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #161f30; padding: 2.5rem; border-radius: 1.5rem; border: 1px solid #23324a; max-width: 460px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); text-align: center; }
        h1 { color: #10b981; font-size: 1.5rem; margin-bottom: 0.5rem; }
        p { color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem; }
        .box { background: #0b0f19; padding: 1rem; border-radius: 0.75rem; text-align: left; font-family: monospace; font-size: 0.85rem; margin-bottom: 1.5rem; border: 1px solid #23324a; }
        .box div { margin: 0.25rem 0; }
        a { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 0.8rem 1.75rem; border-radius: 0.75rem; text-decoration: none; font-weight: 700; font-size: 0.92rem; transition: opacity 0.2s; }
        a:hover { opacity: 0.92; }
    </style>
</head>
<body>
    <div class='card'>
        <h1>Account Synchronized!</h1>
        <p>Database connected, caches purged, and master Super Admin account is 100% active.</p>
        <div class='box'>
            <div><strong>Email:</strong> " . htmlspecialchars($email) . "</div>
            <div><strong>Password:</strong> " . htmlspecialchars($password) . "</div>
            <div><strong>Role:</strong> SUPER_ADMIN</div>
            <div><strong>Database:</strong> " . htmlspecialchars($dbName) . "</div>
            <div><strong>Status:</strong> Active & Verified</div>
        </div>
        <a href='/login'>Proceed to Login &rarr;</a>
    </div>
</body>
</html>";
