# Architecture Overview

## System Architecture

This is a **monorepo** containing a multi-tenant SaaS platform for manpower consultancy and workforce management.

### High-Level Structure

```
┌─────────────────────────────────────────────────────────┐
│                   Super Admin Platform                   │
│              (Separate Repository/Project)               │
│         Tenant Management & Subscriptions                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Manpower Platform (Monorepo)                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Tenant Web  │  │   Employee   │  │   NestJS     │  │
│  │     App      │  │    Portal    │  │     API      │  │
│  │   (React)    │  │   (React)    │  │   (REST)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │          │
│         └──────────────────┴──────────────────┘          │
│                            │                              │
│                  ┌─────────▼─────────┐                   │
│                  │   Shared Packages  │                   │
│                  │  types, validation │                   │
│                  │  permissions, etc. │                   │
│                  └─────────┬─────────┘                   │
│                            │                              │
│                  ┌─────────▼─────────┐                   │
│                  │  PostgreSQL + DB   │                   │
│                  │   Drizzle ORM      │                   │
│                  └───────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Applications

**Tenant Admin (apps/web)**
- React 18
- TypeScript
- Vite
- TanStack Router (file-based routing)
- TanStack Query (server state)
- TanStack Table (data tables)
- React Hook Form + Zod (forms & validation)
- Tailwind CSS

**Employee Portal (apps/employee)**
- React 18
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Tailwind CSS
- Simplified UI for workers

### Backend API (apps/api)

- NestJS
- TypeScript
- REST API (no GraphQL)
- Modular monolith architecture
- Swagger/OpenAPI documentation

### Database Layer (database/)

- PostgreSQL
- Drizzle ORM
- Type-safe queries
- Migration system

### Shared Packages (packages/)

- **@manpower/types** - Shared TypeScript types
- **@manpower/validation** - Zod schemas
- **@manpower/permissions** - RBAC definitions
- **@manpower/config** - Shared configuration
- **@manpower/ui** - Shared React components
- **@manpower/eslint-config** - ESLint configuration

## Key Architectural Decisions

### 1. Modular Monolith (Not Microservices)

The backend is a single NestJS application with clear module boundaries:

```
apps/api/src/modules/
├── auth/           # Authentication & authorization
├── tenants/        # Tenant management
├── users/          # User management
├── candidates/     # Candidate tracking
├── employees/      # Employee management
├── clients/        # Client management
├── locations/      # Location management
├── attendance/     # Attendance tracking
├── payroll/        # Payroll processing
└── ...
```

Each module is self-contained with:
- Module definition
- Controller (HTTP endpoints)
- Service (business logic)
- Repository (data access)
- DTOs and types

### 2. Multi-Tenancy

**Tenant Isolation Strategy:**
- Every tenant-owned table has a `tenant_id` column
- Tenant context derived from authenticated session
- Repository layer enforces tenant scoping
- No cross-tenant data access possible

**Tenant Hierarchy:**
```
Tenant
 ├── Clients
 │    └── Locations
 │         └── Departments
 ├── Candidates
 └── Employees
      └── Employee Assignments (history)
```

### 3. Employee Assignment Model

Employees are **not** permanently tied to one client/location. The `employee_assignments` table maintains:
- Current assignment
- Historical assignments
- Transfer history
- Location/client changes

This allows tracking employee movement across clients/locations without data loss.

### 4. Document Storage Architecture

**Metadata in PostgreSQL:**
- Document type
- Employee/candidate reference
- Upload timestamp
- Verification status

**Files in AWS S3 (future):**
- Private bucket
- Signed URLs for access
- Encryption at rest
- No public access

### 5. Authentication & Security

**Architecture:**
- Argon2id password hashing
- HttpOnly secure cookies
- Short-lived access tokens
- Refresh token rotation
- CSRF protection
- Rate limiting

**Authorization:**
- Role-based access control (RBAC)
- Permission-based checks
- Tenant-scoped operations

### 6. Frontend Architecture

**Routing:**
- File-based routing with TanStack Router
- Type-safe navigation
- Automatic code splitting

**State Management:**
- Server state: TanStack Query
- Form state: React Hook Form
- Global state: React Context (minimal)

**Data Fetching:**
- Automatic caching
- Background refetching
- Optimistic updates
- Pagination support

## Module Communication

```
Frontend Apps
     │
     │ HTTP/REST
     ▼
  NestJS API
     │
     │ Drizzle ORM
     ▼
  PostgreSQL
```

**No direct database access from frontend.**

## Scalability Considerations

### Current Architecture (Phase 1)
- Single PostgreSQL instance
- Modular monolith API
- Horizontal scaling via load balancer

### Future Enhancements (Phase 2+)
- Redis for caching & sessions
- BullMQ for background jobs
- Read replicas for reporting
- CDN for static assets
- AWS S3 for document storage

## Development Workflow

```bash
# Install dependencies
pnpm install

# Start all apps in dev mode
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## Deployment Architecture

**Recommended Setup:**
- Frontend apps: Static hosting (Vercel, Netlify, Cloudflare Pages)
- API: Node.js server (Railway, Render, DigitalOcean)
- Database: Managed PostgreSQL (Supabase, Neon, Railway)
- Files: AWS S3 or compatible (future)

**No Docker required** - Direct deployment to hosting platforms.
