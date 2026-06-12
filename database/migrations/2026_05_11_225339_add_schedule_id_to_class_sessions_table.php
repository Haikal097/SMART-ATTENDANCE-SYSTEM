<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('class_sessions', function (Blueprint $table) {
            $table->foreignId('schedule_id')->nullable()->constrained('schedules')->nullOnDelete();
            $table->boolean('is_holiday')->default(false);    // flagged as holiday
            $table->string('holiday_note')->nullable();       // "Hari Raya — skip or reschedule?"
            $table->enum('holiday_action', ['skip', 'reschedule', 'pending'])->default('pending');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('class_sessions', function (Blueprint $table) {
            //
        });
    }
};
