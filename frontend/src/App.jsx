import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardHome from './pages/DashboardHome';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Shell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          {/* Dashboard Home */}
          <Route index element={<DashboardHome />} />

          {/* Admin/Manager only routes */}
          <Route
            path="employees"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="departments"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Departments />
              </ProtectedRoute>
            }
          />
          <Route
            path="attendance"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="leaves"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Leaves />
              </ProtectedRoute>
            }
          />

          {/* Employee-only routes */}
          <Route
            path="my-attendance"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="my-leaves"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <Leaves isEmployee />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
