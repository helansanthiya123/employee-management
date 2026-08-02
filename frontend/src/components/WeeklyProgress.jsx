import React, { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, Zap } from 'lucide-react';
import api from '../api';

const WeeklyProgress = ({ currentAttendance, targetWeeklyHours = 40 }) => {
  const [weeklyData, setWeeklyData] = useState(null);
  const [now, setNow] = useState(new Date());

  const fetchWeeklySummary = async () => {
    try {
      const res = await api.get('/attendance/weekly-summary');
      setWeeklyData(res.data);
    } catch (err) {
      console.error('Error fetching weekly summary:', err);
    }
  };

  useEffect(() => {
    fetchWeeklySummary();
  }, [currentAttendance]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!weeklyData) return null;

  // Calculate live today's active seconds
  let todayLiveSecs = 0;
  if (currentAttendance && currentAttendance.clock_in) {
    const [h, m, s] = currentAttendance.clock_in.split(':').map(Number);
    const clockInTime = new Date(currentAttendance.date);
    clockInTime.setHours(h, m, s || 0, 0);

    const clockOutTime = currentAttendance.clock_out ? new Date(currentAttendance.date) : null;
    if (clockOutTime) {
      const [oh, om, os] = currentAttendance.clock_out.split(':').map(Number);
      clockOutTime.setHours(oh, om, os || 0, 0);
    }

    const effectiveEnd = clockOutTime || now;
    const totalElapsedSecs = Math.max(0, Math.floor((effectiveEnd - clockInTime) / 1000));

    let pastBreakSecs = (currentAttendance.total_break_minutes || 0) * 60;
    let currentBreakSecs = 0;

    if (currentAttendance.is_on_break && currentAttendance.break_start && !currentAttendance.clock_out) {
      const bStart = new Date(currentAttendance.break_start);
      currentBreakSecs = Math.max(0, Math.floor((now - bStart) / 1000));
    }

    todayLiveSecs = Math.max(0, totalElapsedSecs - (pastBreakSecs + currentBreakSecs));
  }

  // Combine past days worked minutes + today's live minutes
  let pastDaysWorkedMins = 0;
  const processedDays = weeklyData.days.map(day => {
    let dayMins = day.worked_minutes || 0;
    if (day.is_today && currentAttendance) {
      dayMins = Math.floor(todayLiveSecs / 60);
    } else {
      pastDaysWorkedMins += dayMins;
    }
    return {
      ...day,
      display_minutes: dayMins,
      display_hours: (dayMins / 60).toFixed(1),
    };
  });

  const totalWeeklyWorkedSecs = (pastDaysWorkedMins * 60) + todayLiveSecs;
  const totalWeeklyWorkedHours = totalWeeklyWorkedSecs / 3600;
  const targetWeeklySecs = targetWeeklyHours * 3600;
  const weeklyPct = Math.min(100, Math.max(0, (totalWeeklyWorkedSecs / targetWeeklySecs) * 100));

  // Today 8h Target
  const todayTargetSecs = 8 * 3600;
  const todayPct = Math.min(100, Math.max(0, (todayLiveSecs / todayTargetSecs) * 100));

  const formatHours = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="card weekly-progress-card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} style={{ color: 'var(--primary)' }} /> Weekly & Today Progress (Zoho Style)
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="live-indicator-dot" />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)' }}>REALTIME</span>
        </div>
      </div>

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px' }}>
        {/* Top Dual Progress Lines */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Today's 8h Bar */}
          <div className="zoho-progress-box">
            <div className="zoho-box-header">
              <span className="zoho-box-title">Today's Target (8h)</span>
              <strong className="zoho-box-value" style={{ color: '#10b981' }}>
                {formatHours(todayLiveSecs)}
              </strong>
            </div>
            <div className="progress-line-track" style={{ height: '8px', marginBottom: '6px' }}>
              <div
                className="progress-bar-fill active"
                style={{ width: `${todayPct}%`, background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)' }}
              />
            </div>
            <div className="zoho-box-footer">
              <span>Goal: 8.0 hrs</span>
              <strong>{todayPct.toFixed(1)}%</strong>
            </div>
          </div>

          {/* Weekly 40h Bar */}
          <div className="zoho-progress-box">
            <div className="zoho-box-header">
              <span className="zoho-box-title">Weekly Target ({targetWeeklyHours}h)</span>
              <strong className="zoho-box-value" style={{ color: 'var(--primary)' }}>
                {formatHours(totalWeeklyWorkedSecs)}
              </strong>
            </div>
            <div className="progress-line-track" style={{ height: '8px', marginBottom: '6px' }}>
              <div
                className="progress-bar-fill complete"
                style={{ width: `${weeklyPct}%`, background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)' }}
              />
            </div>
            <div className="zoho-box-footer">
              <span>Goal: {targetWeeklyHours}.0 hrs</span>
              <strong>{weeklyPct.toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        {/* 7-Day Mini Bar Chart */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Weekly Hours Breakdown (Mon – Sun)
          </div>

          <div className="zoho-bars-grid">
            {processedDays.map((d, idx) => {
              const dayHours = d.display_minutes / 60;
              const barHeightPct = Math.min(100, (dayHours / 9) * 100);

              let barColor = 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)';
              if (d.is_today) barColor = 'linear-gradient(180deg, #10b981 0%, #059669 100%)';
              else if (dayHours === 0) barColor = '#e2e8f0';

              return (
                <div key={idx} className={`zoho-day-bar-col ${d.is_today ? 'today-col' : ''}`}>
                  <span className="zoho-bar-val">{dayHours > 0 ? `${dayHours.toFixed(1)}h` : '0h'}</span>
                  <div className="zoho-bar-track">
                    <div
                      className="zoho-bar-fill"
                      style={{
                        height: `${Math.max(barHeightPct, 6)}%`,
                        background: barColor,
                      }}
                    />
                  </div>
                  <span className="zoho-day-label">{d.day_name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyProgress;
