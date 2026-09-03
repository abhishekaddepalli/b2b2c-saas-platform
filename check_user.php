<?php

/**
 * Diagnostic tool to inspect user record and verify authentication
 */

header('Content-Type: application/json');

$basePath = __DIR__ . '/backend';
if (!is_dir($basePath)) $basePath = __DIR__;

if (!defined('LARAVEL_START')) {
    define('LARAVEL_START', microtime(true));
}

require $basePath . '/vendor/autoload.php';
$app = require_once $basePath . '/bootstrap/app.php';
$console = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$console->bootstrap();

$email = $_GET['email'] ?? 'abhishek123.as42@gmail.com';
$testPass = $_GET['pass'] ?? '';

$user = \App\Models\User::withTrashed()->where('email', $email)->first();

$allUsers = \App\Models\User::withTrashed()->get(['id', 'email', 'status', 'deleted_at'])->toArray();

$authAttemptResult = false;
$hashCheckResult = false;
if ($user && $testPass !== '') {
    $hashCheckResult = \Illuminate\Support\Facades\Hash::check($testPass, $user->password);
    $authAttemptResult = \Illuminate\Support\Facades\Auth::attempt(['email' => $email, 'password' => $testPass]);
}

echo json_encode([
    'requested_email' => $email,
    'user_found' => (bool)$user,
    'user_id' => $user?->id,
    'user_email' => $user?->email,
    'user_status' => $user?->status,
    'is_deleted' => (bool)$user?->deleted_at,
    'password_hash_prefix' => $user ? substr($user->password, 0, 10) : null,
    'password_length' => $user ? strlen($user->password) : 0,
    'test_pass_provided' => !empty($testPass),
    'hash_check_matches' => $hashCheckResult,
    'auth_attempt_matches' => $authAttemptResult,
    'all_users_in_db' => $allUsers,
], JSON_PRETTY_PRINT);
