import { ActivityType } from "@prisma/client";

import { db } from "@/lib/db";
import { buildGeneratedWebsite, buildProjectSlug } from "@/features/websites/templates";
import { websiteProjectSchema, type WebsiteProjectInput } from "@/features/websites/schema";

function normalizeSocialLinks(input: WebsiteProjectInput) {
  return {
    linkedin: input.linkedinUrl || null,
    facebook: input.facebookUrl || null,
    instagram: input.instagramUrl || null,
  };
}

export async function saveWebsiteProject(rawInput: WebsiteProjectInput) {
  const input = websiteProjectSchema.parse(rawInput);

  const template = await db.projectTemplate.findUnique({
    where: { key: input.templateKey },
  });

  if (!template) {
    throw new Error("Project template not found.");
  }

  const client = await db.client.upsert({
    where: {
      name: input.clientName,
    },
    update: {
      industry: input.industry,
      serviceArea: input.serviceArea,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
    },
    create: {
      name: input.clientName,
      industry: input.industry,
      serviceArea: input.serviceArea,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
    },
  });

  const basePayload = {
    clientId: client.id,
    templateId: template.id,
    name: input.name,
    status: input.status,
    businessName: input.businessName,
    industry: input.industry,
    services: input.services,
    serviceArea: input.serviceArea,
    contactInfo: {
      email: input.contactEmail,
      phone: input.contactPhone,
      address: input.address,
    },
    brandSettings: {
      primary: input.brandPrimary,
      accent: input.brandAccent,
      neutral: input.brandNeutral,
      logoText: input.logoText,
    },
    socialLinks: normalizeSocialLinks(input),
    testimonials: input.testimonials,
    faqs: input.faqs,
    galleryImages: input.photos,
    generatedContent: buildGeneratedWebsite(input),
  };

  const project = input.id
    ? await db.websiteProject.update({
        where: { id: input.id },
        data: basePayload,
      })
    : await db.websiteProject.create({
        data: {
          ...basePayload,
          slug: buildProjectSlug(input),
        },
      });

  await db.activityLog.create({
    data: {
      type: input.id ? ActivityType.PROJECT_UPDATED : ActivityType.PROJECT_CREATED,
      entityType: "WebsiteProject",
      entityId: project.id,
      title: input.id ? "Project updated" : "Project created",
      description: `${input.id ? "Updated" : "Created"} website project ${project.name}.`,
      payload: { slug: project.slug, status: project.status },
    },
  });

  return project;
}
