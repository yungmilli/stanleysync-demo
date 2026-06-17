import Link from "next/link";
import { UserRole } from "@prisma/client";

import { AdminSection, EmptyState, StatusBadge } from "@/components/admin/ops-ui";
import { requireRoles } from "@/features/admin/guards";
import { getProjectsList } from "@/features/ops/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  await requireRoles([UserRole.ADMIN, UserRole.SALES]);
  const projects = await getProjectsList();

  return (
    <div className="space-y-4">
      <AdminSection
        title="Website-builder projects"
        description="Internal project records for generated starter websites tied to service-business customers."
        action={
          <Link href="/admin/projects/new" className="rounded-full bg-[#c46a29] px-4 py-2 text-sm font-medium text-white">
            New project
          </Link>
        }
      />

      {projects.length === 0 ? (
        <EmptyState title="No website projects yet" body="Create a builder record to generate a starter service-business site." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {projects.map((project) => (
            <section key={project.id} className="app-panel rounded-[1rem] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold">{project.name}</h2>
                  <p className="mt-1 text-sm text-[#64707a]">
                    {project.businessName} • {project.client.name}
                  </p>
                </div>
                <StatusBadge label={project.status} tone={project.status === "PUBLISHED" ? "success" : "neutral"} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#64707a]">
                <span>Template: {project.template.name}</span>
                <span>•</span>
                <span>Updated {formatDate(project.updatedAt)}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/admin/projects/${project.id}`} className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-sm">
                  Open record
                </Link>
                <Link href={`/sites/${project.slug}`} className="rounded-full border border-[#12212c]/10 px-3 py-1.5 text-sm">
                  Preview site
                </Link>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
