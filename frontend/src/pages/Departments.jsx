import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Users, X, User } from 'lucide-react';
import api from '../api';

const DeptForm = ({ dept, users, onClose, onSaved }) => {
  const isEdit = Boolean(dept);
  const [form, setForm] = useState({
    name: dept?.name || '',
    description: dept?.description || '',
    manager_id: dept?.manager_id || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        await api.put(`/departments/${dept.id}`, form);
      } else {
        await api.post('/departments', form);
      }
      onSaved();
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) setError(Object.values(errs).flat()[0]);
      else setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Department' : 'New Department'}</span>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert-box danger">{error}</div>}
          <form id="dept-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Department Name *</label>
              <input name="name" className="form-control" value={form.name} onChange={handleChange} required placeholder="e.g. Engineering" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" className="form-control" value={form.description} onChange={handleChange} rows={3} placeholder="Brief description of this department's role..." />
            </div>
            <div className="form-group">
              <label className="form-label">Department Manager</label>
              <select name="manager_id" className="form-control" value={form.manager_id} onChange={handleChange}>
                <option value="">No Manager Assigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="submit" form="dept-form" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Department'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDept, setEditDept] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, empRes] = await Promise.all([
        api.get('/departments'),
        api.get('/employees', { params: { per_page: 100 } }),
      ]);
      setDepartments(deptRes.data);
      // Build a simple list of users from employees for manager selection
      setUsers(empRes.data.data.map(e => ({ id: e.user_id, name: e.full_name, email: e.email })).filter(u => u.id));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department? Employees in this department will be unassigned.')) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Delete failed.'); }
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';

  if (loading) return <div className="spinner-wrapper"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div className="toolbar">
        <div className="toolbar-left">
          <h3 style={{ fontSize: '15px', color: 'var(--text-dark)', margin: 0 }}>
            {departments.length} Department{departments.length !== 1 ? 's' : ''} Total
          </h3>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => { setEditDept(null); setShowForm(true); }}>
            <Plus size={16} /> New Department
          </button>
        </div>
      </div>

      {departments.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            No departments yet. Create one to get started.
          </div>
        </div>
      ) : (
        <div className="dept-grid">
          {departments.map(dept => (
            <div className="dept-card" key={dept.id}>
              <div className="dept-card-header">
                <div>
                  <div className="dept-card-title">{dept.name}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditDept(dept); setShowForm(true); }}><Edit2 size={13} /></button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(dept.id)}><Trash2 size={13} /></button>
                </div>
              </div>

              <p className="dept-card-desc">{dept.description || 'No description provided.'}</p>

              {dept.manager ? (
                <div className="dept-card-manager">
                  <div className="dept-card-manager-avatar">{getInitials(dept.manager.name)}</div>
                  <div className="dept-card-manager-info">
                    <span className="dept-card-manager-name">{dept.manager.name}</span>
                    <span className="dept-card-manager-label">Manager</span>
                  </div>
                </div>
              ) : (
                <div className="dept-card-manager" style={{ opacity: 0.6 }}>
                  <div className="dept-card-manager-avatar" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-muted)' }}><User size={12} /></div>
                  <div className="dept-card-manager-info">
                    <span className="dept-card-manager-name" style={{ color: 'var(--text-muted)' }}>No Manager Assigned</span>
                    <span className="dept-card-manager-label">Manager</span>
                  </div>
                </div>
              )}

              <div className="dept-card-stats">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <Users size={14} />
                  <span><strong className="dept-card-count">{dept.employees_count ?? 0}</strong> Employee{(dept.employees_count ?? 0) !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <DeptForm
          dept={editDept}
          users={users}
          onClose={() => { setShowForm(false); setEditDept(null); }}
          onSaved={() => { setShowForm(false); setEditDept(null); fetchData(); }}
        />
      )}
    </div>
  );
};

export default Departments;
