import Link from "next/link";

import { AdminSection, DetailCard, EmptyState, StatusBadge, TableHint } from "@/components/admin/ops-ui";
import { requireCalOpsAccess } from "@/features/admin/guards";
import { getCalibrationWorkOrdersList } from "@/features/calops/queries";
import { getCalOpsIntegrationData } from "@/features/ops/queries";
import { formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CalOpsIntegrationPage() {
  await requireCalOpsAccess();
  const data = await getCalOpsIntegrationData();
  const calWorkOrders = await getCalibrationWorkOrdersList({});

  return (
    <div className="space-y-4">
      <AdminSection
        title="CalOps integration"
        description="Standalone and integrated CalOps can coexist. Use this page to export calibration work orders as JSON, keep QuoteFlow handoffs visible, and stage a future external CalOps connector."
      />

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <DetailCard title="Connection status">
          <div className="space-y-3">
            <StatusBadge label={data.connectionStatus} tone="warning" />
            <p className="text-sm leading-6 text-[#64707a]">
              Integrated mode uses the local CalOps module inside StanleySync. Standalone mode is for a
              separate calibration workstation or future CalOps install that imports JSON packages.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">Placeholder API base URL</p>
                <p className="mt-1 text-sm">Not configured</p>
              </div>
              <div className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">Placeholder auth token</p>
                <p className="mt-1 text-sm">Not configured</p>
              </div>
            </div>
            <button
              type="button"
              disabled
              className="rounded-full border border-[#12212c]/10 bg-white/60 px-3 py-1.5 text-xs font-medium text-[#64707a]"
            >
              Connect CalOps module
            </button>
          </div>
        </DetailCard>

        <DetailCard title="Work Order Draft exports">
          {data.drafts.length === 0 ? (
            <EmptyState
              title="No work order drafts yet"
              body="Convert a quote into a Work Order Draft from the quote detail page to prepare a future CalOps handoff."
            />
          ) : (
            <div className="space-y-3">
              {data.drafts.map((draft) => (
                <div key={draft.id} className="rounded-[0.95rem] border border-[#12212c]/8 bg-white/60 p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{draft.draftNumber}</p>
                        <StatusBadge label={sentenceCase(draft.status)} tone="info" />
                      </div>
                      <p className="mt-1 text-sm text-[#64707a]">
                        {draft.companyName} - {draft.contactName}
                      </p>
                      <p className="mt-1 text-xs text-[#64707a]">
                        Source quote: {draft.sourceQuoteRequest.quoteNumber}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`/api/work-order-drafts/${draft.id}/export`}
                        className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium"
                      >
                        Export JSON
                      </a>
                      <Link
                        href={`/admin/work-order-drafts/${draft.id}/print`}
                        className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium"
                      >
                        Print / PDF
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DetailCard>
      </div>

      <DetailCard title="Calibration work order JSON exports">
        {calWorkOrders.workOrders.length === 0 ? (
          <EmptyState
            title="No calibration work orders"
            body="Convert a calibration quote or create a CalOps work order before exporting a data package."
          />
        ) : (
          <div className="space-y-3">
            {calWorkOrders.workOrders.slice(0, 8).map((workOrder) => (
              <div key={workOrder.id} className="rounded-[0.95rem] border border-[#12212c]/8 bg-white/60 p-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{workOrder.woNumber}</p>
                      <StatusBadge label={sentenceCase(workOrder.status)} tone="info" />
                    </div>
                    <p className="mt-1 text-sm text-[#64707a]">
                      {workOrder.customer.company} - {workOrder.serviceType.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-xs text-[#64707a]">
                      Assets: {workOrder.assets.map((link) => link.asset.assetId).join(", ") || "None linked"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/api/calibration-work-orders/${workOrder.id}/export`}
                      className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium"
                    >
                      Export for Calibration Software
                    </a>
                    <Link
                      href={`/admin/work-orders/${workOrder.id}`}
                      className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DetailCard>

      <DetailCard title="JSON import placeholder">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <p className="text-sm leading-6 text-[#64707a]">
            Import is intentionally staged as a placeholder until the standalone CalOps package contract
            is finalized. The local app now exports calibration work orders using a versioned JSON
            envelope that can be used by another machine later.
          </p>
          <button
            type="button"
            disabled
            className="rounded-full border border-dashed border-[#12212c]/20 bg-white/60 px-4 py-2 text-xs font-medium text-[#64707a]"
          >
            Import JSON package
          </button>
        </div>
      </DetailCard>

      <DetailCard title="Recent export logs">
        {data.logs.length === 0 ? (
          <EmptyState
            title="No exports logged yet"
            body="Export activity will appear here after a Work Order Draft JSON package is generated."
          />
        ) : (
          <div className="space-y-3">
            {data.logs.map((log) => (
              <div key={log.id} className="rounded-[0.95rem] border border-[#12212c]/8 bg-white/60 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {log.workOrderDraft.draftNumber} - {log.targetSystem}
                    </p>
                    <p className="mt-1 text-sm text-[#64707a]">{log.message ?? "Export recorded."}</p>
                  </div>
                  <StatusBadge label={sentenceCase(log.status)} tone="success" />
                </div>
                <p className="mt-2 text-xs text-[#64707a]">
                  {formatDateTime(log.exportedAt)} by {log.actor ?? "system"}
                </p>
              </div>
            ))}
          </div>
        )}
      </DetailCard>

      <TableHint>CoreOps handles general workflow. CalOps remains a specialized calibration module that can run integrated here or exchange JSON packages with a standalone install.</TableHint>
    </div>
  );
}
