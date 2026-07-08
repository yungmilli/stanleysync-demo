import { BusinessType, UserRole, type BusinessWorkspace, type Prisma } from "@prisma/client";

import { parseModules } from "@/features/workspaces/config";
import { db } from "@/lib/db";

export const DASHBOARD_WIDGET_CATALOG = [
  { key: "quotes", title: "Quotes", modules: ["QuoteFlow"] },
  { key: "jobs", title: "Jobs", modules: ["WorkFlow"] },
  { key: "revenue", title: "Revenue", modules: ["WorkFlow"] },
  { key: "profit", title: "Profit", modules: ["WorkFlow"] },
  { key: "teamWorkload", title: "Team workload", modules: ["WorkFlow"] },
  { key: "openTickets", title: "Open tickets", modules: ["WorkFlow"] },
  { key: "dueDates", title: "Due dates", modules: ["WorkFlow"] },
  { key: "customerGrowth", title: "Customer growth", modules: ["QuoteFlow"] },
  { key: "publicIntakeViews", title: "Public intake views", modules: ["QuoteFlow"] },
  { key: "quotesSubmitted", title: "Quotes submitted", modules: ["QuoteFlow"] },
  { key: "conversionRate", title: "Conversion rate", modules: ["QuoteFlow"] },
  { key: "approvedQuotes", title: "Approved quotes", modules: ["QuoteFlow"] },
  { key: "assetsDue", title: "Assets due", modules: ["CalOps"] },
  { key: "standardsDue", title: "Standards due", modules: ["CalOps"] },
  { key: "ootAssets", title: "OOT assets", modules: ["CalOps"] },
  { key: "certificates", title: "Certificates", modules: ["CalOps"] },
] as const;

