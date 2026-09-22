/* ── Users Page ──────────────────────────────
   User management with table, search, and role badges.
   ──────────────────────────────────────────── */

import { useEffect, useState } from 'react';
import {
  Users as UsersIcon,
  Plus,
  Search,
  MoreHorizontal,
  Shield,
  UserCog,
  User as UserIcon,
} from 'lucide-react';
import { usersAPI } from '../../api/client';

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  is_active: boolean;
  department: string | null;
  job_title: string | null;
  last_login: string | null;
  created_at: string;
}

const roleBadge = (role: string) => {
  const map: Record<string, { class: string; icon: typeof Shield }> = {
    super_admin: { class: 'badge-danger', icon: Shield },
    org_admin: { class: 'badge-primary', icon: UserCog },
    manager: { class: 'badge-warning', icon: UserCog },
    employee: { class: 'badge-neutral', icon: UserIcon },
  };
  const config = map[role] || map.employee;
  const Icon = config.icon;
  return (
    <span className={`badge ${config.class}`}>
      <Icon size={11} style={{ marginRight: '4px' }} />
      {role.replace('_', ' ')}
    </span>
  );
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await usersAPI.list({ search: search || undefined });
        setUsers(data.users);
        setTotal(data.total);
      } catch {
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [search]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Members</h1>
          <p className="page-subtitle">{total} users in your organization</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            flex: 1,
            maxWidth: '360px',
          }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'org_admin', 'manager', 'employee'].map((role) => (
              <button
                key={role}
                className="btn btn-ghost btn-sm"
                style={{
                  fontSize: '12px',
                  textTransform: 'capitalize',
                }}
              >
                {role === 'all' ? 'All Roles' : role.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton" style={{ width: '80%', height: '48px' }} />
              ))}
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><UsersIcon size={28} /></div>
            <div className="empty-state-title">No team members yet</div>
            <div className="empty-state-text">Invite your first team member to get started</div>
            <button className="btn btn-primary"><Plus size={16} /> Add User</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="avatar">
                        {u.first_name[0]}{u.last_name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.full_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{roleBadge(u.role)}</td>
                  <td style={{ color: u.department ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {u.department || '—'}
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`status-dot ${u.is_active ? 'active' : 'inactive'}`} />
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td>
                    <button className="btn btn-icon btn-ghost">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
