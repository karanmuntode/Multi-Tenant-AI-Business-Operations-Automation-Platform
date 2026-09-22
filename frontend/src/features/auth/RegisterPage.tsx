/* ── Register Page ────────────────────────────
   Organization registration with step-through form.
   ──────────────────────────────────────────── */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Lock, ArrowRight, Rocket } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    org_name: '',
    org_slug: '',
    industry: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });

  const handleChange = (field: string, value: string) => {
    clearError();
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from org name
      if (field === 'org_name') {
        updated.org_slug = value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
      }
      return updated;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/');
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">OP</div>
          <span className="auth-logo-text">OpsPilot AI</span>
        </div>

        <h1 className="auth-title">Create your organization</h1>
        <p className="auth-subtitle">Get started with OpsPilot AI for your team</p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '13px',
            color: 'var(--danger-400)',
          }}>
            ⚠ {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Organization Info */}
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--primary-400)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Building2 size={14} />
            Organization
          </div>

          <div className="input-group">
            <label className="input-label">Organization name</label>
            <input
              className="input"
              placeholder="Acme Corporation"
              value={formData.org_name}
              onChange={(e) => handleChange('org_name', e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label className="input-label">URL slug</label>
              <input
                className="input"
                placeholder="acme-corp"
                value={formData.org_slug}
                onChange={(e) => handleChange('org_slug', e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Industry</label>
              <input
                className="input"
                placeholder="Technology"
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Admin User */}
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--primary-400)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
          }}>
            <User size={14} />
            Admin Account
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label className="input-label">First name</label>
              <input
                className="input"
                placeholder="John"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Last name</label>
              <input
                className="input"
                placeholder="Doe"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-tertiary)',
              }} />
              <input
                className="input"
                type="email"
                placeholder="john@acme.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                style={{ paddingLeft: '42px', width: '100%' }}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-tertiary)',
              }} />
              <input
                className="input"
                type="password"
                placeholder="Min 8 chars, 1 uppercase, 1 digit"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                minLength={8}
                style={{ paddingLeft: '42px', width: '100%' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isLoading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {isLoading ? (
              <span>Creating organization...</span>
            ) : (
              <>
                <Rocket size={18} />
                Launch OpsPilot
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
