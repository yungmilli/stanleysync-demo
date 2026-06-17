# StanleySync Latest Build Log

## Phase 4 Modular Suite Work

Date: 2026-05-08

### Scope

StanleySync is being packaged as a modular service-business operating platform while preserving the current QuoteFlow, WorkFlow tickets, CalOps, roles, team, technician workspace, certificates, exports, SiteBuilder, and idea board work.

### Implemented

- Added `BusinessWorkspace` as the CoreOps workspace/business profile model.
- Added workspace links to customers, quotes, general tickets, SiteBuilder projects, CalOps assets, procedures, standards, calibration work orders, and certificate drafts.
- Added active workspace selection for users.
- Seeded demo workspaces for a general service company, an auto repair shop, and a calibration lab.
- Updated the admin dashboard into a module-based CoreOps dashboard.
- Added a workspace setup page for business type, enabled modules, branding, and operational counts.
- Updated suite navigation so CalOps-specific pages only show when CalOps is enabled.
- Separated quote conversion paths:
  - QuoteFlow quote to general WorkFlow job.
  - Calibration quote to CalOps calibration work order.
  - Existing Work Order Draft export remains available.
- Simplified customer intake so general service requests avoid calibration-specific asset prompts.
- Added CalOps calibration work order JSON export.
- Expanded the CalOps integration page with standalone versus integrated mode guidance, JSON export, import placeholder, and connector placeholder.
- Added local launch scripts for StanleySync, QuoteFlow, CalOps mode, migrations, and database seeding.

### Migration Notes

The Phase 4 migration is additive. It creates `BusinessWorkspace`, adds nullable workspace references, and avoids destructive schema changes. Existing records can remain valid without a workspace until they are backfilled or reseeded.

### Remaining Work

- Add editable workspace settings forms.
- Add module enable/disable controls with permission checks.
- Add import validation for standalone CalOps JSON packages.
- Add richer quote-to-job field mapping by industry.
- Add LeadEngine implementation after the placeholder module is approved.

## Phase 5 Product UX + Dashboard Architecture

Date: 2026-05-08

### Scope

Phase 5 reduces navigation clutter and moves StanleySync closer to a scalable SaaS product shell.

### Implemented

- Replaced overloaded admin navigation with primary SaaS navigation:
  - Dashboard
  - Customers
  - Quotes
  - WorkFlow
  - Team
  - Financials
  - Apps
  - Settings
- Added Apps launcher for QuoteFlow, WorkFlow, SiteBuilder, CalOps, LeadEngine, and Idea Board.
- Gated app launch visibility by active workspace enabled modules.
- Added card-based workspace switcher in the header instead of the old select dropdown.
- Added CalOps workspace sidebar with Dashboard, Assets, Procedures, Standards, Work Orders, Certificates, CalOps I/O, and Audit / Traceability.
- Added dashboard widget preference model with show/hide and order controls.
- Seeded dashboard layouts by business type.
- Added workspace branding settings for business name, logo placeholder, colors, theme accent, and industry.
- Added placeholder notification event architecture for quote submitted, quote approved, job assigned, work order due, and certificate ready.
- Added audit event model and admin audit center.
- Added CalOps audit / traceability page.
- Added reusable local PDF generation and PDF routes for:
  - Quote PDFs
  - General work package PDFs
  - Calibration certificate PDFs
  - Calibration work order package PDFs

### Verification

- `npm run db:generate` passed.
- `npm run prisma:validate` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed.

### Remaining Work

- Add drag-and-drop dashboard widget reordering.
- Add a full PDF template engine with pagination, tables, and stored exports.
- Connect the notification abstraction to a real email provider.
- Expand audit capture inside every mutation action.
- Apply the CalOps sidebar shell to every individual CalOps detail/list page, while keeping old URLs intact.

## Phase 6 Demo Readiness + Quote-To-Invoice Workflow

Date: 2026-05-11

### Scope

Phase 6 focuses on customer-demo readiness without rebuilding StanleySync or removing existing QuoteFlow, WorkFlow, CalOps, roles, exports, PDFs, workspace switching, or quick launch behavior.

### Implemented

- Fixed guided intake duplication by making the business path selection the single branch decision.
- Added transcript cleanup so repeated adjacent assistant/user messages are removed before display and persistence.
- Added a safe quote review editor with explicit Edit, Save changes, Cancel changes, and unsaved-change browser warning behavior.
- Expanded quote review fields for status, priority, assignee, service type, turnaround, quoted amount, customer-visible notes, internal notes, and conversion path.
- Added additive Invoice and InvoiceLineItem models.
- Added Invoice status flow: Draft, Sent, Paid, Void.
- Added invoice creation from quote, general job, and CalOps work order.
- Added `/admin/invoices` and `/admin/invoices/[id]`.
- Added invoice PDF export at `/api/invoices/[id]/pdf`.
- Upgraded quote, work package, invoice, and calibration certificate PDF routes to use a more professional document layout helper.
- Added WorkflowStage model and a settings-page MVP to view/restore default QuoteFlow, WorkFlow, and CalOps stages.
- Simplified primary admin navigation to Dashboard, Customers, Quotes, Jobs, Invoices, Apps, and Settings.
- Added demo invoice seed data in the seed script.

