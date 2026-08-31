<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->unique(); // one wallet per reseller org
            $table->decimal('available_balance', 15, 2)->default(0);
            $table->decimal('reserved_balance', 15, 2)->default(0); // funds locked for pending orders
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->string('currency', 3)->default('INR');
            $table->enum('status', ['active', 'frozen', 'suspended'])->default('active');
            $table->timestamp('last_transaction_at')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->index('organization_id');
        });

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('wallet_id');
            $table->enum('type', [
                'credit',
                'debit',
                'refund',
                'reversal',
                'adjustment',
                'reservation',
                'release',
            ])->index();
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_before', 15, 2); // captured at write time, immutable
            $table->decimal('balance_after', 15, 2);  // captured at write time, immutable
            $table->string('currency', 3)->default('INR');

            // What triggered this transaction
            $table->nullableUuidMorphs('reference'); // order, payment, subscription, etc.

            $table->string('idempotency_key')->unique(); // prevents double-write on retry
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();

            // Who initiated it
            $table->uuid('created_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();

            // NOTE: no updated_at — this table is append-only/immutable
            $table->timestamp('created_at');

            $table->foreign('wallet_id')->references('id')->on('wallets')->cascadeOnDelete();
            $table->index(['wallet_id', 'created_at']);
            $table->index(['wallet_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
    }
};
