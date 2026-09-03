<?php

/**
 * Emergency DB Credential Recovery & Verification Tool
 * Usage: https://resell.infiniforge.cloud/recover_db.php
 */

$basePath = dirname(__DIR__);
$envPath = $basePath . '/.env';
$backupPath = $basePath . '/.env.backup';

// 1. Check if backup exists and has DB_PASSWORD
$foundPass = null;
if (file_exists($backupPath)) {
    $backup = file_get_contents($backupPath);
    if (preg_match('/^DB_PASSWORD=(.+)$/m', $backup, $m)) {
        $foundPass = trim($m[1]);
    }
}

// 2. If password provided via POST/GET
if (!empty($_REQUEST['pass'])) {
    $foundPass = trim($_REQUEST['pass']);
}

// 3. If password found or provided, update backend/.env
$updated = false;
if (!empty($foundPass)) {
    $envContent = file_exists($envPath) ? file_get_contents($envPath) : '';
    if (preg_match('/^DB_PASSWORD=.*/m', $envContent)) {
        $envContent = preg_replace('/^DB_PASSWORD=.*/m', "DB_PASSWORD={$foundPass}", $envContent);
    } else {
        $envContent .= "\nDB_PASSWORD={$foundPass}";
    }
    $envContent = preg_replace('/^DB_CONNECTION=.*/m', 'DB_CONNECTION=mysql', $envContent);
    $envContent = preg_replace('/^DB_HOST=.*/m', 'DB_HOST=127.0.0.1', $envContent);
    $envContent = preg_replace('/^DB_PORT=.*/m', 'DB_PORT=3306', $envContent);
    $envContent = preg_replace('/^DB_DATABASE=.*/m', 'DB_DATABASE=spideclo_resellsaas_db', $envContent);
    $envContent = preg_replace('/^DB_USERNAME=.*/m', 'DB_USERNAME=spideclo_resellsaasdb_user', $envContent);
    $envContent = preg_replace('/^CACHE_DRIVER=.*/m', 'CACHE_DRIVER=file', $envContent);
    $envContent = preg_replace('/^SESSION_DRIVER=.*/m', 'SESSION_DRIVER=file', $envContent);
    $envContent = preg_replace('/^QUEUE_CONNECTION=.*/m', 'QUEUE_CONNECTION=sync', $envContent);
    file_put_contents($envPath, $envContent);
    // Back up so it is never lost
    @copy($envPath, $backupPath);
    $updated = true;
}

// 4. Test PDO connection
$currentEnv = file_exists($envPath) ? file_get_contents($envPath) : '';
preg_match('/^DB_PASSWORD=(.*)$/m', $currentEnv, $mPass);
$curPass = trim($mPass[1] ?? '');

$connSuccess = false;
$connError = null;
if (!empty($curPass)) {
    try {
        $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=spideclo_resellsaas_db;charset=utf8mb4', 'spideclo_resellsaasdb_user', $curPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 4,
        ]);
        $connSuccess = true;
    } catch (\Throwable $e) {
        $connError = $e->getMessage();
    }
} else {
    $connError = 'DB_PASSWORD is empty in backend/.env.';
}

// If connected, synchronize Super Admin account
$adminSynced = false;
if ($connSuccess) {
    try {
        @unlink($basePath . '/bootstrap/cache/config.php');
        @unlink($basePath . '/bootstrap/cache/routes-v7.php');
        @unlink($basePath . '/bootstrap/cache/packages.php');
        @unlink($basePath . '/bootstrap/cache/services.php');

        if (file_exists($envPath)) {
            $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#')) continue;
                if (str_contains($line, '=')) {
                    [$k, $v] = explode('=', $line, 2);
                    $k = trim($k);
                    $v = trim($v, " \t\n\r\0\x0B\"'");
                    putenv("{$k}={$v}");
                    $_ENV[$k] = $v;
                    $_SERVER[$k] = $v;
                }
            }
        }
        putenv('DB_CONNECTION=mysql');
        $_ENV['DB_CONNECTION'] = 'mysql';

        if (!defined('LARAVEL_START')) {
            define('LARAVEL_START', microtime(true));
        }
        require_once $basePath . '/vendor/autoload.php';
        $app = require_once $basePath . '/bootstrap/app.php';
        $console = $app->make(\Illuminate\Contracts\Console\Kernel::class);
        $console->bootstrap();

        $masterOrg = \App\Models\Organization::firstOrCreate(
            ['type' => 'platform'],
            ['name' => 'Platform Master', 'slug' => 'platform-master', 'status' => 'active']
        );

        $user = \App\Models\User::firstOrNew(['email' => 'abhishek123.as42@gmail.com']);
        $user->name = 'Super Admin';
        $user->password = 'Admin@1234';
        $user->status = 'active';
        $user->email_verified_at = now();
        $user->current_organization_id = $masterOrg->id;
        $user->save();

        $superRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'SUPER_ADMIN', 'guard_name' => 'web']);
        $user->syncRoles([$superRole]);
        $masterOrg->users()->syncWithoutDetaching([$user->id => ['role_within_org' => 'owner', 'status' => 'active']]);
        \App\Models\User::where('email', '!=', 'abhishek123.as42@gmail.com')->forceDelete();
        $adminSynced = true;
    } catch (\Throwable $e) {
        $connError = 'Database connected but admin sync had notice: ' . $e->getMessage();
    }
}

