# Deployment Readiness Checklist

## Stack

- Framework: Next.js `16.2.4`
- React: `19.2.4`
- Runtime: Node.js compatible with Next.js 16
- Database: PostgreSQL through Prisma `6.18.0`
- Auth: NextAuth credentials provider with role checks
- PDF/export: local server-side PDF helper returning generated PDFs

## Local Verification

```powershell
npm install
npm run db:generate
npm run prisma:validate
npm run typecheck
npm run lint
npm run build
npm run start
```

## Required Environment

See `docs/procedures/environment-setup.md`.

Minimum production/demo variables:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `APP_BASE_URL`
- `DEMO_MODE`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH` or seeded admin user

## Database

- Use a fresh PostgreSQL database for first cloud demo deployment.
- Run `npm run db:generate`.
- Run Prisma migrations against the fresh database.
- Seed only demo environments. Do not seed production customer environments with demo users.

## Auth

- Confirm `/admin/*` redirects unauthenticated users to `/login`.
- Confirm Admin/Manager/Sales/Technician roles land in the correct areas.
- Rotate seeded demo passwords before any non-demo customer access.

## Smoke Test

Use `docs/deployment/smoke-test-checklist.md`.

## Rollback

- Keep the last known working deployment available in the host.
- Roll back app code first.
- For database changes, do not destructively reset. Restore from provider snapshot if needed.
- For failed migrations, stop deployment and inspect Prisma migration logs before retrying.

## Current Blockers

- Local database has legacy drift from older StanleySync phases. Do not use the local DB as the production schema source.
- Production should start from the current Prisma schema/migration set on a fresh database.
- PDF output is demo-ready but not a full production-grade template engine.
