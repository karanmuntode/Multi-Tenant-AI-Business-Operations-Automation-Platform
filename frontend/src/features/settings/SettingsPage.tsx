/* ── Settings Page ────────────────────────────
   Organization settings and profile management.
   ──────────────────────────────────────────── */

import { Building2, Globe, CreditCard, Bell, Shield, Palette } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const settingsSections = [
  { icon: Building2, label: 'Organization Profile', desc: 'Name, logo, industry, and basic information' },
  { icon: Globe, label: 'Domain Settings', desc: 'Custom domain and email configuration' },
  { icon: Shield, label: 'Security', desc: 'Authentication, SSO, and access policies' },
  { icon: Bell, label: 'Notifications', desc: 'Email alerts, in-app notifications, and webhooks' },
  { icon: CreditCard, label: 'Subscription & Billing', desc: 'Plan details, usage, and payment methods' },
  { icon: Palette, label: 'Appearance', desc: 'Theme, branding, and customization' },
];

export default function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your organization preferences</p>
        </div>
      </div>

      {/* Organization Info Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '24px',
          }}>
            OP
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
              Your Organization
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Managed by {user?.full_name} • {user?.role?.replace('_', ' ')}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <span className="badge badge-success">Free Plan</span>
              <span className="badge badge-primary">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid-2">
        {settingsSections.map((section) => (
          <div
            key={section.label}
            className="glass-card"
            style={{
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-primary)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <section.icon size={20} color="var(--primary-400)" />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
                  {section.label}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {section.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
