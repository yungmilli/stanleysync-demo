import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";

import {
  addQuoteInternalNoteAction,
  createInvoiceFromQuoteAction,
  convertQuoteToTicketAction,
  convertQuoteToWebsiteProjectAction,
  convertQuoteToWorkOrderDraftAction,
  sendQuoteEmailAction,
  updateQuoteAction,
} from "@/features/admin/actions";
import { requireQuoteAccess } from "@/features/admin/guards";
import { convertQuoteToCalibrationWorkOrderAction } from "@/features/calops/actions";
import { getAssignableUsers, getQuoteDetail } from "@/features/ops/queries";
import { getWorkspaceSwitcherData } from "@/features/workspaces/queries";
import { Breadcrumbs, DetailCard, KeyValueGrid, StatusBadge, Timeline } from "@/components/admin/ops-ui";
import { QuoteReviewEditor } from "@/components/admin/quote-review-editor";
import { formatCurrency, formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireQuoteAccess();
  const { id } = await params;
  const workspaceState = await getWorkspaceSwitcherData(user.id);
  const [quote, assignableUsers] = await Promise.all([
    getQuoteDetail(id, workspaceState.activeWorkspace?.id),
    getAssignableUsers(),
  ]);

  if (!quote) {
    notFound();
  }

  const extractedFields = asRecord(quote.extractedFields);
  const structuredSummary = asRecord(quote.structuredSummary);
  const conversionPath = getSuggestedConversionPath(quote.serviceType, extractedFields);
  const isWebsiteRequest =
    conversionPath === "Website Builder project" ||
    Boolean(extractedFields.projectType || extractedFields.pagesNeeded || extractedFields.desiredFeatures);

  return (
    <div className="space-y-4">
      <Breadcrumbs
        backHref="/admin/quotes"
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Quotes", href: "/admin/quotes" },
          { label: quote.quoteNumber },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <DetailCard
            title={`${quote.quoteNumber} - ${quote.customer.company}`}
            action={
              quote.workOrderDraft ? (
                <a
                  href={`/api/work-order-drafts/${quote.workOrderDraft.id}/export`}
                  className="text-sm text-[#9e4f18]"
                >
                  Export work order draft JSON
                </a>
              ) : quote.ticket ? (
                <Link href={`/admin/tickets/${quote.ticket.id}`} className="text-sm text-[#9e4f18]">
                  Open linked ticket
                </Link>
              ) : null
            }
          >
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusBadge label={sentenceCase(quote.status)} tone="neutral" />
              <StatusBadge
                label={sentenceCase(quote.priority)}
                tone={quote.priority === "HIGH" || quote.priority === "URGENT" ? "warning" : "neutral"}
              />
              {quote.suggestedTicketType ? (
                <StatusBadge label={sentenceCase(quote.suggestedTicketType)} tone="info" />
              ) : null}
            </div>
            <KeyValueGrid
              items={[
                { label: "Contact", value: `${quote.customer.mainContact} - ${quote.customer.email}` },
                { label: "Phone", value: quote.customer.phone ?? "Not set" },
                { label: "Service type", value: sentenceCase(quote.serviceType) },
                { label: "Service mode", value: quote.serviceMode ? sentenceCase(quote.serviceMode) : "Not set" },
                { label: "Equipment", value: quote.equipmentType ?? "Not set" },
                { label: "Manufacturer", value: quote.manufacturer ?? "Not set" },
                { label: "Model / serial", value: `${quote.modelNumber ?? "n/a"} / ${quote.serialNumber ?? "n/a"}` },
                { label: "Range / units", value: `${quote.rangeOrCapacity ?? "n/a"} ${quote.units ?? ""}`.trim() },
                { label: "Requested turnaround", value: quote.requestedTurnaround ?? "Not set" },
                { label: "Quoted amount", value: quote.quotedAmount ? formatCurrency(quote.quotedAmount) : "Not set" },
                { label: "Assigned", value: quote.assignedTo ?? "Unassigned" },
                { label: "Submitted", value: formatDateTime(quote.submittedAt) },
              ]}
            />
            <div className="mt-4 rounded-[0.95rem] border border-[#12212c]/8 bg-white/55 p-3.5">
              <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">Structured summary</p>
              <p className="mt-2 text-sm leading-6 text-[#64707a]">{quote.aiSummary}</p>
            </div>
          </DetailCard>

          <DetailCard title="Guided intake summary">
            <div className="mb-3 rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
              <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">Suggested conversion path</p>
              <p className="mt-1 text-sm font-semibold text-[#12212c]">{conversionPath}</p>
            </div>
            <KeyValueGrid
              items={[
                { label: "Service request", value: valueText(extractedFields.serviceCategory) || sentenceCase(quote.serviceType) },
                { label: "Item / project", value: valueText(quote.equipmentType) || valueText(extractedFields.projectType) || "Not captured" },
                { label: "Problem / request", value: valueText(quote.issueDescription) || valueText(structuredSummary.problem) || "Not captured" },
                { label: "Location / service area", value: quote.customer.address ?? valueText(structuredSummary.location) ?? "Not captured" },
                {
                  label: "Vehicle",
                  value: [extractedFields.vehicleYear, extractedFields.vehicleMake, extractedFields.vehicleModel]
                    .map(valueText)
                    .filter(Boolean)
                    .join(" ") || "Not applicable",
                },
                { label: "Website pages", value: valueText(extractedFields.pagesNeeded) || "Not applicable" },
                { label: "Website features", value: valueText(extractedFields.desiredFeatures) || "Not applicable" },
                { label: "Budget / timeline", value: valueText(extractedFields.budgetTimeline) || "Not captured" },
                { label: "Documentation", value: quote.documentationRequirements ?? "Not captured" },
              ]}
            />
          </DetailCard>

          <DetailCard title="Original intake transcript">
            <div className="space-y-3">
              {((quote.transcript as Array<{ role: string; content: string }>) ?? []).map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={
                    message.role === "assistant"
                      ? "max-w-[85%] rounded-[0.95rem] bg-[#12212c] px-3.5 py-3 text-sm leading-6 text-white"
                      : "ml-auto max-w-[85%] rounded-[0.95rem] bg-[#efe3d3] px-3.5 py-3 text-sm leading-6"
                  }
                >
                  {message.content}
                </div>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Attachments">
            {quote.attachments.length === 0 ? (
              <p className="text-sm text-[#64707a]">No attachments were uploaded with this request.</p>
            ) : (
              <div className="space-y-2">
                {quote.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.filePath}
                    className="flex items-center justify-between rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 px-3.5 py-3 text-sm"
                  >
                    <span>{attachment.fileName}</span>
                    <span className="text-xs text-[#64707a]">{attachment.sizeBytes ?? 0} bytes</span>
                  </a>
                ))}
              </div>
            )}
          </DetailCard>
        </div>

        <div className="space-y-4">
          <DetailCard title="Review controls">
            <QuoteReviewEditor
              quote={{
                id: quote.id,
                status: quote.status,
                priority: quote.priority,
                serviceType: quote.serviceType,
                assignedUserId: quote.assignedUserId,
                requestedTurnaround: quote.requestedTurnaround,
                quotedAmount: quote.quotedAmount,
                adminNotes: quote.adminNotes,
                issueDescription: quote.issueDescription,
              }}
              assignableUsers={assignableUsers}
              conversionPath={conversionPath}
              action={updateQuoteAction}
            />
            <div className="hidden">
            <form action={updateQuoteAction} className="space-y-3">
              <input type="hidden" name="quoteId" value={quote.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Status</span>
                  <select
                    name="status"
                    defaultValue={quote.status}
                    className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3"
                  >
                    <option value="NEW">New</option>
                    <option value="REVIEWING">Reviewing</option>
                    <option value="NEEDS_MORE_INFO">Need More Info</option>
                    <option value="QUOTED">Quoted</option>
                    <option value="CONVERTED_TO_WORK_ORDER_DRAFT">Converted to Work Order Draft</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Priority</span>
                  <select
                    name="priority"
                    defaultValue={quote.priority}
                    className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Assigned person</span>
                <select
                  name="assignedUserId"
                  defaultValue={quote.assignedUserId ?? ""}
                  className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3"
                >
                  <option value="">Unassigned</option>
                  {assignableUsers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} · {sentenceCase(member.role)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Quoted amount</span>
                <input
                  name="quotedAmount"
                  defaultValue={quote.quotedAmount ?? ""}
                  className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Admin notes summary</span>
                <textarea
                  name="adminNotes"
                  defaultValue={quote.adminNotes ?? ""}
                  className="min-h-28 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3"
                />
              </label>
              <button type="submit" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">
                Save review
              </button>
            </form>
            </div>

            {!quote.workOrderDraft ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={`/api/quotes/${quote.id}/pdf`}
                  className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium"
                >
                  Export Quote PDF
                </a>
                <form action={convertQuoteToTicketAction}>
                  <input type="hidden" name="quoteId" value={quote.id} />
                  <button type="submit" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">
                    Convert to General Job
                  </button>
                </form>
                {user.role === UserRole.ADMIN && quote.serviceType === "CALIBRATION" ? (
                  <form action={convertQuoteToCalibrationWorkOrderAction}>
                    <input type="hidden" name="quoteId" value={quote.id} />
                    <button type="submit" className="rounded-full bg-[#c46a29] px-4 py-2 text-sm font-medium text-white">
                      Convert to Calibration Work Order
                    </button>
                  </form>
                ) : null}
                {isWebsiteRequest ? (
                  <form action={convertQuoteToWebsiteProjectAction}>
                    <input type="hidden" name="quoteId" value={quote.id} />
                    <button type="submit" className="rounded-full bg-[#2f6f67] px-4 py-2 text-sm font-medium text-white">
                      Convert to Website Project
                    </button>
                  </form>
                ) : null}
                <form action={convertQuoteToWorkOrderDraftAction}>
                  <input type="hidden" name="quoteId" value={quote.id} />
                  <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">
                    Export Draft Handoff
                  </button>
                </form>
                {quote.quotedAmount ? (
                  <form action={createInvoiceFromQuoteAction}>
                    <input type="hidden" name="quoteId" value={quote.id} />
                    <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">
                      Create Invoice
                    </button>
                  </form>
                ) : null}
                {user.role === UserRole.ADMIN && quote.serviceType === "CALIBRATION" ? (
                  <Link
                    href="/admin/integrations/calops"
                    className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium"
                  >
                    Export Calibration JSON
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="mt-3 rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{quote.workOrderDraft.draftNumber}</p>
                    <p className="mt-1 text-[#64707a]">
                      QuoteFlow handoff draft ready for work order export.
                    </p>
                  </div>
                  <StatusBadge label={sentenceCase(quote.workOrderDraft.status)} tone="info" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`/api/work-order-drafts/${quote.workOrderDraft.id}/export`}
                    className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium"
                  >
                    Export JSON
                  </a>
                  <Link
                    href={`/admin/work-order-drafts/${quote.workOrderDraft.id}/print`}
                    className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium"
                  >
                    Print / PDF
                  </Link>
                  <Link
                    href="/admin/integrations/calops"
                    className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium"
                  >
                    Open CalOps Integration
                  </Link>
                </div>
              </div>
            )}
          </DetailCard>

          <DetailCard title="Internal notes">
            <form action={addQuoteInternalNoteAction} className="space-y-3">
              <input type="hidden" name="quoteId" value={quote.id} />
              <textarea
                name="body"
                placeholder="Add an internal note for quoting, review, job conversion, or invoicing."
                className="min-h-24 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3"
              />
              <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">
                Add internal note
              </button>
            </form>
            <div className="mt-4 space-y-3">
              {quote.internalNotes.length === 0 ? (
                <p className="text-sm text-[#64707a]">No internal notes yet.</p>
              ) : (
                quote.internalNotes.map((note) => (
                  <div key={note.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                    <p className="text-sm leading-6">{note.body}</p>
                    <p className="mt-1 text-xs text-[#64707a]">
                      {note.author ?? "Admin"} - {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </DetailCard>

          <DetailCard title="Send customer email">
            <form action={sendQuoteEmailAction} className="space-y-3">
              <input type="hidden" name="quoteId" value={quote.id} />
              <input
                name="subject"
                placeholder="Subject"
                className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3"
              />
              <textarea
                name="message"
                placeholder="Message to the customer"
                className="min-h-28 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3"
              />
              <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">
                Send email
              </button>
            </form>
          </DetailCard>

          {quote.workOrderDraft ? (
            <DetailCard title="Work order draft handoff">
              <KeyValueGrid
                items={[
                  { label: "Draft number", value: quote.workOrderDraft.draftNumber },
                  { label: "Status", value: sentenceCase(quote.workOrderDraft.status) },
                  { label: "Service type", value: sentenceCase(quote.workOrderDraft.requestedServiceType) },
                  { label: "Calibration category", value: quote.workOrderDraft.calibrationCategory ?? "Not set" },
                  {
                    label: "Service mode",
                    value: quote.workOrderDraft.serviceMode
                      ? sentenceCase(quote.workOrderDraft.serviceMode)
                      : "Not set",
                  },
                  { label: "Turnaround", value: quote.workOrderDraft.requestedTurnaround ?? "Not set" },
                ]}
              />
              <div className="mt-4 space-y-2">
                <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">Export history</p>
                {quote.workOrderDraft.exportLogs.length === 0 ? (
                  <p className="text-sm text-[#64707a]">No exports logged yet.</p>
                ) : (
                  quote.workOrderDraft.exportLogs.map((log) => (
                    <div key={log.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{log.targetSystem}</p>
                        <StatusBadge label={sentenceCase(log.status)} tone="success" />
                      </div>
                      <p className="mt-1 text-sm text-[#64707a]">{log.message ?? "Export logged."}</p>
                      <p className="mt-1 text-xs text-[#64707a]">{formatDateTime(log.exportedAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </DetailCard>
          ) : null}

          <DetailCard title="Activity history">
            <Timeline items={quote.activities} />
          </DetailCard>
        </div>
      </div>
    </div>
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function valueText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getSuggestedConversionPath(serviceType: string, fields: Record<string, unknown>) {
  if (serviceType === "CALIBRATION") {
    return "CalOps calibration work order";
  }

  if (fields.projectType || fields.pagesNeeded || fields.desiredFeatures) {
    return "Website Builder project";
  }

  return "General WorkFlow job";
}
