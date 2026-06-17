import Link from "next/link";

import {
  AdminSection,
  EmptyState,
  FilterBar,
  FilterInput,
  FilterSelect,
  StatusBadge,
  SubmitButton,
  TableHint,
} from "@/components/admin/ops-ui";
import { requireQuoteAccess } from "@/features/admin/guards";
import { getQuotesList } from "@/features/ops/queries";
import { getWorkspaceSwitcherData } from "@/features/workspaces/queries";
import { formatDate, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireQuoteAccess();
  const workspaceState = await getWorkspaceSwitcherData(user.id);
  const resolvedSearchParams = await searchParams;
  const { quotes, filters } = await getQuotesList(resolvedSearchParams, workspaceState.activeWorkspace?.id);

  return (
    <div className="space-y-4">
      <AdminSection
        title="Quote submissions"
        description="Review QuoteFlow intake requests, move them through quote status, add internal context, convert approved work to jobs, and export quote PDFs."
      />

      <FilterBar>
        <FilterInput name="query" defaultValue={filters.query} placeholder="Search quote, company, contact, equipment" />
        <FilterSelect name="status" defaultValue={filters.status}>
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="REVIEWING">Reviewing</option>
          <option value="NEEDS_MORE_INFO">Need More Info</option>
          <option value="QUOTED">Quoted</option>
          <option value="CONVERTED_TO_WORK_ORDER_DRAFT">Converted to Work Order Draft</option>
          <option value="CLOSED">Closed</option>
        </FilterSelect>
        <FilterSelect name="serviceType" defaultValue={filters.serviceType}>
          <option value="">All services</option>
          <option value="CALIBRATION">Calibration</option>
          <option value="REPAIR">Repair</option>
          <option value="CUSTOM_SERVICE">Custom service</option>
          <option value="OTHER">Other</option>
        </FilterSelect>
        <FilterSelect name="priority" defaultValue={filters.priority}>
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </FilterSelect>
        <div className="flex gap-2">
          <FilterSelect name="dateRange" defaultValue={filters.dateRange} className="flex-1">
            <option value="">Any date</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </FilterSelect>
          <FilterSelect name="sort" defaultValue={filters.sort} className="flex-1">
            <option value="recent">Newest first</option>
            <option value="priority">Priority</option>
            <option value="turnaround">Turnaround</option>
          </FilterSelect>
          <SubmitButton label="Apply" />
        </div>
      </FilterBar>

      <div className="table-shell">
        {quotes.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No quotes matched the current filters"
              body="Adjust the search or filters to see stored quote submissions."
            />
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Quote</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Turnaround</th>
                <th>Assigned</th>
                <th>Created</th>
                <th>Handoff</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <td>
                    <div>
                      <p className="font-medium">{quote.quoteNumber}</p>
                      <p className="mt-1 text-xs text-[#64707a] line-clamp-2">{quote.aiSummary}</p>
                    </div>
                  </td>
                  <td>
                    <p>{quote.customer.company}</p>
                    <p className="mt-1 text-xs text-[#64707a]">{quote.customer.mainContact}</p>
                  </td>
                  <td>{sentenceCase(quote.serviceType)}</td>
                  <td>
                    <StatusBadge
                      label={sentenceCase(quote.status)}
                      tone={quote.status === "NEEDS_MORE_INFO" ? "warning" : "neutral"}
                    />
                  </td>
                  <td>
                    <StatusBadge
                      label={sentenceCase(quote.priority)}
                      tone={quote.priority === "HIGH" || quote.priority === "URGENT" ? "warning" : "neutral"}
                    />
                  </td>
                  <td>{quote.requestedTurnaround ?? "Not set"}</td>
                  <td>{quote.assignedTo ?? "Unassigned"}</td>
                  <td>{formatDate(quote.createdAt)}</td>
                  <td>
                    {quote.workOrderDraft ? (
                      <StatusBadge label={quote.workOrderDraft.draftNumber} tone="info" />
                    ) : (
                      <span className="text-xs text-[#64707a]">Not converted</span>
                    )}
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/quotes/${quote.id}`}
                        className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium"
                      >
                        Open
                      </Link>
                      {quote.workOrderDraft ? (
                        <a
                          href={`/api/work-order-drafts/${quote.workOrderDraft.id}/export`}
                          className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium"
                        >
                          Export
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <TableHint>QuoteFlow stores structured intake history, internal review state, and future-ready Work Order Draft handoffs.</TableHint>
    </div>
  );
}
