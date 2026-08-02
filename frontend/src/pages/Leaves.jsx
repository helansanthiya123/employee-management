import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Check, X, Calendar, Clock, FileText } from 'lucide-react';
import api from '../api';

const LeaveForm = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ leave_type: 'Casual', start_date: '', end_date: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/leaves', form);
      onSaved();
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) setError(Object.values(errs).flat()[0]);
      else setError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <span className="modal-title">Apply for Leave</span>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert-box danger">{error}</div>}
          <form id="leave-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Leave Type *</label>
              <select className="form-control" value={form.leave_type} onChange={e => setForm(p => ({ ...p, leave_type: e.target.value }))} required>
                <option value="Casual">Casual</option>
                <option value="Sick">Sick</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input type="date" className="form-control" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">End Date *</label>
                <input type="date" className="form-control" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Reason *</label>
              <textarea className="form-control" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} rows={4} required placeholder="Briefly describe your reason for leave..." />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="leave-form" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

const HourlyPermissionForm = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], start_time: '10:00', end_time: '12:00', reason: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/hourly-permissions', form);
      onSaved();
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) setError(Object.values(errs).flat()[0]);
      else setError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <span className="modal-title">Apply for Hourly Permission</span>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert-box danger">{error}</div>}
          <form id="permission-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Permission Date *</label>
              <input type="date" className="form-control" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input type="time" className="form-control" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">End Time *</label>
                <input type="time" className="form-control" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Reason *</label>
              <textarea className="form-control" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} rows={3} required placeholder="State your reason for permission (e.g. Doctor appointment, Personal emergency)..." />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="permission-form" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Permission Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

const LeaveCard = ({ leave, isAdmin, onAction }) => {
  const initials = leave.employee
    ? `${leave.employee.first_name?.[0] ?? ''}${leave.employee.last_name?.[0] ?? ''}`.toUpperCase()
    : '?';

  const dayCount = (() => {
    const s = new Date(leave.start_date);
    const e = new Date(leave.end_date);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  })();

  return (
    <div className="leave-request-card">
      <div className="leave-request-header">
        {isAdmin && (
          <div className="leave-request-employee">
            <div className="leave-request-avatar">{initials}</div>
            <div>
              <div className="leave-request-name">{leave.employee?.full_name || leave.employee ? `${leave.employee.first_name} ${leave.employee.last_name}` : 'Unknown'}</div>
              <div className="leave-request-dept">{leave.employee?.department?.name || 'No Department'}</div>
            </div>
          </div>
        )}
        <span className={`badge ${leave.status}`}>{leave.status}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="leave-request-type">{leave.leave_type} Leave</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
          <Calendar size={14} />
          {dayCount} Day{dayCount !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text-dark)', fontWeight: 600 }}>
        {leave.start_date} → {leave.end_date}
      </div>

      <div className="leave-request-reason">{leave.reason}</div>

      {leave.approved_by && leave.approver && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {leave.status === 'Approved' ? '✓ Approved' : '✗ Rejected'} by {leave.approver.name}
        </div>
      )}

      {isAdmin && leave.status === 'Pending' && (
        <div className="leave-request-actions">
          <button className="btn btn-success btn-sm" onClick={() => onAction(leave.id, 'Approved')}>
            <Check size={14} /> Approve
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => onAction(leave.id, 'Rejected')}>
            <X size={14} /> Reject
          </button>
        </div>
      )}
    </div>
  );
};

