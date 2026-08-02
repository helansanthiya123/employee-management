import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Coffee, CheckCircle, XCircle, AlertCircle, X, User } from 'lucide-react';
import api from '../api';

const monthsList = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AttendanceCalendar = ({ isEmployee = false }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [calendarData, setCalendarData] = useState({ attendances: [], leaves: [] });
  const [loading, setLoading] = useState(true);
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = ['admin', 'manager'].includes(user.role);

  useEffect(() => {
    if (isAdmin) {
      api.get('/employees', { params: { per_page: 200 } })
        .then(res => setEmployees(res.data.data))
        .catch(console.error);
    }
  }, [isAdmin]);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const params = { month: currentMonth, year: currentYear };
      if (selectedEmp) params.employee_id = selectedEmp;
      const res = await api.get('/attendance/calendar', { params });
      setCalendarData(res.data);
    } catch (err) {
      console.error('Calendar load error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear, selectedEmp]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Build Month Grid Cells
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Map attendances & leaves by YYYY-MM-DD
  const attendanceMap = {};
  (calendarData.attendances || []).forEach(att => {
    attendanceMap[att.date] = att;
  });

  const leaveMap = {};
  (calendarData.leaves || []).forEach(lv => {
    const s = new Date(lv.start_date);
    const e = new Date(lv.end_date);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      leaveMap[key] = lv;
    }
  });

  const getDurationString = (att) => {
    if (!att || !att.clock_in || !att.clock_out) return null;
    const [ih, im] = att.clock_in.split(':').map(Number);
    const [oh, om] = att.clock_out.split(':').map(Number);
    let mins = (oh * 60 + om) - (ih * 60 + im) - (att.total_break_minutes || 0);
    if (mins < 0) mins = 0;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="card calendar-card">
      {/* Calendar Header & Toolbar */}
      <div className="card-header calendar-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary btn-sm" onClick={handlePrevMonth} title="Previous Month">
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)', minWidth: '160px', textAlign: 'center' }}>
            {monthsList[currentMonth - 1]} {currentYear}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={handleNextMonth} title="Next Month">
            <ChevronRight size={16} />
          </button>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={14} style={{ color: 'var(--text-muted)' }} />
            <select className="form-control" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} style={{ minWidth: '180px' }}>
              <option value="">All Employees</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="card-body" style={{ padding: '16px' }}>
        {loading ? (
          <div className="spinner-wrapper" style={{ padding: '40px' }}><div className="spinner" /></div>
        ) : (
          <div className="calendar-grid">
            {/* Days of Week Header */}
            {daysOfWeek.map(d => (
              <div key={d} className="calendar-weekday-header">{d}</div>
            ))}

            {/* Empty cells before 1st of month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="calendar-day-cell empty" />
            ))}

            {/* Month Day Cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = today.toISOString().split('T')[0] === dateStr;

              const att = attendanceMap[dateStr];
              const lv = leaveMap[dateStr];
              const dayOfWeek = new Date(currentYear, currentMonth - 1, dayNum).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              let statusClass = 'absent';
              let badgeText = 'Absent';

              if (att) {
                if (att.status === 'Present') { statusClass = 'present'; badgeText = 'Present'; }
                else if (att.status === 'Late') { statusClass = 'late'; badgeText = 'Late'; }
                else if (att.status === 'Leave') { statusClass = 'leave'; badgeText = 'Leave'; }
              } else if (lv) {
                statusClass = 'leave';
                badgeText = 'Leave';
              } else if (isWeekend) {
                statusClass = 'weekend';
                badgeText = 'Weekend';
              }

              const duration = att ? getDurationString(att) : null;

              return (
                <div
                  key={dateStr}
                  className={`calendar-day-cell ${statusClass} ${isToday ? 'today-cell' : ''}`}
                  onClick={() => setSelectedDayDetail({ dateStr, att, lv, isWeekend, dayNum })}
                >
                  <div className="day-cell-header">
                    <span className={`day-number ${isToday ? 'today-num' : ''}`}>{dayNum}</span>
                    <span className={`day-status-pill ${statusClass}`}>{badgeText}</span>
                  </div>

                  {att ? (
                    <div className="day-cell-content">
                      <div className="time-chip">
                        <Clock size={10} /> {att.clock_in} - {att.clock_out || 'Active'}
                      </div>
                      {duration && (
                        <div className="duration-chip">
                          ⚡ {duration}
                        </div>
                      )}
                      {att.is_on_break && (
                        <div className="break-chip">☕ On Break</div>
                      )}
                    </div>
                  ) : lv ? (
                    <div className="day-cell-content">
                      <div className="leave-chip">
                        {lv.leave_type} Leave
                      </div>
                    </div>
                  ) : isWeekend ? (
                    <div className="day-cell-content weekend-text">Off Day</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Day Detail Modal Popup */}
      {selectedDayDetail && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setSelectedDayDetail(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={18} style={{ color: 'var(--primary)' }} />
                Attendance Details: {selectedDayDetail.dateStr}
              </span>
              <button className="modal-close" onClick={() => setSelectedDayDetail(null)}><X size={20} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
              {/* Employee Info if present */}
              {selectedDayDetail.att?.employee && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div className="avatar-circle" style={{ width: '36px', height: '36px' }}>
                    <User size={18} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-dark)' }}>{selectedDayDetail.att.employee.first_name} {selectedDayDetail.att.employee.last_name}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedDayDetail.att.employee.department?.name || 'Employee'}</div>
                  </div>
                </div>
              )}

              {/* Status Badge Banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Shift Status:</span>
                <span className={`badge ${selectedDayDetail.att?.status || (selectedDayDetail.lv ? 'Leave' : selectedDayDetail.isWeekend ? 'Weekend' : 'Absent')}`}>
                  {selectedDayDetail.att?.status || (selectedDayDetail.lv ? `${selectedDayDetail.lv.leave_type} Leave` : selectedDayDetail.isWeekend ? 'Weekend Off' : 'Absent')}
                </span>
              </div>

              {selectedDayDetail.att ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="zoho-progress-box">
                      <span className="stat-sub-label">Clock In</span>
                      <strong style={{ color: '#10b981', fontSize: '16px', fontFamily: 'monospace' }}>
                        {selectedDayDetail.att.clock_in}
                      </strong>
                    </div>

                    <div className="zoho-progress-box">
                      <span className="stat-sub-label">Clock Out</span>
                      <strong style={{ color: selectedDayDetail.att.clock_out ? '#ef4444' : '#f59e0b', fontSize: '16px', fontFamily: 'monospace' }}>
                        {selectedDayDetail.att.clock_out || 'Active Shift'}
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f5f9', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
                    <span>Total Break Taken:</span>
                    <strong style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Coffee size={14} /> {selectedDayDetail.att.total_break_minutes || 0} mins
                    </strong>
                  </div>

                  {/* Break Breakdown list */}
                  {selectedDayDetail.att.breaks && selectedDayDetail.att.breaks.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Break Logs History</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {selectedDayDetail.att.breaks.map((b, idx) => (
                          <div key={idx} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#fafafa', border: '1px solid #eee', borderRadius: '4px' }}>
                            <span>Break {idx + 1}: {b.start} - {b.end}</span>
                            <strong>{b.duration} mins</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', background: '#eff6ff', padding: '12px 14px', borderRadius: '8px', fontSize: '14px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Net Active Worked:</span>
                    <strong style={{ color: 'var(--primary)', fontSize: '16px' }}>
                      {getDurationString(selectedDayDetail.att) || 'In Progress'}
                    </strong>
                  </div>

                  {selectedDayDetail.att.notes && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Notes: {selectedDayDetail.att.notes}
                    </div>
                  )}
                </>
              ) : selectedDayDetail.lv ? (
                <div style={{ background: '#fdf2f8', padding: '14px', borderRadius: '8px', border: '1px solid #fbcfe8' }}>
                  <strong style={{ color: '#be185d' }}>{selectedDayDetail.lv.leave_type} Leave Request</strong>
                  <p style={{ fontSize: '13px', color: '#9d174d', marginTop: '4px' }}>Reason: {selectedDayDetail.lv.reason}</p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                  No attendance clock-in records logged for this date.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedDayDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;
