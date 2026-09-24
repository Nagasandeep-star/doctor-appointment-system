import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { format, addDays, parseISO } from 'date-fns';

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchDoctor();
  }, [doctorId]);

  useEffect(() => {
    if (doctor) fetchSlots();
  }, [selectedDate, doctor]);

  const fetchDoctor = async () => {
    try {
      const { data } = await api.get(`/doctors/${doctorId}`);
      setDoctor(data.data);
    } catch (err) {
      toast.error('Doctor not found');
      navigate('/patient/search');
    }
    setLoading(false);
  };

  const fetchSlots = async () => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const { data } = await api.get(`/doctors/${doctorId}/slots`, {
        params: { date: selectedDate },
      });
      setSlots(data.data.availableSlots || []);
    } catch {
      setSlots([]);
    }
    setSlotsLoading(false);
  };

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    try {
      await api.post('/appointments', {
        doctorId,
        date: selectedDate,
        startTime: selectedSlot,
        reason,
      });
      toast.success('Appointment booked successfully! 🎉');
      navigate('/patient/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    }
    setBooking(false);
    setShowConfirm(false);
  };

  // Generate next 14 days for date picker
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE, MMM d'), dayName: format(d, 'EEE') };
  });

  if (loading) return <LoadingSpinner fullScreen />;
  if (!doctor) return null;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Doctor info header */}
      <div className="card fade-in" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0
        }}>👨‍⚕️</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{doctor.user?.name}</h1>
          <p style={{ margin: '0.25rem 0', color: 'var(--color-primary)', fontWeight: 600 }}>{doctor.specialization}</p>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            {doctor.experience} years experience · ${doctor.fee} per visit · {doctor.slotDuration}-min slots
          </p>
        </div>
      </div>

      {/* Date picker */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem' }}>📅 Select a Date</h2>
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
        {dateOptions.map((d) => (
          <button
            key={d.value}
            onClick={() => setSelectedDate(d.value)}
            style={{
              padding: '0.625rem 1rem',
              borderRadius: '0.625rem',
              border: selectedDate === d.value
                ? '2px solid var(--color-primary)'
                : '1px solid var(--color-border)',
              background: selectedDate === d.value
                ? 'rgba(99,102,241,0.15)'
                : 'rgba(255,255,255,0.03)',
              color: selectedDate === d.value ? 'white' : 'var(--color-text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '0.8125rem',
              fontWeight: 600,
              transition: 'all 0.2s',
              textAlign: 'center',
              minWidth: '90px',
            }}
          >
            <div style={{ fontSize: '0.6875rem', opacity: 0.7 }}>{d.dayName}</div>
            <div>{d.label.split(', ')[1]}</div>
          </button>
        ))}
      </div>

      {/* Time slots */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem' }}>🕐 Available Slots</h2>
      {slotsLoading ? (
        <LoadingSpinner />
      ) : slots.length === 0 ? (
        <EmptyState icon="🚫" title="No slots available" message="This doctor has no available slots on the selected date. Try another date." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.5rem', marginBottom: '2rem' }}>
          {slots.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedSlot(slot)}
              style={{
                padding: '0.625rem',
                borderRadius: '0.5rem',
                border: selectedSlot === slot
                  ? '2px solid var(--color-primary)'
                  : '1px solid var(--color-border)',
                background: selectedSlot === slot
                  ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
                  : 'rgba(255,255,255,0.03)',
                color: selectedSlot === slot ? 'white' : 'var(--color-text)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              {slot}
            </button>
          ))}
        </div>
      )}

      {/* Reason + Confirm */}
      {selectedSlot && (
        <div className="card fade-in" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700 }}>Booking Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Doctor</span>
              <p style={{ margin: '0.125rem 0 0', fontWeight: 600 }}>{doctor.user?.name}</p>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Date</span>
              <p style={{ margin: '0.125rem 0 0', fontWeight: 600 }}>{selectedDate}</p>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Time</span>
              <p style={{ margin: '0.125rem 0 0', fontWeight: 600 }}>{selectedSlot}</p>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="reason-input" className="label">Reason for visit (optional)</label>
            <textarea
              id="reason-input"
              className="input"
              rows="3"
              placeholder="Briefly describe your reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {!showConfirm ? (
            <button onClick={() => setShowConfirm(true)} className="btn btn-primary" style={{ width: '100%' }}>
              Confirm Booking · ${doctor.fee}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowConfirm(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleBook} className="btn btn-success" style={{ flex: 1 }} disabled={booking}>
                {booking ? 'Booking...' : '✓ Confirm'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