### Migration Notes

- Added migration `20260511143000_phase6_invoices_workflow`.
- `prisma migrate dev` detected legacy local database drift and requested a reset. The reset was not run.
- The new additive SQL migration was applied with `prisma db execute` to preserve existing local data.

### Remaining Work

- Add full workflow-stage label editing and drag reordering UI.
- Add invoice line-item editing from the invoice detail page.
- Replace the minimal PDF writer with a paginated template engine before production deployment.
- Add browser-level regression tests for the full quote-to-invoice path.

## Phase 7 Deployment Readiness + Production Hardening

Date: 2026-05-11

### Scope

Phase 7 prepares StanleySync for first cloud demo deployment without adding major modules or changing current QuoteFlow, WorkFlow, CalOps, invoices, PDFs, roles, workspaces, dashboard, or quick launch behavior.

### Implemented

- Normalized root package scripts to use the QuoteFlow workspace directly.
- Preserved stable local dev mode with `next dev --webpack`.
- Added root `.env.example` and expanded app `.env.example`.
- Added `APP_BASE_URL` and `DEMO_MODE` environment handling.
- Added Demo Mode badge in the admin shell.
- Added production-mode warning if default local demo users still exist.
- Added global error and not-found pages for friendlier failure states.
- Documented deployment environment setup.
- Documented clean production database strategy because local DB has legacy drift.
- Documented generic cloud deployment steps.
- Added smoke test checklist for quote intake, auth, admin, invoices, PDFs, WorkFlow, CalOps, roles, and workspace/module visibility.

### Deployment Audit Summary

- Framework: Next.js 16.2.4, React 19.2.4.
- Database: PostgreSQL via Prisma 6.18.0.
- Auth: NextAuth credentials provider with role guards.
- Local-only concern: quote attachments currently write under local `public/uploads`.
- Demo-only concern: seeded users use known local credentials and must not be active in production.
- Production blocker: local database drift means the first cloud demo should use a fresh Postgres database initialized from migrations/schema, not a clone of the local DB.

### Remaining Work

- Replace local attachment storage with object storage.
- Add managed email provider configuration and verified sender.
- Replace minimal PDF helper with a full template renderer.
- Add CI smoke tests and migration checks.
- Rotate/remove seeded demo users before customer-facing production.

## Phase 8 First Customer Deployment Preparation

Date: 2026-06-01

### Scope

Phase 8 stops major feature work and focuses on making the existing StanleySync app cleaner for a first customer demo or controlled pilot.

### Implemented

- Updated default branding toward StanleySync and StanleySync Labs.
- Refreshed seeded demo environments:
  - StanleySync Labs with Servo Innovations torque, force, pressure, work order, standard, and certificate demo records.
  - StanleySync Auto Demo with auto repair quote, job, and invoice records.
  - StanleySync CoreOps Demo with general service quote, WorkFlow ticket, and paid invoice records.
- Improved quote, invoice, work package, and certificate PDF output with a branded header, logo marker, document metadata, customer/contact sections, signature areas, footer, and page numbering.
- Added root production script aliases: `build:production` and `start:production`.
- Added local production helper scripts:
  - `scripts/local/production-build.bat`
  - `scripts/local/production-start.bat`
- Added customer deployment preparation docs:
  - `docs/deployment/local-installer-plan.md`
  - `docs/demo/demo-script.md`
  - `docs/customer-readiness-report.md`

### Readiness

- Estimated readiness: 78% for a controlled first customer pilot.
- Remaining pilot blockers: fresh production database, real environment secrets, demo credential rotation, production email provider, backup plan, and final certificate language review.

## Today General-Service Demo Release

Date: 2026-06-01

### Scope

Prepared StanleySync for a same-day tester release focused on general service businesses.

### Implemented

- Rebranded public/demo surfaces as StanleySync App with the tagline "Quote. Track. Invoice. All in one place."
- Kept StanleySync Labs / calibration tooling as admin-only internally and Coming Soon / Pro for demo customers.
- Restricted non-admin access to internal CalOps routes, including assets, procedures, standards, certificates, work orders, and CalOps I/O.
- Added the `demo@stanleysync.app` local demo account and set it to the general-service workspace.
- Updated the Apps page to show QuoteFlow, WorkFlow, and Invoicing as enabled while SiteBuilder, StanleySync Labs, and LeadEngine show Coming Soon.
- Added tester handoff, feedback form, and USB demo packaging docs.
- Verified the root layout remains:
  - `README.md`
  - `START_STANLEYSYNC.bat`
  - `StanleySync_Suite/`

