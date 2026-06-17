import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";

import { Breadcrumbs, DetailCard } from "@/components/admin/ops-ui";
import { ProjectForm } from "@/components/website-builder/project-form";
import { requireRoles } from "@/features/admin/guards";
import { getProjectDetail } from "@/features/ops/queries";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRoles([UserRole.ADMIN, UserRole.SALES]);
  const { id } = await params;
  const project = await getProjectDetail(id);

  if (!project) notFound();

  const contactInfo = project.contactInfo as { email?: string; phone?: string; address?: string };
  const brandSettings = project.brandSettings as { primary?: string; accent?: string; neutral?: string; logoText?: string };
  const socialLinks = (project.socialLinks as { linkedin?: string; facebook?: string; instagram?: string } | null) ?? {};
  const testimonials = (project.testimonials as Array<{ quote: string; author: string; company: string }> | null) ?? [];
  const faqs = (project.faqs as Array<{ question: string; answer: string }> | null) ?? [];
  const photos = (project.galleryImages as string[] | null) ?? [];
  const services = (project.services as string[] | null) ?? [];

  return (
    <div className="space-y-4">
      <Breadcrumbs
        backHref="/admin/projects"
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Projects", href: "/admin/projects" },
          { label: project.name },
        ]}
      />
      <DetailCard title={`Edit ${project.name}`}>
        <ProjectForm
          initialValues={{
            id: project.id,
            name: project.name,
            clientName: project.client.name,
            businessName: project.businessName,
            industry: project.industry ?? "",
            serviceArea: project.serviceArea ?? "",
            contactEmail: contactInfo.email ?? "",
            contactPhone: contactInfo.phone ?? "",
            address: contactInfo.address ?? "",
            services: services.join("\n"),
            logoText: brandSettings.logoText ?? "",
            brandPrimary: brandSettings.primary ?? "#10212c",
            brandAccent: brandSettings.accent ?? "#c46a29",
            brandNeutral: brandSettings.neutral ?? "#f5efe4",
            linkedinUrl: socialLinks.linkedin ?? "",
            facebookUrl: socialLinks.facebook ?? "",
            instagramUrl: socialLinks.instagram ?? "",
            testimonials: testimonials.map((item) => `${item.quote} | ${item.author} | ${item.company}`).join("\n"),
            faqs: faqs.map((item) => `${item.question} | ${item.answer}`).join("\n"),
            photos: photos.join("\n"),
            status: project.status,
            templateKey: project.template.key,
          }}
        />
      </DetailCard>
    </div>
  );
}
