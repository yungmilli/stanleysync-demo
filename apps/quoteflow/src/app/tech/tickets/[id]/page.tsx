import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";

import { Breadcrumbs, DetailCard, KeyValueGrid, StatusBadge, Timeline } from "@/components/admin/ops-ui";
import { addTicketCommentAction, updateTechnicianTicketAction } from "@/features/admin/actions";
import { requireRoles } from "@/features/admin/guards";
import { getTechnicianTicketDetail } from "@/features/ops/queries";
import { formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TechnicianTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireRoles([UserRole.TECHNICIAN]);
  const { id } = await params;
  const ticket = await getTechnicianTicketDetail(id, user.id);

  if (!ticket) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Breadcrumbs
        backHref="/tech"
        items={[
          { label: "Tech dashboard", href: "/tech" },
          { label: ticket.ticketNumber },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-4">
          <DetailCard title={`${ticket.ticketNumber} · ${ticket.customer.company}`}>
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusBadge label={sentenceCase(ticket.status)} tone="neutral" />
              <StatusBadge label={sentenceCase(ticket.priority)} tone="info" />
              <StatusBadge label={sentenceCase(ticket.type)} tone="info" />
            </div>
            <KeyValueGrid
              items={[
                { label: "Customer", value: `${ticket.customer.company} · ${ticket.customer.mainContact}` },
                { label: "Linked quote", value: ticket.quote?.quoteNumber ?? "No linked quote" },
                { label: "Due date", value: ticket.dueDate ? formatDateTime(ticket.dueDate) : "Not set" },
                { label: "Estimated hours", value: ticket.estimatedHours ?? "Not set" },
                { label: "Actual hours", value: ticket.actualHours ?? "Not set" },
                { label: "Last updated", value: formatDateTime(ticket.updatedAt) },
              ]}
            />
            <div className="mt-4 rounded-[0.95rem] border border-[#12212c]/8 bg-white/55 p-3.5">
              <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">Work notes</p>
              <p className="mt-2 text-sm leading-6 text-[#64707a]">{ticket.notes ?? "No notes added yet."}</p>
            </div>
          </DetailCard>

          <DetailCard title="Work comments">
            <form action={addTicketCommentAction} className="space-y-3">
              <input type="hidden" name="ticketId" value={ticket.id} />
              <textarea
                name="body"
                placeholder="Add a technician update, blocker, or completion note."
                className="min-h-24 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-3"
              />
              <button type="submit" className="rounded-full border border-[#12212c]/10 px-4 py-2 text-sm font-medium">
                Add work update
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

        <div className="space-y-4">
          <DetailCard title="Update assigned job">
            <form action={updateTechnicianTicketAction} className="space-y-3">
              <input type="hidden" name="ticketId" value={ticket.id} />
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
                  <option value="CLOSED">Closed</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Due date</span>
                <input
                  type="date"
                  name="dueDate"
                  defaultValue={ticket.dueDate ? ticket.dueDate.toISOString().slice(0, 10) : ""}
                  className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3"
                />
              </label>
              <button type="submit" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">
                Save update
              </button>
            </form>
          </DetailCard>

          <DetailCard title="Activity history">
            <Timeline items={ticket.activities} />
          </DetailCard>
        </div>
      </div>
    </div>
  );
}
