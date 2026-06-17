import Link from "next/link";
import { UserRole } from "@prisma/client";

import { AdminSection, DetailCard, DuePill, EmptyState, StatusBadge } from "@/components/admin/ops-ui";
import { requireRoles } from "@/features/admin/guards";
import { getTechnicianCalOpsDashboard } from "@/features/calops/queries";
import { getTechnicianDashboard } from "@/features/ops/queries";
import { formatDate, formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TechnicianDashboardPage() {
  const { user } = await requireRoles([UserRole.TECHNICIAN]);
  const [data, calOps] = await Promise.all([
    getTechnicianDashboard(user.id),
    getTechnicianCalOpsDashboard(user.id),
  ]);

  return (
    <div className="space-y-4">
      <AdminSection
        title="Technician dashboard"
        description="Focused work view for assigned calibration jobs, legacy tickets, due dates, status updates, calibration data placeholders, notes, and review submissions."
      />

      <section className="grid gap-3 md:grid-cols-4">
        <Metric title="Cal jobs" value={calOps.workOrders.length} />
        <Metric title="Active cal work" value={calOps.open.length} />
        <Metric title="Review ready" value={calOps.reviewReady.length} />
        <Metric title="Overdue" value={calOps.overdue.length + data.overdue.length} tone={calOps.overdue.length + data.overdue.length > 0 ? "warning" : "neutral"} />
      </section>

      {data.tickets.length === 0 && calOps.workOrders.length === 0 ? (
        <EmptyState title="No assigned work yet" body="Assigned tickets and work comments will appear here once jobs are routed to you." />
      ) : (
        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <DetailCard title="My assigned calibration jobs">
            <div className="space-y-3">
              {calOps.workOrders.map((workOrder) => (
                <Link
                  key={workOrder.id}
                  href={`/tech/work-orders/${workOrder.id}`}
                  className="block rounded-[0.95rem] border border-[#12212c]/8 bg-white/60 p-3.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{workOrder.woNumber}</p>
                        <StatusBadge label={sentenceCase(workOrder.status)} tone="neutral" />
                        <StatusBadge
                          label={sentenceCase(workOrder.priority)}
                          tone={workOrder.priority === "HIGH" || workOrder.priority === "URGENT" ? "warning" : "info"}
                        />
                      </div>
                      <p className="mt-1 text-sm text-[#64707a]">
                        {workOrder.customer.company} - {workOrder.procedure?.title ?? "No procedure"}
                      </p>
                      <p className="mt-1 text-xs text-[#64707a]">
                        Assets: {workOrder.assets.map((link) => link.asset.assetId).join(", ") || "None"}
                      </p>
                    </div>
                    <DuePill date={workOrder.dueDate} />
                  </div>
                </Link>
              ))}
              {calOps.workOrders.length === 0 ? <p className="text-sm text-[#64707a]">No calibration jobs assigned.</p> : null}
            </div>
          </DetailCard>

          <DetailCard title="Legacy tickets">
            <div className="space-y-3">
              {data.tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tech/tickets/${ticket.id}`}
                  className="block rounded-[0.95rem] border border-[#12212c]/8 bg-white/60 p-3.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{ticket.ticketNumber}</p>
                        <StatusBadge label={sentenceCase(ticket.status)} tone="neutral" />
                        <StatusBadge
                          label={sentenceCase(ticket.priority)}
                          tone={ticket.priority === "HIGH" || ticket.priority === "URGENT" ? "warning" : "info"}
                        />
                      </div>
                      <p className="mt-1 text-sm text-[#64707a]">
                        {ticket.customer.company} · {sentenceCase(ticket.type)}
                      </p>
                      <p className="mt-1 text-xs text-[#64707a]">
                        Due {ticket.dueDate ? formatDateTime(ticket.dueDate) : "not set"}
                      </p>
                    </div>
                    <DuePill date={ticket.dueDate} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#64707a]">{ticket.notes ?? "No notes yet."}</p>
                </Link>
              ))}
              {data.tickets.length === 0 ? <p className="text-sm text-[#64707a]">No legacy tickets assigned.</p> : null}
            </div>
          </DetailCard>

          <DetailCard title="Recent calibration activity">
            <div className="space-y-3">
              {calOps.workOrders.flatMap((workOrder) => workOrder.activities.slice(0, 1)).length === 0 ? (
                <p className="text-sm text-[#64707a]">No recent calibration activity yet.</p>
              ) : (
                calOps.workOrders.flatMap((workOrder) => workOrder.activities.slice(0, 1)).map((activity) => (
                  <div key={activity.id} className="rounded-[0.95rem] border border-[#12212c]/8 bg-white/60 p-3.5">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#64707a]">{activity.description}</p>
                    <p className="mt-1 text-xs text-[#64707a]">{formatDate(activity.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </DetailCard>

          <DetailCard title="Recent work updates">
            <div className="space-y-3">
              {data.tickets.flatMap((ticket) => ticket.activities.slice(0, 1)).length === 0 ? (
                <p className="text-sm text-[#64707a]">No recent activity yet.</p>
              ) : (
                data.tickets.flatMap((ticket) => ticket.activities.slice(0, 1)).map((activity) => (
                  <div key={activity.id} className="rounded-[0.95rem] border border-[#12212c]/8 bg-white/60 p-3.5">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#64707a]">{activity.description}</p>
                    <p className="mt-1 text-xs text-[#64707a]">{formatDate(activity.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </DetailCard>
        </section>
      )}
    </div>
  );
}

function Metric({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value: number;
  tone?: "neutral" | "warning";
}) {
  return (
    <div className="app-panel rounded-[0.95rem] p-3.5">
      <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">{title}</p>
      <p className={`mt-1.5 text-[1.55rem] font-semibold ${tone === "warning" ? "text-[#9e4f18]" : ""}`}>
        {value}
      </p>
    </div>
  );
}
