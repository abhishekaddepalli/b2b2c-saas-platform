<?php

/**
 * Emergency DB Credential Recovery & Verification Tool
 * Usage: https://resell.infiniforge.cloud/recover_db.php?pass=YOUR_MYSQL_PASSWORD
 */

header('Content-Type: application/json');

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

// 2. If password provided via query/body
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
    file_put_contents($envPath, $envContent);
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
    $connError = 'DB_PASSWORD is empty in backend/.env. Please specify your MySQL password.';
}

echo json_encode([
    'db_updated' => $updated,
    'password_configured' => !empty($curPass),
    'connection_successful' => $connSuccess,
    'error' => $connError,
    'database' => 'spideclo_resellsaas_db',
    'username' => 'spideclo_resellsaasdb_user',
    'instructions' => $connSuccess 
        ? 'Database connected successfully! You can now log in and all admin actions will succeed.' 
        : 'Please call https://resell.infiniforge.cloud/recover_db.php?pass=YOUR_CPANEL_MYSQL_PASSWORD to save your MySQL password.',
], JSON_PRETTY_PRINT);
