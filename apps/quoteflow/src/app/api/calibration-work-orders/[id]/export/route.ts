import { UserRole } from "@prisma/client";

import { getCalibrationWorkOrderDetail } from "@/features/calops/queries";
import { getCurrentAppUser } from "@/lib/auth";
import { exportErrorResponse } from "@/lib/export-permissions";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentAppUser();

  if (!user?.email) {
    return exportErrorResponse(request, "Please sign in before exporting this handoff file.", 401);
  }

  if (user.role !== UserRole.SYSTEM_OWNER && user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
    return exportErrorResponse(request, "Your account does not have permission to export CalOps handoff files.", 403);
  }

  const { id } = await params;
  const workOrder = await getCalibrationWorkOrderDetail(id);

  if (!workOrder) {
    return exportErrorResponse(request, "Calibration work order not found.", 404);
  }

  const primaryAsset = workOrder.assets[0]?.asset;
  const quoteReference = workOrder.intakeNotes?.match(/Q-\d+/)?.[0] ?? null;
  const payload = {
    packageType: "StanleySync.CalOps.CalibrationWorkOrder.v1",
    exportedAt: new Date().toISOString(),
    exportedBy: user.email,
    handoff: {
      customerCompany: workOrder.customer.company,
      contactName: workOrder.customer.mainContact,
      contactEmail: workOrder.customer.email,
      contactPhone: workOrder.customer.phone,
      serviceType: workOrder.serviceType,
      equipmentDescription: primaryAsset?.description ?? null,
      manufacturer: primaryAsset?.manufacturer ?? null,
      model: primaryAsset?.model ?? null,
      serialNumber: primaryAsset?.serialNumber ?? null,
      rangeOrCapacity: primaryAsset?.capacityRange ?? null,
      units: primaryAsset?.capacityRange?.split(" ").at(-1) ?? null,
      quantity: workOrder.assets.length || 1,
      calibrationType: workOrder.procedure?.discipline ?? workOrder.serviceType,
      requiredDocumentation: workOrder.certificateNotes ?? workOrder.intakeNotes ?? null,
      serviceMode: workOrder.serviceType === "ONSITE" ? "ON_SITE" : "IN_LAB",
      turnaround: workOrder.dueDate?.toISOString() ?? null,
      notes: workOrder.intakeNotes,
      quoteId: quoteReference,
      workOrderId: workOrder.id,
      workOrderNumber: workOrder.woNumber,
      createdDate: workOrder.createdAt.toISOString(),
      status: workOrder.status,
    },
    workOrder,
  };

  return Response.json(payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${workOrder.woNumber}.json"`,
    },
  });
}
