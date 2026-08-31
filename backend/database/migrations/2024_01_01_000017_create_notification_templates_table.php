<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_templates', function (Blueprint $table) {
            if (!Schema::hasColumn('notification_templates', 'event_trigger')) {
                $table->string('event_trigger')->nullable()->after('id');
            }
            if (!Schema::hasColumn('notification_templates', 'name')) {
                $table->string('name')->nullable()->after('channel');
            }
            if (!Schema::hasColumn('notification_templates', 'template_body')) {
                $table->text('template_body')->nullable()->after('subject');
            }
            if (!Schema::hasColumn('notification_templates', 'supported_variables')) {
                $table->json('supported_variables')->nullable()->after('template_body');
            }
            if (!Schema::hasColumn('notification_templates', 'is_enabled')) {
                $table->boolean('is_enabled')->default(true)->after('supported_variables');
            }
        });
    }

    public function down(): void
    {
        Schema::table('notification_templates', function (Blueprint $table) {
            $table->dropColumn(['event_trigger', 'name', 'template_body', 'supported_variables', 'is_enabled']);
        });
    }
};
