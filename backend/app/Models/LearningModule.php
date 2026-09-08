<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LearningModule extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'category',
        'content_type',
        'content_url',
        'document_text',
        'estimated_minutes',
        'passing_score',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'estimated_minutes' => 'integer',
        'passing_score' => 'integer',
    ];

    public function quizQuestions()
    {
        return $this->hasMany(LearningQuizQuestion::class);
    }

    public function progressRecords()
    {
        return $this->hasMany(EmployeeLearningProgress::class);
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }
}
