import { UserRole } from "@prisma/client";

import { getCurrentAppUser } from "@/lib/auth";
import { getWorkOrderDraftExport } from "@/features/ops/queries";
import { logWorkOrderDraftExport } from "@/features/work-orders/export";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentAppUser();

  if (!user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const draft = await getWorkOrderDraftExport(id);

  if (!draft) {
    return Response.json({ error: "Work order draft not found" }, { status: 404 });
  }

  const exportResult = await logWorkOrderDraftExport({
    workOrderDraftId: draft.id,
    actor: user.email,
  });

  if (!exportResult) {
    return Response.json({ error: "Unable to export work order draft" }, { status: 500 });
  }

  return Response.json(exportResult.payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${draft.draftNumber}.json"`,
    },
  });
}
