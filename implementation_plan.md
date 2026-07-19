# Employee Management System Implementation Plan

This plan details the design and implementation of a modern Employee Management system. It uses **Laravel 11** for the backend (API) and **React** (Vite) for the frontend, styled with premium **Vanilla CSS** using a crisp **white and blue** color palette.

---

## User Review Required

> [!IMPORTANT]
> **Database Credentials & Web Server Port:**
> We will configure Laravel to connect to local MySQL (XAMPP default: `root` with no password, host `127.0.0.1:3306`). The Laravel API will run on `http://127.0.0.1:8000` via `php artisan serve`, and Vite will run the React frontend on `http://localhost:5173`.
> Please make sure XAMPP Apache & MySQL services are running.

> [!TIP]
> **Styling Choices:**
> In accordance with project guidelines, this application will use custom **Vanilla CSS** instead of Tailwind CSS. We will implement modern variables, custom components, responsive grids, transitions, and cards to create a premium look.

---

## Open Questions

> [!NOTE]
> 1. **Default Login Roles:**
>    Should we seed a default Admin user, a Manager, and a basic Employee to make testing the dashboard states easier? (Proposed: `admin@company.com`, `manager@company.com`, `employee@company.com`, all with password `password`).
> 2. **Attendance Mock Data:**
>    Do you want the database to pre-populate attendance logs and department listings to immediately demonstrate dashboard stats and graphs?

---

## Proposed Changes

We will split the workspace into a decoupling structure:
- [backend](file:///c:/xampp/htdocs/AI-Projects/emp/backend) - Laravel 11 API
- [frontend](file:///c:/xampp/htdocs/AI-Projects/emp/frontend) - React SPA

---

### Component 1: Laravel 11 Backend

The backend acts as a JSON REST API handling auth, employees, departments, attendance, and leaves.

#### [NEW] [Database Migrations](file:///c:/xampp/htdocs/AI-Projects/emp/backend/database/migrations)
We will define the following migrations:
1. `create_departments_table`: `id`, `name`, `description`, `manager_id` (nullable).
2. `create_employees_table`: `id`, `user_id` (linked to `users`), `employee_code`, `first_name`, `last_name`, `email`, `phone`, `date_of_birth`, `gender`, `date_of_joining`, `department_id` (linked to departments), `designation`, `salary`, `status`, `address`, `profile_picture`, `timestamps`.
3. `create_attendances_table`: `id`, `employee_id` (linked to employees), `date`, `clock_in`, `clock_out` (nullable), `status` (Present/Absent/Late/Leave), `notes`, `timestamps`.
4. `create_leaves_table`: `id`, `employee_id`, `leave_type`, `start_date`, `end_date`, `reason`, `status` (Pending/Approved/Rejected), `approved_by` (linked to users), `timestamps`.

#### [NEW] [Models & Controllers](file:///c:/xampp/htdocs/AI-Projects/emp/backend/app)
- Models: `Department`, `Employee`, `Attendance`, `Leave` with relationships.
- Controllers under `app/Http/Controllers/Api`:
  - `AuthController`: Handles login, register, logout, and token issue via Sanctum.
  - `EmployeeController`: Handles CRUD operations, search, filters by department/status, and profile photo upload.
  - `DepartmentController`: Handles CRUD for departments and assigns managers.
  - `AttendanceController`: Handles clock-in/clock-out status check, and logs.
  - `LeaveController`: Handles leave submission, manager reviews, and status approvals.
  - `DashboardController`: Compiles statistics (total headcount, present today, pending leaves, department distribution) for dashboard widgets.

#### [NEW] [Routes](file:///c:/xampp/htdocs/AI-Projects/emp/backend/routes/api.php)
Expose RESTful routes:
- `/auth/login`, `/auth/register` (Public)
- Protected via `auth:sanctum`:
  - `/auth/me`, `/auth/logout`
  - `/dashboard/stats`
  - `/employees` (Index, Store, Show, Update, Destroy)
  - `/departments` (Index, Store, Show, Update, Destroy)
  - `/attendance/status`, `/attendance/clock-in`, `/attendance/clock-out`, `/attendance/logs`
  - `/leaves` (Index, Store, Update)

---

### Component 2: React Frontend

The React frontend provides a responsive single page application (SPA).

#### [NEW] [Vite App Configuration](file:///c:/xampp/htdocs/AI-Projects/emp/frontend)
- React project structured with Vite.
- Custom Axios setup to communicate with the Laravel backend including token handling.

#### [NEW] [Vanilla CSS Theme](file:///c:/xampp/htdocs/AI-Projects/emp/frontend/src/index.css)
Global styling with high-end, responsive white and blue theme:
- Primary Color: Royal Blue (`#0066cc` / `#1a73e8`)
- Secondary/Accent Color: Dark Slate (`#0f172a`)
- Backgrounds: Very light gray-blue (`#f4f6fa`), card white (`#ffffff`)
- Highlights: Soft animations on inputs, card hover shadows, sliding sidebars.

#### [NEW] [React Components & Views](file:///c:/xampp/htdocs/AI-Projects/emp/frontend/src/components)
1. **Sidebar Navigation**: Responsive panels for switching views.
2. **Dashboard**: Statistical metrics with CSS grids, charts (using Canvas/CSS gradients or a small chart library like Chart.js/Recharts), recent logs.
3. **Employee Module**:
   - Directory table/grid with interactive search and pagination.
   - Profile view showing details, attendance, and leave charts.
   - Form modals for adding and updating employees.
4. **Department Module**:
   - Card listings for departments with member listings.
   - Quick manager assignment forms.
5. **Attendance Portal**:
   - Clock-in and clock-out action triggers.
   - Live timer component displaying elapsed shift hours.
6. **Leave Manager**:
   - Calendar date picker for requesting leave.
   - Table for administrators to review and update leave request statuses.

---

## Verification Plan

### Automated Tests & Code Quality
- Run database migrations: `php artisan migrate --seed` to populate test users and departments.
- Manual API inspection using curl or script verification.

### Manual Verification
1. **Responsive Testing:** Open React client in the browser; toggle between mobile views and desktop views to verify sidebar and grid layouts.
2. **User Flows:**
   - Log in as Admin -> Create a Department -> Add an Employee.
   - Log in as Employee -> Check-in/Clock-in -> Submit Leave Request.
   - Log in as Admin/Manager -> View updated Dashboard stats -> Approve leave request -> Verify employee status.
