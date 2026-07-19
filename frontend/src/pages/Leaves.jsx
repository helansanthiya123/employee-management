import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Check, X, Calendar } from 'lucide-react';
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
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
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

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleAction = async (id, status) => {
    try {
      await api.put(`/leaves/${id}`, { status });
      setActionMsg({ type: 'success', text: `Leave ${status.toLowerCase()} successfully.` });
      fetchLeaves();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      setActionMsg({ type: 'danger', text: err.response?.data?.message || 'Action failed.' });
    }
  };

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;

  return (
    <div className="page-container">
      {actionMsg && <div className={`alert-box ${actionMsg.type}`}>{actionMsg.text}</div>}

      {isAdmin && (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { label: 'Pending Review', value: pendingCount, color: 'orange' },
            { label: 'Approved', value: approvedCount, color: 'green' },
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
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
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
            {!isAdmin && <div style={{ marginTop: '16px' }}><button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Apply for Leave</button></div>}
          </div>
        </div>
      ) : (
        <div className="leave-cards-grid">
          {leaves.map(leave => (
            <LeaveCard key={leave.id} leave={leave} isAdmin={isAdmin} onAction={handleAction} />
          ))}
        </div>
      )}

      {showForm && (
        <LeaveForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchLeaves(); }}
        />
      )}
    </div>
  );
};

export default Leaves;
