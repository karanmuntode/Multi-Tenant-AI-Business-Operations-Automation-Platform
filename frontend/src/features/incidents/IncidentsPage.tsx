/* ── Incidents & SLA Management ───────────────────────
   Enterprise Incident Tracking, SLA Timers, and AI Triage.
   ─────────────────────────────────────────────────── */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Flame,
  Filter,
  Sparkles,
  X,
  Search,
  ExternalLink,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { incidentsAPI, aiAPI } from '../../api/client';

interface IncidentItem {
  id: string;
  incident_number: string;
  title: string;
  description?: string;
  severity: 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';
  category: string;
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  created_at?: string;
  sla_response_due?: string;
  sla_resolution_due?: string;
  sla_response_met?: boolean;
  sla_resolution_met?: boolean;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSeverity, setFormSeverity] = useState<IncidentItem['severity']>('P2_HIGH');
  const [formCategory, setFormCategory] = useState('APPLICATION');
  const [formSystem, setFormSystem] = useState('');

  // AI Triage Assistant in Modal
  const [isAITriaging, setIsAITriaging] = useState(false);
  const [aiTriageResult, setAiTriageResult] = useState<any>(null);

  useEffect(() => {
    loadIncidents();
  }, [statusFilter, severityFilter]);

  const loadIncidents = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (severityFilter !== 'ALL') params.severity = severityFilter;

      const res = await incidentsAPI.list(params);
      const items = res.data?.items || [];
      if (items.length > 0) {
        setIncidents(items);
      } else {
        // Fallback demo incidents
        setIncidents([
          {
            id: 'inc-1',
            incident_number: 'INC-2026-00101',
            title: 'Checkout API 504 Gateway Timeouts under Flash Traffic',
            description: 'Postgres connection pool saturation on rds-prod-cluster. 14% failure rate on checkout requests.',
            severity: 'P1_CRITICAL',
            category: 'DATABASE',
            status: 'INVESTIGATING',
            created_at: new Date(Date.now() - 15 * 60000).toISOString(),
            sla_response_due: new Date(Date.now() + 10 * 60000).toISOString(),
            sla_resolution_due: new Date(Date.now() + 105 * 60000).toISOString(),
            sla_response_met: false,
            sla_resolution_met: false,
          },
          {
            id: 'inc-2',
            incident_number: 'INC-2026-00102',
            title: 'Payment Gateway Webhook SSL Certificate Expiration Warning',
            description: 'Stripe webhook endpoint TLS cert expiring in 72 hours. Renewal automated script failed.',
            severity: 'P2_HIGH',
            category: 'SECURITY',
            status: 'IDENTIFIED',
            created_at: new Date(Date.now() - 45 * 60000).toISOString(),
            sla_response_due: new Date(Date.now() + 25 * 60000).toISOString(),
            sla_resolution_due: new Date(Date.now() + 195 * 60000).toISOString(),
            sla_response_met: true,
            sla_resolution_met: false,
          },
          {
            id: 'inc-3',
            incident_number: 'INC-2026-00103',
            title: 'CDN Edge Cache Invalidation Delay in AP-South Region',
            description: 'Asset updates on static storage taking up to 45 minutes to propagate to regional edge points.',
            severity: 'P3_MEDIUM',
            category: 'NETWORK',
            status: 'RESOLVED',
            created_at: new Date(Date.now() - 240 * 60000).toISOString(),
            sla_response_due: new Date(Date.now() - 180 * 60000).toISOString(),
            sla_resolution_due: new Date(Date.now() - 60 * 60000).toISOString(),
            sla_response_met: true,
            sla_resolution_met: true,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAITriage = async () => {
    if (!formTitle.trim() || !formDesc.trim()) return;
    setIsAITriaging(true);
    try {
      const res = await aiAPI.triage({
        title: formTitle,
        description: formDesc,
        affected_system: formSystem,
      });
      const data = res.data;
      setAiTriageResult(data);
      if (data.suggested_severity) {
        setFormSeverity(data.suggested_severity as any);
      }
      if (data.category) {
        setFormCategory(data.category);
      }
    } catch (err) {
      // Local preview fallback
      setAiTriageResult({
        suggested_severity: 'P1_CRITICAL',
        confidence_score: 0.94,
        category: 'INFRASTRUCTURE',
        root_cause_analysis: 'High thread contention and memory pressure detected on upstream ingress proxies.',
        immediate_mitigation_steps: [
          'Drain traffic to standby replica zone',
          'Inspect connection backlog on port 443',
          'Notify Level 3 on-call SRE lead',
        ],
      });
      setFormSeverity('P1_CRITICAL');
    } finally {
      setIsAITriaging(false);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const payload = {
      title: formTitle,
      description: formDesc,
      severity: formSeverity,
      category: formCategory,
    };

    try {
      const res = await incidentsAPI.create(payload);
      const created = res.data;
      setIncidents((prev) => [created, ...prev]);
    } catch (err) {
      const localInc: IncidentItem = {
        id: `inc-${Date.now()}`,
        incident_number: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        title: formTitle,
        description: formDesc,
        severity: formSeverity,
        category: formCategory,
        status: 'INVESTIGATING',
        created_at: new Date().toISOString(),
        sla_response_due: new Date(Date.now() + 30 * 60000).toISOString(),
        sla_resolution_due: new Date(Date.now() + 240 * 60000).toISOString(),
        sla_response_met: false,
        sla_resolution_met: false,
      };
      setIncidents((prev) => [localInc, ...prev]);
    }

    setFormTitle('');
    setFormDesc('');
    setFormSystem('');
    setAiTriageResult(null);
    setIsRaiseModalOpen(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: IncidentItem['status']) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus } : inc))
    );
    if (selectedIncident && selectedIncident.id === id) {
      setSelectedIncident({ ...selectedIncident, status: newStatus });
    }
    try {
      await incidentsAPI.update(id, { status: newStatus });
    } catch (err) {
      console.warn('Status update local sync only:', err);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'P1_CRITICAL':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Flame size={12} /> P1 Critical
          </span>
        );
      case 'P2_HIGH':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={12} /> P2 High
          </span>
        );
      case 'P3_MEDIUM':
        return <span className="badge badge-primary">P3 Medium</span>;
      case 'P4_LOW':
      default:
        return <span className="badge badge-secondary">P4 Low</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'INVESTIGATING':
        return <span className="badge badge-danger">Investigating</span>;
      case 'IDENTIFIED':
        return <span className="badge badge-warning">Identified</span>;
      case 'MONITORING':
        return <span className="badge badge-primary">Monitoring</span>;
      case 'RESOLVED':
        return <span className="badge badge-success">Resolved</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return inc.title.toLowerCase().includes(q) || inc.incident_number.toLowerCase().includes(q);
    }
    return true;
  });

  const p1Count = incidents.filter((i) => i.severity === 'P1_CRITICAL' && i.status !== 'RESOLVED').length;
  const p2Count = incidents.filter((i) => i.severity === 'P2_HIGH' && i.status !== 'RESOLVED').length;
  const resolvedCount = incidents.filter((i) => i.status === 'RESOLVED').length;

  return (
    <div style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* ── Page Header ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(245,158,11,0.2))',
                border: '1px solid rgba(239,68,68,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                Incident & SLA Operations
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: '2px 0 0 0' }}>
                Automated triage, SLA countdowns, and enterprise root cause remediation
              </p>
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setIsRaiseModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} /> Raise Incident
        </button>
      </div>

      {/* ── Top SLA KPI Cards ────────────────────── */}
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
            Active P1 Critical
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: p1Count > 0 ? '#EF4444' : '#22C55E', marginTop: '6px' }}>
            {p1Count}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Immediate SLA response required
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
            High Severity (P2)
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#F59E0B', marginTop: '6px' }}>
            {p2Count}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Resolution SLA window: 4 hrs
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
            SLA Performance
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#22C55E', marginTop: '6px' }}>
            96.8%
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Target threshold: &gt; 95.0%
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
            Resolved Incidents
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#6366F1', marginTop: '6px' }}>
            {resolvedCount}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Avg Resolution: 34 mins
          </div>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ─────────────── */}
      <div
        className="glass-card"
        style={{
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Status Tabs */}
          {['ALL', 'INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 12px',
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
              {st === 'ALL' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Severity Dropdown */}
          <select
            className="input-field"
            style={{ width: '160px', padding: '6px 10px', fontSize: '13px' }}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="P1_CRITICAL">P1 Critical</option>
            <option value="P2_HIGH">P2 High</option>
            <option value="P3_MEDIUM">P3 Medium</option>
            <option value="P4_LOW">P4 Low</option>
          </select>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '220px' }}>
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '32px', fontSize: '13px' }}
              placeholder="Search INC # or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
          </div>
        </div>
      </div>

      {/* ── Incidents Table ──────────────────────── */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>INCIDENT #</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>SEVERITY</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>TITLE & CATEGORY</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>STATUS</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>SLA DEADLINES</th>
              <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 600, color: '#94a3b8', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No incidents matching the selected criteria.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((inc) => (
                <tr
                  key={inc.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: '#6366F1' }}>
                    {inc.incident_number}
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    {getSeverityBadge(inc.severity)}
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginBottom: '2px' }}>
                      {inc.title}
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                      {inc.category}
                    </span>
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    {getStatusBadge(inc.status)}
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} color="#6366F1" />
                        <span>Response: {inc.sla_response_met ? <span style={{ color: '#22C55E' }}>Met ✓</span> : <span style={{ color: '#F59E0B' }}>Active</span>}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} color="#EF4444" />
                        <span>Resolution: {inc.sla_resolution_met ? <span style={{ color: '#22C55E' }}>Met ✓</span> : <span style={{ color: '#F59E0B' }}>Target &lt; 2h</span>}</span>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      {inc.status !== 'RESOLVED' ? (
                        <button
                          onClick={() => handleUpdateStatus(inc.id, 'RESOLVED')}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          Resolve
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#22C55E', fontWeight: 600 }}>Resolved</span>
                      )}

                      <button
                        onClick={() => setSelectedIncident(inc)}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: 'none',
                          color: '#94a3b8',
                          padding: '6px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                        title="View Incident Details"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Raise Incident Modal with AI Triage ───── */}
      {isRaiseModalOpen && (
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
          <div className="glass-card" style={{ width: '100%', maxWidth: '640px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={20} color="#EF4444" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Raise Operational Incident
                </h3>
              </div>
              <button
                onClick={() => setIsRaiseModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  INCIDENT TITLE
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Ingress Controller NGINX 502 Bad Gateway Error Spike"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  AFFECTED SERVICE / INFRASTRUCTURE
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formSystem}
                  onChange={(e) => setFormSystem(e.target.value)}
                  placeholder="e.g. AWS ALB / Kubernetes Ingress / Redis Cache"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  SYMPTOM & ERROR DESCRIPTION
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Describe error logs, impacted customer traffic, and suspected causes..."
                  required
                />
              </div>

              {/* AI Auto-Triage Trigger Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99,102,241,0.08)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#818CF8" />
                  <span style={{ fontSize: '13px', color: '#c7d2fe' }}>
                    Let OpsPilot AI predict severity and suggest remediation steps
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAITriage}
                  disabled={isAITriaging || !formTitle.trim() || !formDesc.trim()}
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isAITriaging ? 'Analyzing...' : 'AI Auto-Triage'}
                </button>
              </div>

              {/* AI Triage Findings Preview */}
              {aiTriageResult && (
                <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#a855f7' }}>
                      AI DIAGNOSTIC REPORT
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Confidence: {Math.round((aiTriageResult.confidence_score || 0.9) * 100)}%
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#f1f5f9', marginBottom: '6px' }}>
                    <strong>Root Cause Hypothesis:</strong> {aiTriageResult.root_cause_analysis}
                  </div>
                  {aiTriageResult.immediate_mitigation_steps && (
                    <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: '12px', color: '#cbd5e1' }}>
                      {aiTriageResult.immediate_mitigation_steps.map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    SEVERITY
                  </label>
                  <select
                    className="input-field"
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as any)}
                  >
                    <option value="P1_CRITICAL">P1 Critical (15m SLA)</option>
                    <option value="P2_HIGH">P2 High (30m SLA)</option>
                    <option value="P3_MEDIUM">P3 Medium (2h SLA)</option>
                    <option value="P4_LOW">P4 Low (8h SLA)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    CATEGORY
                  </label>
                  <select
                    className="input-field"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                    <option value="DATABASE">Database</option>
                    <option value="SECURITY">Security</option>
                    <option value="APPLICATION">Application</option>
                    <option value="NETWORK">Network</option>
                    <option value="PAYMENTS">Payments</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsRaiseModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Raise Incident & Start SLA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Incident Detail Inspection Drawer ─────── */}
      {selectedIncident && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 100,
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              height: '100%',
              borderRadius: 0,
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflowY: 'auto',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: '#6366F1' }}>
                  {selectedIncident.incident_number}
                </span>
                <button
                  onClick={() => setSelectedIncident(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                {getSeverityBadge(selectedIncident.severity)}
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', margin: '12px 0 8px 0', lineHeight: 1.3 }}>
                  {selectedIncident.title}
                </h2>
                <span className="badge badge-secondary">{selectedIncident.category}</span>
              </div>

              <div style={{ padding: '16px', background: 'rgba(15,23,42,0.6)', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                {selectedIncident.description || 'No detailed incident description provided.'}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>
                  SLA Timeline & Status
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Status:</span>
                    {getStatusBadge(selectedIncident.status)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Created At:</span>
                    <span style={{ color: '#f1f5f9' }}>{selectedIncident.created_at ? new Date(selectedIncident.created_at).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Response SLA:</span>
                    <span style={{ color: selectedIncident.sla_response_met ? '#22C55E' : '#F59E0B' }}>
                      {selectedIncident.sla_response_met ? 'Met on Time ✓' : 'Under Investigation'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', gap: '12px' }}>
              {selectedIncident.status !== 'RESOLVED' && (
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => handleUpdateStatus(selectedIncident.id, 'RESOLVED')}
                >
                  Mark as Resolved
                </button>
              )}
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setSelectedIncident(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
