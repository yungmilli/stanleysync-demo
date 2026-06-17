# QuoteFlow Architecture

## Purpose

QuoteFlow is the front-office intake and quoting app in the StanleySync suite.

It is responsible for:

- customer intake
- structured quote capture
- admin review
- Work Order Draft preparation
- future CalOps handoff export

## Runtime Application Location

`apps/quoteflow`

## Main Technical Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- NextAuth credentials auth

## Major App Areas

- `src/app`
  routes, layouts, route handlers
- `src/components`
  reusable UI
- `src/features/quotes`
  intake and AI assistance
- `src/features/admin`
  server actions and auth guards
- `src/features/ops`
  dashboard and admin queries
- `src/features/work-orders`
  Work Order Draft payload/export logic
- `src/features/websites`
  Website Builder support
- `src/lib`
  auth, env, Prisma, mail, utilities

## Database Location

Prisma remains inside:

`apps/quoteflow/prisma`

That is a deliberate stability decision for this pass.

## Workflow Shape

1. Customer submits a guided quote intake.
2. QuoteFlow stores the quote and customer record.
3. Admin reviews the quote and adds internal notes.
4. Admin updates status and pricing details.
5. Admin converts the quote into a `WorkOrderDraft`.
6. QuoteFlow exports that draft as JSON.
7. Future CalOps imports the payload and continues downstream execution.
