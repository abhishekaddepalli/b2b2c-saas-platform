<?php

/**
 * Direct Standalone Entrypoint for Web Installer API
 * Bypasses LiteSpeed mod_rewrite internal handler fallback to ensure PHP 8.3 + pdo_mysql execution
 */

define('LARAVEL_START', microtime(true));

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::capture();
$kernel->handle($request);

$action = $request->input('action') ?? $request->query('action');

$controller = new \App\Http\Controllers\Api\V1\InstallerController();

try {
    switch ($action) {
        case 'status':
            $response = $controller->status();
            break;
        case 'requirements':
            $response = $controller->checkRequirements();
            break;
        case 'test-db':
            $response = $controller->testDatabase($request);
            break;
        case 'execute':
            $response = $controller->executeInstall($request);
            break;
        default:
            $response = response()->json(['message' => 'Invalid installer action'], 400);
            break;
    }

    header('Content-Type: application/json');
    echo $response->getContent();
} catch (\Throwable $e) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Installer API Error: ' . $e->getMessage(),
    ]);
}
