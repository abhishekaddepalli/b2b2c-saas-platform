<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('ticket_number')->unique()->index();
            $table->uuid('organization_id')->index();
            $table->uuid('customer_id')->index();
            $table->uuid('assigned_to')->nullable();
            $table->string('subject');
            $table->text('description');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', ['open', 'in_progress', 'waiting', 'resolved', 'closed'])->default('open')->index();
            $table->enum('channel', ['web', 'email', 'phone', 'whatsapp'])->default('web');
            $table->uuidMorphs('related'); // optional link to order, subscription, etc.
            $table->timestamp('first_response_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->json('tags')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations');
            $table->foreign('customer_id')->references('id')->on('users');
            $table->foreign('assigned_to')->references('id')->on('users')->nullOnDelete();
        });

        Schema::create('support_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_id');
            $table->uuid('sender_id');
            $table->enum('sender_type', ['customer', 'reseller', 'admin', 'system']);
            $table->text('body');
            $table->json('attachments')->nullable();
            $table->boolean('is_internal_note')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->foreign('ticket_id')->references('id')->on('support_tickets')->cascadeOnDelete();
            $table->foreign('sender_id')->references('id')->on('users');
            $table->index('ticket_id');
        });

        Schema::create('notification_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('event_key')->index(); // e.g. 'subscription.expiring', 'payment.failed'
            $table->enum('channel', ['email', 'sms', 'whatsapp', 'in_app']);
            $table->string('subject')->nullable();
            $table->text('body_template'); // supports Blade/Twig-style variables
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['event_key', 'channel']);
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->uuidMorphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->uuid('organization_id')->nullable()->index(); // null = platform default
            $table->string('group')->index(); // e.g. 'general', 'billing', 'wallet', 'notifications'
            $table->string('key')->index();
            $table->text('value')->nullable();
            $table->enum('type', ['string', 'integer', 'boolean', 'json', 'encrypted'])->default('string');
            $table->boolean('is_public')->default(false); // safe to expose to frontend
            $table->timestamps();
            $table->unique(['organization_id', 'group', 'key']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('actor_id')->nullable()->index();
            $table->uuid('organization_id')->nullable()->index();
            $table->string('action')->index(); // e.g. 'product.created', 'wallet.debited'
            $table->string('resource_type')->nullable();
            $table->uuid('resource_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('context')->nullable(); // extra contextual metadata
            $table->timestamp('created_at');

            $table->index(['resource_type', 'resource_id']);
            $table->index('created_at');

            $table->foreign('actor_id')->references('id')->on('users')->nullOnDelete();
        });

        // Laravel Sanctum personal access tokens
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->uuidMorphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('notification_templates');
        Schema::dropIfExists('support_messages');
        Schema::dropIfExists('support_tickets');
    }
};
