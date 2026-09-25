import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const baseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[\d\s\-()]{7,20}$/, 'Invalid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['patient', 'doctor']),
  specialization: z.string().optional(),
  experience: z.string().optional(),
  fee: z.string().optional(),
});

export default function Register() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('patient');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(baseSchema),
    defaultValues: { role: 'patient' },
  });

  const handleRoleChange = (r) => {
    setRole(r);
    setValue('role', r);
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        experience: data.experience ? Number(data.experience) : undefined,
        fee: data.fee ? Number(data.fee) : undefined,
      };
      const user = await authRegister(payload);
      if (user.role === 'doctor') {
        toast.success('Registration submitted! Await admin approval before you appear in search.');
      } else {
        toast.success(`Welcome, ${user.name}!`);
      }
      // Use replace-navigate after a brief tick so AuthContext state propagates
      const dest = `/${user.role}`;
      setTimeout(() => navigate(dest, { replace: true }), 50);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      const fieldErrors = err.response?.data?.errors || [];
      if (fieldErrors.length) {
        fieldErrors.forEach((e) => toast.error(`${e.field}: ${e.message}`));
      } else {
        toast.error(msg);
      }
    }
  };

  const inputStyle = (hasError) => ({
    ...{},
    ...(hasError ? {} : {}),
  });

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 4rem)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'radial-gradient(ellipse at 40% 30%, rgba(139,92,246,0.12) 0%, transparent 60%)',
      }}
    >
      <div className="card fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '2.5rem' }}>👤</span>
          <h1 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.75rem', fontWeight: 800 }}>
            <span className="gradient-text">Create account</span>
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Join DocAppoint today
          </p>
        </div>

        {/* Role toggle */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '0.625rem',
            padding: '0.25rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--color-border)',
          }}
        >
          {['patient', 'doctor'].map((r) => (
            <button
              key={r}
              type="button"
              id={`role-${r}-btn`}
              onClick={() => handleRoleChange(r)}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s',
                background: role === r ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' : 'transparent',
                color: role === r ? 'white' : 'var(--color-text-muted)',
              }}
            >
              {r === 'patient' ? '🧑 Patient' : '👨‍⚕️ Doctor'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="hidden" {...register('role')} />

          <div>
            <label htmlFor="reg-name" className="label">Full name</label>
            <input id="reg-name" type="text" className={`input${errors.name ? ' error' : ''}`}
              placeholder="John Doe" {...register('name')} />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="reg-email" className="label">Email address</label>
            <input id="reg-email" type="email" autoComplete="email"
              className={`input${errors.email ? ' error' : ''}`}
              placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="reg-phone" className="label">Phone number</label>
            <input id="reg-phone" type="tel" className={`input${errors.phone ? ' error' : ''}`}
              placeholder="+1 234 567 8900" {...register('phone')} />
            {errors.phone && <p className="field-error">{errors.phone.message}</p>}
          </div>

          <div>
            <label htmlFor="reg-password" className="label">Password</label>
            <input id="reg-password" type="password" autoComplete="new-password"
              className={`input${errors.password ? ' error' : ''}`}
              placeholder="At least 6 characters" {...register('password')} />
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>

          {/* Doctor-only fields */}
          {role === 'doctor' && (
            <>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  Doctor Profile
                </p>
                <div>
                  <label htmlFor="reg-spec" className="label">Specialization</label>
                  <input id="reg-spec" type="text" className={`input${errors.specialization ? ' error' : ''}`}
                    placeholder="e.g. Cardiology" {...register('specialization')} />
                  {errors.specialization && <p className="field-error">{errors.specialization.message}</p>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label htmlFor="reg-exp" className="label">Experience (years)</label>
                    <input id="reg-exp" type="number" min="0" className={`input${errors.experience ? ' error' : ''}`}
                      placeholder="5" {...register('experience')} />
                  </div>
                  <div>
                    <label htmlFor="reg-fee" className="label">Consultation fee ($)</label>
                    <input id="reg-fee" type="number" min="0" className={`input${errors.fee ? ' error' : ''}`}
                      placeholder="100" {...register('fee')} />
                  </div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                ⚠️ Doctor accounts require admin approval before appearing in search.
              </p>
            </>
          )}

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem' }}
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
