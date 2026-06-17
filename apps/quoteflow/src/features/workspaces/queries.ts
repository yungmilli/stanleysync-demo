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

export async function getWorkspaceSwitcherData(userId: string) {
  const [user, workspaces] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: { activeWorkspace: true },
    }),
    db.businessWorkspace.findMany({
      where: { isActive: true },
      orderBy: { businessName: "asc" },
    }),
  ]);

  const isSystemOwner = user?.role === "SYSTEM_OWNER";
  const activeWorkspace = user?.activeWorkspace ?? workspaces[0] ?? null;
  const visibleWorkspaces = isSystemOwner ? workspaces : activeWorkspace ? [activeWorkspace] : [];

  return {
    activeWorkspace,
    workspaces: visibleWorkspaces,
    enabledModules: parseModules(activeWorkspace?.enabledModules),
  };
}

export async function getWorkspaceDashboardData(workspaceId?: string | null) {
  const where = workspaceId ? { workspaceId } : {};
  const now = new Date();
  const dueSoon = new Date(now);
  dueSoon.setDate(dueSoon.getDate() + 30);

  const [workspaces, quotes, tickets, projects, calWorkOrders, assets, standards, certificates, widgetPreferences, customers, users, publicIntakeViews] = await Promise.all([
    db.businessWorkspace.findMany({ orderBy: { businessName: "asc" } }),
    db.quoteRequest.findMany({ where, include: { customer: true, ticket: true, workOrderDraft: true }, orderBy: { updatedAt: "desc" }, take: 8 }),
    db.ticket.findMany({ where, include: { customer: true }, orderBy: { updatedAt: "desc" }, take: 8 }),
    db.websiteProject.findMany({ where, include: { client: true }, orderBy: { updatedAt: "desc" }, take: 5 }),
    db.calibrationWorkOrder.findMany({ where, include: { customer: true }, orderBy: { updatedAt: "desc" }, take: 8 }),
    db.calAsset.findMany({ where, include: { customer: true }, orderBy: { dueDate: "asc" }, take: 8 }),
    db.calibrationStandard.findMany({ where, orderBy: { dueDate: "asc" }, take: 8 }),
    db.certificateDraft.findMany({ where, include: { customer: true }, orderBy: { updatedAt: "desc" }, take: 8 }),
    workspaceId
      ? db.dashboardWidgetPreference.findMany({ where: { workspaceId }, orderBy: [{ sortOrder: "asc" }, { title: "asc" }] })
      : Promise.resolve([]),
    db.customer.findMany({ where, orderBy: { createdAt: "desc" }, take: 12 }),
    db.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.auditEvent.count({ where: { ...(workspaceId ? { workspaceId } : {}), action: "PUBLIC_INTAKE_VIEW" } }).catch(() => 0),
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
  return db.businessWorkspace.findMany({
    orderBy: [{ isActive: "desc" }, { businessName: "asc" }],
    include: {
      customers: { select: { id: true } },
      quotes: { select: { id: true } },
      tickets: { select: { id: true } },
      workOrders: { select: { id: true } },
      dashboardWidgets: { orderBy: [{ sortOrder: "asc" }, { title: "asc" }] },
    },
  });
}

export async function getSettingsData(workspaceId?: string | null) {
  const [workspace, notifications, auditEvents, workflowStages] = await Promise.all([
    workspaceId ? db.businessWorkspace.findUnique({ where: { id: workspaceId } }) : Promise.resolve(null),
    db.notificationEvent.findMany({
      where: workspaceId ? { workspaceId } : {},
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.auditEvent.findMany({
      where: workspaceId ? { workspaceId } : {},
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.workflowStage.findMany({
      where: workspaceId ? { workspaceId } : {},
      orderBy: [{ module: "asc" }, { sortOrder: "asc" }],
    }).catch(() => []),
  ]);

  return { workspace, notifications, auditEvents, workflowStages };
}
