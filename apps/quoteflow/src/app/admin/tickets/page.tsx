import Link from "next/link";
import { UserRole } from "@prisma/client";

import { AdminSection, DuePill, EmptyState, FilterBar, FilterInput, FilterSelect, StatusBadge, SubmitButton } from "@/components/admin/ops-ui";
import { requireRoles } from "@/features/admin/guards";
import { getTicketsList } from "@/features/ops/queries";
import { getWorkspaceSwitcherData } from "@/features/workspaces/queries";
import { formatCurrency, formatDate, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireRoles([UserRole.ADMIN, UserRole.MANAGER, UserRole.DEMO_USER]);
  const workspaceState = await getWorkspaceSwitcherData(user.id);
  const resolvedSearchParams = await searchParams;
  const { tickets, byStatus, filters } = await getTicketsList(resolvedSearchParams, workspaceState.activeWorkspace?.id);

  return (
    <div className="space-y-4">
      <AdminSection
        title="Work orders and tickets"
        description="Track owners, due dates, status changes, job costs, billed totals, and profitability from the same operational record."
      />

      <FilterBar>
        <FilterInput name="query" defaultValue={filters.query} placeholder="Search ticket, assignee, company" />
        <FilterSelect name="status" defaultValue={filters.status}>
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="WAITING_ON_CUSTOMER">Waiting on customer</option>
          <option value="WAITING_ON_PARTS">Waiting on parts</option>
          <option value="COMPLETED">Completed</option>
          <option value="INVOICED">Invoiced</option>
          <option value="CLOSED">Closed</option>
        </FilterSelect>
        <FilterSelect name="priority" defaultValue={filters.priority}>
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </FilterSelect>
        <FilterSelect name="view" defaultValue={filters.view}>
          <option value="table">Table view</option>
          <option value="kanban">Kanban view</option>
        </FilterSelect>
        <div className="flex gap-2">
          <FilterSelect name="sort" defaultValue={filters.sort} className="flex-1">
            <option value="recent">Recently updated</option>
            <option value="dueDate">Due date</option>
            <option value="profit">Profit</option>
          </FilterSelect>
          <SubmitButton label="Apply" />
        </div>
      </FilterBar>

      {tickets.length === 0 ? (
        <EmptyState
          title="No tickets matched the current filters"
          body="Convert approved quotes into work orders or broaden the filters."
        />
      ) : filters.view === "kanban" ? (
        <div className="grid gap-4 xl:grid-cols-4">
          {Object.entries(byStatus).map(([status, items]) => (
            <section key={status} className="app-panel rounded-[1rem] p-3.5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{sentenceCase(status)}</h2>
                <StatusBadge label={String(items.length)} tone="neutral" />
              </div>
              <div className="space-y-3">
                {items.map((ticket) => (
                  <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`} className="block rounded-[0.95rem] border border-[#12212c]/8 bg-white/60 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{ticket.ticketNumber}</p>
                      <DuePill date={ticket.dueDate} />
                    </div>
                    <p className="mt-1 text-sm text-[#64707a]">{ticket.customer.company}</p>
                    <p className="mt-2 text-xs text-[#64707a]">{ticket.assignedTo ?? "Unassigned"}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge
                        label={sentenceCase(ticket.priority)}
                        tone={ticket.priority === "HIGH" || ticket.priority === "URGENT" ? "warning" : "neutral"}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due date</th>
                <th>Billed</th>
                <th>Profit</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <p className="font-medium">{ticket.ticketNumber}</p>
                    <p className="mt-1 text-xs text-[#64707a]">{sentenceCase(ticket.type)}</p>
                  </td>
                  <td>{ticket.customer.company}</td>
                  <td>
                    <StatusBadge label={sentenceCase(ticket.status)} tone="neutral" />
                  </td>
                  <td>
                    <StatusBadge
                      label={sentenceCase(ticket.priority)}
                      tone={ticket.priority === "HIGH" || ticket.priority === "URGENT" ? "warning" : "neutral"}
                    />
                  </td>
                  <td>{ticket.assignedTo ?? "Unassigned"}</td>
                  <td>
                    <div className="space-y-1">
                      <DuePill date={ticket.dueDate} />
                      <p className="text-xs text-[#64707a]">{ticket.dueDate ? formatDate(ticket.dueDate) : "No due date"}</p>
                    </div>
                  </td>
                  <td>{formatCurrency(ticket.billedAmount)}</td>
                  <td>{formatCurrency(ticket.profitLoss)}</td>
                  <td>
                    <Link href={`/admin/tickets/${ticket.id}`} className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
