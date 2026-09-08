<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learning_quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('learning_module_id')->constrained('learning_modules')->onDelete('cascade');
            $table->text('question');
            $table->json('options'); // array of option strings e.g. ["A", "B", "C", "D"]
            $table->integer('correct_option'); // 0-indexed integer
            $table->text('explanation')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_quiz_questions');
    }
};
