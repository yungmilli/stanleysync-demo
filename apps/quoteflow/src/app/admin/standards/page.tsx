import Link from "next/link";

import { AdminSection, DuePill, StatusBadge } from "@/components/admin/ops-ui";
import { requireCalOpsAccess } from "@/features/admin/guards";
import { getCalibrationStandardsList } from "@/features/calops/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StandardsPage() {
  await requireCalOpsAccess();
  const standards = await getCalibrationStandardsList();
  const now = new Date();

  return (
    <div className="space-y-4">
      <AdminSection
        title="Standards registry"
        description="Track reference standards, traceability, certificate numbers, due dates, uncertainty, linked procedures, and work-order usage."
      />

      <section className="grid gap-3 md:grid-cols-3">
        <div className="app-panel rounded-[0.95rem] p-3.5">
          <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">Standards due soon</p>
          <p className="mt-1.5 text-[1.55rem] font-semibold">{standards.filter((standard) => standard.dueDate && standard.dueDate >= now).length}</p>
        </div>
        <div className="app-panel rounded-[0.95rem] p-3.5">
          <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">Overdue standards</p>
          <p className="mt-1.5 text-[1.55rem] font-semibold text-[#9e4f18]">{standards.filter((standard) => standard.dueDate && standard.dueDate < now).length}</p>
        </div>
        <div className="app-panel rounded-[0.95rem] p-3.5">
          <p className="text-[0.72rem] uppercase tracking-[0.1em] text-[#64707a]">Usage links</p>
          <p className="mt-1.5 text-[1.55rem] font-semibold">{standards.reduce((total, standard) => total + standard.workOrderLinks.length, 0)}</p>
        </div>
      </section>

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Standard</th>
              <th>Traceability</th>
              <th>Cert number</th>
              <th>Due date</th>
              <th>Uncertainty</th>
              <th>Procedures</th>
              <th>Usage</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {standards.map((standard) => (
              <tr key={standard.id}>
                <td>
                  <p className="font-medium">{standard.standardId}</p>
                  <p className="mt-1 text-xs text-[#64707a]">{standard.description}</p>
                </td>
                <td>{standard.traceabilitySource ?? "Not set"}</td>
                <td>{standard.certNumber ?? "Not set"}</td>
                <td>
                  <div className="space-y-1">
                    <DuePill date={standard.dueDate} />
                    <p className="text-xs text-[#64707a]">{formatDate(standard.dueDate)}</p>
                  </div>
                </td>
                <td>{standard.uncertainty ?? "Not set"}</td>
                <td><StatusBadge label={String(standard.procedures.length)} tone="neutral" /></td>
                <td>{standard.workOrderLinks.length}</td>
                <td>
                  <Link href={`/admin/standards/${standard.id}`} className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium">
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

