import { UserRole } from "@prisma/client";

import { SafeEditForm } from "@/components/admin/safe-edit-form";
import { AdminSection, EmptyState } from "@/components/admin/ops-ui";
import { updateCustomerRecordAction } from "@/features/admin/actions";
import { requireRoles } from "@/features/admin/guards";
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
  const customers = await getCustomersList(await searchParams, workspaceState.activeWorkspace?.id, user);
  const canEditCustomers = user.role !== UserRole.DEMO_USER || customers.length > 0;

  return (
    <div className="space-y-4">
      <AdminSection
        title="Customers"
        description="Customer records centralize account details, billing, shipping, recent quotes, open jobs, and internal notes."
      />

      {customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          body={user.role === UserRole.DEMO_USER ? "Your demo customer list starts blank. Submit a quote to create your first customer record." : "Customer records are created when quote requests are submitted."}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {customers.map((customer) => {
            const tags = Array.isArray(customer.tags) ? customer.tags.join(", ") : "";
            return (
              <section key={customer.id} className="app-panel rounded-[1rem] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold">{customer.company}</h2>
                    <p className="mt-1 text-sm text-[#64707a]">
                      {customer.mainContact} / {customer.email}
                    </p>
                    <p className="mt-1 text-sm text-[#64707a]">{customer.phone ?? "No phone on file"}</p>
                  </div>
                  <div className="text-right text-xs text-[#64707a]">
                    <p>{customer.quotes.length} quotes</p>
                    <p>{customer.tickets.length} jobs</p>
                    <p>{customer.accountStatus}</p>
                  </div>
                </div>

                {canEditCustomers ? (
                  <div className="mt-4 rounded-[0.95rem] border border-[#12212c]/8 bg-white/45 p-3">
                    <SafeEditForm
                      action={updateCustomerRecordAction}
                      editLabel="Edit customer"
                      saveLabel="Save customer"
                      startLocked
                      lockedMessage="Open edit mode before changing customer account details."
                    >
                      <input type="hidden" name="customerId" value={customer.id} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <TextInput name="company" label="Company" defaultValue={customer.company} />
                        <TextInput name="mainContact" label="Main contact" defaultValue={customer.mainContact} />
                        <TextInput name="email" label="Email" defaultValue={customer.email} type="email" />
                        <TextInput name="phone" label="Phone" defaultValue={customer.phone} />
                        <TextInput name="billingEmail" label="Billing email" defaultValue={customer.billingEmail} type="email" />
                        <TextInput name="billingPhone" label="Billing phone" defaultValue={customer.billingPhone} />
                        <TextInput name="industry" label="Industry" defaultValue={customer.industry} />
                        <TextInput name="paymentTerms" label="Payment terms" defaultValue={customer.paymentTerms} placeholder="Net 30" />
                        <label className="grid gap-1.5 text-sm">
                          Account status
                          <select name="accountStatus" defaultValue={customer.accountStatus} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3">
                            <option value="ACTIVE">Active</option>
                            <option value="ON_HOLD">On hold</option>
                            <option value="PROSPECT">Prospect</option>
                            <option value="INACTIVE">Inactive</option>
                          </select>
                        </label>
                        <label className="grid gap-1.5 text-sm">
                          Preferred contact
                          <select name="preferredContactMethod" defaultValue={customer.preferredContactMethod ?? ""} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3">
                            <option value="">Not set</option>
                            <option value="Email">Email</option>
                            <option value="Phone">Phone</option>
                            <option value="Text">Text</option>
                          </select>
                        </label>
                      </div>
                      <TextArea name="address" label="Main address" defaultValue={customer.address} />
                      <TextArea name="billingAddress" label="Billing address" defaultValue={customer.billingAddress} />
                      <TextArea name="shippingAddress" label="Default shipping address" defaultValue={customer.shippingAddress} />
                      <TextInput name="tags" label="Tags" defaultValue={tags} placeholder="VIP, service contract" />
                      <label className="inline-flex items-center gap-2 text-sm text-[#64707a]">
                        <input type="checkbox" name="taxExempt" defaultChecked={customer.taxExempt} className="h-4 w-4 rounded border-[#12212c]/20" />
                        Tax exempt customer
                      </label>
                      <TextArea name="notes" label="Customer-visible notes" defaultValue={customer.notes} />
                      <TextArea name="internalNotes" label="Internal account notes" defaultValue={customer.internalNotes} />
                    </SafeEditForm>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                    <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">Recent quotes</p>
                    <div className="mt-2 space-y-2">
                      {customer.quotes.length ? customer.quotes.map((quote) => (
                        <div key={quote.id} className="text-sm text-[#64707a]">
                          <span className="font-medium text-[#12212c]">{quote.quoteNumber}</span> / {formatDateTime(quote.createdAt)}
                        </div>
                      )) : <p className="text-sm text-[#64707a]">No recent quotes.</p>}
                    </div>
                  </div>
                  <div className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                    <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">Recent jobs</p>
                    <div className="mt-2 space-y-2">
                      {customer.tickets.length ? customer.tickets.map((ticket) => (
                        <div key={ticket.id} className="text-sm text-[#64707a]">
                          <span className="font-medium text-[#12212c]">{ticket.ticketNumber}</span> / {ticket.status}
                        </div>
                      )) : <p className="text-sm text-[#64707a]">No recent jobs.</p>}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TextInput({ name, label, defaultValue, type = "text", placeholder }: { name: string; label: string; defaultValue?: string | null; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      {label}
      <input name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3" />
    </label>
  );
}

function TextArea({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string | null }) {
  return (
    <label className="grid gap-1.5 text-sm">
      {label}
      <textarea name={name} defaultValue={defaultValue ?? ""} rows={2} className="rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3 py-2" />
    </label>
  );
}