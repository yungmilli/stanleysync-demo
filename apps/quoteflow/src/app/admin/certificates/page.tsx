import Link from "next/link";

import { AdminSection, StatusBadge } from "@/components/admin/ops-ui";
import { requireCalOpsAccess } from "@/features/admin/guards";
import { getCertificateDraftsList } from "@/features/calops/queries";
import { formatDateTime, sentenceCase } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  await requireCalOpsAccess();
  const certificates = await getCertificateDraftsList();

  return (
    <div className="space-y-4">
      <AdminSection
        title="Certificate drafts"
        description="MVP calibration certificate package drafts generated from completed or review-ready work orders."
      />

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Certificate</th>
              <th>Customer</th>
              <th>Asset</th>
              <th>Work order</th>
              <th>Status</th>
              <th>Result</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {certificates.map((certificate) => (
              <tr key={certificate.id}>
                <td className="font-medium">{certificate.certificateNumber}</td>
                <td>{certificate.customer.company}</td>
                <td>{certificate.asset?.assetId ?? "Package"}</td>
                <td>{certificate.workOrder.woNumber}</td>
                <td><StatusBadge label={sentenceCase(certificate.status)} tone="neutral" /></td>
                <td>{certificate.passFail ?? "Pending"}</td>
                <td>{formatDateTime(certificate.updatedAt)}</td>
                <td>
                  <Link href={`/admin/certificates/${certificate.id}`} className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

