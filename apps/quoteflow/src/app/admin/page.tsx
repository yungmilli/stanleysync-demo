import Link from "next/link";
import Image from "next/image";
import { UserRole } from "@prisma/client";

import { AdminSection, DetailCard, MetricCard, StatusBadge } from "@/components/admin/ops-ui";
import { requireOpsSession } from "@/features/admin/guards";
import { saveDashboardWidgetsAction } from "@/features/workspaces/actions";
import { businessTypeLabel, hasModule, parseModules } from "@/features/workspaces/config";
import { DASHBOARD_WIDGET_CATALOG, getWorkspaceDashboardData, getWorkspaceSwitcherData } from "@/features/workspaces/queries";
import { formatCurrency, formatDate, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { user } = await requireOpsSession();
  const workspaceState = await getWorkspaceSwitcherData(user.id);
  const workspace = workspaceState.activeWorkspace;
  const modules = parseModules(workspace?.enabledModules);
  const visibleModules = user.role === UserRole.ADMIN ? modules : modules.filter((module) => module !== "CalOps");
  const data = await getWorkspaceDashboardData(workspace?.id);
  const preferences = data.widgetPreferences.length > 0
    ? data.widgetPreferences
    : DASHBOARD_WIDGET_CATALOG
        .filter((widget) => widget.modules.some((module) => hasModule(workspace?.enabledModules, module)))
        .map((widget, index) => ({ ...widget, widgetKey: widget.key, isVisible: true, sortOrder: index, id: widget.key, workspaceId: workspace?.id ?? "", size: "standard", createdAt: new Date(), updatedAt: new Date() }));
  const visibleWidgets = preferences.filter((widget) => widget.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-5">
      <AdminSection
        title="StanleySync App Dashboard"
        description="Quote. Track. Invoice. All in one place. Use this demo path to create a quote, convert it to a job, track work, create an invoice, and export PDFs."
        action={user.role === UserRole.SYSTEM_OWNER || user.role === UserRole.ADMIN ? (
          <Link href="/admin/pilot-checklist" className="rounded-full border border-[#12212c]/10 bg-white/60 px-3 py-1.5 text-sm">
            Pilot Checklist
          </Link>
        ) : null}
      />

      <section className="overflow-hidden rounded-[1.15rem] bg-[#10212c] p-4 text-[#f7f2e8] shadow-[0_18px_54px_rgba(16,33,44,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-[0.9rem] border border-white/12 bg-white/5">
              <Image src="/brand/stanleysync-ai-logo.jpg" alt="StanleySync logo" fill sizes="56px" className="object-cover" priority />
            </div>
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#d8b28a]">Pilot workflow</p>
              <h2 className="text-xl font-semibold tracking-[-0.03em]">Quote. Track. Invoice.</h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/quote" className="rounded-full bg-[#f8efe0] px-3.5 py-2 text-sm font-medium text-[#10212c]">Create Quote</Link>
            <Link href="/admin/invoices" className="rounded-full border border-white/12 px-3.5 py-2 text-sm text-white/88">Open Invoices</Link>
          </div>
        </div>
      </section>

      <DetailCard title="Today's demo workflow">
        <div className="grid gap-2 md:grid-cols-4">
          <ModuleLink enabled href="/quote" title="1. Create quote" body="Open the guided customer quote intake." />
          <ModuleLink enabled href="/admin/quotes" title="2. Review quote" body="Open a quote, edit safely, and convert to job." />
          <ModuleLink enabled href="/admin/tickets" title="3. Track job" body="Assign work, update status, and export work order PDF." />
          <ModuleLink enabled href="/admin/invoices" title="4. Invoice" body="Create an invoice and export customer PDF." />
        </div>
      </DetailCard>

      {workspace ? (
        <section className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
          <DetailCard title={workspace.businessName}>
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusBadge label={businessTypeLabel(workspace.businessType)} tone={workspace.businessType === "CALIBRATION_LAB" ? "info" : "neutral"} />
              {visibleModules.map((module) => (
                <StatusBadge key={module} label={module === "LeadEngine" ? "LeadEngine Coming Soon" : module} tone={module === "CalOps" ? "info" : "neutral"} />
              ))}
              {user.role !== UserRole.ADMIN ? (
                <StatusBadge label="StanleySync Labs Coming Soon" tone="neutral" />
              ) : null}
            </div>
            <p className="text-sm leading-6 text-[#64707a]">
              {workspace.industry ?? "Service business"} workspace with module-specific navigation and workflow separation.
            </p>
          </DetailCard>

          <DetailCard title="Product packaging">
            <div className="grid gap-2 sm:grid-cols-2">
              <ModuleLink enabled={hasModule(workspace.enabledModules, "QuoteFlow")} href="/admin/quotes" title="QuoteFlow" body="Customer intake and quote management" />
              <ModuleLink enabled={hasModule(workspace.enabledModules, "WorkFlow")} href="/admin/tickets" title="WorkFlow" body="Jobs, tickets, assignment, due dates, financials" />
              <ModuleLink enabled={false} href="/admin/projects" title="SiteBuilder" body="Coming soon website builder" />
              <ModuleLink enabled={user.role === UserRole.ADMIN && hasModule(workspace.enabledModules, "CalOps")} href="/admin/calops" title="StanleySync Labs" body="Calibration Lab Module — Pro / Coming Soon" />
              <ModuleLink enabled={false} href="/admin/workspace" title="LeadEngine" body="Coming soon sales module" />
            </div>
          </DetailCard>
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {visibleWidgets.map((widget) => (
          <DashboardWidget key={widget.widgetKey} widgetKey={widget.widgetKey} title={widget.title} metrics={data.metrics} />
        ))}
      </section>

      {workspace ? (
        <DetailCard title="Dashboard widgets">
          <form action={saveDashboardWidgetsAction} className="space-y-3">
            <input type="hidden" name="workspaceId" value={workspace.id} />
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {DASHBOARD_WIDGET_CATALOG.filter((widget) => widget.modules.some((module) => hasModule(workspace.enabledModules, module))).map((widget, index) => {
                const pref = preferences.find((entry) => entry.widgetKey === widget.key);
                return (
                  <div key={widget.key} className="rounded-[0.82rem] border border-[#12212c]/8 bg-white/55 p-2.5">
                    <label className="flex items-center justify-between gap-2 text-sm font-medium">
                      {widget.title}
                      <input name={`${widget.key}:visible`} type="checkbox" defaultChecked={pref?.isVisible ?? true} />
                    </label>
                    <label className="mt-2 grid gap-1 text-xs text-[#64707a]">
                      Order
                      <input name={`${widget.key}:order`} type="number" min="0" defaultValue={pref?.sortOrder ?? index} className="h-8 rounded-[0.65rem] border border-[#12212c]/10 bg-white/70 px-2" />
                    </label>
                  </div>
                );
              })}
            </div>
            <button type="submit" className="rounded-full bg-[#12212c] px-4 py-2 text-sm font-medium text-white">Save widget layout</button>
          </form>
        </DetailCard>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <DetailCard title="Recent QuoteFlow quotes" action={<Link href="/admin/quotes" className="text-sm text-[#9e4f18]">Quotes</Link>}>
          <div className="space-y-3">
            {data.quotes.map((quote) => (
              <Link key={quote.id} href={`/admin/quotes/${quote.id}`} className="block rounded-[0.95rem] border border-[#12212c]/8 bg-white/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{quote.quoteNumber}</p>
                  <StatusBadge label={sentenceCase(quote.status)} tone="neutral" />
                </div>
                <p className="mt-1 text-sm text-[#64707a]">{quote.customer.company}</p>
                <p className="mt-1 text-xs text-[#64707a]">{formatDate(quote.updatedAt)}</p>
              </Link>
            ))}
          </div>
        </DetailCard>

        <DetailCard title="WorkFlow jobs" action={<Link href="/admin/tickets" className="text-sm text-[#9e4f18]">Jobs</Link>}>
          <div className="space-y-3">
            {data.tickets.map((ticket) => (
              <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`} className="block rounded-[0.95rem] border border-[#12212c]/8 bg-white/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{ticket.ticketNumber}</p>
                  <StatusBadge label={sentenceCase(ticket.status)} tone="neutral" />
                </div>
                <p className="mt-1 text-sm text-[#64707a]">{ticket.customer.company}</p>
                <p className="mt-1 text-xs text-[#64707a]">Billed {formatCurrency(ticket.billedAmount)}</p>
              </Link>
            ))}
          </div>
        </DetailCard>
      </section>

      {hasModule(workspace?.enabledModules, "CalOps") ? (
        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <DetailCard title="CalOps work orders" action={<Link href="/admin/work-orders" className="text-sm text-[#9e4f18]">Cal work orders</Link>}>
            <div className="space-y-3">
              {data.calWorkOrders.map((workOrder) => (
                <Link key={workOrder.id} href={`/admin/work-orders/${workOrder.id}`} className="block rounded-[0.95rem] border border-[#12212c]/8 bg-white/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{workOrder.woNumber}</p>
                    <StatusBadge label={sentenceCase(workOrder.status)} tone="neutral" />
                  </div>
                  <p className="mt-1 text-sm text-[#64707a]">{workOrder.customer.company}</p>
                </Link>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Uncertainty / traceability placeholders">
            <p className="text-sm leading-6 text-[#64707a]">
              Calibration workspaces expose assets, procedures, standards, certificates, uncertainty statements,
              traceability statements, and import/export handoff tools. General workspaces do not see these modules.
            </p>
          </DetailCard>
        </section>
      ) : null}
    </div>
  );
}

function ModuleLink({
  enabled,
  href,
  title,
  body,
}: {
  enabled: boolean;
  href: string;
  title: string;
  body: string;
}) {
  const content = (
    <div className="rounded-[0.82rem] border border-[#12212c]/8 bg-white/55 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        <StatusBadge label={enabled ? "Enabled" : "Off"} tone={enabled ? "success" : "neutral"} />
      </div>
      <p className="mt-1 text-xs leading-5 text-[#64707a]">{body}</p>
    </div>
  );

  return enabled ? <Link href={href}>{content}</Link> : content;
}

function DashboardWidget({
  widgetKey,
  title,
  metrics,
}: {
  widgetKey: string;
  title: string;
  metrics: Record<string, number>;
}) {
  const value = metrics[widgetKey] ?? 0;
  const formatted = widgetKey === "revenue" || widgetKey === "profit"
    ? formatCurrency(value)
    : widgetKey === "conversionRate"
      ? `${value}%`
      : String(value);
  return <MetricCard label={title} value={formatted} />;
}
