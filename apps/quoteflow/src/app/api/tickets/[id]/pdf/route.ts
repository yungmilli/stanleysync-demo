import { UserRole } from "@prisma/client";

import { getCurrentAppUser } from "@/lib/auth";
import { companyContactBlock, documentFooter } from "@/lib/company-profile";
import { db } from "@/lib/db";
import { createProfessionalPdf, pdfResponse } from "@/lib/pdf";
import { formatCurrency, formatDate, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

const exportRoles: UserRole[] = [UserRole.SYSTEM_OWNER, UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentAppUser();
  if (!user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!exportRoles.includes(user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ticket = await db.ticket.findUnique({
    where: { id },
    include: { customer: true, workspace: true, assignedUser: true },
  });
  if (!ticket) return Response.json({ error: "Ticket not found" }, { status: 404 });

  const buffer = createProfessionalPdf({
    title: "Work Order",
    documentNumber: ticket.ticketNumber,
    status: sentenceCase(ticket.status),
    customerBlock: [
      ticket.customer.company,
      ticket.customer.mainContact,
      ticket.customer.email,
      ticket.customer.phone ?? "Phone not provided",
    ],
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
        lines: [ticket.notes ?? "No notes provided for this job package."],
      },
      {
        title: "Labor / Materials",
        table: {
          headers: ["Category", "Description", "Estimate"],
          widths: [120, 300, 96],
          rows: [
            ["Labor", "Technician labor and service execution", formatCurrency(ticket.quotedAmount)],
            ["Materials", "Materials, parts, or outside services if required", "TBD"],
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
        title: "Internal Notes",
        lines: [
          `Quoted: ${formatCurrency(ticket.quotedAmount)}`,
          `Billed: ${formatCurrency(ticket.billedAmount)}`,
          `Cost: ${formatCurrency(ticket.totalCost)}`,
        ],
      },
    ],
    terms: [
      "Internal work orders are for scheduling, technician execution, and management review.",
      "Customer-facing scope and pricing should match the approved quote or invoice.",
    ],
    signatureLabel: "Technician signature",
    footer: documentFooter(ticket.workspace, "Internal work order"),
    logoUrl: ticket.workspace?.logoUrl,
  });

  return pdfResponse(`${ticket.ticketNumber}-work-order.pdf`, buffer);
}
