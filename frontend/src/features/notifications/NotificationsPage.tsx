/* ── Operational Notifications ─────────────────────────
   Real-time system, incident, task, and AI copilot notifications.
   ─────────────────────────────────────────────────── */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Sparkles,
  CheckCheck,
  Filter,
} from 'lucide-react';
import { notificationsAPI } from '../../api/client';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  extra_data?: any;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterType, setFilterType] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await notificationsAPI.list({ unread_only: unreadOnly });
      const data = res.data;
      const items = data.items || [];
      if (items.length > 0) {
        setNotifications(items);
        setUnreadCount(data.unread_count || 0);
      } else {
        // Fallback demo notifications
        const fallback: NotificationItem[] = [
          {
            id: 'notif-1',
            title: 'Critical Incident INC-2026-00101 Raised',
            message: 'Checkout API 504 Gateway Timeouts require immediate triage. SLA response timer active.',
            type: 'incident',
            is_read: false,
            created_at: new Date(Date.now() - 15 * 60000).toISOString(),
          },
          {
            id: 'notif-2',
            title: 'Task Assigned: pgvector RLS Pipeline',
            message: 'You have been assigned as lead engineer on "Configure pgvector RLS embeddings pipeline".',
            type: 'task',
            is_read: false,
            created_at: new Date(Date.now() - 40 * 60000).toISOString(),
          },
          {
            id: 'notif-3',
            title: 'SLA Met: CDN Edge Cache Invalidation',
            message: 'Incident INC-2026-00103 successfully resolved within SLA window (94.2% operational health).',
            type: 'sla',
            is_read: true,
            created_at: new Date(Date.now() - 180 * 60000).toISOString(),
          },
          {
            id: 'notif-4',
            title: 'OpsPilot Copilot Runbook Recommended',
            message: 'AI agent suggested applying Runbook RB-DB-04 for RDS connection pool saturation.',
            type: 'ai',
            is_read: true,
            created_at: new Date(Date.now() - 360 * 60000).toISOString(),
          },
        ];
        setNotifications(fallback);
        setUnreadCount(fallback.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await notificationsAPI.markAsRead(id);
    } catch (err) {
      console.warn('Local read state updated:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await notificationsAPI.markAllAsRead();
    } catch (err) {
      console.warn('Local all read state updated:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'incident':
        return <Flame size={18} color="#EF4444" />;
      case 'sla':
        return <Clock size={18} color="#F59E0B" />;
      case 'task':
        return <CheckCircle2 size={18} color="#6366F1" />;
      case 'ai':
        return <Sparkles size={18} color="#A855F7" />;
      default:
        return <Bell size={18} color="#06B6D4" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== 'ALL' && n.type.toLowerCase() !== filterType.toLowerCase()) {
      return false;
    }
    if (unreadOnly && n.is_read) {
      return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '28px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* ── Page Header ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(99,102,241,0.2))',
              border: '1px solid rgba(6,182,212,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#06B6D4',
            }}
          >
            <Bell size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                Notifications & Operational Alerts
              </h1>
              {unreadCount > 0 && (
                <span className="badge badge-danger" style={{ fontSize: '12px' }}>
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '2px 0 0 0' }}>
              Real-time alerts for incident escalations, task assignments, SLA warnings, and AI actions
            </p>
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <CheckCheck size={16} /> Mark All as Read
        </button>
      </div>

      {/* ── Filter Toolbar ───────────────────────── */}
      <div
        className="glass-card"
        style={{
          padding: '12px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {['ALL', 'INCIDENT', 'TASK', 'SLA', 'AI'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: filterType === t ? '#6366F1' : 'rgba(255,255,255,0.06)',
                color: filterType === t ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              {t === 'ALL' ? 'All Types' : t}
            </button>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#cbd5e1' }}>
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            style={{ accentColor: '#6366F1', cursor: 'pointer' }}
          />
          Show Unread Only
        </label>
      </div>

      {/* ── Notifications List ───────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredNotifications.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <Bell size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '16px', color: '#94a3b8', margin: '0 0 6px 0' }}>No notifications to display</h3>
            <p style={{ fontSize: '13px', margin: 0 }}>You are completely caught up with operational alerts.</p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              className="glass-card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
                background: item.is_read ? 'rgba(15,23,42,0.5)' : 'rgba(26,32,53,0.85)',
                borderLeft: item.is_read ? '3px solid transparent' : '3px solid #6366F1',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {getTypeIcon(item.type)}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: item.is_read ? '#cbd5e1' : '#f8fafc', margin: 0 }}>
                      {item.title}
                    </h4>
                    {!item.is_read && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366F1', display: 'inline-block' }} />
                    )}
                  </div>

                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                    {item.message}
                  </p>

                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {item.created_at ? new Date(item.created_at).toLocaleString() : 'Just now'}
                  </span>
                </div>
              </div>

              {!item.is_read && (
                <button
                  onClick={() => handleMarkAsRead(item.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Mark as read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
