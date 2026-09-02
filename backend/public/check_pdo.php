<?php
header('Content-Type: application/json');
echo json_encode([
    'php_version' => PHP_VERSION,
    'script' => $_SERVER['SCRIPT_FILENAME'] ?? '',
    'ini_file' => php_ini_loaded_file(),
    'pdo_loaded' => extension_loaded('pdo'),
    'pdo_mysql' => extension_loaded('pdo_mysql'),
    'nd_pdo_mysql' => extension_loaded('nd_pdo_mysql'),
    'mysqli' => extension_loaded('mysqli'),
    'available_pdo_drivers' => class_exists('PDO') ? PDO::getAvailableDrivers() : [],
], JSON_PRETTY_PRINT);
