import Link from "next/link";

import { AdminSection, DetailCard, StatusBadge } from "@/components/admin/ops-ui";
import { requireAdminSession } from "@/features/admin/guards";
import { getWorkspaceSwitcherData } from "@/features/workspaces/queries";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function PilotChecklistPage() {
  const { user } = await requireAdminSession();
  const workspaceState = await getWorkspaceSwitcherData(user.id);
  const workspaceId = workspaceState.activeWorkspace?.id;

  const [demoUser, quotes, tickets, invoices, feedbackCount] = await Promise.all([
    db.user.findFirst({ where: { email: "demo@stanleysync.app", isActive: true } }),
    db.quoteRequest.count({ where: workspaceId ? { workspaceId } : {} }),
    db.ticket.count({ where: workspaceId ? { workspaceId } : {} }),
    db.invoice.count({ where: workspaceId ? { workspaceId } : {} }),
    db.auditEvent.count({ where: { action: "DEMO_FEEDBACK_SUBMITTED" } }),
  ]);

  const checks = [
    {
      label: "Verify demo user",
      ok: Boolean(demoUser),
      detail: demoUser ? "demo@stanleysync.app is active." : "Create or reactivate demo@stanleysync.app.",
      href: "/admin/settings/users",
    },
    {
      label: "Test quote intake",
      ok: quotes > 0,
      detail: `${quotes} quote record${quotes === 1 ? "" : "s"} found in the active workspace.`,
      href: "/quote",
    },
    {
      label: "Test job conversion",
      ok: tickets > 0,
      detail: `${tickets} job record${tickets === 1 ? "" : "s"} found in the active workspace.`,
      href: "/admin/tickets",
    },
    {
      label: "Test invoice",
      ok: invoices > 0,
      detail: `${invoices} invoice record${invoices === 1 ? "" : "s"} found in the active workspace.`,
      href: "/admin/invoices",
    },
    {
      label: "Test PDFs",
      ok: quotes > 0 || tickets > 0 || invoices > 0,
      detail: "Open a quote, job, or invoice and export the PDF.",
      href: "/admin/invoices",
    },
    {
      label: "Test user permissions",
      ok: Boolean(demoUser),
      detail: "Log in as Demo User and confirm workspace switching, Labs, and system settings are hidden.",
      href: "/demo/start",
    },
    {
      label: "Test payment link field",
      ok: invoices > 0,
      detail: "Open an invoice and add a manual payment URL.",
      href: "/admin/invoices",
    },
  ];

  return (
    <div className="space-y-5">
      <AdminSection
        title="Pilot Checklist"
        description="Run these checks before sending StanleySync App to external testers."
        action={<StatusBadge label={env.PILOT_MODE ? "Pilot Mode" : "Pilot flag off"} tone={env.PILOT_MODE ? "success" : "warning"} />}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Metric label="Demo mode" value={env.DEMO_MODE ? "On" : "Off"} />
        <Metric label="Labs module" value={env.ENABLE_LABS_MODULE ? "Enabled" : "Coming soon"} />
        <Metric label="Feedback received" value={String(feedbackCount)} />
      </section>

      <DetailCard title="Release checks">
        <div className="space-y-3">
          {checks.map((check) => (
            <div key={check.label} className="flex flex-wrap items-center justify-between gap-3 rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{check.label}</p>
                  <StatusBadge label={check.ok ? "Ready" : "Needs test"} tone={check.ok ? "success" : "warning"} />
                </div>
                <p className="mt-1 text-sm text-[#64707a]">{check.detail}</p>
              </div>
              <Link href={check.href} className="rounded-full border border-[#12212c]/10 bg-white/70 px-3 py-1.5 text-xs font-medium">
                Open
              </Link>
            </div>
          ))}
        </div>
      </DetailCard>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-panel rounded-[0.95rem] p-3.5">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#64707a]">{label}</p>
      <p className="mt-1.5 text-xl font-semibold">{value}</p>
    </div>
  );
}
