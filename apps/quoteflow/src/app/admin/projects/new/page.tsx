import { UserRole } from "@prisma/client";

import { Breadcrumbs, DetailCard } from "@/components/admin/ops-ui";
import { ProjectForm } from "@/components/website-builder/project-form";
import { requireRoles } from "@/features/admin/guards";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  await requireRoles([UserRole.ADMIN, UserRole.SALES]);

  return (
    <div className="space-y-4">
      <Breadcrumbs
        backHref="/admin/projects"
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Projects", href: "/admin/projects" },
          { label: "New project" },
        ]}
      />
      <DetailCard title="Create website-builder project">
        <ProjectForm />
      </DetailCard>
    </div>
  );
}
