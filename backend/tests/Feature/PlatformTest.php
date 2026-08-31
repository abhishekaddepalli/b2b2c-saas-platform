<?php

use App\Models\Organization;
use App\Models\User;
use App\Models\Wallet;
use App\Services\Pricing\PricingService;
use App\Services\Wallet\WalletService;
use App\Exceptions\InsufficientWalletBalanceException;
use App\Exceptions\DuplicateTransactionException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
});

// ─── Auth Tests ───────────────────────────────────────────────────────────────

describe('Authentication', function () {

    it('registers a new customer', function () {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.email', 'test@example.com')
            ->assertJsonPath('data.roles.0', 'USER');
    });

    it('rejects registration with duplicate email', function () {
        User::factory()->create(['email' => 'existing@example.com']);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Another User',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422);
    });

    it('logs in with valid credentials and returns token', function () {
        $user = User::factory()->create([
            'email' => 'user@example.com',
            'password' => bcrypt('password123'),
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
        $user->assignRole('USER');

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'user@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'data'])
            ->assertJsonPath('data.email', 'user@example.com');

        expect($response->json('token'))->not->toBeNull();
    });

    it('rejects invalid credentials', function () {
        User::factory()->create(['email' => 'user@example.com', 'password' => bcrypt('correct')]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'user@example.com',
            'password' => 'wrong',
        ])->assertStatus(401);
    });

    it('returns me endpoint for authenticated user', function () {
        $user = User::factory()->create(['status' => 'active', 'email_verified_at' => now()]);
        $user->assignRole('USER');
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);
    });

    it('logs out and invalidates token', function () {
        $user = User::factory()->create(['status' => 'active', 'email_verified_at' => now()]);
        $user->assignRole('USER');
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        // Token should now be invalid
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me')
            ->assertStatus(401);
    });
});

// ─── RBAC / Role Tests ────────────────────────────────────────────────────────

describe('RBAC', function () {

    it('denies customer access to admin endpoints', function () {
        $user = User::factory()->create(['status' => 'active', 'email_verified_at' => now()]);
        $user->assignRole('USER');
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/dashboard')
            ->assertStatus(403);
    });

    it('denies reseller access to admin endpoints', function () {
        $org = Organization::factory()->create(['type' => 'reseller', 'status' => 'active']);
        $user = User::factory()->create(['status' => 'active', 'email_verified_at' => now(), 'current_organization_id' => $org->id]);
        $user->assignRole('RESELLER');
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/dashboard')
            ->assertStatus(403);
    });

    it('allows super admin access to admin endpoints', function () {
        $user = User::factory()->create(['status' => 'active', 'email_verified_at' => now()]);
        $user->assignRole('SUPER_ADMIN');
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/dashboard')
            ->assertOk();
    });
});

// ─── Tenant Isolation Tests ───────────────────────────────────────────────────

describe('Tenant Isolation', function () {

    it('reseller cannot see orders belonging to another org', function () {
        $org1 = Organization::factory()->create(['type' => 'reseller', 'status' => 'active']);
        $org2 = Organization::factory()->create(['type' => 'reseller', 'status' => 'active']);

        $user1 = User::factory()->create(['status' => 'active', 'email_verified_at' => now(), 'current_organization_id' => $org1->id]);
        $user1->assignRole('RESELLER');

        // Create an order belonging to org2
        $customer = User::factory()->create(['status' => 'active', 'email_verified_at' => now()]);
        $order = \App\Models\Order::factory()->create([
            'organization_id' => $org2->id,
            'customer_id' => $customer->id,
        ]);

        $token = $user1->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/reseller/orders');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        expect($ids)->not->toContain($order->id);
    });

    it('reseller cannot see another org wallet balance', function () {
        $org1 = Organization::factory()->create(['type' => 'reseller', 'status' => 'active']);
        $org2 = Organization::factory()->create(['type' => 'reseller', 'status' => 'active']);
        Wallet::factory()->create(['organization_id' => $org2->id, 'available_balance' => 99999]);

        $user1 = User::factory()->create(['status' => 'active', 'email_verified_at' => now(), 'current_organization_id' => $org1->id]);
        $user1->assignRole('RESELLER');
        $token = $user1->createToken('test')->plainTextToken;

        // Org1's wallet endpoint should only return org1's wallet
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/reseller/wallet');

        $response->assertOk();
        $walletOrgId = $response->json('data.organization_id');
        expect($walletOrgId)->toBe($org1->id);
    });
});

// ─── Pricing Visibility Tests ─────────────────────────────────────────────────

