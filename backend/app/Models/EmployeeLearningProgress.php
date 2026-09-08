<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeLearningProgress extends Model
{
    use HasFactory;

    protected $table = 'employee_learning_progress';

    protected $fillable = [
        'employee_id',
        'learning_module_id',
        'status',
        'quiz_score',
        'attempts_count',
        'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
        'quiz_score' => 'integer',
        'attempts_count' => 'integer',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function module()
    {
        return $this->belongsTo(LearningModule::class, 'learning_module_id');
    }
}
