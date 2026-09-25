import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

/**
 * PrivateRoute — redirects to /login if not authenticated.
 * Falls back to localStorage token during the brief React state propagation window
 * after login/register so the user is never erroneously bounced to /login.
 */
export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullScreen />;

  // Fallback: trust localStorage token during state-propagation delay
  const hasToken = !!localStorage.getItem('token');
  if (!user && !hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
