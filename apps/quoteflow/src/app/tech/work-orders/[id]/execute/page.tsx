import { notFound } from "next/navigation";
import { CalibrationWorkOrderStatus, UserRole } from "@prisma/client";

import { Breadcrumbs, DetailCard, StatusBadge } from "@/components/admin/ops-ui";
import { requireRoles } from "@/features/admin/guards";
import { addCalibrationActivityNoteAction, addCalibrationRecordAction, updateTechnicianCalibrationWorkOrderAction } from "@/features/calops/actions";
import { getTechnicianCalibrationWorkOrderDetail } from "@/features/calops/queries";
import { sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TechWorkOrderExecutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireRoles([UserRole.TECHNICIAN]);
  const { id } = await params;
  const workOrder = await getTechnicianCalibrationWorkOrderDetail(id, user.id);

  if (!workOrder) notFound();

  return (
    <div className="space-y-4">
      <Breadcrumbs
        backHref={`/tech/work-orders/${workOrder.id}`}
        items={[
          { label: "Tech dashboard", href: "/tech" },
          { label: workOrder.woNumber, href: `/tech/work-orders/${workOrder.id}` },
          { label: "Execute" },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <DetailCard title="Measurement queue">
          <div className="space-y-3">
            {workOrder.records.map((record) => (
              <div key={record.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{record.label}</p>
                  <StatusBadge label={sentenceCase(record.decision)} tone={record.decision === "FAIL" ? "danger" : record.decision === "ADJUSTED_PASS" ? "warning" : "success"} />
                </div>
                <p className="mt-2 text-xs text-[#64707a]">
                  As-found {record.asFoundValue ?? record.asFound ?? "n/a"} | As-left {record.asLeftValue ?? record.asLeft ?? "n/a"} | Tol {record.toleranceLow ?? "n/a"} to {record.toleranceHigh ?? "n/a"} {record.units ?? ""}
                </p>
              </div>
            ))}
          </div>
        </DetailCard>

        <div className="space-y-4">
          <DetailCard title="Enter as-found / as-left">
            <form action={addCalibrationRecordAction} className="space-y-3">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <Field name="label" label="Point / label" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="nominalValue" label="Nominal" />
                <Field name="units" label="Units" />
                <Field name="asFoundValue" label="As-found" />
                <Field name="asLeftValue" label="As-left" />
                <Field name="toleranceLow" label="Tolerance low" />
                <Field name="toleranceHigh" label="Tolerance high" />
              </div>
              <TextArea name="notes" label="Notes" />
              <button type="submit" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">Add and evaluate</button>
            </form>
          </DetailCard>

          <DetailCard title="Submit status">
            <form action={updateTechnicianCalibrationWorkOrderAction} className="space-y-3">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <label className="text-sm">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Status</span>
                <select name="status" defaultValue={workOrder.status} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3">
                  <option value={CalibrationWorkOrderStatus.IN_PROCESS}>In process</option>
                  <option value={CalibrationWorkOrderStatus.CALIBRATION_COMPLETE}>Calibration complete</option>
                  <option value={CalibrationWorkOrderStatus.TECHNICAL_REVIEW}>Submit for technical review</option>
                </select>
              </label>
              <TextArea name="calibrationData" label="Calibration data summary" defaultValue={workOrder.calibrationData ?? ""} />
              <TextArea name="uncertaintyNotes" label="Uncertainty notes" defaultValue={workOrder.uncertaintyNotes ?? ""} />
              <TextArea name="certificateNotes" label="Certificate notes" defaultValue={workOrder.certificateNotes ?? ""} />
              <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">Save status</button>
            </form>
          </DetailCard>

          <DetailCard title="Team comment">
            <form action={addCalibrationActivityNoteAction} className="space-y-3">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <textarea name="body" className="min-h-24 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3" placeholder="Add a technician note or blocker." />
              <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">Add note</button>
            </form>
          </DetailCard>
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
