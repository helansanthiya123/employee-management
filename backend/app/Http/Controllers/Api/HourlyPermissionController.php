<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HourlyPermission;
use App\Models\Employee;
use Illuminate\Http\Request;
use Carbon\Carbon;

class HourlyPermissionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = HourlyPermission::with(['employee.department', 'approver']);

        if ($user->role === 'employee') {
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee) {
                return response()->json([]);
            }
            $query->where('employee_id', $employee->id);
        }

        $permissions = $query->orderBy('created_at', 'desc')->get();
        return response()->json($permissions);
    }

    public function store(Request $request)
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee) {
            return response()->json(['message' => 'Only employees can request hourly permission.'], 403);
        }

        $request->validate([
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
            'reason' => 'required|string|max:500',
        ]);

        $start = Carbon::parse($request->date . ' ' . $request->start_time);
        $end = Carbon::parse($request->date . ' ' . $request->end_time);

        if ($end->lessThanOrEqualTo($start)) {
            return response()->json(['message' => 'End time must be after start time.'], 422);
        }

        $diffMinutes = $end->diffInMinutes($start);
        $hours = round($diffMinutes / 60, 2);

        $permission = HourlyPermission::create([
            'employee_id' => $employee->id,
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'hours' => $hours,
            'reason' => $request->reason,
            'status' => 'Pending',
        ]);

        return response()->json([
            'message' => 'Hourly permission requested successfully.',
            'permission' => $permission->load('employee'),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!in_array($user->role, ['admin', 'manager'])) {
            return response()->json(['message' => 'Unauthorized to review permissions.'], 403);
        }

        $permission = HourlyPermission::findOrFail($id);

        $request->validate([
            'status' => 'required|in:Approved,Rejected',
        ]);

        $permission->update([
            'status' => $request->status,
            'approved_by' => $user->id,
        ]);

        return response()->json([
            'message' => "Hourly permission request {$request->status}.",
            'permission' => $permission->load(['employee', 'approver']),
        ]);
    }
}
