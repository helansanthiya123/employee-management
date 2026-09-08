<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'certificate_code',
        'employee_id',
        'learning_module_id',
        'employee_name',
        'course_title',
        'score',
        'issued_at',
        'expiry_date',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'expiry_date' => 'datetime',
        'score' => 'integer',
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
