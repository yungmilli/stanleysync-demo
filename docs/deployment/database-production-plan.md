# Database Production Plan

## Current Local State

The local PostgreSQL database has legacy drift from early StanleySync/Lead-era development. `prisma migrate dev` detects this drift and requests a reset. Do not reset the local database unless explicitly approved.

## Migration Inventory

Current migration folders:

- `20260422155354_stanleysync_init`
- `20260422190000_ops_backfill_manual`
- `20260422190500_quote_status_backfill_manual`
- `20260428130000_quoteflow_workorder_drafts`
- `20260428133000_quote_request_legacy_cleanup`
- `20260428173000_roles_team_ideas`
- `20260429120000_calops_execution_engine`
- `20260429143000_calops_phase3_depth`
- `20260508120000_modular_suite_workspaces`
- `20260508150000_phase5_product_ux_foundation`
- `20260511143000_phase6_invoices_workflow`

## Fresh Demo Database Strategy

Use a fresh PostgreSQL database for first cloud demo deployment.

Recommended flow:

```powershell
npm install
npm run db:generate
cd apps\quoteflow
npx prisma migrate deploy
npm run db:seed
```

Use `npm run db:seed` only when `DEMO_MODE=true`.

## Production Customer Strategy

For production customer use:

1. Create a fresh PostgreSQL database.
2. Set `DEMO_MODE=false`.
3. Run `npx prisma migrate deploy`.
4. Do not run the demo seed.
5. Create a real admin account with a unique password hash.
6. Verify default local demo users do not exist or are inactive.
7. Enable backups and point-in-time recovery if supported by the provider.

## Drift Risk

The local database should not be cloned as the production schema. It contains development history and drift from older Lead-based migrations. Production should be initialized from the current migration set or a clean SQL baseline generated from the current Prisma schema.

## Rollback

- Application rollback: redeploy the previous build.
- Database rollback: restore provider snapshot.
- Avoid manual destructive SQL in production.
