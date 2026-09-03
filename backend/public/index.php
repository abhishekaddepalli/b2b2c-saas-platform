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

// Determine if the application is under maintenance...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
