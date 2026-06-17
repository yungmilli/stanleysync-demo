import Link from "next/link";
import { CalibrationWorkOrderStatus, Priority } from "@prisma/client";

import { AdminSection, DuePill, EmptyState, FilterBar, FilterInput, FilterSelect, StatusBadge, SubmitButton } from "@/components/admin/ops-ui";
import { requireCalOpsAccess } from "@/features/admin/guards";
import { getCalibrationWorkOrdersList } from "@/features/calops/queries";
import { formatCurrency, formatDate, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CalibrationWorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireCalOpsAccess();
  const resolvedSearchParams = await searchParams;
  const { workOrders, byStatus, filters } = await getCalibrationWorkOrdersList(resolvedSearchParams);

  return (
    <div className="space-y-4">
      <AdminSection
        title="Calibration work orders"
        description="Execute calibration jobs through intake, calibration data, standards, uncertainty, findings, certificate draft, and activity review."
      />

      <FilterBar>
        <FilterInput name="query" defaultValue={filters.query} placeholder="Search WO, customer, asset" />
        <FilterSelect name="status" defaultValue={filters.status}>
          <option value="">All statuses</option>
          {Object.values(CalibrationWorkOrderStatus).map((status) => (
            <option key={status} value={status}>{sentenceCase(status)}</option>
          ))}
        </FilterSelect>
        <FilterSelect name="priority" defaultValue={filters.priority}>
          <option value="">All priorities</option>
          {Object.values(Priority).map((priority) => (
            <option key={priority} value={priority}>{sentenceCase(priority)}</option>
          ))}
        </FilterSelect>
        <FilterSelect name="view" defaultValue={filters.view}>
          <option value="table">Table view</option>
          <option value="kanban">Kanban view</option>
        </FilterSelect>
        <div className="flex gap-2">
          <FilterSelect name="sort" defaultValue={filters.sort} className="flex-1">
            <option value="recent">Recently updated</option>
            <option value="dueDate">Due date</option>
          </FilterSelect>
          <SubmitButton label="Apply" />
        </div>
      </FilterBar>

      {workOrders.length === 0 ? (
        <EmptyState title="No work orders matched the filters" body="Seeded calibration work orders appear here after the CalOps seed is loaded." />
      ) : filters.view === "kanban" ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {Object.entries(byStatus).map(([status, items]) => (
            <section key={status} className="app-panel rounded-[1rem] p-3.5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{sentenceCase(status)}</h2>
                <StatusBadge label={String(items.length)} tone="neutral" />
              </div>
              <div className="space-y-3">
                {items.map((workOrder) => (
                  <Link key={workOrder.id} href={`/admin/work-orders/${workOrder.id}`} className="block rounded-[0.95rem] border border-[#12212c]/8 bg-white/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{workOrder.woNumber}</p>
                      <DuePill date={workOrder.dueDate} />
                    </div>
                    <p className="mt-1 text-sm text-[#64707a]">{workOrder.customer.company}</p>
                    <p className="mt-2 text-xs text-[#64707a]">{workOrder.assignedTechnician ?? "Unassigned"}</p>
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
                <th>Work order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Technician</th>
                <th>Assets</th>
                <th>Due date</th>
                <th>Revenue</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {workOrders.map((workOrder) => (
                <tr key={workOrder.id}>
                  <td>
                    <p className="font-medium">{workOrder.woNumber}</p>
                    <p className="mt-1 text-xs text-[#64707a]">{sentenceCase(workOrder.serviceType)}</p>
                  </td>
                  <td>{workOrder.customer.company}</td>
                  <td><StatusBadge label={sentenceCase(workOrder.status)} tone="neutral" /></td>
                  <td><StatusBadge label={sentenceCase(workOrder.priority)} tone={workOrder.priority === "HIGH" || workOrder.priority === "URGENT" ? "warning" : "neutral"} /></td>
                  <td>{workOrder.assignedTechnician ?? "Unassigned"}</td>
                  <td>{workOrder.assets.map((link) => link.asset.assetId).join(", ")}</td>
                  <td>
                    <div className="space-y-1">
                      <DuePill date={workOrder.dueDate} />
                      <p className="text-xs text-[#64707a]">{formatDate(workOrder.dueDate)}</p>
                    </div>
                  </td>
                  <td>{formatCurrency(workOrder.revenueAmount)}</td>
                  <td>
                    <Link href={`/admin/work-orders/${workOrder.id}`} className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium">
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

