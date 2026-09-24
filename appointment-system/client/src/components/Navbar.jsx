import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = {
  patient: [
    { to: '/patient', label: 'Dashboard' },
    { to: '/patient/search', label: 'Find Doctors' },
    { to: '/patient/appointments', label: 'My Appointments' },
  ],
  doctor: [
    { to: '/doctor', label: 'Dashboard' },
    { to: '/doctor/appointments', label: 'Appointments' },
    { to: '/doctor/availability', label: 'Availability' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/doctors', label: 'Doctors' },
    { to: '/admin/users', label: 'Users' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = user ? NAV_LINKS[user.role] || [] : [];

  return (
    <nav
      style={{
        background: 'rgba(26,26,46,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Logo */}
        <Link
          to={user ? `/${user.role}` : '/'}
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 800,
            fontSize: '1.125rem',
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>🏥</span>
          <span className="gradient-text">DocAppoint</span>
        </Link>

        {/* Nav links */}
        {user && (
          <div style={{ display: 'flex', gap: '0.25rem', flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            {links.map((link) => {
              const isActive =
                link.to === `/${user.role}`
                  ? location.pathname === link.to
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    padding: '0.4rem 0.875rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: isActive ? 'white' : 'var(--color-text-muted)',
                    background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                    border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* User menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user && (
            <>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                  {user.name}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                  }}
                >
                  {user.role}
                </span>
              </div>
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
              >
                Logout
              </button>
            </>
          )}
          {!user && (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
