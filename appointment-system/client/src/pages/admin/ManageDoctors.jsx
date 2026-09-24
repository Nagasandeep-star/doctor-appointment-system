import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function ManageDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [tab, setTab] = useState('pending');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data } = await api.get('/admin/doctors');
      setDoctors(data.data || []);
    } catch { /* interceptor */ }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      const { data } = await api.patch(`/admin/doctors/${id}/approve`);
      toast.success(data.message);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
    setActionId(null);
  };

  const handleReject = async (id) => {
    setActionId(id);
    try {
      const { data } = await api.patch(`/admin/doctors/${id}/reject`);
      toast.success(data.message);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    }
    setActionId(null);
  };

  const pending = doctors.filter((d) => !d.isApproved);
  const approved = doctors.filter((d) => d.isApproved);
  const displayed = tab === 'pending' ? pending : approved;

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div className="fade-in" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
          <span className="gradient-text">Manage Doctors 👨‍⚕️</span>
        </h1>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
          Approve or reject doctor registrations
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.625rem', padding: '0.25rem', border: '1px solid var(--color-border)', width: 'fit-content' }}>
        <button
          onClick={() => setTab('pending')}
          style={{
            padding: '0.4rem 1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.8125rem',
            background: tab === 'pending' ? 'rgba(245,158,11,0.2)' : 'transparent',
            color: tab === 'pending' ? '#fbbf24' : 'var(--color-text-muted)', transition: 'all 0.2s',
          }}
        >⏳ Pending ({pending.length})</button>
        <button
          onClick={() => setTab('approved')}
          style={{
            padding: '0.4rem 1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.8125rem',
            background: tab === 'approved' ? 'rgba(16,185,129,0.2)' : 'transparent',
            color: tab === 'approved' ? '#34d399' : 'var(--color-text-muted)', transition: 'all 0.2s',
          }}
        >✅ Approved ({approved.length})</button>
      </div>

      {displayed.length === 0 ? (
        <EmptyState
          icon={tab === 'pending' ? '✅' : '👨‍⚕️'}
          title={tab === 'pending' ? 'No pending approvals' : 'No approved doctors'}
          message={tab === 'pending' ? 'All doctor registrations have been processed.' : 'Approve doctor registrations to see them here.'}
        />
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {displayed.map((doc) => (
            <div key={doc._id} className="card fade-in" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: doc.isApproved ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                  👨‍⚕️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>{doc.user?.name}</h3>
                  <p style={{ margin: '0.125rem 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{doc.user?.email}</p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <span style={{ color: 'var(--color-primary)' }}>{doc.specialization}</span>
                    <span>{doc.experience} yrs exp</span>
                    <span style={{ color: 'var(--color-success)' }}>${doc.fee}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className={`badge ${doc.isApproved ? 'badge-approved' : 'badge-pending'}`}>
                  {doc.isApproved ? 'Approved' : 'Pending'}
                </span>
                {!doc.isApproved ? (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleApprove(doc._id)}
                    disabled={actionId === doc._id}
                  >
                    {actionId === doc._id ? '...' : '✓ Approve'}
                  </button>
                ) : (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleReject(doc._id)}
                    disabled={actionId === doc._id}
                  >
                    {actionId === doc._id ? '...' : 'Suspend'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
