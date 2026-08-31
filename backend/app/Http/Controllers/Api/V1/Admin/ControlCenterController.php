<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\LoginActivity;
use App\Models\Order;
use App\Models\Organization;
use App\Models\PlatformAnnouncement;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\User;
use App\Models\WebhookEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class ControlCenterController extends Controller
{
    /**
     * Comprehensive System Health, Infrastructure & Queue Metrics.
     */
    public function systemHealth(): JsonResponse
    {
        // DB health
        $dbStatus = 'healthy';
        $dbLatencyMs = 0;
        try {
            $start = microtime(true);
            DB::select('SELECT 1');
            $dbLatencyMs = round((microtime(true) - $start) * 1000, 2);
        } catch (\Throwable $e) {
            $dbStatus = 'error';
        }

        // Storage usage
        $freeStorageMb = round(disk_free_space('/') / (1024 * 1024), 2);
        $totalStorageMb = round(disk_total_space('/') / (1024 * 1024), 2);
        $usedStoragePct = round((($totalStorageMb - $freeStorageMb) / max($totalStorageMb, 1)) * 100, 1);

        // Queue & Jobs
        $failedJobsCount = \Illuminate\Support\Facades\Schema::hasTable('failed_jobs') ? DB::table('failed_jobs')->count() : 0;
        $pendingJobsCount = \Illuminate\Support\Facades\Schema::hasTable('jobs') ? DB::table('jobs')->count() : 0;

        // Webhook status
        $totalWebhooks = WebhookEvent::count();
        $processedWebhooks = WebhookEvent::where('processing_status', 'processed')->count();
        $failedWebhooks = WebhookEvent::where('processing_status', 'failed')->count();

        // Active Users & Login Activity
        $activeUsers24h = User::where('updated_at', '>=', now()->subHours(24))->count();
        $recentLogins = LoginActivity::with('user:id,name,email')
            ->latest('created_at')
            ->limit(10)
            ->get();

        // Gateways Status
        $gateways = [
            'razorpay' => ['name' => 'Razorpay Gateway', 'status' => 'operational'],
            'phonepe' => ['name' => 'PhonePe Unified UPI', 'status' => 'operational'],
            'cashfree' => ['name' => 'Cashfree Payments', 'status' => 'operational'],
            'stripe' => ['name' => 'Stripe International', 'status' => 'operational'],
        ];

        return response()->json([
            'data' => [
                'database' => [
                    'status' => $dbStatus,
                    'latency_ms' => $dbLatencyMs,
                    'connection' => config('database.default'),
                ],
                'storage' => [
                    'free_mb' => $freeStorageMb,
                    'total_mb' => $totalStorageMb,
                    'used_pct' => $usedStoragePct,
                ],
                'queue' => [
                    'status' => 'active',
                    'pending_jobs' => $pendingJobsCount,
                    'failed_jobs' => $failedJobsCount,
                ],
                'webhooks' => [
                    'total' => $totalWebhooks,
                    'processed' => $processedWebhooks,
                    'failed' => $failedWebhooks,
                ],
                'gateways' => $gateways,
                'active_users_24h' => $activeUsers24h,
                'recent_logins' => $recentLogins,
            ]
        ]);
    }

    /**
     * Global Command / Search interface finding Users, Resellers, Products, Orders, Invoices, Subscriptions.
     */
    public function globalSearch(Request $request): JsonResponse
    {
        $q = trim($request->q ?? '');
        if (strlen($q) < 2) {
            return response()->json([
                'data' => [
                    'users' => [],
                    'resellers' => [],
                    'products' => [],
                    'orders' => [],
                    'invoices' => [],
                    'subscriptions' => [],
                ]
            ]);
        }

        $users = User::where('name', 'ilike', "%{$q}%")
            ->orWhere('email', 'ilike', "%{$q}%")
            ->limit(5)
            ->get(['id', 'name', 'email']);

        $resellers = Organization::where('type', 'reseller')
            ->where(fn($query) => $query->where('name', 'ilike', "%{$q}%")->orWhere('brand_name', 'ilike', "%{$q}%"))
            ->limit(5)
            ->get(['id', 'name', 'slug', 'status']);

        $products = Product::where('name', 'ilike', "%{$q}%")
            ->orWhere('sku', 'ilike', "%{$q}%")
            ->limit(5)
            ->get(['id', 'name', 'slug', 'type']);

        $orders = Order::where('order_number', 'ilike', "%{$q}%")
            ->limit(5)
            ->get(['id', 'order_number', 'grand_total', 'status']);

        $invoices = Invoice::where('invoice_number', 'ilike', "%{$q}%")
            ->limit(5)
            ->get(['id', 'invoice_number', 'grand_total', 'status']);

        $subscriptions = Subscription::where('id', 'ilike', "%{$q}%")
            ->limit(5)
            ->get(['id', 'status', 'billing_interval']);

        return response()->json([
            'data' => [
                'users' => $users,
                'resellers' => $resellers,
                'products' => $products,
                'orders' => $orders,
                'invoices' => $invoices,
                'subscriptions' => $subscriptions,
            ]
        ]);
    }

    /**
     * Platform Announcements Management.
     */
    public function announcements(): JsonResponse
    {
        $announcements = PlatformAnnouncement::latest()->get();
        return response()->json(['data' => $announcements]);
    }

    public function storeAnnouncement(Request $request): JsonResponse
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
            'type' => ['required', 'in:info,warning,critical,success'],
            'target_audience' => ['required', 'in:all,resellers,customers'],
        ]);

        $announcement = PlatformAnnouncement::create([
            'title' => $request->title,
            'message' => $request->message,
            'type' => $request->type,
            'target_audience' => $request->target_audience,
            'is_active' => true,
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['message' => 'Platform announcement published.', 'data' => $announcement], 201);
    }
}
