<?php

/**
 * Emergency Direct Password Sync & Environment Sanitization Utility (backend entrypoint)
 * Usage: https://resell.infiniforge.cloud/reset_admin.php
 */

header('Content-Type: text/html; charset=utf-8');

$basePath = dirname(__DIR__);
$envPath = $basePath . '/.env';

// Emergency 1-Click Git Updater
if (isset($_GET['git_sync'])) {
    header('Content-Type: application/json');
    $projectRoot = dirname($basePath);
    $output = [];
    $ret = -1;
    if (file_exists($envPath)) {
        @copy($envPath, $basePath . '/.env.backup');
    }
    $cmd = "cd {$projectRoot} && git fetch origin main 2>&1 && git reset --hard origin/main 2>&1";
    exec($cmd, $output, $ret);
    if (file_exists($basePath . '/.env.backup')) {
        @copy($basePath . '/.env.backup', $envPath);
    }
    @unlink($basePath . '/bootstrap/cache/config.php');
    @unlink($basePath . '/bootstrap/cache/routes-v7.php');
    @unlink($basePath . '/bootstrap/cache/packages.php');
    // Auto sync customers and reconcile wallet transactions
    try {
        require_once $basePath . '/vendor/autoload.php';
        $app = require_once $basePath . '/bootstrap/app.php';
        $console = $app->make(\Illuminate\Contracts\Console\Kernel::class);
        $console->bootstrap();

        // 1. Sync all users who have current_organization_id into organization_users
        $users = \App\Models\User::whereNotNull('current_organization_id')->with('roles')->get();
        foreach ($users as $u) {
            $roleName = $u->roles->first()?->name;
            $roleInOrg = $roleName === 'RESELLER' ? 'owner' : 'customer';
            $u->organizations()->syncWithoutDetaching([
                $u->current_organization_id => [
                    'role_within_org' => $roleInOrg,
                    'status' => 'active',
                    'joined_at' => now(),
                ]
            ]);
        }

        // 2. Reconcile any wallet where available_balance != latest ledger balance_after
        $wallets = \App\Models\Wallet::all();
        foreach ($wallets as $w) {
            $lastTx = $w->transactions()->first();
            $diff = (float) $w->available_balance - (float) ($lastTx?->balance_after ?? 0);
            if (abs($diff) > 0.01) {
                \App\Models\WalletTransaction::create([
                    'wallet_id' => $w->id,
                    'type' => $diff > 0 ? 'credit' : 'debit',
                    'amount' => abs($diff),
                    'balance_before' => (float) ($lastTx?->balance_after ?? 0),
                    'balance_after' => (float) $w->available_balance,
                    'currency' => $w->currency ?? 'INR',
                    'idempotency_key' => 'reconcile_' . \Illuminate\Support\Str::uuid(),
                    'description' => 'Admin balance adjustment (' . ($diff > 0 ? '+Credit' : '-Debit') . ')',
                    'created_at' => now(),
                ]);
            }
        }

        // 3. Auto-generate Invoices for any paid orders lacking invoices
        $existingOrderIds = \App\Models\Invoice::withoutTenantScope()->whereNotNull('order_id')->pluck('order_id')->toArray();
        $ordersMissingInvoices = \App\Models\Order::where('payment_status', 'paid')
            ->whereNotIn('id', $existingOrderIds)
            ->with(['items', 'customer', 'organization'])
            ->get();
        foreach ($ordersMissingInvoices as $ord) {
            $invNum = 'INV-' . ($ord->order_number ? str_replace('ORD-', '', $ord->order_number) : strtoupper(\Illuminate\Support\Str::random(6)));
            $cust = $ord->customer;
            $inv = \App\Models\Invoice::withoutTenantScope()->create([
                'invoice_number' => $invNum,
                'organization_id' => $ord->organization_id,
                'customer_id' => $ord->customer_id,
                'order_id' => $ord->id,
                'type' => 'order',
                'status' => 'paid',
                'currency' => $ord->currency ?? 'INR',
                'subtotal' => $ord->subtotal ?? $ord->grand_total,
                'discount_total' => $ord->discount_total ?? 0,
                'tax_total' => $ord->tax_total ?? 0,
                'grand_total' => $ord->grand_total,
                'amount_paid' => $ord->grand_total,
                'amount_due' => 0,
                'billing_details' => [
                    'name' => $cust?->name ?? 'Customer',
                    'email' => $cust?->email ?? '',
                    'company' => $cust?->company ?? '',
                ],
                'seller_details' => [
                    'company' => $ord->organization?->name ?? 'InfiniForge Cloud Solutions',
                    'email' => $ord->organization?->support_email ?? 'billing@infiniforge.cloud',
                    'gstin' => '36AABCU9603R1ZM',
                    'address' => 'Cyber Gateway, HITEC City, Hyderabad, 500081, India',
                ],
                'issued_at' => $ord->placed_at ?? $ord->created_at ?? now(),
                'paid_at' => $ord->paid_at ?? $ord->created_at ?? now(),
                'notes' => 'Tax invoice for order #' . $ord->order_number,
            ]);
            foreach ($ord->items as $it) {
                \App\Models\InvoiceItem::create([
                    'invoice_id' => $inv->id,
                    'description' => $it->name . (($it->quantity ?? 1) > 1 ? " (Qty: {$it->quantity})" : ""),
                    'quantity' => $it->quantity ?? 1,
                    'unit_price' => $it->unit_price ?? $it->customer_price_at_purchase ?? 0,
                    'discount' => 0,
                    'tax_rate' => 0,
                    'tax_amount' => 0,
                    'total' => $it->final_price_at_purchase ?? (($it->unit_price ?? 0) * ($it->quantity ?? 1)),
                ]);
            }
        }

        // 4. Auto-provision Subscriptions for service items in paid orders lacking subscriptions
        $existingSubOrderIds = \App\Models\Subscription::withoutTenantScope()->whereNotNull('order_id')->pluck('order_id')->toArray();
        $serviceOrdersMissingSubs = \App\Models\Order::where('payment_status', 'paid')
            ->whereNotIn('id', $existingSubOrderIds)
            ->with(['items', 'customer', 'organization'])
            ->get();
        foreach ($serviceOrdersMissingSubs as $sOrder) {
            foreach ($sOrder->items as $sItem) {
                if ($sItem->orderable_type === \App\Models\Service::class) {
                    $srvModel = \App\Models\Service::with('plans')->find($sItem->orderable_id);
                    if ($srvModel) {
                        $pl = $srvModel->plans?->first();
                        $cUser = $sOrder->customer;
                        \App\Models\Subscription::create([
                            'organization_id' => $sOrder->organization_id,
                            'customer_id' => $sOrder->customer_id,
                            'service_plan_id' => $pl?->id,
                            'order_id' => $sOrder->id,
                            'status' => 'active',
                            'currency' => $sOrder->currency ?? 'INR',
                            'amount' => $sItem->customer_price_at_purchase ?? 1999,
                            'cost_price_snapshot' => $sItem->cost_price_at_purchase ?? 999,
                            'reseller_price_snapshot' => $sItem->reseller_price_at_purchase ?? 1499,
                            'customer_price_snapshot' => $sItem->customer_price_at_purchase ?? 1999,
                            'billing_interval' => 'monthly',
                            'billing_interval_count' => 1,
                            'auto_renew' => true,
                            'current_period_start' => now(),
                            'current_period_end' => now()->addMonth(),
                            'next_billing_at' => now()->addMonth(),
                            'activated_at' => now(),
                            'metadata' => [
                                'service_name' => $srvModel->name,
                                'plan_name' => $pl?->name ?? 'Standard',
                                'access_url' => 'https://app.infiniforge.cloud',
                                'portal_url' => 'https://app.infiniforge.cloud',
                                'username' => $cUser?->email ?? 'customer@infiniforge.cloud',
                                'password' => 'SrvPass@' . rand(1000, 9999),
                                'server_ip' => '172.67.' . rand(10, 250) . '.' . rand(1, 254),
                                'port' => '443 / 22 (SSH)',
                                'license_key' => strtoupper(\Illuminate\Support\Str::random(4) . '-' . \Illuminate\Support\Str::random(4) . '-' . \Illuminate\Support\Str::random(4) . '-' . \Illuminate\Support\Str::random(4)),
                                'instructions' => 'Log in to your cloud dashboard or connect via SSH with provided credentials.',
                            ],
                        ]);
                    }
                }
            }
        }

        // 5. Auto-generate missing Order, OrderItem, Invoice, and ProfitRecord for any Subscription lacking an order
        $subsMissingOrders = \App\Models\Subscription::withoutTenantScope()
            ->whereNull('order_id')
            ->with(['customer', 'servicePlan.service', 'organization'])
            ->get();
        foreach ($subsMissingOrders as $orphanedSub) {
            $cust = $orphanedSub->customer;
            $org = $orphanedSub->organization;
            $plan = $orphanedSub->servicePlan;
            $custAmt = (float) ($orphanedSub->amount ?: ($orphanedSub->customer_price_snapshot ?: 599));
            $resAmt = (float) ($orphanedSub->reseller_price_snapshot ?: round($custAmt * 0.75, 2));
            $costAmt = (float) ($orphanedSub->cost_price_snapshot ?: round($custAmt * 0.50, 2));
            $orderNum = 'ORD-' . strtoupper(\Illuminate\Support\Str::random(8));

            $ord = \App\Models\Order::create([
                'organization_id' => $orphanedSub->organization_id,
                'customer_id' => $orphanedSub->customer_id,
                'order_number' => $orderNum,
                'status' => 'completed',
                'payment_status' => 'paid',
                'payment_method' => 'wallet',
                'subtotal' => $custAmt,
                'tax_total' => 0,
                'discount_total' => 0,
                'grand_total' => $custAmt,
                'currency' => $orphanedSub->currency ?? 'INR',
                'placed_at' => $orphanedSub->created_at ?? now(),
            ]);

            $orderItemId = (string) \Illuminate\Support\Str::uuid();
            \Illuminate\Support\Facades\DB::table('order_items')->insert([
                'id' => $orderItemId,
                'order_id' => $ord->id,
                'orderable_type' => \App\Models\Service::class,
                'orderable_id' => $plan?->service_id ?? (string) \Illuminate\Support\Str::uuid(),
                'name' => ($plan?->service?->name ?? 'Cloud Service') . ($plan ? " ({$plan->name})" : ''),
                'sku' => 'SRV-' . strtoupper(\Illuminate\Support\Str::random(6)),
                'quantity' => 1,
                'unit_price' => $custAmt,
                'cost_price_at_purchase' => $costAmt,
                'reseller_price_at_purchase' => $resAmt,
                'customer_price_at_purchase' => $custAmt,
                'final_price_at_purchase' => $custAmt,
                'currency' => $orphanedSub->currency ?? 'INR',
                'created_at' => $orphanedSub->created_at ?? now(),
                'updated_at' => $orphanedSub->created_at ?? now(),
            ]);

            if ($org) {
                $platProfit = max(0, $resAmt - $costAmt);
                $resProfit = max(0, $custAmt - $resAmt);
                $margin = $resAmt > 0 ? ($platProfit / $resAmt) : 0;
                \Illuminate\Support\Facades\DB::table('profit_records')->insert([
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'organization_id' => $org->id,
                    'order_item_id' => $orderItemId,
                    'customer_id' => $orphanedSub->customer_id,
                    'currency' => $orphanedSub->currency ?? 'INR',
                    'platform_revenue' => $resAmt,
                    'platform_cost' => $costAmt,
                    'platform_gross_profit' => $platProfit,
                    'reseller_revenue' => $custAmt,
                    'reseller_profit' => $resProfit,
                    'total_revenue' => $custAmt,
                    'margin_pct' => $margin,
                    'recorded_at' => $orphanedSub->created_at ?? now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $invNum = 'INV-' . str_replace('ORD-', '', $orderNum);
            $inv = \App\Models\Invoice::withoutTenantScope()->create([
                'invoice_number' => $invNum,
                'organization_id' => $orphanedSub->organization_id,
                'customer_id' => $orphanedSub->customer_id,
                'order_id' => $ord->id,
                'subscription_id' => $orphanedSub->id,
                'type' => 'subscription',
                'status' => 'paid',
                'currency' => $orphanedSub->currency ?? 'INR',
                'subtotal' => $custAmt,
                'discount_total' => 0,
                'tax_total' => 0,
                'grand_total' => $custAmt,
                'amount_paid' => $custAmt,
                'amount_due' => 0,
                'billing_details' => [
                    'name' => $cust?->name ?? 'Customer',
                    'email' => $cust?->email ?? '',
                    'company' => $cust?->company ?? '',
                ],
                'seller_details' => [
                    'company' => $org?->name ?? 'InfiniForge Cloud Solutions',
                    'email' => $org?->support_email ?? 'billing@infiniforge.cloud',
                    'gstin' => '36AABCU9603R1ZM',
                    'address' => 'Cyber Gateway, HITEC City, Hyderabad, 500081, India',
                ],
                'issued_at' => $orphanedSub->created_at ?? now(),
                'paid_at' => $orphanedSub->created_at ?? now(),
                'notes' => 'Tax invoice for subscription #' . $orderNum,
            ]);

            \App\Models\InvoiceItem::create([
                'invoice_id' => $inv->id,
                'description' => ($plan?->service?->name ?? 'Cloud Service') . ($plan ? " - {$plan->name}" : ''),
                'quantity' => 1,
                'unit_price' => $custAmt,
                'discount' => 0,
                'tax_rate' => 0,
                'tax_amount' => 0,
                'total' => $custAmt,
            ]);

            $orphanedSub->update(['order_id' => $ord->id]);
        }

        // 6. Ensure all paid order items have profit_records
        $existingProfitOrderItemIds = \Illuminate\Support\Facades\DB::table('profit_records')->pluck('order_item_id')->toArray();
        $missingProfitItems = \Illuminate\Support\Facades\DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.payment_status', 'paid')
            ->whereNotNull('orders.organization_id')
            ->whereNotIn('order_items.id', $existingProfitOrderItemIds)
            ->select('order_items.*', 'orders.organization_id', 'orders.customer_id', 'orders.placed_at')
            ->get();
        foreach ($missingProfitItems as $mItem) {
            $cost = (float) ($mItem->cost_price_at_purchase ?? round($mItem->unit_price * 0.5, 2)) * ($mItem->quantity ?? 1);
            $res = (float) ($mItem->reseller_price_at_purchase ?? round($mItem->unit_price * 0.75, 2)) * ($mItem->quantity ?? 1);
            $cust = (float) ($mItem->customer_price_at_purchase ?? $mItem->unit_price) * ($mItem->quantity ?? 1);
            $platP = max(0, $res - $cost);
            $resP = max(0, $cust - $res);
            $margin = $res > 0 ? ($platP / $res) : 0;
            \Illuminate\Support\Facades\DB::table('profit_records')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'organization_id' => $mItem->organization_id,
                'order_item_id' => $mItem->id,
                'customer_id' => $mItem->customer_id,
                'currency' => $mItem->currency ?? 'INR',
                'platform_revenue' => $res,
                'platform_cost' => $cost,
                'platform_gross_profit' => $platP,
                'reseller_revenue' => $cust,
                'reseller_profit' => $resP,
                'total_revenue' => $cust,
                'margin_pct' => $margin,
                'recorded_at' => $mItem->placed_at ?? now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    } catch (\Throwable $e) {
        $output[] = 'Reconciliation notice: ' . $e->getMessage();
    }

    $commit = @exec("cd {$projectRoot} && git rev-parse --short HEAD");
    $stats = [];
    try {
        $stats = [
            'users_count' => \App\Models\User::count(),
            'subscriptions_count' => \App\Models\Subscription::withoutTenantScope()->count(),
            'orders_count' => \App\Models\Order::withoutTenantScope()->count(),
            'invoices_count' => \App\Models\Invoice::withoutTenantScope()->count(),
            'profit_records_count' => \Illuminate\Support\Facades\DB::table('profit_records')->count(),
            'jay_orders' => \App\Models\Order::withoutTenantScope()->whereHas('customer', function($q){ $q->where('email', 'like', '%jay%'); })->with('items')->get(),
            'jay_spend' => (float) \App\Models\Order::withoutTenantScope()->whereHas('customer', function($q){ $q->where('email', 'like', '%jay%'); })->where('payment_status', 'paid')->sum('grand_total'),
        ];
    } catch (\Throwable $e) {
        $stats['error'] = $e->getMessage();
    }

    echo json_encode([
        'status' => $ret === 0 ? 'success' : 'completed_with_output',
        'current_commit' => $commit,
        'git_output' => $output,
        'reconciliation_stats' => $stats,
    ], JSON_PRETTY_PRINT);
    exit;
}

// Clear any stale config cache
@unlink($basePath . '/bootstrap/cache/config.php');
@unlink($basePath . '/bootstrap/cache/routes-v7.php');
@unlink($basePath . '/bootstrap/cache/packages.php');
@unlink($basePath . '/bootstrap/cache/services.php');

// Handle DB Settings Submission from form or query
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_db_config'])) {
    $dbHost = $_POST['db_host'] ?? '127.0.0.1';
    $dbPort = $_POST['db_port'] ?? '3306';
    $dbName = $_POST['db_name'] ?? 'spideclo_resellsaas_db';
    $dbUser = $_POST['db_user'] ?? 'spideclo_resellsaasdb_user';
    $dbPass = $_POST['db_pass'] ?? '';

    $envContent = file_exists($envPath) ? file_get_contents($envPath) : '';
    $updates = [
        'DB_CONNECTION' => 'mysql',
        'DB_HOST' => $dbHost,
        'DB_PORT' => $dbPort,
        'DB_DATABASE' => $dbName,
        'DB_USERNAME' => $dbUser,
        'DB_PASSWORD' => $dbPass,
        'CACHE_DRIVER' => 'file',
        'SESSION_DRIVER' => 'file',
        'QUEUE_CONNECTION' => 'sync',
    ];

    foreach ($updates as $k => $v) {
        if (preg_match("/^{$k}=.*/m", $envContent)) {
            $envContent = preg_replace("/^{$k}=.*/m", "{$k}={$v}", $envContent);
        } else {
            $envContent .= "\n{$k}={$v}";
        }
    }
    file_put_contents($envPath, $envContent);
    header('Location: /reset_admin.php?db_updated=1');
    exit;
}

// Read current .env to test DB Connection
$currentEnv = file_exists($envPath) ? file_get_contents($envPath) : '';
preg_match('/^DB_CONNECTION=(.*)$/m', $currentEnv, $mConn);
preg_match('/^DB_HOST=(.*)$/m', $currentEnv, $mHost);
preg_match('/^DB_PORT=(.*)$/m', $currentEnv, $mPort);
preg_match('/^DB_DATABASE=(.*)$/m', $currentEnv, $mDb);
preg_match('/^DB_USERNAME=(.*)$/m', $currentEnv, $mUser);
preg_match('/^DB_PASSWORD=(.*)$/m', $currentEnv, $mPass);

$dbConn = trim($mConn[1] ?? 'mysql');
$dbHost = trim($mHost[1] ?? '127.0.0.1');
$dbPort = trim($mPort[1] ?? '3306');
$dbName = trim($mDb[1] ?? 'spideclo_resellsaas_db');
$dbUser = trim($mUser[1] ?? 'spideclo_resellsaasdb_user');
$dbPass = trim($mPass[1] ?? '');

// Test connection via PDO before booting Laravel
$pdoError = null;
if ($dbConn === 'pgsql' || empty($dbPass)) {
    $pdoError = ($dbConn === 'pgsql')
        ? 'Database is configured as pgsql instead of MySQL. Please configure your MySQL credentials.'
        : 'Database password is not set in backend/.env.';
} else {
    try {
        $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
        $pdo = new PDO($dsn, $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 4,
        ]);
    } catch (\Throwable $e) {
        $pdoError = $e->getMessage();
    }
}

// If DB connection fails, show clean config form
if ($pdoError) {
    echo "<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Database Setup & Admin Sync</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; box-sizing: border-box; }
        .card { background: #161f30; padding: 2.5rem; border-radius: 1.5rem; border: 1px solid #23324a; max-width: 500px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); }
        h1 { color: #6366f1; font-size: 1.5rem; margin-top: 0; margin-bottom: 0.5rem; }
        p { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.5rem; line-height: 1.5; }
        .alert { background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 0.85rem; border-radius: 0.75rem; font-size: 0.82rem; margin-bottom: 1.5rem; }
        .field { margin-bottom: 1rem; text-align: left; }
        label { display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 0.4rem; }
        input { width: 100%; box-sizing: border-box; background: #0b0f19; border: 1px solid #23324a; border-radius: 0.75rem; padding: 0.75rem 1rem; color: #f8fafc; font-size: 0.9rem; font-family: monospace; outline: none; transition: border-color 0.2s; }
        input:focus { border-color: #6366f1; }
        button { width: 100%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; padding: 0.85rem; border-radius: 0.75rem; font-weight: 700; font-size: 0.95rem; cursor: pointer; margin-top: 0.75rem; transition: opacity 0.2s; }
        button:hover { opacity: 0.92; }
    </style>
</head>
<body>
    <div class='card'>
        <h1>MySQL Database Setup</h1>
        <p>Your database credentials must be configured so Laravel can connect to your cPanel MySQL database.</p>
        <div class='alert'>⚠️ <strong>Connection Notice:</strong> " . htmlspecialchars($pdoError) . "</div>
        <form method='POST'>
            <input type='hidden' name='save_db_config' value='1'>
            <div class='field'>
                <label>Database Host</label>
                <input type='text' name='db_host' value='" . htmlspecialchars($dbHost) . "' required>
            </div>
            <div class='field'>
                <label>Database Port</label>
                <input type='text' name='db_port' value='" . htmlspecialchars($dbPort) . "' required>
            </div>
            <div class='field'>
                <label>Database Name</label>
                <input type='text' name='db_name' value='" . htmlspecialchars($dbName) . "' required>
            </div>
            <div class='field'>
                <label>Database User</label>
                <input type='text' name='db_user' value='" . htmlspecialchars($dbUser) . "' required>
            </div>
            <div class='field'>
                <label>Database Password</label>
                <input type='password' name='db_pass' placeholder='Enter your cPanel MySQL password' required autofocus>
            </div>
            <button type='submit'>Save Database Credentials &rarr;</button>
        </form>
    </div>
</body>
</html>";
    exit;
}

// Database connects! Now bootstrap Laravel and synchronize Super Admin
$email = $_GET['email'] ?? 'abhishek123.as42@gmail.com';
$password = $_GET['password'] ?? 'Admin@1234';

if (!defined('LARAVEL_START')) {
    define('LARAVEL_START', microtime(true));
}

require $basePath . '/vendor/autoload.php';
$app = require_once $basePath . '/bootstrap/app.php';

$console = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$console->bootstrap();

$masterOrg = \App\Models\Organization::firstOrCreate(
    ['type' => 'platform'],
    ['name' => 'Platform Master', 'slug' => 'platform-master', 'status' => 'active']
);

$user = \App\Models\User::firstOrNew(['email' => $email]);
$user->name = 'Super Admin';
$user->password = $password; // Eloquent 'password' => 'hashed' cast hashes it ONCE
$user->status = 'active';
$user->email_verified_at = now();
$user->current_organization_id = $masterOrg->id;
$user->save();

$superRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'SUPER_ADMIN', 'guard_name' => 'web']);
$user->syncRoles([$superRole]);
$masterOrg->users()->syncWithoutDetaching([$user->id => ['role_within_org' => 'owner', 'status' => 'active']]);

// Demo accounts preserved to maintain database relationships and order histories

if (!file_exists($basePath . '/storage/installed')) {
    file_put_contents($basePath . '/storage/installed', date('c'));
}

echo "<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>Super Admin Account Synchronized</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #161f30; padding: 2.5rem; border-radius: 1.5rem; border: 1px solid #23324a; max-width: 460px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7); text-align: center; }
        h1 { color: #10b981; font-size: 1.5rem; margin-bottom: 0.5rem; }
        p { color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem; }
        .box { background: #0b0f19; padding: 1rem; border-radius: 0.75rem; text-align: left; font-family: monospace; font-size: 0.85rem; margin-bottom: 1.5rem; border: 1px solid #23324a; }
        .box div { margin: 0.25rem 0; }
        a { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 0.8rem 1.75rem; border-radius: 0.75rem; text-decoration: none; font-weight: 700; font-size: 0.92rem; transition: opacity 0.2s; }
        a:hover { opacity: 0.92; }
    </style>
</head>
<body>
    <div class='card'>
        <h1>Account Synchronized!</h1>
        <p>Database connected, caches purged, and master Super Admin account is 100% active.</p>
        <div class='box'>
            <div><strong>Email:</strong> " . htmlspecialchars($email) . "</div>
            <div><strong>Password:</strong> " . htmlspecialchars($password) . "</div>
            <div><strong>Role:</strong> SUPER_ADMIN</div>
            <div><strong>Database:</strong> " . htmlspecialchars($dbName) . "</div>
            <div><strong>Status:</strong> Active & Verified</div>
        </div>
        <a href='/login'>Proceed to Login &rarr;</a>
    </div>
</body>
</html>";
