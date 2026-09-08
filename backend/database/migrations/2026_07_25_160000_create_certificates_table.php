<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->string('certificate_code')->unique();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('learning_module_id')->constrained('learning_modules')->onDelete('cascade');
            $table->string('employee_name');
            $table->string('course_title');
            $table->integer('score');
            $table->timestamp('issued_at');
            $table->timestamp('expiry_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
