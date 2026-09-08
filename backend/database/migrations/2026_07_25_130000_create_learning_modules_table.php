<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learning_modules', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('category')->default('General'); // Compliance, Security, Company Culture, Technical Skills
            $table->enum('content_type', ['video', 'document'])->default('document');
            $table->text('content_url')->nullable();
            $table->longText('document_text')->nullable();
            $table->integer('estimated_minutes')->default(15);
            $table->integer('passing_score')->default(80); // percentage requirement to pass quiz
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_modules');
    }
};
