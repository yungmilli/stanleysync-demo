import { slugify } from "@/lib/utils";
import type { WebsiteProjectInput } from "@/features/websites/schema";

export function buildGeneratedWebsite(input: WebsiteProjectInput) {
  return {
    hero: {
      eyebrow: `${input.industry} support`,
      headline: `${input.businessName} helps local customers book service without the friction.`,
      subheadline: `Use this starter site to present ${input.services.slice(0, 3).join(", ").toLowerCase()} with clear trust signals, responsive contact details, and a quote-first CTA.`,
      cta: "Request a quote",
    },
    about: {
      title: `Built for ${input.serviceArea}`,
      body: `${input.businessName} serves ${input.serviceArea} with ${input.services[0]?.toLowerCase() ?? "specialized service"} and related field support. This section is generated from structured project data so it can be edited quickly later.`,
    },
    services: {
      title: "Services",
      items: input.services,
    },
    quote: {
      title: "Need pricing or service availability?",
      body: "Send a guided request and capture the details your team needs to respond quickly.",
    },
    testimonials: {
      title: "What customers say",
      items: input.testimonials,
    },
    faq: {
      title: "FAQ",
      items: input.faqs,
    },
    footer: {
      businessName: input.businessName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      address: input.address,
    },
  };
}

export function buildProjectSlug(input: Pick<WebsiteProjectInput, "businessName">) {
  return slugify(input.businessName);
}
