# Database Setup

## Prisma Location

Prisma stays inside:

`apps/quoteflow/prisma`

## Generate Client

From the repo root:

```powershell
npm.cmd run db:generate
```

From the app folder:

```powershell
cd apps\quoteflow
npm.cmd run db:generate
```

## Validate Schema

From the repo root:

```powershell
npm.cmd run prisma:validate
```

## Seed Sample Data

From the repo root:

```powershell
npm.cmd run db:seed
```

## Manual Migration Note

This local project currently depends on several manual SQL migration steps that were used to align the database safely. See:

- `apps/quoteflow/prisma/migrations/20260422190000_ops_backfill_manual/`
- `apps/quoteflow/prisma/migrations/20260422190500_quote_status_backfill_manual/`
- `apps/quoteflow/prisma/migrations/20260428130000_quoteflow_workorder_drafts/`
- `apps/quoteflow/prisma/migrations/20260428133000_quote_request_legacy_cleanup/`
