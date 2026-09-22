# 🚀 OpsPilot AI — Multi-Tenant AI-Powered Business Operations Automation Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> A modern, enterprise-grade multi-tenant B2B SaaS platform for business operations, incident management, automated workflows, and AI-assisted operational intelligence. Built with FastAPI, PostgreSQL (Row-Level Security & Tenant Isolation), React 19, and Redis.

---

## 🏗 System Architecture

```
                    ┌──────────────────────────────────────────┐
                    │               React 19 SPA               │
                    │   Vite + TypeScript + TanStack Query     │
                    └────────────────────┬─────────────────────┘
                                         │ HTTPS / REST
                                         ▼
                    ┌──────────────────────────────────────────┐
                    │            FastAPI Backend Gateway       │
                    │   JWT Auth • RBAC • Tenant Resolution    │
                    └──────┬─────────────┬─────────────┬───────┘
                           │             │             │
              ┌────────────┘             │             └────────────┐
              ▼                          ▼                          ▼
   ┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
   │  PostgreSQL 16 DB  │     │   Redis 7 Cache    │     │   AI Agent Core    │
   │ Tenant-isolated    │     │ Session store,     │     │ Automated incident │
   │ Schema & Relational│     │ Rate limiting,     │     │ triage, summaries  │
   │ Storage            │     │ Background tasks   │     │ & operational intel│
   └────────────────────┘     └────────────────────┘     └────────────────────┘
```

---

## ✨ Key Features

- 🏢 **Multi-Tenant Architecture**: Complete logical data isolation across organizations with tenant-scoped database queries and RBAC enforcement.
- 🔐 **Enterprise Authentication & RBAC**:
  - Multi-tier roles: `owner`, `admin`, `manager`, `member`, `guest`.
  - Secure Argon2 / bcrypt password hashing with JWT access & refresh token lifecycle.
  - Organization registration flow with automated slug generation and default workspace setup.
- 📊 **Real-time Executive Dashboard**:
  - Live KPI metrics (Active Users, Open Tasks, Incident Resolution Time, SLA health).
  - Interactive charts (Recharts) with dark-mode glassmorphism styling.
- 🚨 **Incident & Operations Management**:
  - Track, assign, and resolve operational incidents with severity levels (`P1` to `P4`).
  - SLA tracking and audit trails for compliance.
- 🤖 **AI-Powered Operations Copilot**:
  - Automated ticket triage, priority scoring, root cause analysis, and smart response generation.
- ⚡ **Production-Ready Infrastructure**:
  - Docker Compose setup with PostgreSQL 16, Redis 7, backend hot-reloading, and Vite frontend.
  - Database migrations, readiness health checks (`/api/v1/health`), and structured logging.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, TanStack Query, Zustand, React Router 7, Recharts, Lucide Icons, Vanilla CSS Design System |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2, Alembic, Uvicorn |
| **Database & Cache** | PostgreSQL 16, Redis 7, asyncpg |
| **DevOps & Tooling** | Docker, Docker Compose, Git |

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) (v20+) *(for local frontend development without Docker)*
- [Python](https://www.python.org/) (3.12+) *(for local backend development without Docker)*

### 1. Clone the Repository

```bash
git clone https://github.com/karanmuntode/Multi-Tenant-AI-Business-Operations-Automation-Platform.git
cd Multi-Tenant-AI-Business-Operations-Automation-Platform
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

### 3. Run with Docker Compose (Recommended)

Start all services (Database, Redis, FastAPI Backend, React Frontend):

```bash
docker-compose up -d --build
```

- **Frontend App**: `http://localhost:5173`
- **Backend API Docs (Swagger)**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/v1/health`

---

## 📁 Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py              # Auth & RBAC FastAPI dependencies
│   │   │   └── v1/                  # V1 Route handlers (auth, users, analytics, health)
│   │   ├── core/                    # App config, security, tokens
│   │   ├── database.py              # Async SQLAlchemy engine & session factory
│   │   ├── models/                  # SQLAlchemy ORM models (Tenant, User, Incident, etc.)
│   │   ├── schemas/                 # Pydantic v2 validation schemas
│   │   └── main.py                  # FastAPI entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/                     # Axios client & typed API SDK
│   │   ├── components/layout/       # AppLayout, Sidebar, Header
│   │   ├── features/                # Auth, Dashboard, Users, Settings
│   │   ├── store/                   # Zustand state stores
│   │   ├── index.css                # Custom dark glassmorphism design system
│   │   └── App.tsx                  # Router & Query client configuration
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔒 Security & Multi-Tenancy Design

1. **Strict Data Isolation**: Every sensitive database table includes an `organization_id` foreign key. All API endpoints resolve the caller's tenant from their authenticated JWT token.
2. **Role-Based Access Control (RBAC)**: Fine-grained permissions enforced at the route level via FastAPI dependency injection (`require_roles([UserRole.OWNER, UserRole.ADMIN])`).
3. **Password Hashing**: Passwords are encrypted using modern Argon2id / bcrypt implementations with per-tenant salt separation.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
