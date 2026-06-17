# Smoke Test Checklist

Run this after local build/start and after first cloud deployment.

## Public

- [ ] `/` loads.
- [ ] `/quote` loads.
- [ ] Generic quote intake does not repeat service-path questions.
- [ ] Calibration quote intake does not show calibration questions in generic mode.
- [ ] Quote submission saves and shows confirmation.

## Auth

- [ ] `/login` loads.
- [ ] `/admin` redirects unauthenticated users to login.
- [ ] Admin login works.
- [ ] Technician login reaches technician workspace.
- [ ] Sales role can access quotes but not manager-only pages.

## Admin QuoteFlow

- [ ] Admin dashboard loads.
- [ ] Quotes list loads.
- [ ] Quote detail loads.
- [ ] Edit quote enables local editing.
- [ ] Cancel changes reverts local edits.
- [ ] Save changes writes to database and activity log.
- [ ] Quote PDF exports.
- [ ] Quote converts to WorkFlow job.
- [ ] Calibration quote converts to CalOps work order.
- [ ] Calibration work order JSON export works.

## WorkFlow / Invoices

- [ ] Jobs list loads.
- [ ] Job detail loads.
- [ ] Work package PDF exports.
- [ ] Create invoice from quote works.
- [ ] Create invoice from job works.
- [ ] Invoices list loads.
- [ ] Invoice detail loads.
- [ ] Invoice status can move Draft, Sent, Paid, Void.
- [ ] Invoice PDF exports.

## CalOps

- [ ] CalOps dashboard loads when module is enabled.
- [ ] Assets, procedures, standards, work orders, certificates pages load.
- [ ] Work order package PDF exports.
- [ ] Certificate PDF exports.
- [ ] CalOps menus stay hidden for workspaces without CalOps enabled.

## Workspace / Modules

- [ ] Workspace switcher works.
- [ ] Module visibility changes by workspace.
- [ ] Settings page loads.
- [ ] Demo Mode badge shows only when `DEMO_MODE=true`.
- [ ] Production warning appears if `DEMO_MODE=false` and demo users still exist.
