# StanleySync QuoteFlow

QuoteFlow is the customer-facing intake and quoting app inside the StanleySync software suite.

It is intentionally separate from future StanleySync CalOps. QuoteFlow captures customer requests, supports admin review, and prepares `WorkOrderDraft` exports that CalOps can import later.

## App Location

This app now lives in:

`apps/quoteflow`

Recommended local suite path:

`C:\Users\mcsta\AppData\Local\StanleySyncApp`

Prisma also stays inside this app:

`apps/quoteflow/prisma`

That decision is intentional. Prisma remains colocated with QuoteFlow because this project already depends on manual migration SQL plus seeded local runtime flows, and moving Prisma again would create unnecessary migration risk.

## Main Responsibilities

- customer quote intake
- AI-guided follow-up questions with deterministic fallback
- admin quote review
- internal notes
- Work Order Draft creation
- CalOps handoff JSON export
- print-friendly Work Order Draft export for PDF saving
- team roles and technician work views
- internal Idea Board collaboration
- website-builder admin tooling already present in the app

## Core App Structure

- `src/app`
  Next.js App Router routes and route handlers
- `src/components`
  shared UI components
- `src/features/quotes`
  intake logic, AI analysis, persistence
- `src/features/admin`
  auth guards and server mutations
- `src/features/ops`
  admin queries and dashboard data
- `src/features/work-orders`
  Work Order Draft payload shaping and export logging
- `src/features/websites`
  Website Builder support
- `src/lib`
  auth, Prisma, env, mail, and utilities
- `prisma`
  schema, seed, and migrations

## Local Commands

From `apps/quoteflow`:

```powershell
npm.cmd install
npm.cmd run db:generate
npx.cmd prisma validate
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run build
```

## Roles

QuoteFlow now supports four seeded roles:

- `Admin`
  full access across QuoteFlow
- `Manager`
  quotes, tickets, assignments, exports, and operational oversight
- `Technician`
  assigned ticket dashboard, status updates, work comments, and job activity history
- `Sales`
  quotes, customers, website builder, and basic activity visibility

## Seeded Local Users

After `npm.cmd run db:seed`, the local database includes:

- `admin@stanleysync.app`
- `manager@stanleysync.app`
- `tech@stanleysync.app`
- `sales@stanleysync.app`

Local seeded password for those development accounts:

- `Stanley123!`

If `ADMIN_EMAIL` and `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH` are also set, the env admin fallback still works.

From the suite root, the wrapper commands also work:

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run db:generate
```

## Environment Files

Keep QuoteFlow environment files in:

- `apps/quoteflow/.env`
- `apps/quoteflow/.env.local`

## Manual Migrations In Use

This app currently includes manual migration SQL that has already been used to safely align the local database:

- `20260422190000_ops_backfill_manual`
- `20260422190500_quote_status_backfill_manual`
- `20260428130000_quoteflow_workorder_drafts`
- `20260428133000_quote_request_legacy_cleanup`

## Handoff Summary

1. Customer submits a quote request.
2. Admin reviews the request in QuoteFlow.
3. Admin converts the quote into a `WorkOrderDraft`.
4. QuoteFlow exports the draft as JSON or opens a print-friendly page for PDF saving.
5. Future CalOps will import that payload and continue downstream calibration workflow execution.

## New MVP Areas

### Team Management

- Route: `/admin/team`
- Admins can create users, assign roles, and deactivate/reactivate access.

### Technician Work View

- Route: `/tech`
- Assigned technicians can view only their own work, update ticket status, and add work comments.

### Idea Board

- Route: `/admin/ideas`
- Logged-in users can post ideas, filter by status/category, comment, and assign an owner.

### Work Order Draft Export

- JSON export: `/api/work-order-drafts/[id]/export`
- Print/PDF path: `/admin/work-order-drafts/[id]/print`

The print route is the current PDF fallback. Open it and use the browser's print dialog to save a PDF.

## How To Test The New Features

1. Run the migration SQL and seed:
   `npx.cmd prisma db execute --file prisma/migrations/20260428173000_roles_team_ideas/migration.sql --schema prisma/schema.prisma`
   `npm.cmd run db:seed`
2. Start the app:
   `npm.cmd run dev`
3. Sign in with one of the seeded users.
4. Open `/admin/team` and confirm role management works.
5. Open `/admin/quotes/[id]` and convert/export a Work Order Draft.
6. Open `/admin/work-order-drafts/[id]/print` and use print preview / Save as PDF.
7. Sign in as `tech@stanleysync.app` and verify `/tech`.
8. Open `/admin/ideas` and create a post or comment.
