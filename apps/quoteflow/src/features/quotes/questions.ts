import {
  CALIBRATION_CATEGORY_OPTIONS,
  SERVICE_MODE_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  TURNAROUND_OPTIONS,
  type IntakeMode,
  type QuestionDefinition,
  type QuoteAnswerKey,
  type QuoteAnswers,
} from "@/features/quotes/types";

const CONTACT_QUESTIONS: QuestionDefinition[] = [
  {
    key: "contactName",
    prompt: "What is your name?",
    input: "text",
    placeholder: "Full name",
    helpText: "This is the person our team should contact about the quote.",
    required: true,
  },
  {
    key: "company",
    prompt: "What company are you with, if any?",
    input: "text",
    placeholder: "Company, organization, or your name",
    helpText: "If this is not for a company, enter your name or 'Individual'.",
    required: true,
  },
  {
    key: "email",
    prompt: "What email should we use for quote follow-up?",
    input: "email",
    placeholder: "name@company.com",
    required: true,
  },
  {
    key: "phone",
    prompt: "What phone number should we use if we need clarification?",
    input: "tel",
    placeholder: "(555) 555-5555",
  },
];

const GENERIC_QUESTIONS: QuestionDefinition[] = [
  {
    key: "serviceCategory",
    prompt: "What service category should this quote cover?",
    input: "text",
    placeholder: "Repair, inspection, maintenance, installation, field service, etc.",
    helpText: "One short category is enough. The next question captures the details.",
    required: true,
  },
  {
    key: "issueDescription",
    prompt: "Tell us what you need done.",
    input: "textarea",
    placeholder: "Describe the project, issue, symptoms, or work you want quoted.",
    required: true,
  },
  {
    key: "locationAddress",
    prompt: "Where is the service needed?",
    input: "text",
    placeholder: "Address, city, site name, remote, ship-in, or not sure",
    required: true,
  },
  {
    key: "requestedTurnaround",
    prompt: "When do you need service?",
    input: "select",
    options: TURNAROUND_OPTIONS,
    required: true,
  },
  {
    key: "targetCompletionDate",
    prompt: "What date do you need completed by?",
    input: "date",
    required: true,
  },
  ...CONTACT_QUESTIONS,
];

const AUTO_QUESTIONS: QuestionDefinition[] = [
  {
    key: "serviceCategory",
    prompt: "What do you need help with?",
    input: "text",
    placeholder: "Diagnostics, brakes, inspection, oil leak, electrical issue, etc.",
    required: true,
  },
  {
    key: "equipmentType",
    prompt: "Vehicle information",
    input: "text",
    placeholder: "Example: 2021 Ford F-150, fleet van #18, Toyota Camry",
    required: true,
  },
  {
    key: "issueDescription",
    prompt: "What problem or request do you need help with?",
    input: "textarea",
    placeholder: "Describe symptoms, warning lights, noise, maintenance needed, or inspection request.",
    required: true,
  },
  {
    key: "locationAddress",
    prompt: "Where is the vehicle or service location?",
    input: "text",
    placeholder: "Shop drop-off, address, city, or towing location",
    required: true,
  },
  {
    key: "requestedTurnaround",
    prompt: "When do you need service?",
    input: "select",
    options: TURNAROUND_OPTIONS,
    required: true,
  },
  {
    key: "targetCompletionDate",
    prompt: "What date do you need completed by?",
    input: "date",
    required: true,
  },
  ...CONTACT_QUESTIONS,
];