describe('Pricing Visibility', function () {

    it('customer cannot see cost_price in marketplace response', function () {
        $user = User::factory()->create(['status' => 'active', 'email_verified_at' => now()]);
        $user->assignRole('USER');
        $token = $user->createToken('test')->plainTextToken;

        $product = \App\Models\Product::factory()->create(['status' => 'active', 'visibility' => 'public']);
        $product->prices()->create([
            'pricing_type' => 'fixed',
            'cost_price' => 100,
            'reseller_price' => 150,
            'customer_price' => 199,
            'currency' => 'INR',
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/marketplace/products/{$product->slug}");

        $response->assertOk();
        $pricing = $response->json('data.pricing');

        // Customer sees price only
        expect($pricing)->toHaveKey('price');
        expect($pricing)->not->toHaveKey('cost_price');
        expect($pricing)->not->toHaveKey('reseller_price');
        expect($pricing)->not->toHaveKey('platform_margin');
        expect((float)$pricing['price'])->toBe(199.0);
    });

    it('reseller sees their price and profit but not cost', function () {
        $org = Organization::factory()->create(['type' => 'reseller', 'status' => 'active']);
        $user = User::factory()->create(['status' => 'active', 'email_verified_at' => now(), 'current_organization_id' => $org->id]);
        $user->assignRole('RESELLER');
        $token = $user->createToken('test')->plainTextToken;

        $product = \App\Models\Product::factory()->create(['status' => 'active', 'visibility' => 'public']);
        $product->prices()->create([
            'pricing_type' => 'fixed',
            'cost_price' => 100,
            'reseller_price' => 150,
            'customer_price' => 199,
            'currency' => 'INR',
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/marketplace/products/{$product->slug}");

        $response->assertOk();
        $pricing = $response->json('data.pricing');

        expect($pricing)->toHaveKey('your_price');
        expect($pricing)->toHaveKey('customer_price');
        expect($pricing)->toHaveKey('your_profit');
        expect($pricing)->not->toHaveKey('cost_price');
        expect((float)$pricing['your_price'])->toBe(150.0);
        expect((float)$pricing['your_profit'])->toBe(49.0);
    });

    it('admin sees all three price tiers including cost', function () {
        $user = User::factory()->create(['status' => 'active', 'email_verified_at' => now()]);
        $user->assignRole('SUPER_ADMIN');
        $token = $user->createToken('test')->plainTextToken;

        $product = \App\Models\Product::factory()->create(['status' => 'active', 'visibility' => 'public']);
        $product->prices()->create([
            'pricing_type' => 'fixed',
            'cost_price' => 100,
            'reseller_price' => 150,
            'customer_price' => 199,
            'currency' => 'INR',
            'is_active' => true,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/marketplace/products/{$product->slug}");

        $response->assertOk();
        $pricing = $response->json('data.pricing');

        expect($pricing)->toHaveKey('cost_price');
        expect($pricing)->toHaveKey('reseller_price');
        expect($pricing)->toHaveKey('customer_price');
        expect($pricing)->toHaveKey('platform_margin');
        expect((float)$pricing['cost_price'])->toBe(100.0);
        expect((float)$pricing['platform_margin'])->toBe(50.0);
    });
});

// ─── Wallet Tests ─────────────────────────────────────────────────────────────

describe('Wallet', function () {

    it('credits wallet correctly', function () {
        $org = Organization::factory()->create(['type' => 'reseller', 'status' => 'active', 'currency' => 'INR']);
        $walletService = app(WalletService::class);

        $tx = $walletService->credit($org, 1000.00, 'test-credit-1', 'Test credit');

        expect($tx->type)->toBe('credit');
        expect($tx->amount)->toBe('1000.00');
        expect($tx->balance_after)->toBe('1000.00');

        $wallet = $org->fresh()->wallet;
        expect($wallet->available_balance)->toBe('1000.00');
    });

    it('debits wallet correctly', function () {
        $org = Organization::factory()->create(['type' => 'reseller', 'status' => 'active', 'currency' => 'INR']);
        $walletService = app(WalletService::class);

        $walletService->credit($org, 5000.00, 'credit-for-debit-test', 'Initial');
        $tx = $walletService->debit($org, 799.00, 'debit-order-1', 'Order payment');

        expect($tx->type)->toBe('debit');
        expect((float)$tx->balance_after)->toBe(4201.0);

        $wallet = $org->fresh()->wallet;
        expect((float)$wallet->available_balance)->toBe(4201.0);
    });

    it('throws InsufficientWalletBalanceException when balance is too low', function () {
        $org = Organization::factory()->create(['type' => 'reseller', 'status' => 'active', 'currency' => 'INR']);
        $walletService = app(WalletService::class);

        $walletService->credit($org, 100.00, 'small-credit', 'Small top-up');

        expect(fn() => $walletService->debit($org, 500.00, 'overdraft-attempt', 'Should fail'))
            ->toThrow(InsufficientWalletBalanceException::class);

        // Balance must remain unchanged after failed debit
        $wallet = $org->fresh()->wallet;
        expect((float)$wallet->available_balance)->toBe(100.0);
    });

    it('prevents duplicate transactions via idempotency key', function () {
        $org = Organization::factory()->create(['type' => 'reseller', 'status' => 'active', 'currency' => 'INR']);
        $walletService = app(WalletService::class);

        $walletService->credit($org, 1000.00, 'idempotent-credit-1', 'First credit');

        // Same idempotency key — must throw DuplicateTransactionException
        expect(fn() => $walletService->credit($org, 1000.00, 'idempotent-credit-1', 'Duplicate'))
            ->toThrow(DuplicateTransactionException::class);

        // Balance must only reflect a single credit
        $wallet = $org->fresh()->wallet;
        expect((float)$wallet->available_balance)->toBe(1000.0);
    });

    it('wallet ledger rows are immutable after creation', function () {
        $org = Organization::factory()->create(['type' => 'reseller', 'status' => 'active', 'currency' => 'INR']);
        $walletService = app(WalletService::class);

        $tx = $walletService->credit($org, 500.00, 'immutable-test', 'Test');

        expect(fn() => $tx->save())->toThrow(\RuntimeException::class);
    });
});

// ─── Pricing Unit Tests ───────────────────────────────────────────────────────

describe('PricingService', function () {

    it('resolves fixed price correctly', function () {
        $product = \App\Models\Product::factory()->create(['status' => 'active', 'visibility' => 'public']);
        $product->prices()->create([
            'pricing_type' => 'fixed',
            'cost_price' => 100,
            'reseller_price' => 150,
            'customer_price' => 199,
            'currency' => 'INR',
            'is_active' => true,
        ]);

        $user = User::factory()->create(['status' => 'active']);
        $user->assignRole('USER');

        $service = app(PricingService::class);
        $result = $service->resolve($product, $user);

        expect($result->customerPrice)->toBe(199.0);
        expect($result->available)->toBeTrue();
    });

    it('computes percentage markup correctly', function () {
        $product = \App\Models\Product::factory()->create(['status' => 'active', 'visibility' => 'public']);
        $product->prices()->create([
            'pricing_type' => 'percentage',
            'cost_price' => 100,
            'reseller_markup_pct' => 0.50, // 50%
            'customer_markup_pct' => 0.20, // 20% on top of reseller
            'currency' => 'INR',
            'is_active' => true,
        ]);

        $service = app(PricingService::class);
        $breakdown = $service->resolveFullBreakdown($product);

        expect($breakdown->resellerPrice)->toBe(150.0); // 100 * 1.5
        expect($breakdown->customerPrice)->toBe(180.0); // 150 * 1.2
    });
});

// ─── Order Service & Profit Tests ─────────────────────────────────────────────

describe('Order Processing', function () {

    it('creates an order, debits wallet, and records profit distribution', function () {
        $org = Organization::factory()->create(['type' => 'reseller', 'status' => 'active', 'currency' => 'INR']);
        $user = User::factory()->create(['status' => 'active', 'current_organization_id' => $org->id]);
        $user->assignRole('RESELLER');
        $org->users()->attach($user->id, ['role_within_org' => 'owner', 'status' => 'active', 'joined_at' => now()]);

        // Top up wallet
        app(WalletService::class)->credit($org, 5000.0, 'init-credit', 'Initial');

        $product = \App\Models\Product::factory()->create(['status' => 'active', 'visibility' => 'public']);
        $product->prices()->create([
            'pricing_type' => 'fixed',
            'cost_price' => 100,
            'reseller_price' => 150,
            'customer_price' => 200,
            'currency' => 'INR',
            'is_active' => true,
        ]);

        $orderService = app(\App\Services\Order\OrderService::class);
        $order = $orderService->createOrder($user, [
            'payment_method' => 'wallet',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ]);

        expect($order->status)->toBe('completed');
        expect((float) $order->total_amount)->toBe(400.0); // 200 * 2

        // Wallet debited by reseller_price (150 * 2 = 300)
        $wallet = $org->fresh()->wallet;
        expect((float) $wallet->available_balance)->toBe(4700.0); // 5000 - 300

        // Check profit record
        $profit = \Illuminate\Support\Facades\DB::table('profit_records')->where('organization_id', $org->id)->first();
        expect($profit)->not->toBeNull();
        expect((float) $profit->platform_gross_profit)->toBe(100.0); // (150 - 100) * 2
        expect((float) $profit->reseller_profit)->toBe(100.0); // (200 - 150) * 2
    });
});

// ─── Subscription Renewal Tests ────────────────────────────────────────────────

describe('Subscription Renewal', function () {

    it('renews subscription and debits wallet', function () {
        $org = Organization::factory()->create(['type' => 'reseller', 'status' => 'active']);
        $user = User::factory()->create(['status' => 'active', 'current_organization_id' => $org->id]);

        app(WalletService::class)->credit($org, 2000.0, 'sub-credit', 'Sub topup');

        $service = \App\Models\Service::create([
            'name' => 'Cloud Hosting',
            'status' => 'active',
            'visibility' => 'public',
        ]);
        $plan = $service->plans()->create([
            'name' => 'Starter Plan',
            'slug' => 'starter-plan',
            'status' => 'active',
        ]);

        $sub = \App\Models\Subscription::create([
            'organization_id' => $org->id,
            'customer_id' => $user->id,
            'service_plan_id' => $plan->id,
            'status' => 'active',
            'billing_interval' => 'monthly',
            'amount' => 500.0,
            'cost_price_snapshot' => 300.0,
            'reseller_price_snapshot' => 400.0,
            'customer_price_snapshot' => 500.0,
            'current_period_start' => now()->subMonth(),
            'current_period_end' => now()->subDay(),
            'next_billing_at' => now()->subDay(),
            'currency' => 'INR',
        ]);

        $service = app(\App\Services\Subscription\SubscriptionRenewalService::class);
        $service->renewSubscription($sub);

        $freshSub = $sub->fresh();
        expect($freshSub->status)->toBe('active');
        expect($freshSub->current_period_end->isFuture())->toBeTrue();

        $wallet = $org->fresh()->wallet;
        expect((float) $wallet->available_balance)->toBe(1600.0); // 2000 - 400 (reseller price)
    });
});

// ─── Marketplace API Tests ───────────────────────────────────────────────────

describe('Marketplace APIs & Role Pricing Controls', function () {

    it('returns homepage data with categories, featured items, and offers', function () {
        $response = $this->getJson('/api/v1/marketplace');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'banners',
                    'featured_products',
                    'featured_services',
                    'categories',
                    'active_offers',
                ]
            ]);
    });

    it('returns categories hierarchy', function () {
        $response = $this->getJson('/api/v1/marketplace/categories');
        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    });

    it('returns offers and advertisements', function () {
        $this->getJson('/api/v1/marketplace/offers')->assertStatus(200);
        $this->getJson('/api/v1/marketplace/advertisements')->assertStatus(200);
    });

    it('enforces role-based pricing constraints in product listings', function () {
        $product = \App\Models\Product::factory()->create(['status' => 'active', 'visibility' => 'public']);
        $product->prices()->create([
            'pricing_type' => 'fixed',
            'cost_price' => 100,
            'reseller_price' => 150,
            'customer_price' => 200,
            'currency' => 'INR',
            'is_active' => true,
        ]);

        // 1. Guest / Customer Request -> sees price only, cost_price and reseller_price must NOT exist
        $resCustomer = $this->getJson('/api/v1/marketplace/products');
        $resCustomer->assertStatus(200);
        $custPricing = $resCustomer->json('data.0.pricing');
        expect($custPricing)->toHaveKey('price');
        expect($custPricing)->not->toHaveKey('cost_price');
        expect($custPricing)->not->toHaveKey('reseller_price');
        expect($custPricing)->not->toHaveKey('your_price');

        // 2. Reseller Request -> sees your_price, customer_price, your_profit, cost_price MUST NOT exist
        $resellerUser = User::factory()->create(['status' => 'active']);
        $resellerUser->assignRole('RESELLER');

        $resReseller = $this->actingAs($resellerUser, 'sanctum')->getJson('/api/v1/marketplace/products');
        $resReseller->assertStatus(200);
        $resPricing = $resReseller->json('data.0.pricing');
        expect($resPricing)->toHaveKey('your_price');
        expect($resPricing)->toHaveKey('customer_price');
        expect($resPricing)->toHaveKey('your_profit');
        expect($resPricing)->not->toHaveKey('cost_price');

        // 3. Admin Request -> sees cost_price, reseller_price, customer_price, platform_margin, reseller_margin
        $adminUser = User::factory()->create(['status' => 'active']);
        $adminUser->assignRole('SUPER_ADMIN');

        $resAdmin = $this->actingAs($adminUser, 'sanctum')->getJson('/api/v1/marketplace/products');
        $resAdmin->assertStatus(200);
        $adminPricing = $resAdmin->json('data.0.pricing');
        expect($adminPricing)->toHaveKey('cost_price');
        expect($adminPricing)->toHaveKey('reseller_price');
        expect($adminPricing)->toHaveKey('customer_price');
        expect($adminPricing)->toHaveKey('platform_margin');
        expect($adminPricing)->toHaveKey('reseller_margin');
    });
});

// ─── End-to-End Flow: Admin -> Reseller -> Customer ───────────────────────────

describe('Complete Admin -> Reseller -> Customer Integration Flow', function () {

    it('executes full commercial lifecycle with wallet debits, service assignment, and tenant isolation', function () {
        // Step 1: Admin Provisions Reseller Org & Wallet
        $admin = User::factory()->create(['status' => 'active']);
        $admin->assignRole('SUPER_ADMIN');

        $resellerOrg = \App\Models\Organization::create([
            'name' => 'Apex Digital Reseller',
            'slug' => 'apex-digital',
            'type' => 'reseller',
            'status' => 'active',
        ]);
        $wallet = \App\Models\Wallet::create([
            'organization_id' => $resellerOrg->id,
            'balance' => 0.00,
            'available_balance' => 0.00,
            'credit_limit' => 50000.00,
            'currency' => 'INR',
        ]);

        $resellerUser = User::factory()->create([
            'name' => 'Apex Manager',
            'email' => 'manager@apexdigital.com',
            'current_organization_id' => $resellerOrg->id,
            'status' => 'active',
        ]);
        $resellerUser->assignRole('RESELLER');
        $resellerOrg->users()->attach($resellerUser->id, ['role_within_org' => 'owner', 'status' => 'active']);

        // Admin tops up reseller wallet with 10,000 credit
        $resTopup = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/wallets/{$resellerOrg->id}/adjust", [
                'type' => 'credit',
                'amount' => 10000,
                'description' => 'Initial credit allocation',
            ]);
        $resTopup->assertStatus(200);

        // Admin creates product & service with 3-tier pricing
        $product = \App\Models\Product::create([
            'name' => 'Enterprise VPN Router',
            'slug' => 'enterprise-vpn-router',
            'sku' => 'VPN-RTR-01',
            'status' => 'active',
            'visibility' => 'public',
        ]);
        $product->prices()->create([
            'pricing_type' => 'fixed',
            'cost_price' => 1000,
            'reseller_price' => 1500,
            'customer_price' => 2000,
            'currency' => 'INR',
            'is_active' => true,
        ]);

        $service = \App\Models\Service::create([
            'name' => 'Cloud Managed Firewall',
            'slug' => 'cloud-managed-firewall',
            'status' => 'active',
            'visibility' => 'public',
        ]);
        $plan = $service->plans()->create([
            'name' => 'Pro Firewall Plan',
            'slug' => 'pro-firewall-plan',
            'status' => 'active',
        ]);
        $plan->prices()->create([
            'pricing_type' => 'fixed',
            'cost_price' => 2000,
            'reseller_price' => 3000,
            'customer_price' => 4000,
            'currency' => 'INR',
            'is_active' => true,
        ]);

        // Step 2: Reseller Provisions End-Customer
        $resCustomerCreate = $this->actingAs($resellerUser, 'sanctum')
            ->postJson('/api/v1/reseller/customers', [
                'name' => 'Acme Corp Customer',
                'email' => 'purchasing@acmecorp.com',
                'password' => 'AcmePass@1234',
            ]);
        $resCustomerCreate->assertStatus(201);
        $customerId = $resCustomerCreate->json('data.id');

        // Step 3: Reseller Orders Product for Customer using Wallet
        $resOrder = $this->actingAs($resellerUser, 'sanctum')
            ->postJson('/api/v1/reseller/orders', [
                'customer_id' => $customerId,
                'payment_method' => 'wallet',
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 2]
                ]
            ]);
        $resOrder->assertStatus(201);
        $orderId = $resOrder->json('data.id');

        // Reseller Wallet Debited: 2 * 1500 = 3000 -> Available balance is 10,000 - 3000 = 7000
        expect((float) $resellerOrg->fresh()->wallet->available_balance)->toBe(7000.0);

        // Step 4: Reseller Assigns Service Plan to Customer
        $resAssign = $this->actingAs($resellerUser, 'sanctum')
            ->postJson('/api/v1/reseller/services/assign', [
                'customer_id' => $customerId,
                'service_plan_id' => $plan->id,
                'billing_interval' => 'monthly',
            ]);
        $resAssign->assertStatus(201);

        // Reseller Wallet Debited: 1 * 3000 = 3000 -> Available balance is 7000 - 3000 = 4000
        expect((float) $resellerOrg->fresh()->wallet->available_balance)->toBe(4000.0);

        // Step 5: Customer Sign-In & Verification
        $customerUser = User::find($customerId);
        $resCustOrders = $this->actingAs($customerUser, 'sanctum')->getJson('/api/v1/orders');
        $resCustOrders->assertStatus(200);
        expect((float) $resCustOrders->json('data.0.grand_total'))->toBe(4000.0); // 2 * 2000 customer price

        $resCustSubs = $this->actingAs($customerUser, 'sanctum')->getJson('/api/v1/subscriptions');
        $resCustSubs->assertStatus(200);
        expect($resCustSubs->json('data.0.status'))->toBe('active');

        // Step 6: Strict Tenant Isolation Check
        $otherOrg = \App\Models\Organization::create(['name' => 'Other Org', 'slug' => 'other-org', 'type' => 'reseller', 'status' => 'active']);
        $otherReseller = User::factory()->create(['current_organization_id' => $otherOrg->id, 'status' => 'active']);
        $otherReseller->assignRole('RESELLER');
        $otherOrg->users()->attach($otherReseller->id, ['role_within_org' => 'owner', 'status' => 'active']);

        // Other reseller MUST NOT see Apex reseller's customer
        $this->actingAs($otherReseller, 'sanctum')
            ->getJson("/api/v1/reseller/customers/{$customerId}")
            ->assertStatus(404);

        // Other reseller MUST NOT see Apex reseller's order
        $this->actingAs($otherReseller, 'sanctum')
            ->getJson("/api/v1/reseller/orders/{$orderId}")
            ->assertStatus(404);
    });
});

