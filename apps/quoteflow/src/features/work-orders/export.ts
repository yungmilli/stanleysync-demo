import { ActivityType, IntegrationExportStatus, WorkOrderDraftStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { buildWorkOrderDraftPayload } from "@/features/work-orders/payload";

export async function logWorkOrderDraftExport(input: {
  workOrderDraftId: string;
  actor?: string | null;
  message?: string | null;
}) {
  const draft = await db.workOrderDraft.findUnique({
    where: { id: input.workOrderDraftId },
    include: {
      customer: true,
      sourceQuoteRequest: {
        include: {
          internalNotes: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
      internalNotes: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!draft) {
    return null;
  }

  const payload = buildWorkOrderDraftPayload({
    ...draft.sourceQuoteRequest,
    customer: draft.customer,
    internalNotes: draft.sourceQuoteRequest.internalNotes,
  });

  await db.integrationExportLog.create({
    data: {
      workOrderDraftId: draft.id,
      targetSystem: "CalOps",
      status: IntegrationExportStatus.SUCCESS,
      actor: input.actor ?? null,
      message: input.message ?? "Manual JSON export generated for future CalOps import.",
      payload,
    },
  });

  await db.workOrderDraft.update({
    where: { id: draft.id },
    data: {
      status: WorkOrderDraftStatus.EXPORTED,
      exportPayload: payload,
    },
  });

  await db.activityLog.create({
    data: {
      type: ActivityType.WORK_ORDER_DRAFT_EXPORTED,
      entityType: "WorkOrderDraft",
      entityId: draft.id,
      title: "Work order draft exported",
      description: `${draft.draftNumber} was exported as QuoteFlow JSON for CalOps import.`,
      actor: input.actor ?? null,
      customerId: draft.customerId,
      quoteId: draft.sourceQuoteRequestId,
      payload,
    },
  });

  revalidatePath("/admin/integrations/calops");
  revalidatePath(`/admin/quotes/${draft.sourceQuoteRequestId}`);

  return {
    draft,
    payload,
  };
}