const FIELD_QUESTIONS: QuestionDefinition[] = [
  {
    key: "serviceCategory",
    prompt: "What field service or contractor work do you need?",
    input: "text",
    placeholder: "Repair, install, inspection, estimate, emergency service, etc.",
    required: true,
  },
  {
    key: "equipmentType",
    prompt: "What equipment, property area, or job site item needs service?",
    input: "text",
    placeholder: "HVAC unit, plumbing line, trailer, machine, roof section, etc.",
    required: true,
  },
  {
    key: "locationAddress",
    prompt: "What site location should the team plan around?",
    input: "text",
    placeholder: "Street address, site name, city, or service area",
    required: true,
  },
  {
    key: "requestedTurnaround",
    prompt: "How urgent is this work?",
    input: "select",
    options: TURNAROUND_OPTIONS,
    required: true,
  },
  {
    key: "targetCompletionDate",
    prompt: "What date do you need completed by?",
    input: "date",
    required: true,
  },
  {
    key: "issueDescription",
    prompt: "What should the technician or estimator know?",
    input: "textarea",
    placeholder: "Describe the work, access notes, symptoms, constraints, or timing.",
    required: true,
  },
  ...CONTACT_QUESTIONS,
];

const WEBSITE_QUESTIONS: QuestionDefinition[] = [
  {
    key: "projectType",
    prompt: "What kind of website or design help do you need?",
    input: "text",
    placeholder: "New website, redesign, landing page, quote form, branding, etc.",
    required: true,
  },
  {
    key: "company",
    prompt: "What business or brand is this for?",
    input: "text",
    placeholder: "Business name",
    required: true,
  },
  {
    key: "pagesNeeded",
    prompt: "What pages do you think you need?",
    input: "textarea",
    placeholder: "Home, services, about, contact, gallery, quote page, etc.",
    required: true,
  },
  {
    key: "desiredFeatures",
    prompt: "What features should the site include?",
    input: "textarea",
    placeholder: "Quote form, booking, payments, gallery, blog, service pages, etc.",
  },
  {
    key: "budgetTimeline",
    prompt: "What budget or timeline should we keep in mind?",
    input: "text",
    placeholder: "Example: launch this month, budget TBD, under $5k, etc.",
  },
  {
    key: "issueDescription",
    prompt: "Anything else we should know about the project?",
    input: "textarea",
    placeholder: "Goals, competitors, current website, style notes, or business priorities.",
    required: true,
  },
  {
    key: "contactName",
    prompt: "What is your name?",
    input: "text",
    placeholder: "Full name",
    required: true,
  },
  {
    key: "email",
    prompt: "What email should we use for quote follow-up?",
    input: "email",
    placeholder: "name@company.com",
    required: true,
  },
  {
    key: "phone",
    prompt: "What phone number should we use if we need clarification?",
    input: "tel",
    placeholder: "(555) 555-5555",
  },
];

const CALIBRATION_QUESTIONS: QuestionDefinition[] = [
  {
    key: "serviceCategory",
    prompt: "What type of calibration is this?",
    input: "select",
    options: CALIBRATION_CATEGORY_OPTIONS.map((option) => ({ label: option, value: option })),
    required: true,
  },
  {
    key: "equipmentType",
    prompt: "What type of instrument or equipment needs calibration?",
    input: "text",
    placeholder: "Pressure gauge, torque wrench, multimeter, load cell, etc.",
    required: true,
  },
  { key: "manufacturer", prompt: "What is the manufacturer?", input: "text", placeholder: "Fluke, Ashcroft, Norbar, Mitutoyo, etc." },
  { key: "modelNumber", prompt: "What is the model number?", input: "text", placeholder: "Model number" },
  { key: "serialNumber", prompt: "What is the serial number?", input: "text", placeholder: "Serial number" },
  { key: "rangeOrCapacity", prompt: "What is the range or capacity?", input: "text", placeholder: "0-300 psi, 10-200 ft-lb, 0-500 C, etc." },
  { key: "units", prompt: "What units does it use?", input: "text", placeholder: "psi, ft-lb, C, V, mm, etc." },
  { key: "unitCount", prompt: "How many units need service?", input: "number", placeholder: "1", required: true },
  {
    key: "documentationRequirements",
    prompt: "What documentation do you need?",
    input: "select",
    options: [
      { label: "ISO/IEC 17025 accredited", value: "ISO/IEC 17025 accredited calibration" },
      { label: "NIST traceable", value: "NIST traceable documentation" },
      { label: "Standard documentation", value: "Standard calibration documentation" },
      { label: "Not sure", value: "Not sure" },
    ],
    required: true,
  },
  {
    key: "serviceMode",
    prompt: "Is this in-lab, on-site, or ship-in?",
    input: "select",
    options: SERVICE_MODE_OPTIONS,
    required: true,
  },
  {
    key: "requestedTurnaround",
    prompt: "What turnaround do you need?",
    input: "select",
    options: TURNAROUND_OPTIONS,
    required: true,
  },
  {
    key: "targetCompletionDate",
    prompt: "What date do you need completed by?",
    input: "date",
    required: true,
  },
  {
    key: "issueDescription",
    prompt: "Any special instructions?",
    input: "textarea",
    placeholder: "Audit deadline, as-found/as-left needs, adjustment limits, handling notes, etc.",
    required: true,
  },
  ...CONTACT_QUESTIONS,
];

