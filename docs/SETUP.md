# Setup Guide

## Prerequisites

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0
- **PostgreSQL**: >= 14

## Initial Setup

### 1. Install Dependencies

```bash
cd manpower-platform
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and update the following:

- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Generate a secure random string
- `JWT_REFRESH_SECRET` - Generate a secure random string
- `SESSION_SECRET` - Generate a secure random string

### 3. Setup Database

```bash
# Create the database
createdb manpower_platform

# Generate and run migrations
cd database
pnpm db:generate
pnpm db:migrate
```

### 4. Start Development

```bash
# From the root directory
pnpm dev
```

This will start:
- **Tenant Admin** on http://localhost:5173
- **Employee Portal** on http://localhost:5174
- **API Server** on http://localhost:3000

## Individual App Commands

```bash
# Start only the web app
pnpm --filter @manpower/web dev

# Start only the employee portal
pnpm --filter @manpower/employee dev

# Start only the API
pnpm --filter @manpower/api dev

# Build specific app
pnpm --filter @manpower/web build
```

## Database Commands

```bash
cd database

# Generate migrations from schema changes
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema directly (dev only)
pnpm db:push

# Open Drizzle Studio
pnpm db:studio

# Seed database
pnpm db:seed
```

## Production Build

```bash
# Build all apps and packages
pnpm build

# The built files will be in:
# - apps/web/dist
# - apps/employee/dist
# - apps/api/dist
```

## Troubleshooting

### Port Already in Use

If ports 5173, 5174, or 3000 are already in use, you can change them:

- **Web/Employee**: Edit `vite.config.ts` in the respective app
- **API**: Change `API_PORT` in `.env`

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Verify credentials in `.env`
3. Check that the database exists: `psql -l`

### TypeScript Errors

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

## Next Steps

After successful setup:

1. Review the architecture documentation in `docs/ARCHITECTURE.md`
2. Understand the multi-tenancy model in `docs/MULTI_TENANCY.md`
3. Check security guidelines in `docs/SECURITY.md`
