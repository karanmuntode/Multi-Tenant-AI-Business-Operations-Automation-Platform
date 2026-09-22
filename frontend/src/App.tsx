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
import ProjectsPage from './features/projects/ProjectsPage';
import IncidentsPage from './features/incidents/IncidentsPage';
import AuditLogsPage from './features/audit/AuditLogsPage';
import NotificationsPage from './features/notifications/NotificationsPage';
import ApprovalsPage from './features/approvals/ApprovalsPage';
import AnalyticsPage from './features/analytics/AnalyticsPage';
import WorkflowsPage from './features/workflows/WorkflowsPage';

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

            {/* Core Operations Modules */}
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
