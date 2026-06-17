# StanleySync Customer Readiness Report

## Readiness Score

Estimated readiness: **78% for a first controlled customer pilot**.

This means StanleySync is suitable for a guided demo or limited pilot with a friendly service business or calibration lab. It is not yet ready for broad self-serve SaaS onboarding.

## Completed Modules

- Workspace system with business type and enabled modules.
- QuoteFlow guided intake for general service, auto repair, website/design, contractor/field service, custom service, and calibration.
- Admin quote review with safe edit/save behavior.
- WorkFlow jobs/tickets with assignments, due dates, statuses, financial tracking, and work package PDFs.
- Invoices with quote/job/work-order linkage and invoice PDFs.
- CalOps module with assets, procedures, standards, work orders, execution screens, certificates, JSON export, and audit/traceability surfaces.
- Technician workspace for assigned jobs and calibration work.
- Dashboard widgets and module-based navigation.
- Role-based access for admin, manager, technician, and sales.
- PDF outputs for quotes, invoices, work packages, and calibration certificates.
- Deployment documentation, environment setup, database plan, and local production scripts.

## Branding Status

Default product branding now uses:

- StanleySync
- StanleySync Labs

Demo calibration customer:

- Servo Innovations

Demo environments:

- StanleySync Labs calibration lab
- StanleySync Auto Demo
- StanleySync CoreOps Demo

## Remaining Weaknesses

- Local database has historical drift; production should start from a fresh database.
- Demo users and known local passwords must be replaced before external customer access.
- Email provider integration is configured as an abstraction but not connected to a live production sender.
- File upload/storage is still local or placeholder-oriented and needs object storage for cloud deployment.
- PDFs are professional enough for demos but still use a lightweight internal renderer.
- Certificate language needs lab quality review before use for regulated customer calibration records.
- No automated end-to-end test suite yet for quote-to-invoice and quote-to-CalOps flows.
- No backup/restore automation, observability, or production monitoring yet.

## Deployment Blockers

Critical before paid pilot:

- Fresh PostgreSQL production database.
- Real secrets in environment variables.
- Rotate or disable seeded demo users.
- Decide whether demo seed data is allowed in the pilot environment.
- Configure `NEXTAUTH_URL`, `APP_BASE_URL`, and `NEXTAUTH_SECRET`.

Important before wider rollout:

- Production email provider.
- Persistent file storage.
- Backups and rollback plan.
- Error monitoring.
- E2E smoke tests.

## Recommended First Paying Customer Profile

Best first pilot:

- Small calibration lab, repair shop, or service contractor with 3-12 internal users.
- Has quote intake pain and job tracking gaps.
- Can tolerate guided onboarding.
- Does not require self-serve signup, multi-tenant billing, or fully validated ISO certificate language on day one.

Best calibration pilot:

- A torque/pressure/load lab that needs quoting, asset records, work order execution, and draft certificate packages, but is willing to review certificate language before production use.

## Remaining Work Before Customer Pilot

1. Provision fresh pilot database.
2. Set production environment variables.
3. Create real admin account and remove demo credentials.
4. Run smoke checklist from `docs/deployment/smoke-test-checklist.md`.
5. Confirm PDF content with customer-facing terms.
6. Confirm certificate wording with lab quality owner.
7. Configure backups.
8. Decide deployment host and domain.
