import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";

import { Breadcrumbs, DetailCard, KeyValueGrid, StatusBadge, Timeline } from "@/components/admin/ops-ui";
import { CopyButton } from "@/components/admin/copy-button";
import { markInvoicePaidAction, markInvoiceSentAction, updateInvoicePaymentLinkAction, updateInvoiceStatusAction } from "@/features/admin/actions";
import { requireQuoteAccess } from "@/features/admin/guards";
import { getInvoiceDetail } from "@/features/ops/queries";
import { getWorkspaceSwitcherData } from "@/features/workspaces/queries";
import { formatCurrency, formatDate, formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireQuoteAccess();
  const { id } = await params;
  const workspaceState = await getWorkspaceSwitcherData(user.id);
  const invoice = await getInvoiceDetail(id, workspaceState.activeWorkspace?.id);
  const canManageInvoice = user.role === UserRole.SYSTEM_OWNER || user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;

  if (!invoice) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Breadcrumbs
        backHref="/admin/invoices"
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Invoices", href: "/admin/invoices" },
          { label: invoice.invoiceNumber },
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <DetailCard
            title={`${invoice.invoiceNumber} - ${invoice.customer.company}`}
            action={
              <a href={`/api/invoices/${invoice.id}/pdf`} className="inline-flex rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">
                Export Invoice PDF
              </a>
            }
          >
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusBadge label={sentenceCase(invoice.status)} tone={invoice.status === "PAID" ? "success" : "neutral"} />
              <StatusBadge label={`Due ${formatDate(invoice.dueDate)}`} tone="neutral" />
            </div>
            <KeyValueGrid
              items={[
                { label: "Bill to", value: `${invoice.customer.company} - ${invoice.customer.mainContact}` },
                { label: "Email", value: invoice.customer.email },
                { label: "Phone", value: invoice.customer.phone ?? "Not set" },
                { label: "Source quote", value: invoice.quote?.quoteNumber ?? "Not linked" },
                { label: "Source job", value: invoice.ticket?.ticketNumber ?? invoice.calibrationWorkOrder?.woNumber ?? "Not linked" },
                { label: "Created", value: formatDateTime(invoice.createdAt) },
              ]}
            />
          </DetailCard>

          <DetailCard title="Line items">
            <div className="overflow-hidden rounded-[1rem] border border-[#12212c]/8">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-white/65 text-left text-xs uppercase tracking-[0.1em] text-[#64707a]">
                  <tr>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Unit</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item) => (
                    <tr key={item.id} className="border-t border-[#12212c]/8 bg-white/40">
                      <td className="px-3 py-3">{item.description}</td>
                      <td className="px-3 py-3 text-right">{item.quantity}</td>
                      <td className="px-3 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-3 text-right font-semibold">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ml-auto mt-4 max-w-sm space-y-2 rounded-[1rem] border border-[#12212c]/8 bg-white/60 p-3 text-sm">
              <Row label="Subtotal" value={formatCurrency(invoice.subtotal)} />
              <Row label="Tax" value={formatCurrency(invoice.tax)} />
              <Row label="Discount" value={formatCurrency(invoice.discount)} />
              <Row label="Total" value={formatCurrency(invoice.total)} strong />
            </div>
          </DetailCard>

          <DetailCard title="Notes and payment">
            <p className="text-sm leading-6 text-[#64707a]">{invoice.notes ?? "No invoice notes."}</p>
            <p className="mt-3 text-sm leading-6 text-[#64707a]">
              {invoice.paymentInstructions ?? "Payment due within 30 days. Confirm ACH, card, or check details before sending."}
            </p>
            {invoice.paymentUrl ? (
              <div className="mt-3 rounded-[0.82rem] border border-[#12212c]/10 bg-white/70 p-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[#64707a]">Payment link</p>
                <p className="mt-1 break-all text-sm font-medium">{invoice.paymentUrl}</p>
                <div className="mt-3">
                  <CopyButton value={invoice.paymentUrl} />
                </div>
              </div>
            ) : null}
          </DetailCard>
        </div>

        <div className="space-y-4">
          <DetailCard title="Invoice controls">
            {canManageInvoice ? (
            <form action={updateInvoiceStatusAction} className="space-y-3">
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Status</span>
                <select
                  name="status"
                  defaultValue={invoice.status}
                  className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="PENDING_PAYMENT">Pending payment</option>
                  <option value="PAID">Paid</option>
                  <option value="ON_HOLD">On hold</option>
                  <option value="VOID">Void</option>
                </select>
              </label>
              <button type="submit" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">
                Save invoice status
              </button>
            </form>
            ) : (
              <p className="text-sm text-[#64707a]">Demo users can review invoice details and PDFs. Invoice controls are admin-only.</p>
            )}
            {canManageInvoice ? (
              <form action={updateInvoicePaymentLinkAction} className="mt-4 space-y-3 rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Payment provider</span>
                  <select name="paymentProvider" defaultValue={invoice.paymentProvider ?? "Manual Link"} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3">
                    <option value="Manual Link">Manual Link</option>
                    <option value="Stripe">Stripe</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Square">Square</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Payment URL</span>
                  <input name="paymentUrl" defaultValue={invoice.paymentUrl ?? ""} placeholder="https://pay.example.com/invoice/..." className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Payment status</span>
                  <select name="paymentStatus" defaultValue={normalizePaymentStatus(invoice.paymentStatus)} className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3">
                    <option value="NOT_SENT">Not Sent</option>
                    <option value="SENT">Sent</option>
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="FAILED">Failed</option>
                    <option value="VOIDED">Voided</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.1em] text-[#64707a]">Payment instructions</span>
                  <textarea name="paymentInstructions" defaultValue={invoice.paymentInstructions ?? ""} rows={3} className="w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white/70 px-3 py-2" />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">Save payment link</button>
                </div>
              </form>
            ) : null}
            {canManageInvoice ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {invoice.paymentUrl ? <CopyButton value={invoice.paymentUrl} /> : null}
                <form action={markInvoiceSentAction}>
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <button type="submit" className="rounded-full border border-[#12212c]/10 bg-white/70 px-4 py-2 text-sm font-medium">Mark as sent</button>
                </form>
                <form action={markInvoicePaidAction}>
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <button type="submit" className="rounded-full border border-[#12212c]/10 bg-white/70 px-4 py-2 text-sm font-medium">Mark as paid</button>
                </form>
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {invoice.quote ? <Link href={`/admin/quotes/${invoice.quote.id}`} className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium">Open quote</Link> : null}
              {invoice.ticket ? <Link href={`/admin/tickets/${invoice.ticket.id}`} className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium">Open job</Link> : null}
              {invoice.calibrationWorkOrder ? <Link href={`/admin/work-orders/${invoice.calibrationWorkOrder.id}`} className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium">Open CalOps WO</Link> : null}
            </div>
          </DetailCard>
          <DetailCard title="Activity">
            <Timeline items={invoice.activities} />
          </DetailCard>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "text-base font-semibold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function normalizePaymentStatus(status?: string | null) {
  if (!status || status === "UNPAID" || status === "LINK_READY") return "NOT_SENT";
  return status;
}