const Leaves = ({ isEmployee = false }) => {
  const [activeTab, setActiveTab] = useState('leaves'); // 'leaves' | 'permissions'
  const [leaves, setLeaves] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showPermForm, setShowPermForm] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = ['admin', 'manager'].includes(user.role);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/leaves', { params });
      setLeaves(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [statusFilter]);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/hourly-permissions');
      setPermissions(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'leaves') fetchLeaves();
    else fetchPermissions();
  }, [activeTab, fetchLeaves, fetchPermissions]);

  const handleLeaveAction = async (id, status) => {
    try {
      await api.put(`/leaves/${id}`, { status });
      setActionMsg({ type: 'success', text: `Leave ${status.toLowerCase()} successfully.` });
      fetchLeaves();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      setActionMsg({ type: 'danger', text: err.response?.data?.message || 'Action failed.' });
    }
  };

  const handlePermAction = async (id, status) => {
    try {
      await api.put(`/hourly-permissions/${id}`, { status });
      setActionMsg({ type: 'success', text: `Permission ${status.toLowerCase()} successfully.` });
      fetchPermissions();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      setActionMsg({ type: 'danger', text: err.response?.data?.message || 'Action failed.' });
    }
  };

  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedLeavesCount = leaves.filter(l => l.status === 'Approved').length;

  const pendingPermsCount = permissions.filter(p => p.status === 'Pending').length;

  return (
    <div className="page-container">
      {actionMsg && <div className={`alert-box ${actionMsg.type}`}>{actionMsg.text}</div>}

      {/* Tabs Header */}
      <div className="tab-container" style={{ display: 'flex', gap: '12px', borderBottom: '2px solid var(--border-color)', marginBottom: '20px' }}>
        <button
          className={`tab-btn ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaves')}
          style={{
            padding: '12px 20px',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'leaves' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'leaves' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Calendar size={16} /> Leave Requests
          {pendingLeavesCount > 0 && <span className="tab-badge">{pendingLeavesCount}</span>}
        </button>

        <button
          className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
          style={{
            padding: '12px 20px',
            fontWeight: 600,
            fontSize: '14px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'permissions' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'permissions' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Clock size={16} /> Hourly Permissions
          {pendingPermsCount > 0 && <span className="tab-badge warning">{pendingPermsCount}</span>}
        </button>
      </div>

      {/* LEAVES TAB CONTENT */}
      {activeTab === 'leaves' && (
        <>
          {isAdmin && (
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
              {[
                { label: 'Pending Review', value: pendingLeavesCount, color: 'orange' },
                { label: 'Approved', value: approvedLeavesCount, color: 'green' },
                { label: 'Total Requests', value: leaves.length, color: 'blue' },
              ].map(s => (
                <div className="stat-card" key={s.label} style={{ padding: '16px 20px' }}>
                  <div className={`stat-icon ${s.color}`} style={{ width: '40px', height: '40px' }}>
                    <Calendar size={18} />
                  </div>
                  <div className="stat-details">
                    <span className="stat-label">{s.label}</span>
                    <span className="stat-value" style={{ fontSize: '22px' }}>{s.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="toolbar">
            <div className="toolbar-left">
              <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: '150px' }}>
                <option value="">All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>
            <div className="toolbar-right">
              {(!isAdmin || isEmployee) && (
                <button className="btn btn-primary" onClick={() => setShowLeaveForm(true)}>
                  <Plus size={16} /> Apply for Leave
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="spinner-wrapper"><div className="spinner" /></div>
          ) : leaves.length === 0 ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                No leave requests found.
                {!isAdmin && <div style={{ marginTop: '16px' }}><button className="btn btn-primary" onClick={() => setShowLeaveForm(true)}><Plus size={16} /> Apply for Leave</button></div>}
              </div>
            </div>
          ) : (
            <div className="leave-cards-grid">
              {leaves.map(leave => (
                <LeaveCard key={leave.id} leave={leave} isAdmin={isAdmin} onAction={handleLeaveAction} />
              ))}
            </div>
          )}
        </>
      )}

      {/* HOURLY PERMISSIONS TAB CONTENT */}
      {activeTab === 'permissions' && (
        <>
          <div className="toolbar">
            <div className="toolbar-left">
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>
                Request short 1 to 3 hour permissions during shift hours.
              </span>
            </div>
            <div className="toolbar-right">
              {(!isAdmin || isEmployee) && (
                <button className="btn btn-primary" onClick={() => setShowPermForm(true)}>
                  <Plus size={16} /> Request Hourly Permission
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="spinner-wrapper"><div className="spinner" /></div>
          ) : permissions.length === 0 ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                No hourly permission requests found.
                {(!isAdmin || isEmployee) && (
                  <div style={{ marginTop: '16px' }}>
                    <button className="btn btn-primary" onClick={() => setShowPermForm(true)}>
                      <Plus size={16} /> Request Hourly Permission
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="table-responsive card">
              <table className="table">
                <thead>
                  <tr>
                    {isAdmin && <th>Employee</th>}
                    <th>Date</th>
                    <th>Time Slot</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Status</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {permissions.map(perm => (
                    <tr key={perm.id}>
                      {isAdmin && (
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                            {perm.employee?.full_name || 'Employee'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {perm.employee?.department?.name || 'N/A'}
                          </div>
                        </td>
                      )}
                      <td style={{ fontWeight: 600 }}>{perm.date}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                          {perm.start_time} - {perm.end_time}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: 'var(--primary)' }}>
                          {perm.hours} hrs
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-dark)', maxWidth: '240px' }}>
                        {perm.reason}
                      </td>
                      <td>
                        <span className={`badge ${perm.status}`}>{perm.status}</span>
                      </td>
                      {isAdmin && (
                        <td>
                          {perm.status === 'Pending' ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="btn btn-success btn-sm" onClick={() => handlePermAction(perm.id, 'Approved')}>
                                <Check size={14} />
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handlePermAction(perm.id, 'Rejected')}>
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {perm.approver?.name ? `Reviewed by ${perm.approver.name}` : '—'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showLeaveForm && (
        <LeaveForm
          onClose={() => setShowLeaveForm(false)}
          onSaved={() => { setShowLeaveForm(false); fetchLeaves(); }}
        />
      )}

      {showPermForm && (
        <HourlyPermissionForm
          onClose={() => setShowPermForm(false)}
          onSaved={() => { setShowPermForm(false); fetchPermissions(); }}
        />
      )}
    </div>
  );
};

export default Leaves;
