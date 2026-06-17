import Link from "next/link";

import { AdminSection, StatusBadge } from "@/components/admin/ops-ui";
import { requireCalOpsAccess } from "@/features/admin/guards";
import { getCalibrationProceduresList } from "@/features/calops/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProceduresPage() {
  await requireCalOpsAccess();
  const procedures = await getCalibrationProceduresList();

  return (
    <div className="space-y-4">
      <AdminSection
        title="Procedure library"
        description="Controlled calibration procedures with revisions, disciplines, linked standards, uncertainty references, and assigned assets."
      />

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Procedure</th>
              <th>Discipline</th>
              <th>Revision</th>
              <th>Issue date</th>
              <th>Standards</th>
              <th>Assets</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {procedures.map((procedure) => (
              <tr key={procedure.id}>
                <td>
                  <p className="font-medium">{procedure.procedureNumber}</p>
                  <p className="mt-1 text-xs text-[#64707a]">{procedure.title}</p>
                </td>
                <td>{procedure.discipline}</td>
                <td>{procedure.revision}</td>
                <td>{formatDate(procedure.controlledIssueDate)}</td>
                <td>{procedure.standards.length}</td>
                <td>{procedure.assets.length}</td>
                <td><StatusBadge label={procedure.isActive ? "Active" : "Inactive"} tone={procedure.isActive ? "success" : "neutral"} /></td>
                <td>
                  <Link href={`/admin/procedures/${procedure.id}`} className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-xs font-medium">
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

