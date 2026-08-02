<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Leave;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    private function getEmployeeForUser($user)
    {
        $employee = Employee::where('user_id', $user->id)->first();
        if (!$employee) {
            $employee = Employee::where('email', $user->email)->first();
            if ($employee) {
                $employee->update(['user_id' => $user->id]);
            } else {
                $names = explode(' ', $user->name, 2);
                $firstName = $names[0] ?? $user->name ?? 'User';
                $lastName = isset($names[1]) && $names[1] ? $names[1] : ($user->role ? ucfirst($user->role) : 'Account');

                $lastEmp = Employee::orderBy('id', 'desc')->first();
                $lastNum = $lastEmp ? intval(substr($lastEmp->employee_code, 3)) : 0;
                $empCode = 'EMP' . str_pad($lastNum + 1, 4, '0', STR_PAD_LEFT);

                $employee = Employee::create([
                    'user_id' => $user->id,
                    'employee_code' => $empCode,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $user->email,
                    'designation' => ucfirst($user->role ?? 'Employee'),
                    'date_of_joining' => Carbon::today()->format('Y-m-d'),
                    'salary' => 50000.00,
                    'status' => 'Active',
                ]);
            }
        }
        return $employee;
    }

    public function status(Request $request)
    {
        $employee = $this->getEmployeeForUser($request->user());

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
        $employee = $this->getEmployeeForUser($request->user());

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
            'is_on_break' => false,
            'total_break_minutes' => 0,
            'breaks' => [],
            'notes' => $request->input('notes'),
        ]);

        return response()->json([
            'message' => 'Clocked in successfully.',
            'attendance' => $attendance,
        ]);
    }

    public function startBreak(Request $request)
    {
        $employee = $this->getEmployeeForUser($request->user());

        $today = Carbon::today()->format('Y-m-d');
        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        if (!$attendance || $attendance->clock_out) {
            return response()->json(['message' => 'You must be currently clocked in to take a break.'], 400);
        }

        if ($attendance->is_on_break) {
            return response()->json(['message' => 'Already on break.'], 400);
        }

        $now = Carbon::now();
        $attendance->update([
            'is_on_break' => true,
            'break_start' => $now->toDateTimeString(),
        ]);

        return response()->json([
            'message' => 'Break started. Enjoy your break!',
            'attendance' => $attendance,
        ]);
    }

    public function resumeWork(Request $request)
    {
        $employee = $this->getEmployeeForUser($request->user());

        $today = Carbon::today()->format('Y-m-d');
        $attendance = Attendance::where('employee_id', $employee->id)
            ->where('date', $today)
            ->first();

        if (!$attendance || !$attendance->is_on_break) {
            return response()->json(['message' => 'You are not currently on break.'], 400);
        }

        $now = Carbon::now();
        $breakStart = Carbon::parse($attendance->break_start);
        $durationMinutes = max(1, $now->diffInMinutes($breakStart));

        $existingBreaks = is_array($attendance->breaks) ? $attendance->breaks : [];
        $newBreakEntry = [
            'start' => $breakStart->format('H:i:s'),
            'end' => $now->format('H:i:s'),
            'duration' => $durationMinutes,
        ];
        $existingBreaks[] = $newBreakEntry;

        $totalBreakMins = ($attendance->total_break_minutes ?? 0) + $durationMinutes;

        $attendance->update([
            'is_on_break' => false,
            'break_start' => null,
            'total_break_minutes' => $totalBreakMins,
            'breaks' => $existingBreaks,
        ]);

        return response()->json([
            'message' => 'Resumed work successfully.',
            'attendance' => $attendance,
        ]);
    }

    public function clockOut(Request $request)
    {
        $employee = $this->getEmployeeForUser($request->user());

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
        $totalBreakMins = $attendance->total_break_minutes ?? 0;
        $existingBreaks = is_array($attendance->breaks) ? $attendance->breaks : [];

        // If currently on break, auto-close current break
        if ($attendance->is_on_break && $attendance->break_start) {
            $bStart = Carbon::parse($attendance->break_start);
            $durMins = max(1, $now->diffInMinutes($bStart));
            $totalBreakMins += $durMins;
            $existingBreaks[] = [
                'start' => $bStart->format('H:i:s'),
                'end' => $now->format('H:i:s'),
                'duration' => $durMins,
            ];
        }

        $attendance->update([
            'clock_out' => $now->format('H:i:s'),
            'is_on_break' => false,
            'break_start' => null,
            'total_break_minutes' => $totalBreakMins,
            'breaks' => $existingBreaks,
            'notes' => $request->input('notes') ?? $attendance->notes,
        ]);

        return response()->json([
            'message' => 'Clocked out successfully.',
            'attendance' => $attendance,
        ]);
    }

    public function weeklySummary(Request $request)
    {
        $user = $request->user();
        $employee = $this->getEmployeeForUser($user);

        $startOfWeek = Carbon::now()->startOfWeek(); // Monday
        $endOfWeek = Carbon::now()->endOfWeek(); // Sunday

        $attendances = Attendance::where('employee_id', $employee->id)
            ->whereBetween('date', [$startOfWeek->format('Y-m-d'), $endOfWeek->format('Y-m-d')])
            ->get()
            ->keyBy('date');

        $days = [];
        $totalWorkedMins = 0;
        $totalBreakMins = 0;

        for ($i = 0; $i < 7; $i++) {
            $dateObj = $startOfWeek->copy()->addDays($i);
            $dateStr = $dateObj->format('Y-m-d');
            $dayName = $dateObj->format('D'); // Mon, Tue...

            $att = $attendances->get($dateStr);
            $workedMins = 0;
            $breakMins = $att ? ($att->total_break_minutes ?? 0) : 0;

            if ($att && $att->clock_in) {
                if ($att->clock_out) {
                    $in = Carbon::parse($dateStr . ' ' . $att->clock_in);
                    $out = Carbon::parse($dateStr . ' ' . $att->clock_out);
                    $rawMins = max(0, $out->diffInMinutes($in));
                    $workedMins = max(0, $rawMins - $breakMins);
                }
            }

            $totalWorkedMins += $workedMins;
            $totalBreakMins += $breakMins;

            $days[] = [
                'date' => $dateStr,
                'day_name' => $dayName,
                'is_today' => $dateObj->isToday(),
                'attendance' => $att,
                'worked_minutes' => $workedMins,
                'break_minutes' => $breakMins,
            ];
        }

        return response()->json([
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->full_name,
            ],
            'weekly_target_hours' => 40,
            'start_of_week' => $startOfWeek->format('Y-m-d'),
            'end_of_week' => $endOfWeek->format('Y-m-d'),
            'days' => $days,
            'total_worked_minutes' => $totalWorkedMins,
            'total_break_minutes' => $totalBreakMins,
        ]);
    }

    public function calendar(Request $request)
    {
        $user = $request->user();
        $month = $request->input('month', Carbon::now()->month);
        $year = $request->input('year', Carbon::now()->year);

        $query = Attendance::with('employee.department')
            ->whereYear('date', $year)
            ->whereMonth('date', $month);

        if ($request->has('employee_id') && $request->employee_id != '') {
            $query->where('employee_id', $request->employee_id);
        } else if ($user->role === 'employee') {
            $employee = $this->getEmployeeForUser($user);
            $query->where('employee_id', $employee->id);
        }

        $attendances = $query->get();

        // Also get leaves for the same month/year
        $leaveQuery = Leave::with('employee')
            ->where('status', 'Approved')
            ->where(function($q) use ($year, $month) {
                $q->whereYear('start_date', $year)->whereMonth('start_date', $month)
                  ->orWhere(function($q2) use ($year, $month) {
                      $q2->whereYear('end_date', $year)->whereMonth('end_date', $month);
                  });
            });

        if ($request->has('employee_id') && $request->employee_id != '') {
            $leaveQuery->where('employee_id', $request->employee_id);
        } else if ($user->role === 'employee') {
            $employee = $this->getEmployeeForUser($user);
            $leaveQuery->where('employee_id', $employee->id);
        }

        $leaves = $leaveQuery->get();

        return response()->json([
            'month' => (int)$month,
            'year' => (int)$year,
            'attendances' => $attendances,
            'leaves' => $leaves,
        ]);
    }

    public function logs(Request $request)
    {
        $user = $request->user();
        $query = Attendance::with('employee.department');

        if ($request->has('employee_id') && $request->employee_id != '') {
            $query->where('employee_id', $request->employee_id);
        } else if ($user->role === 'employee') {
            $employee = $this->getEmployeeForUser($user);
            $query->where('employee_id', $employee->id);
        }

        if ($request->has('start_date') && $request->start_date != '') {
            $query->where('date', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date != '') {
            $query->where('date', '<=', $request->end_date);
        }

        $logs = $query->orderBy('date', 'desc')->get();
        return response()->json($logs);
    }
}
