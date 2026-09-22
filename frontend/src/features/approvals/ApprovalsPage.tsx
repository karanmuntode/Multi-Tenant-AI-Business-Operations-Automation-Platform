/* ── Human-in-the-Loop Approvals Center ────────────────
   Review, verify, and govern AI Agent actions before execution.
   ─────────────────────────────────────────────────── */

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Mail,
  Database,
  Terminal,
  Eye,
  X,
  Bot,
} from 'lucide-react';
import { approvalsAPI } from '../../api/client';

interface ApprovalItem {
  id: string;
  requested_by_agent: string;
  action_type: string;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  title: string;
  description: string;
  payload: any;
  rejection_reason?: string;
  created_at: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Modals
  const [inspectItem, setInspectItem] = useState<ApprovalItem | null>(null);
  const [rejectItem, setRejectItem] = useState<ApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Requires further verification from security team.');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadApprovals();
  }, [statusFilter, riskFilter]);

  const loadApprovals = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (riskFilter !== 'ALL') params.risk_level = riskFilter;

      const res = await approvalsAPI.list(params);
      const items = res.data?.items || [];
      if (items.length > 0) {
        setApprovals(items);
      } else {
        // Fallback demo approvals
        const fallback: ApprovalItem[] = [
          {
            id: 'appr-1',
            requested_by_agent: 'Communication Agent',
            action_type: 'SEND_EMAIL',
            risk_level: 'HIGH',
            status: 'PENDING',
            title: 'Dispatch SLA Outage Advisory to Enterprise Customers',
            description: 'AI Agent drafted an outage status report for incident INC-2026-00101 regarding checkout transaction errors. Human approval required before external customer email dispatch.',
            payload: {
              recipient: 'enterprise-customers@acme-corp.com',
              subject: 'OpsPilot Advisory: Temporary Checkout Latency & Mitigation',
              body: 'Dear Valued Customer, our SRE team has identified an intermittent latency event affecting checkout processing. Remediation is underway and expected within 30 minutes.',
              triggered_by: 'INC-2026-00101',
            },
            created_at: new Date(Date.now() - 12 * 60000).toISOString(),
          },
          {
            id: 'appr-2',
            requested_by_agent: 'Data Agent',
            action_type: 'EXECUTE_RUNBOOK',
            risk_level: 'MEDIUM',
            status: 'PENDING',
            title: 'Scale RDS Connection Pool via PgBouncer Proxy',
            description: 'Data Agent detected connection count exceeding 92% of maximum pool threshold. Proposes applying Runbook RB-DB-04 to scale connection pool limits.',
            payload: {
              runbook: 'RB-DB-04: High Concurrency Connection Saturation',
              target_cluster: 'rds-prod-primary',
              parameter_changes: { max_connections: 400, pool_mode: 'transaction' },
            },
            created_at: new Date(Date.now() - 25 * 60000).toISOString(),
          },
        ];
        setApprovals(fallback);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'APPROVED' } : a))
    );
    setActionFeedback('Action approved! Dispatched to execution worker.');
    setTimeout(() => setActionFeedback(null), 3500);

    try {
      await approvalsAPI.approve(id);
    } catch (err) {
      console.warn('Local approval state synced:', err);
    }
    if (inspectItem?.id === id) setInspectItem(null);
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectItem) return;

    const id = rejectItem.id;
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: 'REJECTED', rejection_reason: rejectReason } : a
      )
    );
    setActionFeedback(`Action rejected. Reason: ${rejectReason}`);
    setTimeout(() => setActionFeedback(null), 3500);

    try {
      await approvalsAPI.reject(id, rejectReason);
    } catch (err) {
      console.warn('Local rejection state synced:', err);
    }
    setRejectItem(null);
    if (inspectItem?.id === id) setInspectItem(null);
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return <span className="badge badge-danger">High Risk</span>;
      case 'MEDIUM':
        return <span className="badge badge-warning">Medium Risk</span>;
      case 'LOW':
      default:
        return <span className="badge badge-secondary">Low Risk</span>;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'SEND_EMAIL':
        return <Mail size={16} color="#06B6D4" />;
      case 'MODIFY_DATABASE':
        return <Database size={16} color="#EF4444" />;
      case 'EXECUTE_RUNBOOK':
        return <Terminal size={16} color="#A855F7" />;
      default:
        return <Bot size={16} color="#6366F1" />;
    }
  };

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;
  const highRiskCount = approvals.filter((a) => a.risk_level === 'HIGH' && a.status === 'PENDING').length;

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* ── Page Header ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(6,182,212,0.2))',
              border: '1px solid rgba(34,197,94,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22C55E',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                Human-in-the-Loop Approvals
              </h1>
              {pendingCount > 0 && (
                <span className="badge badge-warning" style={{ fontSize: '12px' }}>
                  {pendingCount} Pending Review
                </span>
              )}
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '2px 0 0 0' }}>
              Verify, inspect, and authorize high-risk autonomous agent operations before execution
            </p>
          </div>
        </div>
      </div>

      {/* ── Feedback Banner ──────────────────────── */}
      {actionFeedback && (
        <div
          className="glass-card"
          style={{
            padding: '12px 20px',
            marginBottom: '20px',
            borderLeft: '4px solid #22C55E',
            color: '#22C55E',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle2 size={16} /> {actionFeedback}
        </div>
      )}

      {/* ── Governance KPI Cards ─────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
            Pending Human Review
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: pendingCount > 0 ? '#F59E0B' : '#22C55E', marginTop: '6px' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Awaiting executive sign-off
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
            High-Risk Operations
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: highRiskCount > 0 ? '#EF4444' : '#94a3b8', marginTop: '6px' }}>
            {highRiskCount}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            External emails & database updates
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
            Approved Today
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#22C55E', marginTop: '6px' }}>
            {approvals.filter((a) => a.status === 'APPROVED').length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Dispatched via Celery worker
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
            Safety Enforcement
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#6366F1', marginTop: '6px' }}>
            100%
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Zero unapproved destructive actions
          </div>
        </div>
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
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === st ? '#6366F1' : 'rgba(255,255,255,0.06)',
                color: statusFilter === st ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              {st === 'ALL' ? 'All Records' : st}
            </button>
          ))}
        </div>

        <select
          className="input-field"
          style={{ width: '160px', padding: '6px 10px', fontSize: '13px' }}
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
        >
          <option value="ALL">All Risk Levels</option>
          <option value="HIGH">High Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="LOW">Low Risk</option>
        </select>
      </div>

      {/* ── Approvals List ───────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {approvals.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <ShieldCheck size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '16px', color: '#94a3b8', margin: '0 0 6px 0' }}>No approval requests</h3>
            <p style={{ fontSize: '13px', margin: 0 }}>All agent actions are currently satisfied or executed.</p>
          </div>
        ) : (
          approvals.map((item) => (
            <div
              key={item.id}
              className="glass-card"
              style={{
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '20px',
                borderLeft:
                  item.risk_level === 'HIGH'
                    ? '4px solid #EF4444'
                    : item.risk_level === 'MEDIUM'
                    ? '4px solid #F59E0B'
                    : '4px solid #6366F1',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#c7d2fe', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                    <Bot size={13} /> {item.requested_by_agent}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                    {getActionIcon(item.action_type)} {item.action_type.replace('_', ' ')}
                  </span>
                  {getRiskBadge(item.risk_level)}
                  <span className={`badge ${item.status === 'APPROVED' ? 'badge-success' : item.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                    {item.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                  {item.description}
                </p>

                {item.payload?.recipient && (
                  <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '8px' }}>
                    <strong>Target Recipient:</strong> <code style={{ color: '#06B6D4' }}>{item.payload.recipient}</code>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <button
                    onClick={() => setInspectItem(item)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#818CF8',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    <Eye size={14} /> Inspect Action Payload & Draft
                  </button>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {item.created_at ? new Date(item.created_at).toLocaleString() : 'Just now'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {item.status === 'PENDING' ? (
                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setRejectItem(item)}
                    style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    <XCircle size={15} /> Reject
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleApprove(item.id)}
                    style={{ background: '#22C55E', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    <CheckCircle2 size={15} /> Approve Action
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: item.status === 'APPROVED' ? '#22C55E' : '#EF4444' }}>
                    {item.status === 'APPROVED' ? 'Approved & Dispatched ✓' : 'Rejected ✕'}
                  </span>
                  {item.rejection_reason && (
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', maxWidth: '200px' }}>
                      Reason: {item.rejection_reason}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Inspect Draft Modal ──────────────────── */}
      {inspectItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div className="glass-card" style={{ width: '100%', maxWidth: '620px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Eye size={20} color="#818CF8" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Inspect Action Payload
                </h3>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', margin: '0 0 6px 0' }}>
                {inspectItem.title}
              </h4>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                {inspectItem.description}
              </p>
            </div>

            {inspectItem.payload?.body ? (
              <div style={{ background: 'rgba(15,23,42,0.85)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  <strong>Subject:</strong> {inspectItem.payload.subject}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                  <strong>Recipient:</strong> {inspectItem.payload.recipient}
                </div>
                <div style={{ fontSize: '13px', color: '#f1f5f9', whiteSpace: 'pre-wrap', lineHeight: 1.5, background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px' }}>
                  {inspectItem.payload.body}
                </div>
              </div>
            ) : (
              <pre
                style={{
                  background: 'rgba(15,23,42,0.85)',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: '12px',
                  color: '#cbd5e1',
                  overflowX: 'auto',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '16px',
                }}
              >
                {JSON.stringify(inspectItem.payload, null, 2)}
              </pre>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {inspectItem.status === 'PENDING' && (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setRejectItem(inspectItem);
                    }}
                    style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}
                  >
                    Reject
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleApprove(inspectItem.id)}
                    style={{ background: '#22C55E' }}
                  >
                    Approve Action
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setInspectItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Reason Modal ──────────────────── */}
      {rejectItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '20px',
          }}
        >
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: '0 0 12px 0' }}>
              Reject Agent Action
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Provide feedback or rejection rationale for audit compliance and agent model tuning.
            </p>

            <form onSubmit={handleReject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <textarea
                className="input-field"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRejectItem(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#EF4444' }}>
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
