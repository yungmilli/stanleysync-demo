import { NotificationEventType, NotificationStatus, type Prisma } from "@prisma/client";

import { db } from "@/lib/db";

const notificationSubjects: Record<NotificationEventType, string> = {
  NEW_QUOTE_SUBMITTED: "New quote submitted",
  QUOTE_SUBMITTED: "Quote submitted",
  QUOTE_REVIEWED: "Quote reviewed",
  QUOTE_APPROVED: "Quote approved",
  QUOTE_ACCEPTED: "Quote accepted",
  JOB_CREATED: "Job or work order created",
  JOB_ASSIGNED: "Job assigned",
  JOB_COMPLETED: "Job completed",
  WORK_ORDER_DUE: "Work order due",
  INVOICE_CREATED: "Invoice created",
  INVOICE_SENT: "Invoice sent",
  PAYMENT_LINK_GENERATED: "Payment link generated",
  CERTIFICATE_READY: "Certificate ready",
};

export function getNotificationTemplate(type: NotificationEventType, payload?: Prisma.InputJsonValue) {
  return {
    subject: notificationSubjects[type],
    provider: "placeholder",
    payload: {
      template: type.toLowerCase(),
      providerReady: false,
      ...(payload && typeof payload === "object" ? payload : {}),
    },
  };
}

export async function queueNotificationEvent(input: {
  workspaceId?: string | null;
  type: NotificationEventType;
  recipient?: string | null;
  subject?: string;
  payload?: Prisma.InputJsonValue;
}) {
  const template = getNotificationTemplate(input.type, input.payload);

  return db.notificationEvent.create({
    data: {
      workspaceId: input.workspaceId ?? null,
      type: input.type,
      status: NotificationStatus.PENDING,
      recipient: input.recipient ?? null,
      subject: input.subject ?? template.subject,
      provider: template.provider,
      payload: template.payload,
    },
  });
}
