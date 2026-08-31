<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->index();
            $table->uuid('payer_id')->index(); // the user paying
            $table->uuidMorphs('payable'); // order or subscription
            $table->enum('gateway', ['razorpay', 'phonepe', 'cashfree', 'stripe', 'manual', 'wallet'])->index();
            $table->string('gateway_payment_id')->nullable()->unique(); // gateway's own ID
            $table->string('gateway_order_id')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('INR');
            $table->enum('status', [
                'initiated',
                'pending',
                'succeeded',
                'failed',
                'refunded',
                'partially_refunded',
                'cancelled',
            ])->default('initiated')->index();
            $table->decimal('amount_refunded', 15, 2)->default(0);
            $table->string('failure_reason')->nullable();
            $table->json('gateway_response')->nullable();
            $table->string('idempotency_key')->unique();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations');
            $table->foreign('payer_id')->references('id')->on('users');
        });

        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('payment_id');
            $table->string('action')->index(); // initiate, verify, capture, refund, etc.
            $table->enum('status', ['success', 'failed', 'pending']);
            $table->json('request_payload')->nullable();
            $table->json('response_payload')->nullable();
            $table->string('gateway_transaction_id')->nullable();
            $table->text('error_message')->nullable();
            $table->decimal('amount', 15, 2)->nullable();
            $table->timestamp('created_at');

            $table->foreign('payment_id')->references('id')->on('payments')->cascadeOnDelete();
            $table->index('payment_id');
        });

        Schema::create('webhook_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('gateway', ['razorpay', 'phonepe', 'cashfree', 'stripe'])->index();
            $table->string('event_id')->unique(); // gateway-provided ID — THE idempotency anchor
            $table->string('event_type')->index();
            $table->json('payload');
            $table->boolean('signature_verified')->default(false);
            $table->enum('processing_status', ['pending', 'processed', 'failed', 'skipped'])->default('pending')->index();
            $table->text('processing_error')->nullable();
            $table->integer('processing_attempts')->default(0);
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('received_at')->useCurrent();
            $table->timestamp('created_at');

            $table->index(['gateway', 'event_type']);
            $table->index('received_at');
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('invoice_number')->unique()->index();
            $table->uuid('organization_id')->index();
            $table->uuid('customer_id')->index();
            $table->uuid('order_id')->nullable();
            $table->uuid('subscription_id')->nullable();
            $table->enum('type', ['order', 'subscription', 'credit_note', 'proforma'])->default('order');
            $table->enum('status', ['draft', 'issued', 'paid', 'overdue', 'cancelled', 'refunded'])->default('draft');
            $table->string('currency', 3)->default('INR');
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_total', 15, 2)->default(0);
            $table->decimal('tax_total', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->decimal('amount_paid', 15, 2)->default(0);
            $table->decimal('amount_due', 15, 2)->default(0);
            $table->json('billing_details')->nullable(); // snapshot of customer billing info
            $table->json('seller_details')->nullable();  // snapshot of org/platform billing info
            $table->string('pdf_path')->nullable();
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations');
            $table->foreign('customer_id')->references('id')->on('users');
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('invoice_id');
            $table->string('description');
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('tax_rate', 8, 4)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total', 15, 2);
            $table->timestamps();

            $table->foreign('invoice_id')->references('id')->on('invoices')->cascadeOnDelete();
            $table->index('invoice_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('webhook_events');
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('payments');
    }
};
