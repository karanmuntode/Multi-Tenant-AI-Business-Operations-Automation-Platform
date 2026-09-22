/* ── Sidebar Component ───────────────────────
   Main navigation sidebar with animated
   links, role-based menu items, and user profile.
   ──────────────────────────────────────────── */

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  AlertTriangle,
  Users,
  Brain,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Bell,
  FileText,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { name: 'AI Assistant', href: '/ai', icon: Brain },
  { name: 'Approvals', href: '/approvals', icon: Shield },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Audit Logs', href: '/audit-logs', icon: FileText },
];

const adminNav = [
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Workflows', href: '/workflows', icon: Zap },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'org_admin' || user?.role === 'super_admin';

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '16px',
          }}>
            OP
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              OpsPilot
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-400)', fontWeight: 600, letterSpacing: '0.05em' }}>
              AI PLATFORM
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '8px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '8px 12px',
          }}>
            Operations
          </div>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--primary-400)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 150ms ease',
                marginBottom: '2px',
              })}
              onMouseEnter={(e) => {
                const target = e.currentTarget;
                if (!target.classList.contains('active')) {
                  target.style.background = 'rgba(255, 255, 255, 0.04)';
                  target.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget;
                if (!target.classList.contains('active')) {
                  target.style.background = 'transparent';
                  target.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <item.icon size={18} />
              {item.name}
            </NavLink>
          ))}
        </div>

        {isAdmin && (
          <div style={{ marginTop: '8px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '8px 12px',
            }}>
              Administration
            </div>
            {adminNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--primary-400)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 150ms ease',
                  marginBottom: '2px',
                })}
              >
                <item.icon size={18} />
                {item.name}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
        }}>
          <div className="avatar">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.full_name}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-tertiary)',
            }}>
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'flex-start', fontSize: '13px' }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
