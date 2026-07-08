import { getCurrentAppUser } from "@/lib/auth";
import { companyContactBlock, documentFooter } from "@/lib/company-profile";
import { db } from "@/lib/db";
import { canExportForRole, canExportWorkspaceRecord, exportErrorResponse, ticketPdfExportRoles } from "@/lib/export-permissions";
import { createProfessionalPdf, pdfResponse } from "@/lib/pdf";
import { calculateTicketFinancials, formatCurrency, formatDate, formatPercent, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAppUser();
  if (!user?.email) return exportErrorResponse(request, "Please sign in before exporting this PDF.", 401);
  if (!canExportForRole(user, ticketPdfExportRoles)) {
    return exportErrorResponse(request, "Your account does not have permission to export work order PDFs.", 403);
  }

  const { id } = await params;
  const ticket = await db.ticket.findUnique({
    where: { id },
    include: { customer: true, workspace: true, assignedUser: true, quote: true },
  });
  if (!ticket) return exportErrorResponse(request, "Work order not found.", 404);
  if (!canExportWorkspaceRecord(user, ticket.workspaceId)) {
    return exportErrorResponse(request, "This work order belongs to a different workspace.", 403);
  }

  const notes = parseLabeledNotes(ticket.notes);
  const financials = calculateTicketFinancials({
    actualHours: ticket.estimatedHours ?? ticket.actualHours,
    laborRate: ticket.laborRate,
    materialsCost: ticket.materialsCost,
    shippingCost: ticket.shippingCost,
    billedAmount: ticket.billedAmount,
  });
  const laborEstimate = (ticket.estimatedHours ?? ticket.actualHours ?? 0) * (ticket.laborRate ?? 0);
  const estimatedCost = ticket.totalCost ?? financials.totalCost;
  const estimatedProfit = ticket.profitLoss ?? financials.profitLoss;
  const marginPercent = ticket.marginPercent ?? financials.marginPercent;

  const buffer = createProfessionalPdf({
    title: "Work Order",
    documentNumber: ticket.ticketNumber,
    status: sentenceCase(ticket.status),
    customerBlock: compactLines([
      ticket.customer.company,
      ticket.customer.mainContact,
      ticket.customer.email,
      ticket.customer.phone,
      ticket.customer.address,
    ]),
    meta: [
      ["Customer site", ticket.customer.address ?? "Site not provided"],
      ["Assigned", ticket.assignedUser?.name ?? ticket.assignedTo ?? "Unassigned"],
      ["Type", sentenceCase(ticket.type)],
      ["Due date", formatDate(ticket.dueDate)],
      ["Priority", sentenceCase(ticket.priority)],
    ],
    contactBlock: companyContactBlock(ticket.workspace),
    sections: [
      {
        title: "Description of Work",
        table: {
          headers: ["Field", "Details"],
          widths: [130, 386],
          rows: compactRows([
            ["Source quote", notes["source quote"] ?? ticket.quote?.quoteNumber],
            ["Customer / contact", notes["customer/contact"] ?? `${ticket.customer.company} / ${ticket.customer.mainContact}`],
            ["Service type", notes["service type"] ?? sentenceCase(ticket.type)],
            ["Item / project", notes["item/project"]],
            ["Customer notes", notes["customer notes"] ?? notes["structured summary"] ?? ticket.notes],
            ["Location / site", notes["location/logistics"] ?? ticket.customer.address],
            ["Requested timing", notes["requested turnaround"] ?? formatDate(ticket.dueDate)],
            ["Service mode", notes["service mode"]],
            ["Internal notes", notes["internal admin notes"]],
          ]),
        },
      },
      {
        title: "Labor / Materials",
        table: {
          headers: ["Category", "Description", "Estimate"],
          widths: [140, 280, 96],
          rows: [
            ["Labor estimate", "Estimated technician labor", formatCurrency(laborEstimate)],
            ["Materials estimate", "Materials, parts, or outside services", formatCurrency(ticket.materialsCost)],
            ["Shipping / other", "Shipping, travel, or other pass-through cost", formatCurrency(ticket.shippingCost)],
            ["Total estimated cost", "Estimated internal cost", formatCurrency(estimatedCost)],
          ],
        },
      },
      {
        title: "Technician Checklist",
        lines: [
          "Intake reviewed: ____________________",
          "Site/customer requirements verified: ____________________",
          "Work completed: ____________________",
          "Customer notified: ____________________",
          "Internal review complete: ____________________",
        ],
      },
      {
        title: "Financial Summary",
        table: {
          headers: ["Metric", "Value"],
          widths: [260, 256],
          rows: [
            ["Quoted amount", formatCurrency(ticket.quotedAmount)],
            ["Billed amount", formatCurrency(ticket.billedAmount)],
            ["Estimated cost", formatCurrency(estimatedCost)],
            ["Estimated profit", formatCurrency(estimatedProfit)],
            ["Margin", formatPercent(marginPercent)],
          ],
        },
      },
    ],
    terms: [
      "Internal work orders are for scheduling, technician execution, and management review.",
      "Customer-facing scope and pricing should match the approved quote or invoice.",
    ],
    signatureLabel: "Technician signature",
    footer: documentFooter(ticket.workspace, "Generated by StanleySync"),
    logoUrl: ticket.workspace?.logoUrl,
  });

  return pdfResponse(`${ticket.ticketNumber}-work-order.pdf`, buffer);
}

function parseLabeledNotes(notes?: string | null) {
  const parsed: Record<string, string> = {};
  for (const block of (notes ?? "").split(/\n{2,}/)) {
    const [label, ...rest] = block.split(":");
    const value = rest.join(":").trim();
    if (label && value) {
      parsed[label.trim().toLowerCase()] = value;
    }
  }
  return parsed;
}

function compactLines(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value?.trim()));
}

function compactRows(rows: Array<[string, string | null | undefined]>) {
  return rows
    .filter(([, value]) => Boolean(value?.trim()))
    .map(([label, value]) => [label, value ?? ""]);
}
