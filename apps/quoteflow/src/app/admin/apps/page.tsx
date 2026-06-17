import Link from "next/link";

import { AdminSection, DetailCard, StatusBadge } from "@/components/admin/ops-ui";
import { requireOpsSession } from "@/features/admin/guards";
import { hasModule } from "@/features/workspaces/config";
import { getWorkspaceSwitcherData } from "@/features/workspaces/queries";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const APP_CARDS = [
  { key: "QuoteFlow", title: "QuoteFlow", href: "/admin/quotes", body: "Create and review customer quote requests." },
  { key: "WorkFlow", title: "WorkFlow", href: "/admin/tickets", body: "Convert quotes into jobs, assign work, and track due dates." },
  { key: "Invoicing", title: "Invoicing", href: "/admin/invoices", body: "Create invoices from quotes and jobs, then export customer PDFs." },
  { key: "SiteBuilder", title: "SiteBuilder", href: "/admin/projects", body: "Starter websites and service pages for clients." },
  { key: "CalOps", title: "StanleySync Labs", href: "/admin/calops", body: "Calibration Lab Module — Pro / Coming Soon." },
  { key: "LeadEngine", title: "LeadEngine", href: "/admin/settings", body: "Coming-soon sales and lead follow-up module." },
  { key: "IdeaBoard", title: "Idea Board", href: "/admin/ideas", body: "Team feedback and product ideas." },
] as const;

const MODULE_APP_KEYS = ["QuoteFlow", "WorkFlow", "SiteBuilder", "CalOps", "LeadEngine"] as const;

function isModuleAppKey(key: string): key is (typeof MODULE_APP_KEYS)[number] {
  return MODULE_APP_KEYS.includes(key as (typeof MODULE_APP_KEYS)[number]);
}

export default async function AppsPage() {
  const { user } = await requireOpsSession();
  const workspaceState = await getWorkspaceSwitcherData(user.id);
  const workspace = workspaceState.activeWorkspace;

  return (
    <div className="space-y-5">
      <AdminSection
        title="Apps"
        description="Launch the enabled StanleySync App workflow for today’s general-service demo."
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {APP_CARDS.map((app) => {
          const ownerCanOpenLabs = env.ENABLE_LABS_MODULE && user.role === "SYSTEM_OWNER" && hasModule(workspace?.enabledModules, "CalOps");
          const enabled =
            (app.key === "IdeaBoard" && user.role !== "DEMO_USER") ||
            app.key === "Invoicing" ||
            (isModuleAppKey(app.key) && hasModule(workspace?.enabledModules, app.key));
          const demoComingSoon = app.key === "SiteBuilder" || app.key === "LeadEngine" || (app.key === "CalOps" && !ownerCanOpenLabs);
          const clickable = enabled && !demoComingSoon;
          const card = (
            <DetailCard
              title={app.title}
              action={<StatusBadge label={demoComingSoon ? "Coming soon" : enabled ? "Enabled" : "Off"} tone={enabled && !demoComingSoon ? "success" : "neutral"} />}
            >
              <p className="min-h-12 text-sm leading-6 text-[#64707a]">{app.body}</p>
            </DetailCard>
          );

          return clickable ? <Link key={app.key} href={app.href}>{card}</Link> : <div key={app.key}>{card}</div>;
        })}
      </section>
    </div>
  );
}