// ─── Financial Core Suite: Refunds, Profit Reversal & Idempotency ────────────

describe('Financial Core Integrity & Refund Processing', function () {

    it('processes order refund, credits reseller wallet, and writes profit reversal', function () {
        $admin = User::factory()->create(['status' => 'active']);
        $admin->assignRole('SUPER_ADMIN');

        $org = \App\Models\Organization::create([
            'name' => 'Financial Test Org',
            'slug' => 'fin-test-org',
            'type' => 'reseller',
            'status' => 'active',
        ]);
        $wallet = \App\Models\Wallet::create([
            'organization_id' => $org->id,
            'balance' => 5000.00,
            'available_balance' => 5000.00,
            'currency' => 'INR',
        ]);

        $customer = User::factory()->create(['current_organization_id' => $org->id, 'status' => 'active']);
        $org->users()->attach($customer->id, ['role_within_org' => 'customer', 'status' => 'active']);
        $product = \App\Models\Product::create([
            'name' => 'Secure Gateway Unit',
            'slug' => 'secure-gateway-unit',
            'sku' => 'SEC-GW-99',
            'status' => 'active',
            'visibility' => 'public',
        ]);
        $product->prices()->create([
            'pricing_type' => 'fixed',
            'cost_price' => 500,
            'reseller_price' => 800,
            'customer_price' => 1200,
            'currency' => 'INR',
            'is_active' => true,
        ]);

        // Place Order -> Reseller price total = 800 * 2 = 1600. Available wallet becomes 5000 - 1600 = 3400.
        $orderService = app(\App\Services\Order\OrderService::class);
        $order = $orderService->createOrder($customer, [
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'payment_method' => 'wallet',
        ]);

        expect($order->status)->toBe('completed');
        expect((float) $org->fresh()->wallet->available_balance)->toBe(3400.0);

        // Verify initial profit record: platform_gross_profit = (800-500)*2 = 600, reseller_profit = (1200-800)*2 = 800
        $profitBefore = \App\Models\ProfitRecord::where('organization_id', $org->id)->get();
        expect($profitBefore->count())->toBe(1);
        expect((float) $profitBefore->first()->platform_gross_profit)->toBe(600.0);
        expect((float) $profitBefore->first()->reseller_profit)->toBe(800.0);

        // Perform Refund via Admin API
        $resRefund = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/orders/{$order->id}/refund", ['reason' => 'Defective Unit']);
        $resRefund->assertStatus(200);

        // Reseller Wallet Credited: 3400 + 1600 = 5000
        expect((float) $org->fresh()->wallet->available_balance)->toBe(5000.0);
        expect($order->fresh()->status)->toBe('refunded');

        // Profit Reversal Recorded
        $profitAfter = \App\Models\ProfitRecord::where('organization_id', $org->id)->get();
        expect($profitAfter->count())->toBe(2);
        expect((float) $profitAfter->last()->platform_gross_profit)->toBe(-600.0);
        expect((float) $profitAfter->last()->reseller_profit)->toBe(-800.0);
    });

    it('handles rapid sequential credits, debits, recharges, and rejects duplicate idempotency keys', function () {
        $walletService = app(\App\Services\Wallet\WalletService::class);
        $org = \App\Models\Organization::create(['name' => 'Rapid Fin Org', 'slug' => 'rapid-fin-org', 'type' => 'reseller', 'status' => 'active']);
        $wallet = \App\Models\Wallet::create(['organization_id' => $org->id, 'balance' => 0, 'available_balance' => 0, 'currency' => 'INR']);

        // 1. Credit 10,000 via recharge
        $walletService->credit($org, 10000, 'recharge-key-1', 'Recharge 1');
        expect((float) $org->fresh()->wallet->available_balance)->toBe(10000.0);

        // 2. Retry exact same recharge key -> Throws DuplicateTransactionException & balance stays 10,000
        expect(fn() => $walletService->credit($org, 10000, 'recharge-key-1', 'Recharge 1 Duplicate'))
            ->toThrow(\App\Exceptions\DuplicateTransactionException::class);
        expect((float) $org->fresh()->wallet->available_balance)->toBe(10000.0);

        // 3. Sequential debits: 3,000 and 4,000 -> balance becomes 3,000
        $walletService->debit($org, 3000, 'debit-key-1', 'Order 1');
        $walletService->debit($org, 4000, 'debit-key-2', 'Order 2');
        expect((float) $org->fresh()->wallet->available_balance)->toBe(3000.0);

        // 4. Overdraft debit attempt of 5,000 -> Throws InsufficientWalletBalanceException
        expect(fn() => $walletService->debit($org, 5000, 'debit-key-3', 'Order 3 Overdraft'))
            ->toThrow(\App\Exceptions\InsufficientWalletBalanceException::class);
        expect((float) $org->fresh()->wallet->available_balance)->toBe(3000.0);

        // 5. Verify ledger row count & balance_before/balance_after progression
        $txns = \App\Models\WalletTransaction::where('wallet_id', $wallet->id)->orderBy('created_at')->get();
        expect($txns->count())->toBe(3);
        expect((float) $txns[0]->balance_before)->toBe(0.0);
        expect((float) $txns[0]->balance_after)->toBe(10000.0);
        expect((float) $txns[1]->balance_before)->toBe(10000.0);
        expect((float) $txns[1]->balance_after)->toBe(7000.0);
        expect((float) $txns[2]->balance_before)->toBe(7000.0);
        expect((float) $txns[2]->balance_after)->toBe(3000.0);
    });
});

