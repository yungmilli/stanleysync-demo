import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";

import { Breadcrumbs, DetailCard, KeyValueGrid, StatusBadge, SummaryStat, Timeline } from "@/components/admin/ops-ui";
import { SafeEditForm } from "@/components/admin/safe-edit-form";
import { addTicketCommentAction, createInvoiceFromTicketAction, updateTicketAction } from "@/features/admin/actions";
import { requireRoles } from "@/features/admin/guards";
import { getAssignableUsers, getTicketDetail } from "@/features/ops/queries";
import { getWorkspaceSwitcherData } from "@/features/workspaces/queries";
import { formatCurrency, formatDateTime, formatPercent, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireRoles([UserRole.ADMIN, UserRole.MANAGER, UserRole.DEMO_USER]);
  const { id } = await params;
  const workspaceState = await getWorkspaceSwitcherData(user.id);
  const [ticket, assignableUsers] = await Promise.all([getTicketDetail(id, workspaceState.activeWorkspace?.id), getAssignableUsers()]);

  if (!ticket) notFound();

  return (
    <div className="space-y-4">
      <Breadcrumbs
        backHref="/admin/tickets"
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Tickets", href: "/admin/tickets" },
          { label: ticket.ticketNumber },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-4">
          <DetailCard title={`${ticket.ticketNumber} • ${ticket.customer.company}`}>
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusBadge label={sentenceCase(ticket.status)} tone="neutral" />
              <StatusBadge
                label={sentenceCase(ticket.priority)}
                tone={ticket.priority === "HIGH" || ticket.priority === "URGENT" ? "warning" : "neutral"}
              />
              <StatusBadge label={sentenceCase(ticket.type)} tone="info" />
            </div>
            <a
              href={`/api/tickets/${ticket.id}/pdf`}
              className="mb-4 inline-flex rounded-full border border-[#12212c]/10 px-3 py-1.5 text-sm font-medium"
            >
              Download Work Order PDF
            </a>
            {ticket.status === "COMPLETED" || ticket.status === "INVOICED" ? (
              <form action={createInvoiceFromTicketAction} className="mb-4 inline-flex">
                <input type="hidden" name="ticketId" value={ticket.id} />
                <button type="submit" className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-sm font-medium">
                  Create Invoice
                </button>
              </form>
            ) : null}
            <KeyValueGrid
              items={[
                { label: "Customer", value: `${ticket.customer.company} • ${ticket.customer.mainContact}` },
                { label: "Linked quote", value: ticket.quote?.quoteNumber ?? "No linked quote" },
                { label: "Assignee", value: ticket.assignedTo ?? "Unassigned" },
                { label: "Due date", value: ticket.dueDate ? formatDateTime(ticket.dueDate) : "Not set" },
                { label: "Estimated hours", value: ticket.estimatedHours ?? "Not set" },
                { label: "Actual hours", value: ticket.actualHours ?? "Not set" },
                { label: "Quoted amount", value: formatCurrency(ticket.quotedAmount) },
                { label: "Billed amount", value: formatCurrency(ticket.billedAmount) },
                { label: "Total cost", value: formatCurrency(ticket.totalCost) },
                { label: "Profit / loss", value: formatCurrency(ticket.profitLoss) },
                { label: "Margin", value: formatPercent(ticket.marginPercent) },
                { label: "Last updated", value: formatDateTime(ticket.updatedAt) },
              ]}
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <SummaryStat label="Quoted" value={ticket.quotedAmount} kind="currency" />
              <SummaryStat label="Billed" value={ticket.billedAmount} kind="currency" />
              <SummaryStat label="Cost" value={ticket.totalCost} kind="currency" />
              <SummaryStat label="Margin" value={ticket.marginPercent} kind="percent" />
            </div>
            <div className="mt-4 rounded-[0.95rem] border border-[#12212c]/8 bg-white/55 p-3.5">
              <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">Notes</p>
              <p className="mt-2 text-sm leading-6 text-[#64707a]">{ticket.notes ?? "No notes added yet."}</p>
            </div>
          </DetailCard>

          <DetailCard title="Activity history">
            <Timeline items={ticket.activities} />
          </DetailCard>
        </div>

        <div className="space-y-4">
          <DetailCard title="Update ticket">
            <SafeEditForm action={updateTicketAction}>
              <input type="hidden" name="ticketId" value={ticket.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Status</span>
                  <select name="status" defaultValue={ticket.status} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3">
                    <option value="NEW">New</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="WAITING_ON_CUSTOMER">Waiting on customer</option>
                    <option value="WAITING_ON_PARTS">Waiting on parts</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="INVOICE_PENDING">Invoice pending</option>
                    <option value="INVOICED">Invoiced</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Priority</span>
                  <select name="priority" defaultValue={ticket.priority} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3">
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Type</span>
                  <select name="type" defaultValue={ticket.type} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3">
                    <option value="CALIBRATION">Calibration</option>
                    <option value="REPAIR">Repair</option>
                    <option value="FIELD_SERVICE">Field service</option>
                    <option value="CUSTOM_SERVICE">Custom service</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Assignee</span>
                  <select name="assignedUserId" defaultValue={ticket.assignedUserId ?? ""} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3">
                    <option value="">Unassigned</option>
                    {assignableUsers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} · {sentenceCase(member.role)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Due date</span>
                  <input type="date" name="dueDate" defaultValue={ticket.dueDate ? ticket.dueDate.toISOString().slice(0, 10) : ""} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
                </label>
                <label className="mt-7 flex items-center gap-2 text-sm text-[#64707a]">
                  <input type="checkbox" name="sendAssignmentEmail" />
                  Send assignment update email
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field name="estimatedHours" label="Estimated hours" defaultValue={ticket.estimatedHours ?? ""} />
                <Field name="actualHours" label="Actual hours" defaultValue={ticket.actualHours ?? ""} />
                <Field name="laborRate" label="Labor rate" defaultValue={ticket.laborRate ?? ""} />
                <Field name="materialsCost" label="Materials cost" defaultValue={ticket.materialsCost ?? ""} />
                <Field name="shippingCost" label="Shipping cost" defaultValue={ticket.shippingCost ?? ""} />
                <Field name="quotedAmount" label="Quoted amount" defaultValue={ticket.quotedAmount ?? ""} />
                <Field name="billedAmount" label="Billed amount" defaultValue={ticket.billedAmount ?? ""} />
              </div>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Notes</span>
                <textarea name="notes" defaultValue={ticket.notes ?? ""} className="min-h-28 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3" />
              </label>
            </SafeEditForm>
          </DetailCard>

          <DetailCard title="Work comments">
            <form action={addTicketCommentAction} className="space-y-3">
              <input type="hidden" name="ticketId" value={ticket.id} />
              <textarea
                name="body"
                placeholder="Add a work update, blocker, or technician note."
                className="min-h-24 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3"
              />
              <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">
                Add comment
              </button>
            </form>
            <div className="mt-4 space-y-3">
              {ticket.comments.length === 0 ? (
                <p className="text-sm text-[#64707a]">No work comments yet.</p>
              ) : (
                ticket.comments.map((comment) => (
                  <div key={comment.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                    <p className="text-sm leading-6">{comment.body}</p>
                    <p className="mt-1 text-xs text-[#64707a]">
                      {comment.author.name} · {formatDateTime(comment.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </DetailCard>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string | number;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">{label}</span>
      <input name={name} defaultValue={defaultValue} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
    </label>
  );
}
