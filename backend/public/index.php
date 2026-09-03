<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Explicitly load backend/.env into PHP environment before booting Laravel
$envFile = dirname(__DIR__) . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
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

// Guarantee cPanel production drivers
putenv('DB_CONNECTION=mysql');
$_ENV['DB_CONNECTION'] = 'mysql';
putenv('CACHE_STORE=file');
putenv('CACHE_DRIVER=file');
putenv('SESSION_DRIVER=file');
putenv('QUEUE_CONNECTION=sync');
$_ENV['CACHE_STORE'] = 'file';
$_ENV['CACHE_DRIVER'] = 'file';
$_ENV['SESSION_DRIVER'] = 'file';
$_ENV['QUEUE_CONNECTION'] = 'sync';

// Restore Authorization header if stripped by LiteSpeed / Apache FastCGI
$authToken = null;
if (!empty($_GET['auth_token']) && $_GET['auth_token'] !== 'null') {
    $authToken = 'Bearer ' . $_GET['auth_token'];
} elseif (!empty($_GET['token']) && $_GET['token'] !== 'null') {
    $authToken = 'Bearer ' . $_GET['token'];
} elseif (!empty($_SERVER['HTTP_X_AUTH_TOKEN']) && $_SERVER['HTTP_X_AUTH_TOKEN'] !== 'null') {
    $authToken = 'Bearer ' . $_SERVER['HTTP_X_AUTH_TOKEN'];
} elseif (!empty($_SERVER['HTTP_AUTHORIZATION']) && $_SERVER['HTTP_AUTHORIZATION'] !== 'Bearer null' && $_SERVER['HTTP_AUTHORIZATION'] !== 'Bearer ') {
    $authToken = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) && $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] !== 'Bearer null') {
    $authToken = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
} elseif (function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    if (!empty($headers['X-Auth-Token'])) {
        $authToken = 'Bearer ' . $headers['X-Auth-Token'];
    } elseif (!empty($headers['x-auth-token'])) {
        $authToken = 'Bearer ' . $headers['x-auth-token'];
    } elseif (!empty($headers['Authorization'])) {
        $authToken = $headers['Authorization'];
    } elseif (!empty($headers['authorization'])) {
        $authToken = $headers['authorization'];
    }
}
if ($authToken) {
    $_SERVER['HTTP_AUTHORIZATION'] = $authToken;
    putenv("HTTP_AUTHORIZATION={$authToken}");
}

// Determine if the application is under maintenance...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