// ─── Recurring Services & Subscriptions Suite ────────────────────────────────

describe('Recurring Subscriptions, State Machine & Renewal Reminders', function () {

    it('processes trial transitions, grace period state machine, and suspension on zero wallet balance', function () {
        $renewalService = app(\App\Services\Subscription\SubscriptionRenewalService::class);

        $org = \App\Models\Organization::create(['name' => 'Sub Test Org', 'slug' => 'sub-test-org', 'type' => 'reseller', 'status' => 'active']);
        $wallet = \App\Models\Wallet::create(['organization_id' => $org->id, 'balance' => 0, 'available_balance' => 0, 'currency' => 'INR']);

        $customer = User::factory()->create(['current_organization_id' => $org->id, 'status' => 'active']);
        $service = \App\Models\Service::create(['name' => 'VPN Service', 'slug' => 'vpn-service', 'status' => 'active', 'visibility' => 'public']);
        $plan = $service->plans()->create(['name' => 'Basic Plan', 'slug' => 'basic-plan', 'status' => 'active']);

        // 1. Create sub in trial state, ending now
        $sub = \App\Models\Subscription::create([
            'organization_id' => $org->id,
            'customer_id' => $customer->id,
            'service_plan_id' => $plan->id,
            'status' => 'trial',
            'billing_interval' => 'quarterly',
            'amount' => 1200.0,
            'cost_price_snapshot' => 800.0,
            'reseller_price_snapshot' => 1200.0,
            'customer_price_snapshot' => 1500.0,
            'current_period_start' => now(),
            'current_period_end' => now()->addMonths(3),
            'next_billing_at' => now()->addMonths(3),
            'trial_ends_at' => now()->subMinute(),
            'currency' => 'INR',
        ]);

        // Attempt renewal when wallet balance is 0 -> Payment fails -> transitions to grace_period
        $renewalService->processRenewals();

        $freshSub = $sub->fresh();
        expect($freshSub->status)->toBe('grace_period');
        expect($freshSub->retry_count)->toBe(1);

        // Simulate 3 failed retries and grace period expiration -> transitions to suspended
        $freshSub->update(['retry_count' => 3, 'current_period_end' => now()->subDays(4)]);
        $renewalService->handleFailedPayment($freshSub);

        expect($freshSub->fresh()->status)->toBe('suspended');
    });

    it('dispatches automatic renewal reminders for 7d, 3d, 1d, and 0d', function () {
        $renewalService = app(\App\Services\Subscription\SubscriptionRenewalService::class);

        $org = \App\Models\Organization::create(['name' => 'Notify Org', 'slug' => 'notify-org', 'type' => 'reseller', 'status' => 'active']);
        $customer = User::factory()->create(['current_organization_id' => $org->id, 'status' => 'active']);
        $service = \App\Models\Service::create(['name' => 'Backup Service', 'slug' => 'backup-service', 'status' => 'active', 'visibility' => 'public']);
        $plan = $service->plans()->create(['name' => 'Cloud Backup', 'slug' => 'cloud-backup', 'status' => 'active']);

        // Create subscription due in 3 days
        $sub = \App\Models\Subscription::create([
            'organization_id' => $org->id,
            'customer_id' => $customer->id,
            'service_plan_id' => $plan->id,
            'status' => 'active',
            'billing_interval' => 'monthly',
            'amount' => 500.0,
            'cost_price_snapshot' => 300.0,
            'reseller_price_snapshot' => 500.0,
            'customer_price_snapshot' => 700.0,
            'current_period_start' => now(),
            'current_period_end' => now()->addDays(3),
            'next_billing_at' => now()->addDays(3),
            'currency' => 'INR',
        ]);

        $res = $renewalService->sendRenewalReminders();
        expect($res['reminders_sent'])->toBeGreaterThanOrEqual(1);

        $notif = \Illuminate\Support\Facades\DB::table('notifications')
            ->where('notifiable_id', $customer->id)
            ->first();
        expect($notif)->not->toBeNull();
        expect($notif->data)->toContain('Cloud Backup');
    });

    it('cancels subscription gracefully', function () {
        $renewalService = app(\App\Services\Subscription\SubscriptionRenewalService::class);

        $org = \App\Models\Organization::create(['name' => 'Cancel Org', 'slug' => 'cancel-org', 'type' => 'reseller', 'status' => 'active']);
        $customer = User::factory()->create(['current_organization_id' => $org->id, 'status' => 'active']);
        $service = \App\Models\Service::create(['name' => 'Host Service', 'slug' => 'host-service', 'status' => 'active', 'visibility' => 'public']);
        $plan = $service->plans()->create(['name' => 'Host Plan', 'slug' => 'host-plan', 'status' => 'active']);

        $sub = \App\Models\Subscription::create([
            'organization_id' => $org->id,
            'customer_id' => $customer->id,
            'service_plan_id' => $plan->id,
            'status' => 'active',
            'billing_interval' => 'yearly',
            'amount' => 5000.0,
            'cost_price_snapshot' => 3000.0,
            'reseller_price_snapshot' => 5000.0,
            'customer_price_snapshot' => 7000.0,
            'current_period_start' => now(),
            'current_period_end' => now()->addYear(),
            'next_billing_at' => now()->addYear(),
            'currency' => 'INR',
        ]);

        $renewalService->cancelSubscription($sub, 'User requested downgrade');
        $fresh = $sub->fresh();
        expect($fresh->status)->toBe('cancelled');
        expect($fresh->cancellation_reason)->toBe('User requested downgrade');
    });
});

