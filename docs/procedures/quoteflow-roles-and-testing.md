# QuoteFlow Roles And Testing

## Roles

QuoteFlow now supports:

- `Admin`
  full access
- `Manager`
  quotes, tickets, assignments, exports
- `Technician`
  assigned work, ticket updates, work comments
- `Sales`
  quotes, customers, website builder, basic activity

## Local Seeded Users

After running the seed:

- `admin@stanleysync.app`
- `manager@stanleysync.app`
- `tech@stanleysync.app`
- `sales@stanleysync.app`

Password:

- `Stanley123!`

## New Routes

- `/admin/team`
- `/admin/ideas`
- `/tech`
- `/tech/tickets/[id]`
- `/admin/work-order-drafts/[id]/print`

## Export Notes

- JSON export remains available through `/api/work-order-drafts/[id]/export`
- The print route is the current PDF fallback
- Open the print route and use the browser print dialog to save a PDF

## Local Validation Flow

1. Apply migration:
   `npx.cmd prisma db execute --file prisma/migrations/20260428173000_roles_team_ideas/migration.sql --schema prisma/schema.prisma`
2. Seed data:
   `npm.cmd run db:seed`
3. Generate Prisma client:
   `npm.cmd run db:generate`
4. Validate schema:
   `npm.cmd run prisma:validate`
5. Typecheck:
   `npm.cmd run typecheck`
6. Lint:
   `npm.cmd run lint`
7. Build:
   `npm.cmd run build`
8. Start dev server:
   `npm.cmd run dev`

## Smoke Test Checklist

1. Sign in as `admin@stanleysync.app`.
2. Open `/admin/team` and verify team rows render.
3. Open `/admin/quotes`, then a quote detail page, and confirm assignee selection works.
4. Convert a quote to a Work Order Draft if one is not already linked.
5. Export JSON from the quote detail or CalOps Integration page.
6. Open the print route and confirm the page is printable.
7. Open `/admin/ideas` and add a comment.
8. Sign out and sign in as `tech@stanleysync.app`.
9. Open `/tech` and confirm assigned work appears.
10. Open a technician ticket and submit a work update comment.
