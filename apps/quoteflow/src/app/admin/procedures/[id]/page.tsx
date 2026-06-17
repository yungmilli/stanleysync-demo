import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs, DetailCard, KeyValueGrid, StatusBadge } from "@/components/admin/ops-ui";
import { requireCalOpsAccess } from "@/features/admin/guards";
import { getCalibrationProcedureDetail } from "@/features/calops/queries";
import { formatDate, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProcedureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCalOpsAccess();
  const { id } = await params;
  const procedure = await getCalibrationProcedureDetail(id);

  if (!procedure) notFound();

  return (
    <div className="space-y-4">
      <Breadcrumbs
        backHref="/admin/procedures"
        items={[
          { label: "CalOps", href: "/admin/calops" },
          { label: "Procedures", href: "/admin/procedures" },
          { label: procedure.procedureNumber },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <DetailCard title={`${procedure.procedureNumber} - ${procedure.title}`}>
            <div className="mb-4">
              <StatusBadge label={procedure.isActive ? "Active" : "Inactive"} tone={procedure.isActive ? "success" : "neutral"} />
            </div>
            <KeyValueGrid
              items={[
                { label: "Discipline", value: procedure.discipline },
                { label: "Revision", value: procedure.revision },
                { label: "Controlled issue date", value: formatDate(procedure.controlledIssueDate) },
                { label: "Uncertainty reference", value: procedure.uncertaintyReference ?? "Not set" },
                { label: "Linked standards", value: procedure.standards.length },
                { label: "Linked assets", value: procedure.assets.length },
              ]}
            />
          </DetailCard>
          <DetailCard title="Instructions placeholder">
            <p className="text-sm leading-6 text-[#64707a]">{procedure.instructions ?? "Controlled work instructions will be managed here in a later phase."}</p>
          </DetailCard>
        </div>

        <div className="space-y-4">
          <DetailCard title="Linked standards">
            <div className="space-y-3">
              {procedure.standards.map((standard) => (
                <Link key={standard.id} href={`/admin/standards/${standard.id}`} className="block rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <p className="text-sm font-medium">{standard.standardId}</p>
                  <p className="mt-1 text-xs text-[#64707a]">{standard.description}</p>
                </Link>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Procedure linked assets">
            <div className="space-y-3">
              {procedure.assets.map((asset) => (
                <Link key={asset.id} href={`/admin/assets/${asset.id}`} className="block rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{asset.assetId}</p>
                    <StatusBadge label={sentenceCase(asset.status)} tone="neutral" />
                  </div>
                  <p className="mt-1 text-xs text-[#64707a]">{asset.customer.company} - {asset.description}</p>
                </Link>
              ))}
            </div>
          </DetailCard>
        </div>
      </section>
    </div>
  );
}

