import { z } from "zod";

export const websiteProjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  clientName: z.string().min(2),
  businessName: z.string().min(2),
  industry: z.string().min(2),
  serviceArea: z.string().min(2),
  contactEmail: z.email(),
  contactPhone: z.string().min(7),
  address: z.string().min(4),
  services: z.array(z.string().min(1)).min(1),
  logoText: z.string().min(1),
  brandPrimary: z.string().min(4),
  brandAccent: z.string().min(4),
  brandNeutral: z.string().min(4),
  linkedinUrl: z.url().optional().or(z.literal("")),
  facebookUrl: z.url().optional().or(z.literal("")),
  instagramUrl: z.url().optional().or(z.literal("")),
  testimonials: z
    .array(
      z.object({
        quote: z.string().min(1),
        author: z.string().min(1),
        company: z.string().min(1),
      }),
    )
    .default([]),
  faqs: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      }),
    )
    .default([]),
  photos: z.array(z.url()).default([]),
  templateKey: z.string().min(1).default("local-service-classic"),
  status: z.enum(["DRAFT", "READY", "PUBLISHED"]).default("DRAFT"),
});

export type WebsiteProjectInput = z.infer<typeof websiteProjectSchema>;
