import { getInvoiceDetail } from "@/features/ops/queries";
import { getCurrentAppUser } from "@/lib/auth";
import { companyContactBlock, documentFooter, invoiceTerms } from "@/lib/company-profile";
import { canExportForRole, canExportWorkspaceRecord, exportErrorResponse, invoicePdfExportRoles } from "@/lib/export-permissions";
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
  const invoice = await getInvoiceDetail(id);

  if (!invoice) {
    return exportErrorResponse(request, "Invoice not found.", 404);
  }

  if (!canExportWorkspaceRecord(user, invoice.workspaceId)) {
    return exportErrorResponse(request, "This invoice belongs to a different workspace.", 403);
  }

  const buffer = createProfessionalPdf({
    title: "Invoice",
    documentNumber: invoice.invoiceNumber,
    status: sentenceCase(invoice.status),
    customerBlock: [
      invoice.customer.company,
      invoice.customer.mainContact,
      invoice.customer.email,
      invoice.customer.phone ?? "Phone not provided",
      invoice.customer.address ?? "Address not provided",
    ],
    meta: [
      ["Invoice date", formatDate(invoice.createdAt)],
      ["Due date", formatDate(invoice.dueDate)],
      ["Payment status", invoice.paymentStatus ?? "UNPAID"],
      ["Source quote", invoice.quote?.quoteNumber ?? "Not linked"],
      ["Source job", invoice.ticket?.ticketNumber ?? invoice.calibrationWorkOrder?.woNumber ?? "Not linked"],
    ],
    contactBlock: companyContactBlock(invoice.workspace),
    sections: [
      {
        title: "Line Items",
        table: {
          headers: ["Description", "Qty", "Unit Price", "Amount"],
          widths: [300, 48, 84, 84],
          rows: invoice.lineItems.map((item) => [
            item.description,
            String(item.quantity),
            formatCurrency(item.unitPrice),
            formatCurrency(item.amount),
          ]),
        },
      },
      {
        title: "Payment Instructions",
        lines: [
          invoice.notes ?? "No additional invoice notes.",
          invoice.paymentInstructions ?? invoice.workspace?.invoiceTerms ?? "Payment due by the listed due date. Remittance details are provided by the business office.",
          invoice.paymentUrl ? `Payment link: ${invoice.paymentUrl}` : "Payment link: Not attached",
          invoice.paymentProvider ? `Provider: ${invoice.paymentProvider}` : "Provider: Not selected",
        ],
      },
    ],
    totals: [
      ["Subtotal", formatCurrency(invoice.subtotal)],
      ["Tax", formatCurrency(invoice.tax)],
      ["Discount", formatCurrency(invoice.discount)],
      ["Total", formatCurrency(invoice.total)],
    ],
    terms: invoiceTerms(invoice.workspace),
    signatureLabel: "Received / approved by",
    footer: documentFooter(invoice.workspace, "Invoice generated for customer review"),
    logoUrl: invoice.workspace?.logoUrl,
  });

  return pdfResponse(`${invoice.invoiceNumber}.pdf`, buffer);
}
