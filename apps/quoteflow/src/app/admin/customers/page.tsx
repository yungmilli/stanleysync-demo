import { AdminSection, EmptyState } from "@/components/admin/ops-ui";
import { requireRoles } from "@/features/admin/guards";
import { UserRole } from "@prisma/client";
import { getCustomersList } from "@/features/ops/queries";
import { getWorkspaceSwitcherData } from "@/features/workspaces/queries";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireRoles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.DEMO_USER]);
  const workspaceState = await getWorkspaceSwitcherData(user.id);
  const customers = await getCustomersList(await searchParams, workspaceState.activeWorkspace?.id);

  return (
    <div className="space-y-4">
      <AdminSection
        title="Customers"
        description="Customer records centralize contact details, recent quotes, open work orders, and account notes."
      />

      {customers.length === 0 ? (
        <EmptyState title="No customers yet" body="Customer records are created when quote requests are submitted." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {customers.map((customer) => (
            <section key={customer.id} className="app-panel rounded-[1rem] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold">{customer.company}</h2>
                  <p className="mt-1 text-sm text-[#64707a]">
                    {customer.mainContact} • {customer.email}
                  </p>
                  <p className="mt-1 text-sm text-[#64707a]">{customer.phone ?? "No phone on file"}</p>
                </div>
                <div className="text-right text-xs text-[#64707a]">
                  <p>{customer.quotes.length} quotes</p>
                  <p>{customer.tickets.length} tickets</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">Recent quotes</p>
                  <div className="mt-2 space-y-2">
                    {customer.quotes.map((quote) => (
                      <div key={quote.id} className="text-sm text-[#64707a]">
                        <span className="font-medium text-[#12212c]">{quote.quoteNumber}</span> • {formatDateTime(quote.createdAt)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">Recent tickets</p>
                  <div className="mt-2 space-y-2">
                    {customer.tickets.map((ticket) => (
                      <div key={ticket.id} className="text-sm text-[#64707a]">
                        <span className="font-medium text-[#12212c]">{ticket.ticketNumber}</span> • {ticket.status}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
