import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, Eye, X, Upload,
  User, Mail, Phone, MapPin, Briefcase, DollarSign, Calendar,
} from 'lucide-react';
import api from '../api';

const BACKEND = 'http://127.0.0.1:8000/storage';

const Avatar = ({ employee, size = 44 }) => {
  const initials = `${employee.first_name?.[0] ?? ''}${employee.last_name?.[0] ?? ''}`.toUpperCase();
  if (employee.profile_picture) {
    return (
      <img
        src={`${BACKEND}/${employee.profile_picture}`}
        alt={initials}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', backgroundColor: 'var(--primary-light)',
      color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.33,
    }}>{initials}</div>
  );
};

const EmployeeForm = ({ employee, departments, onClose, onSaved }) => {
  const isEdit = Boolean(employee);
  const [form, setForm] = useState({
    first_name: employee?.first_name || '',
    last_name: employee?.last_name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    date_of_birth: employee?.date_of_birth || '',
    gender: employee?.gender || '',
    date_of_joining: employee?.date_of_joining || '',
    department_id: employee?.department_id || '',
    designation: employee?.designation || '',
    salary: employee?.salary || '',
    status: employee?.status || 'Active',
    address: employee?.address || '',
    create_user_account: false,
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('profile_picture', photo);

      if (isEdit) {
        fd.append('_method', 'PUT');
        await api.post(`/employees/${employee.id}/update`, fd);
      } else {
        await api.post('/employees', fd);
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
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Employee' : 'Add New Employee'}</span>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert-box danger" style={{ marginBottom: '16px' }}>{error}</div>}
          <form id="emp-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input name="first_name" className="form-control" value={form.first_name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input name="last_name" className="form-control" value={form.last_name} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input name="email" type="email" className="form-control" value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input name="phone" className="form-control" value={form.phone} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input name="date_of_birth" type="date" className="form-control" value={form.date_of_birth} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select name="gender" className="form-control" value={form.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date of Joining *</label>
                <input name="date_of_joining" type="date" className="form-control" value={form.date_of_joining} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select name="department_id" className="form-control" value={form.department_id} onChange={handleChange}>
                  <option value="">No Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Designation *</label>
                <input name="designation" className="form-control" value={form.designation} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Salary *</label>
                <input name="salary" type="number" className="form-control" value={form.salary} onChange={handleChange} required min="0" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Profile Photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', border: '1px dashed var(--border-color)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <Upload size={16} />
                    {photo ? photo.name : 'Upload photo'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setPhoto(e.target.files[0])} />
                  </label>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea name="address" className="form-control" rows={2} value={form.address} onChange={handleChange} style={{ minHeight: '60px' }} />
            </div>
            {!isEdit && (
              <label className="form-checkbox">
                <input type="checkbox" name="create_user_account" checked={form.create_user_account} onChange={handleChange} />
                Create a login account for this employee (default password: <code>password</code>)
              </label>
            )}
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="emp-form" type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Employee'}
          </button>
        </div>
      </div>
    </div>
  );
};

const EmployeeDetail = ({ employee, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState('info');
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <span className="modal-title">Employee Profile</span>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="profile-header" style={{ padding: '20px', marginBottom: '20px' }}>
            <Avatar employee={employee} size={80} />
            <div className="profile-meta">
              <div className="profile-title" style={{ fontSize: '20px' }}>{employee.full_name}</div>
              <div className="profile-subtitle">{employee.designation} · {employee.department?.name || 'No Department'}</div>
              <div className="profile-badges">
                <span className={`badge ${employee.status}`}>{employee.status}</span>
                <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, background: 'var(--primary-light)', padding: '2px 10px', borderRadius: '12px' }}>{employee.employee_code}</span>
              </div>
            </div>
          </div>

          <div className="tab-header">
            {['info', 'attendance', 'leaves'].map(tab => (
              <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
              {[
                { icon: Mail, label: 'Email', val: employee.email },
                { icon: Phone, label: 'Phone', val: employee.phone || '—' },
                { icon: Calendar, label: 'Joined', val: employee.date_of_joining },
                { icon: User, label: 'Gender', val: employee.gender || '—' },
                { icon: DollarSign, label: 'Salary', val: `$${Number(employee.salary).toLocaleString()}` },
                { icon: Briefcase, label: 'Department', val: employee.department?.name || '—' },
                { icon: MapPin, label: 'Address', val: employee.address || '—' },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: 'var(--bg-main)', borderRadius: '8px' }}>
                  <Icon size={16} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                    <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>{val}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Status</th></tr></thead>
                <tbody>
                  {employee.attendances?.length > 0
                    ? employee.attendances.map(a => (
                        <tr key={a.id}>
                          <td>{a.date}</td>
                          <td>{a.clock_in}</td>
                          <td>{a.clock_out || '—'}</td>
                          <td><span className={`badge ${a.status}`}>{a.status}</span></td>
                        </tr>
                      ))
                    : <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No attendance records</td></tr>
                  }
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'leaves' && (
            <div className="table-responsive">
              <table className="table">
                <thead><tr><th>Type</th><th>From</th><th>To</th><th>Status</th><th>Reason</th></tr></thead>
                <tbody>
                  {employee.leaves?.length > 0
                    ? employee.leaves.map(l => (
                        <tr key={l.id}>
                          <td><span className="leave-request-type">{l.leave_type}</span></td>
                          <td>{l.start_date}</td>
                          <td>{l.end_date}</td>
                          <td><span className={`badge ${l.status}`}>{l.status}</span></td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.reason}</td>
                        </tr>
                      ))
                    : <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No leave records</td></tr>
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => { onClose(); onEdit(employee); }}><Edit2 size={14} /> Edit</button>
        </div>
      </div>
    </div>
  );
};

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [viewEmployee, setViewEmployee] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, search, department_id: deptFilter, status: statusFilter, per_page: 10 };
      const [empRes, deptRes] = await Promise.all([
        api.get('/employees', { params }),
        api.get('/departments'),
      ]);
      setEmployees(empRes.data.data);
      setMeta({ total: empRes.data.total, last_page: empRes.data.last_page, current_page: empRes.data.current_page, per_page: empRes.data.per_page });
      setDepartments(deptRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search, deptFilter, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee? This action cannot be undone.')) return;
    try {
      await api.delete(`/employees/${id}`);
      fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Delete failed.'); }
  };

  const handleViewEmployee = async (emp) => {
    try {
      const res = await api.get(`/employees/${emp.id}`);
      setViewEmployee(res.data);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="page-container">
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-wrapper">
            <Search className="search-icon" size={16} />
            <input className="form-control search-control" placeholder="Search employees..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="toolbar-filters">
            <select className="form-control" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }} style={{ minWidth: '160px' }}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="form-control" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ minWidth: '120px' }}>
              <option value="">All Status</option>
              <option>Active</option><option>Inactive</option><option>Suspended</option><option>Terminated</option>
            </select>
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => { setEditEmployee(null); setShowForm(true); }}>
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {loading ? (
        <div className="spinner-wrapper"><div className="spinner" /></div>
      ) : employees.length === 0 ? (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No employees found.</div></div>
      ) : (
        <>
          <div className="table-responsive" style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar employee={emp} size={36} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{emp.full_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--primary)' }}>{emp.employee_code}</td>
                    <td>{emp.department?.name || '—'}</td>
                    <td>{emp.designation}</td>
                    <td><span className={`badge ${emp.status}`}>{emp.status}</span></td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{emp.date_of_joining}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleViewEmployee(emp)}><Eye size={14} /></button>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditEmployee(emp); setShowForm(true); }}><Edit2 size={14} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-bar">
            <span>Showing {((meta.current_page - 1) * meta.per_page) + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} employees</span>
            <div className="pagination-controls">
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Prev</button>
              <span style={{ padding: '0 8px', fontSize: '13px', color: 'var(--text-muted)' }}>{meta.current_page} / {meta.last_page}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= meta.last_page}>Next</button>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <EmployeeForm
          employee={editEmployee}
          departments={departments}
          onClose={() => { setShowForm(false); setEditEmployee(null); }}
          onSaved={() => { setShowForm(false); setEditEmployee(null); fetchData(); }}
        />
      )}

      {viewEmployee && (
        <EmployeeDetail
          employee={viewEmployee}
          onClose={() => setViewEmployee(null)}
          onEdit={(emp) => { setEditEmployee(emp); setShowForm(true); }}
        />
      )}
    </div>
  );
};

export default Employees;
