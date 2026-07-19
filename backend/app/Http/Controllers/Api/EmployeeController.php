<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::with('department');

        // Search
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('employee_code', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('designation', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($request->has('department_id') && $request->department_id != '') {
            $query->where('department_id', $request->department_id);
        }

        if ($request->has('status') && $request->status != '') {
            $query->where('status', $request->status);
        }

        // Pagination
        $perPage = $request->input('per_page', 10);
        $employees = $query->paginate($perPage);

        return response()->json($employees);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:employees,email',
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|in:Male,Female,Other',
            'date_of_joining' => 'required|date',
            'department_id' => 'nullable|exists:departments,id',
            'designation' => 'required|string|max:255',
            'salary' => 'required|numeric|min:0',
            'status' => 'required|string|in:Active,Inactive,Suspended,Terminated',
            'address' => 'nullable|string',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'create_user_account' => 'nullable', // handles '1', 'true', true
        ]);

        $data = $request->except(['profile_picture', 'create_user_account']);

        // Generate unique employee code
        $lastEmployee = Employee::orderBy('id', 'desc')->first();
        if ($lastEmployee) {
            $lastNum = intval(substr($lastEmployee->employee_code, 3));
            $data['employee_code'] = 'EMP' . str_pad($lastNum + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $data['employee_code'] = 'EMP0001';
        }

        // Handle Profile Picture Upload
        if ($request->hasFile('profile_picture')) {
            $path = $request->file('profile_picture')->store('profiles', 'public');
            $data['profile_picture'] = $path;
        }

        // Optionally create linked User account
        $createUserAccount = filter_var($request->create_user_account, FILTER_VALIDATE_BOOLEAN);
        if ($createUserAccount) {
            $user = User::where('email', $request->email)->first();
            if (!$user) {
                $user = User::create([
                    'name' => $request->first_name . ' ' . $request->last_name,
                    'email' => $request->email,
                    'password' => Hash::make('password'), // default password
                    'role' => 'employee',
                ]);
            }
            $data['user_id'] = $user->id;
        }

        $employee = Employee::create($data);

        return response()->json([
            'message' => 'Employee created successfully.',
            'employee' => $employee->load('department'),
        ], 201);
    }

    public function show($id)
    {
        $employee = Employee::with(['department', 'attendances' => function($q) {
            $q->orderBy('date', 'desc')->limit(30);
        }, 'leaves' => function($q) {
            $q->orderBy('start_date', 'desc');
        }])->findOrFail($id);

        return response()->json($employee);
    }

    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('employees', 'email')->ignore($employee->id)],
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|in:Male,Female,Other',
            'date_of_joining' => 'required|date',
            'department_id' => 'nullable|exists:departments,id',
            'designation' => 'required|string|max:255',
            'salary' => 'required|numeric|min:0',
            'status' => 'required|string|in:Active,Inactive,Suspended,Terminated',
            'address' => 'nullable|string',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $data = $request->except(['profile_picture']);

        // Handle Profile Picture Upload
        if ($request->hasFile('profile_picture')) {
            if ($employee->profile_picture) {
                Storage::disk('public')->delete($employee->profile_picture);
            }
            $path = $request->file('profile_picture')->store('profiles', 'public');
            $data['profile_picture'] = $path;
        }

        $employee->update($data);

        if ($employee->user_id) {
            $user = User::find($employee->user_id);
            if ($user) {
                $user->update([
                    'name' => $employee->first_name . ' ' . $employee->last_name,
                    'email' => $employee->email,
                ]);
            }
        }

        return response()->json([
            'message' => 'Employee updated successfully.',
            'employee' => $employee->load('department'),
        ]);
    }

    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);

        if ($employee->profile_picture) {
            Storage::disk('public')->delete($employee->profile_picture);
        }

        if ($employee->user_id) {
            User::destroy($employee->user_id);
        }

        $employee->delete();

        return response()->json([
            'message' => 'Employee deleted successfully.',
        ]);
    }
}
