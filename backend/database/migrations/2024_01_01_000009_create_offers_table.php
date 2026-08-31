<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->enum('type', [
                'percentage_discount',
                'fixed_discount',
                'buy_x_get_y',
                'first_purchase',
                'category_discount',
                'product_discount',
                'service_discount',
            ])->index();

            // Discount value
            $table->decimal('discount_value', 15, 2)->default(0); // % or fixed amount
            $table->decimal('max_discount_amount', 15, 2)->nullable(); // cap on percentage discounts
            $table->decimal('min_order_amount', 15, 2)->default(0);

            // Buy X get Y
            $table->integer('buy_quantity')->nullable();
            $table->integer('get_quantity')->nullable();

            // Limits
            $table->integer('usage_limit')->nullable(); // null = unlimited
            $table->integer('per_user_limit')->nullable();
            $table->integer('used_count')->default(0);

            // Audience
            $table->enum('audience', ['all', 'reseller', 'customer', 'specific_org', 'specific_user'])->default('all');

            // Scheduling
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->enum('status', ['draft', 'active', 'expired', 'disabled'])->default('draft');

            $table->boolean('is_featured')->default(false);
            $table->integer('priority')->default(0);
            $table->uuid('created_by');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('created_by')->references('id')->on('users');
            $table->index(['status', 'starts_at', 'ends_at']);
        });

        // Which products/services/categories/orgs an offer applies to
        Schema::create('offer_eligibilities', function (Blueprint $table) {
            $table->id();
            $table->uuid('offer_id');
            $table->enum('eligibility_type', ['product', 'service_plan', 'category', 'organization', 'user']);
            $table->uuid('eligibility_id');
            $table->timestamps();

            $table->foreign('offer_id')->references('id')->on('offers')->cascadeOnDelete();
            $table->unique(['offer_id', 'eligibility_type', 'eligibility_id']);
            $table->index(['eligibility_type', 'eligibility_id']);
        });

        Schema::create('coupons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('offer_id')->nullable();
            $table->string('code')->unique();
            $table->string('description')->nullable();
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('value', 15, 2);
            $table->decimal('max_discount_amount', 15, 2)->nullable();
            $table->decimal('min_order_amount', 15, 2)->default(0);
            $table->integer('usage_limit')->nullable();
            $table->integer('per_user_limit')->nullable();
            $table->integer('used_count')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->enum('status', ['active', 'inactive', 'expired'])->default('active');
            $table->uuid('created_by');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('offer_id')->references('id')->on('offers')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users');
            $table->index(['status', 'starts_at', 'ends_at']);
        });

        Schema::create('coupon_usages', function (Blueprint $table) {
            $table->id();
            $table->uuid('coupon_id');
            $table->uuid('user_id');
            $table->uuid('order_id')->nullable();
            $table->decimal('discount_applied', 15, 2);
            $table->timestamps();

            $table->foreign('coupon_id')->references('id')->on('coupons')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['coupon_id', 'user_id']);
        });

        Schema::create('advertisements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('image_path')->nullable();
            $table->string('cta_text')->nullable();
            $table->string('cta_url')->nullable();
            $table->enum('placement', [
                'homepage_hero',
                'marketplace_banner',
                'category_banner',
                'sidebar',
                'promotional_card',
                'sponsored_product',
                'sponsored_service',
                'announcement',
            ])->index();
            $table->enum('audience', ['all', 'reseller', 'customer', 'specific_org'])->default('all');
            $table->uuid('target_org_id')->nullable();
            $table->integer('priority')->default(0);
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->enum('status', ['draft', 'active', 'expired', 'paused'])->default('draft');
            $table->integer('impression_count')->default(0);
            $table->integer('click_count')->default(0);
            $table->uuid('created_by');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('created_by')->references('id')->on('users');
            $table->index(['status', 'placement', 'start_at', 'end_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advertisements');
        Schema::dropIfExists('coupon_usages');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('offer_eligibilities');
        Schema::dropIfExists('offers');
    }
};
