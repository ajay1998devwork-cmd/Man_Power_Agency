# Shared database migrations

The local `manpower-dev` PostgreSQL database is shared by the Super Admin and
Manpower applications.

## Migration owner

`super-admin-platform/api` is the current migration owner. It already contains
the applied migration history and the existing shared tables. From the
`manpower-platform` root, use:

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
```

The root `db:generate`, `db:migrate`, and `db:push` commands delegate to the
existing Super Admin migration package. This prevents a second Drizzle
migration history from being created against the same database.

## Important safety rule

Do not run `pnpm --filter @manpower/database db:push` or
`pnpm --filter @manpower/database db:migrate` against `manpower-dev`. The
Manpower package contains application schema definitions, but it is not yet a
safe migration baseline for the already-existing shared database.

Manpower-specific tables must be added to the shared migration owner before
being used by the Manpower API. The `companies` table is the first such table
and was added through migration `0002_good_scrambler.sql`. Never use `db:push`
as a production/shared database migration strategy.
