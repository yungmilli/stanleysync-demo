# Quote-To-Invoice Workflow

## Flow

1. Customer submits a quote through QuoteFlow.
2. Admin reviews the quote in safe edit mode.
3. Admin enters quoted amount, customer-visible notes, internal notes, and status.
4. Quote is marked Quoted or Accepted.
5. Admin converts the quote into one of:
   - General WorkFlow job
   - CalOps calibration work order
   - SiteBuilder website project
   - Work order draft export
6. When work is complete, admin creates an invoice from the quote, job, or CalOps work order.
7. Invoice status moves through Draft, Sent, Paid, or Void.
8. Invoice PDF is exported for customer delivery.

## Source Links

- Quote source: `Invoice.quoteId`
- General job source: `Invoice.ticketId`
- Calibration source: `Invoice.calibrationWorkOrderId`
- Customer source: `Invoice.customerId`

## Safe Editing

Admin quote fields do not save while changed locally. The quote detail page requires:

- Edit quote
- Save changes
- Cancel changes

Unsaved changes trigger a browser leave warning.

## Test Checklist

- Submit a generic quote.
- Submit a calibration quote.
- Confirm quote transcript has no adjacent duplicate question messages.
- Open admin quote detail.
- Edit fields, cancel, and confirm values revert.
- Edit fields again and save.
- Create invoice from a quote with a quoted amount.
- Create invoice from a completed job.
- Create invoice from a certificate-ready CalOps work order.
- Export quote and invoice PDFs.
