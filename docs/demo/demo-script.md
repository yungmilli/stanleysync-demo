# StanleySync External Tester Demo Script

## Positioning

StanleySync App is for service businesses that need one clean workflow:

**Quote. Track. Invoice. All in one place.**

StanleySync Labs is a Coming Soon / Pro calibration module during external tester rollout.

## Setup

1. Open the hosted StanleySync demo link.
2. Log in with the provided demo account.
3. Use the demo account for tester workflow.
4. Use an owner/admin account only for product modes, Users & Roles, and restricted admin controls.

Passwords should be provided separately for the hosted demo.

## Flow 1: Create Quote

1. Open `/quote`.
2. Choose a general service request.
3. Enter customer contact, service description, location, urgency, and notes.
4. Review the summary.
5. Submit the quote.

Talking point: the customer gets guided questions instead of a blank form.

## Flow 2: Review Quote

1. Open `/admin/quotes`.
2. Select the new quote.
3. Review the transcript, structured summary, status, priority, and quoted amount.
4. Save intentionally if edits are needed.

Talking point: the office can review customer requests without losing the original intake context.

## Flow 3: Convert Quote To Job

1. From quote detail, click `Convert to General Job`.
2. Open the linked job.
3. Review assignment, status, due date, financials, notes, and activity.

Talking point: quotes become trackable work without retyping the same customer information.

## Flow 4: Track Job

1. Open `/admin/tickets`.
2. Filter or select a job.
3. Add a job comment or progress note.
4. Change status, priority, assignee, hours, costs, or notes.
5. Confirm the unsaved changes indicator appears.
6. Click `Save changes`.
7. Export the work order PDF.

Talking point: the job page gives the office and technician a shared operational record.

## Flow 5: Create Invoice

1. Open a completed job or quoted customer request.
2. Click `Create Invoice`.
3. Open `/admin/invoices`.
4. Review invoice totals, source quote/job, notes, payment link area, and status.
5. Add a payment provider and payment link.
6. Click `Save payment link`.
7. Export the invoice PDF.
8. Click `Mark as sent`.
9. Click `Mark as paid`.
10. Reopen the linked job and confirm it is closed.

Talking point: StanleySync connects the quote and job record to billing.

## Final Test Path

Quote -> Review -> Convert to Job -> Add Job Comment -> Change Job Status -> Create Invoice -> Add Payment Link -> Export Invoice PDF -> Mark Paid -> Confirm Job Closed.

## Flow 6: Apps Page

1. Open `/admin/apps`.
2. Show:
   - QuoteFlow: Enabled
   - WorkFlow: Enabled
   - Invoicing: Enabled
   - SiteBuilder: Coming Soon
   - StanleySync Labs: Coming Soon / Pro for testers
   - LeadEngine: Coming Soon

Talking point: the current release is intentionally focused on general service workflow.

## Flow 7: System Owner Controls

1. Log in as `owner@stanleysync.app`.
2. Open the Product mode selector.
3. Confirm the options are StanleySync App, StanleySync Labs, and StanleySync Demo.
4. Open `/admin/settings/users`.
5. Confirm the owner can add users, edit login details, assign roles, assign workspaces, set temporary passwords, and deactivate users.

Talking point: outside testers do not see these controls.

## Close

Ask testers:

- Was quote intake easy?
- Was quote-to-job clear?
- Did invoice and PDF output feel customer-ready?
- Were restricted controls hidden?
- What would make this worth paying for?
