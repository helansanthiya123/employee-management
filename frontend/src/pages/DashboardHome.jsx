import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Briefcase, CheckCircle, Calendar, Clock,
  XCircle, AlertCircle, LogIn, LogOut, TrendingUp,
  Activity,
} from 'lucide-react';
import api from '../api';

const iconMap = {
  users: Users, briefcase: Briefcase, 'check-circle': CheckCircle,
  calendar: Calendar, clock: Clock, 'x-circle': XCircle,
  'alert-circle': AlertCircle, 'calendar-check': CheckCircle,
};

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      <div className="widget-clock">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
      <div className="widget-date">{time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </>
  );
};

const DepartmentChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="chart-container">
      {data.map((dept, i) => {
        const heightPct = max > 0 ? (dept.count / max) * 100 : 0;
        return (
          <div className="chart-bar-wrapper" key={i}>
            <div className="chart-bar" style={{ height: `${Math.max(heightPct, 4)}%`, backgroundColor: `hsl(${220 - i * 30}, 70%, ${50 + i * 5}%)` }}>
              <span className="chart-bar-value">{dept.count}</span>
            </div>
            <div className="chart-bar-label">{dept.name}</div>
          </div>
        );
      })}
    </div>
  );
};

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdminOrManager = ['admin', 'manager'].includes(user.role);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, attRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/attendance/status'),
      ]);
      setStats(statsRes.data);
      setAttendance(attRes.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleClockIn = async () => {
    setClockLoading(true);
    setMessage(null);
    try {
      await api.post('/attendance/clock-in');
      setMessage({ type: 'success', text: 'Clocked in successfully! Have a great day.' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Clock in failed.' });
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockLoading(true);
    setMessage(null);
    try {
      await api.post('/attendance/clock-out');
      setMessage({ type: 'success', text: 'Clocked out successfully! See you tomorrow.' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Clock out failed.' });
    } finally {
      setClockLoading(false);
    }
  };

  if (loading) return <div className="spinner-wrapper"><div className="spinner" /></div>;

  const alreadyClockedIn = attendance?.attendance && !attendance?.attendance?.clock_out;
  const alreadyClockedOut = attendance?.attendance?.clock_out;
  const canClock = attendance?.can_clock;

  return (
    <div className="page-container">
      {/* KPI Summary Cards */}
      {stats?.summary && (
        <div className="dashboard-grid">
          {stats.summary.map((stat, i) => {
            const Icon = iconMap[stat.icon] || TrendingUp;
            return (
              <div className="stat-card" key={i}>
                <div className={`stat-icon ${stat.color}`}><Icon size={24} /></div>
                <div className="stat-details">
                  <span className="stat-label">{stat.label}</span>
                  <span className="stat-value">{stat.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Department Distribution Chart (admin/manager only) */}
          {isAdminOrManager && stats?.department_distribution && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Department Distribution</span>
                {stats.attendance_rate !== undefined && (
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Attendance Rate: <strong style={{ color: 'var(--primary)' }}>{stats.attendance_rate}%</strong>
                  </span>
                )}
              </div>
              <div className="card-body">
                <DepartmentChart data={stats.department_distribution} />
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {stats?.recent_activity && stats.recent_activity.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} /> Recent Activity
                </span>
              </div>
              <div className="card-body">
                <div className="activity-list">
                  {stats.recent_activity.map((item, i) => (
                    <div key={i} className={`activity-item ${item.type} ${item.status?.toLowerCase()}`}>
                      <div className="activity-details">
                        <div className="activity-title">{item.title}</div>
                        <div className="activity-meta">
                          <span>{item.date}</span>
                          <span>·</span>
                          <span>{item.time}</span>
                          <span>·</span>
                          <span className={`badge ${item.status}`}>{item.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Attendance Clock Widget */}
          <div className="attendance-widget">
            <h3>My Attendance</h3>
            <LiveClock />

            {message && (
              <div style={{
                backgroundColor: message.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: message.type === 'success' ? '#6ee7b7' : '#fca5a5',
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px',
              }}>
                {message.text}
              </div>
            )}

            {canClock ? (
              <>
                {!alreadyClockedIn && !alreadyClockedOut ? (
                  <div className="attendance-status-pill">Not clocked in yet</div>
                ) : alreadyClockedIn ? (
                  <div className="attendance-status-pill" style={{ color: '#86efac', borderColor: '#86efac' }}>
                    Clocked in at {attendance.attendance.clock_in}
                  </div>
                ) : (
                  <div className="attendance-status-pill" style={{ color: '#fca5a5', borderColor: '#fca5a5' }}>
                    Clocked out at {attendance.attendance.clock_out}
                  </div>
                )}

                {!alreadyClockedIn && !alreadyClockedOut ? (
                  <button className="attendance-btn clock-in" onClick={handleClockIn} disabled={clockLoading}>
                    <LogIn size={16} style={{ marginRight: '8px' }} />
                    {clockLoading ? 'Processing...' : 'Clock In'}
                  </button>
                ) : alreadyClockedIn ? (
                  <button className="attendance-btn clock-out" onClick={handleClockOut} disabled={clockLoading}>
                    <LogOut size={16} style={{ marginRight: '8px' }} />
                    {clockLoading ? 'Processing...' : 'Clock Out'}
                  </button>
                ) : (
                  <button className="attendance-btn disabled" disabled>
                    <CheckCircle size={16} style={{ marginRight: '8px' }} />
                    Day Complete
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="attendance-status-pill">Admin / Manager Account</div>
                <button className="attendance-btn disabled" disabled>Attendance via employee portal</button>
              </>
            )}
          </div>

          {/* Quick Info Card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Quick Info</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Logged in as</span>
                  <strong style={{ color: 'var(--text-dark)', textTransform: 'capitalize' }}>{user.role}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Email</span>
                  <strong style={{ color: 'var(--text-dark)', fontSize: '12px' }}>{user.email}</strong>
                </div>
                <div style={{ height: '1px', backgroundColor: 'var(--border-color)' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  {isAdminOrManager
                    ? 'You have administrative access to manage employees, departments, attendance, and leave requests.'
                    : 'Use the sidebar to check your attendance and manage leave requests.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
