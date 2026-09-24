import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { format } from 'date-fns';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [apptRes, profileRes] = await Promise.all([
        api.get('/appointments/my', { params: { date: today } }),
        api.get('/doctors/me'),
      ]);
      const sorted = (apptRes.data.data || []).sort((a, b) => a.startTime.localeCompare(b.startTime));
      setAppointments(sorted);
      setDoctorProfile(profileRes.data.data);
    } catch { /* interceptor */ }
    setLoading(false);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const bookedToday = appointments.filter((a) => a.status === 'booked');
  const completedToday = appointments.filter((a) => a.status === 'completed');

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div className="fade-in" style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
          <span className="gradient-text">Good day, Dr. {user?.name?.split(' ').pop()} 👨‍⚕️</span>
        </h1>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Approval banner */}
      {doctorProfile && !doctorProfile.isApproved && (
        <div className="fade-in" style={{ padding: '1rem 1.5rem', borderRadius: 'var(--radius)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>⏳</span>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-warning)' }}>Pending Approval</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Your profile is awaiting admin approval. You won't appear in search until approved.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card fade-in">
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Appointments</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{bookedToday.length}</p>
        </div>
        <div className="stat-card fade-in">
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed Today</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>{completedToday.length}</p>
        </div>
        <div className="stat-card fade-in">
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Specialization</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '1.125rem', fontWeight: 700 }}>{doctorProfile?.specialization || '—'}</p>
        </div>
      </div>

      {/* Today's appointment list */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>📋 Today's Schedule</h2>
      {bookedToday.length === 0 ? (
        <EmptyState icon="🎉" title="No more appointments today" message="Enjoy your free time!" />
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {bookedToday.map((appt) => (
            <div key={appt._id} className="card fade-in" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🧑</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>{appt.patient?.name}</h3>
                  <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{appt.reason || 'No reason provided'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)' }}>{appt.startTime}</span>
                <span className="badge badge-booked">{appt.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
