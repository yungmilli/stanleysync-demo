import { AdminSection, DetailCard } from "@/components/admin/ops-ui";
import { CleanupTools } from "@/components/admin/cleanup-tools";
import { requireSystemOwnerSession } from "@/features/admin/guards";
import { db } from "@/lib/db";
import { formatCurrency, formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

const demoWorkspaceKeys = ["general-service-demo", "auto-repair-demo"];

export default async function CleanupPage() {
  await requireSystemOwnerSession();

  const demoWorkspaces = await db.businessWorkspace.findMany({
    where: { workspaceKey: { in: demoWorkspaceKeys } },
    select: { id: true, businessName: true },
  });
  const workspaceIds = demoWorkspaces.map((workspace) => workspace.id);

  const [quotes, tickets, invoices] = workspaceIds.length
    ? await Promise.all([
        db.quoteRequest.findMany({
          where: { workspaceId: { in: workspaceIds } },
          orderBy: { updatedAt: "desc" },
          include: { customer: true },
        }),
        db.ticket.findMany({
          where: { workspaceId: { in: workspaceIds } },
          orderBy: { updatedAt: "desc" },
          include: { customer: true },
        }),
        db.invoice.findMany({
          where: { workspaceId: { in: workspaceIds } },
          orderBy: { updatedAt: "desc" },
          include: { customer: true },
        }),
      ])
    : [[], [], []] as const;

  const records = [
    ...quotes.map((quote) => ({
      id: quote.id,
      recordKey: `quote:${quote.id}`,
      type: "quote" as const,
      number: quote.quoteNumber,
      customer: quote.customer.company,
      status: sentenceCase(quote.status),
      amount: formatCurrency(quote.quotedAmount),
      updatedAt: formatDateTime(quote.updatedAt),
    })),
    ...tickets.map((ticket) => ({
      id: ticket.id,
      recordKey: `ticket:${ticket.id}`,
      type: "ticket" as const,
      number: ticket.ticketNumber,
      customer: ticket.customer.company,
      status: sentenceCase(ticket.status),
      amount: formatCurrency(ticket.billedAmount ?? ticket.quotedAmount),
      updatedAt: formatDateTime(ticket.updatedAt),
    })),
    ...invoices.map((invoice) => ({
      id: invoice.id,
      recordKey: `invoice:${invoice.id}`,
      type: "invoice" as const,
      number: invoice.invoiceNumber,
      customer: invoice.customer.company,
      status: sentenceCase(invoice.status),
      amount: formatCurrency(invoice.total),
      updatedAt: formatDateTime(invoice.updatedAt),
    })),
  ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  return (
    <div className="space-y-5">
      <AdminSection
        title="Owner cleanup tools"
        description="Safely clear test quotes, jobs, and invoices from demo workspaces before a customer walkthrough."
      />

      <DetailCard title="Demo workflow records">
        <CleanupTools records={records} />
      </DetailCard>

      <DetailCard title="Safety rules">
        <ul className="space-y-2 text-sm leading-6 text-[#64707a]">
          <li>Only System Owner can access this page.</li>
          <li>Only StanleySync demo workspace records are eligible for deletion.</li>
          <li>Customers, users, workspaces, settings, and production records are not cleared by this tool.</li>
          <li>Deletion requires typing DELETE in the confirmation dialog.</li>
        </ul>
      </DetailCard>
    </div>
  );
}
