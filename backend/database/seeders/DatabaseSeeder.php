<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\Leave;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Users with specific roles
        $adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@company.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        $managerUser = User::create([
            'name' => 'Manager User',
            'email' => 'manager@company.com',
            'password' => Hash::make('password'),
            'role' => 'manager',
        ]);

        $employeeUser = User::create([
            'name' => 'Employee User',
            'email' => 'employee@company.com',
            'password' => Hash::make('password'),
            'role' => 'employee',
        ]);

        // 2. Create Departments
        $engDept = Department::create([
            'name' => 'Engineering',
            'description' => 'Software development and technical infrastructure.',
            'manager_id' => $managerUser->id,
        ]);

        $hrDept = Department::create([
            'name' => 'Human Resources',
            'description' => 'Recruiting, benefits, and employee relations.',
            'manager_id' => null,
        ]);

        $mktDept = Department::create([
            'name' => 'Marketing',
            'description' => 'Brand management and customer acquisition.',
            'manager_id' => null,
        ]);

        // 3. Create Employees linked to users (if applicable) and departments
        $emp1 = Employee::create([
            'user_id' => $employeeUser->id,
            'employee_code' => 'EMP0001',
            'first_name' => 'Employee',
            'last_name' => 'User',
            'email' => 'employee@company.com',
            'phone' => '123-456-7890',
            'date_of_birth' => '1995-08-20',
            'gender' => 'Male',
            'date_of_joining' => '2024-01-10',
            'department_id' => $engDept->id,
            'designation' => 'Frontend Developer',
            'salary' => 60000.00,
            'status' => 'Active',
            'address' => '123 Tech Lane, Silicon Valley, CA',
            'profile_picture' => null,
        ]);

        $emp2 = Employee::create([
            'user_id' => null,
            'employee_code' => 'EMP0002',
            'first_name' => 'Alice',
            'last_name' => 'Smith',
            'email' => 'alice@company.com',
            'phone' => '987-654-3210',
            'date_of_birth' => '1990-04-12',
            'gender' => 'Female',
            'date_of_joining' => '2023-03-15',
            'department_id' => $engDept->id,
            'designation' => 'Senior Backend Developer',
            'salary' => 85000.00,
            'status' => 'Active',
            'address' => '456 Server St, Tech Town, CA',
            'profile_picture' => null,
        ]);

        $emp3 = Employee::create([
            'user_id' => null,
            'employee_code' => 'EMP0003',
            'first_name' => 'Bob',
            'last_name' => 'Johnson',
            'email' => 'bob@company.com',
            'phone' => '555-019-2834',
            'date_of_birth' => '1988-11-30',
            'gender' => 'Male',
            'date_of_joining' => '2022-07-01',
            'department_id' => $engDept->id,
            'designation' => 'QA Engineer',
            'salary' => 55000.00,
            'status' => 'Active',
            'address' => '789 Bug Free Ave, Testingville, CA',
            'profile_picture' => null,
        ]);

        $emp4 = Employee::create([
            'user_id' => null,
            'employee_code' => 'EMP0004',
            'first_name' => 'Charlie',
            'last_name' => 'Brown',
            'email' => 'charlie@company.com',
            'phone' => '555-120-4321',
            'date_of_birth' => '1992-06-05',
            'gender' => 'Male',
            'date_of_joining' => '2024-02-01',
            'department_id' => $hrDept->id,
            'designation' => 'HR Specialist',
            'salary' => 48000.00,
            'status' => 'Active',
            'address' => '101 People Pl, Talent City, CA',
            'profile_picture' => null,
        ]);

        $emp5 = Employee::create([
            'user_id' => null,
            'employee_code' => 'EMP0005',
            'first_name' => 'Diana',
            'last_name' => 'Prince',
            'email' => 'diana@company.com',
            'phone' => '555-999-8888',
            'date_of_birth' => '1994-12-25',
            'gender' => 'Female',
            'date_of_joining' => '2023-09-01',
            'department_id' => $mktDept->id,
            'designation' => 'Marketing Manager',
            'salary' => 70000.00,
            'status' => 'Active',
            'address' => '202 Growth Blvd, Campaign Center, CA',
            'profile_picture' => null,
        ]);

        // 4. Seed Attendance Logs for the last 5 weekdays
        $employees = [$emp1, $emp2, $emp3, $emp4, $emp5];
        $startDate = Carbon::today()->subDays(7); // starts a week ago

        for ($i = 0; $i < 7; $i++) {
            $date = $startDate->copy()->addDays($i);
            
            // Skip weekends
            if ($date->isWeekend()) {
                continue;
            }

            foreach ($employees as $employee) {
                // Introduce some randomness
                $roll = rand(1, 100);
                
                if ($roll > 95) {
                    // Absent
                    Attendance::create([
                        'employee_id' => $employee->id,
                        'date' => $date->format('Y-m-d'),
                        'clock_in' => '00:00:00',
                        'clock_out' => '00:00:00',
                        'status' => 'Absent',
                        'notes' => 'No show, no leave request.',
                    ]);
                } elseif ($roll > 85) {
                    // Late
                    Attendance::create([
                        'employee_id' => $employee->id,
                        'date' => $date->format('Y-m-d'),
                        'clock_in' => '09:32:00',
                        'clock_out' => '17:30:00',
                        'status' => 'Late',
                        'notes' => 'Stuck in traffic.',
                    ]);
                } else {
                    // Present
                    $clockInHour = rand(8, 9);
                    $clockInMinute = ($clockInHour == 9) ? rand(0, 10) : rand(0, 59);
                    $clockOutHour = rand(17, 18);
                    $clockOutMinute = rand(0, 59);

                    $clockInTime = sprintf('%02d:%02d:00', $clockInHour, $clockInMinute);
                    $clockOutTime = sprintf('%02d:%02d:00', $clockOutHour, $clockOutMinute);

                    $status = ($clockInHour == 9 && $clockInMinute > 0) ? 'Late' : 'Present';

                    Attendance::create([
                        'employee_id' => $employee->id,
                        'date' => $date->format('Y-m-d'),
                        'clock_in' => $clockInTime,
                        'clock_out' => $clockOutTime,
                        'status' => $status,
                        'notes' => $status === 'Late' ? 'Late check-in.' : null,
                    ]);
                }
            }
        }

        // 5. Seed Leave Requests
        Leave::create([
            'employee_id' => $emp1->id,
            'leave_type' => 'Sick',
            'start_date' => Carbon::today()->addDays(2)->format('Y-m-d'),
            'end_date' => Carbon::today()->addDays(3)->format('Y-m-d'),
            'reason' => 'Doctor appointment and wisdom tooth extraction.',
            'status' => 'Pending',
            'approved_by' => null,
        ]);

        Leave::create([
            'employee_id' => $emp2->id,
            'leave_type' => 'Casual',
            'start_date' => Carbon::today()->subDays(15)->format('Y-m-d'),
            'end_date' => Carbon::today()->subDays(12)->format('Y-m-d'),
            'reason' => 'Family trip to Yosemite.',
            'status' => 'Approved',
            'approved_by' => $adminUser->id,
        ]);

        Leave::create([
            'employee_id' => $emp3->id,
            'leave_type' => 'Casual',
            'start_date' => Carbon::today()->addDays(10)->format('Y-m-d'),
            'end_date' => Carbon::today()->addDays(11)->format('Y-m-d'),
            'reason' => 'Moving house.',
            'status' => 'Pending',
            'approved_by' => null,
        ]);
    }
}
