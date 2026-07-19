<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Leave;
use App\Models\Employee;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Leave::with(['employee.department', 'approver']);

        if ($user->role === 'employee') {
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee) {
                return response()->json([]);
            }
            $query->where('employee_id', $employee->id);
        } else {
            if ($request->has('status') && $request->status != '') {
                $query->where('status', $request->status);
            }
            if ($request->has('employee_id') && $request->employee_id != '') {
                $query->where('employee_id', $request->employee_id);
            }
        }

        $leaves = $query->orderBy('created_at', 'desc')->get();
        return response()->json($leaves);
    }

    public function store(Request $request)
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found.'], 404);
        }

        $request->validate([
            'leave_type' => 'required|string|in:Casual,Sick,Paid,Unpaid',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
        ]);

        $leave = Leave::create([
            'employee_id' => $employee->id,
            'leave_type' => $request->leave_type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'status' => 'Pending',
        ]);

        return response()->json([
            'message' => 'Leave request submitted successfully.',
            'leave' => $leave,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!in_array($user->role, ['admin', 'manager'])) {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        $leave = Leave::findOrFail($id);

        $request->validate([
            'status' => 'required|string|in:Approved,Rejected',
        ]);

        $leave->update([
            'status' => $request->status,
            'approved_by' => $user->id,
        ]);

        return response()->json([
            'message' => 'Leave status updated successfully.',
            'leave' => $leave->load('approver'),
        ]);
    }
}
