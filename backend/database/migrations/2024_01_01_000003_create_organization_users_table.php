<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organization_users', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id');
            $table->uuid('organization_id');
            $table->enum('role_within_org', ['owner', 'staff', 'customer'])->default('customer');
            $table->enum('status', ['active', 'invited', 'disabled'])->default('invited');
            $table->timestamp('joined_at')->nullable();
            $table->json('permissions_override')->nullable(); // org-specific permission overrides
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->unique(['user_id', 'organization_id']);

            $table->index('organization_id');
            $table->index('user_id');
            $table->index(['organization_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_users');
    }
};
