import { getCurrentAppUser } from "@/lib/auth";
import { canExportForRole, exportErrorResponse, workOrderDraftExportRoles } from "@/lib/export-permissions";
import { getWorkOrderDraftExport } from "@/features/ops/queries";
import { logWorkOrderDraftExport } from "@/features/work-orders/export";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentAppUser();

  if (!user?.email) {
    return exportErrorResponse(request, "Please sign in before exporting this handoff file.", 401);
  }

  if (!canExportForRole(user, workOrderDraftExportRoles)) {
    return exportErrorResponse(request, "Your account does not have permission to export calibration handoff files.", 403);
  }

  const { id } = await params;
  const draft = await getWorkOrderDraftExport(id);

  if (!draft) {
    return exportErrorResponse(request, "Work order draft not found.", 404);
  }

  const exportResult = await logWorkOrderDraftExport({
    workOrderDraftId: draft.id,
    actor: user.email,
  });

  if (!exportResult) {
    return exportErrorResponse(request, "Unable to export work order draft. Please try again.", 500);
  }

  return Response.json(exportResult.payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${draft.draftNumber}.json"`,
    },
  });
}
