import { AdminSection, DetailCard, StatusBadge } from "@/components/admin/ops-ui";
import { requireManagerSession } from "@/features/admin/guards";
import { getSettingsData, getWorkspaceSwitcherData } from "@/features/workspaces/queries";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AuditCenterPage() {
  const { user } = await requireManagerSession();
  const workspaceState = await getWorkspaceSwitcherData(user.id);
  const { auditEvents } = await getSettingsData(workspaceState.activeWorkspace?.id);

  return (
    <div className="space-y-5">
      <AdminSection
        title="Audit center"
        description="Trace user actions, quote changes, work order edits, certificate revisions, and asset status changes from a single admin view."
      />
      <DetailCard title="Workspace audit trail">
        <div className="space-y-3">
          {auditEvents.map((event) => (
            <div key={event.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/60 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{event.summary}</p>
                <StatusBadge label={event.entityType} tone="neutral" />
              </div>
              <p className="mt-1 text-sm text-[#64707a]">{event.action}</p>
              <p className="mt-2 text-xs text-[#64707a]">{formatDateTime(event.createdAt)} by {event.actorEmail ?? "system"}</p>
            </div>
          ))}
        </div>
      </DetailCard>
    </div>
  );
}
