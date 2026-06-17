import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs, DetailCard, KeyValueGrid, StatusBadge } from "@/components/admin/ops-ui";
import { requireCalOpsAccess } from "@/features/admin/guards";
import { getCalAssetDetail } from "@/features/calops/queries";
import { formatDate, formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCalOpsAccess();
  const { id } = await params;
  const asset = await getCalAssetDetail(id);

  if (!asset) notFound();

  return (
    <div className="space-y-4">
      <Breadcrumbs
        backHref="/admin/assets"
        items={[
          { label: "CalOps", href: "/admin/calops" },
          { label: "Assets", href: "/admin/assets" },
          { label: asset.assetId },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <DetailCard title={`${asset.assetId} - ${asset.description}`}>
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusBadge label={sentenceCase(asset.status)} tone={asset.status === "OVERDUE" || asset.status === "OOT" ? "danger" : asset.status === "DUE_SOON" ? "warning" : "success"} />
              <StatusBadge label={sentenceCase(asset.assetType)} tone="info" />
            </div>
            <KeyValueGrid
              items={[
                { label: "Customer", value: `${asset.customer.company} - ${asset.customer.mainContact}` },
                { label: "Lab", value: asset.lab?.name ?? "Default lab" },
                { label: "Manufacturer", value: asset.manufacturer ?? "Not set" },
                { label: "Model", value: asset.model ?? "Not set" },
                { label: "Serial number", value: asset.serialNumber ?? "Not set" },
                { label: "Capacity / range", value: asset.capacityRange ?? "Not set" },
                { label: "Accuracy / tolerance", value: asset.accuracyTolerance ?? "Not set" },
                { label: "Procedure assigned", value: asset.procedure ? `${asset.procedure.procedureNumber} - ${asset.procedure.title}` : "Unassigned" },
                { label: "Calibration interval", value: asset.calibrationInterval ? `${asset.calibrationInterval} ${sentenceCase(asset.intervalUnit)}` : "Not set" },
                { label: "Last cal date", value: formatDate(asset.lastCalDate) },
                { label: "Due date", value: formatDate(asset.dueDate) },
                { label: "Parent asset", value: asset.parentAsset?.assetId ?? "None" },
                { label: "Last updated", value: formatDateTime(asset.updatedAt) },
              ]}
            />
          </DetailCard>

          <DetailCard title="Notes and history">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[#64707a]">Notes</p>
                <p className="mt-2 text-sm leading-6 text-[#64707a]">{asset.notes ?? "No notes yet."}</p>
              </div>
              <div className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                <p className="text-xs uppercase tracking-[0.1em] text-[#64707a]">History</p>
                <p className="mt-2 text-sm leading-6 text-[#64707a]">{asset.history ?? "History entries will appear here."}</p>
              </div>
            </div>
          </DetailCard>
        </div>

        <div className="space-y-4">
          <DetailCard title="Linked standards">
            <div className="space-y-3">
              {asset.standards.map((standard) => (
                <Link key={standard.id} href={`/admin/standards/${standard.id}`} className="block rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <p className="text-sm font-medium">{standard.standardId}</p>
                  <p className="mt-1 text-xs text-[#64707a]">{standard.description}</p>
                </Link>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Due recalls">
            <div className="space-y-3">
              {asset.recalls.length === 0 ? <p className="text-sm text-[#64707a]">No recalls scheduled.</p> : null}
              {asset.recalls.map((recall) => (
                <div key={recall.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{formatDate(recall.dueDate)}</p>
                    <StatusBadge label={sentenceCase(recall.status)} tone={recall.status === "OPEN" ? "warning" : "neutral"} />
                  </div>
                  <p className="mt-1 text-xs text-[#64707a]">{recall.method ?? "Recall"} - {recall.message ?? "No message."}</p>
                </div>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Equipment history">
            <div className="space-y-3">
              {asset.historyEvents.length === 0 ? <p className="text-sm text-[#64707a]">No history events yet.</p> : null}
              {asset.historyEvents.map((event) => (
                <div key={event.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{event.title}</p>
                    <StatusBadge label={sentenceCase(event.type)} tone="neutral" />
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[#64707a]">{event.description}</p>
                  <p className="mt-1 text-xs text-[#64707a]">{formatDateTime(event.createdAt)} {event.workOrder ? `- ${event.workOrder.woNumber}` : ""}</p>
                </div>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Parent and child assets">
            <div className="space-y-3">
              {asset.parentAsset ? (
                <Link href={`/admin/assets/${asset.parentAsset.id}`} className="block rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3 text-sm">
                  Parent: {asset.parentAsset.assetId}
                </Link>
              ) : null}
              {asset.childAssets.map((child) => (
                <Link key={child.id} href={`/admin/assets/${child.id}`} className="block rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3 text-sm">
                  Child: {child.assetId} - {child.description}
                </Link>
              ))}
              {!asset.parentAsset && asset.childAssets.length === 0 ? <p className="text-sm text-[#64707a]">No parent or child relationships.</p> : null}
            </div>
          </DetailCard>

          <DetailCard title="Work order usage">
            <div className="space-y-3">
              {asset.workOrderLinks.map((link) => (
                <Link key={link.id} href={`/admin/work-orders/${link.workOrder.id}`} className="block rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{link.workOrder.woNumber}</p>
                    <StatusBadge label={sentenceCase(link.workOrder.status)} tone="neutral" />
                  </div>
                  <p className="mt-1 text-xs text-[#64707a]">{link.passFail ?? "Pending result"}</p>
                </Link>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Attachments placeholder">
            <p className="text-sm leading-6 text-[#64707a]">{asset.attachmentsNote ?? "Future uploaded certificates, photos, and customer files will be linked here."}</p>
          </DetailCard>
        </div>
      </section>
    </div>
  );
}

