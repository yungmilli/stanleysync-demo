import Link from "next/link";

import { CalOpsShell } from "@/components/admin/calops-shell";
import { AdminSection, DataBars, DetailCard, DuePill, MetricCard, StatusBadge } from "@/components/admin/ops-ui";
import { requireCalOpsAccess } from "@/features/admin/guards";
import { getCalOpsDashboard } from "@/features/calops/queries";
import { formatCurrency, formatDate, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CalOpsDashboardPage() {
  await requireCalOpsAccess();
  const data = await getCalOpsDashboard();

  return (
    <CalOpsShell>
    <div className="space-y-5">
      <AdminSection
        title="CalOps execution dashboard"
        description="Manage assets, calibration work orders, standards, certificates, technician workload, and due-date risk from the operations engine."
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.kind === "currency" ? formatCurrency(metric.value as number) : String(metric.value)}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <DetailCard title="Jobs by technician">
          <DataBars rows={data.jobsByTechnician.length > 0 ? data.jobsByTechnician : [{ label: "Unassigned", value: 0 }]} />
        </DetailCard>
        <DetailCard title="Workload heat map">
          <DataBars rows={data.workloadHeatMap.length > 0 ? data.workloadHeatMap : [{ label: "No open jobs", value: 0 }]} />
        </DetailCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <DetailCard title="Work orders by status">
          <DataBars rows={data.workOrderStatusBreakdown.length > 0 ? data.workOrderStatusBreakdown : [{ label: "No work orders", value: 0 }]} />
        </DetailCard>
        <DetailCard title="Standards coming due" action={<Link href="/admin/standards" className="text-sm text-[#9e4f18]">Standards</Link>}>
          <div className="space-y-3">
            {data.standardsDueSoon.map((standard) => (
              <Link key={standard.id} href={`/admin/standards/${standard.id}`} className="flex items-center justify-between gap-3 rounded-[0.95rem] border border-[#12212c]/8 bg-white/60 p-3">
                <div>
                  <p className="text-sm font-medium">{standard.standardId}</p>
                  <p className="text-xs text-[#64707a]">{standard.description}</p>
                </div>
                <DuePill date={standard.dueDate} />
              </Link>
            ))}
          </div>
        </DetailCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <DetailCard title="Open calibration work orders" action={<Link href="/admin/work-orders" className="text-sm text-[#9e4f18]">Work orders</Link>}>
          <div className="space-y-3">
            {data.openWorkOrders.map((workOrder) => (
              <Link key={workOrder.id} href={`/admin/work-orders/${workOrder.id}`} className="block rounded-[0.95rem] border border-[#12212c]/8 bg-white/60 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{workOrder.woNumber}</p>
                      <StatusBadge label={sentenceCase(workOrder.status)} tone="neutral" />
                      <StatusBadge label={sentenceCase(workOrder.priority)} tone={workOrder.priority === "HIGH" || workOrder.priority === "URGENT" ? "warning" : "neutral"} />
                    </div>
                    <p className="mt-1 text-sm text-[#64707a]">{workOrder.customer.company}</p>
                    <p className="mt-1 text-xs text-[#64707a]">{workOrder.assignedTechnician ?? "Unassigned"} - {formatDate(workOrder.dueDate)}</p>
                  </div>
                  <DuePill date={workOrder.dueDate} />
                </div>
              </Link>
            ))}
          </div>
        </DetailCard>

        <DetailCard title="Assets due in 30 days" action={<Link href="/admin/assets?sort=dueDate" className="text-sm text-[#9e4f18]">Assets</Link>}>
          <div className="space-y-3">
            {data.assetsDueSoon.map((asset) => (
              <Link key={asset.id} href={`/admin/assets/${asset.id}`} className="flex items-center justify-between gap-3 rounded-[0.95rem] border border-[#12212c]/8 bg-white/60 p-3">
                <div>
                  <p className="text-sm font-medium">{asset.assetId}</p>
                  <p className="text-xs text-[#64707a]">{asset.customer.company} - {asset.description}</p>
                </div>
                <div className="text-right">
                  <StatusBadge label={sentenceCase(asset.status)} tone={asset.status === "OVERDUE" || asset.status === "OOT" ? "danger" : "warning"} />
                  <p className="mt-1 text-xs text-[#64707a]">{formatDate(asset.dueDate)}</p>
                </div>
              </Link>
            ))}
          </div>
        </DetailCard>
      </section>
    </div>
    </CalOpsShell>
  );
}

