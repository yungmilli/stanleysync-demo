# Generic Cloud Deploy Guide

This guide applies to Vercel-like Next.js hosts, container hosts, or Node servers.

## Build Settings

- Install command: `npm install`
- Build command: `npm run build`
- Start command: `npm run start`
- App root: repository root `StanleySync_Suite`
- Application workspace: `apps/quoteflow`

## Runtime Requirements

- Node.js supported by Next.js 16
- PostgreSQL database
- Writable temp/runtime space only for framework internals
- No persistent local file storage is required for core demo use, but uploaded quote attachments currently write under `public/uploads` locally and need object storage before production customer use.

## Environment Variables

Configure all variables from `.env.example` in the cloud host. Do not upload local `.env` or `.env.local`.

## Database Deployment

For first demo deployment:

1. Create a fresh PostgreSQL database.
2. Set `DATABASE_URL`.
3. Run `npm run db:generate`.
4. Run migrations using the provider shell or CI job.
5. For demo only, run `npm run db:seed`.

For production:

1. Do not seed demo users.
2. Create a real admin user or use `ADMIN_EMAIL` plus `ADMIN_PASSWORD_HASH` temporarily.
3. Set `DEMO_MODE=false`.
4. Confirm no `@stanleysync.app` users remain active.

## Post-Deploy Checks

- `/` returns 200.
- `/quote` returns 200.
- `/login` returns 200.
- `/admin` redirects to login when unauthenticated.
- Login works.
- Admin dashboard loads.
- Quote submission saves.
- PDF exports return PDF responses.

## Local-Only Behaviors To Replace Before Production

- Quote attachments use local filesystem writes.
- SMTP may be unset and emails are skipped.
- Demo users and demo workspaces are intended for demo mode only.
- Minimal PDF writer should be replaced by a richer renderer for production templates.
