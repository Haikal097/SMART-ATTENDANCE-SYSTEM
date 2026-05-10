<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('file_name');
            $table->string('mime_type');
            $table->integer('size');
            $table->string('path');
            $table->string('url');
            $table->string('collection')->default('default'); // For grouping (e.g., 'avatars', 'attachments')
            $table->nullableMorphs('model'); // Polymorphic relationship (can belong to Student, User, etc.)
            $table->json('meta')->nullable(); // Extra metadata
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};