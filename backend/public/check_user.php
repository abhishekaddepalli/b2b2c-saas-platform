<?php

/**
 * Diagnostic tool to inspect user record, roles, tokens, and test Sanctum token resolution
 */

header('Content-Type: application/json');

$basePath = dirname(__DIR__);

if (!defined('LARAVEL_START')) {
    define('LARAVEL_START', microtime(true));
}

require $basePath . '/vendor/autoload.php';
$app = require_once $basePath . '/bootstrap/app.php';
$console = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$console->bootstrap();

$email = $_GET['email'] ?? 'abhishek123.as42@gmail.com';
$user = \App\Models\User::withTrashed()->where('email', $email)->first();

$roles = [];
if ($user) {
    try {
        $roles = $user->getRoleNames()->toArray();
    } catch (\Throwable $e) {
        $roles = ['error' => $e->getMessage()];
    }
}

$tokensInDb = [];
if ($user) {
    $tokensInDb = \Illuminate\Support\Facades\DB::table('personal_access_tokens')
        ->where('tokenable_id', $user->id)
        ->latest('id')
        ->limit(10)
        ->get(['id', 'name', 'tokenable_id', 'expires_at', 'created_at', 'last_used_at'])
        ->toArray();
}

$testTokenResult = null;
if ($user && isset($_GET['create_test_token'])) {
    $tokenObj = $user->createToken('test-token', ['*'], now()->addYear());
    $plain = $tokenObj->plainTextToken;
    $found = \Laravel\Sanctum\PersonalAccessToken::findToken($plain);
    $testTokenResult = [
        'plain_token' => $plain,
        'resolved_successfully' => (bool)$found,
        'resolved_user_id' => $found?->tokenable_id,
    ];
}

$verifyProvidedToken = null;
if (!empty($_GET['verify_token'])) {
    $found = \Laravel\Sanctum\PersonalAccessToken::findToken($_GET['verify_token']);
    $verifyProvidedToken = [
        'provided' => $_GET['verify_token'],
        'found' => (bool)$found,
        'tokenable_id' => $found?->tokenable_id,
    ];
}

echo json_encode([
    'user_id' => $user?->id,
    'email' => $user?->email,
    'status' => $user?->status,
    'roles' => $roles,
    'tokens_count' => count($tokensInDb),
    'recent_tokens' => $tokensInDb,
    'test_token_generation' => $testTokenResult,
    'verify_token' => $verifyProvidedToken,
], JSON_PRETTY_PRINT);
