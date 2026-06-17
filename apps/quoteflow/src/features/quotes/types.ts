export const SERVICE_TYPE_OPTIONS = [
  { label: "Calibration", value: "CALIBRATION" },
  { label: "Repair", value: "REPAIR" },
  { label: "Custom service", value: "CUSTOM_SERVICE" },
  { label: "Other", value: "OTHER" },
] as const;

export const INTAKE_MODE_OPTIONS = [
  { label: "General service", value: "GENERAL" },
  { label: "Auto repair", value: "AUTO" },
  { label: "Contractor / field service", value: "FIELD" },
  { label: "Repair shop", value: "REPAIR_SHOP" },
  { label: "Website / design", value: "WEBSITE" },
  { label: "Calibration lab", value: "CALIBRATION" },
  { label: "Custom business", value: "CUSTOM" },
] as const;

export const SERVICE_MODE_OPTIONS = [
  { label: "In-lab", value: "IN_LAB" },
  { label: "On-site", value: "ON_SITE" },
  { label: "Ship-in", value: "SHIP_IN" },
] as const;

export const CALIBRATION_CATEGORY_OPTIONS = [
  "Pressure",
  "Torque",
  "Temperature",
  "Dimensional",
  "Electrical",
  "Mass",
  "Flow",
  "Force",
  "Other",
] as const;

export const TURNAROUND_OPTIONS = [
  { label: "Standard", value: "Standard" },
  { label: "Rush", value: "Rush" },
  { label: "By a specific date", value: "By a specific date" },
] as const;

export type ServiceType = (typeof SERVICE_TYPE_OPTIONS)[number]["value"];
export type IntakeMode = (typeof INTAKE_MODE_OPTIONS)[number]["value"];
export type ServiceMode = (typeof SERVICE_MODE_OPTIONS)[number]["value"];

export type QuoteAnswerKey =
  | "intakeMode"
  | "serviceType"
  | "contactName"
  | "company"
  | "email"
  | "phone"
  | "equipmentType"
  | "vehicleYear"
  | "vehicleMake"
  | "vehicleModel"
  | "projectType"
  | "pagesNeeded"
  | "desiredFeatures"
  | "budgetTimeline"
  | "manufacturer"
  | "modelNumber"
  | "serialNumber"
  | "unitCount"
  | "rangeOrCapacity"
  | "units"
  | "requestedTurnaround"
  | "serviceMode"
  | "documentationRequirements"
  | "issueDescription"
  | "serviceCategory"
  | "locationAddress"
  | "targetCompletionDate"
  | "workspaceKey";

export type QuoteAnswers = Partial<{
  intakeMode: IntakeMode;
  serviceType: ServiceType;
  contactName: string;
  company: string;
  email: string;
  phone: string;
  equipmentType: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  projectType: string;
  pagesNeeded: string;
  desiredFeatures: string;
  budgetTimeline: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  unitCount: number;
  rangeOrCapacity: string;
  units: string;
  requestedTurnaround: string;
  serviceMode: ServiceMode;
  documentationRequirements: string;
  issueDescription: string;
  serviceCategory: string;
  locationAddress: string;
  targetCompletionDate: string;
  workspaceKey: string;
}>;

export type ConversationMessage = {
  role: "assistant" | "user";
  content: string;
};

export type QuestionDefinition = {
  key: QuoteAnswerKey;
  prompt: string;
  input:
    | "text"
    | "textarea"
    | "email"
    | "tel"
    | "number"
    | "date"
    | "select";
  placeholder?: string;
  helpText?: string;
  options?: ReadonlyArray<{ label: string; value: string }>;
  required?: boolean;
};

export type IntakeAnalysis = {
  summary: string;
  extractedFields: {
    serviceCategory?: string | null;
    equipmentType?: string | null;
    manufacturer?: string | null;
    modelNumber?: string | null;
    serialNumber?: string | null;
    unitCount?: number | null;
    rangeOrCapacity?: string | null;
    units?: string | null;
    requestedTurnaround?: string | null;
    documentationRequirements?: string | null;
    issueDescription?: string | null;
    vehicleYear?: string | null;
    vehicleMake?: string | null;
    vehicleModel?: string | null;
    projectType?: string | null;
    pagesNeeded?: string | null;
    desiredFeatures?: string | null;
    budgetTimeline?: string | null;
  };
  structuredData: {
    contact: {
      name?: string | null;
      company?: string | null;
      email?: string | null;
      phone?: string | null;
    };
    service: {
      serviceType?: string | null;
      serviceMode?: string | null;
      category?: string | null;
      requestedTurnaround?: string | null;
      documentationRequirements?: string | null;
    };
    equipment: {
      type?: string | null;
      manufacturer?: string | null;
      modelNumber?: string | null;
      serialNumber?: string | null;
      unitCount?: number | null;
      rangeOrCapacity?: string | null;
      units?: string | null;
    };
    notes: {
      issueDescription?: string | null;
      locationAddress?: string | null;
      budgetTimeline?: string | null;
    };
  };
  suggestedPriority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  suggestedTicketType:
    | "CALIBRATION"
    | "REPAIR"
    | "FIELD_SERVICE"
    | "CUSTOM_SERVICE"
    | "OTHER";
};
