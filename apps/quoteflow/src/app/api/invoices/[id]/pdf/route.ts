import { getInvoiceDetail } from "@/features/ops/queries";
import { getCurrentAppUser } from "@/lib/auth";
import { companyContactBlock, documentFooter, invoiceTerms } from "@/lib/company-profile";
import { canExportForRole, canExportInvoiceRecord, exportErrorResponse, invoicePdfExportRoles } from "@/lib/export-permissions";
import { createProfessionalPdf, pdfResponse } from "@/lib/pdf";
import { formatCurrency, formatDate, sentenceCase } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentAppUser();
  if (!user?.email) return exportErrorResponse(request, "Please sign in before exporting this PDF.", 401);
  if (!canExportForRole(user, invoicePdfExportRoles)) {
    return exportErrorResponse(request, "Your account does not have permission to export invoice PDFs.", 403);
  }

  const { id } = await params;
  const invoice = await getInvoiceDetail(id, undefined, user);

  if (!invoice) {
    return exportErrorResponse(request, "Invoice not found.", 404);
  }

  if (!canExportInvoiceRecord(user, invoice)) {
    return exportErrorResponse(request, "This invoice is not available to your account.", 403);
  }

  const paymentDetails = parsePaymentDetails(invoice.paymentInstructions);
  const isPaid = invoice.status === "PAID";
  const paymentReferenceNotes = invoice.paymentReferenceNotes ?? paymentDetails.notes;
  const customerNotes = invoice.customerVisibleNotes ?? invoice.notes;
  const billingAddress = invoice.billingAddress ?? invoice.customer.address;
  const shippingAddress = invoice.shippingAddress;

  const buffer = createProfessionalPdf({
    title: isPaid ? "Invoice - Receipt Copy" : "Invoice",
    documentNumber: invoice.invoiceNumber,
    status: isPaid ? "Paid / Receipt Copy" : invoice.status === "VOID" ? "Closed" : sentenceCase(invoice.status),
    customerBlock: compactLines([
      invoice.customer.company,
      invoice.customer.mainContact,
      invoice.customer.email,
      invoice.customer.phone,
      billingAddress,
    ]),
    meta: compactRows([
      ["Invoice date", formatDate(invoice.createdAt)],
      ["Due date", formatDate(invoice.dueDate)],
      ["Payment terms", invoice.paymentTerms ?? "Net 30"],
      ["Payment status", invoice.paymentStatus ?? "UNPAID"],
      ["Purchase order", invoice.purchaseOrderNumber],
      ["Source quote", invoice.quote?.quoteNumber],
      ["Source job", invoice.ticket?.ticketNumber ?? invoice.calibrationWorkOrder?.woNumber],
      ["Ship date", invoice.shipDate ? formatDate(invoice.shipDate) : null],
    ]),
    contactBlock: companyContactBlock(invoice.workspace),
    sections: [
      {
        title: "Line Items",
        table: {
          headers: ["Description", "SKU / Part", "Tax", "Qty", "Unit Price", "Amount"],
          widths: [230, 94, 36, 42, 72, 72],
          rows: invoice.lineItems.length
            ? invoice.lineItems.map((item) => [
                compactLines([item.description, item.notes]).join("\n"),
                compactLines([item.sku ? `SKU ${item.sku}` : null, item.partNumber ? `Part ${item.partNumber}` : null]).join("\n"),
                item.taxable ? "Yes" : "No",
                String(item.quantity),
                formatCurrency(item.unitPrice),
                formatCurrency(item.amount),
              ])
            : [["Service work", "", "No", "1", formatCurrency(invoice.total), formatCurrency(invoice.total)]],
        },
      },
      {
        title: "Invoice Notes",
        table: {
          headers: ["Field", "Details"],
          widths: [142, 374],
          rows: compactRows([
            ["Customer notes", customerNotes],
            ["Shipping address", shippingAddress],
            ["Shipping method", invoice.shippingMethod],
            ["Tracking number", invoice.trackingNumber],
            ["Shipping notes", invoice.shippingNotes],
          ]),
        },
      },
      {
        title: isPaid ? "Payment Proof" : "Payment Instructions",
        table: {
          headers: ["Field", "Details"],
          widths: [142, 374],
          rows: isPaid
            ? compactRows([
                ["Payment method", paymentDetails.method],
                ["Provider", invoice.paymentProvider],
                ["Transaction / reference", paymentDetails.reference],
                ["Payment date", paymentDetails.date || formatDate(invoice.paidAt)],
                ["Amount paid", formatCurrency(invoice.total)],
                ["Card last 4", paymentDetails.last4],
                ["Notes", paymentReferenceNotes],
              ])
            : compactRows([
                ["Payment due date", formatDate(invoice.dueDate)],
                ["Payment terms", invoice.paymentTerms ?? "Net 30"],
                ["Payment link", invoice.paymentUrl],
                ["Provider", invoice.paymentProvider],
                ["Payment instructions", invoice.paymentInstructions],
                ["Payment/reference notes", paymentReferenceNotes],
              ]),
        },
      },
    ],
    totals: [
      ["Subtotal", formatCurrency(invoice.subtotal)],
      ["Tax", formatCurrency(invoice.tax)],
      ["Discount", formatCurrency(invoice.discount)],
      [isPaid ? "Amount paid" : "Total due", formatCurrency(invoice.total)],
    ],
    terms: invoiceTerms(invoice.workspace),
    signatureLabel: isPaid ? "Receipt acknowledged by" : "Customer authorization",
    footer: documentFooter(invoice.workspace, "Generated by StanleySync"),
    logoUrl: invoice.workspace?.logoUrl,
  });

  return pdfResponse(`${invoice.invoiceNumber}.pdf`, buffer);
}

function compactLines(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value?.trim()));
}

function compactRows(rows: Array<[string, string | null | undefined]>): Array<[string, string]> {
  return rows
    .filter(([, value]) => Boolean(value?.trim()))
    .map(([label, value]) => [label, value ?? ""]);
}

function parsePaymentDetails(value?: string | null) {
  const details = {
    method: "",
    last4: "",
    date: "",
    reference: "",
    notes: "",
  };

  for (const line of (value ?? "").split(/\r?\n/)) {
    const [rawLabel, ...rest] = line.split(":");
    const label = rawLabel.trim().toLowerCase();
    const nextValue = rest.join(":").trim();
    if (!nextValue) continue;
    if (label === "payment method") details.method = nextValue;
    else if (label === "card last 4") details.last4 = nextValue;
    else if (label === "payment date") details.date = nextValue;
    else if (label === "payment reference") details.reference = nextValue;
    else if (label === "payment notes") details.notes = nextValue;
  }

  if (!details.notes && value && !value.includes("Payment method:")) {
    details.notes = value;
  }

  return details;
}