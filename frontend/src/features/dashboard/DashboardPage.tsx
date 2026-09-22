/* ── Dashboard Page ──────────────────────────
   Main analytics dashboard with KPI cards,
   charts, and activity feed.
   ──────────────────────────────────────────── */

import { useEffect, useState } from 'react';
import {
  Users,
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Brain,
  Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { analyticsAPI } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

const CHART_COLORS = ['#6366F1', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444'];

// Demo data for charts (used when no real data available)
const taskTrendData = [
  { name: 'Mon', completed: 12, created: 15 },
  { name: 'Tue', completed: 19, created: 14 },
  { name: 'Wed', completed: 8, created: 22 },
  { name: 'Thu', completed: 15, created: 11 },
  { name: 'Fri', completed: 22, created: 18 },
  { name: 'Sat', completed: 6, created: 4 },
  { name: 'Sun', completed: 3, created: 2 },
];

const incidentTrendData = [
  { name: 'Week 1', incidents: 12, resolved: 10 },
  { name: 'Week 2', incidents: 8, resolved: 8 },
  { name: 'Week 3', incidents: 15, resolved: 13 },
  { name: 'Week 4', incidents: 6, resolved: 6 },
];

interface DashboardData {
  kpi: {
    total_users: number;
    total_projects: number;
    total_tasks: number;
    total_incidents: number;
    open_incidents: number;
    sla_performance: number;
  };
  task_distribution: Record<string, number>;
  incident_severity: Record<string, number>;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: result } = await analyticsAPI.getDashboard();
        setData(result);
      } catch {
        // Use defaults on error
        setData({
          kpi: { total_users: 0, total_projects: 0, total_tasks: 0, total_incidents: 0, open_incidents: 0, sla_performance: 100 },
          task_distribution: {},
          incident_severity: {},
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const kpis = [
    { label: 'Total Users', value: data?.kpi.total_users ?? 0, icon: Users, color: '#6366F1', trend: '+12%' },
    { label: 'Projects', value: data?.kpi.total_projects ?? 0, icon: FolderKanban, color: '#06B6D4', trend: '+3' },
    { label: 'Open Incidents', value: data?.kpi.open_incidents ?? 0, icon: AlertTriangle, color: '#EF4444', trend: '-5' },
    { label: 'SLA Performance', value: `${data?.kpi.sla_performance ?? 100}%`, icon: CheckCircle2, color: '#22C55E', trend: '+2.1%' },
  ];

  const taskDistPie = Object.entries(data?.task_distribution ?? {}).map(([name, value], i) => ({
    name: name.replace('_', ' '),
    value,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {greeting()}, {user?.first_name} 👋
          </h1>
          <p className="page-subtitle">
            Here's what's happening with your operations today
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary">
            <Clock size={16} /> Last 7 days
          </button>
          <button className="btn btn-primary">
            <Brain size={16} /> Ask AI
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {kpis.map((kpi, index) => (
          <div
            key={kpi.label}
            className="kpi-card"
            style={{ animationDelay: `${index * 100}ms`, animation: 'fadeIn 0.5s ease-out backwards' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="kpi-label">{kpi.label}</div>
                <div className="kpi-value">
                  {isLoading ? (
                    <div className="skeleton" style={{ width: '60px', height: '36px' }} />
                  ) : (
                    kpi.value
                  )}
                </div>
                <div className={`kpi-trend ${kpi.trend.startsWith('+') || kpi.trend.startsWith('-') ? (kpi.trend.startsWith('+') ? 'up' : 'down') : 'up'}`}>
                  <TrendingUp size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {kpi.trend} this week
                </div>
              </div>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-lg)',
                background: `${kpi.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <kpi.icon size={22} color={kpi.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Task Completion Trend */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Task Activity</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Created vs completed this week</p>
            </div>
            <Activity size={18} color="var(--primary-400)" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={taskTrendData}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} />
              <YAxis stroke="var(--text-tertiary)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
              <Area type="monotone" dataKey="created" stroke="#6366F1" fill="url(#colorCreated)" strokeWidth={2} />
              <Area type="monotone" dataKey="completed" stroke="#22C55E" fill="url(#colorCompleted)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Incident Trends */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Incident Trends</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Monthly incident tracking</p>
            </div>
            <AlertTriangle size={18} color="var(--warning-400)" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={incidentTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} />
              <YAxis stroke="var(--text-tertiary)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="incidents" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" fill="#22C55E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2">
        {/* Task Distribution */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Task Distribution</h3>
          {taskDistPie.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={taskDistPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    dataKey="value"
                    stroke="var(--bg-card)"
                    strokeWidth={2}
                  >
                    {taskDistPie.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {taskDistPie.map((entry) => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: entry.color }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {entry.name}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, marginLeft: 'auto' }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon">
                <FolderKanban size={24} />
              </div>
              <div className="empty-state-title">No tasks yet</div>
              <div className="empty-state-text">Create your first project and add tasks to see distribution here</div>
            </div>
          )}
        </div>

        {/* AI Activity Feed */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>AI Activity</h3>
            <span className="badge badge-primary">
              <Brain size={12} style={{ marginRight: '4px' }} /> Active
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: '✓', text: 'Data Agent completed analysis', time: '2m ago', color: 'var(--success-400)' },
              { icon: '✓', text: 'RAG Agent answered user query', time: '5m ago', color: 'var(--success-400)' },
              { icon: '⚠', text: 'Communication Agent waiting approval', time: '12m ago', color: 'var(--warning-400)' },
              { icon: '✓', text: 'Report Agent generated weekly summary', time: '1h ago', color: 'var(--success-400)' },
              { icon: '✓', text: 'Orchestrator resolved 3 workflows', time: '2h ago', color: 'var(--success-400)' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  transition: 'background 150ms ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
              >
                <span style={{ color: item.color, fontSize: '14px', fontWeight: 600 }}>{item.icon}</span>
                <span style={{ fontSize: '13px', flex: 1 }}>{item.text}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
