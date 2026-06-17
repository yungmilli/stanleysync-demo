import Link from "next/link";
import { UserRole } from "@prisma/client";

import { DetailCard } from "@/components/admin/ops-ui";
import { requireAuthenticatedUser } from "@/features/admin/guards";
import { saveFirstRunSetupAction } from "@/features/workspaces/actions";
import { getWorkspaceSwitcherData } from "@/features/workspaces/queries";

export const dynamic = "force-dynamic";

const defaultQuoteTerms =
  "Quote is valid for 30 days unless otherwise stated. Pricing is subject to final inspection, schedule availability, and written approval.";
const defaultInvoiceTerms = "Payment due by the listed due date. Please reference the invoice number with payment.";
const setupRoles: UserRole[] = [UserRole.SYSTEM_OWNER, UserRole.ADMIN, UserRole.MANAGER];

export default async function FirstRunPage() {
  const { user } = await requireAuthenticatedUser();
  if (!setupRoles.includes(user.role)) {
    return (
      <DetailCard title="Setup access required">
        <p className="text-sm leading-6 text-[#64707a]">Ask a System Owner or Admin to complete the company setup wizard.</p>
      </DetailCard>
    );
  }

  const workspaceState = await getWorkspaceSwitcherData(user.id);
  const workspace = workspaceState.activeWorkspace;

  if (!workspace) {
    return (
      <DetailCard title="No workspace selected">
        <p className="text-sm leading-6 text-[#64707a]">Select a workspace before running first setup.</p>
      </DetailCard>
    );
  }

  const brandColors = workspace.brandColors as { primary?: string; accent?: string } | null | undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#9e4f18]">First run setup</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Set up your company profile</h2>
        <p className="mt-2 text-sm leading-6 text-[#64707a]">
          These details are saved to the active workspace and applied to quotes, work orders, invoices, emails, and PDF exports.
        </p>
      </div>

      <DetailCard title="Company profile">
        <form action={saveFirstRunSetupAction} className="grid gap-4">
          <input type="hidden" name="workspaceId" value={workspace.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              Business Name
              <input name="businessName" required defaultValue={workspace.businessName} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3" />
            </label>
            <label className="grid gap-1.5 text-sm">
              Logo Initials
              <input name="logoPlaceholder" defaultValue={workspace.logoPlaceholder ?? "SS"} maxLength={5} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3" />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm">
            Logo Upload
            <input name="logoFile" type="file" accept="image/jpeg" className="rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3 py-2" />
            <span className="text-xs text-[#64707a]">Use a JPEG logo for PDF documents.</span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              Phone
              <input name="phone" defaultValue={workspace.phone ?? ""} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3" />
            </label>
            <label className="grid gap-1.5 text-sm">
              Email
              <input name="email" type="email" defaultValue={workspace.email ?? ""} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3" />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm">
            Address
            <textarea name="address" defaultValue={workspace.address ?? ""} rows={3} className="rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3 py-2" />
          </label>

          <input type="hidden" name="industry" value={workspace.industry ?? ""} />
          <input type="hidden" name="website" value={workspace.website ?? ""} />
          <input type="hidden" name="primary" value={brandColors?.primary ?? "#12212c"} />
          <input type="hidden" name="accent" value={workspace.themeAccent ?? brandColors?.accent ?? "#c46a29"} />

          <label className="grid gap-1.5 text-sm">
            Quote Terms
            <textarea name="quoteTerms" defaultValue={workspace.quoteTerms ?? defaultQuoteTerms} rows={4} className="rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3 py-2" />
          </label>

          <label className="grid gap-1.5 text-sm">
            Invoice Terms
            <textarea name="invoiceTerms" defaultValue={workspace.invoiceTerms ?? defaultInvoiceTerms} rows={4} className="rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3 py-2" />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">
              Save and continue
            </button>
            <Link href="/admin/settings" className="rounded-full border border-[#12212c]/10 bg-white/70 px-4 py-2 text-sm font-medium">
              Open settings
            </Link>
          </div>
        </form>
      </DetailCard>
    </div>
  );
}
