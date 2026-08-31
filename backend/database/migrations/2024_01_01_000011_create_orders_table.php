<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('order_number')->unique()->index();
            $table->uuid('organization_id')->index();
            $table->uuid('customer_id')->index();
            $table->uuid('placed_by')->nullable(); // reseller placing on behalf of customer

            $table->enum('status', [
                'pending',
                'payment_processing',
                'paid',
                'processing',
                'completed',
                'failed',
                'cancelled',
                'refunded',
            ])->default('pending')->index();

            $table->enum('payment_status', [
                'unpaid',
                'pending',
                'paid',
                'partially_paid',
                'refunded',
                'failed',
            ])->default('unpaid')->index();

            $table->enum('fulfillment_status', [
                'unfulfilled',
                'partial',
                'fulfilled',
            ])->default('unfulfilled');

            $table->string('currency', 3)->default('INR');
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_total', 15, 2)->default(0);
            $table->decimal('tax_total', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);

            // Applied coupon
            $table->uuid('coupon_id')->nullable();
            $table->string('coupon_code')->nullable();
            $table->decimal('coupon_discount', 15, 2)->default(0);

            // Payment method
            $table->enum('payment_method', ['wallet', 'gateway', 'manual', 'mixed'])->nullable();
            $table->uuid('gateway_payment_id')->nullable(); // link to payments table

            // Billing address snapshot
            $table->json('billing_address')->nullable();

            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('placed_at')->useCurrent();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations');
            $table->foreign('customer_id')->references('id')->on('users');
            $table->foreign('coupon_id')->references('id')->on('coupons')->nullOnDelete();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('order_id');
            $table->uuidMorphs('orderable'); // product or service_plan
            $table->string('name'); // snapshot of name at time of purchase
            $table->string('sku')->nullable();
            $table->integer('quantity')->default(1);
            $table->string('currency', 3)->default('INR');

            // PRICE SNAPSHOTS — never recomputed from live catalog
            $table->decimal('cost_price_at_purchase', 15, 2);
            $table->decimal('reseller_price_at_purchase', 15, 2);
            $table->decimal('customer_price_at_purchase', 15, 2);
            $table->decimal('unit_price', 15, 2); // the price actually charged (depends on buyer role)
            $table->decimal('discount_at_purchase', 15, 2)->default(0);
            $table->decimal('tax_rate_at_purchase', 8, 4)->default(0);
            $table->decimal('tax_at_purchase', 15, 2)->default(0);
            $table->decimal('final_price_at_purchase', 15, 2); // unit_price - discount + tax, * qty

            $table->json('options')->nullable(); // selected options/variants
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->index('order_id');
        });

        Schema::create('profit_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->uuid('order_item_id')->nullable();
            $table->uuid('subscription_invoice_item_id')->nullable();
            $table->uuid('customer_id');
            $table->string('currency', 3)->default('INR');

            // Financial breakdown — all values in absolute currency units
            $table->decimal('platform_revenue', 15, 2);    // what platform earned (reseller price)
            $table->decimal('platform_cost', 15, 2);       // cost_price
            $table->decimal('platform_gross_profit', 15, 2); // platform_revenue - platform_cost
            $table->decimal('reseller_revenue', 15, 2);    // customer_price
            $table->decimal('reseller_profit', 15, 2);     // reseller_revenue - platform_revenue
            $table->decimal('total_revenue', 15, 2);       // customer paid
            $table->decimal('margin_pct', 8, 4);           // platform_gross_profit / platform_revenue

            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations');
            $table->foreign('customer_id')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profit_records');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
