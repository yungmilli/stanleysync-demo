"use server";

import {
  ActivityType,
  CalibrationWorkOrderStatus,
  IdeaStatus,
  InvoiceStatus,
  NotificationEventType,
  Priority,
  ProjectStatus,
  QuoteStatus,
  ServiceType,
  TicketStatus,
  TicketType,
  UserRole,
  WorkOrderDraftStatus,
  WorkflowModule,
  type Prisma,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  requireAuthenticatedUser,
  requireIdeaBoardAccess,
  requireManagerSession,
  requireQuoteAccess,
  requireSystemOwnerSession,
} from "@/features/admin/guards";
import { buildWorkOrderDraftCreateData } from "@/features/work-orders/payload";
import { db } from "@/lib/db";
import {
  sendCustomerUpdateEmail,
  sendTicketAssignmentEmail,
} from "@/lib/mailer";
import { queueNotificationEvent } from "@/lib/notifications";
import { calculateTicketFinancials, slugify } from "@/lib/utils";

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function nextReference(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}

async function getAssignedUserDetails(userId: string | null) {
  if (!userId) {
    return {
      assignedUserId: null,
      assignedTo: null,
    };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.isActive) {
    return {
      assignedUserId: null,
      assignedTo: null,
    };
  }

  return {
    assignedUserId: user.id,
    assignedTo: user.name,
  };
}

