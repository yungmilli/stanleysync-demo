# StanleySync CalOps

CalOps is a planned future module in the StanleySync suite.

## Purpose

CalOps will handle downstream calibration workflow execution after QuoteFlow hands off approved work.

## Planned Features

- work order intake from QuoteFlow
- technician assignment
- calibration execution workflow
- scheduling and due-date management
- completion and closeout tracking
- audit-friendly job history

## Relationship to QuoteFlow

QuoteFlow remains the front-office intake and quoting system.

Later connection plan:

1. QuoteFlow creates a `WorkOrderDraft`
2. QuoteFlow exports structured JSON
3. CalOps imports that payload
4. CalOps owns downstream operational execution

## Current State

This folder is a placeholder only. There is no runnable CalOps app on this machine yet.
