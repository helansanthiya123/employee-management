<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\LearningModule;
use App\Models\LearningQuizQuestion;
use App\Models\EmployeeLearningProgress;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class LmsController extends Controller
{
    private function getEmployee(Request $request)
    {
        return Employee::where('user_id', $request->user()->id)->first();
    }

    public function modules(Request $request)
    {
        $employee = $this->getEmployee($request);
        $modules = LearningModule::where('is_published', true)
            ->withCount('quizQuestions')
            ->orderBy('id', 'desc')
            ->get();

        $result = $modules->map(function ($mod) use ($employee) {
            $progress = null;
            $certificate = null;

            if ($employee) {
                $progress = EmployeeLearningProgress::where('employee_id', $employee->id)
                    ->where('learning_module_id', $mod->id)
                    ->first();

                $certificate = Certificate::where('employee_id', $employee->id)
                    ->where('learning_module_id', $mod->id)
                    ->first();
            }

            return [
                'id' => $mod->id,
                'title' => $mod->title,
                'description' => $mod->description,
                'category' => $mod->category,
                'content_type' => $mod->content_type,
                'content_url' => $mod->content_url,
                'document_text' => $mod->document_text,
                'estimated_minutes' => $mod->estimated_minutes,
                'passing_score' => $mod->passing_score,
                'questions_count' => $mod->quiz_questions_count,
                'status' => $progress ? $progress->status : 'not_started',
                'quiz_score' => $progress ? $progress->quiz_score : 0,
                'attempts_count' => $progress ? $progress->attempts_count : 0,
                'completed_at' => $progress ? $progress->completed_at : null,
                'certificate_code' => $certificate ? $certificate->certificate_code : null,
            ];
        });

        return response()->json($result);
    }

    public function showModule(Request $request, $id)
    {
        $module = LearningModule::with(['quizQuestions'])->findOrFail($id);
        $employee = $this->getEmployee($request);

        $progress = null;
        $certificate = null;

        if ($employee) {
            $progress = EmployeeLearningProgress::where('employee_id', $employee->id)
                ->where('learning_module_id', $module->id)
                ->first();

            $certificate = Certificate::where('employee_id', $employee->id)
                ->where('learning_module_id', $module->id)
                ->first();
        }

        $questions = $module->quizQuestions->map(function ($q) {
            return [
                'id' => $q->id,
                'question' => $q->question,
                'options' => $q->options,
                // Hide correct_option in test-taking payload to prevent instant client-side cheat
            ];
        });

        return response()->json([
            'module' => [
                'id' => $module->id,
                'title' => $module->title,
                'description' => $module->description,
                'category' => $module->category,
                'content_type' => $module->content_type,
                'content_url' => $module->content_url,
                'document_text' => $module->document_text,
                'estimated_minutes' => $module->estimated_minutes,
                'passing_score' => $module->passing_score,
            ],
            'questions' => $questions,
            'progress' => $progress,
            'certificate' => $certificate,
        ]);
    }

    public function submitQuiz(Request $request, $id)
    {
        $employee = $this->getEmployee($request);
        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found.'], 404);
        }

        $module = LearningModule::with('quizQuestions')->findOrFail($id);

        $request->validate([
            'answers' => 'required|array', // e.g. [question_id => selected_option_index]
        ]);

        $answers = $request->answers;
        $questions = $module->quizQuestions;
        $totalQuestions = $questions->count();

        if ($totalQuestions === 0) {
            return response()->json(['message' => 'No questions found for this module.'], 400);
        }

        $correctCount = 0;
        $breakdown = [];

        foreach ($questions as $q) {
            $userAnswer = isset($answers[$q->id]) ? intval($answers[$q->id]) : null;
            $isCorrect = ($userAnswer !== null && $userAnswer === $q->correct_option);

            if ($isCorrect) {
                $correctCount++;
            }

            $breakdown[] = [
                'question_id' => $q->id,
                'question' => $q->question,
                'user_answer' => $userAnswer,
                'correct_option' => $q->correct_option,
                'is_correct' => $isCorrect,
                'explanation' => $q->explanation,
            ];
        }

        $score = round(($correctCount / $totalQuestions) * 100);
        $passed = $score >= $module->passing_score;

        // Update or create progress
        $progress = EmployeeLearningProgress::firstOrNew([
            'employee_id' => $employee->id,
            'learning_module_id' => $module->id,
        ]);

        $progress->attempts_count = ($progress->attempts_count ?? 0) + 1;
        $progress->quiz_score = max($progress->quiz_score ?? 0, $score);
        
        if ($passed) {
            $progress->status = 'completed';
            $progress->completed_at = Carbon::now();
        } else {
            if ($progress->status !== 'completed') {
                $progress->status = 'failed';
            }
        }
        $progress->save();

        // Certificate generation logic
        $certificate = null;
        if ($passed) {
            $certificate = Certificate::firstOrCreate(
                [
                    'employee_id' => $employee->id,
                    'learning_module_id' => $module->id,
                ],
                [
                    'certificate_code' => 'CERT-' . strtoupper(Str::random(4)) . '-' . rand(1000, 9999),
                    'employee_name' => $employee->full_name,
                    'course_title' => $module->title,
                    'score' => $score,
                    'issued_at' => Carbon::now(),
                    'expiry_date' => Carbon::now()->addYear(),
                ]
            );
        }

        return response()->json([
            'passed' => $passed,
            'score' => $score,
            'passing_score' => $module->passing_score,
            'correct_count' => $correctCount,
            'total_questions' => $totalQuestions,
            'breakdown' => $breakdown,
            'certificate' => $certificate,
            'message' => $passed
                ? 'Congratulations! You passed the quiz and earned a completion certificate.'
                : "You scored {$score}%. A minimum of {$module->passing_score}% is required to pass. Please review the material and try again.",
        ]);
    }

    public function certificates(Request $request)
    {
        $user = $request->user();
        $query = Certificate::with(['employee', 'module']);

        if ($user->role === 'employee') {
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee) return response()->json([]);
            $query->where('employee_id', $employee->id);
        }

        $certificates = $query->orderBy('issued_at', 'desc')->get();
        return response()->json($certificates);
    }

    public function verifyCertificate($code)
    {
        $cert = Certificate::with(['employee.department', 'module'])
            ->where('certificate_code', $code)
            ->first();

        if (!$cert) {
            return response()->json(['valid' => false, 'message' => 'Invalid or expired certificate code.'], 404);
        }

        return response()->json([
            'valid' => true,
            'certificate' => $cert,
        ]);
    }

    public function stats(Request $request)
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();

        $totalModules = LearningModule::where('is_published', true)->count();
        $completedModules = 0;
        $certificatesEarned = 0;
        $avgScore = 0;

        if ($employee) {
            $completedModules = EmployeeLearningProgress::where('employee_id', $employee->id)
                ->where('status', 'completed')
                ->count();

            $certificatesEarned = Certificate::where('employee_id', $employee->id)->count();

            $scores = EmployeeLearningProgress::where('employee_id', $employee->id)->pluck('quiz_score');
            $avgScore = $scores->count() > 0 ? round($scores->avg()) : 0;
        }

        return response()->json([
            'total_modules' => $totalModules,
            'completed_modules' => $completedModules,
            'certificates_earned' => $certificatesEarned,
            'avg_score' => $avgScore,
        ]);
    }

    public function storeModule(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['admin', 'manager'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string',
            'content_type' => 'required|in:video,document',
            'content_url' => 'nullable|string',
            'document_text' => 'nullable|string',
            'estimated_minutes' => 'nullable|integer',
            'passing_score' => 'nullable|integer|between:50,100',
            'questions' => 'nullable|array',
            'questions.*.question' => 'required|string',
            'questions.*.options' => 'required|array|min:2',
            'questions.*.correct_option' => 'required|integer',
            'questions.*.explanation' => 'nullable|string',
        ]);

        $module = LearningModule::create([
            'title' => $request->title,
            'description' => $request->description,
            'category' => $request->category,
            'content_type' => $request->content_type,
            'content_url' => $request->content_url,
            'document_text' => $request->document_text,
            'estimated_minutes' => $request->estimated_minutes ?? 15,
            'passing_score' => $request->passing_score ?? 80,
            'is_published' => true,
        ]);

        if ($request->has('questions') && is_array($request->questions)) {
            foreach ($request->questions as $q) {
                LearningQuizQuestion::create([
                    'learning_module_id' => $module->id,
                    'question' => $q['question'],
                    'options' => $q['options'],
                    'correct_option' => $q['correct_option'],
                    'explanation' => $q['explanation'] ?? null,
                ]);
            }
        }

        return response()->json([
            'message' => 'Learning module and quiz questions created successfully.',
            'module' => $module->load('quizQuestions'),
        ], 201);
    }

    public function destroyModule(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role, ['admin', 'manager'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $module = LearningModule::findOrFail($id);
        $module->delete();

        return response()->json(['message' => 'Learning module deleted successfully.']);
    }
}
