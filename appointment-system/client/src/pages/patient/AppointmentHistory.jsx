import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const STATUS_BADGE = {
  booked: 'badge-booked',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
};

export default function AppointmentHistory() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);
  // Reschedule state
  const [rescheduleId, setRescheduleId] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = await api.get('/appointments/my');
      setAppointments(data.data || []);
    } catch { /* interceptor */ }
    setLoading(false);
  };

  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      await api.patch(`/appointments/${id}/cancel`);
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
    setCancellingId(null);
  };

  const openReschedule = (appt) => {
    setRescheduleId(appt._id);
    setNewDate('');
    setNewTime('');
    setAvailableSlots([]);
  };

  const fetchSlotsForReschedule = async (doctorId, date) => {
    setSlotsLoading(true);
    try {
      const { data } = await api.get(`/doctors/${doctorId}/slots`, { params: { date } });
      setAvailableSlots(data.data.availableSlots || []);
    } catch {
      setAvailableSlots([]);
    }
    setSlotsLoading(false);
  };

  const handleDateChange = (doctorId, date) => {
    setNewDate(date);
    setNewTime('');
    if (date) fetchSlotsForReschedule(doctorId, date);
  };

  const handleReschedule = async (id) => {
    if (!newDate || !newTime) {
      toast.error('Select a date and time');
      return;
    }
    try {
      await api.patch(`/appointments/${id}/reschedule`, { date: newDate, startTime: newTime });
      toast.success('Appointment rescheduled 🎉');
      setRescheduleId(null);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reschedule failed');
    }
  };

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === filter);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div className="fade-in" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
          <span className="gradient-text">Appointment History 📋</span>
        </h1>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.625rem', padding: '0.25rem', border: '1px solid var(--color-border)', width: 'fit-content' }}>
        {['all', 'booked', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.4rem 1rem',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8125rem',
              background: filter === f ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: filter === f ? 'white' : 'var(--color-text-muted)',
              transition: 'all 0.2s',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📋" title={`No ${filter === 'all' ? '' : filter} appointments`} message="Your appointment history will appear here." />
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtered.map((appt) => (
            <div key={appt._id} className="card fade-in" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', flexShrink: 0 }}>
                    👨‍⚕️
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>{appt.doctor?.user?.name || 'Doctor'}</h3>
                    <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{appt.doctor?.specialization}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>📅 </span>{appt.date}
                    <span style={{ color: 'var(--color-text-muted)', margin: '0 0.5rem' }}>🕐</span>{appt.startTime}
                  </div>
                  <span className={`badge ${STATUS_BADGE[appt.status]}`}>{appt.status}</span>
                </div>
              </div>

              {appt.reason && (
                <p style={{ margin: '0.75rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)', paddingLeft: '3.5rem' }}>
                  <strong>Reason:</strong> {appt.reason}
                </p>
              )}
              {appt.notes && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem', color: 'var(--color-accent)', paddingLeft: '3.5rem' }}>
                  <strong>Doctor's Notes:</strong> {appt.notes}
                </p>
              )}

              {/* Actions */}
              {appt.status === 'booked' && (
                <div style={{ marginTop: '1rem', paddingLeft: '3.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={cancellingId === appt._id}
                    onClick={() => handleCancel(appt._id)}
                  >
                    {cancellingId === appt._id ? 'Cancelling...' : 'Cancel'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openReschedule(appt)}>
                    Reschedule
                  </button>
                </div>
              )}

              {/* Reschedule form */}
              {rescheduleId === appt._id && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(99,102,241,0.06)', borderRadius: '0.5rem', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary)' }}>Reschedule Appointment</p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                      <label className="label">New Date</label>
                      <input
                        type="date"
                        className="input"
                        value={newDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleDateChange(appt.doctor._id, e.target.value)}
                        style={{ width: '180px' }}
                      />
                    </div>
                    <div>
                      <label className="label">Time Slot</label>
                      {slotsLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : availableSlots.length > 0 ? (
                        <select
                          className="input"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          style={{ width: '140px' }}
                        >
                          <option value="">Select...</option>
                          {availableSlots.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : newDate ? (
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-danger)' }}>No slots</p>
                      ) : (
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Pick a date first</p>
                      )}
                    </div>
                    <button className="btn btn-success btn-sm" onClick={() => handleReschedule(appt._id)}>
                      Confirm
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setRescheduleId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
