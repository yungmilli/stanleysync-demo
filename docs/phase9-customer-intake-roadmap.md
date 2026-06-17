# Phase 9 Customer Intake Roadmap

## Old Workflow

The previous guided intake worked, but it could ask overlapping questions:

- request type
- service type
- item or project description
- problem description

For general service and auto repair customers, those questions often collected the same information in slightly different words.

## New Workflow

The intake flow now uses shorter industry-specific plans.

General service target flow:

1. Service category
2. Project description
3. Location
4. Timeline
5. Conditional completion date if "By a specific date" is selected
6. Contact information

Auto repair target flow:

1. What do you need help with?
2. Vehicle information
3. Describe the issue
4. Service location
5. Timeline
6. Conditional completion date if "By a specific date" is selected
7. Contact information

Calibration keeps the specialized instrument workflow:

- Instrument type
- Manufacturer/model/serial
- Range/capacity/units
- Quantity
- Documentation requirement
- In-lab/on-site/ship-in
- Turnaround
- Special instructions
- Contact information

## Conditional Follow-Up

When a customer selects:

`By a specific date`

StanleySync asks:

`What date do you need completed by?`

The date question is skipped for standard or rush timing.

## Public Portal Architecture

New public route foundation:

`/intake/[workspace]`

Examples:

- `/intake/general-service-demo`
- `/intake/auto-repair-demo`
- `/intake/calibration-lab-demo`

Each portal loads the workspace by `workspaceKey` and applies:

- business name
- logo placeholder
- theme accent
- business type
- matching intake mode

Submitted requests use the same quote persistence pipeline as `/quote`, so public portal submissions create normal StanleySync quotes.

## Shareable URL

Workspace settings now show a generated public intake link:

`APP_BASE_URL/intake/workspace-key`

This is the foundation for future branded share links such as:

`https://stanleysync.app/intake/company-name`

## Email Architecture

Phase 9 adds the `NEW_QUOTE_SUBMITTED` notification event type.

Prepared templates:

- customer quote confirmation
- business owner new quote notification

SMTP/provider integration can remain placeholder-based until production email settings are configured.

## Dashboard Metrics

Dashboard metric foundation now includes:

- public intake views
- quotes submitted
- conversion rate
- approved quotes

Public intake views are tracked from the public portal route through audit events.

## Future Quote Approval Workflow

Recommended next steps:

1. Public customer quote status page.
2. Customer approve/decline button.
3. Signed quote acceptance record.
4. Payment/deposit option.
5. Automatic quote-to-job conversion after approval.
6. Customer notification when invoice is ready.
