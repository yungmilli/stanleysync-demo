import Link from "next/link";
import { notFound } from "next/navigation";
import { CalibrationWorkOrderStatus, CalServiceType, Priority, UserRole } from "@prisma/client";

import { Breadcrumbs, DetailCard, KeyValueGrid, StatusBadge, Timeline } from "@/components/admin/ops-ui";
import { createInvoiceFromCalibrationWorkOrderAction } from "@/features/admin/actions";
import { requireCalOpsAccess } from "@/features/admin/guards";
import { getAssignableUsers } from "@/features/ops/queries";
import { addCalibrationActivityNoteAction, addCalibrationFindingAction, addCalibrationRecordAction, generateCertificateDraftAction, updateCalibrationWorkOrderAction } from "@/features/calops/actions";
import { getCalibrationWorkOrderDetail } from "@/features/calops/queries";
import { formatCurrency, formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CalibrationWorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCalOpsAccess();
  const { id } = await params;
  const [workOrder, technicians] = await Promise.all([
    getCalibrationWorkOrderDetail(id),
    getAssignableUsers([UserRole.TECHNICIAN, UserRole.MANAGER]),
  ]);

  if (!workOrder) notFound();

  return (
    <div className="space-y-4">
      <Breadcrumbs
        backHref="/admin/work-orders"
        items={[
          { label: "CalOps", href: "/admin/calops" },
          { label: "Work Orders", href: "/admin/work-orders" },
          { label: workOrder.woNumber },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <DetailCard title={`${workOrder.woNumber} - ${workOrder.customer.company}`}>
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusBadge label={sentenceCase(workOrder.status)} tone="neutral" />
              <StatusBadge label={sentenceCase(workOrder.priority)} tone={workOrder.priority === "HIGH" || workOrder.priority === "URGENT" ? "warning" : "neutral"} />
              <StatusBadge label={sentenceCase(workOrder.serviceType)} tone="info" />
            </div>
            <KeyValueGrid
              items={[
                { label: "Customer", value: `${workOrder.customer.company} - ${workOrder.customer.mainContact}` },
                { label: "Assigned technician", value: workOrder.assignedTechnician ?? "Unassigned" },
                { label: "Due date", value: workOrder.dueDate ? formatDateTime(workOrder.dueDate) : "Not set" },
                { label: "Procedure", value: workOrder.procedure ? `${workOrder.procedure.procedureNumber} - ${workOrder.procedure.title}` : "Unassigned" },
                { label: "Assets", value: workOrder.assets.map((link) => link.asset.assetId).join(", ") || "None" },
                { label: "Revenue", value: formatCurrency(workOrder.revenueAmount) },
                { label: "Completed", value: workOrder.completedAt ? formatDateTime(workOrder.completedAt) : "Not complete" },
                { label: "Last updated", value: formatDateTime(workOrder.updatedAt) },
              ]}
            />
          </DetailCard>

          <Link href={`/admin/work-orders/${workOrder.id}/execute`} className="block rounded-[0.95rem] border border-[#12212c]/10 bg-white/60 p-3 text-sm font-medium">
            Open execution screen
          </Link>

          <a href={`/api/work-orders/${workOrder.id}/package-pdf`} className="block rounded-[0.95rem] border border-[#12212c]/10 bg-white/60 p-3 text-sm font-medium">
            Download branded work order PDF
          </a>

          <a href={`/api/calibration-work-orders/${workOrder.id}/export`} className="block rounded-[0.95rem] border border-[#12212c]/10 bg-white/60 p-3 text-sm font-medium">
            Export for Calibration Software
          </a>

          {workOrder.status === "CERTIFICATE_READY" || workOrder.status === "CLOSED" || workOrder.status === "INVOICED" ? (
            <form action={createInvoiceFromCalibrationWorkOrderAction}>
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <button type="submit" className="block w-full rounded-[0.95rem] border border-[#12212c]/10 bg-white/60 p-3 text-left text-sm font-medium">
                Create Invoice
              </button>
            </form>
          ) : null}

          <DetailCard title="Intake">
            <p className="text-sm leading-6 text-[#64707a]">{workOrder.intakeNotes ?? "No intake notes yet."}</p>
          </DetailCard>

          <DetailCard title="Calibration Data">
            <p className="mb-3 text-sm leading-6 text-[#64707a]">{workOrder.calibrationData ?? "Calibration data summary placeholder."}</p>
            <div className="space-y-3">
              {workOrder.records.map((record) => (
                <div key={record.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{record.label}</p>
                    <StatusBadge label={record.result ?? "Pending"} tone={record.result?.toLowerCase().includes("fail") ? "danger" : "neutral"} />
                  </div>
                  <p className="mt-1 text-xs text-[#64707a]">As-found: {record.asFound ?? "n/a"} | As-left: {record.asLeft ?? "n/a"} | Tol: {record.tolerance ?? "n/a"}</p>
                  {record.notes ? <p className="mt-2 text-sm leading-6 text-[#64707a]">{record.notes}</p> : null}
                </div>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Standards Used">
            <div className="space-y-3">
              {workOrder.standards.map((link) => (
                <Link key={link.id} href={`/admin/standards/${link.standard.id}`} className="block rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <p className="text-sm font-medium">{link.standard.standardId}</p>
                  <p className="mt-1 text-xs text-[#64707a]">{link.standard.description} - {link.usageNotes ?? "No usage notes"}</p>
                </Link>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Uncertainty">
            <p className="text-sm leading-6 text-[#64707a]">{workOrder.uncertaintyNotes ?? "Uncertainty statement placeholder."}</p>
          </DetailCard>

          <DetailCard title="Findings">
            <div className="space-y-3">
              {workOrder.findings.length === 0 ? <p className="text-sm text-[#64707a]">No findings entered.</p> : null}
              {workOrder.findings.map((finding) => (
                <div key={finding.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{finding.findingType}</p>
                    {finding.severity ? <StatusBadge label={finding.severity} tone="warning" /> : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#64707a]">{finding.description}</p>
                  {finding.correctiveAction ? <p className="mt-1 text-sm leading-6 text-[#64707a]">Action: {finding.correctiveAction}</p> : null}
                </div>
              ))}
            </div>
          </DetailCard>

          <DetailCard
            title="Certificate Draft"
            action={
              workOrder.certificateDraft ? (
                <Link href={`/admin/certificates/${workOrder.certificateDraft.id}`} className="text-sm text-[#9e4f18]">Open draft</Link>
              ) : (
                <form action={generateCertificateDraftAction}>
                  <input type="hidden" name="workOrderId" value={workOrder.id} />
                  <button type="submit" className="rounded-full bg-[#12212c] px-3 py-1.5 text-sm font-medium text-white">Generate draft</button>
                </form>
              )
            }
          >
            <p className="text-sm leading-6 text-[#64707a]">{workOrder.certificateNotes ?? "Certificate draft notes and package requirements will appear here."}</p>
          </DetailCard>

          <DetailCard title="Activity log">
            <Timeline items={workOrder.activities.map((activity) => ({
              id: activity.id,
              title: activity.title,
              description: activity.description,
              createdAt: activity.createdAt,
              actor: activity.actor?.name,
            }))} />
          </DetailCard>
        </div>

        <div className="space-y-4">
          <DetailCard title="Update work order">
            <form action={updateCalibrationWorkOrderAction} className="space-y-3">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Select name="status" label="Status" defaultValue={workOrder.status} values={Object.values(CalibrationWorkOrderStatus)} />
                <Select name="priority" label="Priority" defaultValue={workOrder.priority} values={Object.values(Priority)} />
                <Select name="serviceType" label="Service type" defaultValue={workOrder.serviceType} values={Object.values(CalServiceType)} />
                <label className="text-sm">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Technician</span>
                  <select name="assignedUserId" defaultValue={workOrder.assignedUserId ?? ""} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3">
                    <option value="">Unassigned</option>
                    {technicians.map((technician) => (
                      <option key={technician.id} value={technician.id}>{technician.name} - {sentenceCase(technician.role)}</option>
                    ))}
                  </select>
                </label>
                <Field name="dueDate" label="Due date" type="date" defaultValue={workOrder.dueDate ? workOrder.dueDate.toISOString().slice(0, 10) : ""} />
                <Field name="revenueAmount" label="Revenue amount" defaultValue={workOrder.revenueAmount ?? ""} />
              </div>
              <TextArea name="intakeNotes" label="Intake" defaultValue={workOrder.intakeNotes ?? ""} />
              <TextArea name="calibrationData" label="Calibration data" defaultValue={workOrder.calibrationData ?? ""} />
              <TextArea name="uncertaintyNotes" label="Uncertainty" defaultValue={workOrder.uncertaintyNotes ?? ""} />
              <TextArea name="certificateNotes" label="Certificate notes" defaultValue={workOrder.certificateNotes ?? ""} />
              <button type="submit" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">Save work order</button>
            </form>
          </DetailCard>

          <DetailCard title="Add calibration data">
            <form action={addCalibrationRecordAction} className="space-y-3">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <Field name="label" label="Point / label" defaultValue="" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="asFound" label="As-found" defaultValue="" />
                <Field name="asLeft" label="As-left" defaultValue="" />
                <Field name="tolerance" label="Tolerance" defaultValue="" />
                <Field name="result" label="Result" defaultValue="" />
              </div>
              <TextArea name="notes" label="Notes" defaultValue="" />
              <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">Add data point</button>
            </form>
          </DetailCard>

          <DetailCard title="Add finding">
            <form action={addCalibrationFindingAction} className="space-y-3">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="findingType" label="Finding type" defaultValue="" />
                <Field name="severity" label="Severity" defaultValue="" />
              </div>
              <TextArea name="description" label="Description" defaultValue="" />
              <TextArea name="correctiveAction" label="Corrective action" defaultValue="" />
              <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">Add finding</button>
            </form>
          </DetailCard>

          <DetailCard title="Add activity note">
            <form action={addCalibrationActivityNoteAction} className="space-y-3">
              <input type="hidden" name="workOrderId" value={workOrder.id} />
              <textarea name="body" className="min-h-24 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3" placeholder="Add a review note, blocker, or customer update." />
              <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">Add note</button>
            </form>
          </DetailCard>
        </div>
      </section>
    </div>
  );
}

function Select({
  name,
  label,
  defaultValue,
  values,
}: {
  name: string;
  label: string;
  defaultValue: string;
  values: string[];
}) {
  return (
    <label className="text-sm">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">{label}</span>
      <select name={name} defaultValue={defaultValue} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3">
        {values.map((value) => (
          <option key={value} value={value}>{sentenceCase(value)}</option>
        ))}
      </select>
    </label>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue: string | number;
  type?: string;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">{label}</span>
      <input type={type} name={name} defaultValue={defaultValue} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
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

