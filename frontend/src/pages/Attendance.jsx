import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Coffee, List, Calendar as CalendarIcon } from 'lucide-react';
import api from '../api';
import AttendanceCalendar from '../components/AttendanceCalendar';

const Attendance = () => {
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empFilter, setEmpFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { employee_id: empFilter, start_date: startDate, end_date: endDate };
      const res = await api.get('/attendance/logs', { params });
      setLogs(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [empFilter, startDate, endDate]);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchLogs();
    }
  }, [viewMode, fetchLogs]);

  useEffect(() => {
    api.get('/employees', { params: { per_page: 200 } })
      .then(res => setEmployees(res.data.data))
      .catch(console.error);
  }, []);

  const getDuration = (clockIn, clockOut, totalBreakMins = 0) => {
    if (!clockOut) return '—';
    const [ih, im] = clockIn.split(':').map(Number);
    const [oh, om] = clockOut.split(':').map(Number);
    let mins = (oh * 60 + om) - (ih * 60 + im) - (totalBreakMins || 0);
    if (mins < 0) mins = 0;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const filtered = logs.filter(log => {
    if (!search) return true;
    const name = log.employee ? `${log.employee.first_name} ${log.employee.last_name}`.toLowerCase() : '';
    return name.includes(search.toLowerCase()) || log.date.includes(search);
  });

  return (
    <div className="page-container">
      {/* Top View Mode Switcher Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-dark)' }}>
          Attendance Tracking & Progress
        </h2>

        <div className="view-mode-toggle" style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '3px' }}>
          <button
            className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '6px',
              background: viewMode === 'calendar' ? '#ffffff' : 'transparent',
              color: viewMode === 'calendar' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: viewMode === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CalendarIcon size={15} /> Calendar View
          </button>
          <button
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '6px',
              background: viewMode === 'list' ? '#ffffff' : 'transparent',
              color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <List size={15} /> Log Table View
          </button>
        </div>
      </div>

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <AttendanceCalendar />
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <>
          <div className="toolbar">
            <div className="toolbar-left">
              <div className="search-wrapper">
                <Search className="search-icon" size={16} />
                <input className="form-control search-control" placeholder="Search by name or date..." value={search}
                  onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="form-control" value={empFilter} onChange={e => setEmpFilter(e.target.value)} style={{ minWidth: '180px' }}>
                <option value="">All Employees</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div className="toolbar-right" style={{ gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <Filter size={14} />
                <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '140px' }} title="From date" />
                <span>to</span>
                <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '140px' }} title="To date" />
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => { setEmpFilter(''); setStartDate(''); setEndDate(''); setSearch(''); }}>Clear</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '4px' }}>
            {['Present', 'Late', 'Absent'].map(status => {
              const count = logs.filter(l => l.status === status).length;
              const colors = { Present: 'green', Late: 'orange', Absent: 'red' };
              return (
                <div key={status} className="stat-card" style={{ flex: 1, padding: '16px 20px' }}>
                  <div className={`stat-icon ${colors[status]}`} style={{ width: '40px', height: '40px' }}>
                    {status === 'Present' ? '✓' : status === 'Late' ? '!' : '✗'}
                  </div>
                  <div className="stat-details">
                    <span className="stat-label">{status}</span>
                    <span className="stat-value" style={{ fontSize: '22px' }}>{count}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {loading ? (
            <div className="spinner-wrapper"><div className="spinner" /></div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Total Break</th>
                    <th>Net Worked</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map(log => (
                    <tr key={log.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                          {log.employee ? `${log.employee.first_name} ${log.employee.last_name}` : '—'}
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {log.employee?.department?.name || '—'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.date}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--success)' }}>{log.clock_in}</td>
                      <td style={{ fontFamily: 'monospace', color: log.clock_out ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {log.clock_out || '—'}
                      </td>
                      <td>
                        {log.total_break_minutes > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>
                            <Coffee size={13} /> {log.total_break_minutes}m
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>0m</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {getDuration(log.clock_in, log.clock_out, log.total_break_minutes)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <span className={`badge ${log.status}`}>{log.status}</span>
                          {log.is_on_break && <span className="badge" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>On Break</span>}
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.notes || '—'}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No attendance records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Attendance;
