import { getCurrentAppUser } from "@/lib/auth";
import { companyContactBlock, documentFooter, quoteTerms } from "@/lib/company-profile";
import { db } from "@/lib/db";
import { canExportForRole, canExportWorkspaceRecord, exportErrorResponse, quotePdfExportRoles } from "@/lib/export-permissions";
import { createProfessionalPdf, pdfResponse } from "@/lib/pdf";
import { formatCurrency, formatDate, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAppUser();
  if (!user?.email) return exportErrorResponse(request, "Please sign in before exporting this PDF.", 401);
  if (!canExportForRole(user, quotePdfExportRoles)) {
    return exportErrorResponse(request, "Your account does not have permission to export quote PDFs.", 403);
  }

  const { id } = await params;
  const quote = await db.quoteRequest.findUnique({
    where: { id },
    include: { customer: true, workspace: true },
  });
  if (!quote) return exportErrorResponse(request, "Quote not found.", 404);
  if (!canExportWorkspaceRecord(user, quote.workspaceId)) {
    return exportErrorResponse(request, "This quote belongs to a different workspace.", 403);
  }

  const buffer = createProfessionalPdf({
    title: "Quote",
    documentNumber: quote.quoteNumber,
    status: sentenceCase(quote.status),
    customerBlock: [
      quote.customer.company,
      quote.customer.mainContact,
      quote.customer.email,
      quote.customer.phone ?? "Phone not provided",
    ],
    meta: [
      ["Submitted", formatDate(quote.submittedAt)],
      ["Valid until", formatDate(new Date(quote.submittedAt.getTime() + 30 * 24 * 60 * 60 * 1000))],
      ["Service", sentenceCase(quote.serviceType)],
      ["Turnaround", quote.requestedTurnaround ?? "Not specified"],
      ["Service mode", quote.serviceMode ? sentenceCase(quote.serviceMode) : "Not specified"],
    ],
    contactBlock: companyContactBlock(quote.workspace),
    sections: [
      {
        title: "Scope of Work",
        lines: [
          `Item / project: ${quote.equipmentType ?? "Service item not specified"}`,
          quote.issueDescription ?? quote.aiSummary,
        ],
      },
      {
        title: "Line Items",
        table: {
          headers: ["Description", "Qty", "Unit", "Amount"],
          widths: [300, 48, 84, 84],
          rows: [
            [
              quote.equipmentType ?? sentenceCase(quote.serviceType),
              "1",
              formatCurrency(quote.quotedAmount),
              formatCurrency(quote.quotedAmount),
            ],
          ],
        },
      },
      {
        title: "Commercial Summary",
        lines: [
          `Priority: ${sentenceCase(quote.priority)}`,
          `Assigned reviewer: ${quote.assignedTo ?? quote.workspace?.businessName ?? "Operations team"}`,
          `Documentation: ${quote.documentationRequirements ?? "Standard business documentation"}`,
        ],
      },
    ],
    totals: [["Estimated total", formatCurrency(quote.quotedAmount)]],
    terms: quoteTerms(quote.workspace),
    signatureLabel: "Customer acceptance",
    footer: documentFooter(quote.workspace, "Generated customer quote"),
    logoUrl: quote.workspace?.logoUrl,
  });

  return pdfResponse(`${quote.quoteNumber}.pdf`, buffer);
}
