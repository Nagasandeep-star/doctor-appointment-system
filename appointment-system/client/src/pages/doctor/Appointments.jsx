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

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('booked');
  const [actionId, setActionId] = useState(null);
  const [notesInput, setNotesInput] = useState({});

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = await api.get('/appointments/my');
      const sorted = (data.data || []).sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });
      setAppointments(sorted);
    } catch { /* interceptor */ }
    setLoading(false);
  };

  const handleComplete = async (id) => {
    setActionId(id);
    try {
      await api.patch(`/appointments/${id}/complete`, { notes: notesInput[id] || '' });
      toast.success('Appointment completed ✅');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
    setActionId(null);
  };

  const handleCancel = async (id) => {
    setActionId(id);
    try {
      await api.patch(`/appointments/${id}/cancel`);
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
    setActionId(null);
  };

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === filter);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div className="fade-in" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
          <span className="gradient-text">Appointments 📋</span>
        </h1>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.625rem', padding: '0.25rem', border: '1px solid var(--color-border)', width: 'fit-content' }}>
        {['all', 'booked', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.4rem 1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.8125rem', textTransform: 'capitalize',
              background: filter === f ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: filter === f ? 'white' : 'var(--color-text-muted)',
              transition: 'all 0.2s',
            }}
          >{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📋" title={`No ${filter === 'all' ? '' : filter} appointments`} />
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtered.map((appt) => (
            <div key={appt._id} className="card fade-in" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', flexShrink: 0 }}>🧑</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>{appt.patient?.name}</h3>
                    <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{appt.patient?.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.875rem' }}>📅 {appt.date}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)' }}>🕐 {appt.startTime}</span>
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
                  <strong>Notes:</strong> {appt.notes}
                </p>
              )}

              {appt.status === 'booked' && (
                <div style={{ marginTop: '1rem', paddingLeft: '3.5rem' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label className="label">Consultation Notes</label>
                    <textarea
                      className="input"
                      rows="2"
                      placeholder="Add consultation notes before completing..."
                      value={notesInput[appt._id] || ''}
                      onChange={(e) => setNotesInput({ ...notesInput, [appt._id]: e.target.value })}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleComplete(appt._id)}
                      disabled={actionId === appt._id}
                    >
                      {actionId === appt._id ? 'Saving...' : '✓ Mark Completed'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancel(appt._id)}
                      disabled={actionId === appt._id}
                    >
                      Cancel Appointment
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
