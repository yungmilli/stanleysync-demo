import { UserRole } from "@prisma/client";

import { AdminSection, DetailCard, FinancialBars, StatusBadge } from "@/components/admin/ops-ui";
import { requireRoles } from "@/features/admin/guards";
import { getFinancialOverview } from "@/features/ops/queries";
import { formatCurrency, formatPercent, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FinancialsPage() {
  await requireRoles([UserRole.ADMIN, UserRole.MANAGER]);
  const financials = await getFinancialOverview();

  return (
    <div className="space-y-4">
      <AdminSection
        title="Financial performance"
        description="Review quoted versus billed amounts, ticket costs, overall margin, and which jobs performed best or worst."
      />

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <DetailCard title="Monthly totals">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Quoted" value={formatCurrency(financials.totals.quoted)} />
            <Stat label="Billed" value={formatCurrency(financials.totals.billed)} />
            <Stat label="Cost" value={formatCurrency(financials.totals.cost)} />
            <Stat label="Profit" value={formatCurrency(financials.totals.profit)} />
          </div>
        </DetailCard>
        <DetailCard title="Revenue, cost, and profit trend">
          <FinancialBars rows={financials.monthly} />
        </DetailCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DetailCard title="Highest margin job">
          {financials.highestMargin ? (
            <JobSummary ticket={financials.highestMargin} />
          ) : (
            <p className="text-sm text-[#64707a]">No tickets available.</p>
          )}
        </DetailCard>
        <DetailCard title="Lowest margin job">
          {financials.lowestMargin ? (
            <JobSummary ticket={financials.lowestMargin} />
          ) : (
            <p className="text-sm text-[#64707a]">No tickets available.</p>
          )}
        </DetailCard>
      </section>

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Quoted</th>
              <th>Billed</th>
              <th>Total cost</th>
              <th>Profit / loss</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            {financials.tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.ticketNumber}</td>
                <td>{ticket.customer.company}</td>
                <td>
                  <StatusBadge label={sentenceCase(ticket.status)} tone="neutral" />
                </td>
                <td>{formatCurrency(ticket.quotedAmount)}</td>
                <td>{formatCurrency(ticket.billedAmount)}</td>
                <td>{formatCurrency(ticket.totalCost)}</td>
                <td>{formatCurrency(ticket.profitLoss)}</td>
                <td>{formatPercent(ticket.marginPercent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[0.95rem] border border-[#12212c]/8 bg-white/55 p-3">
      <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">{label}</p>
      <p className="mt-1.5 text-lg font-semibold">{value}</p>
    </div>
  );
}

function JobSummary({
  ticket,
}: {
  ticket: {
    ticketNumber: string;
    customer: { company: string };
    billedAmount?: number | null;
    totalCost?: number | null;
    profitLoss?: number | null;
    marginPercent?: number | null;
  };
}) {
  return (
    <div className="space-y-2 rounded-[0.95rem] border border-[#12212c]/8 bg-white/55 p-3.5">
      <p className="text-sm font-medium">{ticket.ticketNumber}</p>
      <p className="text-sm text-[#64707a]">{ticket.customer.company}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <p className="text-sm">Billed: {formatCurrency(ticket.billedAmount)}</p>
        <p className="text-sm">Cost: {formatCurrency(ticket.totalCost)}</p>
        <p className="text-sm">Profit: {formatCurrency(ticket.profitLoss)}</p>
        <p className="text-sm">Margin: {formatPercent(ticket.marginPercent)}</p>
      </div>
    </div>
  );
}
