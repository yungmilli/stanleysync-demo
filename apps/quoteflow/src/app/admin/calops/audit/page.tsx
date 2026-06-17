import { CalOpsShell } from "@/components/admin/calops-shell";
import { AdminSection, DetailCard, StatusBadge } from "@/components/admin/ops-ui";
import { requireCalOpsAccess } from "@/features/admin/guards";
import { getSettingsData, getWorkspaceSwitcherData } from "@/features/workspaces/queries";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CalOpsAuditPage() {
  const { user } = await requireCalOpsAccess();
  const workspaceState = await getWorkspaceSwitcherData(user.id);
  const { auditEvents } = await getSettingsData(workspaceState.activeWorkspace?.id);
  const calEvents = auditEvents.filter((event) =>
    event.entityType.toLowerCase().includes("calibration") ||
    event.action.toLowerCase().includes("calops") ||
    event.action.toLowerCase().includes("traceability") ||
    event.entityType.toLowerCase().includes("asset") ||
    event.entityType.toLowerCase().includes("certificate"),
  );

  return (
    <CalOpsShell>
      <div className="space-y-5">
        <AdminSection
          title="Audit / Traceability"
          description="CalOps-specific traceability center for asset, standard, work order, and certificate audit events."
        />
        <DetailCard title="Traceability events">
          <div className="space-y-3">
            {(calEvents.length > 0 ? calEvents : auditEvents).map((event) => (
              <div key={event.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/60 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{event.summary}</p>
                  <StatusBadge label={event.entityType} tone="info" />
                </div>
                <p className="mt-1 text-sm text-[#64707a]">{event.action}</p>
                <p className="mt-2 text-xs text-[#64707a]">{formatDateTime(event.createdAt)} by {event.actorEmail ?? "system"}</p>
              </div>
            ))}
          </div>
        </DetailCard>
      </div>
    </CalOpsShell>
  );
}

