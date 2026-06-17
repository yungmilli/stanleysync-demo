import { NotificationEventType } from "@prisma/client";

export const emailTemplates: Record<NotificationEventType, { subject: string; body: string }> = {
  NEW_QUOTE_SUBMITTED: {
    subject: "New quote submitted",
    body: "A customer submitted a new quote request through StanleySync App.",
  },
  QUOTE_SUBMITTED: {
    subject: "Quote submitted",
    body: "A quote was submitted and is ready for review.",
  },
  QUOTE_REVIEWED: {
    subject: "Quote reviewed",
    body: "A quote was reviewed and updated by the team.",
  },
  QUOTE_APPROVED: {
    subject: "Quote approved",
    body: "A quote was approved and is ready for customer acceptance or conversion.",
  },
  QUOTE_ACCEPTED: {
    subject: "Quote accepted",
    body: "A quote was accepted and can move into job or work order execution.",
  },
  JOB_CREATED: {
    subject: "Work order created",
    body: "A quote was converted into a job or work order.",
  },
  JOB_ASSIGNED: {
    subject: "Job assigned",
    body: "A job was assigned to a team member.",
  },
  JOB_COMPLETED: {
    subject: "Job completed",
    body: "A job was marked complete and may be ready for invoicing.",
  },
  WORK_ORDER_DUE: {
    subject: "Work order due",
    body: "A work order is approaching its due date.",
  },
  INVOICE_CREATED: {
    subject: "Invoice created",
    body: "An invoice draft was created.",
  },
  INVOICE_SENT: {
    subject: "Invoice sent",
    body: "An invoice was marked sent to the customer.",
  },
  PAYMENT_LINK_GENERATED: {
    subject: "Payment link generated",
    body: "A payment link was added to an invoice. Future SMTP delivery should include the invoice number, payment instructions, and payment URL from the notification payload.",
  },
  CERTIFICATE_READY: {
    subject: "Certificate ready",
    body: "A certificate is ready for customer delivery.",
  },
};
