<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LearningQuizQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'learning_module_id',
        'question',
        'options',
        'correct_option',
        'explanation',
    ];

    protected $casts = [
        'options' => 'array',
        'correct_option' => 'integer',
    ];

    public function module()
    {
        return $this->belongsTo(LearningModule::class, 'learning_module_id');
    }
}
