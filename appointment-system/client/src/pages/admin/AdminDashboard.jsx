import { useState, useEffect } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data.data);
    } catch { /* interceptor */ }
    setLoading(false);
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!stats) return null;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div className="fade-in" style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
          <span className="gradient-text">Admin Dashboard 📊</span>
        </h1>
        <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
          System overview and analytics
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Users', value: stats.totalUsers, color: '#6366f1', icon: '👥' },
          { label: 'Approved Doctors', value: stats.totalDoctors, color: '#06b6d4', icon: '👨‍⚕️' },
          { label: 'Total Appointments', value: stats.totalAppointments, color: '#10b981', icon: '📋' },
          { label: 'Cancellation Rate', value: `${stats.cancellationRate}%`, color: '#ef4444', icon: '❌' },
        ].map((s) => (
          <div key={s.label} className="stat-card fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</p>
              </div>
              <span style={{ fontSize: '1.75rem' }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Appointments per day */}
        <div className="card fade-in" style={{ padding: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.0625rem', fontWeight: 700 }}>📈 Appointments (Last 30 Days)</h2>
          {stats.appointmentsPerDay.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats.appointmentsPerDay}>
                <defs>
                  <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', fontSize: '0.8125rem' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#gradientPrimary)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top doctors */}
        <div className="card fade-in" style={{ padding: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.0625rem', fontWeight: 700 }}>🏆 Top Doctors</h2>
          {stats.topDoctors.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.topDoctors} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', fontSize: '0.8125rem' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
