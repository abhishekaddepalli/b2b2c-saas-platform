<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('sku')->unique();
            $table->string('slug')->unique();
            $table->uuid('category_id')->nullable();
            $table->uuid('subcategory_id')->nullable();
            $table->string('name');
            $table->string('short_description')->nullable();
            $table->longText('full_description')->nullable();
            $table->enum('type', ['physical', 'digital', 'license', 'hardware', 'software', 'other'])->default('digital');
            $table->enum('status', ['draft', 'active', 'archived'])->default('draft');
            $table->enum('visibility', ['public', 'reseller_only', 'hidden'])->default('public');
            $table->boolean('featured')->default(false)->index();
            $table->integer('stock_quantity')->nullable(); // null = unlimited
            $table->boolean('track_stock')->default(false);
            $table->decimal('weight', 8, 2)->nullable();
            $table->json('tags')->nullable();
            $table->json('specifications')->nullable();
            $table->json('metadata')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
            $table->foreign('subcategory_id')->references('id')->on('subcategories')->nullOnDelete();
            $table->index(['status', 'visibility']);
            $table->index('category_id');
        });

        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->uuid('product_id');
            $table->string('path');
            $table->string('alt_text')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            $table->index('product_id');
        });

        Schema::create('product_features', function (Blueprint $table) {
            $table->id();
            $table->uuid('product_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_features');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('products');
    }
};
