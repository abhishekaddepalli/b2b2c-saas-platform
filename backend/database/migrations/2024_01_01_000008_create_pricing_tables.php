<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Base pricing for products and service_plans (polymorphic)
        Schema::create('prices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('priceable'); // product or service_plan
            $table->enum('pricing_type', ['fixed', 'percentage', 'tier', 'custom'])->default('fixed');
            $table->string('currency', 3)->default('INR');

            // Fixed pricing
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->decimal('reseller_price', 15, 2)->nullable();
            $table->decimal('customer_price', 15, 2)->nullable();

            // Percentage markup (used when pricing_type = percentage)
            $table->decimal('reseller_markup_pct', 8, 4)->nullable(); // e.g. 0.30 = 30%
            $table->decimal('customer_markup_pct', 8, 4)->nullable();

            // Tax
            $table->decimal('tax_rate', 8, 4)->default(0); // e.g. 0.18 = 18% GST
            $table->string('tax_label')->default('GST');
            $table->boolean('tax_inclusive')->default(false);

            $table->timestamp('effective_from')->nullable();
            $table->timestamp('effective_to')->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['priceable_type', 'priceable_id', 'is_active']);
            $table->index('currency');
        });

        // Tier pricing bands
        Schema::create('tier_prices', function (Blueprint $table) {
            $table->id();
            $table->uuid('price_id');
            $table->integer('min_qty');
            $table->integer('max_qty')->nullable(); // null = unbounded
            $table->decimal('cost_price', 15, 2);
            $table->decimal('reseller_price', 15, 2);
            $table->decimal('customer_price', 15, 2);
            $table->timestamps();

            $table->foreign('price_id')->references('id')->on('prices')->cascadeOnDelete();
            $table->index('price_id');
        });

        // Custom price overrides — reseller-specific, customer-specific, campaign-specific
        Schema::create('custom_prices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('priceable'); // product or service_plan
            $table->enum('scope_type', ['reseller', 'customer', 'category', 'campaign'])->index();
            $table->uuid('scope_id')->index(); // reseller org id, customer user id, category id, campaign id
            $table->string('scope_label')->nullable(); // human readable
            $table->decimal('override_price', 15, 2)->nullable();
            $table->decimal('override_markup_pct', 8, 4)->nullable();
            $table->string('currency', 3)->default('INR');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('created_by')->references('id')->on('users');
            $table->index(['priceable_type', 'priceable_id', 'scope_type', 'scope_id'], 'idx_custom_prices_scope');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_prices');
        Schema::dropIfExists('tier_prices');
        Schema::dropIfExists('prices');
    }
};
