<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('subject_lecturer')
            ->where('role', 'co-lecturer')
            ->update(['role' => 'lecturer']);

        Schema::table('subject_lecturer', function (Blueprint $table) {
            $table->enum('role', ['lecturer'])->default('lecturer')->change();
        });
    }

    public function down(): void
    {
        Schema::table('subject_lecturer', function (Blueprint $table) {
            $table->enum('role', ['lecturer', 'co-lecturer'])->default('lecturer')->change();
        });
    }
};
