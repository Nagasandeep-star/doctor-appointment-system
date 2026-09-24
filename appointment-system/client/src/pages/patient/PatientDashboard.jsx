import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const fetchUpcoming = async () => {
    try {
      const { data } = await api.get('/appointments/my', { params: { status: 'booked' } });
      // Sort ascending by date/time so nearest is first
      const sorted = (data.data || []).sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });
      setAppointments(sorted);
    } catch { /* handled by interceptor */ }
    setLoading(false);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Welcome header */}
      <div className="fade-in" style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
          <span className="gradient-text">Welcome, {user?.name?.split(' ')[0]} 👋</span>
        </h1>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
          Manage your appointments and find the best doctors
        </p>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/patient/search" style={{ textDecoration: 'none' }}>
          <div className="card fade-in" style={{ padding: '1.5rem', cursor: 'pointer' }}>
            <span style={{ fontSize: '2rem' }}>🔍</span>
            <h3 style={{ margin: '0.75rem 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>Find a Doctor</h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Search by name or specialization</p>
          </div>
        </Link>
        <Link to="/patient/appointments" style={{ textDecoration: 'none' }}>
          <div className="card fade-in" style={{ padding: '1.5rem', cursor: 'pointer' }}>
            <span style={{ fontSize: '2rem' }}>📋</span>
            <h3 style={{ margin: '0.75rem 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>Appointment History</h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>View past and upcoming visits</p>
          </div>
        </Link>
        <div className="card fade-in" style={{ padding: '1.5rem' }}>
          <span style={{ fontSize: '2rem' }}>📊</span>
          <h3 style={{ margin: '0.75rem 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>Total Booked</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{appointments.length}</p>
        </div>
      </div>

      {/* Upcoming appointments */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
        📅 Upcoming Appointments
      </h2>

      {appointments.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No upcoming appointments"
          message="Start by finding a doctor and booking your first appointment."
          action={<Link to="/patient/search" className="btn btn-primary">Find a Doctor</Link>}
        />
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {appointments.map((appt) => (
            <div key={appt._id} className="card fade-in" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                  👨‍⚕️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                    {appt.doctor?.user?.name || 'Doctor'}
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {appt.doctor?.specialization}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Date</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{appt.date}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Time</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{appt.startTime}</p>
                </div>
                <span className="badge badge-booked">Booked</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
