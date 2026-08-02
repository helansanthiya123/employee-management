import React, { useState, useEffect } from 'react';
import { Clock, Coffee, CheckCircle, AlertCircle } from 'lucide-react';

const ClockProgress = ({ attendance, targetHours = 8 }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!attendance || !attendance.clock_in) return null;

  const dateStr = attendance.date;
  const [h, m, s] = attendance.clock_in.split(':').map(Number);
  const clockInTime = new Date(dateStr);
  clockInTime.setHours(h, m, s || 0, 0);

  let clockOutTime = null;
  if (attendance.clock_out) {
    const [oh, om, os] = attendance.clock_out.split(':').map(Number);
    clockOutTime = new Date(dateStr);
    clockOutTime.setHours(oh, om, os || 0, 0);
  }

  const effectiveEnd = clockOutTime || now;

  // Elapsed total time in seconds
  const totalElapsedSecs = Math.max(0, Math.floor((effectiveEnd - clockInTime) / 1000));

  // Past finished breaks in seconds
  let pastBreakSecs = (attendance.total_break_minutes || 0) * 60;

  // Current active break duration if on break
  let currentBreakSecs = 0;
  if (attendance.is_on_break && attendance.break_start && !attendance.clock_out) {
    const breakStart = new Date(attendance.break_start);
    currentBreakSecs = Math.max(0, Math.floor((now - breakStart) / 1000));
  }

  const totalBreakSecs = pastBreakSecs + currentBreakSecs;
  const activeWorkSecs = Math.max(0, totalElapsedSecs - totalBreakSecs);

  const targetSecs = targetHours * 3600;
  const progressPct = Math.min(100, Math.max(0, (activeWorkSecs / targetSecs) * 100));

  const formatSecs = (secs) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const sRem = secs % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${sRem}s`;
    }
    return `${mins}m ${sRem}s`;
  };

  const remainingSecs = Math.max(0, targetSecs - activeWorkSecs);

  const isCompleted = !!attendance.clock_out;
  const isOnBreak = attendance.is_on_break && !isCompleted;

  let barClass = 'progress-bar-fill active';
  let statusBadge = { label: 'Active Work', color: '#10b981', bg: 'rgba(16,185,129,0.15)' };

  if (isCompleted) {
    barClass = 'progress-bar-fill complete';
    statusBadge = { label: 'Shift Complete', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' };
  } else if (isOnBreak) {
    barClass = 'progress-bar-fill break';
    statusBadge = { label: 'On Break', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
  }

  return (
    <div className="clock-progress-container">
      <div className="clock-progress-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-dark)' }}>
            Workshift Progress ({targetHours}h Target)
          </span>
        </div>
        <span
          className="badge-pill"
          style={{
            backgroundColor: statusBadge.bg,
            color: statusBadge.color,
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {statusBadge.label}
        </span>
      </div>

      {/* Progress Track */}
      <div className="progress-line-track">
        <div
          className={barClass}
          style={{ width: `${progressPct}%` }}
        >
          <div className="progress-thumb-glow" />
        </div>
      </div>

      {/* Sub Stats Row */}
      <div className="clock-progress-stats">
        <div className="progress-stat-item">
          <span className="stat-sub-label">Worked</span>
          <strong className="stat-sub-val" style={{ color: '#10b981' }}>
            {formatSecs(activeWorkSecs)}
          </strong>
        </div>

        <div className="progress-stat-item">
          <span className="stat-sub-label">Break</span>
          <strong className="stat-sub-val" style={{ color: isOnBreak ? '#f59e0b' : 'var(--text-muted)' }}>
            {formatSecs(totalBreakSecs)}
          </strong>
        </div>

        <div className="progress-stat-item">
          <span className="stat-sub-label">Remaining</span>
          <strong className="stat-sub-val" style={{ color: 'var(--text-muted)' }}>
            {isCompleted ? '0m' : formatSecs(remainingSecs)}
          </strong>
        </div>

        <div className="progress-stat-item" style={{ textAlign: 'right' }}>
          <span className="stat-sub-label">Progress</span>
          <strong className="stat-sub-val" style={{ color: 'var(--primary)' }}>
            {progressPct.toFixed(1)}%
          </strong>
        </div>
      </div>
    </div>
  );
};

export default ClockProgress;
