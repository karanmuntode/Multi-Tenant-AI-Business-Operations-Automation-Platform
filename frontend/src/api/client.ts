/* ── API Client ──────────────────────────────
   Axios instance with JWT interceptors and
   automatic token refresh.
   ──────────────────────────────────────────── */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch {
        // Refresh failed — log out
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ── Auth API ────────────────────────────────
export const authAPI = {
  register: (data: {
    org_name: string;
    org_slug: string;
    industry?: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getMe: () => api.get('/auth/me'),

  refresh: (refresh_token: string) =>
    api.post('/auth/refresh', { refresh_token }),
};

// ── Users API ───────────────────────────────
export const usersAPI = {
  list: (params?: { page?: number; per_page?: number; search?: string; role?: string }) =>
    api.get('/users', { params }),

  get: (id: string) => api.get(`/users/${id}`),

  create: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
    phone?: string;
    job_title?: string;
    department?: string;
  }) => api.post('/users', data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/users/${id}`, data),
};

// ── Analytics API ───────────────────────────
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

// ── AI Operations API ───────────────────────
export const aiAPI = {
  getStatus: () => api.get('/ai/status'),
  triage: (data: { title: string; description: string; affected_system?: string }) =>
    api.post('/ai/triage', data),
  chat: (data: { message: string }) => api.post('/ai/chat', data),
  decompose: (data: { goal: string }) => api.post('/ai/decompose', data),
};

// ── Health API ──────────────────────────────
export const healthAPI = {
  check: () => api.get('/health'),
};
