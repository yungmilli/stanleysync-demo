# StanleySync Modular Suite Plan

## Product Packaging

StanleySync is organized as a modular platform:

- StanleySync CoreOps: workspace, customers, team, activity, financial overview, and module packaging.
- QuoteFlow: customer intake, quote review, quote exports, and quote-to-work conversion.
- WorkFlow: general service jobs, assignments, due dates, notes, and financial tracking.
- SiteBuilder: starter website builder for client-facing service pages.
- CalOps: specialized calibration lab operations for assets, procedures, standards, calibration work orders, certificates, uncertainty, and traceability.
- LeadEngine: future sales and cold-call module placeholder.

## Business Types

Supported workspace types:

- General Service Business
- Auto Repair Shop
- Contractor / Field Service
- Calibration Lab
- Custom

Each workspace stores enabled modules. General service businesses can run QuoteFlow, WorkFlow, SiteBuilder, team, customers, financials, and activity without seeing CalOps-specific fields. Calibration labs enable CalOps and receive calibration assets, procedures, standards, certificates, uncertainty, and traceability tools.

## Quote Conversion

QuoteFlow remains the front door for customer requests.

General conversion:

1. Customer submits a general service quote.
2. Admin reviews the quote.
3. Admin converts it to a WorkFlow job.
4. The job owns assignment, due date, status, quoted amount, billed amount, cost, notes, and files placeholder.

Calibration conversion:

1. Customer submits a calibration quote.
2. Admin reviews the quote.
3. Admin converts it to a CalOps calibration work order.
4. CalOps owns asset, procedure, standards used, calibration data, tolerance decision, uncertainty placeholder, and certificate draft.

## Next Product Milestones

- Module entitlement and billing-ready module flags.
- Workspace settings editor.
- Industry-specific intake templates.
- CalOps standalone import validation.
- LeadEngine discovery, call scripts, and CRM handoff.
