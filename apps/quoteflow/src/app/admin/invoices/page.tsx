import Link from "next/link";

import { Breadcrumbs, DetailCard, EmptyState, StatusBadge } from "@/components/admin/ops-ui";
import { requireQuoteAccess } from "@/features/admin/guards";
import { getInvoicesList } from "@/features/ops/queries";
import { getWorkspaceSwitcherData } from "@/features/workspaces/queries";
import { formatCurrency, formatDate, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const { user } = await requireQuoteAccess();
  const workspaceState = await getWorkspaceSwitcherData(user.id);
  const invoices = await getInvoicesList(workspaceState.activeWorkspace?.id);
  const totals = invoices.reduce(
    (accumulator, invoice) => {
      accumulator.open += invoice.status === "PAID" || invoice.status === "VOID" ? 0 : invoice.total;
      accumulator.paid += invoice.status === "PAID" ? invoice.total : 0;
      return accumulator;
    },
    { open: 0, paid: 0 },
  );

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Invoices" }]} />
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Total invoices" value={String(invoices.length)} />
        <Metric label="Open balance" value={formatCurrency(totals.open)} />
        <Metric label="Paid revenue" value={formatCurrency(totals.paid)} />
      </div>
      <DetailCard title="Invoices">
        {invoices.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            body="Finalize a quote or complete a job, then create an invoice from the source record."
          />
        ) : (
          <div className="overflow-hidden rounded-[1rem] border border-[#12212c]/8">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-white/65 text-left text-xs uppercase tracking-[0.1em] text-[#64707a]">
                <tr>
                  <th className="px-3 py-2">Invoice</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Due</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-[#12212c]/8 bg-white/40">
                    <td className="px-3 py-3 font-medium">
                      <Link href={`/admin/invoices/${invoice.id}`} className="text-[#9e4f18]">
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{invoice.customer.company}</td>
                    <td className="px-3 py-3 text-[#64707a]">
                      {invoice.quote?.quoteNumber ?? invoice.ticket?.ticketNumber ?? invoice.calibrationWorkOrder?.woNumber ?? "Manual"}
                    </td>
                    <td className="px-3 py-3">{formatDate(invoice.dueDate)}</td>
                    <td className="px-3 py-3">
                      <StatusBadge label={sentenceCase(invoice.status)} tone={invoice.status === "PAID" ? "success" : "neutral"} />
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">{formatCurrency(invoice.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DetailCard>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-panel rounded-[1rem] p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-[#64707a]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
