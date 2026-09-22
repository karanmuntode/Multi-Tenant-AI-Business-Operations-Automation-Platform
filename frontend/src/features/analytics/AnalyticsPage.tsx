/* ── Operations Analytics & Intelligence ──────────────
   Deep dive operational KPI metrics, SLA performance, and velocity.
   ─────────────────────────────────────────────────── */

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldCheck,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const SLA_DATA = [
  { day: 'Mon', compliance: 98.2, target: 95.0 },
  { day: 'Tue', compliance: 97.4, target: 95.0 },
  { day: 'Wed', compliance: 94.8, target: 95.0 },
  { day: 'Thu', compliance: 99.1, target: 95.0 },
  { day: 'Fri', compliance: 96.5, target: 95.0 },
  { day: 'Sat', compliance: 100.0, target: 95.0 },
  { day: 'Sun', compliance: 98.9, target: 95.0 },
];

const INCIDENT_SEVERITY_DATA = [
  { name: 'P1 Critical', count: 4, color: '#EF4444' },
  { name: 'P2 High', count: 9, color: '#F59E0B' },
  { name: 'P3 Medium', count: 18, color: '#6366F1' },
  { name: 'P4 Low', count: 32, color: '#94A3B8' },
];

const RESOLUTION_TIME_DATA = [
  { month: 'May', mttr: 54, mttd: 8 },
  { month: 'Jun', mttr: 46, mttd: 6 },
  { month: 'Jul', mttr: 42, mttd: 5 },
  { month: 'Aug', mttr: 38, mttd: 4 },
  { month: 'Sep', mttr: 34, mttd: 3 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');

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
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))',
              border: '1px solid rgba(99,102,241,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6366F1',
            }}
          >
            <BarChart3 size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
              Operations Analytics & Intelligence
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '2px 0 0 0' }}>
              Service level agreements, incident resolution velocity, and operational trends
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', background: 'rgba(15,23,42,0.6)', border: '1px solid #334155', borderRadius: '8px', padding: '4px' }}>
          {['24h', '7d', '30d', '90d'].map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: timeRange === r ? '#6366F1' : 'transparent',
                color: timeRange === r ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Top Metric Cards ─────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Overall SLA Health</span>
            <ShieldCheck size={18} color="#22C55E" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#22C55E', marginTop: '8px' }}>
            96.8%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#22C55E', marginTop: '6px' }}>
            <TrendingUp size={14} /> +1.8% vs last month
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Mean Time to Resolve (MTTR)</span>
            <Clock size={18} color="#6366F1" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
            34 mins
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#22C55E', marginTop: '6px' }}>
            <TrendingDown size={14} /> -12 mins improvement
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>Mean Time to Detect (MTTD)</span>
            <Activity size={18} color="#06B6D4" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
            3.2 mins
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#22C55E', marginTop: '6px' }}>
            <TrendingDown size={14} /> Automated AI Telemetry
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
            <span>AI Automated Triage Rate</span>
            <CheckCircle2 size={18} color="#A855F7" />
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#A855F7', marginTop: '8px' }}>
            88.4%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            Autonomous severity classification
          </div>
        </div>
      </div>

      {/* ── Main Charts Grid ─────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        {/* SLA Performance Over Time */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Weekly SLA Compliance Trend
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Percentage of operational incidents resolved within contracted SLA limits
              </p>
            </div>
            <span className="badge badge-success">Target: 95.0%</span>
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SLA_DATA}>
                <defs>
                  <linearGradient id="slaColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis domain={[90, 100]} stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    background: '#151C2C',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                />
                <Area type="monotone" dataKey="compliance" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#slaColor)" name="Compliance %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Pie */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0' }}>
            Incident Severity Breakdown
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 20px 0' }}>
            Distribution across severity tiers
          </p>

          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={INCIDENT_SEVERITY_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {INCIDENT_SEVERITY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#151C2C',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px' }}>
            {INCIDENT_SEVERITY_DATA.map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                <span style={{ color: '#cbd5e1' }}>{item.name}:</span>
                <span style={{ fontWeight: 700, color: '#f8fafc' }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MTTR Velocity Improvement Bar Chart ── */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              MTTR & MTTD Velocity Trajectory (Minutes)
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '12px', margin: '2px 0 0 0' }}>
              Comparing Mean Time to Detect vs Mean Time to Resolve over past quarters
            </p>
          </div>
        </div>

        <div style={{ height: '260px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={RESOLUTION_TIME_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  background: '#151C2C',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                }}
              />
              <Bar dataKey="mttr" fill="#6366F1" radius={[4, 4, 0, 0]} name="MTTR (Minutes)" />
              <Bar dataKey="mttd" fill="#06B6D4" radius={[4, 4, 0, 0]} name="MTTD (Minutes)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