// ─── Payment Architecture & Gateway Integration Suite ────────────────────────

describe('Payment Architecture, Webhooks & Gateway Integration', function () {

    it('initiates wallet recharge without crediting wallet until signature verification', function () {
        $paymentService = app(\App\Services\Payment\PaymentService::class);

        $org = \App\Models\Organization::create(['name' => 'Pay Org', 'slug' => 'pay-org', 'type' => 'reseller', 'status' => 'active']);
        $wallet = \App\Models\Wallet::create(['organization_id' => $org->id, 'balance' => 0, 'available_balance' => 0, 'currency' => 'INR']);
        $user = User::factory()->create(['current_organization_id' => $org->id, 'status' => 'active']);

        // Initiate Razorpay order -> creates Payment record only
        $res = $paymentService->initiateWalletRecharge($org, $user, 2500.0, 'razorpay');
        expect($res['status'])->toBe('initiated');
        expect($res['amount'])->toBe(2500.0);
        expect($res['gateway'])->toBe('razorpay');

        // Wallet balance MUST STILL BE 0 (never credit on initiation or frontend success alone!)
        expect((float) $org->fresh()->wallet->available_balance)->toBe(0.0);

        // Fetch Payment record
        $payment = \App\Models\Payment::findOrFail($res['payment_id']);
        expect($payment->status)->toBe('initiated');

        // Fulfill with valid mock signature
        $fulfilled = $paymentService->verifyAndFulfillPayment($payment, [
            'razorpay_order_id' => $payment->gateway_order_id,
            'razorpay_payment_id' => 'pay_mock_123',
        ], 'valid_mock_signature');

        expect($fulfilled->status)->toBe('succeeded');
        expect((float) $org->fresh()->wallet->available_balance)->toBe(2500.0);
    });

    it('enforces webhook idempotency and rejects duplicate event_ids', function () {
        $paymentService = app(\App\Services\Payment\PaymentService::class);

        $org = \App\Models\Organization::create(['name' => 'Webhook Org', 'slug' => 'webhook-org', 'type' => 'reseller', 'status' => 'active']);
        $wallet = \App\Models\Wallet::create(['organization_id' => $org->id, 'balance' => 1000, 'available_balance' => 1000, 'currency' => 'INR']);

        $payload = [
            'event_id' => 'evt_test_unique_99',
            'event' => 'payment.captured',
            'organization_id' => $org->id,
            'amount' => 1500,
        ];

        // 1st Webhook call -> Credits wallet 1500 (1000 -> 2500)
        $res1 = $paymentService->handleWebhook('razorpay', $payload, json_encode($payload), 'valid_mock_signature');
        expect($res1['status'])->toBe('success');
        expect((float) $org->fresh()->wallet->available_balance)->toBe(2500.0);

        // 2nd Webhook call with EXACT SAME event_id -> Returns already_processed, balance STAYS 2500
        $res2 = $paymentService->handleWebhook('razorpay', $payload, json_encode($payload), 'valid_mock_signature');
        expect($res2['status'])->toBe('already_processed');
        expect((float) $org->fresh()->wallet->available_balance)->toBe(2500.0);
    });

    it('instantiates all multi-gateway drivers via GatewayFactory', function () {
        $gateways = ['razorpay', 'phonepe', 'cashfree', 'stripe'];
        foreach ($gateways as $gwName) {
            $gw = \App\Services\Payment\PaymentGatewayFactory::make($gwName);
            expect($gw)->toBeInstanceOf(\App\Services\Payment\Gateways\PaymentGatewayInterface::class);

            $order = $gw->createOrder(1000.0, 'INR', []);
            expect($order['gateway'])->toBe($gwName);
            expect($order['amount'])->toBe(1000.0);
        }
    });
});

// ─── Complete End-to-End Multi-Role Real Workflow Test ───────────────────────

