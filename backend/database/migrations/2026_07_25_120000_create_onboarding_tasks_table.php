<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('onboarding_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category')->default('General'); // e.g. IT Setup, HR & Compliance, Team & Operations
            $table->integer('due_days')->default(1);
            $table->enum('priority', ['high', 'medium', 'low'])->default('medium');
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('onboarding_tasks');
    }
};
