import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs, DetailCard, DuePill, KeyValueGrid, StatusBadge } from "@/components/admin/ops-ui";
import { requireCalOpsAccess } from "@/features/admin/guards";
import { getCalibrationStandardDetail } from "@/features/calops/queries";
import { formatDate, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StandardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCalOpsAccess();
  const { id } = await params;
  const standard = await getCalibrationStandardDetail(id);

  if (!standard) notFound();

  return (
    <div className="space-y-4">
      <Breadcrumbs
        backHref="/admin/standards"
        items={[
          { label: "CalOps", href: "/admin/calops" },
          { label: "Standards", href: "/admin/standards" },
          { label: standard.standardId },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <DetailCard title={`${standard.standardId} - ${standard.description}`}>
          <div className="mb-4"><DuePill date={standard.dueDate} /></div>
          <KeyValueGrid
            items={[
              { label: "Traceability source", value: standard.traceabilitySource ?? "Not set" },
              { label: "Cert number", value: standard.certNumber ?? "Not set" },
              { label: "Due date", value: formatDate(standard.dueDate) },
              { label: "Uncertainty", value: standard.uncertainty ?? "Not set" },
              { label: "Linked procedures", value: standard.procedures.length },
              { label: "Linked work orders", value: standard.workOrderLinks.length },
            ]}
          />
          <div className="mt-4 rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-[#64707a]">Notes</p>
            <p className="mt-2 text-sm leading-6 text-[#64707a]">{standard.notes ?? "No standard notes yet."}</p>
          </div>
        </DetailCard>

        <div className="space-y-4">
          <DetailCard title="Linked procedures">
            <div className="space-y-3">
              {standard.procedures.map((procedure) => (
                <Link key={procedure.id} href={`/admin/procedures/${procedure.id}`} className="block rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <p className="text-sm font-medium">{procedure.procedureNumber}</p>
                  <p className="mt-1 text-xs text-[#64707a]">{procedure.title}</p>
                </Link>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Linked usage history">
            <div className="space-y-3">
              {standard.workOrderLinks.map((link) => (
                <Link key={link.id} href={`/admin/work-orders/${link.workOrder.id}`} className="block rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{link.workOrder.woNumber}</p>
                    <StatusBadge label={sentenceCase(link.workOrder.status)} tone="neutral" />
                  </div>
                  <p className="mt-1 text-xs text-[#64707a]">{link.workOrder.customer.company} - {link.usageNotes ?? "No usage notes."}</p>
                </Link>
              ))}
            </div>
          </DetailCard>
        </div>
      </section>
    </div>
  );
}

