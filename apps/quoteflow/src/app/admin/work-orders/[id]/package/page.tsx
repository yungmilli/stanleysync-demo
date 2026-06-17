import { notFound } from "next/navigation";
import { ExportPackageType } from "@prisma/client";

import { Breadcrumbs, DetailCard, KeyValueGrid, StatusBadge } from "@/components/admin/ops-ui";
import { PrintButton } from "@/components/admin/print-button";
import { requireCalOpsAccess } from "@/features/admin/guards";
import { createWorkOrderPackageExportAction } from "@/features/calops/actions";
import { getCalibrationWorkOrderDetail } from "@/features/calops/queries";
import { formatDate, formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WorkOrderPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCalOpsAccess();
  const { id } = await params;
  const workOrder = await getCalibrationWorkOrderDetail(id);

  if (!workOrder) notFound();

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <Breadcrumbs
          backHref={`/admin/work-orders/${workOrder.id}`}
          items={[
            { label: "Work Orders", href: "/admin/work-orders" },
            { label: workOrder.woNumber, href: `/admin/work-orders/${workOrder.id}` },
            { label: "Package" },
          ]}
        />
      </div>

      <section className="app-panel rounded-[1rem] p-5 print:border-0 print:bg-white print:shadow-none">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#9e4f18]">StanleySync CalOps</p>
            <h1 className="mt-1 text-[1.55rem] font-semibold tracking-[-0.02em]">Calibration Work Order Package</h1>
            <p className="mt-1 text-sm text-[#64707a]">{workOrder.woNumber} - {workOrder.customer.company}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <form action={createWorkOrderPackageExportAction}>
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <input type="hidden" name="packageType" value={ExportPackageType.WORK_ORDER_PACKAGE} />
              <input type="hidden" name="title" value={`${workOrder.woNumber} work order package`} />
              <button type="submit" className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-sm font-medium">Log package export</button>
            </form>
            <PrintButton />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <DetailCard title="Work order">
            <KeyValueGrid
              items={[
                { label: "WO number", value: workOrder.woNumber },
                { label: "Status", value: sentenceCase(workOrder.status) },
                { label: "Priority", value: sentenceCase(workOrder.priority) },
                { label: "Service type", value: sentenceCase(workOrder.serviceType) },
                { label: "Lab", value: workOrder.lab?.name ?? "Default lab" },
                { label: "Due", value: formatDateTime(workOrder.dueDate) },
              ]}
            />
          </DetailCard>

          <DetailCard title="Customer and method">
            <KeyValueGrid
              items={[
                { label: "Customer", value: workOrder.customer.company },
                { label: "Contact", value: workOrder.customer.mainContact },
                { label: "Procedure", value: workOrder.procedure ? `${workOrder.procedure.procedureNumber} ${workOrder.procedure.revision}` : "Unassigned" },
                { label: "Technician", value: workOrder.assignedTechnician ?? "Unassigned" },
                { label: "Completed", value: formatDateTime(workOrder.completedAt) },
                { label: "Generated", value: formatDate(new Date()) },
              ]}
            />
          </DetailCard>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <DetailCard title="Assets">
            <div className="space-y-3">
              {workOrder.assets.map((link) => (
                <div key={link.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <p className="text-sm font-medium">{link.asset.assetId} - {link.asset.description}</p>
                  <p className="mt-1 text-xs text-[#64707a]">{[link.asset.manufacturer, link.asset.model, link.asset.serialNumber].filter(Boolean).join(" / ")}</p>
                </div>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Standards">
            <div className="space-y-3">
              {workOrder.standards.map((link) => (
                <div key={link.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <p className="text-sm font-medium">{link.standard.standardId}</p>
                  <p className="mt-1 text-xs text-[#64707a]">{link.standard.description} - Cert {link.standard.certNumber ?? "n/a"}</p>
                </div>
              ))}
            </div>
          </DetailCard>
        </div>

        <div className="mt-4">
          <DetailCard title="Measurement data">
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Point</th>
                    <th>Nominal</th>
                    <th>As-found</th>
                    <th>As-left</th>
                    <th>Tolerance</th>
                    <th>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrder.records.map((record) => (
                    <tr key={record.id}>
                      <td>{record.label}</td>
                      <td>{record.nominalValue ?? "n/a"} {record.units ?? ""}</td>
                      <td>{record.asFoundValue ?? record.asFound ?? "n/a"}</td>
                      <td>{record.asLeftValue ?? record.asLeft ?? "n/a"}</td>
                      <td>{record.toleranceLow ?? "n/a"} to {record.toleranceHigh ?? "n/a"} {record.units ?? ""}</td>
                      <td><StatusBadge label={sentenceCase(record.decision)} tone={record.decision === "FAIL" ? "danger" : record.decision === "ADJUSTED_PASS" ? "warning" : "success"} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DetailCard>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <DetailCard title="Uncertainty">
            <p className="text-sm leading-6 text-[#64707a]">{workOrder.uncertaintyNotes ?? "Uncertainty placeholder."}</p>
          </DetailCard>
          <DetailCard title="Export history">
            <div className="space-y-3">
              {workOrder.packageExports.map((entry) => (
                <div key={entry.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <p className="text-sm font-medium">{entry.title}</p>
                  <p className="mt-1 text-xs text-[#64707a]">{sentenceCase(entry.packageType)} - {formatDateTime(entry.createdAt)}</p>
                </div>
              ))}
            </div>
          </DetailCard>
        </div>
      </section>
    </div>
  );
}

