import { notFound } from "next/navigation";
import { CalibrationWorkOrderStatus, UserRole } from "@prisma/client";

import { Breadcrumbs, DetailCard, KeyValueGrid, StatusBadge, Timeline } from "@/components/admin/ops-ui";
import { requireRoles } from "@/features/admin/guards";
import { addCalibrationActivityNoteAction, addCalibrationFindingAction, addCalibrationRecordAction, updateTechnicianCalibrationWorkOrderAction } from "@/features/calops/actions";
import { getTechnicianCalibrationWorkOrderDetail } from "@/features/calops/queries";
import { formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TechnicianCalibrationWorkOrderPage({
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
        backHref="/tech"
        items={[
          { label: "Tech dashboard", href: "/tech" },
          { label: workOrder.woNumber },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <DetailCard title={`${workOrder.woNumber} - ${workOrder.customer.company}`}>
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusBadge label={sentenceCase(workOrder.status)} tone="neutral" />
              <StatusBadge label={sentenceCase(workOrder.priority)} tone={workOrder.priority === "HIGH" || workOrder.priority === "URGENT" ? "warning" : "info"} />
              <StatusBadge label={sentenceCase(workOrder.serviceType)} tone="info" />
            </div>
            <KeyValueGrid
              items={[
                { label: "Customer", value: `${workOrder.customer.company} - ${workOrder.customer.mainContact}` },
                { label: "Due date", value: workOrder.dueDate ? formatDateTime(workOrder.dueDate) : "Not set" },
                { label: "Procedure", value: workOrder.procedure ? `${workOrder.procedure.procedureNumber} - ${workOrder.procedure.title}` : "Unassigned" },
                { label: "Assets", value: workOrder.assets.map((link) => link.asset.assetId).join(", ") || "None" },
                { label: "Standards", value: workOrder.standards.map((link) => link.standard.standardId).join(", ") || "None" },
                { label: "Last updated", value: formatDateTime(workOrder.updatedAt) },
              ]}
            />
          </DetailCard>

          <a href={`/tech/work-orders/${workOrder.id}/execute`} className="block rounded-[0.95rem] border border-[#12212c]/10 bg-white/60 p-3 text-sm font-medium">
            Open execution screen
          </a>

          <DetailCard title="Intake">
            <p className="text-sm leading-6 text-[#64707a]">{workOrder.intakeNotes ?? "No intake notes yet."}</p>
          </DetailCard>

          <DetailCard title="Calibration data">
            <p className="mb-3 text-sm leading-6 text-[#64707a]">{workOrder.calibrationData ?? "Enter summary data in the update panel."}</p>
            <div className="space-y-3">
              {workOrder.records.map((record) => (
                <div key={record.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{record.label}</p>
                    <StatusBadge label={record.result ?? "Pending"} tone={record.result?.toLowerCase().includes("fail") ? "danger" : "neutral"} />
                  </div>
                  <p className="mt-1 text-xs text-[#64707a]">As-found: {record.asFound ?? "n/a"} | As-left: {record.asLeft ?? "n/a"} | Tol: {record.tolerance ?? "n/a"}</p>
                </div>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Standards used">
            <div className="space-y-3">
              {workOrder.standards.map((link) => (
                <div key={link.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <p className="text-sm font-medium">{link.standard.standardId}</p>
                  <p className="mt-1 text-xs text-[#64707a]">{link.standard.description}</p>
                </div>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Findings">
            <div className="space-y-3">
              {workOrder.findings.length === 0 ? <p className="text-sm text-[#64707a]">No findings entered.</p> : null}
              {workOrder.findings.map((finding) => (
                <div key={finding.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <p className="text-sm font-medium">{finding.findingType}</p>
                  <p className="mt-2 text-sm leading-6 text-[#64707a]">{finding.description}</p>
                </div>
              ))}
            </div>
          </DetailCard>
        </div>

        <div className="space-y-4">
          <DetailCard title="Update calibration job">
            <form action={updateTechnicianCalibrationWorkOrderAction} className="space-y-3">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <label className="text-sm">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Status</span>
                <select name="status" defaultValue={workOrder.status} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3">
                  <option value={CalibrationWorkOrderStatus.RECEIVED}>Received</option>
                  <option value={CalibrationWorkOrderStatus.IN_PROCESS}>In process</option>
                  <option value={CalibrationWorkOrderStatus.CALIBRATION_COMPLETE}>Calibration complete</option>
                  <option value={CalibrationWorkOrderStatus.TECHNICAL_REVIEW}>Technical review</option>
                  <option value={CalibrationWorkOrderStatus.CERTIFICATE_READY}>Certificate ready</option>
                  <option value={CalibrationWorkOrderStatus.INVOICE_PENDING}>Invoice pending</option>
                </select>
              </label>
              <TextArea name="calibrationData" label="Calibration data summary" defaultValue={workOrder.calibrationData ?? ""} />
              <TextArea name="uncertaintyNotes" label="Uncertainty notes" defaultValue={workOrder.uncertaintyNotes ?? ""} />
              <TextArea name="certificateNotes" label="Certificate notes" defaultValue={workOrder.certificateNotes ?? ""} />
              <button type="submit" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">Save update</button>
            </form>
          </DetailCard>

          <DetailCard title="Enter data point">
            <form action={addCalibrationRecordAction} className="space-y-3">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <Field name="label" label="Point / label" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="asFound" label="As-found" />
                <Field name="asLeft" label="As-left" />
                <Field name="tolerance" label="Tolerance" />
                <Field name="result" label="Result" />
              </div>
              <TextArea name="notes" label="Notes" defaultValue="" />
              <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">Add data</button>
            </form>
          </DetailCard>

          <DetailCard title="Add finding">
            <form action={addCalibrationFindingAction} className="space-y-3">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="findingType" label="Finding type" />
                <Field name="severity" label="Severity" />
              </div>
              <TextArea name="description" label="Description" defaultValue="" />
              <TextArea name="correctiveAction" label="Corrective action" defaultValue="" />
              <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">Add finding</button>
            </form>
          </DetailCard>

          <DetailCard title="Add work note">
            <form action={addCalibrationActivityNoteAction} className="space-y-3">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <textarea name="body" placeholder="Add a technician note or blocker." className="min-h-24 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3" />
              <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">Add note</button>
            </form>
          </DetailCard>

          <DetailCard title="Activity history">
            <Timeline items={workOrder.activities.map((activity) => ({
              id: activity.id,
              title: activity.title,
              description: activity.description,
              createdAt: activity.createdAt,
              actor: activity.actor?.name,
            }))} />
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

function TextArea({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">{label}</span>
      <textarea name={name} defaultValue={defaultValue} className="min-h-24 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3" />
    </label>
  );
}
