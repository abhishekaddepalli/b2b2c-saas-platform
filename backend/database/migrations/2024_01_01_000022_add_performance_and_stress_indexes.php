<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['organization_id', 'payment_status', 'created_at'], 'idx_orders_org_pay_date');
            $table->index(['customer_id', 'status'], 'idx_orders_customer_status');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->index(['organization_id', 'status', 'next_billing_at'], 'idx_subs_org_status_renewal');
        });

        Schema::table('profit_records', function (Blueprint $table) {
            $table->index(['organization_id', 'recorded_at'], 'idx_profit_org_date');
            $table->index(['customer_id', 'recorded_at'], 'idx_profit_cust_date');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->index(['organization_id', 'status', 'created_at'], 'idx_invoices_org_status_date');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['status', 'visibility', 'featured'], 'idx_products_status_vis_feat');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('idx_products_status_vis_feat');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('idx_invoices_org_status_date');
        });

        Schema::table('profit_records', function (Blueprint $table) {
            $table->dropIndex('idx_profit_cust_date');
            $table->dropIndex('idx_profit_org_date');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex('idx_subs_org_status_renewal');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_customer_status');
            $table->dropIndex('idx_orders_org_pay_date');
        });
    }
};
