<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\MarketplaceController;
use App\Http\Controllers\Api\V1\WebhookController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\V1\Reseller\WalletController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — /api/v1/
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ─── Webhooks (no auth, but signature-verified inside controller) ─────────
    Route::prefix('webhooks')->group(function () {
        Route::post('razorpay', [WebhookController::class, 'razorpay']);
        Route::post('phonepe', [WebhookController::class, 'phonepe']);
        Route::post('cashfree', [WebhookController::class, 'cashfree']);
        Route::post('stripe', [WebhookController::class, 'stripe']);
    });

    // Public CMS Data
    Route::get('cms', [\App\Http\Controllers\Api\V1\Admin\CmsController::class, 'getPublicCms']);

    // Public Platform & Live Chat Settings
    Route::get('public-settings', [\App\Http\Controllers\Api\V1\Admin\SettingController::class, 'publicSettings']);

    // ─── Public marketplace (pricing resolved per role in controller) ─────────
    Route::prefix('marketplace')->group(function () {
        Route::get('/', [MarketplaceController::class, 'home']);
        Route::get('products', [MarketplaceController::class, 'products']);
        Route::get('products/{slug}', [MarketplaceController::class, 'product']);
        Route::get('services', [MarketplaceController::class, 'services']);
        Route::get('services/{slug}', [MarketplaceController::class, 'service']);
        Route::get('categories', [MarketplaceController::class, 'categories']);
        Route::get('offers', [MarketplaceController::class, 'offers']);
        Route::get('advertisements', [MarketplaceController::class, 'advertisements']);
        Route::get('recommendations', [MarketplaceController::class, 'recommendations']);
        Route::get('wishlist', [MarketplaceController::class, 'wishlist']);
        Route::post('wishlist/toggle', [MarketplaceController::class, 'toggleWishlist']);
        Route::get('items/{id}/reviews', [MarketplaceController::class, 'reviews']);
        Route::post('items/{id}/reviews', [MarketplaceController::class, 'storeReview']);
    });

    // ─── Auth ─────────────────────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
        Route::get('social-config', [AuthController::class, 'socialConfig']);
        Route::post('social-login', [AuthController::class, 'socialLogin']);
        Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('reset-password', [AuthController::class, 'resetPassword']);
        Route::get('verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])
            ->name('verification.verify');

        // Protected auth routes
        Route::middleware('auth.api')->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
            Route::post('logout-all', [AuthController::class, 'logoutAll']);
            Route::post('resend-verification', [AuthController::class, 'resendVerificationEmail']);
            Route::post('change-password', [AuthController::class, 'changePassword']);
        });
    });

    // ─── Authenticated routes ─────────────────────────────────────────────────
    Route::middleware('auth.api')->group(function () {

        // ─── Customer-accessible ──────────────────────────────────────────────
        Route::prefix('orders')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\V1\OrderController::class, 'index']);
            Route::post('/', [\App\Http\Controllers\Api\V1\OrderController::class, 'store']);
            Route::get('{id}', [\App\Http\Controllers\Api\V1\OrderController::class, 'show']);
            Route::post('{id}/cancel', [\App\Http\Controllers\Api\V1\OrderController::class, 'cancel']);
        });

        Route::prefix('subscriptions')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\V1\SubscriptionController::class, 'index']);
            Route::get('{id}', [\App\Http\Controllers\Api\V1\SubscriptionController::class, 'show']);
            Route::post('{id}/cancel', [\App\Http\Controllers\Api\V1\SubscriptionController::class, 'cancel']);
        });

        Route::get('invoices', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'index']);
        Route::get('invoices/{id}', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'show']);
        Route::get('invoices/{id}/download', [\App\Http\Controllers\Api\V1\InvoiceController::class, 'download']);

        Route::get('notifications', [\App\Http\Controllers\Api\V1\NotificationController::class, 'index']);
        Route::post('notifications/{id}/read', [\App\Http\Controllers\Api\V1\NotificationController::class, 'markRead']);
        Route::post('notifications/read-all', [\App\Http\Controllers\Api\V1\NotificationController::class, 'markAllRead']);

        Route::prefix('support')->group(function () {
            Route::get('tickets', [\App\Http\Controllers\Api\V1\SupportController::class, 'index']);
            Route::post('tickets', [\App\Http\Controllers\Api\V1\SupportController::class, 'store']);
            Route::get('tickets/{id}', [\App\Http\Controllers\Api\V1\SupportController::class, 'show']);
            Route::post('tickets/{id}/messages', [\App\Http\Controllers\Api\V1\SupportController::class, 'addMessage']);
        });

        Route::post('stop-impersonate', [\App\Http\Controllers\Api\V1\Admin\UserController::class, 'stopImpersonate']);

        // ─── Reseller routes ──────────────────────────────────────────────────
        Route::middleware('role:RESELLER|SUPER_ADMIN')->prefix('reseller')->group(function () {
            Route::get('dashboard', [\App\Http\Controllers\Api\V1\Reseller\DashboardController::class, 'index']);

            // Wallet
            Route::get('wallet', [WalletController::class, 'show']);
            Route::get('wallet/transactions', [WalletController::class, 'transactions']);
            Route::post('wallet/recharge', [WalletController::class, 'initiateRecharge']);
            Route::post('wallet/fulfill', [WalletController::class, 'fulfillRecharge']);

            // Customers
            Route::apiResource('customers', \App\Http\Controllers\Api\V1\Reseller\CustomerController::class);
            Route::get('customers/{id}/orders', [\App\Http\Controllers\Api\V1\Reseller\CustomerController::class, 'orders']);
            Route::get('customers/{id}/subscriptions', [\App\Http\Controllers\Api\V1\Reseller\CustomerController::class, 'subscriptions']);

            // Orders for reseller's customers
            Route::get('orders', [\App\Http\Controllers\Api\V1\Reseller\OrderController::class, 'index']);
            Route::post('orders', [\App\Http\Controllers\Api\V1\Reseller\OrderController::class, 'store']);
            Route::get('orders/{id}', [\App\Http\Controllers\Api\V1\Reseller\OrderController::class, 'show']);

            // Services assigned under this reseller
            Route::get('services', [\App\Http\Controllers\Api\V1\Reseller\ServiceController::class, 'index']);
            Route::post('services/assign', [\App\Http\Controllers\Api\V1\Reseller\ServiceController::class, 'assign']);

            Route::get('subscriptions', [\App\Http\Controllers\Api\V1\Reseller\SubscriptionController::class, 'index']);
            Route::get('subscriptions/{id}', [\App\Http\Controllers\Api\V1\Reseller\SubscriptionController::class, 'show']);
            Route::post('subscriptions/{id}/suspend', [\App\Http\Controllers\Api\V1\Reseller\SubscriptionController::class, 'suspend']);
            Route::post('subscriptions/{id}/reactivate', [\App\Http\Controllers\Api\V1\Reseller\SubscriptionController::class, 'reactivate']);
            Route::post('subscriptions/{id}/cancel', [\App\Http\Controllers\Api\V1\Reseller\SubscriptionController::class, 'cancel']);
            Route::post('subscriptions/{id}/access', [\App\Http\Controllers\Api\V1\Reseller\SubscriptionController::class, 'updateAccess']);
            Route::get('profit', [\App\Http\Controllers\Api\V1\Reseller\ProfitController::class, 'index']);
            Route::get('profit/chart', [\App\Http\Controllers\Api\V1\Reseller\ProfitController::class, 'chart']);
            // Onboarding & KYC
            Route::get('onboarding', [\App\Http\Controllers\Api\V1\Reseller\ResellerOnboardingController::class, 'show']);
            Route::post('onboarding/profile', [\App\Http\Controllers\Api\V1\Reseller\ResellerOnboardingController::class, 'updateProfile']);
            Route::post('onboarding/kyc', [\App\Http\Controllers\Api\V1\Reseller\ResellerOnboardingController::class, 'submitKyc']);
            Route::post('onboarding/terms', [\App\Http\Controllers\Api\V1\Reseller\ResellerOnboardingController::class, 'acceptTerms']);
            Route::post('onboarding/submit', [\App\Http\Controllers\Api\V1\Reseller\ResellerOnboardingController::class, 'submit']);
            // API SaaS Keys, Webhooks & Telemetry
            Route::get('api-keys', [\App\Http\Controllers\Api\V1\Reseller\ApiKeyController::class, 'index']);
            Route::post('api-keys', [\App\Http\Controllers\Api\V1\Reseller\ApiKeyController::class, 'store']);
            Route::post('api-keys/{id}/revoke', [\App\Http\Controllers\Api\V1\Reseller\ApiKeyController::class, 'revoke']);
            Route::get('webhooks', [\App\Http\Controllers\Api\V1\Reseller\ApiKeyController::class, 'webhooks']);
            Route::post('webhooks', [\App\Http\Controllers\Api\V1\Reseller\ApiKeyController::class, 'storeWebhook']);
            Route::get('api-usage', [\App\Http\Controllers\Api\V1\Reseller\ApiKeyController::class, 'usageLogs']);
        });

        // ─── Admin routes ─────────────────────────────────────────────────────
        Route::middleware('role:SUPER_ADMIN')->prefix('admin')->group(function () {
            Route::get('dashboard', [DashboardController::class, 'index']);
            Route::get('dashboard/revenue-chart', [DashboardController::class, 'revenueChart']);

            Route::post('products/bulk-action', [AdminProductController::class, 'bulkAction']);
            Route::apiResource('products', AdminProductController::class);
            Route::post('products/{id}/status', [AdminProductController::class, 'updateStatus']);

            Route::post('services/bulk-action', [\App\Http\Controllers\Api\V1\Admin\ServiceController::class, 'bulkAction']);
            Route::apiResource('services', \App\Http\Controllers\Api\V1\Admin\ServiceController::class);
            Route::apiResource('categories', \App\Http\Controllers\Api\V1\Admin\CategoryController::class);
            Route::post('catalog/sync-infiniforge', [\App\Http\Controllers\Api\V1\Admin\CategoryController::class, 'syncInfiniforge']);

            // Integrations: WooCommerce & Twilio
            Route::prefix('integrations')->group(function () {
                Route::post('woocommerce/test', [\App\Http\Controllers\Api\V1\Admin\WooCommerceController::class, 'test']);
                Route::post('woocommerce/sync', [\App\Http\Controllers\Api\V1\Admin\WooCommerceController::class, 'sync']);
                Route::post('twilio/test', [\App\Http\Controllers\Api\V1\Admin\TwilioController::class, 'test']);
            });

            Route::apiResource('organizations', \App\Http\Controllers\Api\V1\Admin\OrganizationController::class);
            Route::post('organizations/{id}/status', [\App\Http\Controllers\Api\V1\Admin\OrganizationController::class, 'updateStatus']);
            Route::post('organizations/{id}/approve', [\App\Http\Controllers\Api\V1\Admin\OrganizationController::class, 'approve']);
            Route::post('organizations/{id}/reject', [\App\Http\Controllers\Api\V1\Admin\OrganizationController::class, 'reject']);
            Route::post('organizations/{id}/adjust-margin', [\App\Http\Controllers\Api\V1\Admin\OrganizationController::class, 'adjustMargin']);
            Route::post('organizations/{id}/assign-plan', [\App\Http\Controllers\Api\V1\Admin\OrganizationController::class, 'assignPlan']);
            Route::post('organizations/{id}/assign-services', [\App\Http\Controllers\Api\V1\Admin\OrganizationController::class, 'assignServices']);
            Route::post('organizations/{id}/impersonate', [\App\Http\Controllers\Api\V1\Admin\OrganizationController::class, 'impersonate']);

            Route::apiResource('users', \App\Http\Controllers\Api\V1\Admin\UserController::class);
            Route::post('users/{id}/impersonate', [\App\Http\Controllers\Api\V1\Admin\UserController::class, 'impersonate']);
            Route::apiResource('offers', \App\Http\Controllers\Api\V1\Admin\OfferController::class);
            Route::apiResource('coupons', \App\Http\Controllers\Api\V1\Admin\CouponController::class);
            Route::apiResource('advertisements', \App\Http\Controllers\Api\V1\Admin\AdvertisementController::class);

            Route::get('orders', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'index']);
            Route::post('orders', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'store']);
            Route::post('orders/bulk-action', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'bulkAction']);
            Route::get('orders/{id}', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'show']);
            Route::post('orders/{id}/assign', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'assign']);
            Route::post('orders/{id}/status', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'updateStatus']);
            Route::post('orders/{id}/fulfillment', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'updateFulfillment']);
            Route::post('orders/{id}/refund', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'refund']);

            Route::get('subscriptions', [\App\Http\Controllers\Api\V1\Admin\SubscriptionController::class, 'index']);
            Route::post('subscriptions/{id}/access', [\App\Http\Controllers\Api\V1\Admin\SubscriptionController::class, 'updateAccess']);
            Route::post('subscriptions/{id}/suspend', [\App\Http\Controllers\Api\V1\Admin\SubscriptionController::class, 'suspend']);
            Route::post('subscriptions/{id}/reactivate', [\App\Http\Controllers\Api\V1\Admin\SubscriptionController::class, 'reactivate']);

            Route::get('wallets', [\App\Http\Controllers\Api\V1\Admin\WalletController::class, 'index']);
            Route::get('wallets/{orgId}', [\App\Http\Controllers\Api\V1\Admin\WalletController::class, 'show']);
            Route::post('wallets/{orgId}/adjust', [\App\Http\Controllers\Api\V1\Admin\WalletController::class, 'adjust']);

            Route::get('payments', [\App\Http\Controllers\Api\V1\Admin\PaymentController::class, 'index']);
            Route::get('profits', [\App\Http\Controllers\Api\V1\Admin\ProfitController::class, 'index']);
            Route::get('profits/summary', [\App\Http\Controllers\Api\V1\Admin\ProfitController::class, 'summary']);

            Route::get('reports/revenue', [\App\Http\Controllers\Api\V1\Admin\ReportController::class, 'revenue']);
            Route::get('reports/products', [\App\Http\Controllers\Api\V1\Admin\ReportController::class, 'productPerformance']);
            Route::get('reports/orders', [\App\Http\Controllers\Api\V1\Admin\ReportController::class, 'orderAnalytics']);
            Route::get('reports/resellers', [\App\Http\Controllers\Api\V1\Admin\ReportController::class, 'resellers']);
            Route::get('reports/subscriptions', [\App\Http\Controllers\Api\V1\Admin\ReportController::class, 'subscriptions']);
            Route::get('reports/profitability', [\App\Http\Controllers\Api\V1\Admin\ReportController::class, 'profitability']);
            Route::get('reports/export-csv', [\App\Http\Controllers\Api\V1\Admin\ReportController::class, 'exportCsv']);

            Route::get('settings', [\App\Http\Controllers\Api\V1\Admin\SettingController::class, 'index']);
            Route::put('settings', [\App\Http\Controllers\Api\V1\Admin\SettingController::class, 'update']);

            Route::get('audit-logs', [\App\Http\Controllers\Api\V1\Admin\AuditLogController::class, 'index']);
            Route::get('audit-logs/stats', [\App\Http\Controllers\Api\V1\Admin\AuditLogController::class, 'stats']);
            Route::get('audit-logs/{id}', [\App\Http\Controllers\Api\V1\Admin\AuditLogController::class, 'show']);
            Route::get('system-health', [\App\Http\Controllers\Api\V1\Admin\HealthCheckController::class, 'detailedHealth']);
            Route::apiResource('saas-plans', \App\Http\Controllers\Api\V1\Admin\SaasPlanAdminController::class);

            // Site CMS Management
            Route::get('cms', [\App\Http\Controllers\Api\V1\Admin\CmsController::class, 'index']);
            Route::put('cms', [\App\Http\Controllers\Api\V1\Admin\CmsController::class, 'update']);

            // Automation Center
            Route::prefix('automation')->group(function () {
                Route::get('templates', [\App\Http\Controllers\Api\V1\Admin\AutomationAdminController::class, 'index']);
                Route::post('templates', [\App\Http\Controllers\Api\V1\Admin\AutomationAdminController::class, 'store']);
                Route::post('templates/{id}/toggle', [\App\Http\Controllers\Api\V1\Admin\AutomationAdminController::class, 'toggleStatus']);
                Route::post('test-trigger', [\App\Http\Controllers\Api\V1\Admin\AutomationAdminController::class, 'testTrigger']);
            });

            // Platform Control Center & Global Search
            Route::prefix('control-center')->group(function () {
                Route::get('health', [\App\Http\Controllers\Api\V1\Admin\ControlCenterController::class, 'systemHealth']);
                Route::get('search', [\App\Http\Controllers\Api\V1\Admin\ControlCenterController::class, 'globalSearch']);
                Route::get('announcements', [\App\Http\Controllers\Api\V1\Admin\ControlCenterController::class, 'announcements']);
                Route::post('announcements', [\App\Http\Controllers\Api\V1\Admin\ControlCenterController::class, 'storeAnnouncement']);
            });
        });

        // ─── SaaS Monetization Subscription ──────────────────────────────────
        Route::prefix('saas-plans')->group(function () {
            Route::get('current', [\App\Http\Controllers\Api\V1\SaasPlanController::class, 'currentSubscription']);
            Route::post('subscribe', [\App\Http\Controllers\Api\V1\SaasPlanController::class, 'subscribe']);
            Route::post('cancel', [\App\Http\Controllers\Api\V1\SaasPlanController::class, 'cancel']);
        });
    });

    // Public SaaS Plans List, Health Probe & Web Installer
    Route::get('saas-plans', [\App\Http\Controllers\Api\V1\SaasPlanController::class, 'index']);
    Route::get('health', [\App\Http\Controllers\Api\V1\Admin\HealthCheckController::class, 'health']);

    Route::prefix('install')->group(function () {
        Route::get('status', [\App\Http\Controllers\Api\V1\InstallerController::class, 'status']);
        Route::get('requirements', [\App\Http\Controllers\Api\V1\InstallerController::class, 'checkRequirements']);
        Route::post('test-db', [\App\Http\Controllers\Api\V1\InstallerController::class, 'testDatabase']);
        Route::post('execute', [\App\Http\Controllers\Api\V1\InstallerController::class, 'executeInstall']);
    });
});
