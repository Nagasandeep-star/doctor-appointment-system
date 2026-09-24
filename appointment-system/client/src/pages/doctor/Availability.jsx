import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Availability() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Availability state
  const [slots, setSlots] = useState([]);
  const [slotDuration, setSlotDuration] = useState(30);

  // Leave state
  const [leaveDate, setLeaveDate] = useState('');
  const [addingLeave, setAddingLeave] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/doctors/me');
      setProfile(data.data);
      setSlots(data.data.weeklyAvailability || []);
      setSlotDuration(data.data.slotDuration || 30);
    } catch { /* interceptor */ }
    setLoading(false);
  };

  const toggleDay = (day) => {
    const existing = slots.find((s) => s.day === day);
    if (existing) {
      setSlots(slots.filter((s) => s.day !== day));
    } else {
      setSlots([...slots, { day, start: '09:00', end: '17:00' }]);
    }
  };

  const updateSlot = (day, field, value) => {
    setSlots(slots.map((s) => (s.day === day ? { ...s, [field]: value } : s)));
  };

  const saveAvailability = async () => {
    if (slots.length === 0) {
      toast.error('Add at least one available day');
      return;
    }
    setSaving(true);
    try {
      await api.put('/doctors/availability', { weeklyAvailability: slots, slotDuration });
      toast.success('Availability updated! ✅');
      fetchProfile();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.length) {
        errors.forEach((e) => toast.error(`${e.field}: ${e.message}`));
      } else {
        toast.error(err.response?.data?.message || 'Update failed');
      }
    }
    setSaving(false);
  };

  const handleAddLeave = async () => {
    if (!leaveDate) return;
    setAddingLeave(true);
    try {
      await api.post('/doctors/leave', { date: leaveDate });
      toast.success(`Leave added for ${leaveDate}`);
      setLeaveDate('');
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add leave');
    }
    setAddingLeave(false);
  };

  const handleRemoveLeave = async (date) => {
    try {
      await api.delete('/doctors/leave', { data: { date } });
      toast.success(`Leave removed for ${date}`);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove leave');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div className="fade-in" style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
          <span className="gradient-text">Set Availability 📅</span>
        </h1>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
          Configure your weekly schedule and manage leave dates
        </p>
      </div>

      {/* Slot duration */}
      <div className="card fade-in" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.0625rem', fontWeight: 700 }}>⏱️ Slot Duration</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[15, 20, 30, 45, 60].map((d) => (
            <button
              key={d}
              onClick={() => setSlotDuration(d)}
              className={slotDuration === d ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      {/* Weekly schedule */}
      <div className="card fade-in" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.0625rem', fontWeight: 700 }}>🗓️ Weekly Schedule</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {DAYS.map((dayName, idx) => {
            const slot = slots.find((s) => s.day === idx);
            const isActive = !!slot;
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  background: isActive ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isActive ? 'rgba(99,102,241,0.2)' : 'var(--color-border)'}`,
                  flexWrap: 'wrap',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', minWidth: '120px' }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleDay(idx)}
                    style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                    {dayName}
                  </span>
                </label>

                {isActive && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="time"
                      className="input"
                      value={slot.start}
                      onChange={(e) => updateSlot(idx, 'start', e.target.value)}
                      style={{ width: '130px', padding: '0.4rem 0.75rem' }}
                    />
                    <span style={{ color: 'var(--color-text-muted)' }}>to</span>
                    <input
                      type="time"
                      className="input"
                      value={slot.end}
                      onChange={(e) => updateSlot(idx, 'end', e.target.value)}
                      style={{ width: '130px', padding: '0.4rem 0.75rem' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={saveAvailability}
          className="btn btn-primary"
          disabled={saving}
          style={{ marginTop: '1.25rem', width: '100%' }}
        >
          {saving ? 'Saving...' : '💾 Save Availability'}
        </button>
      </div>

      {/* Leave dates */}
      <div className="card fade-in" style={{ padding: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.0625rem', fontWeight: 700 }}>🏖️ Leave Dates</h2>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            type="date"
            className="input"
            value={leaveDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setLeaveDate(e.target.value)}
            style={{ width: '200px' }}
          />
          <button
            onClick={handleAddLeave}
            className="btn btn-primary btn-sm"
            disabled={addingLeave || !leaveDate}
          >
            {addingLeave ? 'Adding...' : '+ Add Leave'}
          </button>
        </div>

        {(profile?.leaveDates || []).length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>No leave dates set.</p>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {profile.leaveDates.map((d) => (
              <span key={d} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.8125rem',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-text)',
              }}>
                {d}
                <button
                  onClick={() => handleRemoveLeave(d)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', lineHeight: 1, padding: 0 }}
                  title="Remove"
                >×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
