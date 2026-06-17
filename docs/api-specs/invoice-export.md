# Invoice Export

## PDF Route

`GET /api/invoices/:id/pdf`

Returns a PDF document for the invoice.

## Included Fields

- Invoice number
- Status
- Customer/company
- Contact info
- Source quote
- Source job or CalOps work order
- Invoice date
- Due date
- Line items
- Subtotal
- Tax
- Discount
- Total
- Notes
- Payment instructions

## Source Records

Invoices may be created from:

- QuoteFlow quote
- WorkFlow ticket/job
- CalOps calibration work order

## Status Values

- `DRAFT`
- `SENT`
- `PAID`
- `VOID`

## Current Limitations

- No payment processor is connected yet.
- Line items are generated from source records and are not yet edited directly from the invoice page.
- PDF rendering uses StanleySync's local PDF helper and should be replaced with a richer paginated renderer before production.
