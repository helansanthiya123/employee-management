<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function status(Request $request)
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee) {
            return response()->json([
                'can_clock' => false,
                'message' => 'Only registered employees can clock in/out.',
            ]);
        }

        $today = Carbon::today()->format('Y-m-d');
        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        return response()->json([
            'can_clock' => true,
            'attendance' => $attendance,
            'employee' => $employee,
        ]);
    }

    public function clockIn(Request $request)
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found.'], 404);
        }

        $today = Carbon::today()->format('Y-m-d');
        $existing = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Already clocked in for today.'], 400);
        }

        $now = Carbon::now();
        $status = $now->format('H:i:s') > '09:15:00' ? 'Late' : 'Present';

        $attendance = Attendance::create([
            'employee_id' => $employee->id,
            'date' => $today,
            'clock_in' => $now->format('H:i:s'),
            'status' => $status,
            'notes' => $request->input('notes'),
        ]);

        return response()->json([
            'message' => 'Clocked in successfully.',
            'attendance' => $attendance,
        ]);
    }

    public function clockOut(Request $request)
    {
        $employee = Employee::where('user_id', $request->user()->id)->first();

        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found.'], 404);
        }

        $today = Carbon::today()->format('Y-m-d');
        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'No clock in record found for today.'], 400);
        }

        if ($attendance->clock_out) {
            return response()->json(['message' => 'Already clocked out for today.'], 400);
        }

        $now = Carbon::now();
        $attendance->update([
            'clock_out' => $now->format('H:i:s'),
            'notes' => $request->input('notes') ?? $attendance->notes,
        ]);

        return response()->json([
            'message' => 'Clocked out successfully.',
            'attendance' => $attendance,
        ]);
    }

    public function logs(Request $request)
    {
        $user = $request->user();
        $query = Attendance::with('employee.department');

        if ($user->role === 'employee') {
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee) {
                return response()->json([]);
            }
            $query->where('employee_id', $employee->id);
        } else {
            if ($request->has('employee_id') && $request->employee_id != '') {
                $query->where('employee_id', $request->employee_id);
            }
            if ($request->has('start_date') && $request->start_date != '') {
                $query->where('date', '>=', $request->start_date);
            }
            if ($request->has('end_date') && $request->end_date != '') {
                $query->where('date', '<=', $request->end_date);
            }
        }

        $logs = $query->orderBy('date', 'desc')->get();
        return response()->json($logs);
    }
}
