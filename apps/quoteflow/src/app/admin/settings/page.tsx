import Link from "next/link";
import { UserRole } from "@prisma/client";

import { AdminSection, DetailCard, StatusBadge } from "@/components/admin/ops-ui";
import { restoreWorkflowDefaultsAction } from "@/features/admin/actions";
import { requireAuthenticatedUser } from "@/features/admin/guards";
import { saveWorkspaceBrandingAction } from "@/features/workspaces/actions";
import { businessTypeLabel } from "@/features/workspaces/config";
import { getSettingsData, getWorkspaceSwitcherData } from "@/features/workspaces/queries";
import { env } from "@/lib/env";
import { formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { user } = await requireAuthenticatedUser();
  const workspaceState = await getWorkspaceSwitcherData(user.id);
  const { workspace, notifications, auditEvents, workflowStages } = await getSettingsData(workspaceState.activeWorkspace?.id);
  const canManageSettings = user.role === UserRole.SYSTEM_OWNER || user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
  const visibleWorkflowModules = user.role === UserRole.ADMIN
    ? (["QUOTEFLOW", "WORKFLOW", "CALOPS"] as const)
    : (["QUOTEFLOW", "WORKFLOW"] as const);
  const brandColors = workspace?.brandColors as { primary?: string; accent?: string } | null | undefined;

  return (
    <div className="space-y-5">
      <AdminSection
        title="Settings"
        description="Business settings, users and roles, workflow stages, notifications, payments, branding, and demo mode controls."
        action={user.role === UserRole.SYSTEM_OWNER ? <Link href="/admin/workspace" className="rounded-full border border-[#12212c]/10 bg-white/60 px-3 py-1.5 text-sm">Product mode cards</Link> : null}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Business Settings", workspace?.businessName ?? "Active workspace"],
          ["Users & Roles", user.role === UserRole.SYSTEM_OWNER ? "Manage users" : "System Owner only"],
          ["Workflow Settings", "Quote and job statuses"],
          ["Notifications", "Email event log"],
          ["Payments", "Invoice payment links"],
          ["Branding", "Logo and colors"],
          ["Demo Mode", env.DEMO_MODE ? "Enabled" : "Disabled"],
        ].map(([title, body]) => (
          <div key={title} className="rounded-[1rem] border border-[#12212c]/8 bg-white/55 p-4">
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-1 text-sm text-[#64707a]">{body}</p>
            {title === "Users & Roles" && user.role === UserRole.SYSTEM_OWNER ? (
              <Link href="/admin/settings/users" className="mt-3 inline-flex rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium">
                Open users
              </Link>
            ) : null}
          </div>
        ))}
      </section>

      {!canManageSettings ? (
        <DetailCard title="Limited settings access">
          <p className="text-sm leading-6 text-[#64707a]">
            Demo users are locked to their assigned workspace. Workspace switching, user management,
            system-wide settings, and internal StanleySync administration are hidden.
          </p>
        </DetailCard>
      ) : null}

      {workspace ? (
        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <DetailCard title="Business profile and branding">
            <form action={saveWorkspaceBrandingAction} className="grid gap-3">
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <label className="grid gap-1.5 text-sm">
                Business name
                <input name="businessName" defaultValue={workspace.businessName} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3" />
              </label>
              <label className="grid gap-1.5 text-sm">
                Industry type
                <input name="industry" defaultValue={workspace.industry ?? ""} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  Business email
                  <input name="email" type="email" defaultValue={workspace.email ?? ""} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3" />
                </label>
                <label className="grid gap-1.5 text-sm">
                  Business phone
                  <input name="phone" defaultValue={workspace.phone ?? ""} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3" />
                </label>
              </div>
              <label className="grid gap-1.5 text-sm">
                Website
                <input name="website" defaultValue={workspace.website ?? ""} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3" />
              </label>
              <label className="grid gap-1.5 text-sm">
                Address
                <textarea name="address" defaultValue={workspace.address ?? ""} rows={2} className="rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3 py-2" />
              </label>
              <label className="grid gap-1.5 text-sm">
                Logo placeholder
                <input name="logoPlaceholder" defaultValue={workspace.logoPlaceholder ?? ""} maxLength={5} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3" />
              </label>
              <label className="grid gap-1.5 text-sm">
                Logo upload
                <input name="logoFile" type="file" accept="image/jpeg" className="rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3 py-2" />
                <span className="text-xs text-[#64707a]">JPEG logos are used in PDFs. Other formats should be converted before upload.</span>
              </label>
              {workspace.logoUrl ? (
                <p className="text-xs text-[#64707a]">Current logo: {workspace.logoUrl}</p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  Primary color
                  <input name="primary" defaultValue={brandColors?.primary ?? "#12212c"} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3" />
                </label>
                <label className="grid gap-1.5 text-sm">
                  Theme accent
                  <input name="accent" defaultValue={workspace.themeAccent ?? brandColors?.accent ?? "#c46a29"} className="h-10 rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3" />
                </label>
              </div>
              <label className="grid gap-1.5 text-sm">
                Quote terms
                <textarea name="quoteTerms" defaultValue={workspace.quoteTerms ?? ""} rows={3} className="rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3 py-2" />
              </label>
              <label className="grid gap-1.5 text-sm">
                Invoice terms
                <textarea name="invoiceTerms" defaultValue={workspace.invoiceTerms ?? ""} rows={3} className="rounded-[0.78rem] border border-[#12212c]/10 bg-white/70 px-3 py-2" />
              </label>
              {canManageSettings ? (
                <button type="submit" className="w-fit rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">Save branding</button>
              ) : null}
            </form>
          </DetailCard>

          <DetailCard title="Workspace profile">
            <div className="space-y-3 text-sm text-[#64707a]">
              <StatusBadge label={businessTypeLabel(workspace.businessType)} tone={workspace.businessType === "CALIBRATION_LAB" ? "info" : "neutral"} />
              <p>{workspace.businessName} uses enabled modules to keep general service workflow separate from calibration workflow.</p>
              <div className="rounded-[0.82rem] border border-[#12212c]/10 bg-white/70 px-3 py-2 text-[#12212c]">
                <p className="text-[0.68rem] uppercase tracking-[0.1em] text-[#64707a]">Public intake link</p>
                <p className="mt-1 break-all text-sm font-medium">{env.APP_BASE_URL}/intake/{workspace.workspaceKey}</p>
              </div>
              <Link href="/admin/audit" className="inline-flex rounded-full border border-[#12212c]/10 bg-white/60 px-3 py-1.5 text-sm text-[#12212c]">Open audit center</Link>
            </div>
          </DetailCard>
        </section>
      ) : null}

      {workspace ? (
        <DetailCard title="Workflow status configuration">
          <div className="grid gap-3 lg:grid-cols-3">
            {visibleWorkflowModules.map((module) => {
              const stages = workflowStages.filter((stage) => stage.module === module);
              return (
                <div key={module} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <p className="text-sm font-semibold">{module === "QUOTEFLOW" ? "QuoteFlow" : module === "WORKFLOW" ? "WorkFlow jobs" : "CalOps"}</p>
                  <div className="mt-3 space-y-2">
                    {(stages.length > 0 ? stages : defaultStageLabels(module)).map((stage, index) => (
                      <div key={stage.key} className="flex items-center justify-between rounded-[0.72rem] border border-[#12212c]/8 bg-white/60 px-2.5 py-2 text-sm">
                        <span>{index + 1}. {stage.label}</span>
                        <span className="text-xs text-[#64707a]">{stage.isEnabled === false ? "Off" : "On"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {canManageSettings ? (
            <form action={restoreWorkflowDefaultsAction} className="mt-4">
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <button type="submit" className="rounded-full border border-[#12212c]/10 bg-white/60 px-4 py-2 text-sm font-medium">
                Restore default workflow stages
              </button>
            </form>
          ) : null}
          <p className="mt-3 text-sm text-[#64707a]">
            MVP controls show active stages and restore defaults. Label editing and drag reordering are backed by the WorkflowStage model for the next UI pass.
          </p>
        </DetailCard>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <DetailCard title="Email notification architecture">
          <div className="space-y-3">
            {notifications.map((event) => (
              <div key={event.id} className="rounded-[0.82rem] border border-[#12212c]/8 bg-white/55 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{event.subject}</p>
                  <StatusBadge label={sentenceCase(event.status)} tone={event.status === "SENT" ? "success" : "neutral"} />
                </div>
                <p className="mt-1 text-xs text-[#64707a]">{sentenceCase(event.type)} via {event.provider}</p>
              </div>
            ))}
          </div>
        </DetailCard>
        <DetailCard title="Recent audit events">
          <div className="space-y-3">
            {auditEvents.map((event) => (
              <div key={event.id} className="rounded-[0.82rem] border border-[#12212c]/8 bg-white/55 p-3">
                <p className="text-sm font-medium">{event.summary}</p>
                <p className="mt-1 text-xs text-[#64707a]">{event.action} - {formatDateTime(event.createdAt)}</p>
              </div>
            ))}
          </div>
        </DetailCard>
      </section>
    </div>
  );
}

function defaultStageLabels(module: "QUOTEFLOW" | "WORKFLOW" | "CALOPS") {
  const defaults = {
    QUOTEFLOW: ["New", "Reviewing", "Need More Info", "Quoted", "Accepted", "Declined", "Converted", "Closed"],
    WORKFLOW: ["New", "Scheduled", "In Progress", "Waiting on Customer", "Waiting on Parts", "Completed", "Invoice Pending", "Invoiced", "Closed"],
    CALOPS: ["Received", "In Process", "Calibration Complete", "Technical Review", "Certificate Ready", "Invoice Pending", "Invoiced", "Closed"],
  };

  return defaults[module].map((label) => ({ key: label, label, isEnabled: true }));
}
