<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->enum('onboarding_status', ['draft', 'submitted', 'under_review', 'approved', 'rejected'])->default('draft')->after('status');
            $table->text('rejection_reason')->nullable()->after('onboarding_status');
            $table->json('kyc_documents')->nullable()->after('rejection_reason');
            $table->string('pricing_tier')->default('standard')->after('kyc_documents');
            $table->decimal('min_wallet_balance', 15, 2)->default(0)->after('credit_limit');
            $table->decimal('auto_recharge_threshold', 15, 2)->default(0)->after('min_wallet_balance');
            $table->timestamp('terms_accepted_at')->nullable()->after('auto_recharge_threshold');
            $table->string('terms_accepted_ip')->nullable()->after('terms_accepted_at');
            $table->json('onboarding_checklist')->nullable()->after('terms_accepted_ip');
            $table->timestamp('approved_at')->nullable()->after('onboarding_checklist');
            $table->uuid('approved_by')->nullable()->after('approved_at');
        });
    }

    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn([
                'onboarding_status',
                'rejection_reason',
                'kyc_documents',
                'pricing_tier',
                'min_wallet_balance',
                'auto_recharge_threshold',
                'terms_accepted_at',
                'terms_accepted_ip',
                'onboarding_checklist',
                'approved_at',
                'approved_by',
            ]);
        });
    }
};
