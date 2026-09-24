import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

/**
 * RoleRoute — redirects to role-specific home if the user's role doesn't match.
 * Usage: <RoleRoute role="admin"> ... </RoleRoute>
 */
const ROLE_HOME = {
  admin:   '/admin',
  doctor:  '/doctor',
  patient: '/patient',
};

export default function RoleRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;

  return children;
}
