<?php

/**
 * Infiniforge Catalog Web Seeder & Sync Tool
 * Usage: https://resell.infiniforge.cloud/sync_catalog.php
 * JSON Mode: https://resell.infiniforge.cloud/sync_catalog.php?format=json
 */

header('Content-Type: text/html; charset=utf-8');

$basePath = dirname(__DIR__);

// Clear any stale cached configuration
@unlink($basePath . '/bootstrap/cache/config.php');
@unlink($basePath . '/bootstrap/cache/routes-v7.php');
@unlink($basePath . '/bootstrap/cache/packages.php');
@unlink($basePath . '/bootstrap/cache/services.php');

if (!defined('LARAVEL_START')) {
    define('LARAVEL_START', microtime(true));
}

require $basePath . '/vendor/autoload.php';
$app = require_once $basePath . '/bootstrap/app.php';

$console = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$console->bootstrap();

$status = 'success';
$error = null;
$output = '';

try {
    // 1. Run the InfiniforgeCatalogSeeder
    \Illuminate\Support\Facades\Artisan::call('db:seed', [
        '--class' => 'InfiniforgeCatalogSeeder',
        '--force' => true,
    ]);
    $output = \Illuminate\Support\Facades\Artisan::output();

    // 2. Clear application caches
    \Illuminate\Support\Facades\Artisan::call('cache:clear');
    \Illuminate\Support\Facades\Artisan::call('route:clear');
    \Illuminate\Support\Facades\Artisan::call('config:clear');

    // 3. Gather stats
    $categories = \App\Models\Category::withCount(['products', 'services'])->orderBy('name')->get();
    $catCount = $categories->count();
    $prodCount = \App\Models\Product::count();
    $servCount = \App\Models\Service::count();
    $softwareCount = \App\Models\Service::where('metadata->architecture_type', 'bundle')->count();

} catch (\Throwable $e) {
    $status = 'error';
    $error = $e->getMessage();
}

if (isset($_GET['format']) && $_GET['format'] === 'json') {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => $status,
        'categories_count' => $catCount ?? 0,
        'products_count' => $prodCount ?? 0,
        'services_count' => $servCount ?? 0,
        'error' => $error,
        'output' => $output,
    ], JSON_PRETTY_PRINT);
    exit;
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Infiniforge Catalog Synchronization</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #090d16;
            color: #f1f5f9;
            padding: 2rem 1rem;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            max-width: 760px;
            width: 100%;
            background: #111827;
            border: 1px solid #1f2937;
            border-radius: 1.5rem;
            padding: 2.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.35rem 0.85rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 1.25rem;
        }
        .badge-success { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-error { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        h1 { font-size: 1.85rem; font-weight: 900; margin-bottom: 0.5rem; color: #ffffff; }
        p.subtitle { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin-bottom: 2rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .stat-card {
            background: #1e293b;
            border: 1px solid #334155;
            padding: 1.25rem;
            border-radius: 1rem;
            text-align: center;
        }
        .stat-card .val { font-size: 1.75rem; font-weight: 900; color: #6366f1; }
        .stat-card .lbl { font-size: 0.75rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; margin-top: 0.25rem; }
        .cat-list {
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 1rem;
            padding: 1.25rem;
            margin-bottom: 2rem;
        }
        .cat-list h3 { font-size: 0.85rem; color: #cbd5e1; text-transform: uppercase; margin-bottom: 0.75rem; letter-spacing: 0.05em; }
        .pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .pill {
            background: #1e293b;
            border: 1px solid #334155;
            padding: 0.4rem 0.75rem;
            border-radius: 0.5rem;
            font-size: 0.8rem;
            font-weight: 600;
            color: #e2e8f0;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
        }
        .pill span { background: #6366f1; color: white; font-size: 0.7rem; padding: 0.1rem 0.35rem; border-radius: 0.25rem; }
        .actions { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: flex-start; }
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border-radius: 0.75rem;
            text-decoration: none;
            font-weight: 700;
            font-size: 0.9rem;
            transition: all 0.2s;
        }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-secondary { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; }
        .btn-secondary:hover { background: #334155; }
        .error-box { background: #450a0a; border: 1px solid #b91c1c; color: #fca5a5; padding: 1rem; border-radius: 0.75rem; font-family: monospace; font-size: 0.85rem; margin-bottom: 2rem; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <?php if ($status === 'success'): ?>
            <div class="badge badge-success">✓ Catalog Synchronized</div>
            <h1>Infiniforge Cloud Catalog Active</h1>
            <p class="subtitle">All products, recurring cloud services, official software suites, and categories from infiniforge.cloud have been synchronized into the database.</p>

            <div class="grid">
                <div class="stat-card">
                    <div class="val"><?php echo $catCount; ?></div>
                    <div class="lbl">Categories</div>
                </div>
                <div class="stat-card">
                    <div class="val"><?php echo $prodCount; ?></div>
                    <div class="lbl">Products & Licenses</div>
                </div>
                <div class="stat-card">
                    <div class="val"><?php echo $servCount; ?></div>
                    <div class="lbl">Cloud Services</div>
                </div>
                <div class="stat-card">
                    <div class="val"><?php echo $softwareCount ?? 6; ?></div>
                    <div class="lbl">SaaS Suites</div>
                </div>
            </div>

            <div class="cat-list">
                <h3>Active Categories (<?php echo $catCount; ?>)</h3>
                <div class="pills">
                    <?php foreach ($categories as $cat): ?>
                        <div class="pill">
                            <?php echo htmlspecialchars($cat->name); ?>
                            <span><?php echo ($cat->products_count + $cat->services_count); ?></span>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php else: ?>
            <div class="badge badge-error">✕ Sync Error</div>
            <h1>Synchronization Failed</h1>
            <p class="subtitle">An error occurred while seeding the catalog into the database.</p>
            <div class="error-box"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <div class="actions">
            <a href="/marketplace" class="btn btn-primary">Browse Marketplace &rarr;</a>
            <a href="/admin/products" class="btn btn-secondary">Admin Products</a>
            <a href="/admin/services" class="btn btn-secondary">Admin Services</a>
            <a href="/reseller" class="btn btn-secondary">Reseller Catalog</a>
        </div>
    </div>
</body>
</html>
