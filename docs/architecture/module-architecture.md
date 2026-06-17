# StanleySync Module Architecture

## Principle

General business workflow and calibration workflow stay separate but connected. CoreOps provides the workspace shell and shared business records. CalOps remains a specialized module that only appears for workspaces that enable it.

## Core Models

- `BusinessWorkspace`: business profile, business type, contact data, service categories, brand colors, and enabled modules.
- `Customer`: shared customer record, optionally scoped to a workspace.
- `QuoteRequest`: QuoteFlow intake record, optionally scoped to a workspace.
- `Ticket`: general WorkFlow job/ticket for non-calibration service execution.
- `WebsiteProject`: SiteBuilder project.
- `CalAsset`, `CalibrationProcedure`, `CalibrationStandard`, `CalibrationWorkOrder`, `CertificateDraft`: CalOps-specific records.

## Module Boundaries

CoreOps:

- Workspace selection
- Module dashboard
- Customers
- Team
- Activity
- Financial overview

QuoteFlow:

- Guided intake
- Quote review
- Quote exports
- Conversion to WorkFlow or CalOps

WorkFlow:

- General jobs and tickets
- Assigned team member
- Status
- Due date
- Quoted, billed, cost, and notes

CalOps:

- Calibration assets
- Parent/child asset relationships
- Standards assignments
- Procedure library
- Calibration execution data
- Tolerance decisions
- Uncertainty and traceability placeholders
- Certificate drafts and package exports

## Navigation

The admin suite navigation reads the active workspace's enabled modules:

- Primary navigation stays stable: Dashboard, Customers, Quotes, WorkFlow, Team, Financials, Apps, Settings.
- Apps launcher exposes QuoteFlow, WorkFlow, SiteBuilder, CalOps, LeadEngine, and Idea Board.
- Apps are shown only when enabled for the active workspace, except Idea Board which remains a shared team feedback tool.
- CalOps is treated as a module workspace. Its left sidebar contains Dashboard, Assets, Procedures, Standards, Work Orders, Certificates, CalOps I/O, and Audit / Traceability.
- General service workspaces do not show calibration-specific menus in the primary navigation.

## Dashboard Widgets

Dashboard widgets are stored as workspace preferences:

- Quotes
- Jobs
- Revenue
- Profit
- Team workload
- Open tickets
- Due dates
- Customer growth
- Assets due
- Standards due
- OOT assets
- Certificates

Each workspace can show, hide, and order widgets. Demo layouts are seeded by business type.

## Documents And Notifications

Phase 5 adds a reusable local PDF foundation for quotes, work packages, calibration certificates, and calibration work packages. It also adds placeholder notification events so a future email provider can send quote, job, work order, and certificate notifications through a consistent abstraction.

## Migration Strategy

All Phase 4 changes are additive:

- Create workspace table.
- Add nullable workspace foreign keys.
- Add active workspace link to users.
- Seed demo workspaces.
- Backfill seeded demo records.

No destructive resets or field removals are required.
