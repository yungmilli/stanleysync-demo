import { UserRole } from "@prisma/client";

import { getCalibrationWorkOrderDetail } from "@/features/calops/queries";
import { getCurrentAppUser } from "@/lib/auth";
import { companyContactBlock, documentFooter } from "@/lib/company-profile";
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
  const workOrder = await getCalibrationWorkOrderDetail(id);
  if (!workOrder) return Response.json({ error: "Work order not found" }, { status: 404 });

  const buffer = createProfessionalPdf({
    title: "Work Order",
    documentNumber: workOrder.woNumber,
    status: sentenceCase(workOrder.status),
    customerBlock: [
      workOrder.customer.company,
      workOrder.customer.mainContact,
      workOrder.customer.email,
      workOrder.customer.phone ?? "Phone not provided",
    ],
    meta: [
      ["Assigned", workOrder.assignedUser?.name ?? workOrder.assignedTechnician ?? "Unassigned"],
      ["Priority", sentenceCase(workOrder.priority)],
      ["Due date", formatDate(workOrder.dueDate)],
      ["Procedure", workOrder.procedure?.procedureNumber ?? "Not assigned"],
      ["Service type", sentenceCase(workOrder.serviceType)],
    ],
    contactBlock: companyContactBlock(workOrder.lab),
    sections: [
      {
        title: "Assets and Standards",
        table: {
          headers: ["Type", "Identifier", "Description"],
          widths: [80, 140, 296],
          rows: [
            ...workOrder.assets.map((link) => ["Asset", link.asset.assetId, link.asset.description]),
            ...workOrder.standards.map((link) => ["Standard", link.standard.standardId, link.standard.description]),
          ],
        },
      },
      {
        title: "Execution Checklist",
        lines: [
          "Intake verified: ____________________",
          "As-found data entered: ____________________",
          "As-left data entered: ____________________",
          "Technical review complete: ____________________",
          `Uncertainty: ${workOrder.uncertaintyNotes ?? "Apply the procedure uncertainty budget and record the final statement."}`,
          `Notes: ${workOrder.intakeNotes ?? "No intake notes"}`,
        ],
      },
      {
        title: "Technician Sign-Off",
        lines: [
          "Technician signature: ________________________________",
          "Review disposition: ________________________________",
        ],
      },
    ],
    totals: [["Revenue", formatCurrency(workOrder.revenueAmount)]],
    terms: [
      "Internal work order for technician execution and technical review.",
      "Calibration records must be reviewed before certificate release.",
    ],
    signatureLabel: "Technician signature",
    footer: documentFooter(workOrder.lab, "Internal CalOps work order"),
  });

  return pdfResponse(`${workOrder.woNumber}-work-order.pdf`, buffer);
}
