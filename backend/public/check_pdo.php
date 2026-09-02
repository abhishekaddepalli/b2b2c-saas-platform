<?php
header('Content-Type: application/json');
echo json_encode([
    'php_version' => PHP_VERSION,
    'pdo_loaded' => extension_loaded('pdo'),
    'pdo_mysql' => extension_loaded('pdo_mysql'),
    'nd_pdo_mysql' => extension_loaded('nd_pdo_mysql'),
    'mysqli' => extension_loaded('mysqli'),
    'nd_mysqli' => extension_loaded('nd_mysqli'),
    'mysqlnd' => extension_loaded('mysqlnd'),
    'available_pdo_drivers' => class_exists('PDO') ? PDO::getAvailableDrivers() : [],
], JSON_PRETTY_PRINT);
