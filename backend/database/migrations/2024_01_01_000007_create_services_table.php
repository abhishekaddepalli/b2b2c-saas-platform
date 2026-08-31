<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique();
            $table->uuid('category_id')->nullable();
            $table->uuid('subcategory_id')->nullable();
            $table->string('name');
            $table->string('short_description')->nullable();
            $table->longText('full_description')->nullable();
            $table->string('icon')->nullable();
            $table->enum('status', ['draft', 'active', 'archived'])->default('draft');
            $table->enum('visibility', ['public', 'reseller_only', 'hidden'])->default('public');
            $table->boolean('featured')->default(false)->index();

            // Billing config
            $table->enum('billing_type', ['one_time', 'recurring'])->default('recurring');
            $table->enum('billing_interval', ['monthly', 'quarterly', 'half_yearly', 'yearly', 'custom'])->default('monthly');
            $table->integer('billing_interval_count')->default(1);
            $table->integer('trial_days')->default(0);
            $table->integer('grace_period_days')->default(3);
            $table->boolean('auto_renewal_default')->default(true);
            $table->json('suspension_rules')->nullable();

            $table->json('tags')->nullable();
            $table->json('metadata')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
            $table->foreign('subcategory_id')->references('id')->on('subcategories')->nullOnDelete();
            $table->index(['status', 'visibility']);
        });

        Schema::create('service_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('service_id');
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->json('features')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->boolean('is_popular')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('service_id')->references('id')->on('services')->cascadeOnDelete();
            $table->unique(['service_id', 'slug']);
            $table->index('service_id');
        });

        Schema::create('service_features', function (Blueprint $table) {
            $table->id();
            $table->uuid('service_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('service_id')->references('id')->on('services')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_features');
        Schema::dropIfExists('service_plans');
        Schema::dropIfExists('services');
    }
};
