<?php

/**
 * Emergency Direct Password Sync Utility
 * Usage: https://resell.infiniforge.cloud/reset_admin.php?password=YOUR_PASSWORD
 */

header('Content-Type: text/html; charset=utf-8');

$basePath = __DIR__ . '/backend';
if (!is_dir($basePath)) {
    $basePath = __DIR__;
}

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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 2.5rem; border-radius: 1.5rem; border: 1px solid #334155; max-width: 460px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); text-align: center; }
        h1 { color: #10b981; font-size: 1.5rem; margin-bottom: 0.5rem; }
        p { color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem; }
        .box { background: #0f172a; padding: 1rem; border-radius: 0.75rem; text-align: left; font-family: monospace; font-size: 0.85rem; margin-bottom: 1.5rem; border: 1px solid #334155; }
        .box div { margin: 0.25rem 0; }
        a { display: inline-block; background: #6366f1; color: white; padding: 0.75rem 1.5rem; border-radius: 0.75rem; text-decoration: none; font-weight: 600; font-size: 0.9rem; transition: 0.2s; }
        a:hover { background: #4f46e5; }
    </style>
</head>
<body>
    <div class='card'>
        <h1>Account Synchronized!</h1>
        <p>Your master Super Admin account has been activated and all demo users purged.</p>
        <div class='box'>
            <div><strong>Email:</strong> " . htmlspecialchars($email) . "</div>
            <div><strong>Password:</strong> " . htmlspecialchars($password) . "</div>
            <div><strong>Role:</strong> SUPER_ADMIN</div>
            <div><strong>Status:</strong> Active</div>
        </div>
        <a href='/login'>Proceed to Login &rarr;</a>
    </div>
</body>
</html>";