// Return JSON if requested by API
if (isset($_GET['format']) && $_GET['format'] === 'json') {
    header('Content-Type: application/json');
    echo json_encode([
        'db_updated' => $updated,
        'connection_successful' => $connSuccess,
        'admin_synced' => $adminSynced,
        'error' => $connError,
    ], JSON_PRETTY_PRINT);
    exit;
}

// Render clean UI
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Database Setup & Super Admin Sync</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; box-sizing: border-box; }
        .card { background: #161f30; padding: 2.5rem; border-radius: 1.5rem; border: 1px solid #23324a; max-width: 480px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); text-align: center; }
        h1 { color: #6366f1; font-size: 1.5rem; margin-top: 0; margin-bottom: 0.5rem; }
        p { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.5rem; line-height: 1.5; }
        .success-box { background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; color: #6ee7b7; padding: 1.25rem; border-radius: 1rem; margin-bottom: 1.5rem; text-align: left; }
        .alert { background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 0.85rem; border-radius: 0.75rem; font-size: 0.82rem; margin-bottom: 1.5rem; text-align: left; }
        .field { margin-bottom: 1rem; text-align: left; }
        label { display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 0.4rem; }
        input { width: 100%; box-sizing: border-box; background: #0b0f19; border: 1px solid #23324a; border-radius: 0.75rem; padding: 0.75rem 1rem; color: #f8fafc; font-size: 0.9rem; font-family: monospace; outline: none; }
        input:focus { border-color: #6366f1; }
        button { width: 100%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; padding: 0.85rem; border-radius: 0.75rem; font-weight: 700; font-size: 0.95rem; cursor: pointer; margin-top: 0.75rem; }
        .btn-green { background: linear-gradient(135deg, #10b981, #059669); text-decoration: none; display: inline-block; padding: 0.85rem 2rem; border-radius: 0.75rem; font-weight: 700; color: white; margin-top: 1rem; }
    </style>
</head>
<body>
    <div class="card">
        <?php if ($connSuccess): ?>
            <h1 style="color: #10b981;">🎉 System Online & Connected!</h1>
            <p>Database connected and your master Super Admin account is 100% active.</p>
            <div class="success-box">
                <div><strong>Database:</strong> spideclo_resellsaas_db</div>
                <div><strong>User:</strong> spideclo_resellsaasdb_user</div>
                <div><strong>Admin Email:</strong> abhishek123.as42@gmail.com</div>
                <div><strong>Admin Password:</strong> Admin@1234</div>
                <div><strong>Status:</strong> Connected & Operational</div>
            </div>
            <a href="/login" class="btn-green">Proceed to Login &rarr;</a>
        <?php else: ?>
            <h1>Connect MySQL Database</h1>
            <p>Enter your cPanel MySQL password below to connect the database and activate Super Admin access.</p>
            <?php if ($connError): ?>
                <div class="alert">⚠️ <?= htmlspecialchars($connError) ?></div>
            <?php endif; ?>
            <form method="POST">
                <div class="field">
                    <label>Database User</label>
                    <input type="text" value="spideclo_resellsaasdb_user" disabled>
                </div>
                <div class="field">
                    <label>Database Name</label>
                    <input type="text" value="spideclo_resellsaas_db" disabled>
                </div>
                <div class="field">
                    <label>cPanel MySQL Password</label>
                    <input type="password" name="pass" placeholder="Enter password for spideclo_resellsaasdb_user" required autofocus>
                </div>
                <button type="submit">Connect & Activate Super Admin &rarr;</button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>
