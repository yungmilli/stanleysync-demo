# StanleySync Local Installer Plan

INTERNAL ONLY.

Developer setup and local installer experiment. Not for customers yet.

## Goal

Package the existing StanleySync Suite for a first customer demo or local pilot without adding new modules or changing the architecture.

## Runtime Dependencies

- Windows 10/11 workstation or Windows Server host.
- Node.js compatible with Next.js 16.
- npm for workspace scripts.
- PostgreSQL database reachable through `DATABASE_URL`.
- Prisma Client generated during install/build.
- Network access to the app host on port 3000 unless another port is configured.

## Required Environment

Create `.env` files from `.env.example` and `apps/quoteflow/.env.example`.

Required values:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `APP_BASE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH`
- `DEMO_MODE=true` for demo installs, `false` for production pilots

Optional values:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Database Requirements

- Use a fresh production or pilot PostgreSQL database.
- Do not use the local development database as the production schema source because it has historical drift from early development phases.
- Run Prisma migrations only against a backed-up database.
- For demo installs, run the seed script after migration to load realistic StanleySync, StanleySync Labs, Servo Innovations, auto repair, and general service data.

## Startup Process

Build:

```powershell
npm install
npm run db:generate
npm run prisma:validate
npm run build:production
```

Start:

```powershell
npm run start:production
```

Local helper scripts:

- `scripts/local/production-build.bat`
- `scripts/local/production-start.bat`
- `scripts/local/stop-dev-server.bat`
- `scripts/local/run-migrations-manual.bat`
- `scripts/local/seed-database-manual.bat`

## Installer Requirements

A future installer should:

- Verify Node.js and npm are installed.
- Collect or validate `DATABASE_URL`, `NEXTAUTH_SECRET`, and base URL values.
- Offer demo seed as an explicit opt-in.
- Run `npm install`, `npm run db:generate`, `npm run prisma:validate`, and `npm run build:production`.
- Register a start shortcut that runs `npm run start:production`.
- Avoid automatic migrations unless the user explicitly chooses database setup.
- Avoid automatic seed in production mode.
- Check port 3000 before starting the app.

## Current Packaging Boundary

StanleySync is ready for a first local pilot package as a Node.js application. It is not yet a single-click installer. The next packaging step is to wrap the build/start scripts with an installer UI or scripted setup process.