### Demo Path

- Create quote
- Review quote
- Convert quote to job
- Track job
- Create invoice
- Export quote, invoice, and work package PDFs

## Final Deployment Sprint

Date: 2026-06-14

### Scope

Prepared StanleySync App for real customer testing and first sales without rebuilding architecture or redesigning the UI.

### Implemented

- Added first-run company setup at `/admin/first-run`.
- Extended the workspace profile with logo URL, quote terms, invoice terms, and setup completion tracking.
- Added local logo upload handling under `public/uploads/workspaces/`.
- Updated Settings so owner/admin/manager users can save business name, contact info, colors, logo, quote terms, and invoice terms.
- Updated quote, invoice, work order, certificate, and CalOps work order PDF routes to use dynamic workspace contact/terms instead of local placeholder addresses.
- Centralized notification email templates in `src/lib/email-templates.ts`.
- Clarified invoice payment link controls with Add, Copy, and Send Payment Link placeholder behavior.
- Added production database deploy scripts via `npm run db:deploy`.
- Added Windows installer packaging assets under `scripts/installer/`.
- Added tester and deployment runbooks:
  - `docs/tester-guide.md`
  - `docs/deployment/windows-installer-plan.md`
  - `docs/deployment/final-release-checklist.md`

### Readiness

- Recommended release version: `0.9.0-rc.1`.
- Intended release type: controlled external tester / first pilot.
- Remaining blockers before paid production: real SMTP account, real payment processor, backup/restore process, installer test on a clean Windows machine, and customer-specific credential rotation.

## Phase 10 Pilot Release Package

Date: 2026-06-14

### Scope

Prepared StanleySync App for a web-first tester rollout, with local installer/USB packaging as the secondary path.

### Implemented

- Added public tester onboarding at `/demo/start`.
- Added public pilot feedback collection at `/demo/feedback`, storing responses as audit events.
- Added owner/admin checklist at `/admin/pilot-checklist`.
- Added release flags:
  - `DEMO_MODE`
  - `PILOT_MODE`
  - `ENABLE_LABS_MODULE`
  - `ENABLE_PUBLIC_SIGNUP`
- Hid Settings from Demo User navigation.
- Restricted StanleySync Labs behind `ENABLE_LABS_MODULE=true` and System Owner access.
- Added web pilot handoff docs:
  - `docs/demo/send-to-testers.md`
  - `docs/demo/demo-login.md`
  - `docs/deployment/pilot-release-checklist.md`
- Updated USB and Windows installer docs with pilot mode flags.

### Readiness

- Intended release type: web demo pilot first, local installer/USB second.
- Remaining pilot risks: real web host deployment, SMTP/payment integrations, and clean-machine installer validation.

## Phase 11 Tester Package and First Impression Polish

Date: 2026-06-14

### Scope

Prepared StanleySync App for direct handoff to beta testers and business owners, focusing on first impressions, branding, and onboarding.

### Implemented

- Reworked `/` into a branded Welcome Screen with StanleySync logo and the primary actions:
  - Launch Demo
  - Quick Start Guide
  - Contact / Feedback
- Added tester onboarding pages:
  - `/demo/quick-start`
  - `/demo/walkthrough`
  - `/demo/feedback`
- Updated `/demo/start` to link the full onboarding path.
- Branded the login page with StanleySync logo and pilot-focused copy.
- Added tester package docs:
  - `docs/demo/beta-tester-guide.md`
  - `docs/deployment/tester-package-plan.md`
  - `docs/demo/first-impression-review.md`

### Readiness

- Tester package is ready for web-first beta review.
- Remaining first-impression polish is mostly advanced wording, seeded data cleanup, and real email/payment integrations.

## Phase 12 Final Demo Polish and Payment Workflow

Date: 2026-06-15

### Scope

Tightened the final tester workflow without adding new major modules.

### Implemented

- Added safe Save changes / Cancel changes behavior to job detail edits with an unsaved changes warning.
- Added Invoice Pending to WorkFlow and CalOps status flows.
- Updated invoice status handling so Sent and Pending Payment keep linked jobs at Invoice Pending, and Paid closes linked jobs or calibration work orders.
- Improved job comments so manager/admin/technician notes are saved into the progress/activity history with the comment text.
- Clarified invoice detail controls with a real Export Invoice PDF button, payment provider/status fields, Save payment link, Copy payment link, Mark as sent, and Mark as paid.
- Updated invoice PDF/email payment-link support so payment instructions can include the stored payment URL.
- Added a branded dashboard pilot panel to reduce empty space and make the quote-to-invoice workflow more obvious.
- Updated tester handoff, demo script, and pilot checklist with the final Quote -> Job -> Invoice -> Payment -> Closed test path.

### Readiness

- Ready for final verification against Prisma, typecheck, lint, build, and local route smoke tests.
- Remaining production integrations are real SMTP and a real payment processor.
