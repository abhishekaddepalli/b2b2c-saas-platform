<?php

/**
 * Live test script to simulate the exact POST /api/v1/admin/services request
 * Usage: https://resell.infiniforge.cloud/test_api_call.php
 */

header('Content-Type: application/json');

$basePath = dirname(__DIR__);

if (!defined('LARAVEL_START')) {
    define('LARAVEL_START', microtime(true));
}

require $basePath . '/vendor/autoload.php';
$app = require_once $basePath . '/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);

$user = \App\Models\User::where('email', 'abhishek123.as42@gmail.com')->first();
$tokenObj = $user->createToken('diag-token', ['*'], now()->addYear());
$plainToken = $tokenObj->plainTextToken;

// Construct a simulated HTTP POST request
$payload = [
    'name' => 'VPS Diagnostic Cloud ' . rand(100, 999),
    'billing_interval' => 'monthly',
    'short_description' => 'Test cloud instance',
    'status' => 'active',
    'visibility' => 'public',
    'cost_price' => 299,
    'reseller_price' => 499,
    'customer_price' => 799,
    'featured' => true,
    'image_url' => 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=120',
];

$server = [
    'REQUEST_METHOD' => 'POST',
    'REQUEST_URI' => '/api/v1/admin/services?auth_token=' . urlencode($plainToken),
    'HTTP_AUTHORIZATION' => 'Bearer ' . $plainToken,
    'HTTP_X_AUTH_TOKEN' => $plainToken,
    'HTTP_X_USER_EMAIL' => $user->email,
    'CONTENT_TYPE' => 'application/json',
    'HTTP_ACCEPT' => 'application/json',
];

$request = \Illuminate\Http\Request::create(
    '/api/v1/admin/services?auth_token=' . urlencode($plainToken),
    'POST',
    [],
    [],
    [],
    $server,
    json_encode($payload)
);

try {
    $response = $kernel->handle($request);
    $status = $response->getStatusCode();
    $content = $response->getContent();
    $json = json_decode($content, true);

    echo json_encode([
        'user_id' => $user->id,
        'user_roles' => $user->getRoleNames(),
        'generated_token' => $plainToken,
        'response_status' => $status,
        'response_body' => $json ?: $content,
        'headers_sent_by_response' => $response->headers->all(),
    ], JSON_PRETTY_PRINT);
} catch (\Throwable $e) {
    echo json_encode([
        'error_class' => get_class($e),
        'error_message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => array_slice($e->getTrace(), 0, 5),
    ], JSON_PRETTY_PRINT);
}
