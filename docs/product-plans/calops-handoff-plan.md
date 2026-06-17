# CalOps Handoff Plan

## Current State

QuoteFlow creates and stores `WorkOrderDraft` records. It can export those drafts as JSON for later system-to-system import.

## Immediate Boundary

- QuoteFlow owns intake and quoting
- CalOps will own downstream calibration workflow

## Planned Next Integration Stages

1. stabilize the JSON export contract
2. define CalOps import expectations
3. add authenticated push/pull integration later
4. track import acknowledgements and sync state

## Data Expected to Handoff

- source quote request ID
- customer and contact info
- service type
- calibration category
- range/capacity and units
- service mode
- turnaround request
- documentation requirements
- customer notes
- internal notes summary
