<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\LeaveController;
use App\Http\Controllers\Api\HourlyPermissionController;
use App\Http\Controllers\Api\DashboardController;

// Public Auth Routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth profile & logout
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Dashboard Statistics
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Birthdays endpoint (before employees resource)
    Route::get('/employees/birthdays', [EmployeeController::class, 'birthdays']);

    // Employees Management CRUD
    Route::apiResource('employees', EmployeeController::class);
    Route::put('/employees/{id}/update', [EmployeeController::class, 'update']);

    // Departments Management CRUD
    Route::apiResource('departments', DepartmentController::class);

    // Attendance Management
    Route::get('/attendance/status', [AttendanceController::class, 'status']);
    Route::get('/attendance/weekly-summary', [AttendanceController::class, 'weeklySummary']);
    Route::get('/attendance/calendar', [AttendanceController::class, 'calendar']);
    Route::post('/attendance/clock-in', [AttendanceController::class, 'clockIn']);
    Route::post('/attendance/start-break', [AttendanceController::class, 'startBreak']);
    Route::post('/attendance/resume-work', [AttendanceController::class, 'resumeWork']);
    Route::post('/attendance/clock-out', [AttendanceController::class, 'clockOut']);
    Route::get('/attendance/logs', [AttendanceController::class, 'logs']);

    // Leave Management
    Route::get('/leaves', [LeaveController::class, 'index']);
    Route::post('/leaves', [LeaveController::class, 'store']);
    Route::put('/leaves/{id}', [LeaveController::class, 'update']);

    // Hourly Permission Management
    Route::get('/hourly-permissions', [HourlyPermissionController::class, 'index']);
    Route::post('/hourly-permissions', [HourlyPermissionController::class, 'store']);
    Route::put('/hourly-permissions/{id}', [HourlyPermissionController::class, 'update']);
});
