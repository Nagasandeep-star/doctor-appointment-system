import { useState, useEffect } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const ROLE_BADGE = {
  patient: 'badge-booked',
  doctor: 'badge-completed',
  admin: 'badge-pending',
};

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.data || []);
    } catch { /* interceptor */ }
    setLoading(false);
  };

  const filtered = search
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div className="fade-in" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
          <span className="gradient-text">Manage Users 👥</span>
        </h1>
      </div>

      <input
        id="user-search"
        type="text"
        className="input"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: '400px', marginBottom: '1.5rem' }}
      />

      {filtered.length === 0 ? (
        <EmptyState icon="👥" title="No users found" />
      ) : (
        <div className="card fade-in" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Name', 'Email', 'Phone', 'Role', 'Joined'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.875rem 1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{u.phone}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`badge ${ROLE_BADGE[u.role]}`}>{u.role}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
