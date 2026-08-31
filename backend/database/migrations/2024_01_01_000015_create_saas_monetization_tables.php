<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saas_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('short_description')->nullable();
            $table->decimal('monthly_price', 15, 2)->default(0);
            $table->decimal('yearly_price', 15, 2)->default(0);
            $table->string('currency', 3)->default('INR');

            // Quotas & Configurable Limits (-1 = Unlimited)
            $table->integer('reseller_limit')->default(1);
            $table->integer('customer_limit')->default(25);
            $table->integer('products_limit')->default(50);
            $table->integer('services_limit')->default(20);
            $table->decimal('wallet_limit', 15, 2)->default(50000);
            $table->integer('trial_days')->default(14);
            $table->integer('storage_mb')->default(1024);
            $table->integer('api_rate_limit')->default(60);
            $table->boolean('white_label_available')->default(false);

            $table->json('features')->nullable();
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('organization_saas_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('saas_plan_id')->constrained('saas_plans')->cascadeOnDelete();
            $table->enum('billing_interval', ['monthly', 'yearly'])->default('monthly');
            $table->enum('status', ['trialing', 'active', 'grace_period', 'suspended', 'cancelled'])->default('active');

            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamp('next_billing_at')->nullable();
            $table->timestamp('grace_period_ends_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();

            $table->decimal('price_paid', 15, 2)->default(0);
            $table->string('currency', 3)->default('INR');
            $table->timestamps();

            $table->index('organization_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_saas_subscriptions');
        Schema::dropIfExists('saas_plans');
    }
};
