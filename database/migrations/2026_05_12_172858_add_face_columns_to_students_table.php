<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('face_image_path')->nullable()->after('face_encoding_path');
            $table->string('face_image_url')->nullable()->after('face_image_path');
            $table->enum('face_status', ['none', 'pending', 'approved', 'rejected'])->default('none')->after('face_image_url');
            $table->string('face_rejection_reason')->nullable()->after('face_status');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['face_image_path', 'face_image_url', 'face_status', 'face_rejection_reason']);
        });
    }
};
