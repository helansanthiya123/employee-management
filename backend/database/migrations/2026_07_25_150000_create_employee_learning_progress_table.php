<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_learning_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('learning_module_id')->constrained('learning_modules')->onDelete('cascade');
            $table->enum('status', ['not_started', 'in_progress', 'completed', 'failed'])->default('not_started');
            $table->integer('quiz_score')->default(0);
            $table->integer('attempts_count')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'learning_module_id'], 'emp_module_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_learning_progress');
    }
};
