import { notFound } from "next/navigation";
import { ExportPackageType } from "@prisma/client";

import { DetailCard, KeyValueGrid } from "@/components/admin/ops-ui";
import { PrintButton } from "@/components/admin/print-button";
import { requireCalOpsAccess } from "@/features/admin/guards";
import { createWorkOrderPackageExportAction } from "@/features/calops/actions";
import { getCertificateDraftDetail } from "@/features/calops/queries";
import { formatDate, formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CertificatePrintPage({
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
      <section className="app-panel rounded-[1rem] p-5 print:border-0 print:bg-white print:shadow-none">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[#9e4f18]">StanleySync CalOps</p>
            <h1 className="mt-1 text-[1.55rem] font-semibold tracking-[-0.02em]">Certificate of Calibration</h1>
            <p className="mt-1 text-sm text-[#64707a]">{certificate.certificateNumber} - {certificate.revision ?? "Draft"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <form action={createWorkOrderPackageExportAction}>
              <input type="hidden" name="workOrderId" value={certificate.workOrder.id} />
              <input type="hidden" name="packageType" value={ExportPackageType.CERTIFICATE} />
              <input type="hidden" name="title" value={`${certificate.certificateNumber} certificate PDF`} />
              <button type="submit" className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-sm font-medium">Log certificate export</button>
            </form>
            <PrintButton />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <DetailCard title="Customer and asset">
            <KeyValueGrid
              items={[
                { label: "Customer", value: certificate.customer.company },
                { label: "Contact", value: certificate.customer.mainContact },
                { label: "Asset ID", value: asset?.assetId ?? "Package" },
                { label: "Description", value: asset?.description ?? "Multiple assets" },
                { label: "Model / serial", value: [asset?.model, asset?.serialNumber].filter(Boolean).join(" / ") || "Not set" },
                { label: "Work order", value: certificate.workOrder.woNumber },
              ]}
            />
          </DetailCard>

          <DetailCard title="ISO 17025 style fields">
            <KeyValueGrid
              items={[
                { label: "Lab", value: certificate.lab?.name ?? "Default lab" },
                { label: "Accreditation", value: certificate.accreditationStatement ?? "Placeholder" },
                { label: "Method", value: certificate.calibrationMethod ?? "Placeholder" },
                { label: "Environment", value: certificate.environmentalConditions ?? "Placeholder" },
                { label: "Issue date", value: formatDate(certificate.issueDate) },
                { label: "Reviewer", value: certificate.authorizedReviewer ?? "Not assigned" },
              ]}
            />
          </DetailCard>
        </div>

        <div className="mt-4">
          <DetailCard title="Measurement results">
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Point</th>
                    <th>Nominal</th>
                    <th>As-found</th>
                    <th>As-left</th>
                    <th>Tolerance</th>
                    <th>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {certificate.workOrder.records.map((record) => (
                    <tr key={record.id}>
                      <td>{record.label}</td>
                      <td>{record.nominalValue ?? "n/a"} {record.units ?? ""}</td>
                      <td>{record.asFoundValue ?? record.asFound ?? "n/a"}</td>
                      <td>{record.asLeftValue ?? record.asLeft ?? "n/a"}</td>
                      <td>{record.toleranceLow ?? "n/a"} to {record.toleranceHigh ?? "n/a"} {record.units ?? ""}</td>
                      <td>{sentenceCase(record.decision)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DetailCard>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <DetailCard title="Traceability">
            <p className="text-sm leading-6 text-[#64707a]">{certificate.traceabilityStatement ?? "Traceability statement placeholder."}</p>
          </DetailCard>
          <DetailCard title="Uncertainty">
            <p className="text-sm leading-6 text-[#64707a]">{certificate.uncertaintyStatement ?? "Uncertainty statement placeholder."}</p>
          </DetailCard>
          <DetailCard title="Statement of conformity">
            <p className="text-sm leading-6 text-[#64707a]">{certificate.statementOfConformity ?? "Statement of conformity placeholder."}</p>
          </DetailCard>
          <DetailCard title="Decision rule">
            <p className="text-sm leading-6 text-[#64707a]">{certificate.decisionRule ?? "Decision rule placeholder."}</p>
          </DetailCard>
        </div>

        <p className="mt-5 text-xs text-[#64707a]">
          Generated {formatDateTime(new Date())}. This is a Phase 3 draft certificate output and requires authorized technical review before issue.
        </p>
      </section>
    </div>
  );
}

