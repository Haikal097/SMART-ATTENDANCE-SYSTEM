<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'face_image_path')) {
                $table->string('face_image_path')->nullable();
            }
            if (!Schema::hasColumn('users', 'face_image_url')) {
                $table->string('face_image_url')->nullable();
            }
            if (!Schema::hasColumn('users', 'face_status')) {
                $table->enum('face_status', ['none', 'pending', 'approved', 'rejected'])->default('none');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Reverse: drop the columns if they exist
            $columns = ['face_image_path', 'face_image_url', 'face_status'];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};