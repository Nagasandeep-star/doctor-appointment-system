import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Stethoscope, Mail, Lock, ArrowRight, CheckCircle, Clock, Shield } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const FEATURES = [
  { icon: CheckCircle, text: 'Book appointments in under 60 seconds' },
  { icon: Shield, text: 'Verified & approved doctors only' },
  { icon: Clock, text: 'Smart reminders & full history' },
];

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
      setTimeout(() => navigate(dest, { replace: true }), 50);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-layout">
      {/* ── Brand panel ─────────────────────────────────────────────── */}
      <div className="auth-brand-panel fade-in">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Stethoscope size={26} color="white" />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            DocAppoint
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
          fontWeight: 800,
          color: 'white',
          lineHeight: 1.2,
          marginBottom: '1rem',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          Healthcare,<br />made simple.
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          Book appointments with top doctors instantly and manage your health journey in one place.
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={16} color="white" />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9375rem' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form panel ──────────────────────────────────────────────── */}
      <div className="auth-form-panel">
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <Card className="fade-in" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
            <CardHeader style={{ paddingBottom: '1rem' }}>
              <CardTitle style={{ fontSize: '1.625rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Welcome back
              </CardTitle>
              <CardDescription>Sign in to your DocAppoint account</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                {/* Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <Label htmlFor="login-email">Email address</Label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={15}
                      style={{
                        position: 'absolute', left: '0.75rem', top: '50%',
                        transform: 'translateY(-50%)',
                        color: errors.email ? 'var(--danger)' : 'var(--text-muted)',
                        pointerEvents: 'none',
                      }}
                    />
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      error={!!errors.email}
                      style={{ paddingLeft: '2.25rem' }}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="field-error" style={{ marginTop: '0.25rem' }}>{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <Label htmlFor="login-password">Password</Label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={15}
                      style={{
                        position: 'absolute', left: '0.75rem', top: '50%',
                        transform: 'translateY(-50%)',
                        color: errors.password ? 'var(--danger)' : 'var(--text-muted)',
                        pointerEvents: 'none',
                      }}
                    />
                    <Input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      error={!!errors.password}
                      style={{ paddingLeft: '2.25rem' }}
                      {...register('password')}
                    />
                  </div>
                  {errors.password && (
                    <p className="field-error" style={{ marginTop: '0.25rem' }}>{errors.password.message}</p>
                  )}
                </div>

                {/* Submit */}
                <Button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              </form>

              {/* Sign-up link */}
              <p style={{
                textAlign: 'center',
                marginTop: '1.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
              }}>
                Don't have an account?{' '}
                <Link
                  to="/register"
                  style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
                >
                  Sign up
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
