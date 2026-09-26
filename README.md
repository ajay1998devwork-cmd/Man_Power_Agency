# Manpower Platform

Production-ready SaaS platform for manpower consultancy and workforce management.

## Architecture

This is a **monorepo** containing:

- **apps/web** - Tenant Admin Web Application (React + Vite + TanStack Router)
- **apps/employee** - Employee Portal (React + Vite + TanStack Router)
- **apps/api** - NestJS Backend API (REST)
- **packages/** - Shared packages (ui, types, validation, permissions, config, eslint-config)
- **database/** - PostgreSQL schemas and migrations (Drizzle ORM)

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- TanStack Table
- React Hook Form
- Zod
- Tailwind CSS

### Backend
- Node.js
- NestJS
- TypeScript
- REST API
- PostgreSQL
- Drizzle ORM

### Monorepo
- pnpm
- Turborepo

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- PostgreSQL >= 14

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment

Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

Update the database credentials and other settings.

### 3. Setup Database

```bash
# Create database
createdb manpower_platform

# Run migrations
cd database
pnpm db:migrate

# (Optional) Seed data
pnpm db:seed
```

### 4. Development

```bash
# Start all applications in development mode
pnpm dev

# Or start individual apps
pnpm --filter @manpower/web dev
pnpm --filter @manpower/employee dev
pnpm --filter @manpower/api dev
```

Applications will be available at:
- Tenant Admin: http://localhost:5173
- Employee Portal: http://localhost:5174
- API: http://localhost:3000

## Available Commands

```bash
# Development
pnpm dev              # Start all apps in dev mode

# Build
pnpm build            # Build all apps and packages

# Lint
pnpm lint             # Lint all packages

# Type Check
pnpm typecheck        # Type check all packages

# Test
pnpm test             # Run tests

# Clean
pnpm clean            # Clean all build artifacts
```

## Project Structure

```
manpower-platform/
├── apps/
│   ├── web/              # Tenant Admin Application
│   ├── employee/         # Employee Portal
│   └── api/              # NestJS Backend API
├── packages/
│   ├── ui/               # Shared UI components
│   ├── types/            # Shared TypeScript types
│   ├── validation/       # Shared Zod schemas
│   ├── permissions/      # RBAC permissions
│   ├── config/           # Shared configuration
│   └── eslint-config/    # ESLint configuration
├── database/
│   ├── schema/           # Drizzle schema definitions
│   ├── migrations/       # Database migrations
│   └── seeds/            # Seed data
├── scripts/              # Utility scripts
└── docs/                 # Documentation
```

## Multi-Tenancy

This platform is designed as a **multi-tenant SaaS application**. Each manpower consultancy is a separate tenant with complete data isolation.

Key principles:
- Every tenant-owned table includes `tenant_id`
- Tenant context is derived from authenticated session
- No cross-tenant data access
- Tenant isolation enforced at repository/service layer

## Security

- HTTPS in production
- HttpOnly secure cookies
- Argon2id password hashing
- CSRF protection
- Rate limiting
- Input validation with Zod
- RBAC with granular permissions
- Audit logging
- Tenant data isolation

## Employee Assignment Architecture

Employees are NOT permanently tied to one client/location. The `employee_assignments` table maintains employment history, allowing employees to transfer between clients/locations while preserving historical records.

## Document Storage

Sensitive employee documents (Aadhaar, PAN, etc.) will be stored in private AWS S3 buckets. PostgreSQL stores only metadata. Access requires authorization and uses short-lived signed URLs.

## Future Enhancements

- Redis for caching and session management
- BullMQ for background jobs
- AWS S3 integration for document storage
- Mobile application (will use same API)
- Advanced reporting and analytics
- Multilingual support (Hindi, Gujarati, Marathi, etc.)

## Important Notes

- **NO Docker** - Run services directly
- **NO Microservices** - Modular monolith architecture
- **NO Next.js** - Using Vite + TanStack Router
- **NO GraphQL** - REST API only

## License

Proprietary - All rights reserved
