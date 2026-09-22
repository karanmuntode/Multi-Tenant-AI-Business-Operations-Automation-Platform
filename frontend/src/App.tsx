/* ── App.tsx ──────────────────────────────────
   Root application component with routing,
   auth guards, and query client setup.
   ──────────────────────────────────────────── */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import DashboardPage from './features/dashboard/DashboardPage';
import UsersPage from './features/users/UsersPage';
import SettingsPage from './features/settings/SettingsPage';
import AICopilotPage from './features/ai/AICopilotPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

/* ── Protected Route Guard ─────────────────── */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '20px',
            animation: 'pulse-glow 2s infinite',
          }}>
            OP
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Loading OpsPilot AI...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/* ── Placeholder Pages (Phase 2+) ──────────── */
function PlaceholderPage({ title, subtitle, icon }: { title: string; subtitle: string; icon: string }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="glass-card" style={{ padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
          Coming in Phase 2
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
          This feature is part of the next development phase. The backend APIs and database models are already in place.
        </p>
        <div style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <span className="badge badge-primary">Backend Ready</span>
          <span className="badge badge-warning">Frontend In Progress</span>
        </div>
      </div>
    </div>
  );
}

/* ── App Component ─────────────────────────── */
export default function App() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* AI Assistant & Copilot Hub */}
            <Route path="/ai" element={<AICopilotPage />} />

            {/* Phase 2+ Placeholders */}
            <Route path="/projects" element={<PlaceholderPage title="Projects" subtitle="Manage your team's projects and tasks" icon="📁" />} />
            <Route path="/incidents" element={<PlaceholderPage title="Incidents" subtitle="Track and resolve operational incidents" icon="🚨" />} />
            <Route path="/approvals" element={<PlaceholderPage title="Approvals" subtitle="Review and approve AI agent actions" icon="✅" />} />
            <Route path="/analytics" element={<PlaceholderPage title="Analytics" subtitle="Deep insights into your operations" icon="📊" />} />
            <Route path="/notifications" element={<PlaceholderPage title="Notifications" subtitle="Stay updated on important events" icon="🔔" />} />
            <Route path="/audit-logs" element={<PlaceholderPage title="Audit Logs" subtitle="Complete activity trail" icon="📋" />} />
            <Route path="/workflows" element={<PlaceholderPage title="Workflows" subtitle="Automate recurring operations" icon="⚡" />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
