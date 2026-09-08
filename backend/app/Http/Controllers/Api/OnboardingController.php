<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\OnboardingTask;
use Illuminate\Http\Request;
use Carbon\Carbon;

class OnboardingController extends Controller
{
    private function getTargetEmployee(Request $request)
    {
        $user = $request->user();
        if (in_array($user->role, ['admin', 'manager']) && $request->has('employee_id') && !empty($request->employee_id)) {
            return Employee::find($request->employee_id);
        }
        return Employee::where('user_id', $user->id)->first();
    }

    public function index(Request $request)
    {
        $employee = $this->getTargetEmployee($request);

        if (!$employee) {
            return response()->json([
                'tasks' => [],
                'progress_percentage' => 0,
                'completed_count' => 0,
                'total_count' => 0,
                'message' => 'No employee profile associated with account.'
            ]);
        }

        $tasks = OnboardingTask::where('employee_id', $employee->id)
            ->orderBy('is_completed', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $totalCount = $tasks->count();
        $completedCount = $tasks->where('is_completed', true)->count();
        $progressPercentage = $totalCount > 0 ? round(($completedCount / $totalCount) * 100) : 0;

        return response()->json([
            'employee' => [
                'id' => $employee->id,
                'full_name' => $employee->full_name,
                'designation' => $employee->designation,
                'date_of_joining' => $employee->date_of_joining,
            ],
            'tasks' => $tasks,
            'progress_percentage' => $progressPercentage,
            'completed_count' => $completedCount,
            'total_count' => $totalCount,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string',
            'due_days' => 'nullable|integer|min:1',
            'priority' => 'nullable|in:high,medium,low',
            'employee_id' => 'nullable|exists:employees,id',
        ]);

        $employeeId = $request->employee_id;
        if (!$employeeId) {
            $emp = Employee::where('user_id', $user->id)->first();
            if (!$emp) {
                return response()->json(['message' => 'Employee profile not found.'], 404);
            }
            $employeeId = $emp->id;
        }

        $task = OnboardingTask::create([
            'employee_id' => $employeeId,
            'title' => $request->title,
            'description' => $request->description,
            'category' => $request->category ?? 'General',
            'due_days' => $request->due_days ?? 1,
            'priority' => $request->priority ?? 'medium',
            'is_completed' => false,
        ]);

        return response()->json([
            'message' => 'Onboarding task created successfully.',
            'task' => $task,
        ], 201);
    }

    public function toggle(Request $request, $id)
    {
        $task = OnboardingTask::findOrFail($id);
        $user = $request->user();

        // Check ownership or admin/manager role
        $emp = Employee::where('user_id', $user->id)->first();
        if ($user->role === 'employee' && (!$emp || $task->employee_id !== $emp->id)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $task->is_completed = !$task->is_completed;
        $task->completed_at = $task->is_completed ? Carbon::now() : null;
        $task->save();

        return response()->json([
            'message' => $task->is_completed ? 'Task marked as completed.' : 'Task marked as incomplete.',
            'task' => $task,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!in_array($user->role, ['admin', 'manager'])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $task = OnboardingTask::findOrFail($id);
        $task->delete();

        return response()->json(['message' => 'Onboarding task removed.']);
    }

    public function seedDefaults(Request $request)
    {
        $employee = $this->getTargetEmployee($request);
        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found.'], 404);
        }

        $defaults = [
            [
                'title' => 'Complete Employee Profile & Contact Details',
                'description' => 'Review and update emergency contacts, home address, and tax information.',
                'category' => 'HR & Compliance',
                'due_days' => 1,
                'priority' => 'high',
            ],
            [
                'title' => 'Setup Workstation & Corporate Email Account',
                'description' => 'Log into your corporate email, setup 2FA security authentication, and install essential team software.',
                'category' => 'IT Setup',
                'due_days' => 1,
                'priority' => 'high',
            ],
            [
                'title' => 'Review Employee Handbook & Anti-Harassment Policy',
                'description' => 'Read and acknowledge company guidelines, dress code, working hours, and conduct policies.',
                'category' => 'HR & Compliance',
                'due_days' => 2,
                'priority' => 'medium',
            ],
            [
                'title' => 'Attend Day 1 Orientation & Team Intro Call',
                'description' => 'Join the welcome meeting with your department team lead and team members.',
                'category' => 'Team & Operations',
                'due_days' => 1,
                'priority' => 'high',
            ],
            [
                'title' => 'Complete Mandatory Cybersecurity Training Module',
                'description' => 'Finish the Data Security & Phishing Awareness learning module in the LMS portal.',
                'category' => 'Compliance',
                'due_days' => 3,
                'priority' => 'high',
            ],
        ];

        $created = [];
        foreach ($defaults as $data) {
            $existing = OnboardingTask::where('employee_id', $employee->id)
                ->where('title', $data['title'])
                ->first();
            if (!$existing) {
                $created[] = OnboardingTask::create(array_merge($data, [
                    'employee_id' => $employee->id,
                    'is_completed' => false,
                ]));
            }
        }

        return response()->json([
            'message' => 'Default onboarding tasks populated.',
            'count' => count($created),
        ]);
    }
}
