/* ── Visual Operations Workflows ───────────────────────
   Autonomous trigger -> agent -> human-in-the-loop -> execution engine.
   ─────────────────────────────────────────────────── */

import { useState } from 'react';
import {
  Zap,
  Plus,
  Play,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Bot,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  X,
  Activity,
} from 'lucide-react';

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  trigger: string;
  agent: string;
  condition: string;
  requires_approval: boolean;
  action: string;
  is_active: boolean;
  last_run?: string;
  run_count: number;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([
    {
      id: 'wf-1',
      name: 'Daily 9 AM SLA Risk Scan & Executive Escalation',
      description: 'Periodically analyzes open P1 incidents nearing SLA breach, drafts mitigation advisory, and holds for review.',
      trigger: 'Cron: Every day at 09:00 UTC',
      agent: 'Data Agent + Communication Agent',
      condition: 'P1 Incident unresolved > 30 mins',
      requires_approval: true,
      action: 'Draft & Queue Customer Advisory Email',
      is_active: true,
      last_run: 'Today at 09:00 UTC',
      run_count: 42,
    },
    {
      id: 'wf-2',
      name: 'Database Connection Pool Saturation Auto-Remediation',
      description: 'Detects RDS connection pool exhaustion under sudden traffic spikes and proposes scaling PgBouncer limits.',
      trigger: 'Webhook: Prometheus Alert (RDS Connections > 90%)',
      agent: 'Data Agent + Research Agent',
      condition: 'Query latency > 500ms for 3 consecutive probes',
      requires_approval: true,
      action: 'Apply Runbook RB-DB-04 (Scale Connection Limits)',
      is_active: true,
      last_run: 'Yesterday at 18:24 UTC',
      run_count: 15,
    },
    {
      id: 'wf-3',
      name: 'Stale Sprint Task Automated Notification',
      description: 'Scans for tasks stranded in IN_PROGRESS column exceeding sprint velocity thresholds and notifies assignees.',
      trigger: 'Cron: Every Monday at 08:00 UTC',
      agent: 'Orchestrator Agent',
      condition: 'Task status unchanged > 5 days',
      requires_approval: false,
      action: 'Send In-App Task Health Alert',
      is_active: true,
      last_run: '3 days ago',
      run_count: 28,
    },
  ]);

  const [activeModal, setActiveModal] = useState<'create' | 'run' | null>(null);
  const [runningWorkflow, setRunningWorkflow] = useState<WorkflowItem | null>(null);
  const [runSimulationStep, setRunSimulationStep] = useState(0);

  // New Workflow Form
  const [wfName, setWfName] = useState('');
  const [wfDesc, setWfDesc] = useState('');
  const [wfTrigger, setWfTrigger] = useState('Cron: Every day at 09:00 UTC');
  const [wfAgent, setWfAgent] = useState('Data Agent');
  const [wfCondition, setWfCondition] = useState('Critical Incident > 15m');
  const [wfRequiresApproval, setWfRequiresApproval] = useState(true);
  const [wfAction, setWfAction] = useState('Send Email to Stakeholders');

  const toggleWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, is_active: !w.is_active } : w))
    );
  };

  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfName.trim()) return;

    const newWf: WorkflowItem = {
      id: `wf-${Date.now()}`,
      name: wfName,
      description: wfDesc,
      trigger: wfTrigger,
      agent: wfAgent,
      condition: wfCondition,
      requires_approval: wfRequiresApproval,
      action: wfAction,
      is_active: true,
      last_run: 'Just created',
      run_count: 0,
    };

    setWorkflows([newWf, ...workflows]);
    setActiveModal(null);
    setWfName('');
    setWfDesc('');
  };

  const startSimulation = (wf: WorkflowItem) => {
    setRunningWorkflow(wf);
    setRunSimulationStep(1);
    setActiveModal('run');

    setTimeout(() => setRunSimulationStep(2), 1200);
    setTimeout(() => setRunSimulationStep(3), 2400);
    setTimeout(() => setRunSimulationStep(4), 3600);
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* ── Page Header ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.2))',
              border: '1px solid rgba(245,158,11,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B',
            }}
          >
            <Zap size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
              Autonomous Operations Workflows
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '2px 0 0 0' }}>
              Build automated pipelines: Scheduled Triggers → AI Agents → Human Approval → Safe Action Dispatch
            </p>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setActiveModal('create')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} /> New Workflow
        </button>
      </div>

      {/* ── Architecture Diagram Ribbon ──────────── */}
      <div
        className="glass-card"
        style={{
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(15,23,42,0.85)',
          border: '1px solid rgba(99,102,241,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
            OPERATIONAL PIPELINE FLOW:
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} /> 1. Scheduled Trigger
          </div>
          <ArrowRight size={14} color="#64748b" />
          <div style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#a5f3fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bot size={14} /> 2. AI Agent Reasoning
          </div>
          <ArrowRight size={14} color="#64748b" />
          <div style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#fde68a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={14} /> 3. Human Approval Gate
          </div>
          <ArrowRight size={14} color="#64748b" />
          <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#bbf7d0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} /> 4. Execution via Celery
          </div>
        </div>
      </div>

      {/* ── Active Workflows List ────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className="glass-card"
            style={{
              padding: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '24px',
              borderLeft: wf.is_active ? '4px solid #6366F1' : '4px solid #64748b',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  {wf.name}
                </h3>
                <span className={`badge ${wf.is_active ? 'badge-success' : 'badge-secondary'}`}>
                  {wf.is_active ? 'Active' : 'Disabled'}
                </span>
                {wf.requires_approval && (
                  <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldAlert size={12} /> Human Approval Required
                  </span>
                )}
              </div>

              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                {wf.description}
              </p>

              {/* Step Flow Preview */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  background: 'rgba(15,23,42,0.6)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Trigger</span>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{wf.trigger}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Agent Invocations</span>
                  <span style={{ color: '#818CF8', fontWeight: 600 }}>{wf.agent}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Condition</span>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{wf.condition}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Target Action</span>
                  <span style={{ color: '#22C55E', fontWeight: 600 }}>{wf.action}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '14px', fontSize: '12px', color: '#64748b' }}>
                <span>Last run: {wf.last_run}</span>
                <span>•</span>
                <span>Total Executions: {wf.run_count}</span>
              </div>
            </div>

            {/* Actions: Run Now & Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {wf.is_active ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  onClick={() => toggleWorkflow(wf.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {wf.is_active ? (
                    <ToggleRight size={28} color="#6366F1" />
                  ) : (
                    <ToggleLeft size={28} color="#64748b" />
                  )}
                </button>
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => startSimulation(wf)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <Play size={14} /> Run Workflow Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Run Simulation Modal ─────────────────── */}
      {activeModal === 'run' && runningWorkflow && (
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
          <div className="glass-card" style={{ width: '100%', maxWidth: '580px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={20} color="#6366F1" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Workflow Execution Monitor
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginBottom: '16px' }}>
              {runningWorkflow.name}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', background: runSimulationStep >= 1 ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: runSimulationStep >= 1 ? '#c7d2fe' : '#64748b' }}>
                  1. Trigger Fired: {runningWorkflow.trigger}
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: runSimulationStep >= 2 ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: runSimulationStep >= 2 ? '#a5f3fc' : '#64748b' }}>
                  2. {runningWorkflow.agent} Executing Queries & SOP Lookup
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: runSimulationStep >= 3 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: runSimulationStep >= 3 ? '#fde68a' : '#64748b' }}>
                  3. Condition Evaluated: {runningWorkflow.condition} (MATCHED)
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: runSimulationStep >= 4 ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: runSimulationStep >= 4 ? '#bbf7d0' : '#64748b' }}>
                  4. Action Queued: {runningWorkflow.action}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setActiveModal(null)}
              >
                Close Monitor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Workflow Modal ────────────────── */}
      {activeModal === 'create' && (
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
          <div className="glass-card" style={{ width: '100%', maxWidth: '540px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Build Autonomous Operations Workflow
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  WORKFLOW NAME
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  placeholder="e.g. Daily Flash-Sale Latency Check & Alert"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  DESCRIPTION
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={wfDesc}
                  onChange={(e) => setWfDesc(e.target.value)}
                  placeholder="Explain operational purpose and scope..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    TRIGGER
                  </label>
                  <select
                    className="input-field"
                    value={wfTrigger}
                    onChange={(e) => setWfTrigger(e.target.value)}
                  >
                    <option value="Cron: Every day at 09:00 UTC">Every day at 09:00 UTC</option>
                    <option value="Webhook: Prometheus Alert Spike">Prometheus Alert Spike</option>
                    <option value="Event: P1 Incident Created">P1 Incident Created</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    ASSIGNED AI AGENT
                  </label>
                  <select
                    className="input-field"
                    value={wfAgent}
                    onChange={(e) => setWfAgent(e.target.value)}
                  >
                    <option value="Data Agent + Communication Agent">Data + Communication Agent</option>
                    <option value="RAG Knowledge Agent">RAG Knowledge Agent</option>
                    <option value="Orchestrator Agent">Orchestrator Agent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  TARGET EXECUTION ACTION
                </label>
                <select
                  className="input-field"
                  value={wfAction}
                  onChange={(e) => setWfAction(e.target.value)}
                >
                  <option value="Draft & Queue Stakeholder Outage Email">Draft & Queue Stakeholder Outage Email</option>
                  <option value="Apply Automated Runbook via Proxy">Apply Automated Runbook via Proxy</option>
                  <option value="Send Internal Slack/In-App Alert">Send Internal Slack/In-App Alert</option>
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={wfRequiresApproval}
                  onChange={(e) => setWfRequiresApproval(e.target.checked)}
                  style={{ accentColor: '#6366F1' }}
                />
                Require Human-in-the-Loop Approval before Action Execution
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Activate Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
