import { ServiceType, type InternalNote, type QuoteRequest, type ServiceMode, type Customer } from "@prisma/client";

type QuoteForDraft = QuoteRequest & {
  customer: Customer;
  internalNotes?: InternalNote[];
};

function getCalibrationCategory(serviceType: ServiceType, equipmentType?: string | null) {
  if (serviceType !== ServiceType.CALIBRATION) {
    return null;
  }

  return equipmentType?.trim() || "General calibration";
}

function getInternalNotesSummary(notes: InternalNote[] | undefined, fallback?: string | null) {
  if (notes && notes.length > 0) {
    return notes
      .slice(0, 5)
      .map((note) => note.body.trim())
      .filter(Boolean)
      .join("\n\n");
  }

  return fallback?.trim() || null;
}

function serviceModeLabel(serviceMode?: ServiceMode | null) {
  if (!serviceMode) {
    return null;
  }

  return serviceMode;
}

export function buildWorkOrderDraftPayload(quote: QuoteForDraft) {
  const internalNotesSummary = getInternalNotesSummary(quote.internalNotes, quote.adminNotes);

  return {
    source: {
      module: "QuoteFlow",
      quoteRequestId: quote.id,
      quoteNumber: quote.quoteNumber,
      submittedAt: quote.submittedAt.toISOString(),
    },
    customer: {
      customerId: quote.customer.id,
      customerRef: quote.customer.customerRef,
      company: quote.customer.company,
      contactName: quote.customer.mainContact,
      contactEmail: quote.customer.email,
      contactPhone: quote.customer.phone,
      address: quote.customer.address,
    },
    service: {
      requestedServiceType: quote.serviceType,
      calibrationCategory: getCalibrationCategory(quote.serviceType, quote.equipmentType),
      serviceMode: serviceModeLabel(quote.serviceMode),
      requestedTurnaround: quote.requestedTurnaround,
      documentationRequirements: quote.documentationRequirements,
      priority: quote.priority,
      suggestedPriority: quote.suggestedPriority,
      suggestedTicketType: quote.suggestedTicketType,
    },
    equipment: {
      equipmentType: quote.equipmentType,
      manufacturer: quote.manufacturer,
      modelNumber: quote.modelNumber,
      serialNumber: quote.serialNumber,
      unitCount: quote.unitCount,
      rangeOrCapacity: quote.rangeOrCapacity,
      units: quote.units,
    },
    notes: {
      customerNotes: quote.issueDescription,
      internalNotesSummary,
      aiSummary: quote.aiSummary,
    },
    transcript: quote.transcript,
    extractedFields: quote.extractedFields,
    structuredSummary: quote.structuredSummary,
  };
}

export function buildWorkOrderDraftCreateData(quote: QuoteForDraft) {
  const payload = buildWorkOrderDraftPayload(quote);

  return {
    requestedServiceType: quote.serviceType,
    calibrationCategory: payload.service.calibrationCategory,
    serviceMode: quote.serviceMode,
    companyName: quote.customer.company,
    contactName: quote.customer.mainContact,
    contactEmail: quote.customer.email,
    contactPhone: quote.customer.phone,
    equipmentType: quote.equipmentType,
    manufacturer: quote.manufacturer,
    modelNumber: quote.modelNumber,
    serialNumber: quote.serialNumber,
    unitCount: quote.unitCount,
    rangeOrCapacity: quote.rangeOrCapacity,
    units: quote.units,
    requestedTurnaround: quote.requestedTurnaround,
    documentationRequirements: quote.documentationRequirements,
    customerNotes: quote.issueDescription,
    internalNotesSummary: payload.notes.internalNotesSummary,
    exportPayload: payload,
  };
}
