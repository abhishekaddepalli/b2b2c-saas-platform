<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->enum('type', ['platform', 'reseller'])->default('reseller');
            $table->enum('status', ['active', 'suspended', 'pending'])->default('pending');

            // White-label branding
            $table->string('brand_name')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('favicon_path')->nullable();
            $table->string('primary_color', 7)->default('#6366f1');
            $table->string('secondary_color', 7)->default('#8b5cf6');
            $table->string('custom_domain')->nullable()->unique();
            $table->string('support_email')->nullable();
            $table->string('support_phone')->nullable();
            $table->string('invoice_logo_path')->nullable();
            $table->string('email_logo_path')->nullable();
            $table->text('footer_text')->nullable();
            $table->text('custom_css')->nullable();

            // Business info
            $table->string('gstin')->nullable();
            $table->string('pan')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country')->default('IN');
            $table->string('pincode')->nullable();

            // Credit settings
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->string('currency', 3)->default('INR');

            // Feature flags
            $table->boolean('wallet_enabled')->default(true);
            $table->boolean('white_label_enabled')->default(false);
            $table->boolean('custom_domain_enabled')->default(false);

            $table->uuid('parent_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('type');
        });

        Schema::table('organizations', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('organizations')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
