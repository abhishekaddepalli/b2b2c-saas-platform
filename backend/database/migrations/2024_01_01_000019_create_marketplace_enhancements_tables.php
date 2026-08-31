<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('product_id')->nullable()->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('service_id')->nullable()->constrained('services')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating')->default(5);
            $table->string('review_title')->nullable();
            $table->text('review_text')->nullable();
            $table->boolean('is_verified_purchase')->default(true);
            $table->enum('status', ['approved', 'pending', 'rejected'])->default('approved');
            $table->timestamps();

            $table->index(['product_id', 'status']);
            $table->index(['service_id', 'status']);
        });

        Schema::create('wishlists', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('product_id')->nullable()->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('service_id')->nullable()->constrained('services')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'product_id', 'service_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wishlists');
        Schema::dropIfExists('product_reviews');
    }
};
