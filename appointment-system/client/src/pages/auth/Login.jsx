import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password);
      toast.success(`Welcome back, ${user.name}!`);
      const dest = location.state?.from?.pathname || `/${user.role}`;
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 4rem)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'radial-gradient(ellipse at 60% 20%, rgba(99,102,241,0.12) 0%, transparent 60%)',
      }}
    >
      <div className="card fade-in" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '2.5rem' }}>🏥</span>
          <h1 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.75rem', fontWeight: 800 }}>
            <span className="gradient-text">Welcome back</span>
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Sign in to your DocAppoint account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor="login-email" className="label">Email address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className={`input${errors.email ? ' error' : ''}`}
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="login-password" className="label">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className={`input${errors.password ? ' error' : ''}`}
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem' }}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
