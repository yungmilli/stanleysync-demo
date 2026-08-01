"use server";

import {
  ActivityType,
  BusinessType,
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
  requireTicketAccess,
  requireSystemOwnerSession,
  requireUserManagementSession,
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

function enumValue<T extends Record<string, string>>(source: T, value: FormDataEntryValue | null, fallback: T[keyof T]) {
  if (typeof value !== "string") return fallback;
  return Object.values(source).includes(value) ? (value as T[keyof T]) : fallback;
}

function nextReference(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}

function redirectWithConversionError(quoteId: string, message: string): never {
  redirect(`/admin/quotes/${quoteId}?conversionError=${encodeURIComponent(message)}`);
}

function serviceTypeToTicketType(serviceType: ServiceType, suggestedTicketType: TicketType | null) {
  if (suggestedTicketType && suggestedTicketType !== TicketType.CALIBRATION) {
    return suggestedTicketType;
  }

  if (serviceType === ServiceType.REPAIR) return TicketType.REPAIR;
  if (serviceType === ServiceType.CUSTOM_SERVICE) return TicketType.CUSTOM_SERVICE;
  return TicketType.OTHER;
}

function getQuoteJsonRecord(value: Prisma.JsonValue): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function textFrom(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

async function ensureGeneralDemoWorkspace() {
  return db.businessWorkspace.upsert({
    where: { workspaceKey: "general-service-demo" },
    update: {
      isActive: true,
      enabledModules: ["QuoteFlow", "WorkFlow", "Invoicing"],
    },
    create: {
      workspaceKey: "general-service-demo",
      businessName: "StanleySync App Demo",
      businessType: BusinessType.GENERAL_SERVICE,
      industry: "General business operations",
      serviceCategories: ["Quotes", "Customers", "Jobs", "Invoices", "PDFs"],
      email: "hello@stanleysync.com",
      phone: "",
      website: "https://stanleysync.com",
      address: "",
      logoPlaceholder: "APP",
      themeAccent: "#12212c",
      brandColors: { primary: "#12212c", accent: "#c46a29" },
      enabledModules: ["QuoteFlow", "WorkFlow", "Invoicing"],
      isActive: true,
    },
  });
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

function canAccessWorkspaceRecord(user: { role: UserRole; activeWorkspaceId?: string | null }, workspaceId?: string | null) {
  if (user.role === UserRole.SYSTEM_OWNER) return true;
  return Boolean(workspaceId && user.activeWorkspaceId === workspaceId);
}

function canAccessQuoteRecord(user: { id: string; role: UserRole; activeWorkspaceId?: string | null }, quote: { workspaceId?: string | null; assignedUserId?: string | null }) {
  if (!canAccessWorkspaceRecord(user, quote.workspaceId)) return false;
  if (user.role !== UserRole.DEMO_USER) return true;
  return quote.assignedUserId === user.id;
}

function canAccessTicketRecord(
  user: { id: string; role: UserRole; activeWorkspaceId?: string | null },
  ticket: { workspaceId?: string | null; assignedUserId?: string | null; quote?: { assignedUserId?: string | null } | null },
) {
  if (!canAccessWorkspaceRecord(user, ticket.workspaceId)) return false;
  if (user.role !== UserRole.DEMO_USER) return true;
  return ticket.assignedUserId === user.id || ticket.quote?.assignedUserId === user.id;
}

export async function updateQuoteAction(formData: FormData) {
  const { session, user } = await requireQuoteAccess();
  const quoteId = String(formData.get("quoteId"));
  const assignedUserId = user.role === UserRole.DEMO_USER ? user.id : optionalString(formData.get("assignedUserId"));
  const adminNotes = optionalString(formData.get("adminNotes"));
  const customerVisibleNotes = optionalString(formData.get("customerVisibleNotes"));
  const requestedTurnaround = optionalString(formData.get("requestedTurnaround"));
  const rawConversionPath = optionalString(formData.get("conversionPath"));
  const conversionPath =
    user.role === UserRole.DEMO_USER && rawConversionPath === "CalOps calibration work order"
      ? "Quote review only"
      : rawConversionPath;
  const quotedAmount = optionalNumber(formData.get("quotedAmount"));
  const assignee = await getAssignedUserDetails(assignedUserId);

  const existing = await db.quoteRequest.findUnique({
    where: { id: quoteId },
  });

  if (!existing) {
    return;
  }

  if (!canAccessQuoteRecord(user, existing)) {
    return;
  }

  const status = enumValue(QuoteStatus, formData.get("status"), existing.status);
  const priority = enumValue(Priority, formData.get("priority"), existing.priority);
  const serviceType = enumValue(ServiceType, formData.get("serviceType"), existing.serviceType);
  const existingFields =
    existing.extractedFields && typeof existing.extractedFields === "object" && !Array.isArray(existing.extractedFields)
      ? existing.extractedFields as Record<string, unknown>
      : {};

  await db.quoteRequest.update({
    where: { id: quoteId },
    data: {
      status,
      priority,
      serviceType,
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
  const { session, user } = await requireTicketAccess();
  const quoteId = String(formData.get("quoteId"));
  const quote = await db.quoteRequest.findUnique({
    where: { id: quoteId },
    include: { customer: true, ticket: true },
  });

  if (!quote) {
    redirectWithConversionError(quoteId, "Quote was not found. Refresh the quote list and try again.");
  }

  if (!canAccessQuoteRecord(user, quote)) {
    redirectWithConversionError(quote.id, "This quote is not available to your account.");
  }

  if (quote.ticket) {
    redirect(`/admin/tickets/${quote.ticket.id}?conversion=existing`);
  }

  if (quote.status !== QuoteStatus.ACCEPTED) {
    redirectWithConversionError(quote.id, "Set the quote status to Accepted before converting it to a job.");
  }

  if (quote.serviceType === ServiceType.CALIBRATION) {
    redirectWithConversionError(quote.id, "This quote is marked as Calibration. Use the CalOps work order conversion instead.");
  }

  const workspaceId = quote.workspaceId ?? (await ensureGeneralDemoWorkspace()).id;
  const assignee = await getAssignedUserDetails(quote.assignedUserId);
  const extractedFields = getQuoteJsonRecord(quote.extractedFields);
  const structuredSummary = getQuoteJsonRecord(quote.structuredSummary);
  const serviceCategory = textFrom(extractedFields.serviceCategory) ?? quote.serviceType.replace(/_/g, " ");
  const itemOrProject =
    quote.equipmentType ??
    textFrom(extractedFields.projectType) ??
    textFrom(extractedFields.itemOrProject) ??
    textFrom(structuredSummary.itemOrProject) ??
    "Service request";
  const location =
    quote.customer.address ??
    textFrom(structuredSummary.location) ??
    textFrom(extractedFields.location) ??
    "Location not captured";
  const logistics = [
    quote.serviceMode ? `Service mode: ${quote.serviceMode.replace(/_/g, " ")}` : null,
    `Location/logistics: ${location}`,
    quote.requestedTurnaround ? `Requested turnaround: ${quote.requestedTurnaround}` : null,
  ].filter(Boolean);
  const notes = [
    `Source quote: ${quote.quoteNumber}`,
    `Customer/contact: ${quote.customer.company} / ${quote.customer.mainContact}`,
    `Service type: ${serviceCategory}`,
    `Item/project: ${itemOrProject}`,
    quote.issueDescription ? `Customer notes: ${quote.issueDescription}` : null,
    quote.aiSummary ? `Structured summary: ${quote.aiSummary}` : null,
    ...logistics,
    quote.adminNotes ? `Internal admin notes: ${quote.adminNotes}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const ticketNumber = `T-${Date.now().toString().slice(-6)}`;
  let ticketId: string;

  try {
    const ticket = await db.ticket.create({
      data: {
        ticketNumber,
        quoteId: quote.id,
        workspaceId,
        customerId: quote.customerId,
        assignedUserId: assignee.assignedUserId,
        type: serviceTypeToTicketType(quote.serviceType, quote.suggestedTicketType),
        status: quote.targetDueDate ? TicketStatus.SCHEDULED : TicketStatus.NEW,
        priority: quote.priority,
        assignedTo: assignee.assignedTo,
        dueDate: quote.targetDueDate,
        quotedAmount: quote.quotedAmount ?? 0,
        billedAmount: 0,
        materialsCost: 0,
        shippingCost: 0,
        totalCost: 0,
        profitLoss: 0,
        notes,
      },
    });
    ticketId = ticket.id;

    await db.quoteRequest.update({
      where: { id: quote.id },
      data: {
        status: QuoteStatus.CONVERTED,
        workspaceId,
      },
    });

    await db.customer.update({
      where: { id: quote.customerId },
      data: { workspaceId },
    });

    await db.activityLog.createMany({
      data: [
        {
          type: ActivityType.QUOTE_CONVERTED_TO_TICKET,
          entityType: "QuoteRequest",
          entityId: quote.id,
          title: "Quote converted to job",
          description: `${quote.quoteNumber} was converted to ${ticket.ticketNumber}.`,
          actor: session.user.email ?? "admin",
          customerId: quote.customerId,
          quoteId: quote.id,
          ticketId: ticket.id,
        },
        {
          type: ActivityType.QUOTE_STATUS_CHANGED,
          entityType: "QuoteRequest",
          entityId: quote.id,
          title: "Quote status changed",
          description: `${quote.quoteNumber} moved to Converted.`,
          actor: session.user.email ?? "admin",
          customerId: quote.customerId,
          quoteId: quote.id,
          ticketId: ticket.id,
        },
        {
          type: ActivityType.TICKET_CREATED,
          entityType: "Ticket",
          entityId: ticket.id,
          title: "Job created",
          description: `${ticket.ticketNumber} was created from ${quote.quoteNumber}.`,
          actor: session.user.email ?? "admin",
          customerId: quote.customerId,
          quoteId: quote.id,
          ticketId: ticket.id,
        },
      ],
    });

    await queueNotificationEvent({
      workspaceId,
      type: NotificationEventType.JOB_CREATED,
      subject: `Job created: ${ticket.ticketNumber}`,
      payload: { quoteId: quote.id, ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
    });
  } catch (error) {
    console.error("[quotes] General job conversion failed.", {
      quoteId: quote.id,
      error: error instanceof Error ? error.message : "Unknown conversion error",
    });
    redirectWithConversionError(
      quote.id,
      "Job conversion failed while saving to the database. Check workspace/customer data and try again.",
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${quote.id}`);
  revalidatePath("/admin/tickets");
  redirect(`/admin/tickets/${ticketId}?conversion=created`);
}

export async function addQuoteInternalNoteAction(formData: FormData) {
  const { session, user } = await requireQuoteAccess();
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

  if (!canAccessQuoteRecord(user, quote)) {
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

function cleanInvoiceDescription(parts: Array<string | null | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(" - ") || "Service work";
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
      customerVisibleNotes: quote.issueDescription ?? quote.aiSummary,
      internalNotes: quote.adminNotes,
      billingAddress: quote.customer.billingAddress ?? quote.customer.address,
      shippingAddress: quote.customer.shippingAddress,
      paymentTerms: quote.customer.paymentTerms ?? "Net 30",
      paymentInstructions: "Payment due within 30 days. Confirm ACH, card, or check details before sending.",
      lineItems: {
        create: [
          {
            description: cleanInvoiceDescription(["Quoted service", quote.serviceType, quote.equipmentType ?? quote.issueDescription]),
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
  const { session, user } = await requireTicketAccess();
  const ticketId = String(formData.get("ticketId"));
  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    include: { customer: true, quote: true, invoices: true },
  });

  if (!ticket) return;
  if (!canAccessTicketRecord(user, ticket)) return;
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
      customerVisibleNotes: ticket.notes,
      internalNotes: ticket.quote?.adminNotes,
      billingAddress: ticket.customer.billingAddress ?? ticket.customer.address,
      shippingAddress: ticket.customer.shippingAddress,
      paymentTerms: ticket.customer.paymentTerms ?? "Net 30",
      paymentInstructions: "Payment due within 30 days. Confirm ACH, card, or check details before sending.",
      lineItems: {
        create: [
          {
            description: cleanInvoiceDescription(["Completed job", ticket.type, ticket.notes ?? ticket.ticketNumber]),
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
      customerVisibleNotes: workOrder.certificateNotes ?? workOrder.intakeNotes,
      billingAddress: workOrder.customer.billingAddress ?? workOrder.customer.address,
      shippingAddress: workOrder.customer.shippingAddress,
      paymentTerms: workOrder.customer.paymentTerms ?? "Net 30",
      paymentInstructions: "Payment due within 30 days. Confirm ACH, card, or check details before sending.",
      lineItems: {
        create: [
          {
            description: cleanInvoiceDescription(["Calibration work order", workOrder.serviceType, workOrder.woNumber]),
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
  const { session, user } = await requireManagerSession();
  const invoiceId = String(formData.get("invoiceId"));
  const status = String(formData.get("status")) as InvoiceStatus;
  const dueDate = formData.has("dueDate") ? optionalDate(formData.get("dueDate")) : undefined;
  const notes = formData.has("notes") ? optionalString(formData.get("notes")) : undefined;
  const customerVisibleNotes = formData.has("customerVisibleNotes") ? optionalString(formData.get("customerVisibleNotes")) : undefined;
  const internalNotes = formData.has("internalNotes") ? optionalString(formData.get("internalNotes")) : undefined;
  const paymentReferenceNotes = formData.has("paymentReferenceNotes") ? optionalString(formData.get("paymentReferenceNotes")) : undefined;
  const shippingNotes = formData.has("shippingNotes") ? optionalString(formData.get("shippingNotes")) : undefined;
  const billingAddress = formData.has("billingAddress") ? optionalString(formData.get("billingAddress")) : undefined;
  const shippingAddress = formData.has("shippingAddress") ? optionalString(formData.get("shippingAddress")) : undefined;
  const purchaseOrderNumber = formData.has("purchaseOrderNumber") ? optionalString(formData.get("purchaseOrderNumber")) : undefined;
  const shippingMethod = formData.has("shippingMethod") ? optionalString(formData.get("shippingMethod")) : undefined;
  const trackingNumber = formData.has("trackingNumber") ? optionalString(formData.get("trackingNumber")) : undefined;
  const shipDate = formData.has("shipDate") ? optionalDate(formData.get("shipDate")) : undefined;
  const paymentTerms = formData.has("paymentTerms") ? optionalString(formData.get("paymentTerms")) : undefined;
  const paymentUrl = formData.has("paymentUrl") ? optionalString(formData.get("paymentUrl")) : undefined;
  const paymentProvider = formData.has("paymentProvider") ? optionalString(formData.get("paymentProvider")) : undefined;
  const requestedPaymentStatus = formData.has("paymentStatus") ? optionalString(formData.get("paymentStatus")) : undefined;
  const paymentInstructions = formData.has("paymentInstructions") ? optionalString(formData.get("paymentInstructions")) : undefined;
  const paymentMethod = optionalString(formData.get("paymentMethod"));
  const paymentCardLast4 = optionalString(formData.get("paymentCardLast4"));
  const paymentDate = optionalString(formData.get("paymentDate"));
  const paymentReference = optionalString(formData.get("paymentReference"));
  const paymentNotes = optionalString(formData.get("paymentNotes")) ?? (paymentReferenceNotes === undefined ? null : paymentReferenceNotes);
  const tax = formData.has("tax") ? optionalNumber(formData.get("tax")) ?? 0 : undefined;
  const discount = formData.has("discount") ? optionalNumber(formData.get("discount")) ?? 0 : undefined;
  const lineItemIds = formData.getAll("lineItemId").map(String);
  const lineItemDescriptions = formData.getAll("lineItemDescription");
  const lineItemQuantities = formData.getAll("lineItemQuantity");
  const lineItemUnitPrices = formData.getAll("lineItemUnitPrice");
  const lineItemSkus = formData.getAll("lineItemSku");
  const lineItemPartNumbers = formData.getAll("lineItemPartNumber");
  const lineItemTaxableFlags = new Set(formData.getAll("lineItemTaxable").map(String));
  const lineItemNotes = formData.getAll("lineItemNotes");
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { ticket: true, calibrationWorkOrder: true, lineItems: true },
  });

  if (!invoice || !Object.values(InvoiceStatus).includes(status)) return;
  if (user.role !== UserRole.SYSTEM_OWNER && invoice.workspaceId !== user.activeWorkspaceId) return;
  const isLocked = invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.VOID;
  if (isLocked && user.role !== UserRole.SYSTEM_OWNER) return;

  const invoiceLineItemIds = new Set(invoice.lineItems.map((item) => item.id));
  const lineItemUpdates = lineItemIds.flatMap((id, index) => {
    if (!invoiceLineItemIds.has(id)) return [];
    const description = optionalString(lineItemDescriptions[index] ?? null) ?? "Service work";
    const quantity = optionalNumber(lineItemQuantities[index] ?? null) ?? 1;
    const unitPrice = optionalNumber(lineItemUnitPrices[index] ?? null) ?? 0;
    return [{
      id,
      description,
      quantity,
      unitPrice,
      amount: quantity * unitPrice,
      sku: optionalString(lineItemSkus[index] ?? null),
      partNumber: optionalString(lineItemPartNumbers[index] ?? null),
      taxable: lineItemTaxableFlags.has(id),
      notes: optionalString(lineItemNotes[index] ?? null),
    }];
  });
  const nextSubtotal = lineItemUpdates.length > 0
    ? lineItemUpdates.reduce((total, item) => total + item.amount, 0)
    : invoice.subtotal;

  const nextPaymentStatus =
    status === InvoiceStatus.SENT
      ? "SENT"
      : status === InvoiceStatus.IN_PROGRESS
        ? "PENDING"
      : status === InvoiceStatus.PAID
          ? "PAID"
          : status === InvoiceStatus.VOID
            ? "CLOSED"
            : requestedPaymentStatus ?? invoice.paymentStatus;
  const nextTax = tax ?? invoice.tax;
  const nextDiscount = discount ?? invoice.discount;
  const nextTotal = Math.max(0, nextSubtotal + nextTax - nextDiscount);
  const nextPaymentInstructions = paymentInstructions === undefined && !paymentMethod && !paymentCardLast4 && !paymentDate && !paymentReference && !paymentNotes
    ? invoice.paymentInstructions
    : [
        paymentMethod ? `Payment method: ${paymentMethod}` : null,
        paymentCardLast4 ? `Card last 4: ${paymentCardLast4}` : null,
        paymentDate ? `Payment date: ${paymentDate}` : null,
        paymentReference ? `Payment reference: ${paymentReference}` : null,
        paymentNotes ? `Payment notes: ${paymentNotes}` : null,
      ].filter(Boolean).join("\n") || paymentInstructions || invoice.paymentInstructions;

  await db.$transaction([
    ...lineItemUpdates.map((item) =>
      db.invoiceLineItem.update({
        where: { id: item.id },
        data: {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          sku: item.sku,
          partNumber: item.partNumber,
          taxable: item.taxable,
          notes: item.notes,
        },
      }),
    ),
    db.invoice.update({
      where: { id: invoice.id },
      data: {
        status,
        subtotal: nextSubtotal,
        dueDate: dueDate === undefined ? invoice.dueDate : dueDate,
        notes: notes === undefined ? invoice.notes : notes,
        customerVisibleNotes: customerVisibleNotes === undefined ? invoice.customerVisibleNotes : customerVisibleNotes,
        internalNotes: internalNotes === undefined ? invoice.internalNotes : internalNotes,
        paymentReferenceNotes: paymentReferenceNotes === undefined ? invoice.paymentReferenceNotes : paymentReferenceNotes,
        shippingNotes: shippingNotes === undefined ? invoice.shippingNotes : shippingNotes,
        billingAddress: billingAddress === undefined ? invoice.billingAddress : billingAddress,
        shippingAddress: shippingAddress === undefined ? invoice.shippingAddress : shippingAddress,
        purchaseOrderNumber: purchaseOrderNumber === undefined ? invoice.purchaseOrderNumber : purchaseOrderNumber,
        shippingMethod: shippingMethod === undefined ? invoice.shippingMethod : shippingMethod,
        trackingNumber: trackingNumber === undefined ? invoice.trackingNumber : trackingNumber,
        shipDate: shipDate === undefined ? invoice.shipDate : shipDate,
        paymentTerms: paymentTerms === undefined ? invoice.paymentTerms : paymentTerms,
        paymentUrl: paymentUrl === undefined ? invoice.paymentUrl : paymentUrl,
        paymentProvider: paymentProvider === undefined ? invoice.paymentProvider : paymentProvider,
        paymentInstructions: nextPaymentInstructions,
        tax: nextTax,
        discount: nextDiscount,
        total: nextTotal,
        paymentStatus: nextPaymentStatus,
        sentAt: status === InvoiceStatus.SENT && !invoice.sentAt ? new Date() : invoice.sentAt,
        paidAt: status === InvoiceStatus.PAID && !invoice.paidAt ? new Date() : invoice.paidAt,
      },
    }),
  ]);

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

  const shouldHoldAsInvoicePending = status === InvoiceStatus.SENT || status === InvoiceStatus.IN_PROGRESS;
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
  const { session, user } = await requireManagerSession();
  const invoiceId = String(formData.get("invoiceId"));
  const paymentUrl = optionalString(formData.get("paymentUrl"));
  const paymentProvider = optionalString(formData.get("paymentProvider")) ?? "Manual Link";
  const paymentStatus = optionalString(formData.get("paymentStatus")) ?? "NOT_SENT";
  const paymentInstructions = optionalString(formData.get("paymentInstructions"));

  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return;
  if (user.role !== UserRole.SYSTEM_OWNER && invoice.workspaceId !== user.activeWorkspaceId) return;

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


export async function updateCustomerRecordAction(formData: FormData) {
  const { session, user } = await requireQuoteAccess();
  const customerId = String(formData.get("customerId") ?? "");
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    include: {
      quotes: { select: { assignedUserId: true }, take: 25 },
      tickets: { select: { assignedUserId: true }, take: 25 },
    },
  });

  if (!customer) return;
  const workspaceAllowed = user.role === UserRole.SYSTEM_OWNER || customer.workspaceId === user.activeWorkspaceId;
  const demoAllowed = user.role !== UserRole.DEMO_USER || customer.quotes.some((quote) => quote.assignedUserId === user.id) || customer.tickets.some((ticket) => ticket.assignedUserId === user.id);
  if (!workspaceAllowed || !demoAllowed) return;

  const company = optionalString(formData.get("company")) ?? customer.company;
  const mainContact = optionalString(formData.get("mainContact")) ?? customer.mainContact;
  const email = optionalString(formData.get("email")) ?? customer.email;
  const tags = optionalString(formData.get("tags"));

  await db.customer.update({
    where: { id: customer.id },
    data: {
      company,
      mainContact,
      email,
      phone: optionalString(formData.get("phone")),
      address: optionalString(formData.get("address")),
      billingEmail: optionalString(formData.get("billingEmail")),
      billingPhone: optionalString(formData.get("billingPhone")),
      billingAddress: optionalString(formData.get("billingAddress")),
      shippingAddress: optionalString(formData.get("shippingAddress")),
      industry: optionalString(formData.get("industry")),
      accountStatus: optionalString(formData.get("accountStatus")) ?? "ACTIVE",
      paymentTerms: optionalString(formData.get("paymentTerms")),
      preferredContactMethod: optionalString(formData.get("preferredContactMethod")),
      taxExempt: formData.get("taxExempt") === "on",
      tags: tags ? tags.split(",").map((tag) => tag.trim()).filter(Boolean) : undefined,
      notes: optionalString(formData.get("notes")),
      internalNotes: optionalString(formData.get("internalNotes")),
    },
  });

  await db.auditEvent.create({
    data: {
      workspaceId: customer.workspaceId,
      actorUserId: user.id,
      actorEmail: session.user.email ?? user.email,
      action: "customer.record.updated",
      entityType: "Customer",
      entityId: customer.id,
      summary: `${company} customer record updated.`,
    },
  });

  revalidatePath("/admin/customers");
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/invoices");
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
  const { session, user } = await requireQuoteAccess();
  const quoteId = String(formData.get("quoteId"));
  const subject = String(formData.get("subject") ?? "");
  const message = String(formData.get("message") ?? "");
  const quote = await db.quoteRequest.findUnique({
    where: { id: quoteId },
    include: { customer: true },
  });

  if (!quote || !subject.trim() || !message.trim()) return;
  if (!canAccessQuoteRecord(user, quote)) return;

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
  const { session, user } = await requireTicketAccess();
  const ticketId = String(formData.get("ticketId"));
  const assignedUserId = user.role === UserRole.DEMO_USER ? user.id : optionalString(formData.get("assignedUserId"));
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
    include: { customer: true, quote: true, invoices: true },
  });

  if (!existing) return;
  if (!canAccessTicketRecord(user, existing)) return;

  const status = enumValue(TicketStatus, formData.get("status"), existing.status);
  const priority = enumValue(Priority, formData.get("priority"), existing.priority);
  const type = enumValue(TicketType, formData.get("type"), existing.type);
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

  if (status === TicketStatus.INVOICED && existing.invoices.length === 0) {
    const amount = billedAmount ?? quotedAmount ?? existing.quote?.quotedAmount ?? 0;
    const totals = calculateInvoiceTotals([{ quantity: 1, unitPrice: amount }]);
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber: nextInvoiceNumber(),
        workspaceId: existing.workspaceId,
        customerId: existing.customerId,
        quoteId: existing.quoteId,
        ticketId: existing.id,
        status: InvoiceStatus.DRAFT,
        subtotal: totals.subtotal,
        total: totals.total,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes,
        paymentInstructions: "Payment due within 30 days.",
        lineItems: {
          create: [
            {
              description: `Completed job - ${existing.ticketNumber}`,
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
        description: `${invoice.invoiceNumber} was created when ${existing.ticketNumber} moved to Invoiced.`,
        actor: session.user.email ?? "admin",
        customerId: existing.customerId,
        quoteId: existing.quoteId,
        ticketId: existing.id,
        invoiceId: invoice.id,
      },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/tickets");
  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/financials");
}

const adminManageableRoles: UserRole[] = [UserRole.MANAGER, UserRole.SALES, UserRole.TECHNICIAN, UserRole.DEMO_USER];

function canAssignRole(actorRole: UserRole, role: UserRole) {
  if (actorRole === UserRole.SYSTEM_OWNER) return true;
  return adminManageableRoles.includes(role);
}

function getManagedWorkspaceId(actor: { role: UserRole; activeWorkspaceId?: string | null }, requestedWorkspaceId: string | null) {
  if (actor.role === UserRole.SYSTEM_OWNER) return requestedWorkspaceId;
  return actor.activeWorkspaceId ?? null;
}

function canManageTargetUser(
  actor: { id: string; role: UserRole; activeWorkspaceId?: string | null },
  target: { id: string; role: UserRole; activeWorkspaceId?: string | null },
) {
  if (actor.role === UserRole.SYSTEM_OWNER) return true;
  if (target.role === UserRole.SYSTEM_OWNER || target.role === UserRole.ADMIN) return false;
  return Boolean(actor.activeWorkspaceId && actor.activeWorkspaceId === target.activeWorkspaceId);
}

async function canDeactivateUser(target: { role: UserRole; isActive: boolean }, nextActive: boolean) {
  if (nextActive || target.role !== UserRole.SYSTEM_OWNER || !target.isActive) return true;

  const activeOwnerCount = await db.user.count({
    where: {
      role: UserRole.SYSTEM_OWNER,
      isActive: true,
    },
  });

  return activeOwnerCount > 1;
}

async function recordUserManagementAudit({
  actor,
  workspaceId,
  action,
  entityId,
  summary,
  payload,
}: {
  actor: { id: string; email: string };
  workspaceId: string | null;
  action: string;
  entityId: string;
  summary: string;
  payload?: Prisma.InputJsonValue;
}) {
  await db.auditEvent.create({
    data: {
      workspaceId,
      actorUserId: actor.id,
      actorEmail: actor.email,
      action,
      entityType: "User",
      entityId,
      summary,
      payload,
    },
  }).catch((error) => {
    console.error("[user-management] Audit event failed.", { error: error instanceof Error ? error.name : "UnknownError" });
  });
}

export async function createTeamMemberAction(formData: FormData) {
  const { user } = await requireUserManagementSession();

  const name = optionalString(formData.get("name"));
  const email = optionalString(formData.get("email"))?.toLowerCase() ?? null;
  const role = String(formData.get("role") ?? "") as UserRole;
  const password = optionalString(formData.get("password"));
  const requestedWorkspaceId = optionalString(formData.get("activeWorkspaceId"));
  const isActive = formData.get("isActive") !== "false";
  const activeWorkspaceId = getManagedWorkspaceId(user, requestedWorkspaceId);

  if (!name || !email || !password || !Object.values(UserRole).includes(role) || !canAssignRole(user.role, role)) {
    return;
  }

  if (user.role !== UserRole.SYSTEM_OWNER && !activeWorkspaceId) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existingUser = await db.user.findUnique({ where: { email } });

  if (existingUser && !canManageTargetUser(user, existingUser)) {
    return;
  }

  const savedUser = await db.user.upsert({
    where: { email },
    update: {
      name,
      role,
      passwordHash,
      isActive,
      activeWorkspaceId,
    },
    create: {
      name,
      email,
      role,
      passwordHash,
      isActive,
      activeWorkspaceId,
    },
  });

  await recordUserManagementAudit({
    actor: user,
    workspaceId: activeWorkspaceId,
    action: existingUser ? "USER_UPDATED" : "USER_CREATED",
    entityId: savedUser.id,
    summary: `${user.email} ${existingUser ? "updated" : "created"} user ${savedUser.email}.`,
    payload: {
      role,
      activeWorkspaceId,
      isActive,
      temporaryPasswordSet: true,
    },
  });

  revalidatePath("/admin/team");
  revalidatePath("/admin/settings/users");
  redirect("/admin/settings/users?userSaved=1");
}

export async function updateTeamMemberAction(formData: FormData) {
  const { user } = await requireUserManagementSession();

  const userId = String(formData.get("userId"));
  const role = String(formData.get("role") ?? "") as UserRole;
  const isActive = formData.get("isActive") === "true";
  const intent = String(formData.get("intent") ?? "update-role");
  const requestedWorkspaceId = optionalString(formData.get("activeWorkspaceId"));
  const activeWorkspaceId = getManagedWorkspaceId(user, requestedWorkspaceId);

  if (!userId || !Object.values(UserRole).includes(role)) {
    return;
  }

  const target = await db.user.findUnique({ where: { id: userId } });

  if (!target || !canManageTargetUser(user, target)) {
    return;
  }

  if (intent === "update-role" && !canAssignRole(user.role, role)) {
    return;
  }

  if (target.id === user.id && target.role === UserRole.SYSTEM_OWNER && role !== UserRole.SYSTEM_OWNER) {
    return;
  }

  if (intent === "toggle-active" && !(await canDeactivateUser(target, isActive))) {
    return;
  }

  const savedUser = await db.user.update({
    where: { id: userId },
    data: {
      ...(intent === "update-role" ? { role } : {}),
      ...(intent === "toggle-active" ? { isActive } : {}),
      ...(intent === "assign-workspace" ? { activeWorkspaceId } : {}),
    },
  });

  await recordUserManagementAudit({
    actor: user,
    workspaceId: savedUser.activeWorkspaceId,
    action: intent === "toggle-active" ? "USER_STATUS_UPDATED" : intent === "assign-workspace" ? "USER_WORKSPACE_UPDATED" : "USER_ROLE_UPDATED",
    entityId: savedUser.id,
    summary: `${user.email} updated ${savedUser.email}.`,
    payload: {
      intent,
      role: savedUser.role,
      activeWorkspaceId: savedUser.activeWorkspaceId,
      isActive: savedUser.isActive,
    },
  });

  revalidatePath("/admin/team");
  revalidatePath("/admin/settings/users");
  revalidatePath("/admin");
  redirect("/admin/settings/users?userSaved=1");
}

export async function updateTeamMemberProfileAction(formData: FormData) {
  const { user } = await requireUserManagementSession();

  const userId = String(formData.get("userId"));
  const name = optionalString(formData.get("name"));
  const email = optionalString(formData.get("email"))?.toLowerCase() ?? null;
  const temporaryPassword = optionalString(formData.get("temporaryPassword"));
  const requestedWorkspaceId = optionalString(formData.get("activeWorkspaceId"));
  const activeWorkspaceId = getManagedWorkspaceId(user, requestedWorkspaceId);
  const role = String(formData.get("role") ?? "") as UserRole;
  const isActive = formData.get("isActive") === "true";

  if (!userId || !name || !email || !Object.values(UserRole).includes(role) || !canAssignRole(user.role, role)) {
    return;
  }

  const target = await db.user.findUnique({ where: { id: userId } });

  if (!target || !canManageTargetUser(user, target)) {
    return;
  }

  if (target.id === user.id && target.role === UserRole.SYSTEM_OWNER && role !== UserRole.SYSTEM_OWNER) {
    return;
  }

  if (!(await canDeactivateUser(target, isActive))) {
    return;
  }

  const savedUser = await db.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      role,
      activeWorkspaceId,
      isActive,
      ...(temporaryPassword ? { passwordHash: await bcrypt.hash(temporaryPassword, 10) } : {}),
    },
  });

  await recordUserManagementAudit({
    actor: user,
    workspaceId: savedUser.activeWorkspaceId,
    action: "USER_PROFILE_UPDATED",
    entityId: savedUser.id,
    summary: `${user.email} saved changes for ${savedUser.email}.`,
    payload: {
      role: savedUser.role,
      activeWorkspaceId: savedUser.activeWorkspaceId,
      isActive: savedUser.isActive,
      temporaryPasswordSet: Boolean(temporaryPassword),
    },
  });

  revalidatePath("/admin/settings/users");
  revalidatePath("/admin/team");
  revalidatePath("/admin");
  redirect("/admin/settings/users?userSaved=1");
}

const demoCleanupWorkspaceKeys = ["general-service-demo", "auto-repair-demo"];

function parseCleanupRecords(values: FormDataEntryValue[]) {
  return values.reduce(
    (accumulator, value) => {
      if (typeof value !== "string") return accumulator;
      const [type, id] = value.split(":");
      if (!id) return accumulator;
      if (type === "quote") accumulator.quoteIds.push(id);
      if (type === "ticket") accumulator.ticketIds.push(id);
      if (type === "invoice") accumulator.invoiceIds.push(id);
      return accumulator;
    },
    { quoteIds: [] as string[], ticketIds: [] as string[], invoiceIds: [] as string[] },
  );
}

async function getDemoCleanupWorkspaceIds() {
  const workspaces = await db.businessWorkspace.findMany({
    where: { workspaceKey: { in: demoCleanupWorkspaceKeys } },
    select: { id: true },
  });

  return workspaces.map((workspace) => workspace.id);
}

async function writeCleanupAudit(actor: string, summary: string, payload: Prisma.InputJsonValue) {
  await db.auditEvent.create({
    data: {
      action: "DEMO_DATA_CLEANUP",
      entityType: "DemoData",
      summary,
      actorEmail: actor,
      payload,
    },
  });
}

export async function deleteSelectedDemoRecordsAction(formData: FormData) {
  const { session } = await requireSystemOwnerSession();
  const confirmText = optionalString(formData.get("confirmText"));
  if (confirmText !== "DELETE") return;

  const workspaceIds = await getDemoCleanupWorkspaceIds();
  if (workspaceIds.length === 0) return;

  const { quoteIds, ticketIds, invoiceIds } = parseCleanupRecords(formData.getAll("selectedRecord"));

  const [deletedInvoices, deletedTickets, deletedQuotes] = await Promise.all([
    invoiceIds.length
      ? db.invoice.deleteMany({
          where: {
            id: { in: invoiceIds },
            workspaceId: { in: workspaceIds },
          },
        })
      : Promise.resolve({ count: 0 }),
    ticketIds.length
      ? db.ticket.deleteMany({
          where: {
            id: { in: ticketIds },
            workspaceId: { in: workspaceIds },
          },
        })
      : Promise.resolve({ count: 0 }),
    quoteIds.length
      ? db.quoteRequest.deleteMany({
          where: {
            id: { in: quoteIds },
            workspaceId: { in: workspaceIds },
          },
        })
      : Promise.resolve({ count: 0 }),
  ]);

  await writeCleanupAudit(
    session.user.email ?? "system-owner",
    "Selected demo workflow records deleted.",
    {
      invoices: deletedInvoices.count,
      tickets: deletedTickets.count,
      quotes: deletedQuotes.count,
    },
  );

  revalidatePath("/admin/cleanup");
  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/tickets");
  revalidatePath("/admin/invoices");
}

export async function clearDemoWorkflowRecordsAction(formData: FormData) {
  const { session } = await requireSystemOwnerSession();
  const confirmText = optionalString(formData.get("confirmText"));
  if (confirmText !== "DELETE") return;

  const workspaceIds = await getDemoCleanupWorkspaceIds();
  if (workspaceIds.length === 0) return;

  const [deletedInvoices, deletedTickets, deletedQuotes] = await Promise.all([
    db.invoice.deleteMany({ where: { workspaceId: { in: workspaceIds } } }),
    db.ticket.deleteMany({ where: { workspaceId: { in: workspaceIds } } }),
    db.quoteRequest.deleteMany({ where: { workspaceId: { in: workspaceIds } } }),
  ]);

  await writeCleanupAudit(
    session.user.email ?? "system-owner",
    "All demo workflow records deleted.",
    {
      invoices: deletedInvoices.count,
      tickets: deletedTickets.count,
      quotes: deletedQuotes.count,
    },
  );

  revalidatePath("/admin/cleanup");
  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/tickets");
  revalidatePath("/admin/invoices");
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
    include: { quote: true },
  });

  if (!ticket) {
    return;
  }

  const canComment =
    canAccessTicketRecord(user, ticket) ||
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
