import { getServiceTypeLabel, getSuggestedConversionPath } from "@/features/quotes/questions";
import type { IntakeAnalysis, QuoteAnswers } from "@/features/quotes/types";

function defaultPriority(answers: QuoteAnswers): IntakeAnalysis["suggestedPriority"] {
  const requestedTurnaround = answers.requestedTurnaround?.toLowerCase() ?? "";
  const docs = answers.documentationRequirements?.toLowerCase() ?? "";
  const issue = answers.issueDescription?.toLowerCase() ?? "";

  if (
    requestedTurnaround.includes("rush") ||
    requestedTurnaround.includes("specific") ||
    docs.includes("audit") ||
    issue.includes("down") ||
    issue.includes("urgent")
  ) {
    return "HIGH";
  }

  return "NORMAL";
}

function defaultTicketType(answers: QuoteAnswers): IntakeAnalysis["suggestedTicketType"] {
  if (answers.serviceType === "CALIBRATION") return "CALIBRATION";
  if (answers.serviceType === "REPAIR") return "REPAIR";
  if (answers.serviceMode === "ON_SITE") return "FIELD_SERVICE";
  if (answers.serviceType === "CUSTOM_SERVICE") return "CUSTOM_SERVICE";
  return "OTHER";
}

export function buildQuoteSummary(answers: QuoteAnswers) {
  const serviceType = getServiceTypeLabel(answers.serviceType);
  const serviceMode =
    answers.serviceMode === "IN_LAB"
      ? "in-lab"
      : answers.serviceMode === "ON_SITE"
        ? "on-site"
        : answers.serviceMode === "SHIP_IN"
          ? "ship-in"
          : "service mode not specified";

  const item =
    answers.equipmentType ||
    [answers.vehicleYear, answers.vehicleMake, answers.vehicleModel].filter(Boolean).join(" ") ||
    answers.projectType ||
    "work request";
  const extra =
    answers.intakeMode === "WEBSITE"
      ? ` Pages: ${answers.pagesNeeded ?? "not specified"}. Features: ${answers.desiredFeatures ?? "not specified"}. Budget/timeline: ${answers.budgetTimeline ?? "not specified"}.`
      : answers.intakeMode === "AUTO"
        ? ` Vehicle: ${[answers.vehicleYear, answers.vehicleMake, answers.vehicleModel].filter(Boolean).join(" ") || "not specified"}.`
        : "";

  if (answers.serviceType !== "CALIBRATION" && answers.intakeMode !== "CALIBRATION") {
    const location = answers.locationAddress ? ` Location: ${answers.locationAddress}.` : "";
    return `${serviceType} request for ${item} from ${answers.company ?? "the customer"}.${extra}${location} Requested timing: ${answers.requestedTurnaround ?? "Standard"}. Notes: ${answers.issueDescription ?? "No additional notes provided."}`;
  }

  return `${serviceType} request for ${answers.unitCount ?? 1} ${item} from ${answers.company ?? "the customer"}.${extra} Manufacturer ${answers.manufacturer ?? "n/a"}, model ${answers.modelNumber ?? "n/a"}, serial ${answers.serialNumber ?? "n/a"}. Range or capacity: ${answers.rangeOrCapacity ?? "n/a"} ${answers.units ?? ""}. Requested turnaround: ${answers.requestedTurnaround ?? "Standard"}. Service mode: ${serviceMode}. Documentation: ${answers.documentationRequirements ?? "not specified"}. Notes: ${answers.issueDescription ?? "No additional notes provided."}`;
}

export function buildStructuredSummary(answers: QuoteAnswers): IntakeAnalysis {
  return {
    summary: buildQuoteSummary(answers),
    extractedFields: {
      serviceCategory: answers.serviceCategory ?? null,
      equipmentType: answers.equipmentType ?? null,
      manufacturer: answers.manufacturer ?? null,
      modelNumber: answers.modelNumber ?? null,
      serialNumber: answers.serialNumber ?? null,
      unitCount: answers.unitCount ?? null,
      rangeOrCapacity: answers.rangeOrCapacity ?? null,
      units: answers.units ?? null,
      requestedTurnaround: answers.requestedTurnaround ?? null,
      documentationRequirements: answers.documentationRequirements ?? null,
      issueDescription: answers.issueDescription ?? null,
      vehicleYear: answers.vehicleYear ?? null,
      vehicleMake: answers.vehicleMake ?? null,
      vehicleModel: answers.vehicleModel ?? null,
      projectType: answers.projectType ?? null,
      pagesNeeded: answers.pagesNeeded ?? null,
      desiredFeatures: answers.desiredFeatures ?? null,
      budgetTimeline: answers.budgetTimeline ?? null,
    },
    structuredData: {
      contact: {
        name: answers.contactName ?? null,
        company: answers.company ?? null,
        email: answers.email ?? null,
        phone: answers.phone ?? null,
      },
      service: {
        serviceType: getServiceTypeLabel(answers.serviceType),
        serviceMode: answers.serviceMode ?? null,
        category: answers.serviceCategory ?? null,
        requestedTurnaround: answers.requestedTurnaround ?? null,
        documentationRequirements: answers.documentationRequirements ?? null,
      },
      equipment: {
        type: answers.equipmentType ?? null,
        manufacturer: answers.manufacturer ?? null,
        modelNumber: answers.modelNumber ?? null,
        serialNumber: answers.serialNumber ?? null,
        unitCount: answers.unitCount ?? null,
        rangeOrCapacity: answers.rangeOrCapacity ?? null,
        units: answers.units ?? null,
      },
      notes: {
        issueDescription: answers.issueDescription ?? null,
        locationAddress: answers.locationAddress ?? null,
        budgetTimeline: `${answers.budgetTimeline ?? ""} Suggested conversion: ${getSuggestedConversionPath(answers)}`.trim(),
      },
    },
    suggestedPriority: defaultPriority(answers),
    suggestedTicketType: defaultTicketType(answers),
  };
}