function getSafeModeWorkspace(): BusinessWorkspace {
  const now = new Date();

  return {
    id: "fallback-general-service-demo",
    workspaceKey: "general-service-demo",
    businessName: "StanleySync App Demo",
    businessType: BusinessType.GENERAL_SERVICE,
    industry: "General service business",
    serviceCategories: ["Quotes", "Jobs", "Invoices"],
    email: null,
    phone: null,
    website: null,
    address: null,
    logoPlaceholder: "SS",
    logoUrl: null,
    invoiceTerms: null,
    quoteTerms: null,
    setupCompletedAt: now,
    themeAccent: "#c46a29",
    brandColors: { primary: "#12212c", accent: "#c46a29" },
    enabledModules: ["QuoteFlow", "WorkFlow", "Invoicing"],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

function getUnassignedWorkspace(): BusinessWorkspace {
  const now = new Date();

  return {
    id: "no-assigned-workspace",
    workspaceKey: "no-assigned-workspace",
    businessName: "No workspace assigned",
    businessType: BusinessType.GENERAL_SERVICE,
    industry: "Access setup required",
    serviceCategories: [],
    email: null,
    phone: null,
    website: null,
    address: null,
    logoPlaceholder: "NA",
    logoUrl: null,
    invoiceTerms: null,
    quoteTerms: null,
    setupCompletedAt: null,
    themeAccent: "#8b959c",
    brandColors: { primary: "#12212c", accent: "#8b959c" },
    enabledModules: [],
    isActive: false,
    createdAt: now,
    updatedAt: now,
  };
}

async function ensureDefaultWorkspace() {
  try {
    const existingWorkspace = await db.businessWorkspace.findFirst({
      where: { isActive: true },
      orderBy: { businessName: "asc" },
    });

    if (existingWorkspace) {
      return existingWorkspace;
    }

    return await db.businessWorkspace.create({
      data: {
        workspaceKey: "general-service-demo",
        businessName: "StanleySync App Demo",
        businessType: BusinessType.GENERAL_SERVICE,
        industry: "General service business",
        serviceCategories: ["Quotes", "Jobs", "Invoices"],
        brandColors: { primary: "#12212c", accent: "#c46a29" },
        enabledModules: ["QuoteFlow", "WorkFlow", "Invoicing"],
        isActive: true,
      },
    });
  } catch (error) {
    console.error("[workspace] Default workspace repair failed.", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return getSafeModeWorkspace();
  }
}

async function safeWorkspaceQuery<T>(label: string, query: Promise<T>, fallback: T) {
  try {
    return await query;
  } catch (error) {
    console.error("[workspace] Query failed; using safe fallback.", {
      query: label,
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return fallback;
  }
}

export async function getWorkspaceSwitcherData(userId: string) {
  let workspaces = await db.businessWorkspace
    .findMany({
      where: { isActive: true },
      orderBy: { businessName: "asc" },
    })
    .catch((error) => {
      console.error("[workspace] Active workspace lookup failed.", {
        error: error instanceof Error ? error.name : "UnknownError",
      });
      return [];
    });

  if (workspaces.length === 0) {
    const defaultWorkspace = await ensureDefaultWorkspace();
    workspaces = defaultWorkspace ? [defaultWorkspace] : [];
  }

  const user = userId === "env-admin"
    ? null
    : await db.user
        .findUnique({
          where: { id: userId },
          select: {
            role: true,
            activeWorkspaceId: true,
          },
        })
        .catch((error) => {
          console.error("[workspace] User workspace lookup failed; selecting default workspace.", {
            error: error instanceof Error ? error.name : "UnknownError",
          });
          return null;
        });

  const isSystemOwner = userId === "env-admin" || user?.role === "SYSTEM_OWNER";
  const assignedWorkspace = workspaces.find((workspace) => workspace.id === user?.activeWorkspaceId) ?? null;
  const activeWorkspace = isSystemOwner
    ? assignedWorkspace ?? workspaces[0] ?? null
    : assignedWorkspace ?? getUnassignedWorkspace();
  const visibleWorkspaces = isSystemOwner ? workspaces : activeWorkspace ? [activeWorkspace] : [];

  return {
    activeWorkspace,
    workspaces: visibleWorkspaces,
    enabledModules: parseModules(activeWorkspace?.enabledModules),
  };
}

type WorkspaceDashboardUser = {
  id: string;
  role: UserRole;
};

export async function getWorkspaceDashboardData(workspaceId?: string | null, user?: WorkspaceDashboardUser | null) {
  const where = workspaceId ? { workspaceId } : {};
  const quoteWhere: Prisma.QuoteRequestWhereInput = {
    AND: [
      where,
      user?.role === UserRole.DEMO_USER ? { assignedUserId: user.id } : {},
    ],
  };
  const ticketWhere: Prisma.TicketWhereInput = {
    AND: [
      where,
      user?.role === UserRole.DEMO_USER
        ? {
            OR: [
              { assignedUserId: user.id },
              { quote: { assignedUserId: user.id } },
            ],
          }
        : {},
    ],
  };
  const customerWhere: Prisma.CustomerWhereInput = {
    AND: [
      where,
      user?.role === UserRole.DEMO_USER
        ? {
            OR: [
              { quotes: { some: { assignedUserId: user.id } } },
              { tickets: { some: { assignedUserId: user.id } } },
              { tickets: { some: { quote: { assignedUserId: user.id } } } },
            ],
          }
        : {},
    ],
  };
  const now = new Date();
  const dueSoon = new Date(now);
  dueSoon.setDate(dueSoon.getDate() + 30);

  const [workspaces, quotes, tickets, projects, calWorkOrders, assets, standards, certificates, widgetPreferences, customers, users, publicIntakeViews] = await Promise.all([
    safeWorkspaceQuery("workspaces", db.businessWorkspace.findMany({ orderBy: { businessName: "asc" } }), []),
    safeWorkspaceQuery("quotes", db.quoteRequest.findMany({ where: quoteWhere, include: { customer: true, ticket: true, workOrderDraft: true }, orderBy: { updatedAt: "desc" }, take: 8 }), []),
    safeWorkspaceQuery("tickets", db.ticket.findMany({ where: ticketWhere, include: { customer: true }, orderBy: { updatedAt: "desc" }, take: 8 }), []),
    safeWorkspaceQuery("projects", db.websiteProject.findMany({ where, include: { client: true }, orderBy: { updatedAt: "desc" }, take: 5 }), []),
    safeWorkspaceQuery("calibration work orders", db.calibrationWorkOrder.findMany({ where, include: { customer: true }, orderBy: { updatedAt: "desc" }, take: 8 }), []),
    safeWorkspaceQuery("assets", db.calAsset.findMany({ where, include: { customer: true }, orderBy: { dueDate: "asc" }, take: 8 }), []),
    safeWorkspaceQuery("standards", db.calibrationStandard.findMany({ where, orderBy: { dueDate: "asc" }, take: 8 }), []),
    safeWorkspaceQuery("certificates", db.certificateDraft.findMany({ where, include: { customer: true }, orderBy: { updatedAt: "desc" }, take: 8 }), []),
    workspaceId
      ? safeWorkspaceQuery("widget preferences", db.dashboardWidgetPreference.findMany({ where: { workspaceId }, orderBy: [{ sortOrder: "asc" }, { title: "asc" }] }), [])
      : Promise.resolve([]),
    safeWorkspaceQuery("customers", db.customer.findMany({ where: customerWhere, orderBy: { createdAt: "desc" }, take: 12 }), []),
    safeWorkspaceQuery("users", db.user.findMany({
      where: user?.role === UserRole.DEMO_USER
        ? { id: user.id, isActive: true }
        : { isActive: true },
      orderBy: { name: "asc" },
    }), []),
    safeWorkspaceQuery("public intake views", db.auditEvent.count({ where: { ...(workspaceId ? { workspaceId } : {}), action: "PUBLIC_INTAKE_VIEW" } }), 0),
  ]);

  const openTickets = tickets.filter((ticket) => !["COMPLETED", "INVOICED", "CLOSED"].includes(ticket.status));
  const revenue = tickets.reduce((total, ticket) => total + (ticket.billedAmount ?? 0), 0) +
    calWorkOrders.reduce((total, workOrder) => total + (workOrder.revenueAmount ?? 0), 0);
  const profit = tickets.reduce((total, ticket) => total + (ticket.profitLoss ?? 0), 0);
  const dueTickets = tickets.filter((ticket) => ticket.dueDate && ticket.dueDate <= dueSoon);
  const dueAssets = assets.filter((asset) => asset.dueDate && asset.dueDate <= dueSoon);
  const dueStandards = standards.filter((standard) => standard.dueDate && standard.dueDate <= dueSoon);
  const ootAssets = assets.filter((asset) => asset.status === "OOT");
  const approvedQuotes = quotes.filter((quote) => ["QUOTED", "ACCEPTED", "CONVERTED_TO_WORK_ORDER_DRAFT"].includes(quote.status)).length;
  const convertedQuotes = quotes.filter((quote) => quote.ticket || quote.workOrderDraft).length;
  const conversionRate = quotes.length > 0 ? Math.round((convertedQuotes / quotes.length) * 100) : 0;

  return {
    workspaces,
    quotes,
    tickets,
    projects,
    calWorkOrders,
    assets,
    standards,
    certificates,
    widgetPreferences,
    customers,
    users,
    metrics: {
      quotes: quotes.length,
      jobs: tickets.length + calWorkOrders.length,
      revenue,
      profit,
      teamWorkload: openTickets.length,
      openTickets: openTickets.length,
      dueDates: dueTickets.length,
      customerGrowth: customers.length,
      publicIntakeViews,
      quotesSubmitted: quotes.length,
      conversionRate,
      approvedQuotes,
      assetsDue: dueAssets.length,
      standardsDue: dueStandards.length,
      ootAssets: ootAssets.length,
      certificates: certificates.length,
    },
  };
}

export async function getWorkspaceSetupData() {
  return safeWorkspaceQuery("workspace setup", db.businessWorkspace.findMany({
    orderBy: [{ isActive: "desc" }, { businessName: "asc" }],
    include: {
      customers: { select: { id: true } },
      quotes: { select: { id: true } },
      tickets: { select: { id: true } },
      workOrders: { select: { id: true } },
      dashboardWidgets: { orderBy: [{ sortOrder: "asc" }, { title: "asc" }] },
    },
  }), []);
}

export async function getSettingsData(workspaceId?: string | null) {
  const [workspace, notifications, auditEvents, workflowStages] = await Promise.all([
    workspaceId
      ? safeWorkspaceQuery("settings workspace", db.businessWorkspace.findUnique({ where: { id: workspaceId } }), null)
      : Promise.resolve(null),
    safeWorkspaceQuery("settings notifications", db.notificationEvent.findMany({
      where: workspaceId ? { workspaceId } : {},
      orderBy: { createdAt: "desc" },
      take: 10,
    }), []),
    safeWorkspaceQuery("settings audit events", db.auditEvent.findMany({
      where: workspaceId ? { workspaceId } : {},
      orderBy: { createdAt: "desc" },
      take: 10,
    }), []),
    safeWorkspaceQuery("settings workflow stages", db.workflowStage.findMany({
      where: workspaceId ? { workspaceId } : {},
      orderBy: [{ module: "asc" }, { sortOrder: "asc" }],
    }), []),
  ]);

  return { workspace, notifications, auditEvents, workflowStages };
}