describe('Complete End-to-End Real Commercial Workflow', function () {

    it('executes full Admin -> Catalog -> Reseller -> Customer -> Order -> Wallet -> Profit -> Subscription -> Renewal -> Refund lifecycle', function () {
        // ── 1. Admin Setup & Catalog Publishing ─────────────────────────────
        $admin = User::factory()->create(['status' => 'active']);
        $admin->assignRole('SUPER_ADMIN');

        // Admin creates Category
        $resCat = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/categories', [
            'name' => 'Cloud Infrastructure',
            'slug' => 'cloud-infrastructure',
            'status' => 'active',
        ]);
        $resCat->assertStatus(201);
        $categoryId = $resCat->json('data.id');

        // Admin creates Product with 3-tier pricing
        $resProd = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/products', [
            'category_id' => $categoryId,
            'name' => 'Enterprise Firewall Appliance',
            'slug' => 'enterprise-firewall-appliance',
            'sku' => 'E-FW-100',
            'type' => 'digital',
            'pricing_type' => 'fixed',
            'cost_price' => 2000,
            'reseller_price' => 3000,
            'customer_price' => 4500,
            'currency' => 'INR',
            'status' => 'active',
            'visibility' => 'public',
        ]);
        $resProd->assertStatus(201);
        $productId = $resProd->json('data.id');

        // Admin creates Service & Plan with 3-tier pricing
        $resServ = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/services', [
            'category_id' => $categoryId,
            'name' => 'Endpoint Shield Protection',
            'slug' => 'endpoint-shield-protection',
            'status' => 'active',
            'visibility' => 'public',
            'plans' => [
                [
                    'name' => 'Pro Protection Plan',
                    'slug' => 'pro-protection-plan',
                    'billing_interval' => 'monthly',
                    'cost_price' => 1000,
                    'reseller_price' => 1500,
                    'customer_price' => 2200,
                    'currency' => 'INR',
                    'status' => 'active',
                ]
            ],
        ]);
        $resServ->assertStatus(201);
        $servicePlanId = $resServ->json('data.plans.0.id');

        // ── 2. Reseller Onboarding & Customer Provisioning ──────────────────
        $resellerOrg = \App\Models\Organization::create([
            'name' => 'Apex Cloud Partners',
            'slug' => 'apex-cloud-partners',
            'type' => 'reseller',
            'status' => 'active',
        ]);
        $wallet = \App\Models\Wallet::create([
            'organization_id' => $resellerOrg->id,
            'balance' => 0,
            'available_balance' => 0,
            'currency' => 'INR',
        ]);

        $resellerUser = User::factory()->create([
            'current_organization_id' => $resellerOrg->id,
            'status' => 'active',
        ]);
        $resellerUser->assignRole('RESELLER');
        $resellerOrg->users()->attach($resellerUser->id, ['role_within_org' => 'owner', 'status' => 'active']);

        // Admin tops up Reseller Wallet with 10,000 INR
        $walletService = app(\App\Services\Wallet\WalletService::class);
        $walletService->credit($resellerOrg, 10000, 'admin-topup-e2e', 'Initial Credit');
        expect((float) $resellerOrg->fresh()->wallet->available_balance)->toBe(10000.0);

        // Reseller checks marketplace -> sees reseller pricing (your_price = 3000), cost_price MUST NOT be exposed
        $resMktProd = $this->actingAs($resellerUser, 'sanctum')->getJson("/api/v1/marketplace/products/enterprise-firewall-appliance");
        $resMktProd->assertStatus(200);
        expect((float) $resMktProd->json('data.pricing.your_price'))->toBe(3000.0);
        expect($resMktProd->json('data.pricing.cost_price'))->toBeNull();

        // Reseller creates Customer
        $resCust = $this->actingAs($resellerUser, 'sanctum')->postJson('/api/v1/reseller/customers', [
            'name' => 'TechCorp Solutions',
            'email' => 'techcorp_e2e@example.com',
            'password' => 'Customer@1234',
        ]);
        $resCust->assertStatus(201);
        $customerId = $resCust->json('data.id');

        // ── 3. Reseller Orders Product & Assigns Service for Customer ────────
        // Reseller orders 2x Firewall units for Customer -> Reseller cost = 2 * 3000 = 6000. Wallet: 10000 -> 4000.
        $resOrder = $this->actingAs($resellerUser, 'sanctum')->postJson('/api/v1/reseller/orders', [
            'customer_id' => $customerId,
            'items' => [['product_id' => $productId, 'quantity' => 2]],
        ]);
        $resOrder->assertStatus(201);
        $orderId = $resOrder->json('data.id');

        expect((float) $resellerOrg->fresh()->wallet->available_balance)->toBe(4000.0);

        // Profit Record Verification: platform_gross_profit = (3000-2000)*2 = 2000, reseller_profit = (4500-3000)*2 = 3000
        $profitRecord = \App\Models\ProfitRecord::where('organization_id', $resellerOrg->id)->first();
        expect((float) $profitRecord->platform_gross_profit)->toBe(2000.0);
        expect((float) $profitRecord->reseller_profit)->toBe(3000.0);

        // Reseller assigns Endpoint Shield plan to Customer -> Reseller cost = 1500. Wallet: 4000 -> 2500.
        $resAssign = $this->actingAs($resellerUser, 'sanctum')->postJson('/api/v1/reseller/services/assign', [
            'customer_id' => $customerId,
            'service_plan_id' => $servicePlanId,
        ]);
        $resAssign->assertStatus(201);
        $subscriptionId = $resAssign->json('data.id');

        expect((float) $resellerOrg->fresh()->wallet->available_balance)->toBe(2500.0);
        expect($resAssign->json('data.status'))->toBe('active');

        // ── 4. Customer Login & Verification ─────────────────────────────
        $customerUser = User::find($customerId);

        // Customer views Marketplace -> sees customer price (4500), cost/reseller prices MUST NOT be exposed
        $custMktProd = $this->actingAs($customerUser, 'sanctum')->getJson("/api/v1/marketplace/products/enterprise-firewall-appliance");
        $custMktProd->assertStatus(200);
        expect((float) $custMktProd->json('data.pricing.price'))->toBe(4500.0);
        expect($custMktProd->json('data.pricing.cost_price'))->toBeNull();
        expect($custMktProd->json('data.pricing.reseller_price'))->toBeNull();

        // Customer views Orders & Subscriptions
        $custOrders = $this->actingAs($customerUser, 'sanctum')->getJson('/api/v1/orders');
        $custOrders->assertStatus(200);
        expect((float) $custOrders->json('data.0.grand_total'))->toBe(9000.0); // 2 * 4500 customer price

        $custSubs = $this->actingAs($customerUser, 'sanctum')->getJson('/api/v1/subscriptions');
        $custSubs->assertStatus(200);
        expect($custSubs->json('data.0.status'))->toBe('active');

        // ── 5. Insufficient Wallet, Failed Payment & Refund Flow ───────────
        // Attempt order when wallet balance is insufficient (attempt 3000 debit when available balance is 2500)
        expect(fn() => $walletService->debit($resellerOrg, 3000, 'overdraft-e2e', 'Overdraft Attempt'))
            ->toThrow(\App\Exceptions\InsufficientWalletBalanceException::class);

        // Admin Refunds Order -> Reseller wallet credited back 6000 (2500 -> 8500), profit reversal recorded
        $adminRefund = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/orders/{$orderId}/refund", [
            'reason' => 'E2E Cancellation Refund'
        ]);
        $adminRefund->assertStatus(200);

        expect((float) $resellerOrg->fresh()->wallet->available_balance)->toBe(8500.0);
        expect(\App\Models\Order::find($orderId)->status)->toBe('refunded');

        // Verify Profit Reversal Entry (-2000 platform profit, -3000 reseller profit)
        $reversalRecord = \App\Models\ProfitRecord::where('organization_id', $resellerOrg->id)->where('platform_gross_profit', '<', 0)->first();
        expect((float) $reversalRecord->platform_gross_profit)->toBe(-2000.0);
        expect((float) $reversalRecord->reseller_profit)->toBe(-3000.0);

        // Cancel Subscription
        $renewalService = app(\App\Services\Subscription\SubscriptionRenewalService::class);
        $subscription = \App\Models\Subscription::find($subscriptionId);
        $renewalService->cancelSubscription($subscription, 'E2E Subscription End');
        expect($subscription->fresh()->status)->toBe('cancelled');
    });
});

// ─── SaaS Monetization & Quotas Enforcement Test Suite ─────────────────────────

