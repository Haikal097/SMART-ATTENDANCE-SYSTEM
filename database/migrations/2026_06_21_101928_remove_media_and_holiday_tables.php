<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('media');
        Schema::dropIfExists('public_holidays');

        Schema::table('class_sessions', function (Blueprint $table) {
            $table->dropColumn(['is_holiday', 'holiday_note', 'holiday_action']);
        });
    }

    public function down(): void
    {
        Schema::create('public_holidays', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });

        Schema::table('class_sessions', function (Blueprint $table) {
            $table->boolean('is_holiday')->default(false)->after('notes');
            $table->string('holiday_note')->nullable()->after('is_holiday');
            $table->string('holiday_action')->nullable()->after('holiday_note');
        });
    }
};
