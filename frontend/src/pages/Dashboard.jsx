import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  LogOut,
} from 'lucide-react';
import api from '../api';

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate, location]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('employee');
      navigate('/login');
    }
  };

  if (!user) return null;

  const isAdminOrManager = ['admin', 'manager'].includes(user.role);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/employees')) return 'Employee Directory';
    if (path.startsWith('/departments')) return 'Department Management';
    if (path.startsWith('/attendance') || path.startsWith('/my-attendance')) return 'Attendance Ledger';
    if (path.startsWith('/leaves') || path.startsWith('/my-leaves')) return 'Leave Management';
    return 'Workspace';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className={`app-container ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-icon">
            <LayoutDashboard size={20} />
          </div>
          <span className="brand-name">Apex Employee</span>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {getInitials(user.name)}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.name}</span>
            <span className="sidebar-user-role">{user.role}</span>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          <ul className="sidebar-menu">
            <li className={`sidebar-menu-item ${location.pathname === '/' ? 'active' : ''}`}>
              <Link to="/">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
            </li>

            {isAdminOrManager ? (
              <>
                <li className={`sidebar-menu-item ${location.pathname.startsWith('/employees') ? 'active' : ''}`}>
                  <Link to="/employees">
                    <Users size={18} />
                    <span>Employees</span>
                  </Link>
                </li>
                <li className={`sidebar-menu-item ${location.pathname.startsWith('/departments') ? 'active' : ''}`}>
                  <Link to="/departments">
                    <Briefcase size={18} />
                    <span>Departments</span>
                  </Link>
                </li>
                <li className={`sidebar-menu-item ${location.pathname.startsWith('/attendance') ? 'active' : ''}`}>
                  <Link to="/attendance">
                    <CalendarCheck size={18} />
                    <span>Attendance</span>
                  </Link>
                </li>
                <li className={`sidebar-menu-item ${location.pathname.startsWith('/leaves') ? 'active' : ''}`}>
                  <Link to="/leaves">
                    <CalendarDays size={18} />
                    <span>Leave Requests</span>
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li className={`sidebar-menu-item ${location.pathname.startsWith('/my-attendance') ? 'active' : ''}`}>
                  <Link to="/my-attendance">
                    <CalendarCheck size={18} />
                    <span>My Attendance</span>
                  </Link>
                </li>
                <li className={`sidebar-menu-item ${location.pathname.startsWith('/my-leaves') ? 'active' : ''}`}>
                  <Link to="/my-leaves">
                    <CalendarDays size={18} />
                    <span>My Leaves</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout} style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <LogOut size={16} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="navbar">
          <div className="navbar-left">
            <button className="menu-toggle" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <h1 className="navbar-title">{getPageTitle()}</h1>
          </div>

          <div className="navbar-right">
            <div className="navbar-user-profile">
              <div className="user-avatar-sm">
                {getInitials(user.name)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', lineHeight: '1.2' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{user.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'capitalize' }}>{user.role}</span>
              </div>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, backgroundColor: 'var(--bg-main)' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