export function getServiceTypeLabel(serviceType?: string) {
  return SERVICE_TYPE_OPTIONS.find((option) => option.value === serviceType)?.label ?? "Service";
}

export function getIntakeModeLabel(mode?: IntakeMode) {
  return mode ? mode.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : "General";
}

export function getQuestionPlan(answers: QuoteAnswers): QuestionDefinition[] {
  if (answers.serviceType === "CALIBRATION" || answers.intakeMode === "CALIBRATION") {
    return CALIBRATION_QUESTIONS;
  }

  switch (answers.intakeMode) {
    case "AUTO":
      return AUTO_QUESTIONS;
    case "FIELD":
      return FIELD_QUESTIONS;
    case "REPAIR_SHOP":
      return GENERIC_QUESTIONS.map((question) =>
        question.key === "serviceCategory"
          ? { ...question, prompt: "What repair shop service do you need?", placeholder: "Bench repair, troubleshoot, rebuild, evaluation, etc." }
          : question,
      );
    case "WEBSITE":
      return WEBSITE_QUESTIONS;
    case "CUSTOM":
    case "GENERAL":
    default:
      return GENERIC_QUESTIONS;
  }
}

export function getSuggestedConversionPath(answers: QuoteAnswers) {
  if (answers.serviceType === "CALIBRATION" || answers.intakeMode === "CALIBRATION") {
    return "CalOps calibration work order";
  }

  if (answers.intakeMode === "WEBSITE") {
    return "Website Builder project";
  }

  if (answers.serviceType === "CUSTOM_SERVICE" && answers.projectType) {
    return "Quote review only";
  }

  return "General WorkFlow job";
}

export function isQuestionAnswered(
  value: QuoteAnswers[QuoteAnswerKey] | undefined,
  input: QuestionDefinition["input"],
) {
  if (typeof value === "number") return !Number.isNaN(value);

  if (input === "number") {
    return value !== undefined && value !== null && `${value}`.trim().length > 0;
  }

  return typeof value === "string" && value.trim().length > 0;
}

export function getNextQuestion(answers: QuoteAnswers) {
  if (!answers.serviceType) {
    const prompt =
      answers.intakeMode === "CALIBRATION"
        ? "What calibration service do you need?"
        : answers.intakeMode === "AUTO"
          ? "What auto repair or maintenance service do you need?"
          : answers.intakeMode === "WEBSITE"
            ? "What kind of website or design service do you need?"
            : "What type of service do you need?";

    return {
      key: "serviceType",
      prompt,
      input: "select",
      options: SERVICE_TYPE_OPTIONS,
      helpText: "Choose the closest match. The next questions will adapt to the type of work.",
      required: true,
    } satisfies QuestionDefinition;
  }

  return getQuestionPlan(answers).find((question) => {
    if (question.key === "targetCompletionDate" && answers.requestedTurnaround !== "By a specific date") {
      return false;
    }

    if (question.required === false) {
      return false;
    }

    return !isQuestionAnswered(answers[question.key], question.input);
  });
}
