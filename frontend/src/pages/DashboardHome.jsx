import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Briefcase, CheckCircle, Calendar, Clock,
  XCircle, AlertCircle, LogIn, LogOut, TrendingUp,
  Activity, Coffee, Play, Sparkles
} from 'lucide-react';
import api from '../api';
import ClockProgress from '../components/ClockProgress';
import BirthdayWidget from '../components/BirthdayWidget';
import WeeklyProgress from '../components/WeeklyProgress';

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

  const handleStartBreak = async () => {
    setClockLoading(true);
    setMessage(null);
    try {
      await api.post('/attendance/start-break');
      setMessage({ type: 'success', text: 'Break started! Enjoy your break.' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Start break failed.' });
    } finally {
      setClockLoading(false);
    }
  };

  const handleResumeWork = async () => {
    setClockLoading(true);
    setMessage(null);
    try {
      await api.post('/attendance/resume-work');
      setMessage({ type: 'success', text: 'Resumed work! Welcome back.' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Resume work failed.' });
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

  const currentAtt = attendance?.attendance;
  const alreadyClockedIn = currentAtt && !currentAtt.clock_out;
  const alreadyClockedOut = currentAtt && currentAtt.clock_out;
  const isOnBreak = currentAtt?.is_on_break && alreadyClockedIn;
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

          {/* Weekly Progress Widget (Zoho Style) */}
          <WeeklyProgress currentAttendance={attendance?.attendance} />

          {/* Birthday Widget */}
          <BirthdayWidget />

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

            {/* Realtime Clock Progress Line */}
            {currentAtt && (
              <ClockProgress attendance={currentAtt} targetHours={8} />
            )}

            {message && (
              <div style={{
                backgroundColor: message.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: message.type === 'success' ? '#6ee7b7' : '#fca5a5',
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', marginTop: '12px',
              }}>
                {message.text}
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              {!currentAtt ? (
                <div className="attendance-status-pill">Not clocked in yet</div>
              ) : alreadyClockedIn && isOnBreak ? (
                <div className="attendance-status-pill" style={{ color: '#f59e0b', borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)' }}>
                  ☕ Currently On Break
                </div>
              ) : alreadyClockedIn ? (
                <div className="attendance-status-pill" style={{ color: '#86efac', borderColor: '#86efac' }}>
                  Clocked in at {currentAtt.clock_in}
                </div>
              ) : (
                <div className="attendance-status-pill" style={{ color: '#fca5a5', borderColor: '#fca5a5' }}>
                  Clocked out at {currentAtt.clock_out}
                </div>
              )}

              {/* Clock Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'center' }}>
                {!currentAtt ? (
                  <button className="attendance-btn clock-in" onClick={handleClockIn} disabled={clockLoading} style={{ flex: 1 }}>
                    <LogIn size={16} style={{ marginRight: '8px' }} />
                    {clockLoading ? 'Processing...' : 'Clock In'}
                  </button>
                ) : alreadyClockedIn ? (
                  <>
                    {isOnBreak ? (
                      <button className="attendance-btn resume-btn" onClick={handleResumeWork} disabled={clockLoading} style={{ flex: 1, backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Play size={16} style={{ marginRight: '6px' }} />
                        {clockLoading ? 'Processing...' : 'Resume Work'}
                      </button>
                    ) : (
                      <button className="attendance-btn break-btn" onClick={handleStartBreak} disabled={clockLoading} style={{ flex: 1, backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '8px', padding: '10px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Coffee size={16} style={{ marginRight: '6px' }} />
                        {clockLoading ? 'Processing...' : 'Take Break'}
                      </button>
                    )}

                    <button className="attendance-btn clock-out" onClick={handleClockOut} disabled={clockLoading} style={{ flex: 1 }}>
                      <LogOut size={16} style={{ marginRight: '6px' }} />
                      {clockLoading ? 'Processing...' : 'Clock Out'}
                    </button>
                  </>
                ) : (
                  <button className="attendance-btn disabled" disabled style={{ width: '100%' }}>
                    <CheckCircle size={16} style={{ marginRight: '8px' }} />
                    Day Complete
                  </button>
                )}
              </div>
            </div>
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
                    ? 'You have administrative access to manage employees, departments, attendance, break logs, and hourly permissions.'
                    : 'Use the sidebar to manage your attendance, breaks, leaves, and hourly permissions.'}
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
