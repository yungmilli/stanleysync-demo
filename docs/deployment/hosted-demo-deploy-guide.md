# Hosted Demo Deploy Guide

StanleySync App beta testers should use a hosted web demo. They should not download files or install local dependencies.

## Target Stack

- App host: Vercel or similar Next.js host
- Database: Neon or Supabase PostgreSQL
- App mode:
  - `DEMO_MODE=true`
  - `PILOT_MODE=true`
  - `ENABLE_LABS_MODULE=false`
  - `ENABLE_PUBLIC_SIGNUP=false`

## Vercel Project Settings

Use `StanleySync_Suite` as the project root.

Recommended settings:

- Framework preset: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: leave default for Next.js

The repository includes `vercel.json` with the hosted demo install/build commands.

## Required Environment Variables

Set these in the hosting provider:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="https://demo.stanleysync.app"
APP_BASE_URL="https://demo.stanleysync.app"

DEMO_MODE="true"
PILOT_MODE="true"
ENABLE_LABS_MODULE="false"
ENABLE_PUBLIC_SIGNUP="false"

ADMIN_EMAIL="admin@stanleysync.app"
ADMIN_PASSWORD_HASH="preferred-for-hosted-demo"
# ADMIN_PASSWORD may be used only for temporary controlled demos.

ADMIN_NOTIFICATION_EMAIL="ops@stanleysync.app"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="StanleySync App <noreply@stanleysync.app>"
```

Optional:

```env
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-5-mini"
```

## Database Setup

1. Create a fresh PostgreSQL database in Neon or Supabase.
2. Copy its pooled or standard connection string.
3. Set `DATABASE_URL` in the host environment variables.
4. Run production migrations:

```text
npm run db:deploy
```

This uses Prisma `migrate deploy`, not `migrate dev`.

5. Seed demo data only after confirming `DEMO_MODE=true`:

```text
npm run seed:demo
```

The seed command refuses to run when `DEMO_MODE` is not true.

6. Verify demo readiness:

```text
npm run verify:demo
```

## Deploy Steps

1. Create the hosted project.
2. Set the project root to `StanleySync_Suite`.
3. Add environment variables.
4. Connect the hosted PostgreSQL database.
5. Deploy preview.
6. Run `npm run db:deploy` against the hosted database.
7. Run `npm run seed:demo`.
8. Run `npm run verify:demo`.
9. Smoke test:
   - `/`
   - `/demo/start`
   - `/quote`
   - `/login`
   - `/admin`
   - quote to job to invoice workflow
   - quote PDF
   - work order PDF
   - invoice PDF
   - feedback page
10. Send testers the demo link and login details.

## Demo URL Format

```text
https://demo.stanleysync.app
```

Temporary preview URL format:

```text
https://stanleysync-app-[preview-id].vercel.app
```

## Tester Login

Default demo account after seeding:

```text
demo@stanleysync.app
```

Send the password privately.

## Customer Intake URL Format

Public quote intake does not require the end customer to log in.

```text
https://demo.stanleysync.app/intake/company-name
```

Business owner/admin login remains separate:

```text
https://demo.stanleysync.app/login
```

## Rollback

If a deployment fails:

1. Revert or redeploy the last known working build.
2. Do not rerun demo seed blindly.
3. Inspect host logs and database migration status.
4. Verify `/login`, `/quote`, and `/admin` before sending the link again.
