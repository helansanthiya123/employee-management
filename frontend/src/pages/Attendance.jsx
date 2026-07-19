import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter } from 'lucide-react';
import api from '../api';

const Attendance = () => {
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

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    api.get('/employees', { params: { per_page: 200 } })
      .then(res => setEmployees(res.data.data))
      .catch(console.error);
  }, []);

  const getDuration = (clockIn, clockOut) => {
    if (!clockOut) return '—';
    const [ih, im] = clockIn.split(':').map(Number);
    const [oh, om] = clockOut.split(':').map(Number);
    const mins = (oh * 60 + om) - (ih * 60 + im);
    if (mins < 0) return '—';
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
                <th>Duration</th>
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
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {getDuration(log.clock_in, log.clock_out)}
                  </td>
                  <td><span className={`badge ${log.status}`}>{log.status}</span></td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.notes || '—'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Attendance;
