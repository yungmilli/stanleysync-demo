# StanleySync Demo Readiness Plan

## Current Focus

StanleySync is being prepared for customer demos as a modular service-business operating platform. QuoteFlow, WorkFlow, SiteBuilder, CalOps, roles, exports, PDFs, dashboard widgets, workspace switching, and quick launch remain preserved.

## Phase 6 Improvements

- Quote intake now branches once by business/request type and avoids repeated service-type prompts.
- Admin quote review now uses safe edit mode instead of accidental dropdown saves.
- Quote review changes are saved only when the admin clicks Save changes.
- Invoice records now connect to customers, quotes, jobs, and CalOps work orders.
- Demo invoices can be created from finalized quotes, completed jobs, or certificate-ready calibration work orders.
- Customer-facing PDFs now use a consistent professional document layout.
- Settings include an MVP workflow-stage viewer with restore-defaults behavior.

## Demo Flow

1. Start StanleySync with `START_STANLEYSYNC.bat`.
2. Open `/quote` and submit a generic or calibration quote.
3. Log in and open `/admin/quotes`.
4. Open the quote detail page.
5. Click Edit quote, update amount/status/notes, then Save changes.
6. Export the quote PDF.
7. Convert the quote to a job or CalOps work order.
8. Complete the job/work order enough for invoicing.
9. Create an invoice and export the invoice PDF.

## Deployment Gaps

- Real email sending provider.
- Payment provider or payment-link integration.
- Production PDF rendering engine with pagination and richer styling.
- Hosted database migration reconciliation for legacy local drift.
- Automated browser tests for demo-critical flows.