export async function updateQuoteAction(formData: FormData) {
  const { session } = await requireQuoteAccess();
  const quoteId = String(formData.get("quoteId"));
  const status = String(formData.get("status")) as QuoteStatus;
  const priority = String(formData.get("priority")) as Priority;
  const serviceType = String(formData.get("serviceType")) as ServiceType;
  const assignedUserId = optionalString(formData.get("assignedUserId"));
  const adminNotes = optionalString(formData.get("adminNotes"));
  const customerVisibleNotes = optionalString(formData.get("customerVisibleNotes"));
  const requestedTurnaround = optionalString(formData.get("requestedTurnaround"));
  const conversionPath = optionalString(formData.get("conversionPath"));
  const quotedAmount = optionalNumber(formData.get("quotedAmount"));
  const assignee = await getAssignedUserDetails(assignedUserId);

  const existing = await db.quoteRequest.findUnique({
    where: { id: quoteId },
  });

  if (!existing) {
    return;
  }

  const existingFields =
    existing.extractedFields && typeof existing.extractedFields === "object" && !Array.isArray(existing.extractedFields)
      ? existing.extractedFields as Record<string, unknown>
      : {};

  await db.quoteRequest.update({
    where: { id: quoteId },
    data: {
      status,
      priority,
      serviceType: Object.values(ServiceType).includes(serviceType) ? serviceType : ServiceType.OTHER,
      assignedUserId: assignee.assignedUserId,
      assignedTo: assignee.assignedTo,
      adminNotes,
      issueDescription: customerVisibleNotes,
      requestedTurnaround,
      quotedAmount,
      extractedFields: {
        ...existingFields,
        conversionPath,
      },
    },
  });

  const events = [];

  if (existing.status !== status) {
    events.push({
      type: ActivityType.QUOTE_STATUS_CHANGED,
      title: "Quote status changed",
      description: `${existing.quoteNumber} moved from ${existing.status} to ${status}.`,
    });
  }

  if (existing.assignedTo !== assignee.assignedTo) {
    events.push({
      type: ActivityType.ASSIGNMENT_CHANGED,
      title: "Quote assignment changed",
      description: `${existing.quoteNumber} assigned to ${assignee.assignedTo ?? "Unassigned"}.`,
    });
  }

  if (existing.adminNotes !== adminNotes) {
    events.push({
      type: ActivityType.ADMIN_NOTE_UPDATED,
      title: "Admin notes updated",
      description: `Notes updated for ${existing.quoteNumber}.`,
    });
  }

  if (existing.priority !== priority || existing.quotedAmount !== quotedAmount || existing.requestedTurnaround !== requestedTurnaround || existing.issueDescription !== customerVisibleNotes || existing.serviceType !== serviceType) {
    events.push({
      type: ActivityType.ADMIN_NOTE_UPDATED,
      title: "Quote review fields saved",
      description: `${existing.quoteNumber} review details were updated.`,
    });
  }

  if (events.length > 0) {
    await db.activityLog.createMany({
      data: events.map((event) => ({
        ...event,
        entityType: "QuoteRequest",
        entityId: existing.id,
        actor: session.user.email ?? "admin",
        customerId: existing.customerId,
        quoteId: existing.id,
      })),
    });
  }

  if (events.length > 0) {
    await queueNotificationEvent({
      workspaceId: existing.workspaceId,
      type: status === QuoteStatus.ACCEPTED ? NotificationEventType.QUOTE_ACCEPTED : NotificationEventType.QUOTE_REVIEWED,
      recipient: existing.customerId,
      subject: `${existing.quoteNumber} ${status === QuoteStatus.ACCEPTED ? "accepted" : "review updated"}`,
      payload: { quoteId: existing.id, quoteNumber: existing.quoteNumber, status },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${quoteId}`);
}

export async function convertQuoteToTicketAction(formData: FormData) {
  const { session } = await requireManagerSession();
  const quoteId = String(formData.get("quoteId"));
  const quote = await db.quoteRequest.findUnique({
    where: { id: quoteId },
    include: { customer: true, ticket: true },
  });

  if (!quote) return;

  if (quote.ticket) {
    redirect(`/admin/tickets/${quote.ticket.id}`);
  }

  const ticketNumber = `T-${Date.now().toString().slice(-6)}`;
  const ticket = await db.ticket.create({
    data: {
      ticketNumber,
      quoteId: quote.id,
      workspaceId: quote.workspaceId,
      customerId: quote.customerId,
      assignedUserId: quote.assignedUserId,
      type: quote.suggestedTicketType ?? TicketType.OTHER,
      status: TicketStatus.NEW,
      priority: quote.priority,
      assignedTo: quote.assignedTo,
      quotedAmount: quote.quotedAmount,
      notes: quote.aiSummary,
    },
  });

  await db.quoteRequest.update({
    where: { id: quote.id },
    data: { status: QuoteStatus.CLOSED },
  });

  await db.activityLog.createMany({
    data: [
      {
        type: ActivityType.QUOTE_CONVERTED_TO_TICKET,
        entityType: "QuoteRequest",
        entityId: quote.id,
        title: "Quote converted to ticket",
        description: `${quote.quoteNumber} was converted to ${ticket.ticketNumber}.`,
        actor: session.user.email ?? "admin",
        customerId: quote.customerId,
        quoteId: quote.id,
        ticketId: ticket.id,
      },
      {
        type: ActivityType.TICKET_CREATED,
        entityType: "Ticket",
        entityId: ticket.id,
        title: "Ticket created",
        description: `${ticket.ticketNumber} was created from ${quote.quoteNumber}.`,
        actor: session.user.email ?? "admin",
        customerId: quote.customerId,
        quoteId: quote.id,
        ticketId: ticket.id,
      },
    ],
  });

  await queueNotificationEvent({
    workspaceId: quote.workspaceId,
    type: NotificationEventType.JOB_CREATED,
    subject: `Job created: ${ticket.ticketNumber}`,
    payload: { quoteId: quote.id, ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${quote.id}`);
  revalidatePath("/admin/tickets");
  redirect(`/admin/tickets/${ticket.id}`);
}

export async function addQuoteInternalNoteAction(formData: FormData) {
  const { session } = await requireQuoteAccess();
  const quoteId = String(formData.get("quoteId"));
  const body = optionalString(formData.get("body"));

  if (!body) {
    return;
  }

  const quote = await db.quoteRequest.findUnique({
    where: { id: quoteId },
  });

  if (!quote) {
    return;
  }

  await db.internalNote.create({
    data: {
      quoteRequestId: quote.id,
      body,
      author: session.user.email ?? "admin",
    },
  });

  await db.activityLog.create({
    data: {
      type: ActivityType.ADMIN_NOTE_UPDATED,
      entityType: "QuoteRequest",
      entityId: quote.id,
      title: "Internal note added",
      description: `An internal note was added to ${quote.quoteNumber}.`,
      actor: session.user.email ?? "admin",
      customerId: quote.customerId,
      quoteId: quote.id,
    },
  });

  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${quote.id}`);
}

export async function convertQuoteToWorkOrderDraftAction(formData: FormData) {
  const { session } = await requireManagerSession();
  const quoteId = String(formData.get("quoteId"));
  const quote = await db.quoteRequest.findUnique({
    where: { id: quoteId },
    include: {
      customer: true,
      internalNotes: {
        orderBy: { createdAt: "desc" },
      },
      workOrderDraft: true,
    },
  });

  if (!quote) {
    return;
  }

  if (quote.workOrderDraft) {
    redirect(`/admin/quotes/${quote.id}`);
  }

  const draftData = buildWorkOrderDraftCreateData(quote);
  const draft = await db.workOrderDraft.create({
    data: {
      draftNumber: nextReference("WO"),
      sourceQuoteRequestId: quote.id,
      customerId: quote.customerId,
      status: WorkOrderDraftStatus.READY_TO_EXPORT,
      ...draftData,
    },
  });

  await db.quoteRequest.update({
    where: { id: quote.id },
    data: {
      status: QuoteStatus.CONVERTED_TO_WORK_ORDER_DRAFT,
    },
  });

  await db.activityLog.createMany({
    data: [
      {
        type: ActivityType.WORK_ORDER_DRAFT_CREATED,
        entityType: "WorkOrderDraft",
        entityId: draft.id,
        title: "Work order draft created",
        description: `${draft.draftNumber} was created from ${quote.quoteNumber}.`,
        actor: session.user.email ?? "admin",
        customerId: quote.customerId,
        quoteId: quote.id,
        payload: draftData.exportPayload as Prisma.InputJsonValue,
      },
      {
        type: ActivityType.QUOTE_STATUS_CHANGED,
        entityType: "QuoteRequest",
        entityId: quote.id,
        title: "Quote status changed",
        description: `${quote.quoteNumber} moved to Converted to Work Order Draft.`,
        actor: session.user.email ?? "admin",
        customerId: quote.customerId,
        quoteId: quote.id,
      },
    ],
  });

  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${quote.id}`);
  revalidatePath("/admin/integrations/calops");
  redirect(`/admin/quotes/${quote.id}`);
}

export async function convertQuoteToWebsiteProjectAction(formData: FormData) {
  const { session } = await requireManagerSession();
  const quoteId = String(formData.get("quoteId"));
  const quote = await db.quoteRequest.findUnique({
    where: { id: quoteId },
    include: { customer: true },
  });

  if (!quote) {
    return;
  }

  const extractedFields =
    quote.extractedFields && typeof quote.extractedFields === "object" && !Array.isArray(quote.extractedFields)
      ? quote.extractedFields as Record<string, unknown>
      : {};
  const projectType = typeof extractedFields.projectType === "string" ? extractedFields.projectType : null;
  const pagesNeeded = typeof extractedFields.pagesNeeded === "string" ? extractedFields.pagesNeeded : null;
  const desiredFeatures = typeof extractedFields.desiredFeatures === "string" ? extractedFields.desiredFeatures : null;
  const budgetTimeline = typeof extractedFields.budgetTimeline === "string" ? extractedFields.budgetTimeline : null;
  const businessName = quote.customer.company || quote.customer.mainContact || "Website Project";
  const industry = projectType || quote.equipmentType || "Service business";
  const serviceLabel = quote.equipmentType || projectType || "Website / design service";

  const client = await db.client.upsert({
    where: { name: businessName },
    update: {
      contactEmail: quote.customer.email,
      contactPhone: quote.customer.phone,
      serviceArea: quote.customer.address,
      notes: quote.aiSummary,
    },
    create: {
      name: businessName,
      industry,
      serviceArea: quote.customer.address,
      contactEmail: quote.customer.email,
      contactPhone: quote.customer.phone,
      notes: quote.aiSummary,
    },
  });

  const template = await db.projectTemplate.upsert({
    where: { key: "quoteflow-service-starter" },
    update: {},
    create: {
      key: "quoteflow-service-starter",
      name: "QuoteFlow Service Starter",
      description: "Starter website package created from a QuoteFlow intake.",
      category: "Service business",
      config: {
        sections: ["hero", "services", "quote", "contact"],
        source: "quoteflow",
      },
    },
  });

  const slug = slugify(`${businessName}-${quote.quoteNumber}`) || `website-${quote.id}`;
  const existingProject = await db.websiteProject.findUnique({
    where: { slug },
  });

  if (existingProject) {
    redirect(`/admin/projects/${existingProject.id}`);
  }

  const project = await db.websiteProject.create({
    data: {
      workspaceId: quote.workspaceId,
      clientId: client.id,
      templateId: template.id,
      name: `${businessName} website project`,
      slug,
      status: ProjectStatus.DRAFT,
      businessName,
      industry,
      services: [serviceLabel],
      serviceArea: quote.customer.address ?? "Service area TBD",
      contactInfo: {
        contactName: quote.customer.mainContact,
        email: quote.customer.email,
        phone: quote.customer.phone,
      },
      brandSettings: {
        source: "QuoteFlow",
        accentColor: "#c46a29",
      },
      socialLinks: {},
      testimonials: [],
      faqs: [],
      galleryImages: [],
      generatedContent: {
        sourceQuoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        projectType,
        pagesNeeded,
        desiredFeatures,
        budgetTimeline,
        summary: quote.aiSummary,
      },
    },
  });

  await db.activityLog.create({
    data: {
      type: ActivityType.PROJECT_CREATED,
      entityType: "WebsiteProject",
      entityId: project.id,
      title: "Website project created",
      description: `${project.name} was created from ${quote.quoteNumber}.`,
      actor: session.user.email ?? "admin",
      customerId: quote.customerId,
      quoteId: quote.id,
      payload: {
        projectId: project.id,
        quoteNumber: quote.quoteNumber,
      },
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${quote.id}`);
  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${project.id}`);
}

function nextInvoiceNumber() {
  return `INV-${Date.now().toString().slice(-6)}`;
}

function calculateInvoiceTotals(items: Array<{ quantity: number; unitPrice: number }>, tax = 0, discount = 0) {
  const subtotal = items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const finalTotal = Math.max(0, subtotal + tax - discount);
  return { subtotal, total: finalTotal };
}

export async function createInvoiceFromQuoteAction(formData: FormData) {
  const { session } = await requireManagerSession();
  const quoteId = String(formData.get("quoteId"));
  const quote = await db.quoteRequest.findUnique({
    where: { id: quoteId },
    include: { customer: true, invoices: true },
  });

  if (!quote) return;
  if (quote.invoices[0]) redirect(`/admin/invoices/${quote.invoices[0].id}`);

  const amount = quote.quotedAmount ?? 0;
  const totals = calculateInvoiceTotals([{ quantity: 1, unitPrice: amount }]);
  const invoice = await db.invoice.create({
    data: {
      invoiceNumber: nextInvoiceNumber(),
      workspaceId: quote.workspaceId,
      customerId: quote.customerId,
      quoteId: quote.id,
      status: InvoiceStatus.DRAFT,
      subtotal: totals.subtotal,
      total: totals.total,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: quote.adminNotes ?? quote.aiSummary,
      paymentInstructions: "Payment due within 30 days. Confirm ACH, card, or check details before sending.",
      lineItems: {
        create: [
          {
            description: quote.equipmentType ? `Quoted service - ${quote.equipmentType}` : `Quoted service - ${quote.quoteNumber}`,
            quantity: 1,
            unitPrice: amount,
            amount,
            sortOrder: 1,
          },
        ],
      },
    },
  });

  await db.activityLog.create({
    data: {
      type: ActivityType.INVOICE_CREATED,
      entityType: "Invoice",
      entityId: invoice.id,
      title: "Invoice created",
      description: `${invoice.invoiceNumber} was created from ${quote.quoteNumber}.`,
      actor: session.user.email ?? "admin",
      customerId: quote.customerId,
      quoteId: quote.id,
      invoiceId: invoice.id,
    },
  });

  await queueNotificationEvent({
    workspaceId: quote.workspaceId,
    type: NotificationEventType.INVOICE_CREATED,
    subject: `Invoice created: ${invoice.invoiceNumber}`,
    payload: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, quoteId: quote.id },
  });

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/quotes/${quote.id}`);
  redirect(`/admin/invoices/${invoice.id}`);
}

export async function createInvoiceFromTicketAction(formData: FormData) {
  const { session } = await requireManagerSession();
  const ticketId = String(formData.get("ticketId"));
  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    include: { customer: true, quote: true, invoices: true },
  });

  if (!ticket) return;
  if (ticket.invoices[0]) redirect(`/admin/invoices/${ticket.invoices[0].id}`);

  const amount = ticket.billedAmount ?? ticket.quotedAmount ?? ticket.quote?.quotedAmount ?? 0;
  const totals = calculateInvoiceTotals([{ quantity: 1, unitPrice: amount }]);
  const invoice = await db.invoice.create({
    data: {
      invoiceNumber: nextInvoiceNumber(),
      workspaceId: ticket.workspaceId,
      customerId: ticket.customerId,
      quoteId: ticket.quoteId,
      ticketId: ticket.id,
      subtotal: totals.subtotal,
      total: totals.total,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: ticket.notes,
      paymentInstructions: "Payment due within 30 days. Confirm ACH, card, or check details before sending.",
      lineItems: {
        create: [
          {
            description: `Completed job - ${ticket.ticketNumber}`,
            quantity: 1,
            unitPrice: amount,
            amount,
            sortOrder: 1,
          },
        ],
      },
    },
  });

  await db.ticket.update({
    where: { id: ticket.id },
    data: { status: TicketStatus.INVOICE_PENDING },
  });

  await db.activityLog.create({
    data: {
      type: ActivityType.INVOICE_CREATED,
      entityType: "Invoice",
      entityId: invoice.id,
      title: "Invoice created",
      description: `${invoice.invoiceNumber} was created from ${ticket.ticketNumber}.`,
      actor: session.user.email ?? "admin",
      customerId: ticket.customerId,
      quoteId: ticket.quoteId,
      ticketId: ticket.id,
      invoiceId: invoice.id,
    },
  });

  await queueNotificationEvent({
    workspaceId: ticket.workspaceId,
    type: NotificationEventType.INVOICE_CREATED,
    subject: `Invoice created: ${invoice.invoiceNumber}`,
    payload: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, ticketId: ticket.id },
  });

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/tickets/${ticket.id}`);
  redirect(`/admin/invoices/${invoice.id}`);
}

export async function createInvoiceFromCalibrationWorkOrderAction(formData: FormData) {
  const { session } = await requireManagerSession();
  const workOrderId = String(formData.get("workOrderId"));
  const workOrder = await db.calibrationWorkOrder.findUnique({
    where: { id: workOrderId },
    include: { customer: true, invoices: true },
  });

  if (!workOrder) return;
  if (workOrder.invoices[0]) redirect(`/admin/invoices/${workOrder.invoices[0].id}`);

  const amount = workOrder.revenueAmount ?? 0;
  const totals = calculateInvoiceTotals([{ quantity: 1, unitPrice: amount }]);
  const invoice = await db.invoice.create({
    data: {
      invoiceNumber: nextInvoiceNumber(),
      workspaceId: workOrder.workspaceId,
      customerId: workOrder.customerId,
      calibrationWorkOrderId: workOrder.id,
      subtotal: totals.subtotal,
      total: totals.total,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: workOrder.certificateNotes ?? workOrder.intakeNotes,
      paymentInstructions: "Payment due within 30 days. Confirm ACH, card, or check details before sending.",
      lineItems: {
        create: [
          {
            description: `Calibration work order - ${workOrder.woNumber}`,
            quantity: 1,
            unitPrice: amount,
            amount,
            sortOrder: 1,
          },
        ],
      },
    },
  });

  await db.calibrationWorkOrder.update({
    where: { id: workOrder.id },
    data: { status: CalibrationWorkOrderStatus.INVOICE_PENDING },
  });

  await db.activityLog.create({
    data: {
      type: ActivityType.INVOICE_CREATED,
      entityType: "Invoice",
      entityId: invoice.id,
      title: "Invoice created",
      description: `${invoice.invoiceNumber} was created from ${workOrder.woNumber}.`,
      actor: session.user.email ?? "admin",
      customerId: workOrder.customerId,
      invoiceId: invoice.id,
    },
  });

  await queueNotificationEvent({
    workspaceId: workOrder.workspaceId,
    type: NotificationEventType.INVOICE_CREATED,
    subject: `Invoice created: ${invoice.invoiceNumber}`,
    payload: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, workOrderId: workOrder.id },
  });

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/work-orders/${workOrder.id}`);
  redirect(`/admin/invoices/${invoice.id}`);
}

export async function updateInvoiceStatusAction(formData: FormData) {
  const { session } = await requireManagerSession();
  const invoiceId = String(formData.get("invoiceId"));
  const status = String(formData.get("status")) as InvoiceStatus;
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { ticket: true, calibrationWorkOrder: true },
  });

  if (!invoice || !Object.values(InvoiceStatus).includes(status)) return;

  const nextPaymentStatus =
    status === InvoiceStatus.SENT
      ? "SENT"
      : status === InvoiceStatus.PENDING_PAYMENT
        ? "PENDING"
        : status === InvoiceStatus.PAID
          ? "PAID"
          : status === InvoiceStatus.VOID
            ? "VOIDED"
            : invoice.paymentStatus;

  await db.invoice.update({
    where: { id: invoice.id },
    data: {
      status,
      paymentStatus: nextPaymentStatus,
      sentAt: status === InvoiceStatus.SENT && !invoice.sentAt ? new Date() : invoice.sentAt,
      paidAt: status === InvoiceStatus.PAID && !invoice.paidAt ? new Date() : invoice.paidAt,
    },
  });

  if (invoice.status !== status) {
    await db.activityLog.create({
      data: {
        type: ActivityType.INVOICE_STATUS_CHANGED,
        entityType: "Invoice",
        entityId: invoice.id,
        title: "Invoice status changed",
        description: `${invoice.invoiceNumber} moved from ${invoice.status} to ${status}.`,
        actor: session.user.email ?? "admin",
        customerId: invoice.customerId,
        quoteId: invoice.quoteId,
        ticketId: invoice.ticketId,
        invoiceId: invoice.id,
      },
    });
  }

  if (status === InvoiceStatus.SENT && invoice.status !== status) {
    await queueNotificationEvent({
      workspaceId: invoice.workspaceId,
      type: NotificationEventType.INVOICE_SENT,
      subject: `Invoice sent: ${invoice.invoiceNumber}`,
      payload: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber },
    });
  }

  const shouldHoldAsInvoicePending = status === InvoiceStatus.SENT || status === InvoiceStatus.PENDING_PAYMENT;
  const shouldCloseAsPaid = status === InvoiceStatus.PAID;

  const linkedTicket = invoice.ticket;
  if (invoice.ticketId && linkedTicket && linkedTicket.status !== TicketStatus.CLOSED) {
    const nextTicketStatus = shouldCloseAsPaid
      ? TicketStatus.CLOSED
      : shouldHoldAsInvoicePending
        ? TicketStatus.INVOICE_PENDING
        : null;

    if (nextTicketStatus && linkedTicket.status !== nextTicketStatus) {
      await db.ticket.update({
        where: { id: invoice.ticketId },
        data: {
          status: nextTicketStatus,
          completedAt: nextTicketStatus === TicketStatus.CLOSED ? new Date() : linkedTicket.completedAt,
        },
      });
      await db.activityLog.create({
        data: {
          type: nextTicketStatus === TicketStatus.CLOSED ? ActivityType.TICKET_COMPLETED : ActivityType.TICKET_STATUS_CHANGED,
          entityType: "Ticket",
          entityId: invoice.ticketId,
          title: nextTicketStatus === TicketStatus.CLOSED ? "Job closed from paid invoice" : "Job moved to invoice pending",
          description: `${linkedTicket.ticketNumber} updated because ${invoice.invoiceNumber} moved to ${status}.`,
          actor: session.user.email ?? "admin",
          customerId: invoice.customerId,
          quoteId: invoice.quoteId,
          ticketId: invoice.ticketId,
          invoiceId: invoice.id,
        },
      });
    }
  }

  const linkedCalibrationWorkOrder = invoice.calibrationWorkOrder;
  if (
    invoice.calibrationWorkOrderId &&
    linkedCalibrationWorkOrder &&
    linkedCalibrationWorkOrder.status !== CalibrationWorkOrderStatus.CLOSED
  ) {
    const nextWorkOrderStatus = shouldCloseAsPaid
      ? CalibrationWorkOrderStatus.CLOSED
      : shouldHoldAsInvoicePending
        ? CalibrationWorkOrderStatus.INVOICE_PENDING
        : null;

    if (nextWorkOrderStatus && linkedCalibrationWorkOrder.status !== nextWorkOrderStatus) {
      await db.calibrationWorkOrder.update({
        where: { id: invoice.calibrationWorkOrderId },
        data: { status: nextWorkOrderStatus },
      });
      await db.activityLog.create({
        data: {
          type: ActivityType.CAL_WORK_ORDER_STATUS_CHANGED,
          entityType: "CalibrationWorkOrder",
          entityId: invoice.calibrationWorkOrderId,
          title: nextWorkOrderStatus === CalibrationWorkOrderStatus.CLOSED ? "Work order closed from paid invoice" : "Work order moved to invoice pending",
          description: `${linkedCalibrationWorkOrder.woNumber} updated because ${invoice.invoiceNumber} moved to ${status}.`,
          actor: session.user.email ?? "admin",
          customerId: invoice.customerId,
          quoteId: invoice.quoteId,
          invoiceId: invoice.id,
        },
      });
    }
  }

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${invoice.id}`);
  if (invoice.ticketId) revalidatePath(`/admin/tickets/${invoice.ticketId}`);
  if (invoice.calibrationWorkOrderId) revalidatePath(`/admin/work-orders/${invoice.calibrationWorkOrderId}`);
}

