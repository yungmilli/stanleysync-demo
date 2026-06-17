# Work Order Draft Export Format

## Endpoint

`GET /api/work-order-drafts/[id]/export`

## Purpose

Returns a structured JSON payload representing a QuoteFlow `WorkOrderDraft` for future CalOps import.

## Payload Sections

- `source`
  QuoteFlow origin identifiers and timestamps
- `customer`
  customer and contact information
- `service`
  service type, mode, turnaround, documentation, priority hints
- `equipment`
  equipment details and operating range/capacity
- `notes`
  customer notes, internal notes summary, AI summary
- `transcript`
  original intake transcript
- `extractedFields`
  structured extracted fields
- `structuredSummary`
  structured intake summary

## Export Logging

Every export is logged in:

- `IntegrationExportLog`
- `ActivityLog`

This gives QuoteFlow an audit trail even before CalOps is connected.
