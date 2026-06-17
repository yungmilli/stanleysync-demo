import { AdminSection, DetailCard, KeyValueGrid, StatusBadge } from "@/components/admin/ops-ui";
import { requireSystemOwnerSession } from "@/features/admin/guards";
import { businessTypeLabel, parseModules } from "@/features/workspaces/config";
import { getWorkspaceSetupData } from "@/features/workspaces/queries";

export const dynamic = "force-dynamic";

export default async function WorkspaceSetupPage() {
  await requireSystemOwnerSession();
  const workspaces = await getWorkspaceSetupData();

  return (
    <div className="space-y-4">
      <AdminSection
        title="Product mode setup"
        description="System Owner mode selector for StanleySync App, StanleySync Labs, and StanleySync Demo."
      />

      <section className="grid gap-4 xl:grid-cols-3">
        {workspaces.map((workspace) => {
          const modules = parseModules(workspace.enabledModules);
          const brandColors = workspace.brandColors as { primary?: string; accent?: string };

          return (
            <DetailCard key={workspace.id} title={workspace.businessName}>
              <div className="mb-3 flex flex-wrap gap-2">
                <StatusBadge label={businessTypeLabel(workspace.businessType)} tone={workspace.businessType === "CALIBRATION_LAB" ? "info" : "neutral"} />
                <StatusBadge label={workspace.isActive ? "Active" : "Inactive"} tone={workspace.isActive ? "success" : "neutral"} />
              </div>
              <KeyValueGrid
                items={[
                  { label: "Industry", value: workspace.industry ?? "Not set" },
                  { label: "Email", value: workspace.email ?? "Not set" },
                  { label: "Phone", value: workspace.phone ?? "Not set" },
                  { label: "Website", value: workspace.website ?? "Not set" },
                  { label: "Customers", value: workspace.customers.length },
                  { label: "Quotes", value: workspace.quotes.length },
                  { label: "Jobs", value: workspace.tickets.length },
                  { label: "Cal WOs", value: workspace.workOrders.length },
                ]}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {modules.map((module) => (
                  <StatusBadge key={module} label={module === "LeadEngine" ? "LeadEngine Coming Soon" : module} tone={module === "CalOps" ? "info" : "neutral"} />
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <span className="h-6 w-10 rounded-full border border-[#12212c]/10" style={{ background: brandColors.primary ?? "#12212c" }} />
                <span className="h-6 w-10 rounded-full border border-[#12212c]/10" style={{ background: brandColors.accent ?? "#c46a29" }} />
              </div>
            </DetailCard>
          );
        })}
      </section>
    </div>
  );
}