export async function updateInvoicePaymentLinkAction(formData: FormData) {
  const { session } = await requireManagerSession();
  const invoiceId = String(formData.get("invoiceId"));
  const paymentUrl = optionalString(formData.get("paymentUrl"));
  const paymentProvider = optionalString(formData.get("paymentProvider")) ?? "Manual Link";
  const paymentStatus = optionalString(formData.get("paymentStatus")) ?? "NOT_SENT";
  const paymentInstructions = optionalString(formData.get("paymentInstructions"));

  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return;

  await db.invoice.update({
    where: { id: invoice.id },
    data: {
      paymentUrl,
      paymentProvider,
      paymentStatus,
      paymentInstructions: paymentInstructions ?? invoice.paymentInstructions,
    },
  });

  await db.activityLog.create({
    data: {
      type: ActivityType.INVOICE_STATUS_CHANGED,
      entityType: "Invoice",
      entityId: invoice.id,
      title: "Payment link updated",
      description: `Payment link settings were updated for ${invoice.invoiceNumber}.`,
      actor: session.user.email ?? "admin",
      customerId: invoice.customerId,
      quoteId: invoice.quoteId,
      ticketId: invoice.ticketId,
      invoiceId: invoice.id,
    },
  });

  await queueNotificationEvent({
    workspaceId: invoice.workspaceId,
    type: NotificationEventType.PAYMENT_LINK_GENERATED,
    subject: `Payment link generated: ${invoice.invoiceNumber}`,
    payload: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, paymentProvider, paymentUrl },
  });

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${invoice.id}`);
}

export async function markInvoiceSentAction(formData: FormData) {
  formData.set("status", InvoiceStatus.SENT);
  await updateInvoiceStatusAction(formData);
}

export async function markInvoicePaidAction(formData: FormData) {
  formData.set("status", InvoiceStatus.PAID);
  await updateInvoiceStatusAction(formData);
}

const defaultWorkflowStages: Record<WorkflowModule, Array<{ key: string; label: string }>> = {
  QUOTEFLOW: [
    { key: "NEW", label: "New" },
    { key: "REVIEWING", label: "Reviewing" },
    { key: "NEEDS_MORE_INFO", label: "Need More Info" },
    { key: "QUOTED", label: "Quoted" },
    { key: "ACCEPTED", label: "Accepted" },
    { key: "DECLINED", label: "Declined" },
    { key: "CONVERTED", label: "Converted" },
    { key: "CLOSED", label: "Closed" },
  ],
  WORKFLOW: [
    { key: "NEW", label: "New" },
    { key: "SCHEDULED", label: "Scheduled" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "WAITING_ON_CUSTOMER", label: "Waiting on Customer" },
    { key: "WAITING_ON_PARTS", label: "Waiting on Parts" },
    { key: "COMPLETED", label: "Completed" },
    { key: "INVOICE_PENDING", label: "Invoice Pending" },
    { key: "INVOICED", label: "Invoiced" },
    { key: "CLOSED", label: "Closed" },
  ],
  CALOPS: [
    { key: "RECEIVED", label: "Received" },
    { key: "IN_PROCESS", label: "In Process" },
    { key: "CALIBRATION_COMPLETE", label: "Calibration Complete" },
    { key: "TECHNICAL_REVIEW", label: "Technical Review" },
    { key: "CERTIFICATE_READY", label: "Certificate Ready" },
    { key: "INVOICE_PENDING", label: "Invoice Pending" },
    { key: "INVOICED", label: "Invoiced" },
    { key: "CLOSED", label: "Closed" },
  ],
};

export async function restoreWorkflowDefaultsAction(formData: FormData) {
  const { session } = await requireManagerSession();
  const workspaceId = optionalString(formData.get("workspaceId"));
  if (!workspaceId) return;

  for (const [module, stages] of Object.entries(defaultWorkflowStages) as Array<[WorkflowModule, Array<{ key: string; label: string }>]>) {
    await Promise.all(
      stages.map((stage, index) =>
        db.workflowStage.upsert({
          where: {
            workspaceId_module_key: {
              workspaceId,
              module,
              key: stage.key,
            },
          },
          update: {
            label: stage.label,
            sortOrder: index + 1,
            isEnabled: true,
          },
          create: {
            workspaceId,
            module,
            key: stage.key,
            label: stage.label,
            sortOrder: index + 1,
            isEnabled: true,
          },
        }),
      ),
    );
  }

  await db.activityLog.create({
    data: {
      type: ActivityType.WORKFLOW_STAGE_UPDATED,
      entityType: "WorkflowStage",
      entityId: workspaceId,
      title: "Workflow defaults restored",
      description: "Default QuoteFlow, WorkFlow, and CalOps workflow stages were restored.",
      actor: session.user.email ?? "admin",
    },
  });

  revalidatePath("/admin/settings");
}


export async function sendQuoteEmailAction(formData: FormData) {
  const { session } = await requireQuoteAccess();
  const quoteId = String(formData.get("quoteId"));
  const subject = String(formData.get("subject") ?? "");
  const message = String(formData.get("message") ?? "");
  const quote = await db.quoteRequest.findUnique({
    where: { id: quoteId },
    include: { customer: true },
  });

  if (!quote || !subject.trim() || !message.trim()) return;

  await sendCustomerUpdateEmail({
    to: quote.customer.email,
    subject,
    message,
  });

  await db.activityLog.create({
    data: {
      type: ActivityType.EMAIL_SENT,
      entityType: "QuoteRequest",
      entityId: quote.id,
      title: "Customer email sent",
      description: `Manual quote email sent for ${quote.quoteNumber}.`,
      actor: session.user.email ?? "admin",
      customerId: quote.customerId,
      quoteId: quote.id,
      payload: { subject },
    },
  });

  revalidatePath(`/admin/quotes/${quote.id}`);
}

export async function updateTicketAction(formData: FormData) {
  const { session } = await requireManagerSession();
  const ticketId = String(formData.get("ticketId"));
  const status = String(formData.get("status")) as TicketStatus;
  const priority = String(formData.get("priority")) as Priority;
  const type = String(formData.get("type")) as TicketType;
  const assignedUserId = optionalString(formData.get("assignedUserId"));
  const dueDate = optionalDate(formData.get("dueDate"));
  const estimatedHours = optionalNumber(formData.get("estimatedHours"));
  const actualHours = optionalNumber(formData.get("actualHours"));
  const laborRate = optionalNumber(formData.get("laborRate"));
  const materialsCost = optionalNumber(formData.get("materialsCost"));
  const shippingCost = optionalNumber(formData.get("shippingCost"));
  const quotedAmount = optionalNumber(formData.get("quotedAmount"));
  const billedAmount = optionalNumber(formData.get("billedAmount"));
  const notes = optionalString(formData.get("notes"));
  const sendAssignmentEmail = formData.get("sendAssignmentEmail") === "on";
  const assignee = await getAssignedUserDetails(assignedUserId);

  const existing = await db.ticket.findUnique({
    where: { id: ticketId },
    include: { customer: true },
  });

  if (!existing) return;

  const financials = calculateTicketFinancials({
    actualHours,
    laborRate,
    materialsCost,
    shippingCost,
    billedAmount,
  });

  await db.ticket.update({
    where: { id: ticketId },
    data: {
      status,
      priority,
      type,
      assignedUserId: assignee.assignedUserId,
      assignedTo: assignee.assignedTo,
      dueDate,
      estimatedHours,
      actualHours,
      laborRate,
      materialsCost,
      shippingCost,
      quotedAmount,
      billedAmount,
      totalCost: financials.totalCost,
      profitLoss: financials.profitLoss,
      marginPercent: financials.marginPercent,
      notes,
      completedAt:
        status === TicketStatus.COMPLETED || status === TicketStatus.CLOSED
          ? new Date()
          : null,
    },
  });

  const events = [];

  if (existing.status !== status) {
    events.push({
      type: status === TicketStatus.COMPLETED ? ActivityType.TICKET_COMPLETED : ActivityType.TICKET_STATUS_CHANGED,
      title: status === TicketStatus.COMPLETED ? "Ticket completed" : "Ticket status changed",
      description: `${existing.ticketNumber} moved from ${existing.status} to ${status}.`,
    });
  }

  if (existing.assignedTo !== assignee.assignedTo) {
    events.push({
      type: ActivityType.ASSIGNMENT_CHANGED,
      title: "Assignment changed",
      description: `${existing.ticketNumber} assigned to ${assignee.assignedTo ?? "Unassigned"}.`,
    });
  }

  if ((existing.dueDate?.toISOString() ?? null) !== (dueDate?.toISOString() ?? null)) {
    events.push({
      type: ActivityType.DUE_DATE_CHANGED,
      title: "Due date changed",
      description: `${existing.ticketNumber} due date updated.`,
    });
  }

  if (events.length > 0) {
    await db.activityLog.createMany({
      data: events.map((event) => {
        const base = {
          ...event,
          entityType: "Ticket",
          entityId: existing.id,
          actor: session.user.email ?? "admin",
          customerId: existing.customerId,
          ticketId: existing.id,
        };

        return existing.quoteId ? { ...base, quoteId: existing.quoteId } : base;
      }),
    });
  }

  if (existing.status !== status && status === TicketStatus.COMPLETED) {
    await queueNotificationEvent({
      workspaceId: existing.workspaceId,
      type: NotificationEventType.JOB_COMPLETED,
      subject: `Job completed: ${existing.ticketNumber}`,
      payload: { ticketId: existing.id, ticketNumber: existing.ticketNumber },
    });
  }

  if (sendAssignmentEmail && assignee.assignedTo) {
    await sendTicketAssignmentEmail({
      to: existing.customer.email,
      assignee: assignee.assignedTo,
      ticketNumber: existing.ticketNumber,
      dueDate: dueDate?.toISOString() ?? null,
      summary: notes ?? existing.notes ?? "Your StanleySync work order was updated.",
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/tickets");
  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/financials");
}

export async function createTeamMemberAction(formData: FormData) {
  await requireSystemOwnerSession();

  const name = optionalString(formData.get("name"));
  const email = optionalString(formData.get("email"))?.toLowerCase() ?? null;
  const role = String(formData.get("role") ?? "") as UserRole;
  const password = optionalString(formData.get("password"));
  const activeWorkspaceId = optionalString(formData.get("activeWorkspaceId"));

  if (!name || !email || !password || !Object.values(UserRole).includes(role)) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.user.upsert({
    where: { email },
    update: {
      name,
      role,
      passwordHash,
      isActive: true,
      activeWorkspaceId,
    },
    create: {
      name,
      email,
      role,
      passwordHash,
      isActive: true,
      activeWorkspaceId,
    },
  });

  revalidatePath("/admin/team");
  revalidatePath("/admin/settings/users");
}

export async function updateTeamMemberAction(formData: FormData) {
  await requireSystemOwnerSession();

  const userId = String(formData.get("userId"));
  const role = String(formData.get("role") ?? "") as UserRole;
  const isActive = formData.get("isActive") === "true";
  const intent = String(formData.get("intent") ?? "update-role");
  const activeWorkspaceId = optionalString(formData.get("activeWorkspaceId"));

  if (!userId || !Object.values(UserRole).includes(role)) {
    return;
  }

  await db.user.update({
    where: { id: userId },
    data: {
      ...(intent === "update-role" ? { role } : {}),
      ...(intent === "toggle-active" ? { isActive } : {}),
      ...(intent === "assign-workspace" ? { activeWorkspaceId } : {}),
    },
  });

  revalidatePath("/admin/team");
  revalidatePath("/admin/settings/users");
  revalidatePath("/admin");
}

export async function updateTeamMemberProfileAction(formData: FormData) {
  await requireSystemOwnerSession();

  const userId = String(formData.get("userId"));
  const name = optionalString(formData.get("name"));
  const email = optionalString(formData.get("email"))?.toLowerCase() ?? null;
  const temporaryPassword = optionalString(formData.get("temporaryPassword"));
  const activeWorkspaceId = optionalString(formData.get("activeWorkspaceId"));
  const role = String(formData.get("role") ?? "") as UserRole;

  if (!userId || !name || !email || !Object.values(UserRole).includes(role)) {
    return;
  }

  await db.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      role,
      activeWorkspaceId,
      ...(temporaryPassword ? { passwordHash: await bcrypt.hash(temporaryPassword, 10) } : {}),
    },
  });

  revalidatePath("/admin/settings/users");
  revalidatePath("/admin/team");
  revalidatePath("/admin");
}

export async function createIdeaPostAction(formData: FormData) {
  const { session, user } = await requireIdeaBoardAccess();
  const title = optionalString(formData.get("title"));
  const description = optionalString(formData.get("description"));
  const category = optionalString(formData.get("category"));
  const ownerUserId = optionalString(formData.get("ownerUserId"));
  const priority = String(formData.get("priority") ?? Priority.NORMAL) as Priority;

  if (!title || !description || !category || !Object.values(Priority).includes(priority)) {
    return;
  }

  const idea = await db.ideaPost.create({
    data: {
      title,
      description,
      category,
      priority,
      ownerUserId,
      createdByUserId: user.id,
    },
  });

  await db.activityLog.create({
    data: {
      type: ActivityType.IDEA_POST_CREATED,
      entityType: "IdeaPost",
      entityId: idea.id,
      title: "Idea posted",
      description: `${title} was added to the internal idea board.`,
      actor: session.user.email ?? user.email,
    },
  });

  revalidatePath("/admin/ideas");
}

export async function updateIdeaPostAction(formData: FormData) {
  const { session, user } = await requireIdeaBoardAccess();
  const ideaId = String(formData.get("ideaId"));
  const status = String(formData.get("status") ?? IdeaStatus.NEW) as IdeaStatus;
  const ownerUserId = optionalString(formData.get("ownerUserId"));

  if (!ideaId || !Object.values(IdeaStatus).includes(status)) {
    return;
  }

  const existing = await db.ideaPost.findUnique({
    where: { id: ideaId },
  });

  if (!existing) {
    return;
  }

  await db.ideaPost.update({
    where: { id: ideaId },
    data: {
      status,
      ownerUserId,
    },
  });

  if (existing.status !== status) {
    await db.activityLog.create({
      data: {
        type: ActivityType.IDEA_STATUS_CHANGED,
        entityType: "IdeaPost",
        entityId: existing.id,
        title: "Idea status changed",
        description: `${existing.title} moved from ${existing.status} to ${status}.`,
        actor: session.user.email ?? user.email,
      },
    });
  }

  revalidatePath("/admin/ideas");
}

export async function addIdeaCommentAction(formData: FormData) {
  const { user } = await requireIdeaBoardAccess();
  const ideaId = String(formData.get("ideaId"));
  const body = optionalString(formData.get("body"));

  if (!ideaId || !body) {
    return;
  }

  await db.ideaComment.create({
    data: {
      postId: ideaId,
      authorUserId: user.id,
      body,
    },
  });

  revalidatePath("/admin/ideas");
}

export async function addTicketCommentAction(formData: FormData) {
  const { session, user } = await requireAuthenticatedUser();
  const ticketId = String(formData.get("ticketId"));
  const body = optionalString(formData.get("body"));

  if (!ticketId || !body) {
    return;
  }

  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    return;
  }

  const canComment =
    user.role === UserRole.ADMIN ||
    user.role === UserRole.MANAGER ||
    user.role === UserRole.SYSTEM_OWNER ||
    ticket.assignedUserId === user.id;

  if (!canComment) {
    return;
  }

  await db.ticketComment.create({
    data: {
      ticketId,
      authorUserId: user.id,
      body,
    },
  });

  await db.activityLog.create({
    data: {
      type: ActivityType.TICKET_COMMENT_ADDED,
      entityType: "Ticket",
      entityId: ticket.id,
      title: "Ticket comment added",
      description: body,
      actor: session.user.email ?? user.email,
      customerId: ticket.customerId,
      ticketId: ticket.id,
      ...(ticket.quoteId ? { quoteId: ticket.quoteId } : {}),
    },
  });

  revalidatePath(`/admin/tickets/${ticket.id}`);
  revalidatePath(`/tech/tickets/${ticket.id}`);
}

export async function updateTechnicianTicketAction(formData: FormData) {
  const { session, user } = await requireAuthenticatedUser();
  const ticketId = String(formData.get("ticketId"));
  const status = String(formData.get("status") ?? TicketStatus.NEW) as TicketStatus;
  const dueDate = optionalDate(formData.get("dueDate"));

  if (!ticketId || user.role !== UserRole.TECHNICIAN) {
    return;
  }

  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket || ticket.assignedUserId !== user.id) {
    return;
  }

  await db.ticket.update({
    where: { id: ticket.id },
    data: {
      status,
      dueDate,
      completedAt:
        status === TicketStatus.COMPLETED || status === TicketStatus.CLOSED ? new Date() : null,
    },
  });

  if (ticket.status !== status) {
    await db.activityLog.create({
      data: {
        type:
          status === TicketStatus.COMPLETED
            ? ActivityType.TICKET_COMPLETED
            : ActivityType.TICKET_STATUS_CHANGED,
        entityType: "Ticket",
        entityId: ticket.id,
        title:
          status === TicketStatus.COMPLETED ? "Ticket completed" : "Ticket status changed",
        description: `${ticket.ticketNumber} moved from ${ticket.status} to ${status}.`,
        actor: session.user.email ?? user.email,
        customerId: ticket.customerId,
        ticketId: ticket.id,
        ...(ticket.quoteId ? { quoteId: ticket.quoteId } : {}),
      },
    });
  }

  if (ticket.status !== status && status === TicketStatus.COMPLETED) {
    await queueNotificationEvent({
      workspaceId: ticket.workspaceId,
      type: NotificationEventType.JOB_COMPLETED,
      subject: `Job completed: ${ticket.ticketNumber}`,
      payload: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
    });
  }

  revalidatePath("/tech");
  revalidatePath(`/tech/tickets/${ticket.id}`);
  revalidatePath(`/admin/tickets/${ticket.id}`);
}
