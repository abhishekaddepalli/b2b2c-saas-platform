<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Force cPanel-safe drivers so misconfigured Redis never hangs the application
putenv('CACHE_STORE=file');
putenv('CACHE_DRIVER=file');
putenv('SESSION_DRIVER=file');
putenv('QUEUE_CONNECTION=sync');
putenv('REDIS_HOST=127.0.0.1');
$_ENV['CACHE_STORE'] = 'file';
$_ENV['CACHE_DRIVER'] = 'file';
$_ENV['SESSION_DRIVER'] = 'file';
$_ENV['QUEUE_CONNECTION'] = 'sync';
$_ENV['REDIS_HOST'] = '127.0.0.1';

// Restore Authorization header if stripped by LiteSpeed / Apache FastCGI
$authToken = null;
if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
    $authToken = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authToken = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
} elseif (!empty($_SERVER['HTTP_X_AUTH_TOKEN'])) {
    $authToken = 'Bearer ' . $_SERVER['HTTP_X_AUTH_TOKEN'];
} elseif (function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    if (!empty($headers['Authorization'])) {
        $authToken = $headers['Authorization'];
    } elseif (!empty($headers['authorization'])) {
        $authToken = $headers['authorization'];
    } elseif (!empty($headers['X-Auth-Token'])) {
        $authToken = 'Bearer ' . $headers['X-Auth-Token'];
    } elseif (!empty($headers['x-auth-token'])) {
        $authToken = 'Bearer ' . $headers['x-auth-token'];
    }
}
if ($authToken) {
    $_SERVER['HTTP_AUTHORIZATION'] = $authToken;
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