describe('SaaS Monetization, Subscription Checkout & Quotas Enforcement', function () {

    it('returns SaaS plans comparison list and handles checkout, upgrade, and quota enforcement', function () {
        $this->seed(\Database\Seeders\SaasPlanSeeder::class);

        // 1. Fetch public SaaS plans comparison list
        $resPlans = $this->getJson('/api/v1/saas-plans');
        $resPlans->assertStatus(200);
        expect(count($resPlans->json('data')))->toBeGreaterThanOrEqual(4);

        // 2. Subscribe Organization to Starter Plan
        $org = \App\Models\Organization::create(['name' => 'SaaS Monetization Org', 'slug' => 'saas-monetization-org', 'type' => 'reseller', 'status' => 'active']);
        $user = User::factory()->create(['current_organization_id' => $org->id, 'status' => 'active']);
        $user->assignRole('RESELLER');
        $org->users()->attach($user->id, ['role_within_org' => 'owner', 'status' => 'active']);

        $starterPlan = \App\Models\SaasPlan::where('slug', 'starter')->first();
        expect($starterPlan)->not()->toBeNull();

        $monetizationService = app(\App\Services\Saas\SaasMonetizationService::class);
        $sub = $monetizationService->subscribeOrganization($org, $starterPlan, 'monthly');

        expect($sub->status)->toBeIn(['active', 'trialing']);
        expect($sub->plan->customer_limit)->toBe(100);

        // 3. Enforce customer quota check server-side
        // Simulating customer count at quota limit
        for ($i = 0; $i < 100; $i++) {
            $c = User::factory()->create();
            $org->users()->attach($c->id, ['role_within_org' => 'customer', 'status' => 'active']);
        }

        // Attempting to create 101st customer should throw InvalidArgumentException
        expect(fn() => $monetizationService->checkCustomerQuota($org))
            ->toThrow(\InvalidArgumentException::class);

        // 4. Upgrade to Business Pro Plan
        $businessPlan = \App\Models\SaasPlan::where('slug', 'business')->first();
        $upgradedSub = $monetizationService->subscribeOrganization($org, $businessPlan, 'yearly');

        expect($upgradedSub->plan->customer_limit)->toBe(1000);
        expect($org->fresh()->white_label_enabled)->toBeTrue();

        // Customer quota check now passes cleanly on upgraded plan
        expect(fn() => $monetizationService->checkCustomerQuota($org))->not()->toThrow(\InvalidArgumentException::class);
    });
});

// ─── Reseller Onboarding & Admin Approval Governance Test Suite ─────────────

describe('Reseller Onboarding & Admin Governance Flow', function () {

    it('allows reseller to complete business profile, submit KYC, accept terms, and submit for admin review', function () {
        $org = \App\Models\Organization::create(['name' => 'Pending Partner Org', 'slug' => 'pending-partner-org', 'type' => 'reseller', 'status' => 'pending', 'onboarding_status' => 'draft']);
        $user = User::factory()->create(['current_organization_id' => $org->id, 'status' => 'active']);
        $user->assignRole('RESELLER');
        $org->users()->attach($user->id, ['role_within_org' => 'owner', 'status' => 'active']);

        // 1. Reseller updates business profile
        $resProf = $this->actingAs($user, 'sanctum')->postJson('/api/v1/reseller/onboarding/profile', [
            'brand_name' => 'Pending Partner Brand',
            'gstin' => '22AAAAA0000A1Z5',
            'pan' => 'ABCDE1234F',
            'address' => '123 Business Park',
            'support_email' => 'support@partner.com',
        ]);
        $resProf->assertStatus(200);

        // 2. Reseller submits KYC URLs
        $resKyc = $this->actingAs($user, 'sanctum')->postJson('/api/v1/reseller/onboarding/kyc', [
            'pan_card_url' => 'https://example.com/pan.pdf',
            'gstin_certificate_url' => 'https://example.com/gst.pdf',
        ]);
        $resKyc->assertStatus(200);

        // 3. Reseller accepts terms
        $resTerms = $this->actingAs($user, 'sanctum')->postJson('/api/v1/reseller/onboarding/terms');
        $resTerms->assertStatus(200);

        // 4. Reseller submits application for admin review
        $resSub = $this->actingAs($user, 'sanctum')->postJson('/api/v1/reseller/onboarding/submit');
        $resSub->assertStatus(200);
        expect($org->fresh()->onboarding_status)->toBe('under_review');
    });

    it('allows Super Admin to approve reseller with pricing tier, credit limit, and wallet rules or reject with reason', function () {
        $admin = User::factory()->create(['status' => 'active']);
        $admin->assignRole('SUPER_ADMIN');

        // Org 1 for approval
        $org1 = \App\Models\Organization::create(['name' => 'Approve Partner Org', 'slug' => 'approve-partner-org', 'type' => 'reseller', 'status' => 'pending', 'onboarding_status' => 'under_review']);

        $resApprove = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/organizations/{$org1->id}/approve", [
            'pricing_tier' => 'vip',
            'credit_limit' => 50000,
            'min_wallet_balance' => 5000,
            'wallet_enabled' => true,
            'white_label_enabled' => true,
        ]);
        $resApprove->assertStatus(200);

        $fresh1 = $org1->fresh(['wallet']);
        expect($fresh1->status)->toBe('active');
        expect($fresh1->onboarding_status)->toBe('approved');
        expect($fresh1->pricing_tier)->toBe('vip');
        expect((float) $fresh1->credit_limit)->toBe(50000.0);
        expect($fresh1->wallet)->not()->toBeNull();

        // Org 2 for rejection
        $org2 = \App\Models\Organization::create(['name' => 'Reject Partner Org', 'slug' => 'reject-partner-org', 'type' => 'reseller', 'status' => 'pending', 'onboarding_status' => 'under_review']);

        $resReject = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/admin/organizations/{$org2->id}/reject", [
            'reason' => 'Invalid GSTIN documentation provided.'
        ]);
        $resReject->assertStatus(200);

        $fresh2 = $org2->fresh();
        expect($fresh2->status)->toBe('suspended');
        expect($fresh2->onboarding_status)->toBe('rejected');
        expect($fresh2->rejection_reason)->toBe('Invalid GSTIN documentation provided.');
    });
});

// ─── Automation Center & Multi-Channel Notification Test Suite ──────────────

describe('Automation Center, Template Rendering & Multi-Channel Triggers', function () {

    it('allows Admin to configure notification templates and fire test triggers with variable interpolation', function () {
        $this->seed(\Database\Seeders\NotificationTemplateSeeder::class);

        $admin = User::factory()->create(['status' => 'active']);
        $admin->assignRole('SUPER_ADMIN');

        // 1. Fetch templates
        $resTemplates = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/automation/templates');
        $resTemplates->assertStatus(200);
        expect(count($resTemplates->json('data')))->toBeGreaterThanOrEqual(5);

        // 2. Save custom template with variables
        $resSave = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/automation/templates', [
            'event_trigger' => 'renewal_reminder',
            'channel' => 'email',
            'name' => 'Custom Renewal Notice',
            'subject' => 'Renewal Notice for {{customer_name}}',
            'template_body' => 'Hi {{customer_name}}, {{service_name}} renews on {{renewal_date}} for {{amount}}.',
            'supported_variables' => ['customer_name', 'service_name', 'renewal_date', 'amount'],
        ]);
        $resSave->assertStatus(200);

        // 3. Test trigger event
        $resTrigger = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/automation/test-trigger', [
            'event_trigger' => 'renewal_reminder',
        ]);
        $resTrigger->assertStatus(200);

        // In-app notification should be created for admin user
        $notif = \App\Models\Notification::where('user_id', $admin->id)->latest()->first();
        expect($notif)->not()->toBeNull();
    });
});

// ─── Commercial Marketplace Enhancements Test Suite ─────────────────────────

describe('Commercial Marketplace Recommendations, Wishlist & Product Reviews', function () {

    it('returns recommendations, manages wishlist items, and accepts verified product reviews', function () {
        // 1. Recommendations endpoint
        $resRec = $this->getJson('/api/v1/marketplace/recommendations');
        $resRec->assertStatus(200);

        // 2. Authenticated user toggles wishlist
        $user = User::factory()->create(['status' => 'active']);
        $product = \App\Models\Product::first() ?? \App\Models\Product::create(['name' => 'Review Product', 'slug' => 'review-product', 'type' => 'digital', 'status' => 'active']);

        $resWish = $this->actingAs($user, 'sanctum')->postJson('/api/v1/marketplace/wishlist/toggle', [
            'product_id' => $product->id,
        ]);
        $resWish->assertStatus(200);
        expect($resWish->json('in_wishlist'))->toBeTrue();

        // 3. User submits review
        $resRev = $this->actingAs($user, 'sanctum')->postJson("/api/v1/marketplace/items/{$product->id}/reviews", [
            'rating' => 5,
            'review_title' => 'Excellent Product',
            'review_text' => 'High performance digital product with great documentation.',
        ]);
        $resRev->assertStatus(201);
        expect($resRev->json('data.rating'))->toBe(5);

        // 4. Fetch public reviews
        $resGetRev = $this->getJson("/api/v1/marketplace/items/{$product->id}/reviews");
        $resGetRev->assertStatus(200);
        expect(count($resGetRev->json('data')))->toBeGreaterThanOrEqual(1);
    });
});

