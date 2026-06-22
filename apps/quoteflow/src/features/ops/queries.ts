import {
  IdeaStatus,
  Priority,
  QuoteStatus,
  ServiceType,
  TicketStatus,
  UserRole,
  type Prisma,
} from "@prisma/client";
import { endOfMonth, startOfMonth, subDays } from "date-fns";

import { db } from "@/lib/db";
import { calculateTicketFinancials } from "@/lib/utils";

type SearchValue = string | string[] | undefined;
const CLOSED_TICKET_STATUSES: TicketStatus[] = [TicketStatus.CLOSED, TicketStatus.INVOICED];
const REVIEW_QUOTE_STATUSES: QuoteStatus[] = [
  QuoteStatus.NEW,
  QuoteStatus.REVIEWING,
  QuoteStatus.NEEDS_MORE_INFO,
];

function getSingleValue(value: SearchValue) {
  return Array.isArray(value) ? value[0] : value;
}

async function safeOpsQuery<T>(label: string, query: Promise<T>, fallback: T) {
  try {
    return await query;
  } catch (error) {
    console.error("[ops] Query failed; using safe fallback.", {
      query: label,
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return fallback;
  }
}

export function parseListParams(searchParams: Record<string, SearchValue>) {
  return {
    query: getSingleValue(searchParams.query)?.trim() ?? "",
    status: getSingleValue(searchParams.status)?.trim() ?? "",
    serviceType: getSingleValue(searchParams.serviceType)?.trim() ?? "",
    priority: getSingleValue(searchParams.priority)?.trim() ?? "",
    dateRange: getSingleValue(searchParams.dateRange)?.trim() ?? "",
    assignedTo: getSingleValue(searchParams.assignedTo)?.trim() ?? "",
    sort: getSingleValue(searchParams.sort)?.trim() ?? "recent",
    view: getSingleValue(searchParams.view)?.trim() ?? "table",
  };
}

function getDateRangeFilter(value: string) {
  if (value === "7d") {
    return { gte: subDays(new Date(), 7) };
  }

  if (value === "30d") {
    return { gte: subDays(new Date(), 30) };
  }

  if (value === "90d") {
    return { gte: subDays(new Date(), 90) };
  }

  return undefined;
}

export async function getDashboardData() {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const [quotes, recentQuotes, tickets, recentTickets, customers, projects, activities] = await Promise.all([
    db.quoteRequest.findMany({
      include: { customer: true },
    }),
    db.quoteRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: true },
      take: 8,
    }),
    db.ticket.findMany({
      include: { customer: true, quote: true },
    }),
    db.ticket.findMany({
      orderBy: { updatedAt: "desc" },
      include: { customer: true, quote: true },
      take: 12,
    }),
    db.customer.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    db.websiteProject.findMany({
      orderBy: { updatedAt: "desc" },
      include: { client: true },
      take: 5,
    }),
    db.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const monthTickets = tickets.filter(
    (ticket) => ticket.createdAt >= monthStart && ticket.createdAt <= monthEnd,
  );
  const openTickets = tickets.filter(
    (ticket) =>
      !CLOSED_TICKET_STATUSES.includes(ticket.status),
  );
  const overdueTickets = openTickets.filter(
    (ticket) => ticket.dueDate && ticket.dueDate < new Date(),
  );
  const jobsCompletedThisMonth = tickets.filter(
    (ticket) =>
      ticket.completedAt &&
      ticket.completedAt >= monthStart &&
      ticket.completedAt <= monthEnd,
  ).length;

  const monthFinancials = monthTickets.reduce(
    (accumulator, ticket) => {
      const financials = calculateTicketFinancials({
        actualHours: ticket.actualHours,
        laborRate: ticket.laborRate,
        materialsCost: ticket.materialsCost,
        shippingCost: ticket.shippingCost,
        billedAmount: ticket.billedAmount,
      });

      return {
        revenue: accumulator.revenue + (ticket.billedAmount ?? 0),
        cost: accumulator.cost + financials.totalCost,
        profit: accumulator.profit + financials.profitLoss,
      };
    },
    { revenue: 0, cost: 0, profit: 0 },
  );

  const quoteServiceBreakdown = Object.values(
    quotes.reduce<Record<string, { label: string; value: number }>>((accumulator, quote) => {
      accumulator[quote.serviceType] = accumulator[quote.serviceType] ?? {
        label: quote.serviceType.replace("_", " "),
        value: 0,
      };
      accumulator[quote.serviceType].value += 1;
      return accumulator;
    }, {}),
  );

  const ticketStatusBreakdown = Object.values(
    tickets.reduce<Record<string, { label: string; value: number }>>((accumulator, ticket) => {
      accumulator[ticket.status] = accumulator[ticket.status] ?? {
        label: ticket.status.replace(/_/g, " "),
        value: 0,
      };
      accumulator[ticket.status].value += 1;
      return accumulator;
    }, {}),
  );

  const workloadByAssignee = Object.values(
    openTickets.reduce<Record<string, { label: string; value: number }>>((accumulator, ticket) => {
      const key = ticket.assignedTo || "Unassigned";
      accumulator[key] = accumulator[key] ?? {
        label: key,
        value: 0,
      };
      accumulator[key].value += 1;
      return accumulator;
    }, {}),
  );

  return {
    metrics: [
      { label: "New quotes", value: quotes.filter((quote) => quote.status === QuoteStatus.NEW).length },
      {
        label: "Quotes needing review",
        value: quotes.filter((quote) => REVIEW_QUOTE_STATUSES.includes(quote.status)).length,
      },
      { label: "Open tickets", value: openTickets.length },
      { label: "Overdue tickets", value: overdueTickets.length },
      { label: "Jobs completed this month", value: jobsCompletedThisMonth },
      { label: "Monthly revenue", value: monthFinancials.revenue, kind: "currency" },
      { label: "Monthly cost", value: monthFinancials.cost, kind: "currency" },
      { label: "Monthly profit", value: monthFinancials.profit, kind: "currency" },
    ],
    quoteServiceBreakdown,
    ticketStatusBreakdown,
    workloadByAssignee,
    monthly: [
      {
        label: "Current",
        revenue: monthFinancials.revenue,
        cost: monthFinancials.cost,
        profit: monthFinancials.profit,
      },
    ],
    monthFinancials,
    upcomingDueDates: openTickets
      .filter((ticket) => ticket.dueDate)
      .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
      .slice(0, 6),
    recentQuotes,
    recentTickets,
    recentCustomers: customers,
    recentProjects: projects,
    recentActivity: activities,
  };
}

export async function getQuotesList(searchParams: Record<string, SearchValue>, workspaceId?: string | null) {
  const filters = parseListParams(searchParams);
  const where: Prisma.QuoteRequestWhereInput = {
    AND: [
      filters.query
        ? {
            OR: [
              { quoteNumber: { contains: filters.query, mode: "insensitive" } },
              { equipmentType: { contains: filters.query, mode: "insensitive" } },
              { customer: { company: { contains: filters.query, mode: "insensitive" } } },
              { customer: { mainContact: { contains: filters.query, mode: "insensitive" } } },
            ],
          }
        : {},
      filters.status ? { status: filters.status as QuoteStatus } : {},
      filters.serviceType ? { serviceType: filters.serviceType as ServiceType } : {},
      filters.priority ? { priority: filters.priority as Priority } : {},
      filters.dateRange ? { createdAt: getDateRangeFilter(filters.dateRange) } : {},
      workspaceId ? { workspaceId } : {},
    ],
  };

  const orderBy: Prisma.QuoteRequestOrderByWithRelationInput =
    filters.sort === "priority"
      ? { priority: "desc" }
      : filters.sort === "turnaround"
        ? { requestedTurnaround: "asc" }
        : { createdAt: "desc" };

  const quotes = await safeOpsQuery("quotes list", db.quoteRequest.findMany({
    where,
    orderBy,
    include: {
      customer: true,
      assignedUser: true,
      attachments: true,
      workOrderDraft: true,
      ticket: true,
    },
  }), []);

  return { quotes, filters };
}

export async function getQuoteDetail(id: string, workspaceId?: string | null) {
  return safeOpsQuery("quote detail", db.quoteRequest.findFirst({
    where: { id, ...(workspaceId ? { workspaceId } : {}) },
    include: {
      customer: true,
      assignedUser: true,
      attachments: true,
      internalNotes: {
        orderBy: { createdAt: "desc" },
      },
      workOrderDraft: {
        include: {
          internalNotes: {
            orderBy: { createdAt: "desc" },
          },
          exportLogs: {
            orderBy: { exportedAt: "desc" },
          },
        },
      },
      ticket: true,
      activities: {
        orderBy: { createdAt: "desc" },
      },
    },
  }), null);
}

export async function getTicketsList(searchParams: Record<string, SearchValue>, workspaceId?: string | null) {
  const filters = parseListParams(searchParams);
  const where: Prisma.TicketWhereInput = {
    AND: [
      filters.query
        ? {
            OR: [
              { ticketNumber: { contains: filters.query, mode: "insensitive" } },
              { assignedTo: { contains: filters.query, mode: "insensitive" } },
              { customer: { company: { contains: filters.query, mode: "insensitive" } } },
            ],
          }
        : {},
      filters.status ? { status: filters.status as TicketStatus } : {},
      filters.priority ? { priority: filters.priority as Priority } : {},
      filters.assignedTo
        ? { assignedTo: { contains: filters.assignedTo, mode: "insensitive" } }
        : {},
      workspaceId ? { workspaceId } : {},
    ],
  };

  const tickets = await safeOpsQuery("tickets list", db.ticket.findMany({
    where,
    orderBy:
      filters.sort === "dueDate"
        ? { dueDate: "asc" }
        : filters.sort === "profit"
          ? { profitLoss: "desc" }
          : { updatedAt: "desc" },
    include: {
      customer: true,
      assignedUser: true,
      quote: true,
      activities: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  }), []);

  const byStatus = Object.fromEntries(
    Object.values(TicketStatus).map((status) => [
      status,
      tickets.filter((ticket) => ticket.status === status),
    ]),
  );

  return { tickets, byStatus, filters };
}

export async function getTicketDetail(id: string, workspaceId?: string | null) {
  return safeOpsQuery("ticket detail", db.ticket.findFirst({
    where: { id, ...(workspaceId ? { workspaceId } : {}) },
    include: {
      customer: true,
      assignedUser: true,
      quote: true,
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          author: true,
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
      },
    },
  }), null);
}

export async function getCustomersList(searchParams: Record<string, SearchValue>, workspaceId?: string | null) {
  const query = getSingleValue(searchParams.query)?.trim() ?? "";
  return safeOpsQuery("customers list", db.customer.findMany({
    where: {
      ...(workspaceId ? { workspaceId } : {}),
      ...(query
        ? {
            OR: [
              { company: { contains: query, mode: "insensitive" } },
              { mainContact: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      quotes: {
        orderBy: { createdAt: "desc" },
        take: 4,
      },
      tickets: {
        orderBy: { updatedAt: "desc" },
        take: 4,
      },
    },
  }), []);
}

export async function getProjectsList() {
  return db.websiteProject.findMany({
    orderBy: { updatedAt: "desc" },
    include: { client: true, template: true },
  });
}

export async function getProjectDetail(id: string) {
  return db.websiteProject.findUnique({
    where: { id },
    include: { client: true, template: true },
  });
}

export async function getFinancialOverview() {
  const tickets = await db.ticket.findMany({
    orderBy: { updatedAt: "desc" },
    include: { customer: true, quote: true },
  });

  const enriched = tickets.map((ticket) => {
    const computed = calculateTicketFinancials({
      actualHours: ticket.actualHours,
      laborRate: ticket.laborRate,
      materialsCost: ticket.materialsCost,
      shippingCost: ticket.shippingCost,
      billedAmount: ticket.billedAmount,
    });

    return {
      ...ticket,
      ...computed,
    };
  });

  const totals = enriched.reduce(
    (accumulator, ticket) => {
      accumulator.quoted += ticket.quotedAmount ?? 0;
      accumulator.billed += ticket.billedAmount ?? 0;
      accumulator.cost += ticket.totalCost ?? 0;
      accumulator.profit += ticket.profitLoss ?? 0;
      return accumulator;
    },
    { quoted: 0, billed: 0, cost: 0, profit: 0 },
  );

  const monthly = Object.values(
    enriched.reduce<Record<string, { label: string; revenue: number; cost: number; profit: number }>>(
      (accumulator, ticket) => {
        const key = `${ticket.updatedAt.getFullYear()}-${ticket.updatedAt.getMonth() + 1}`;
        accumulator[key] = accumulator[key] ?? {
          label: ticket.updatedAt.toLocaleString("en-US", { month: "short" }),
          revenue: 0,
          cost: 0,
          profit: 0,
        };
        accumulator[key].revenue += ticket.billedAmount ?? 0;
        accumulator[key].cost += ticket.totalCost ?? 0;
        accumulator[key].profit += ticket.profitLoss ?? 0;
        return accumulator;
      },
      {},
    ),
  ).slice(-6);

  return {
    tickets: enriched,
    totals,
    monthly,
    highestMargin: [...enriched].sort((a, b) => (b.marginPercent ?? 0) - (a.marginPercent ?? 0))[0],
    lowestMargin: [...enriched].sort((a, b) => (a.marginPercent ?? 0) - (b.marginPercent ?? 0))[0],
  };
}

export async function getInvoicesList(workspaceId?: string | null) {
  return safeOpsQuery("invoices list", db.invoice.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { updatedAt: "desc" },
    include: {
      customer: true,
      workspace: true,
      quote: true,
      ticket: true,
      calibrationWorkOrder: true,
      lineItems: {
        orderBy: { sortOrder: "asc" },
      },
    },
  }), []);
}

export async function getInvoiceDetail(id: string, workspaceId?: string | null) {
  return safeOpsQuery("invoice detail", db.invoice.findFirst({
    where: { id, ...(workspaceId ? { workspaceId } : {}) },
    include: {
      customer: true,
      workspace: true,
      quote: true,
      ticket: true,
      calibrationWorkOrder: true,
      lineItems: {
        orderBy: { sortOrder: "asc" },
      },
      activities: {
        orderBy: { createdAt: "desc" },
      },
    },
  }), null);
}

export async function getActivityFeed(searchParams: Record<string, SearchValue>) {
  const filters = {
    entityType: getSingleValue(searchParams.entityType)?.trim() ?? "",
    query: getSingleValue(searchParams.query)?.trim() ?? "",
  };

  const activities = await db.activityLog.findMany({
    where: {
      AND: [
        filters.entityType ? { entityType: filters.entityType } : {},
        filters.query
          ? {
              OR: [
                { title: { contains: filters.query, mode: "insensitive" } },
                { description: { contains: filters.query, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return { activities, filters };
}

export async function getCalOpsIntegrationData() {
  const [drafts, logs] = await Promise.all([
    db.workOrderDraft.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        customer: true,
        sourceQuoteRequest: true,
        exportLogs: {
          orderBy: { exportedAt: "desc" },
          take: 3,
        },
      },
    }),
    db.integrationExportLog.findMany({
      orderBy: { exportedAt: "desc" },
      take: 50,
      include: {
        workOrderDraft: {
          include: {
            customer: true,
          },
        },
      },
    }),
  ]);

  return {
    drafts,
    logs,
    connectionStatus: "Not connected" as const,
  };
}

export async function getWorkOrderDraftExport(id: string) {
  return db.workOrderDraft.findUnique({
    where: { id },
    include: {
      customer: true,
      sourceQuoteRequest: {
        include: {
          internalNotes: {
            orderBy: { createdAt: "asc" },
          },
          attachments: true,
        },
      },
      internalNotes: {
        orderBy: { createdAt: "asc" },
      },
      exportLogs: {
        orderBy: { exportedAt: "desc" },
      },
    },
  });
}

export async function getTeamMembers() {
  return db.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: {
      assignedQuotes: {
        where: {
          status: {
            in: [QuoteStatus.NEW, QuoteStatus.REVIEWING, QuoteStatus.NEEDS_MORE_INFO, QuoteStatus.QUOTED],
          },
        },
        select: { id: true },
      },
      assignedTickets: {
        where: {
          status: {
            notIn: CLOSED_TICKET_STATUSES,
          },
        },
        select: { id: true },
      },
    },
  });
}

export async function getAssignableUsers(roles?: UserRole[]) {
  return db.user.findMany({
    where: {
      isActive: true,
      ...(roles ? { role: { in: roles } } : {}),
    },
    orderBy: { name: "asc" },
  });
}

export async function getIdeaBoardData(searchParams: Record<string, SearchValue>) {
  const filters = {
    status: getSingleValue(searchParams.status)?.trim() ?? "",
    category: getSingleValue(searchParams.category)?.trim() ?? "",
    query: getSingleValue(searchParams.query)?.trim() ?? "",
  };

  const ideas = await db.ideaPost.findMany({
    where: {
      AND: [
        filters.status ? { status: filters.status as IdeaStatus } : {},
        filters.category ? { category: { contains: filters.category, mode: "insensitive" } } : {},
        filters.query
          ? {
              OR: [
                { title: { contains: filters.query, mode: "insensitive" } },
                { description: { contains: filters.query, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      createdBy: true,
      owner: true,
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: true,
        },
      },
    },
  });

  const categories = Array.from(new Set(ideas.map((idea) => idea.category))).sort((a, b) =>
    a.localeCompare(b),
  );

  return { ideas, categories, filters };
}

export async function getTechnicianDashboard(userId: string) {
  const tickets = await db.ticket.findMany({
    where: {
      assignedUserId: userId,
    },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
    include: {
      customer: true,
      quote: true,
      comments: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          author: true,
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 6,
      },
    },
  });

  const overdue = tickets.filter((ticket) => ticket.dueDate && ticket.dueDate < new Date());

  return {
    tickets,
    overdue,
    active: tickets.filter((ticket) => !CLOSED_TICKET_STATUSES.includes(ticket.status)),
    completed: tickets.filter((ticket) => ticket.status === TicketStatus.COMPLETED).length,
  };
}

export async function getTechnicianTicketDetail(ticketId: string, userId: string) {
  return db.ticket.findFirst({
    where: {
      id: ticketId,
      assignedUserId: userId,
    },
    include: {
      customer: true,
      quote: true,
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          author: true,
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
