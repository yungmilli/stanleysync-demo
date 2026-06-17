import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs, DetailCard, KeyValueGrid, StatusBadge } from "@/components/admin/ops-ui";
import { PrintButton } from "@/components/admin/print-button";
import { requireCalOpsAccess } from "@/features/admin/guards";
import { getCertificateDraftDetail } from "@/features/calops/queries";
import { formatDate, formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CertificateDraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCalOpsAccess();
  const { id } = await params;
  const certificate = await getCertificateDraftDetail(id);

  if (!certificate) notFound();

  const asset = certificate.asset ?? certificate.workOrder.assets[0]?.asset ?? null;

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <Breadcrumbs
          backHref="/admin/certificates"
          items={[
            { label: "CalOps", href: "/admin/calops" },
            { label: "Certificates", href: "/admin/certificates" },
            { label: certificate.certificateNumber },
          ]}
        />
      </div>

      <section className="app-panel rounded-[1rem] p-5 print:border-0 print:bg-white print:shadow-none">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#9e4f18]">StanleySync CalOps</p>
            <h1 className="mt-1 text-[1.6rem] font-semibold tracking-[-0.02em]">Calibration Certificate Draft</h1>
            <p className="mt-1 text-sm text-[#64707a]">{certificate.certificateNumber}</p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <StatusBadge label={sentenceCase(certificate.status)} tone="neutral" />
            <a href={`/api/certificates/${certificate.id}/pdf`} className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-sm font-medium">Download PDF</a>
            <Link href={`/admin/certificates/${certificate.id}/print`} className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-sm font-medium">Print view</Link>
            <PrintButton />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <DetailCard title="Customer">
            <KeyValueGrid
              items={[
                { label: "Company", value: certificate.customer.company },
                { label: "Contact", value: certificate.customer.mainContact },
                { label: "Email", value: certificate.customer.email },
                { label: "Work order", value: certificate.workOrder.woNumber },
                { label: "Lab", value: certificate.lab?.name ?? "Default lab" },
                { label: "Procedure", value: certificate.workOrder.procedure?.procedureNumber ?? "Not assigned" },
                { label: "Draft generated", value: formatDateTime(certificate.createdAt) },
              ]}
            />
          </DetailCard>

          <DetailCard title="Asset info">
            <KeyValueGrid
              items={[
                { label: "Asset ID", value: asset?.assetId ?? "Package draft" },
                { label: "Description", value: asset?.description ?? "Multiple assets" },
                { label: "Manufacturer", value: asset?.manufacturer ?? "Not set" },
                { label: "Model", value: asset?.model ?? "Not set" },
                { label: "Serial", value: asset?.serialNumber ?? "Not set" },
                { label: "Range", value: asset?.capacityRange ?? "Not set" },
              ]}
            />
          </DetailCard>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
          <DetailCard title="As-found / as-left">
            <KeyValueGrid
              items={[
                { label: "As-found", value: certificate.asFoundSummary ?? "Placeholder" },
                { label: "As-left", value: certificate.asLeftSummary ?? "Placeholder" },
                { label: "Pass / fail", value: certificate.passFail ?? "Pending" },
                { label: "Notes", value: certificate.notes ?? "No notes" },
                { label: "Conformity", value: certificate.statementOfConformity ?? "Statement of conformity placeholder." },
                { label: "Decision rule", value: certificate.decisionRule ?? "Decision rule placeholder." },
              ]}
            />
          </DetailCard>

          <DetailCard title="Standards used">
            <div className="space-y-3">
              {certificate.workOrder.standards.map((link) => (
                <div key={link.id} className="rounded-[0.9rem] border border-[#12212c]/8 bg-white/55 p-3">
                  <p className="text-sm font-medium">{link.standard.standardId}</p>
                  <p className="mt-1 text-xs text-[#64707a]">{link.standard.description}</p>
                  <p className="mt-1 text-xs text-[#64707a]">Cert {link.standard.certNumber ?? "n/a"} - Due {formatDate(link.standard.dueDate)}</p>
                </div>
              ))}
            </div>
          </DetailCard>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
          <DetailCard title="Uncertainty statement">
            <p className="text-sm leading-6 text-[#64707a]">{certificate.uncertaintyStatement ?? "Uncertainty statement placeholder."}</p>
          </DetailCard>
          <DetailCard title="Traceability statement">
            <p className="text-sm leading-6 text-[#64707a]">{certificate.traceabilityStatement ?? "Traceability statement placeholder."}</p>
          </DetailCard>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
          <DetailCard title="ISO 17025 placeholders">
            <KeyValueGrid
              items={[
                { label: "Accreditation", value: certificate.accreditationStatement ?? "Accreditation placeholder" },
                { label: "Environment", value: certificate.environmentalConditions ?? "Environment placeholder" },
                { label: "Method", value: certificate.calibrationMethod ?? "Method placeholder" },
                { label: "Reviewer", value: certificate.authorizedReviewer ?? "Not assigned" },
                { label: "Issue date", value: formatDate(certificate.issueDate) },
                { label: "Revision", value: certificate.revision ?? "Draft" },
              ]}
            />
          </DetailCard>
          <DetailCard title="Measurement table">
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Point</th>
                    <th>As-found</th>
                    <th>As-left</th>
                    <th>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {certificate.workOrder.records.map((record) => (
                    <tr key={record.id}>
                      <td>{record.label}</td>
                      <td>{record.asFoundValue ?? record.asFound ?? "n/a"}</td>
                      <td>{record.asLeftValue ?? record.asLeft ?? "n/a"}</td>
                      <td>{sentenceCase(record.decision)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DetailCard>
        </div>
      </section>
    </div>
  );
}

