# Legacy Lead Migration Note

StanleySync no longer uses the old `Lead` model or `Lead` table.

Current quote/customer architecture uses:

- `Customer`
- `QuoteRequest`
- `BusinessWorkspace`
- `Ticket` for WorkFlow jobs
- CalOps calibration work order models

The old manual migration `20260422190000_ops_backfill_manual` references `Lead` because it was written to backfill early prototype data into `Customer`. That SQL is historical and should not be re-run against the current database after `20260428133000_quote_request_legacy_cleanup` has dropped the legacy `Lead` table.

The safe manual maintenance script is:

```text
scripts/local/run-migrations-manual.bat
```

It runs Prisma generate and validation only. It does not run obsolete Lead-era SQL or automatic database resets.
