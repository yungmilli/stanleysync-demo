# CalOps Integration Plan

## Operating Modes

Integrated mode:

- CalOps runs inside the same StanleySync app.
- Calibration work orders, assets, procedures, standards, and certificates use the local database.
- Calibration quotes can convert directly into CalOps work orders.

Standalone mode:

- A future separate CalOps machine or installation can exchange JSON packages with StanleySync.
- QuoteFlow and CoreOps do not depend on the external calibration code.
- Exported JSON packages provide a bridge until a proper API connector is implemented.

## Current Export Contract

Calibration work order JSON exports use a versioned envelope:

- `packageType`: `StanleySync.CalOps.CalibrationWorkOrder.v1`
- `exportedAt`
- `exportedBy`
- `workOrder`

The work order payload includes customer, assigned technician, procedure, linked assets, standards, calibration records, findings, activity log, certificate draft, and package export history.

## Quote Handoff Paths

General service:

- QuoteFlow quote converts into a WorkFlow job/ticket.

Calibration service:

- QuoteFlow quote converts into a CalOps calibration work order.
- The conversion can create a starter calibration asset when the quote includes equipment details.
- The work order then proceeds through CalOps execution, review, certificate draft, and closeout.

Legacy handoff:

- Existing Work Order Draft JSON export remains available for older QuoteFlow-to-CalOps handoff experiments.

## Import Placeholder

The import UI is intentionally disabled until validation rules are finalized. Required future work:

- Validate `packageType` and version.
- Validate customer, asset, procedure, and standard references.
- Preview imported changes before write.
- Support conflict handling for records that already exist.
- Log every import to an audit trail.

## Connector Placeholder

The CalOps integration page includes a disabled "Connect CalOps module" action. A future connector should support:

- API base URL
- Auth token or signed machine credential
- Test connection
- Push work order package
- Pull status and certificate package
- Retry and export history