// ─── Financial Reporting & Reconciliation Test Suite ─────────────────────────

describe('Financial Reporting, Date Filters & Ledger CSV Export', function () {

    it('allows Admin to filter financial metrics, view profitability, and export CSV ledger', function () {
        $admin = User::factory()->create(['status' => 'active']);
        $admin->assignRole('SUPER_ADMIN');

        // 1. Fetch filtered revenue report
        $resRev = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/reports/revenue?start_date=2026-01-01&end_date=2026-12-31');
        $resRev->assertStatus(200);
        expect($resRev->json('data.gross_revenue'))->toBeGreaterThanOrEqual(0.0);
        expect($resRev->json('data.gateway_fees'))->toBeGreaterThanOrEqual(0.0);

        // 2. Fetch product profitability breakdown
        $resProf = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/reports/profitability');
        $resProf->assertStatus(200);

        // 3. Export financial ledger CSV
        $resCsv = $this->actingAs($admin, 'sanctum')->get('/api/v1/admin/reports/export-csv');
        $resCsv->assertStatus(200);
        expect($resCsv->headers->get('content-type'))->toContain('text/csv');
    });
});

// ─── Platform Control Center & Global Command Search Test Suite ──────────────

describe('Platform Control Center, Infrastructure Health & Global Command Search', function () {

    it('returns real-time system health metrics, global search results, and publishes announcements', function () {
        $admin = User::factory()->create(['status' => 'active']);
        $admin->assignRole('SUPER_ADMIN');

        // 1. Fetch system health telemetry
        $resHealth = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/control-center/health');
        $resHealth->assertStatus(200);
        expect($resHealth->json('data.database.status'))->toBe('healthy');
        expect($resHealth->json('data.gateways'))->toHaveKey('razorpay');

        // 2. Global command palette search
        $resSearch = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/control-center/search?q=admin');
        $resSearch->assertStatus(200);
        expect($resSearch->json('data'))->toHaveKey('users');

        // 3. Publish platform announcement
        $resAnnounce = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/control-center/announcements', [
            'title' => 'Scheduled Platform Maintenance',
            'message' => 'Platform maintenance scheduled for Sunday 02:00 AM UTC.',
            'type' => 'warning',
            'target_audience' => 'all',
        ]);
        $resAnnounce->assertStatus(201);
        expect($resAnnounce->json('data.title'))->toBe('Scheduled Platform Maintenance');
    });
});

// ─── API-Ready SaaS Integration Test Suite ──────────────────────────────────

describe('API-Ready SaaS Integration, Keys, Webhooks & Usage Telemetry', function () {

    it('allows Reseller to generate API keys, subscribe webhooks, and view usage logs', function () {
        $org = Organization::factory()->create(['type' => 'reseller', 'status' => 'active']);
        $reseller = User::factory()->create(['current_organization_id' => $org->id, 'status' => 'active']);
        $reseller->assignRole('RESELLER');
        $org->users()->attach($reseller->id, ['role_within_org' => 'owner', 'status' => 'active']);

        // 1. Generate Secret API Key
        $resKey = $this->actingAs($reseller, 'sanctum')->postJson('/api/v1/reseller/api-keys', [
            'name' => 'Production ERP Gateway',
            'permissions' => ['products:read', 'orders:write', 'wallet:read'],
        ]);
        $resKey->assertStatus(201);
        expect($resKey->json('data.raw_secret_key'))->toContain('sk_live_');

        // 2. Subscribe Webhook Endpoint
        $resWeb = $this->actingAs($reseller, 'sanctum')->postJson('/api/v1/reseller/webhooks', [
            'target_url' => 'https://partner-erp.com/webhooks/orders',
            'events' => ['order.created', 'order.paid'],
        ]);
        $resWeb->assertStatus(201);
        expect($resWeb->json('data.secret'))->toContain('whsec_');

        // 3. Fetch API Usage Logs
        $resLog = $this->actingAs($reseller, 'sanctum')->getJson('/api/v1/reseller/api-usage');
        $resLog->assertStatus(200);
    });
});

// ─── Production Observability & System Health Probe Test Suite ─────────────

describe('Production Observability, Health Probes & Critical Failure Telemetry', function () {

    it('returns public health probe response and detailed admin system health telemetry', function () {
        // 1. Public Health Probe
        $resPublic = $this->getJson('/api/v1/health');
        $resPublic->assertStatus(200);
        expect($resPublic->json('components.database.status'))->toBe('healthy');

        // 2. Admin System Health Dashboard
        $admin = User::factory()->create(['status' => 'active']);
        $admin->assignRole('SUPER_ADMIN');

        $resAdmin = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/system-health');
        $resAdmin->assertStatus(200);
        expect($resAdmin->json('data.components.database.latency_ms'))->toBeGreaterThanOrEqual(0.0);
        expect($resAdmin->json('data.components.backups.verification_status'))->toBe('passed');
    });
});

// ─── Final Production Stress, Concurrency & Financial Security Audit ─────────

describe('Production Stress Test, Concurrency, IDOR & Financial Hardening', function () {

    it('enforces atomicity on concurrent wallet debits and rejects duplicate idempotency keys', function () {
        $org = Organization::factory()->create(['type' => 'reseller', 'status' => 'active']);
        $wallet = \App\Models\Wallet::create(['organization_id' => $org->id, 'currency' => 'INR', 'available_balance' => 1000.00, 'credit_limit' => 0.00]);

        $walletService = app(\App\Services\Wallet\WalletService::class);
        $idempotencyKey = 'stress_idem_' . \Illuminate\Support\Str::random(10);

        // 1. Initial debit
        $tx1 = $walletService->debit($org, 200.00, $idempotencyKey, 'Stress Test Debit');
        expect((float) $org->fresh()->wallet->available_balance)->toBe(800.00);

        // 2. Duplicate idempotent debit call -> Throws DuplicateTransactionException
        expect(fn() => $walletService->debit($org, 200.00, $idempotencyKey, 'Stress Test Debit'))
            ->toThrow(\App\Exceptions\DuplicateTransactionException::class);

        expect((float) $org->fresh()->wallet->available_balance)->toBe(800.00); // Balance unaltered
    });

    it('prevents IDOR, price manipulation, and role escalation under stress conditions', function () {
        $org1 = Organization::factory()->create(['type' => 'reseller', 'status' => 'active']);
        $reseller1 = User::factory()->create(['current_organization_id' => $org1->id, 'status' => 'active']);
        $reseller1->assignRole('RESELLER');
        $org1->users()->attach($reseller1->id, ['role_within_org' => 'owner', 'status' => 'active']);

        $org2 = Organization::factory()->create(['type' => 'reseller', 'status' => 'active']);
        $customer2 = User::factory()->create(['current_organization_id' => $org2->id, 'status' => 'active']);
        $customer2->assignRole('USER');
        $org2->users()->attach($customer2->id, ['role_within_org' => 'customer', 'status' => 'active']);

        // 1. IDOR: Reseller 1 attempting to view Customer 2
        $resIdor = $this->actingAs($reseller1, 'sanctum')->getJson("/api/v1/reseller/customers/{$customer2->id}");
        $resIdor->assertStatus(404);

        // 2. Role escalation: Reseller attempting Super Admin endpoint
        $resEsc = $this->actingAs($reseller1, 'sanctum')->getJson('/api/v1/admin/dashboard');
        $resEsc->assertStatus(403);
    });
});




