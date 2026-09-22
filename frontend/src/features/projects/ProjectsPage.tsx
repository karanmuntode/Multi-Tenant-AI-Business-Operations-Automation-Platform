/* ── Projects & Kanban Board ────────────────────────
   Interactive project operations and task management board.
   ─────────────────────────────────────────────────── */

import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  MoreVertical,
  X,
  Filter,
} from 'lucide-react';
import { projectsAPI } from '../../api/client';

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  estimated_hours?: number;
  project_id: string;
}

interface ProjectItem {
  id: string;
  name: string;
  description?: string;
  color?: string;
  task_count?: number;
}

const COLUMNS: Array<{ id: TaskItem['status']; title: string; color: string; badgeClass: string }> = [
  { id: 'TODO', title: 'To Do', color: '#94A3B8', badgeClass: 'badge-secondary' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: '#6366F1', badgeClass: 'badge-primary' },
  { id: 'REVIEW', title: 'Review & QA', color: '#F59E0B', badgeClass: 'badge-warning' },
  { id: 'DONE', title: 'Done', color: '#22C55E', badgeClass: 'badge-success' },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [targetColumn, setTargetColumn] = useState<TaskItem['status']>('TODO');

  // Form states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskItem['priority']>('MEDIUM');
  const [newTaskHours, setNewTaskHours] = useState(4);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#6366F1');

  // Load projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const res = await projectsAPI.list();
      const list = res.data || [];
      setProjects(list);
      if (list.length > 0) {
        setSelectedProjectId(list[0].id);
        loadTasks(list[0].id);
      } else {
        // Fallback demo project if none exists yet
        const demoProj: ProjectItem = {
          id: 'demo-p1',
          name: 'Core Platform Modernization',
          description: 'Zero-downtime microservices cutover and pgvector migration.',
          color: '#6366F1',
          task_count: 4,
        };
        setProjects([demoProj]);
        setSelectedProjectId(demoProj.id);
        setTasks([
          {
            id: 't-1',
            title: 'Implement tenant-scoped Redis rate limiting middleware',
            description: 'Token bucket algorithm per API key and JWT tenant id.',
            priority: 'HIGH',
            status: 'TODO',
            estimated_hours: 6,
            project_id: 'demo-p1',
          },
          {
            id: 't-2',
            title: 'Configure pgvector RLS embeddings pipeline',
            description: 'Enable pgvector extension with tenant isolation policies.',
            priority: 'CRITICAL',
            status: 'IN_PROGRESS',
            estimated_hours: 8,
            project_id: 'demo-p1',
          },
          {
            id: 't-3',
            title: 'Setup Prometheus FastAPI instrumentator and Grafana dashboard',
            description: 'Export latency histograms and Redis pool metrics.',
            priority: 'MEDIUM',
            status: 'REVIEW',
            estimated_hours: 4,
            project_id: 'demo-p1',
          },
          {
            id: 't-4',
            title: 'Deploy Docker Compose multi-service architecture',
            description: 'Containerize FastAPI, React SPA, Postgres 16, and Redis.',
            priority: 'LOW',
            status: 'DONE',
            estimated_hours: 5,
            project_id: 'demo-p1',
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async (projectId: string) => {
    try {
      const res = await projectsAPI.getTasks(projectId);
      setTasks(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    loadTasks(id);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskItem['status']) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await projectsAPI.updateTaskStatus(taskId, newStatus);
    } catch (err) {
      console.warn('Syncing task status to server failed or running in demo mode:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const taskPayload = {
      title: newTaskTitle,
      description: newTaskDesc,
      priority: newTaskPriority,
      status: targetColumn,
      estimated_hours: Number(newTaskHours),
    };

    try {
      const res = await projectsAPI.createTask(selectedProjectId, taskPayload);
      const created = res.data || {
        ...taskPayload,
        id: `t-${Date.now()}`,
        project_id: selectedProjectId,
      };
      setTasks((prev) => [created, ...prev]);
    } catch (err) {
      // Local fallback
      const localTask: TaskItem = {
        id: `t-${Date.now()}`,
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        status: targetColumn,
        estimated_hours: Number(newTaskHours),
        project_id: selectedProjectId,
      };
      setTasks((prev) => [localTask, ...prev]);
    }

    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsTaskModalOpen(false);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const res = await projectsAPI.create({
        name: newProjectName,
        description: newProjectDesc,
        color: newProjectColor,
      });
      const created = res.data;
      setProjects((prev) => [created, ...prev]);
      setSelectedProjectId(created.id);
      loadTasks(created.id);
    } catch (err) {
      const localProject: ProjectItem = {
        id: `p-${Date.now()}`,
        name: newProjectName,
        description: newProjectDesc,
        color: newProjectColor,
        task_count: 0,
      };
      setProjects((prev) => [localProject, ...prev]);
      setSelectedProjectId(localProject.id);
      setTasks([]);
    }

    setNewProjectName('');
    setNewProjectDesc('');
    setIsProjectModalOpen(false);
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="badge badge-danger">Critical</span>;
      case 'HIGH':
        return <span className="badge badge-warning">High</span>;
      case 'MEDIUM':
        return <span className="badge badge-primary">Medium</span>;
      case 'LOW':
      default:
        return <span className="badge badge-secondary">Low</span>;
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* ── Header ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
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
              <FolderKanban size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                Operations & Projects
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: '2px 0 0 0' }}>
                Multi-tenant sprint planning, task execution, and automated milestone tracking
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Project selector dropdown */}
          <select
            className="input-field"
            style={{ width: '220px', padding: '8px 12px', background: 'var(--bg-card)' }}
            value={selectedProjectId}
            onChange={(e) => handleSelectProject(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            className="btn btn-secondary"
            onClick={() => setIsProjectModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> New Project
          </button>

          <button
            className="btn btn-primary"
            onClick={() => {
              setTargetColumn('TODO');
              setIsTaskModalOpen(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* ── Active Project Info Banner ───────────── */}
      {activeProject && (
        <div
          className="glass-card"
          style={{
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderLeft: `4px solid ${activeProject.color || '#6366F1'}`,
          }}
        >
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Project Scope
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc', margin: '2px 0' }}>
              {activeProject.name}
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              {activeProject.description || 'Sprint deliverables and operational tasks.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#6366F1' }}>{tasks.length}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Tasks</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#22C55E' }}>
                {tasks.filter((t) => t.status === 'DONE').length}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Completed</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Kanban Columns Grid ──────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '18px',
          alignItems: 'start',
        }}
      >
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="glass-card"
              style={{
                padding: '16px',
                minHeight: '650px',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(15, 23, 42, 0.45)',
                borderTop: `3px solid ${col.color}`,
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>
                    {col.title}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.08)',
                      color: col.color,
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setTargetColumn(col.id);
                    setIsTaskModalOpen(true);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                  }}
                  title="Add Task to this column"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Tasks List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {colTasks.length === 0 ? (
                  <div
                    style={{
                      padding: '40px 16px',
                      textAlign: 'center',
                      color: '#64748b',
                      fontSize: '13px',
                      border: '1px dashed rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                    }}
                  >
                    No tasks in {col.title}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        background: 'rgba(26, 32, 53, 0.85)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        {getPriorityBadge(task.priority)}
                        {task.estimated_hours && (
                          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {task.estimated_hours}h
                          </span>
                        )}
                      </div>

                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                        {task.title}
                      </h4>

                      {task.description && (
                        <p
                          style={{
                            fontSize: '12px',
                            color: '#94a3b8',
                            margin: '0 0 12px 0',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {task.description}
                        </p>
                      )}

                      {/* Column Move Actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid rgba(255,255,255,0.05)',
                          paddingTop: '8px',
                          marginTop: '8px',
                        }}
                      >
                        {col.id !== 'TODO' ? (
                          <button
                            onClick={() => {
                              const order: TaskItem['status'][] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
                              const prevIdx = order.indexOf(col.id) - 1;
                              if (prevIdx >= 0) handleStatusChange(task.id, order[prevIdx]);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                            }}
                            title="Move back"
                          >
                            <ArrowLeft size={12} /> Back
                          </button>
                        ) : (
                          <div />
                        )}

                        {col.id !== 'DONE' && (
                          <button
                            onClick={() => {
                              const order: TaskItem['status'][] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
                              const nextIdx = order.indexOf(col.id) + 1;
                              if (nextIdx < order.length) handleStatusChange(task.id, order[nextIdx]);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#6366F1',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}
                            title="Move forward"
                          >
                            Next <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Create Task Modal ────────────────────── */}
      {isTaskModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                Create New Task
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  TASK TITLE
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Implement zero-downtime database migration"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  DESCRIPTION
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Provide task scope, acceptance criteria, or architectural context..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    PRIORITY
                  </label>
                  <select
                    className="input-field"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    ESTIMATED HOURS
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="input-field"
                    value={newTaskHours}
                    onChange={(e) => setNewTaskHours(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  INITIAL COLUMN
                </label>
                <select
                  className="input-field"
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value as any)}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review & QA</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsTaskModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Project Modal ─────────────────── */}
      {isProjectModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                Create New Project
              </h3>
              <button
                onClick={() => setIsProjectModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  PROJECT NAME
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Q4 Security Compliance & SOC2"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  DESCRIPTION
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Objective, team scope, and target outcomes..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  THEME COLOR
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EC4899'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewProjectColor(c)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: c,
                        border: newProjectColor === c ? '3px solid #ffffff' : 'none',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsProjectModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
