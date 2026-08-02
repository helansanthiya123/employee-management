import React, { useState, useEffect } from 'react';
import { Cake, Gift, Calendar, Sparkles, User } from 'lucide-react';
import api from '../api';

const BirthdayWidget = () => {
  const [birthdays, setBirthdays] = useState({ today: [], upcoming: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/employees/birthdays')
      .then(res => {
        setBirthdays(res.data);
      })
      .catch(err => console.error('Error loading birthdays:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cake size={18} style={{ color: '#ec4899' }} /> Birthday Reminders
          </span>
        </div>
        <div className="card-body" style={{ textAlign: 'center', padding: '24px' }}>
          <div className="spinner" style={{ margin: '0 auto', width: '24px', height: '24px' }} />
        </div>
      </div>
    );
  }

  const hasToday = birthdays.today.length > 0;
  const hasUpcoming = birthdays.upcoming.length > 0;

  return (
    <div className="card birthday-card">
      <div className="card-header" style={{ background: hasToday ? 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)' : undefined }}>
        <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: hasToday ? '#be185d' : 'var(--text-dark)' }}>
          <Cake size={20} style={{ color: '#ec4899' }} /> Birthday Reminders
        </span>
        {hasToday && (
          <span className="party-badge">
            <Sparkles size={14} /> Party Time!
          </span>
        )}
      </div>

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
        {/* Today's Birthdays Banner */}
        {hasToday && (
          <div className="today-birthday-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Gift size={20} className="bounce-anim" style={{ color: '#ec4899' }} />
              <strong style={{ color: '#9d174d', fontSize: '14px' }}>
                Celebrating Today! 🎉
              </strong>
            </div>

            {birthdays.today.map(emp => (
              <div key={emp.id} className="today-birthday-item">
                <div className="avatar-circle">
                  {emp.profile_picture ? (
                    <img src={`http://localhost:8000/storage/${emp.profile_picture}`} alt={emp.full_name} />
                  ) : (
                    <User size={20} style={{ color: '#be185d' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="emp-name" style={{ fontWeight: 700, color: '#831843' }}>
                    {emp.full_name} 🎂
                  </div>
                  <div style={{ fontSize: '12px', color: '#9d174d' }}>
                    {emp.designation} · {emp.department}
                  </div>
                </div>
                <span className="wish-badge">Happy Birthday!</span>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Birthdays Section */}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Upcoming this month ({birthdays.upcoming.length})
          </div>

          {hasUpcoming ? (
            <div className="upcoming-birthday-list">
              {birthdays.upcoming.map(emp => (
                <div key={emp.id} className="upcoming-birthday-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="small-avatar">
                      {emp.profile_picture ? (
                        <img src={`http://localhost:8000/storage/${emp.profile_picture}`} alt={emp.full_name} />
                      ) : (
                        <User size={14} style={{ color: 'var(--primary)' }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-dark)' }}>
                        {emp.full_name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {emp.department}
                      </div>
                    </div>
                  </div>

                  <span className="days-away-pill">
                    {emp.days_away === 1 ? 'Tomorrow' : `In ${emp.days_away} days`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
              No other upcoming birthdays in the next 30 days.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BirthdayWidget;
