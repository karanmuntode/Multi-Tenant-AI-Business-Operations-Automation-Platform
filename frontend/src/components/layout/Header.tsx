/* ── Header Component ────────────────────────
   Top bar with search, notifications, and user menu.
   ──────────────────────────────────────────── */

import { Bell, Search, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Header() {
  const { user } = useAuthStore();

  return (
    <header className="app-header">
      {/* Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 14px',
        width: '320px',
        transition: 'all 150ms ease',
      }}>
        <Search size={16} color="var(--text-tertiary)" />
        <input
          type="text"
          placeholder="Search projects, tasks, incidents..."
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '13px',
            width: '100%',
            fontFamily: 'var(--font-sans)',
          }}
        />
        <kbd style={{
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          background: 'var(--bg-tertiary)',
          padding: '2px 6px',
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)',
        }}>
          ⌘K
        </kbd>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Help */}
        <button className="btn btn-icon btn-ghost" title="Help">
          <HelpCircle size={18} color="var(--text-secondary)" />
        </button>

        {/* Notifications */}
        <button className="btn btn-icon btn-ghost notification-dot" title="Notifications">
          <Bell size={18} color="var(--text-secondary)" />
        </button>

        {/* User */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginLeft: '8px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <div className="avatar avatar-sm">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
            {user?.first_name}
          </span>
        </div>
      </div>
    </header>
  );
}
