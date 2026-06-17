import { z } from "zod";

import { CALIBRATION_CATEGORY_OPTIONS } from "@/features/quotes/types";

export const quoteAnswersSchema = z.object({
  intakeMode: z.enum(["GENERAL", "AUTO", "FIELD", "REPAIR_SHOP", "WEBSITE", "CALIBRATION", "CUSTOM"]).optional().default("GENERAL"),
  serviceType: z.enum(["CALIBRATION", "REPAIR", "CUSTOM_SERVICE", "OTHER"]),
  contactName: z.string().min(2),
  company: z.string().min(2),
  email: z.email(),
  phone: z.string().optional().default(""),
  equipmentType: z.string().optional().default(""),
  vehicleYear: z.string().optional().default(""),
  vehicleMake: z.string().optional().default(""),
  vehicleModel: z.string().optional().default(""),
  projectType: z.string().optional().default(""),
  pagesNeeded: z.string().optional().default(""),
  desiredFeatures: z.string().optional().default(""),
  budgetTimeline: z.string().optional().default(""),
  manufacturer: z.string().optional().default(""),
  modelNumber: z.string().optional().default(""),
  serialNumber: z.string().optional().default(""),
  unitCount: z.coerce.number().int().positive().optional().default(1),
  rangeOrCapacity: z.string().optional().default(""),
  units: z.string().optional().default(""),
  requestedTurnaround: z.string().optional().default("Standard"),
  serviceMode: z.enum(["IN_LAB", "ON_SITE", "SHIP_IN"]).optional().default("ON_SITE"),
  documentationRequirements: z.string().optional().default(""),
  issueDescription: z.string().min(8),
  serviceCategory: z.enum(CALIBRATION_CATEGORY_OPTIONS).or(z.string().min(1)).optional().default("General service"),
  locationAddress: z.string().optional().default(""),
  targetCompletionDate: z.string().optional().default(""),
  workspaceKey: z.string().optional().default(""),
});

export const quoteConversationSchema = z.object({
  answers: z.record(z.string(), z.unknown()).default({}),
  transcript: z
    .array(
      z.object({
        role: z.enum(["assistant", "user"]),
        content: z.string(),
      }),
    )
    .default([]),
});
