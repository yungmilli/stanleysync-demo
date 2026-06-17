import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";

import { PrintButton } from "@/components/admin/print-button";
import { requireRoles } from "@/features/admin/guards";
import { getWorkOrderDraftExport } from "@/features/ops/queries";
import { formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WorkOrderDraftPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRoles([UserRole.ADMIN, UserRole.MANAGER]);
  const { id } = await params;
  const draft = await getWorkOrderDraftExport(id);

  if (!draft) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-6 print:max-w-none print:px-0 print:py-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#9e4f18]">StanleySync QuoteFlow</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Work Order Draft print view</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/quotes/${draft.sourceQuoteRequestId}`} className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-sm">
            Back to quote
          </Link>
          <PrintButton />
        </div>
      </div>

      <article className="rounded-[1.2rem] border border-[#12212c]/10 bg-white p-8 shadow-[0_20px_70px_rgba(18,33,44,0.08)] print:rounded-none print:border-0 print:shadow-none">
        <header className="border-b border-[#12212c]/10 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[#9e4f18]">StanleySync QuoteFlow</p>
              <h1 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.03em]">Work Order Draft</h1>
              <p className="mt-2 text-sm leading-6 text-[#64707a]">
                Front-office intake and quoting handoff sheet for future CalOps workflow import.
              </p>
            </div>
            <div className="min-w-[220px] rounded-[1rem] border border-[#12212c]/10 bg-[#fffaf2] p-4 text-sm">
              <Row label="Draft number" value={draft.draftNumber} />
              <Row label="Source quote" value={draft.sourceQuoteRequest.quoteNumber} />
              <Row label="Status" value={sentenceCase(draft.status)} />
              <Row label="Created" value={formatDateTime(draft.createdAt)} />
              <Row
                label="Last export"
                value={draft.exportLogs[0] ? formatDateTime(draft.exportLogs[0].exportedAt) : "Not exported yet"}
              />
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <Card title="Customer and contact">
            <Row label="Company" value={draft.companyName} />
            <Row label="Contact" value={draft.contactName} />
            <Row label="Email" value={draft.contactEmail} />
            <Row label="Phone" value={draft.contactPhone ?? "Not set"} />
            <Row label="Customer ref" value={draft.customer.customerRef} />
            <Row label="Address" value={draft.customer.address ?? "Not set"} />
          </Card>

          <Card title="Service details">
            <Row label="Service type" value={sentenceCase(draft.requestedServiceType)} />
            <Row label="Calibration category" value={draft.calibrationCategory ?? "Not set"} />
            <Row label="Service mode" value={draft.serviceMode ? sentenceCase(draft.serviceMode) : "Not set"} />
            <Row label="Turnaround" value={draft.requestedTurnaround ?? "Not set"} />
            <Row label="Certification / docs" value={draft.documentationRequirements ?? "Not set"} />
            <Row label="Source quote submitted" value={formatDateTime(draft.sourceQuoteRequest.submittedAt)} />
          </Card>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2">
          <Card title="Equipment details">
            <Row label="Equipment type" value={draft.equipmentType ?? "Not set"} />
            <Row label="Manufacturer" value={draft.manufacturer ?? "Not set"} />
            <Row label="Model" value={draft.modelNumber ?? "Not set"} />
            <Row label="Serial" value={draft.serialNumber ?? "Not set"} />
            <Row label="Unit count" value={draft.unitCount ?? "Not set"} />
            <Row label="Range / capacity" value={draft.rangeOrCapacity ?? "Not set"} />
            <Row label="Units" value={draft.units ?? "Not set"} />
          </Card>

          <Card title="Notes">
            <Block label="Customer notes" value={draft.customerNotes ?? "No customer notes captured."} />
            <Block label="Internal notes" value={draft.internalNotesSummary ?? "No internal notes captured."} />
          </Card>
        </section>
      </article>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1rem] border border-[#12212c]/10 bg-white/70 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-[#64707a]">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64707a]">{label}</p>
      <p className="text-sm leading-6 text-[#12212c]">{value}</p>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64707a]">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[#12212c] whitespace-pre-wrap">{value}</p>
    </div>
  );
}
