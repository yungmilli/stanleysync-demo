# Database Notes

Prisma remains inside:

`apps/quoteflow/prisma`

## Why Prisma Was Not Moved Again

- QuoteFlow already has verified manual migration SQL.
- The local runtime and seed flow were just stabilized against the current Prisma location.
- Moving Prisma into a root database package during this organization pass would create unnecessary schema-path and migration-history risk.

## Current Important Files

- `apps/quoteflow/prisma/schema.prisma`
- `apps/quoteflow/prisma/seed.ts`
- `apps/quoteflow/prisma/migrations/...`

## Current Migration Reality

This repo uses both Prisma-managed structure and manual `prisma db execute` migration application for some recovery and alignment steps.

That is acceptable for the current local environment, but migration history normalization is still a worthwhile future cleanup item.
