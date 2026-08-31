<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->uuid('customer_id')->index();
            $table->uuid('service_plan_id')->index();
            $table->uuid('order_id')->nullable(); // originating order

            $table->enum('status', [
                'trial',
                'active',
                'payment_failed',
                'grace_period',
                'suspended',
                'cancelled',
                'expired',
            ])->default('trial')->index();

            $table->string('currency', 3)->default('INR');
            $table->decimal('amount', 15, 2); // amount charged per cycle (snapshot)
            $table->decimal('cost_price_snapshot', 15, 2);
            $table->decimal('reseller_price_snapshot', 15, 2);
            $table->decimal('customer_price_snapshot', 15, 2);

            // Billing cycle
            $table->enum('billing_interval', ['monthly', 'quarterly', 'half_yearly', 'yearly', 'custom']);
            $table->integer('billing_interval_count')->default(1);
            $table->boolean('auto_renew')->default(true);

            // Period tracking
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_start');
            $table->timestamp('current_period_end');
            $table->timestamp('next_billing_at')->index(); // scheduler queries this

            // Grace & retry config (snapshotted from service at subscription time)
            $table->integer('grace_period_days')->default(3);
            $table->integer('max_retry_count')->default(3);
            $table->integer('retry_count')->default(0);
            $table->timestamp('next_retry_at')->nullable();

            // Lifecycle timestamps
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->text('cancellation_reason')->nullable();

            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations');
            $table->foreign('customer_id')->references('id')->on('users');
            $table->foreign('service_plan_id')->references('id')->on('service_plans');
            $table->index(['status', 'next_billing_at']);
        });

        Schema::create('subscription_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('subscription_id');
            $table->uuidMorphs('itemable');
            $table->string('name');
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('cost_price_snapshot', 15, 2);
            $table->decimal('reseller_price_snapshot', 15, 2);
            $table->decimal('customer_price_snapshot', 15, 2);
            $table->timestamps();

            $table->foreign('subscription_id')->references('id')->on('subscriptions')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_items');
        Schema::dropIfExists('subscriptions');
    }
};
