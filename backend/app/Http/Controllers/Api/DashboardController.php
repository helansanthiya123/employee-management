<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Department;
use App\Models\Attendance;
use App\Models\Leave;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today()->format('Y-m-d');

        if (in_array($user->role, ['admin', 'manager'])) {
            $totalEmployees = Employee::where('status', 'Active')->count();
            $totalDepartments = Department::count();
            
            $presentToday = Attendance::where('date', $today)
                ->whereIn('status', ['Present', 'Late'])
                ->count();

            $onLeaveToday = Leave::where('status', 'Approved')
                ->where('start_date', '<=', $today)
                ->where('end_date', '>=', $today)
                ->count();

            $pendingLeaves = Leave::where('status', 'Pending')->count();

            $attendanceRate = $totalEmployees > 0 
                ? round(($presentToday / $totalEmployees) * 100, 1) 
                : 0;

            $departmentStats = Department::withCount(['employees' => function($q) {
                $q->where('status', 'Active');
            }])->get()->map(function($dept) {
                return [
                    'name' => $dept->name,
                    'count' => $dept->employees_count,
                ];
            });

            $recentAttendances = Attendance::with('employee')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function($att) {
                    return [
                        'type' => 'attendance',
                        'title' => $att->employee ? ($att->employee->full_name . ' clocked ' . ($att->clock_out ? 'out' : 'in')) : 'Unknown Employee clocked',
                        'time' => $att->clock_in,
                        'date' => $att->date,
                        'status' => $att->status,
                    ];
                });

            $recentLeaves = Leave::with('employee')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function($lv) {
                    return [
                        'type' => 'leave',
                        'title' => $lv->employee ? ($lv->employee->full_name . ' requested ' . $lv->leave_type . ' leave') : 'Unknown Employee leave request',
                        'time' => $lv->created_at->format('H:i:s'),
                        'date' => $lv->start_date . ' to ' . $lv->end_date,
                        'status' => $lv->status,
                    ];
                });

            $recentActivity = $recentAttendances->concat($recentLeaves)
                ->sortByDesc(function($item) {
                    return $item['date'] . ' ' . $item['time'];
                })
                ->values()
                ->take(5);

            return response()->json([
                'role' => $user->role,
                'summary' => [
                    ['label' => 'Total Employees', 'value' => $totalEmployees, 'icon' => 'users', 'color' => 'blue'],
                    ['label' => 'Total Departments', 'value' => $totalDepartments, 'icon' => 'briefcase', 'color' => 'indigo'],
                    ['label' => 'Present Today', 'value' => $presentToday, 'icon' => 'check-circle', 'color' => 'green'],
                    ['label' => 'On Leave Today', 'value' => $onLeaveToday, 'icon' => 'calendar', 'color' => 'orange'],
                    ['label' => 'Pending Leaves', 'value' => $pendingLeaves, 'icon' => 'clock', 'color' => 'red'],
                ],
                'attendance_rate' => $attendanceRate,
                'department_distribution' => $departmentStats,
                'recent_activity' => $recentActivity,
            ]);
        } else {
            $employee = Employee::where('user_id', $user->id)->first();
            if (!$employee) {
                return response()->json(['message' => 'Employee record not found.'], 404);
            }

            $currentMonth = Carbon::now()->month;
            $currentYear = Carbon::now()->year;

            $totalLeavesApproved = Leave::where('employee_id', $employee->id)
                ->where('status', 'Approved')
                ->count();

            $pendingLeavesCount = Leave::where('employee_id', $employee->id)
                ->where('status', 'Pending')
                ->count();

            $presentDays = Attendance::where('employee_id', $employee->id)
                ->whereMonth('date', $currentMonth)
                ->whereYear('date', $currentYear)
                ->where('status', 'Present')
                ->count();

            $lateDays = Attendance::where('employee_id', $employee->id)
                ->whereMonth('date', $currentMonth)
                ->whereYear('date', $currentYear)
                ->where('status', 'Late')
                ->count();

            $absentDays = Attendance::where('employee_id', $employee->id)
                ->whereMonth('date', $currentMonth)
                ->whereYear('date', $currentYear)
                ->where('status', 'Absent')
                ->count();

            $myAttendances = Attendance::where('employee_id', $employee->id)
                ->orderBy('date', 'desc')
                ->limit(5)
                ->get()
                ->map(function($att) {
                    return [
                        'type' => 'attendance',
                        'title' => 'You clocked ' . ($att->clock_out ? 'out' : 'in'),
                        'time' => $att->clock_in,
                        'date' => $att->date,
                        'status' => $att->status,
                    ];
                });

            $myLeaves = Leave::where('employee_id', $employee->id)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function($lv) {
                    return [
                        'type' => 'leave',
                        'title' => 'Leave Request (' . $lv->leave_type . ')',
                        'time' => $lv->created_at->format('H:i:s'),
                        'date' => $lv->start_date . ' to ' . $lv->end_date,
                        'status' => $lv->status,
                    ];
                });

            $recentActivity = $myAttendances->concat($myLeaves)
                ->sortByDesc(function($item) {
                    return $item['date'] . ' ' . $item['time'];
                })
                ->values()
                ->take(5);

            return response()->json([
                'role' => $user->role,
                'summary' => [
                    ['label' => 'Leaves Approved', 'value' => $totalLeavesApproved, 'icon' => 'calendar-check', 'color' => 'blue'],
                    ['label' => 'Pending Requests', 'value' => $pendingLeavesCount, 'icon' => 'clock', 'color' => 'orange'],
                    ['label' => 'Present Days (Month)', 'value' => $presentDays, 'icon' => 'check-circle', 'color' => 'green'],
                    ['label' => 'Late Days (Month)', 'value' => $lateDays, 'icon' => 'alert-circle', 'color' => 'yellow'],
                    ['label' => 'Absent Days (Month)', 'value' => $absentDays, 'icon' => 'x-circle', 'color' => 'red'],
                ],
                'recent_activity' => $recentActivity,
            ]);
        }
    }
}
