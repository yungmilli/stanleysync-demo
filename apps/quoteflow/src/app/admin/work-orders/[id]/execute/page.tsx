import Link from "next/link";
import { notFound } from "next/navigation";
import { CalibrationWorkOrderStatus } from "@prisma/client";

import { Breadcrumbs, DetailCard, KeyValueGrid, StatusBadge } from "@/components/admin/ops-ui";
import { requireCalOpsAccess } from "@/features/admin/guards";
import { addCalibrationActivityNoteAction, addCalibrationRecordAction, updateCalibrationWorkOrderAction } from "@/features/calops/actions";
import { getCalibrationWorkOrderDetail } from "@/features/calops/queries";
import { formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminWorkOrderExecutePage({
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
      <Breadcrumbs
        backHref={`/admin/work-orders/${workOrder.id}`}
        items={[
          { label: "Work Orders", href: "/admin/work-orders" },
          { label: workOrder.woNumber, href: `/admin/work-orders/${workOrder.id}` },
          { label: "Execute" },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          <DetailCard title="Execution summary">
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusBadge label={sentenceCase(workOrder.status)} tone="neutral" />
              <StatusBadge label={sentenceCase(workOrder.priority)} tone={workOrder.priority === "HIGH" || workOrder.priority === "URGENT" ? "warning" : "neutral"} />
            </div>
            <KeyValueGrid
              items={[
                { label: "Customer", value: workOrder.customer.company },
                { label: "Lab", value: workOrder.lab?.name ?? "Default lab" },
                { label: "Procedure", value: workOrder.procedure ? `${workOrder.procedure.procedureNumber} - ${workOrder.procedure.title}` : "Unassigned" },
                { label: "Technician", value: workOrder.assignedTechnician ?? "Unassigned" },
                { label: "Due", value: workOrder.dueDate ? formatDateTime(workOrder.dueDate) : "Not set" },
                { label: "Assets", value: workOrder.assets.map((link) => link.asset.assetId).join(", ") || "None" },
              ]}
            />
          </DetailCard>

          <DetailCard title="As-found / as-left readings">
            <div className="space-y-3">
              {workOrder.records.map((record) => (
                <div key={record.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{record.label}</p>
                    <StatusBadge
                      label={sentenceCase(record.decision)}
                      tone={record.decision === "FAIL" ? "danger" : record.decision === "ADJUSTED_PASS" ? "warning" : "success"}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#64707a]">
                    Nominal {record.nominalValue ?? "n/a"} {record.units ?? ""} | As-found {record.asFoundValue ?? record.asFound ?? "n/a"} | As-left {record.asLeftValue ?? record.asLeft ?? "n/a"}
                  </p>
                  <p className="text-xs text-[#64707a]">
                    Tolerance {record.toleranceLow ?? "n/a"} to {record.toleranceHigh ?? "n/a"} {record.units ?? ""} | {record.result ?? "Pending"}
                  </p>
                </div>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Standards used">
            <div className="space-y-3">
              {workOrder.standards.map((link) => (
                <div key={link.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <p className="text-sm font-medium">{link.standard.standardId}</p>
                  <p className="mt-1 text-xs text-[#64707a]">{link.standard.description} - {link.standard.uncertainty ?? "No uncertainty listed"}</p>
                </div>
              ))}
            </div>
          </DetailCard>
        </div>

        <div className="space-y-4">
          <DetailCard title="Enter measurement point">
            <form action={addCalibrationRecordAction} className="space-y-3">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <Field name="label" label="Point / label" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="nominalValue" label="Nominal" />
                <Field name="units" label="Units" />
                <Field name="asFoundValue" label="As-found value" />
                <Field name="asLeftValue" label="As-left value" />
                <Field name="toleranceLow" label="Tolerance low" />
                <Field name="toleranceHigh" label="Tolerance high" />
              </div>
              <TextArea name="notes" label="Notes" />
              <button type="submit" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">
                Add and evaluate
              </button>
            </form>
          </DetailCard>

          <DetailCard title="Status and uncertainty">
            <form action={updateCalibrationWorkOrderAction} className="space-y-3">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <input type="hidden" name="priority" value={workOrder.priority} />
              <input type="hidden" name="serviceType" value={workOrder.serviceType} />
              <input type="hidden" name="assignedUserId" value={workOrder.assignedUserId ?? ""} />
              <input type="hidden" name="dueDate" value={workOrder.dueDate ? workOrder.dueDate.toISOString().slice(0, 10) : ""} />
              <label className="text-sm">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Status</span>
                <select name="status" defaultValue={workOrder.status} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3">
                  {Object.values(CalibrationWorkOrderStatus).map((status) => (
                    <option key={status} value={status}>{sentenceCase(status)}</option>
                  ))}
                </select>
              </label>
              <input type="hidden" name="intakeNotes" value={workOrder.intakeNotes ?? ""} />
              <input type="hidden" name="calibrationData" value={workOrder.calibrationData ?? ""} />
              <input type="hidden" name="certificateNotes" value={workOrder.certificateNotes ?? ""} />
              <TextArea name="uncertaintyNotes" label="Uncertainty placeholder" defaultValue={workOrder.uncertaintyNotes ?? ""} />
              <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">Save execution status</button>
            </form>
          </DetailCard>

          <DetailCard title="Team note">
            <form action={addCalibrationActivityNoteAction} className="space-y-3">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <textarea name="body" className="min-h-24 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3" placeholder="Add execution note, blocker, or reviewer instruction." />
              <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">Add note</button>
            </form>
          </DetailCard>

          <Link href={`/admin/work-orders/${workOrder.id}/package`} className="block rounded-[0.95rem] border border-[#12212c]/10 bg-white/60 p-3 text-sm font-medium">
            Open branded work order package
          </Link>
        </div>
      </section>
    </div>
  );
}

function Field({ name, label }: { name: string; label: string }) {
  return (
    <label className="text-sm">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">{label}</span>
      <input name={name} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
    </label>
  );
}

function TextArea({ name, label, defaultValue = "" }: { name: string; label: string; defaultValue?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">{label}</span>
      <textarea name={name} defaultValue={defaultValue} className="min-h-24 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3" />
    </label>
  );
}

