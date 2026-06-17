import bcrypt from "bcryptjs";
import {
  ActivityType,
  AssetHistoryType,
  AssetStatus,
  AssetType,
  BusinessType,
  CalibrationDecision,
  CalibrationWorkOrderStatus,
  CalServiceType,
  ExportPackageType,
  IdeaStatus,
  IntegrationExportStatus,
  InvoiceStatus,
  NotificationEventType,
  NotificationStatus,
  Priority,
  RecallStatus,
  ProjectStatus,
  QuoteStatus,
  ServiceMode,
  ServiceType,
  TicketStatus,
  TicketType,
  UserRole,
  WorkOrderDraftStatus,
  PrismaClient,
} from "@prisma/client";

import { calculateTicketFinancials } from "@/lib/utils";

const prisma = new PrismaClient();

async function seedProjectData() {
  const template = await prisma.projectTemplate.upsert({
    where: { key: "local-service-classic" },
    update: {},
    create: {
      key: "local-service-classic",
      name: "Local Service Classic",
      description: "Compact service-business starter with proof sections and quote CTA.",
      category: "local-services",
      config: {
        sections: ["hero", "about", "services", "quote", "testimonials", "faq", "footer"],
      },
    },
  });

  const client = await prisma.client.upsert({
    where: { name: "StanleySync Service Demo" },
    update: {
      industry: "Service business operations",
      serviceArea: "Mid-Atlantic",
      contactEmail: "hello@stanleysync.app",
      contactPhone: "(555) 221-1030",
      notes: "Seed website-builder client for customer demos.",
    },
    create: {
      name: "StanleySync Service Demo",
      industry: "Service business operations",
      serviceArea: "Mid-Atlantic",
      contactEmail: "hello@stanleysync.app",
      contactPhone: "(555) 221-1030",
      notes: "Seed website-builder client for customer demos.",
    },
  });

  await prisma.websiteProject.upsert({
    where: { slug: "precision-field-services" },
    update: {
      name: "StanleySync Service Demo Site",
      businessName: "StanleySync",
      industry: "Service business operating platform",
      services: ["Guided quote intake", "WorkFlow jobs", "Invoices", "PDF exports"],
      contactInfo: {
        email: "hello@stanleysync.app",
        phone: "(555) 221-1030",
        address: "102 Foundry Lane, Wilmington, DE",
      },
      brandSettings: {
        primary: "#10212c",
        accent: "#c46a29",
        neutral: "#f5efe4",
        logoText: "StanleySync",
      },
    },
    create: {
      clientId: client.id,
      templateId: template.id,
      name: "StanleySync Service Demo Site",
      slug: "precision-field-services",
      status: ProjectStatus.READY,
      businessName: "StanleySync",
      industry: "Service business operating platform",
      services: ["Guided quote intake", "WorkFlow jobs", "Invoices", "PDF exports"],
      serviceArea: "Pennsylvania, New Jersey, Delaware",
      contactInfo: {
        email: "hello@stanleysync.app",
        phone: "(555) 221-1030",
        address: "102 Foundry Lane, Wilmington, DE",
      },
      brandSettings: {
        primary: "#10212c",
        accent: "#c46a29",
        neutral: "#f5efe4",
        logoText: "StanleySync",
      },
      socialLinks: {
        linkedin: "https://linkedin.com",
        facebook: "https://facebook.com",
      },
      testimonials: [
        {
          quote: "Their turnaround and documentation quality helped us pass two audits without rework.",
          author: "Operations Manager",
          company: "Servo Innovations",
        },
      ],
      faqs: [
        {
          question: "Do you offer on-site calibration?",
          answer: "Yes. We support scheduled on-site visits and ship-in work.",
        },
      ],
      galleryImages: [],
      generatedContent: {
        hero: {
          eyebrow: "Calibration and field service",
          headline: "Reliable calibration support without the back-and-forth.",
          subheadline:
            "Service teams use StanleySync for fast intake, clear turnaround expectations, and clean documentation.",
          cta: "Request a quote",
        },
        about: {
          title: "Built for plants, labs, and service departments",
          body: "This starter site is generated from structured project data so it can be edited quickly and handed off fast.",
        },
        services: {
          title: "Services",
          items: ["Torque calibration", "Pressure calibration", "Repair intake"],
        },
        quote: {
          title: "Need pricing or scheduling?",
          body: "Send a guided intake request and capture the details your operations team needs to respond quickly.",
        },
        testimonials: {
          title: "What customers say",
          items: [
            {
              quote: "The documentation was clean and the communication was faster than our prior vendor.",
              author: "QA Manager",
              company: "Harbor Fleet Services",
            },
          ],
        },
        faq: {
          title: "FAQ",
          items: [
            {
              question: "Can you support ship-in and on-site work?",
              answer: "Yes. We can quote both modes depending on schedule and scope.",
            },
          ],
        },
        footer: {
          businessName: "StanleySync",
          contactEmail: "hello@stanleysync.app",
          contactPhone: "(555) 221-1030",
          address: "102 Foundry Lane, Wilmington, DE",
        },
      },
    },
  });
}

async function createCustomer(input: {
  customerRef: string;
  company: string;
  mainContact: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
}) {
  return prisma.customer.upsert({
    where: { customerRef: input.customerRef },
    update: input,
    create: input,
  });
}

async function createUser(input: {
  name: string;
  email: string;
  role: UserRole;
  password: string;
}) {
  const passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.user.upsert({
    where: { email: input.email.toLowerCase() },
    update: {
      name: input.name,
      role: input.role,
      passwordHash,
      isActive: true,
    },
    create: {
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
      passwordHash,
      isActive: true,
    },
  });
}

async function seedBusinessWorkspaces() {
  const general = await prisma.businessWorkspace.upsert({
    where: { workspaceKey: "general-service-demo" },
    update: {
      businessName: "StanleySync App",
      businessType: BusinessType.GENERAL_SERVICE,
      industry: "General business operations",
      serviceCategories: ["Quotes", "Customers", "Jobs", "Invoices", "PDFs"],
      email: "hello@stanleysync.app",
      phone: "(555) 221-1030",
      website: "https://stanleysync.app",
      address: "102 Foundry Lane, Wilmington, DE",
      logoPlaceholder: "APP",
      quoteTerms: "Quote is valid for 30 days unless otherwise stated. Pricing is subject to final inspection, schedule availability, and written approval.",
      invoiceTerms: "Payment due by the listed due date. Please reference the invoice number with payment.",
      setupCompletedAt: new Date(),
      themeAccent: "#c46a29",
      brandColors: { primary: "#12212c", accent: "#c46a29" },
      enabledModules: ["QuoteFlow", "WorkFlow", "SiteBuilder"],
      isActive: true,
    },
    create: {
      workspaceKey: "general-service-demo",
      businessName: "StanleySync App",
      businessType: BusinessType.GENERAL_SERVICE,
      industry: "General business operations",
      serviceCategories: ["Quotes", "Customers", "Jobs", "Invoices", "PDFs"],
      email: "hello@stanleysync.app",
      phone: "(555) 221-1030",
      website: "https://stanleysync.app",
      address: "102 Foundry Lane, Wilmington, DE",
      logoPlaceholder: "APP",
      quoteTerms: "Quote is valid for 30 days unless otherwise stated. Pricing is subject to final inspection, schedule availability, and written approval.",
      invoiceTerms: "Payment due by the listed due date. Please reference the invoice number with payment.",
      setupCompletedAt: new Date(),
      themeAccent: "#c46a29",
      brandColors: { primary: "#12212c", accent: "#c46a29" },
      enabledModules: ["QuoteFlow", "WorkFlow", "SiteBuilder"],
      isActive: true,
    },
  });

  const auto = await prisma.businessWorkspace.upsert({
    where: { workspaceKey: "auto-repair-demo" },
    update: {
      businessName: "StanleySync Demo",
      businessType: BusinessType.AUTO_REPAIR,
      industry: "Demo environment",
      serviceCategories: ["Demo quotes", "Demo jobs", "Demo invoices", "PDF exports"],
      email: "auto@stanleysync.app",
      phone: "(555) 884-2040",
      website: "https://stanleysync.app/auto",
      address: "18 Harbor Road, Newark, DE",
      logoPlaceholder: "DEM",
      quoteTerms: "Demo quotes are for StanleySync tester evaluation only.",
      invoiceTerms: "Demo invoices are not payable and are provided for workflow testing.",
      setupCompletedAt: new Date(),
      themeAccent: "#2b7b62",
      brandColors: { primary: "#12212c", accent: "#2b7b62" },
      enabledModules: ["QuoteFlow", "WorkFlow", "SiteBuilder", "LeadEngine"],
      isActive: true,
    },
    create: {
      workspaceKey: "auto-repair-demo",
      businessName: "StanleySync Demo",
      businessType: BusinessType.AUTO_REPAIR,
      industry: "Demo environment",
      serviceCategories: ["Demo quotes", "Demo jobs", "Demo invoices", "PDF exports"],
      email: "auto@stanleysync.app",
      phone: "(555) 884-2040",
      website: "https://stanleysync.app/auto",
      address: "18 Harbor Road, Newark, DE",
      logoPlaceholder: "DEM",
      quoteTerms: "Demo quotes are for StanleySync tester evaluation only.",
      invoiceTerms: "Demo invoices are not payable and are provided for workflow testing.",
      setupCompletedAt: new Date(),
      themeAccent: "#2b7b62",
      brandColors: { primary: "#12212c", accent: "#2b7b62" },
      enabledModules: ["QuoteFlow", "WorkFlow", "SiteBuilder", "LeadEngine"],
      isActive: true,
    },
  });

  const calibration = await prisma.businessWorkspace.upsert({
    where: { workspaceKey: "calibration-lab-demo" },
    update: {
      businessName: "StanleySync Labs",
      businessType: BusinessType.CALIBRATION_LAB,
      industry: "Calibration lab module - Pro",
      serviceCategories: ["Torque", "Pressure", "Load", "Dimensional", "Electrical"],
      email: "labs@stanleysync.app",
      phone: "(555) 773-9180",
      website: "https://stanleysync.app/labs",
      address: "77 Plant Way, Lancaster, PA",
      logoPlaceholder: "LAB",
      quoteTerms: "Calibration quotes require final review of asset condition, scope, accreditation needs, and schedule availability.",
      invoiceTerms: "Calibration invoices are due by the listed due date unless separate written terms apply.",
      setupCompletedAt: new Date(),
      themeAccent: "#c46a29",
      brandColors: { primary: "#12212c", accent: "#c46a29" },
      enabledModules: ["QuoteFlow", "WorkFlow", "SiteBuilder", "CalOps"],
      isActive: true,
    },
    create: {
      workspaceKey: "calibration-lab-demo",
      businessName: "StanleySync Labs",
      businessType: BusinessType.CALIBRATION_LAB,
      industry: "Calibration lab module - Pro",
      serviceCategories: ["Torque", "Pressure", "Load", "Dimensional", "Electrical"],
      email: "labs@stanleysync.app",
      phone: "(555) 773-9180",
      website: "https://stanleysync.app/labs",
      address: "77 Plant Way, Lancaster, PA",
      logoPlaceholder: "LAB",
      quoteTerms: "Calibration quotes require final review of asset condition, scope, accreditation needs, and schedule availability.",
      invoiceTerms: "Calibration invoices are due by the listed due date unless separate written terms apply.",
      setupCompletedAt: new Date(),
      themeAccent: "#c46a29",
      brandColors: { primary: "#12212c", accent: "#c46a29" },
      enabledModules: ["QuoteFlow", "WorkFlow", "SiteBuilder", "CalOps"],
      isActive: true,
    },
  });

  return { general, auto, calibration };
}

async function seedDashboardPreferences(workspaces: Awaited<ReturnType<typeof seedBusinessWorkspaces>>) {
  const generalWidgets = ["publicIntakeViews", "quotesSubmitted", "conversionRate", "approvedQuotes", "jobs", "revenue", "profit", "openTickets"];
  const autoWidgets = ["publicIntakeViews", "quotesSubmitted", "jobs", "openTickets", "dueDates", "revenue", "profit", "teamWorkload"];
  const calWidgets = ["quotes", "jobs", "assetsDue", "standardsDue", "ootAssets", "certificates", "revenue", "teamWorkload"];
  const titles: Record<string, string> = {
    quotes: "Quotes",
    jobs: "Jobs",
    revenue: "Revenue",
    profit: "Profit",
    teamWorkload: "Team workload",
    openTickets: "Open tickets",
    dueDates: "Due dates",
    customerGrowth: "Customer growth",
    publicIntakeViews: "Public intake views",
    quotesSubmitted: "Quotes submitted",
    conversionRate: "Conversion rate",
    approvedQuotes: "Approved quotes",
    assetsDue: "Assets due",
    standardsDue: "Standards due",
    ootAssets: "OOT assets",
    certificates: "Certificates",
  };

  const layouts = [
    { workspaceId: workspaces.general.id, widgets: generalWidgets },
    { workspaceId: workspaces.auto.id, widgets: autoWidgets },
    { workspaceId: workspaces.calibration.id, widgets: calWidgets },
  ];

  for (const layout of layouts) {
    await Promise.all(
      layout.widgets.map((widgetKey, index) =>
        prisma.dashboardWidgetPreference.upsert({
          where: { workspaceId_widgetKey: { workspaceId: layout.workspaceId, widgetKey } },
          update: { title: titles[widgetKey], isVisible: true, sortOrder: index },
          create: {
            workspaceId: layout.workspaceId,
            widgetKey,
            title: titles[widgetKey],
            isVisible: true,
            sortOrder: index,
          },
        }),
      ),
    );
  }
}

async function createQuote(input: {
  quoteNumber: string;
  customerId: string;
  assignedUserId?: string;
  serviceType: ServiceType;
  status: QuoteStatus;
  priority: Priority;
  suggestedTicketType: TicketType;
  serviceMode: ServiceMode;
  equipmentType: string;
  manufacturer: string;
  modelNumber: string;
  serialNumber: string;
  unitCount: number;
  rangeOrCapacity: string;
  units: string;
  requestedTurnaround: string;
  documentationRequirements: string;
  issueDescription: string;
  aiSummary: string;
  submittedAt: Date;
  quotedAmount?: number;
  assignedTo?: string;
}) {
  const data = {
    ...input,
    structuredSummary: {
      service: {
        serviceType: input.serviceType,
        serviceMode: input.serviceMode,
      },
    },
    extractedFields: {
      equipmentType: input.equipmentType,
      requestedTurnaround: input.requestedTurnaround,
    },
    transcript: [
      { role: "assistant", content: "What kind of service do you need today?" },
      { role: "user", content: input.serviceType },
    ],
  };

  return prisma.quoteRequest.upsert({
    where: { quoteNumber: input.quoteNumber },
    update: data,
    create: data,
  });
}

async function seedCalOpsData(input: {
  workspaceId: string;
  summitId: string;
  atlasId: string;
  redwoodId: string;
  technicianUserId: string;
  managerUserId: string;
}) {
  const primaryLab = await prisma.lab.upsert({
    where: { labCode: "LAB-DE-01" },
    update: {
      name: "StanleySync Labs - Delaware Calibration Lab",
      address: "102 Foundry Lane, Wilmington, DE",
      phone: "(555) 221-1030",
      accreditation: "ISO/IEC 17025 scope under management review for demo deployment",
      isActive: true,
    },
    create: {
      labCode: "LAB-DE-01",
      name: "StanleySync Labs - Delaware Calibration Lab",
      address: "102 Foundry Lane, Wilmington, DE",
      phone: "(555) 221-1030",
      accreditation: "ISO/IEC 17025 scope under management review for demo deployment",
      isActive: true,
    },
  });

  await prisma.customer.updateMany({
    where: { id: { in: [input.summitId, input.atlasId, input.redwoodId] } },
    data: { labId: primaryLab.id },
  });

  await prisma.user.updateMany({
    where: { id: { in: [input.technicianUserId, input.managerUserId] } },
    data: { labId: primaryLab.id },
  });

  const torqueProcedure = await prisma.calibrationProcedure.upsert({
    where: { procedureNumber: "CAL-TQ-001" },
    update: {
      labId: primaryLab.id,
      title: "Torque wrench calibration",
      discipline: "Torque",
      revision: "Rev C",
      controlledIssueDate: new Date("2026-01-15T00:00:00Z"),
      uncertaintyReference: "UQ-TQ-001",
      instructions: "Perform intake inspection, stabilize the device, run ascending and descending torque points, document as-found/as-left results, and submit for review.",
      isActive: true,
    },
    create: {
      labId: primaryLab.id,
      procedureNumber: "CAL-TQ-001",
      title: "Torque wrench calibration",
      discipline: "Torque",
      revision: "Rev C",
      controlledIssueDate: new Date("2026-01-15T00:00:00Z"),
      uncertaintyReference: "UQ-TQ-001",
      instructions: "Perform intake inspection, stabilize the device, run ascending and descending torque points, document as-found/as-left results, and submit for review.",
      isActive: true,
    },
  });

  const transducerProcedure = await prisma.calibrationProcedure.upsert({
    where: { procedureNumber: "CAL-TQ-002" },
    update: {
      labId: primaryLab.id,
      title: "Torque transducer calibration",
      discipline: "Torque",
      revision: "Rev B",
      controlledIssueDate: new Date("2025-12-08T00:00:00Z"),
      uncertaintyReference: "UQ-TQ-002",
      instructions: "Compare the torque transducer against the reference standard across the assigned range and record uncertainty references.",
      isActive: true,
    },
    create: {
      labId: primaryLab.id,
      procedureNumber: "CAL-TQ-002",
      title: "Torque transducer calibration",
      discipline: "Torque",
      revision: "Rev B",
      controlledIssueDate: new Date("2025-12-08T00:00:00Z"),
      uncertaintyReference: "UQ-TQ-002",
      instructions: "Compare the torque transducer against the reference standard across the assigned range and record uncertainty references.",
      isActive: true,
    },
  });

  const pressureProcedure = await prisma.calibrationProcedure.upsert({
    where: { procedureNumber: "CAL-PR-001" },
    update: {
      labId: primaryLab.id,
      title: "Hydraulic pressure calibration",
      discipline: "Pressure",
      revision: "Rev D",
      controlledIssueDate: new Date("2026-02-01T00:00:00Z"),
      uncertaintyReference: "UQ-PR-001",
      instructions: "Inspect zero condition, exercise the gauge, run pressure points across the range, and document any adjustment.",
      isActive: true,
    },
    create: {
      labId: primaryLab.id,
      procedureNumber: "CAL-PR-001",
      title: "Hydraulic pressure calibration",
      discipline: "Pressure",
      revision: "Rev D",
      controlledIssueDate: new Date("2026-02-01T00:00:00Z"),
      uncertaintyReference: "UQ-PR-001",
      instructions: "Inspect zero condition, exercise the gauge, run pressure points across the range, and document any adjustment.",
      isActive: true,
    },
  });

  const loadProcedure = await prisma.calibrationProcedure.upsert({
    where: { procedureNumber: "CAL-LD-001" },
    update: {
      labId: primaryLab.id,
      title: "Load cell calibration",
      discipline: "Load",
      revision: "Rev A",
      controlledIssueDate: new Date("2025-11-20T00:00:00Z"),
      uncertaintyReference: "UQ-LD-001",
      instructions: "Run force points across the requested capacity and document return-to-zero performance after unload.",
      isActive: true,
    },
    create: {
      labId: primaryLab.id,
      procedureNumber: "CAL-LD-001",
      title: "Load cell calibration",
      discipline: "Load",
      revision: "Rev A",
      controlledIssueDate: new Date("2025-11-20T00:00:00Z"),
      uncertaintyReference: "UQ-LD-001",
      instructions: "Run force points across the requested capacity and document return-to-zero performance after unload.",
      isActive: true,
    },
  });

  const torqueStandard = await prisma.calibrationStandard.upsert({
    where: { standardId: "STD-TQ-500" },
    update: {
      labId: primaryLab.id,
      description: "500 ft-lb deadweight torque standard",
      traceabilitySource: "NIST via accredited lab",
      certNumber: "CERT-TQ-88421",
      dueDate: new Date("2026-06-15T00:00:00Z"),
      uncertainty: "0.15% of reading",
      procedures: { connect: [{ id: torqueProcedure.id }, { id: transducerProcedure.id }] },
    },
    create: {
      labId: primaryLab.id,
      standardId: "STD-TQ-500",
      description: "500 ft-lb deadweight torque standard",
      traceabilitySource: "NIST via accredited lab",
      certNumber: "CERT-TQ-88421",
      dueDate: new Date("2026-06-15T00:00:00Z"),
      uncertainty: "0.15% of reading",
      procedures: { connect: [{ id: torqueProcedure.id }, { id: transducerProcedure.id }] },
    },
  });

  const pressureStandard = await prisma.calibrationStandard.upsert({
    where: { standardId: "STD-PR-10K" },
    update: {
      labId: primaryLab.id,
      description: "10,000 psi hydraulic pressure controller",
      traceabilitySource: "NIST via NVLAP provider",
      certNumber: "CERT-PR-44710",
      dueDate: new Date("2026-05-18T00:00:00Z"),
      uncertainty: "0.02% FS",
      procedures: { connect: [{ id: pressureProcedure.id }] },
    },
    create: {
      labId: primaryLab.id,
      standardId: "STD-PR-10K",
      description: "10,000 psi hydraulic pressure controller",
      traceabilitySource: "NIST via NVLAP provider",
      certNumber: "CERT-PR-44710",
      dueDate: new Date("2026-05-18T00:00:00Z"),
      uncertainty: "0.02% FS",
      procedures: { connect: [{ id: pressureProcedure.id }] },
    },
  });

  const loadStandard = await prisma.calibrationStandard.upsert({
    where: { standardId: "STD-LD-50K" },
    update: {
      labId: primaryLab.id,
      description: "50,000 lbf reference load cell",
      traceabilitySource: "NIST traceable force lab",
      certNumber: "CERT-LD-55012",
      dueDate: new Date("2026-04-20T00:00:00Z"),
      uncertainty: "0.04% of applied load",
      procedures: { connect: [{ id: loadProcedure.id }] },
    },
    create: {
      labId: primaryLab.id,
      standardId: "STD-LD-50K",
      description: "50,000 lbf reference load cell",
      traceabilitySource: "NIST traceable force lab",
      certNumber: "CERT-LD-55012",
      dueDate: new Date("2026-04-20T00:00:00Z"),
      uncertainty: "0.04% of applied load",
      procedures: { connect: [{ id: loadProcedure.id }] },
    },
  });

  const torqueAsset = await prisma.calAsset.upsert({
    where: { assetId: "A-SUM-1001" },
    update: {
      labId: primaryLab.id,
      customerId: input.summitId,
      description: "Torque cell",
      manufacturer: "Morehouse",
      model: "TCC-250",
      serialNumber: "TQ-4412",
      assetType: AssetType.TORQUE,
      capacityRange: "50-250 ft-lb",
      accuracyTolerance: "+/-4% clockwise",
      procedureId: torqueProcedure.id,
      calibrationInterval: 12,
      lastCalDate: new Date("2025-05-01T00:00:00Z"),
      dueDate: new Date("2026-05-01T00:00:00Z"),
      status: AssetStatus.DUE_SOON,
      standards: { connect: [{ id: torqueStandard.id }] },
      notes: "Servo Innovations audit-critical torque cell for production verification.",
      history: "2025 calibration completed in tolerance. Due for annual service.",
      attachmentsNote: "Customer files and prior certificates can be attached here.",
    },
    create: {
      assetId: "A-SUM-1001",
      labId: primaryLab.id,
      customerId: input.summitId,
      description: "Torque cell",
      manufacturer: "Morehouse",
      model: "TCC-250",
      serialNumber: "TQ-4412",
      assetType: AssetType.TORQUE,
      capacityRange: "50-250 ft-lb",
      accuracyTolerance: "+/-4% clockwise",
      procedureId: torqueProcedure.id,
      calibrationInterval: 12,
      lastCalDate: new Date("2025-05-01T00:00:00Z"),
      dueDate: new Date("2026-05-01T00:00:00Z"),
      status: AssetStatus.DUE_SOON,
      standards: { connect: [{ id: torqueStandard.id }] },
      notes: "Servo Innovations audit-critical torque cell for production verification.",
      history: "2025 calibration completed in tolerance. Due for annual service.",
      attachmentsNote: "Customer files and prior certificates can be attached here.",
    },
  });

  const pressureAsset = await prisma.calAsset.upsert({
    where: { assetId: "A-ATL-2001" },
    update: {
      labId: primaryLab.id,
      customerId: input.summitId,
      description: "Digital pressure gauge",
      manufacturer: "Ashcroft",
      model: "DG25",
      serialNumber: "DG25-9921",
      assetType: AssetType.PRESSURE,
      capacityRange: "0-300 psi",
      accuracyTolerance: "+/-0.25% FS",
      procedureId: pressureProcedure.id,
      calibrationInterval: 6,
      lastCalDate: new Date("2025-10-15T00:00:00Z"),
      dueDate: new Date("2026-04-15T00:00:00Z"),
      status: AssetStatus.OVERDUE,
      standards: { connect: [{ id: pressureStandard.id }] },
      notes: "Servo Innovations reported unstable zero before receipt.",
      history: "Prior repair note: sensor drift observed.",
      attachmentsNote: "Customer files and prior certificates can be attached here.",
    },
    create: {
      assetId: "A-ATL-2001",
      labId: primaryLab.id,
      customerId: input.summitId,
      description: "Digital pressure gauge",
      manufacturer: "Ashcroft",
      model: "DG25",
      serialNumber: "DG25-9921",
      assetType: AssetType.PRESSURE,
      capacityRange: "0-300 psi",
      accuracyTolerance: "+/-0.25% FS",
      procedureId: pressureProcedure.id,
      calibrationInterval: 6,
      lastCalDate: new Date("2025-10-15T00:00:00Z"),
      dueDate: new Date("2026-04-15T00:00:00Z"),
      status: AssetStatus.OVERDUE,
      standards: { connect: [{ id: pressureStandard.id }] },
      notes: "Servo Innovations reported unstable zero before receipt.",
      history: "Prior repair note: sensor drift observed.",
      attachmentsNote: "Customer files and prior certificates can be attached here.",
    },
  });

  const loadAsset = await prisma.calAsset.upsert({
    where: { assetId: "A-RED-3001" },
    update: {
      labId: primaryLab.id,
      customerId: input.summitId,
      description: "Compression load cell",
      manufacturer: "Interface",
      model: "1200",
      serialNumber: "LD-7780",
      assetType: AssetType.LOAD,
      capacityRange: "0-25,000 lbf",
      accuracyTolerance: "+/-0.1% FS",
      procedureId: loadProcedure.id,
      calibrationInterval: 12,
      lastCalDate: new Date("2026-01-10T00:00:00Z"),
      dueDate: new Date("2027-01-10T00:00:00Z"),
      status: AssetStatus.IN_TOLERANCE,
      standards: { connect: [{ id: loadStandard.id }] },
      notes: "Servo Innovations force verification asset.",
      history: "New asset added after plant restart project.",
      attachmentsNote: "Customer files and prior certificates can be attached here.",
    },
    create: {
      assetId: "A-RED-3001",
      labId: primaryLab.id,
      customerId: input.summitId,
      description: "Compression load cell",
      manufacturer: "Interface",
      model: "1200",
      serialNumber: "LD-7780",
      assetType: AssetType.LOAD,
      capacityRange: "0-25,000 lbf",
      accuracyTolerance: "+/-0.1% FS",
      procedureId: loadProcedure.id,
      calibrationInterval: 12,
      lastCalDate: new Date("2026-01-10T00:00:00Z"),
      dueDate: new Date("2027-01-10T00:00:00Z"),
      status: AssetStatus.IN_TOLERANCE,
      standards: { connect: [{ id: loadStandard.id }] },
      notes: "Servo Innovations force verification asset.",
      history: "New asset added after plant restart project.",
      attachmentsNote: "Customer files and prior certificates can be attached here.",
    },
  });

  const childAsset = await prisma.calAsset.upsert({
    where: { assetId: "A-SUM-1001-CASE" },
    update: {
      labId: primaryLab.id,
      customerId: input.summitId,
      description: "Torque cell shipping case",
      manufacturer: "Morehouse",
      model: "Case",
      serialNumber: "KIT-4412",
      assetType: AssetType.OTHER,
      capacityRange: "Accessory",
      accuracyTolerance: "N/A",
      parentAssetId: torqueAsset.id,
      status: AssetStatus.IN_TOLERANCE,
      notes: "Child asset tracked with primary wrench.",
    },
    create: {
      assetId: "A-SUM-1001-CASE",
      labId: primaryLab.id,
      customerId: input.summitId,
      description: "Torque cell shipping case",
      manufacturer: "Morehouse",
      model: "Case",
      serialNumber: "KIT-4412",
      assetType: AssetType.OTHER,
      capacityRange: "Accessory",
      accuracyTolerance: "N/A",
      parentAssetId: torqueAsset.id,
      status: AssetStatus.IN_TOLERANCE,
      notes: "Child asset tracked with primary wrench.",
    },
  });

  const activeWorkOrder = await prisma.calibrationWorkOrder.upsert({
    where: { woNumber: "CAL-WO-4001" },
    update: {
      labId: primaryLab.id,
      customerId: input.summitId,
      serviceType: CalServiceType.CALIBRATION,
      assignedUserId: input.technicianUserId,
      assignedTechnician: "Ava Martinez",
      dueDate: new Date("2026-05-03T16:00:00Z"),
      priority: Priority.HIGH,
      status: CalibrationWorkOrderStatus.IN_PROCESS,
      procedureId: torqueProcedure.id,
      intakeNotes: "Received with customer request for audit-ready certificate package.",
      calibrationData: "As-found/as-left entry scheduled; 50, 125, and 250 ft-lb points prepared.",
      uncertaintyNotes: "Use UQ-TQ-001 uncertainty budget.",
      certificateNotes: "Include NIST traceability statement.",
      revenueAmount: 925,
    },
    create: {
      woNumber: "CAL-WO-4001",
      labId: primaryLab.id,
      customerId: input.summitId,
      serviceType: CalServiceType.CALIBRATION,
      assignedUserId: input.technicianUserId,
      assignedTechnician: "Ava Martinez",
      dueDate: new Date("2026-05-03T16:00:00Z"),
      priority: Priority.HIGH,
      status: CalibrationWorkOrderStatus.IN_PROCESS,
      procedureId: torqueProcedure.id,
      intakeNotes: "Received with customer request for audit-ready certificate package.",
      calibrationData: "As-found/as-left entry scheduled; 50, 125, and 250 ft-lb points prepared.",
      uncertaintyNotes: "Use UQ-TQ-001 uncertainty budget.",
      certificateNotes: "Include NIST traceability statement.",
      revenueAmount: 925,
    },
  });

  const reviewWorkOrder = await prisma.calibrationWorkOrder.upsert({
    where: { woNumber: "CAL-WO-4002" },
    update: {
      labId: primaryLab.id,
      customerId: input.summitId,
      serviceType: CalServiceType.REPAIR,
      assignedUserId: input.technicianUserId,
      assignedTechnician: "Ava Martinez",
      dueDate: new Date("2026-04-30T16:00:00Z"),
      priority: Priority.NORMAL,
      status: CalibrationWorkOrderStatus.TECHNICAL_REVIEW,
      procedureId: pressureProcedure.id,
      intakeNotes: "Repair and post-repair calibration required.",
      calibrationData: "Gauge zero adjusted; span checked at 0, 75, 150, 225, 300 psi.",
      uncertaintyNotes: "Use UQ-PR-001 with pressure controller standard.",
      certificateNotes: "Draft certificate ready for reviewer.",
      revenueAmount: 1325,
      completedAt: new Date("2026-04-28T15:30:00Z"),
    },
    create: {
      woNumber: "CAL-WO-4002",
      labId: primaryLab.id,
      customerId: input.summitId,
      serviceType: CalServiceType.REPAIR,
      assignedUserId: input.technicianUserId,
      assignedTechnician: "Ava Martinez",
      dueDate: new Date("2026-04-30T16:00:00Z"),
      priority: Priority.NORMAL,
      status: CalibrationWorkOrderStatus.TECHNICAL_REVIEW,
      procedureId: pressureProcedure.id,
      intakeNotes: "Repair and post-repair calibration required.",
      calibrationData: "Gauge zero adjusted; span checked at 0, 75, 150, 225, 300 psi.",
      uncertaintyNotes: "Use UQ-PR-001 with pressure controller standard.",
      certificateNotes: "Draft certificate ready for reviewer.",
      revenueAmount: 1325,
      completedAt: new Date("2026-04-28T15:30:00Z"),
    },
  });

  const closedWorkOrder = await prisma.calibrationWorkOrder.upsert({
    where: { woNumber: "CAL-WO-4003" },
    update: {
      labId: primaryLab.id,
      customerId: input.summitId,
      serviceType: CalServiceType.CALIBRATION,
      assignedUserId: input.managerUserId,
      assignedTechnician: "Mason Brooks",
      dueDate: new Date("2026-04-22T16:00:00Z"),
      priority: Priority.NORMAL,
      status: CalibrationWorkOrderStatus.CLOSED,
      procedureId: loadProcedure.id,
      intakeNotes: "Field support kit verification.",
      calibrationData: "All verification points accepted.",
      uncertaintyNotes: "UQ-LD-001 applied.",
      certificateNotes: "Certificate issued and package closed.",
      revenueAmount: 2100,
      completedAt: new Date("2026-04-22T18:00:00Z"),
    },
    create: {
      woNumber: "CAL-WO-4003",
      labId: primaryLab.id,
      customerId: input.summitId,
      serviceType: CalServiceType.CALIBRATION,
      assignedUserId: input.managerUserId,
      assignedTechnician: "Mason Brooks",
      dueDate: new Date("2026-04-22T16:00:00Z"),
      priority: Priority.NORMAL,
      status: CalibrationWorkOrderStatus.CLOSED,
      procedureId: loadProcedure.id,
      intakeNotes: "Field support kit verification.",
      calibrationData: "All verification points accepted.",
      uncertaintyNotes: "UQ-LD-001 applied.",
      certificateNotes: "Certificate issued and package closed.",
      revenueAmount: 2100,
      completedAt: new Date("2026-04-22T18:00:00Z"),
    },
  });

  await prisma.calibrationWorkOrderAsset.createMany({
    data: [
      { id: "seed-woa-4001", workOrderId: activeWorkOrder.id, assetId: torqueAsset.id, asFound: "Awaiting technician entry", asLeft: "Awaiting technician entry", passFail: "Pending" },
      { id: "seed-woa-4002", workOrderId: reviewWorkOrder.id, assetId: pressureAsset.id, asFound: "Out of tolerance at zero", asLeft: "Within tolerance after adjustment", passFail: "Pass after adjustment" },
      { id: "seed-woa-4003", workOrderId: closedWorkOrder.id, assetId: loadAsset.id, asFound: "Within tolerance", asLeft: "Within tolerance", passFail: "Pass" },
      { id: "seed-woa-4004", workOrderId: activeWorkOrder.id, assetId: childAsset.id, asFound: "Accessory received", asLeft: "Accessory returned", passFail: "N/A" },
    ],
    skipDuplicates: true,
  });

  await prisma.calibrationWorkOrderStandard.createMany({
    data: [
      { id: "seed-wos-4001", workOrderId: activeWorkOrder.id, standardId: torqueStandard.id, usageNotes: "Primary torque reference." },
      { id: "seed-wos-4002", workOrderId: reviewWorkOrder.id, standardId: pressureStandard.id, usageNotes: "Pressure controller used for span checks." },
      { id: "seed-wos-4003", workOrderId: closedWorkOrder.id, standardId: loadStandard.id, usageNotes: "Reference force standard." },
    ],
    skipDuplicates: true,
  });

  await prisma.calibrationRecordEntry.createMany({
    data: [
      {
        id: "seed-record-4001",
        workOrderId: activeWorkOrder.id,
        enteredByUserId: input.technicianUserId,
        label: "50 ft-lb clockwise",
        nominalValue: 50,
        asFound: "Pending",
        asLeft: "Pending",
        toleranceLow: 48,
        toleranceHigh: 52,
        tolerance: "+/-4%",
        units: "ft-lb",
        result: "Pending",
        decision: CalibrationDecision.NOT_EVALUATED,
        notes: "Technician entry pending for active work order.",
      },
      {
        id: "seed-record-4002",
        workOrderId: reviewWorkOrder.id,
        enteredByUserId: input.technicianUserId,
        label: "150 psi",
        nominalValue: 150,
        asFoundValue: 149.2,
        asFound: "149.2 psi",
        asLeftValue: 150,
        asLeft: "150.0 psi",
        toleranceLow: 149.25,
        toleranceHigh: 150.75,
        tolerance: "+/-0.75 psi",
        units: "psi",
        result: "Pass",
        decision: CalibrationDecision.ADJUSTED_PASS,
        isOutOfTolerance: true,
        notes: "Adjusted zero before as-left run.",
      },
      {
        id: "seed-record-4003",
        workOrderId: closedWorkOrder.id,
        enteredByUserId: input.managerUserId,
        label: "10,000 lbf",
        nominalValue: 10000,
        asFoundValue: 9998,
        asFound: "9998 lbf",
        asLeftValue: 9998,
        asLeft: "9998 lbf",
        toleranceLow: 9975,
        toleranceHigh: 10025,
        tolerance: "+/-25 lbf",
        units: "lbf",
        result: "Pass",
        decision: CalibrationDecision.PASS,
        notes: "Stable return-to-zero.",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.assetRecall.createMany({
    data: [
      {
        id: "seed-recall-asset-1",
        assetId: torqueAsset.id,
        dueDate: new Date("2026-05-01T00:00:00Z"),
        recallDate: new Date("2026-04-01T00:00:00Z"),
        status: RecallStatus.SCHEDULED,
        method: "Email",
        message: "Annual torque wrench recall for audit-critical asset.",
      },
      {
        id: "seed-recall-asset-2",
        assetId: pressureAsset.id,
        dueDate: new Date("2026-04-15T00:00:00Z"),
        recallDate: new Date("2026-03-15T00:00:00Z"),
        status: RecallStatus.OPEN,
        method: "Email",
        message: "Pressure gauge is overdue and should be scheduled.",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.assetHistoryEvent.createMany({
    data: [
      {
        id: "seed-asset-history-1",
        assetId: torqueAsset.id,
        workOrderId: activeWorkOrder.id,
        actorUserId: input.technicianUserId,
        type: AssetHistoryType.RECALL_SENT,
        title: "Recall scheduled",
        description: "Annual calibration recall opened for the torque wrench.",
      },
      {
        id: "seed-asset-history-2",
        assetId: pressureAsset.id,
        workOrderId: reviewWorkOrder.id,
        actorUserId: input.technicianUserId,
        type: AssetHistoryType.OOT_FOUND,
        title: "OOT condition found",
        description: "As-found zero point was outside tolerance before adjustment.",
      },
      {
        id: "seed-asset-history-3",
        assetId: loadAsset.id,
        workOrderId: closedWorkOrder.id,
        actorUserId: input.managerUserId,
        type: AssetHistoryType.CALIBRATED,
        title: "Calibration completed",
        description: "Load cell calibration completed and certificate package closed.",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.workOrderPackageExport.createMany({
    data: [
      {
        id: "seed-package-export-1",
        workOrderId: reviewWorkOrder.id,
        exportedByUserId: input.managerUserId,
        packageType: ExportPackageType.WORK_ORDER_PACKAGE,
        title: "Servo Innovations pressure gauge work order package",
        notes: "Printable branded package generated for technical review.",
      },
      {
        id: "seed-package-export-2",
        workOrderId: reviewWorkOrder.id,
        exportedByUserId: input.managerUserId,
        packageType: ExportPackageType.CERTIFICATE,
        title: "Servo Innovations pressure gauge certificate draft PDF",
        notes: "ISO-style certificate print output generated.",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.calibrationFinding.createMany({
    data: [
      { id: "seed-finding-4001", workOrderId: reviewWorkOrder.id, authorUserId: input.technicianUserId, findingType: "OOT", severity: "Moderate", description: "Gauge was out of tolerance at zero as-found.", correctiveAction: "Adjusted zero and repeated as-left checks." },
    ],
    skipDuplicates: true,
  });

  await prisma.calActivityLog.createMany({
    data: [
      { id: "seed-cal-activity-1", workOrderId: activeWorkOrder.id, actorUserId: input.technicianUserId, title: "Work started", description: "Technician moved calibration job into process." },
      { id: "seed-cal-activity-2", workOrderId: reviewWorkOrder.id, actorUserId: input.technicianUserId, title: "Submitted for review", description: "Calibration data and findings submitted for technical review." },
      { id: "seed-cal-activity-3", workOrderId: closedWorkOrder.id, actorUserId: input.managerUserId, title: "Closed", description: "Certificate package completed and work order closed." },
    ],
    skipDuplicates: true,
  });

  await prisma.certificateDraft.upsert({
    where: { certificateNumber: "CERT-DRAFT-4002" },
    update: {
      workOrderId: reviewWorkOrder.id,
      customerId: input.summitId,
      labId: primaryLab.id,
      assetId: pressureAsset.id,
      accreditationStatement: primaryLab.accreditation,
      environmentalConditions: "21.8 C, 44% RH, stable lab conditions recorded at time of calibration.",
      calibrationMethod: "CAL-PR-001 Hydraulic pressure calibration",
      asFoundSummary: "As-found zero point was out of tolerance.",
      asLeftSummary: "As-left readings within tolerance after adjustment.",
      passFail: "Pass after adjustment",
      statementOfConformity: "Asset conforms after adjustment using the stated decision rule.",
      decisionRule: "Simple acceptance rule: as-left result must fall within listed tolerance limits.",
      notes: "MVP certificate draft generated from calibration work order.",
      uncertaintyStatement: "Measurement uncertainty evaluated per UQ-PR-001.",
      traceabilityStatement: "Measurements are traceable to SI through NIST-traceable standards.",
      authorizedReviewer: "Mason Brooks",
      issueDate: new Date("2026-04-28T00:00:00Z"),
      revision: "Draft A",
    },
    create: {
      certificateNumber: "CERT-DRAFT-4002",
      workOrderId: reviewWorkOrder.id,
      customerId: input.summitId,
      labId: primaryLab.id,
      assetId: pressureAsset.id,
      accreditationStatement: primaryLab.accreditation,
      environmentalConditions: "21.8 C, 44% RH, stable lab conditions recorded at time of calibration.",
      calibrationMethod: "CAL-PR-001 Hydraulic pressure calibration",
      asFoundSummary: "As-found zero point was out of tolerance.",
      asLeftSummary: "As-left readings within tolerance after adjustment.",
      passFail: "Pass after adjustment",
      statementOfConformity: "Asset conforms after adjustment using the stated decision rule.",
      decisionRule: "Simple acceptance rule: as-left result must fall within listed tolerance limits.",
      notes: "MVP certificate draft generated from calibration work order.",
      uncertaintyStatement: "Measurement uncertainty evaluated per UQ-PR-001.",
      traceabilityStatement: "Measurements are traceable to SI through NIST-traceable standards.",
      authorizedReviewer: "Mason Brooks",
      issueDate: new Date("2026-04-28T00:00:00Z"),
      revision: "Draft A",
    },
  });

  await prisma.calibrationProcedure.updateMany({
    where: { id: { in: [torqueProcedure.id, transducerProcedure.id, pressureProcedure.id, loadProcedure.id] } },
    data: { workspaceId: input.workspaceId },
  });

  await prisma.calibrationStandard.updateMany({
    where: { id: { in: [torqueStandard.id, pressureStandard.id, loadStandard.id] } },
    data: { workspaceId: input.workspaceId },
  });

  await prisma.calAsset.updateMany({
    where: { id: { in: [torqueAsset.id, pressureAsset.id, loadAsset.id, childAsset.id] } },
    data: { workspaceId: input.workspaceId },
  });

  await prisma.calibrationWorkOrder.updateMany({
    where: { id: { in: [activeWorkOrder.id, reviewWorkOrder.id, closedWorkOrder.id] } },
    data: { workspaceId: input.workspaceId },
  });

  await prisma.certificateDraft.updateMany({
    where: { workOrderId: { in: [reviewWorkOrder.id] } },
    data: { workspaceId: input.workspaceId },
  });
}

async function main() {
  await seedProjectData();
  const workspaces = await seedBusinessWorkspaces();
  await seedDashboardPreferences(workspaces);

  const ownerUser = await createUser({
    name: "StanleySync Owner",
    email: "owner@stanleysync.app",
    role: UserRole.SYSTEM_OWNER,
    password: "Stanley123!",
  });

  const adminUser = await createUser({
    name: "Avery Stone",
    email: "admin@stanleysync.app",
    role: UserRole.ADMIN,
    password: "Stanley123!",
  });

  const managerUser = await createUser({
    name: "Mason Brooks",
    email: "manager@stanleysync.app",
    role: UserRole.MANAGER,
    password: "Stanley123!",
  });

  const technicianUser = await createUser({
    name: "Ava Martinez",
    email: "tech@stanleysync.app",
    role: UserRole.TECHNICIAN,
    password: "Stanley123!",
  });

  const salesUser = await createUser({
    name: "Noah Carter",
    email: "sales@stanleysync.app",
    role: UserRole.SALES,
    password: "Stanley123!",
  });

  const demoUser = await createUser({
    name: "Demo User",
    email: "demo@stanleysync.app",
    role: UserRole.DEMO_USER,
    password: "Stanley123!",
  });

  await prisma.user.update({
    where: { id: ownerUser.id },
    data: { activeWorkspaceId: workspaces.general.id },
  });

  await prisma.user.update({
    where: { id: adminUser.id },
    data: { activeWorkspaceId: workspaces.general.id },
  });

  await prisma.user.updateMany({
    where: { id: { in: [managerUser.id, salesUser.id] } },
    data: { activeWorkspaceId: workspaces.general.id },
  });

  await prisma.user.update({
    where: { id: demoUser.id },
    data: { activeWorkspaceId: workspaces.auto.id },
  });

  await prisma.user.update({
    where: { id: technicianUser.id },
    data: { activeWorkspaceId: workspaces.auto.id },
  });


  await prisma.websiteProject.updateMany({
    where: { slug: "precision-field-services" },
    data: { workspaceId: workspaces.general.id },
  });

  const summit = await createCustomer({
    customerRef: "CUS-1001",
    company: "Servo Innovations",
    mainContact: "Jordan Lee",
    email: "jordan@servoinnovations.example",
    phone: "(555) 884-2040",
    address: "18 Harbor Road, Newark, DE",
    notes: "Calibration lab demo customer with torque, force, and pressure assets.",
  });

  await prisma.customer.update({
    where: { id: summit.id },
    data: { workspaceId: workspaces.calibration.id },
  });

  const atlas = await createCustomer({
    customerRef: "CUS-1002",
    company: "Harbor Fleet Services",
    mainContact: "Monica Grant",
    email: "mgrant@harborfleet.example",
    phone: "(555) 884-1183",
    address: "220 Steel Mill Avenue, Reading, PA",
  });

  await prisma.customer.update({
    where: { id: atlas.id },
    data: { workspaceId: workspaces.auto.id },
  });

  const redwood = await createCustomer({
    customerRef: "CUS-1003",
    company: "Northstar Property Services",
    mainContact: "Devon Hale",
    email: "devon@northstarproperty.example",
    phone: "(555) 773-9180",
    address: "77 Plant Way, Lancaster, PA",
  });

  await prisma.customer.update({
    where: { id: redwood.id },
    data: { workspaceId: workspaces.general.id },
  });

  await seedCalOpsData({
    workspaceId: workspaces.calibration.id,
    summitId: summit.id,
    atlasId: atlas.id,
    redwoodId: redwood.id,
    technicianUserId: technicianUser.id,
    managerUserId: managerUser.id,
  });

  const quote1 = await createQuote({
    quoteNumber: "Q-1001",
    customerId: summit.id,
    assignedUserId: salesUser.id,
    serviceType: ServiceType.CALIBRATION,
    status: QuoteStatus.REVIEWING,
    priority: Priority.HIGH,
    suggestedTicketType: TicketType.CALIBRATION,
    serviceMode: ServiceMode.IN_LAB,
    equipmentType: "Torque cell and pressure gauge set",
    manufacturer: "Morehouse / Ashcroft",
    modelNumber: "TCC-250 / DG25",
    serialNumber: "SN-44328",
    unitCount: 2,
    rangeOrCapacity: "10-200",
    units: "ft-lb",
    requestedTurnaround: "Rush",
    documentationRequirements: "ISO-style certificate package with NIST traceability",
    issueDescription: "Annual calibration of torque cells, load cells, and pressure gauges before quality audit.",
    aiSummary:
      "Rush in-lab calibration for Servo Innovations torque, force, and pressure equipment. Customer requires traceable certificate packages before an internal audit deadline.",
    submittedAt: new Date("2026-04-18T09:15:00Z"),
    quotedAmount: 1850,
    assignedTo: "Ava Martinez",
  });

  await prisma.quoteRequest.update({
    where: { id: quote1.id },
    data: { workspaceId: workspaces.calibration.id },
  });

  const quote2 = await createQuote({
    quoteNumber: "Q-1002",
    customerId: atlas.id,
    assignedUserId: managerUser.id,
    serviceType: ServiceType.REPAIR,
    status: QuoteStatus.QUOTED,
    priority: Priority.NORMAL,
    suggestedTicketType: TicketType.REPAIR,
    serviceMode: ServiceMode.SHIP_IN,
    equipmentType: "Fleet van brake and suspension service",
    manufacturer: "Ford",
    modelNumber: "Transit 250",
    serialNumber: "Fleet unit HV-18",
    unitCount: 1,
    rangeOrCapacity: "Vehicle service",
    units: "vehicle",
    requestedTurnaround: "Standard",
    documentationRequirements: "Repair estimate, service notes, and final invoice",
    issueDescription: "Customer reports brake pulsation and front-end vibration on delivery van.",
    aiSummary:
      "Auto repair quote for Harbor Fleet Services van brake and suspension service with estimate approval before repair.",
    submittedAt: new Date("2026-04-09T14:22:00Z"),
    quotedAmount: 3200,
    assignedTo: "Mason Brooks",
  });

  await prisma.quoteRequest.update({
    where: { id: quote2.id },
    data: { workspaceId: workspaces.auto.id },
  });

  const quote3 = await createQuote({
    quoteNumber: "Q-1003",
    customerId: redwood.id,
    assignedUserId: salesUser.id,
    serviceType: ServiceType.CUSTOM_SERVICE,
    status: QuoteStatus.NEW,
    priority: Priority.HIGH,
    suggestedTicketType: TicketType.FIELD_SERVICE,
    serviceMode: ServiceMode.ON_SITE,
    equipmentType: "Facility maintenance punch list",
    manufacturer: "Mixed building systems",
    modelNumber: "Multiple",
    serialNumber: "Site inventory",
    unitCount: 12,
    rangeOrCapacity: "Office and warehouse",
    units: "tasks",
    requestedTurnaround: "By a specific date",
    documentationRequirements: "Field report, completion notes, and invoice",
    issueDescription: "Needs on-site service team to complete maintenance punch list before tenant move-in.",
    aiSummary:
      "General service request for Northstar Property Services site punch list with assigned field work, completion notes, and invoicing.",
    submittedAt: new Date("2026-04-21T11:40:00Z"),
    assignedTo: "Noah Carter",
  });

  await prisma.quoteRequest.update({
    where: { id: quote3.id },
    data: { workspaceId: workspaces.general.id },
  });

  const draftPayload = {
    source: {
      module: "QuoteFlow",
      quoteRequestId: quote3.id,
      quoteNumber: quote3.quoteNumber,
    },
    customer: {
      customerId: redwood.id,
      company: redwood.company,
      contactName: redwood.mainContact,
      contactEmail: redwood.email,
      contactPhone: redwood.phone,
    },
    service: {
      requestedServiceType: quote3.serviceType,
      calibrationCategory: null,
      serviceMode: quote3.serviceMode,
      requestedTurnaround: quote3.requestedTurnaround,
      documentationRequirements: quote3.documentationRequirements,
    },
    equipment: {
      equipmentType: quote3.equipmentType,
      manufacturer: quote3.manufacturer,
      modelNumber: quote3.modelNumber,
      serialNumber: quote3.serialNumber,
      unitCount: quote3.unitCount,
      rangeOrCapacity: quote3.rangeOrCapacity,
      units: quote3.units,
    },
    notes: {
      customerNotes: quote3.issueDescription,
      internalNotesSummary: "Prep for turnaround outage scheduling and field coordination.",
      aiSummary: quote3.aiSummary,
    },
  };

  const draft = await prisma.workOrderDraft.upsert({
    where: { sourceQuoteRequestId: quote3.id },
    update: {
      customerId: redwood.id,
      status: WorkOrderDraftStatus.READY_TO_EXPORT,
      requestedServiceType: quote3.serviceType,
      calibrationCategory: null,
      serviceMode: quote3.serviceMode,
      companyName: redwood.company,
      contactName: redwood.mainContact,
      contactEmail: redwood.email,
      contactPhone: redwood.phone,
      equipmentType: quote3.equipmentType,
      manufacturer: quote3.manufacturer,
      modelNumber: quote3.modelNumber,
      serialNumber: quote3.serialNumber,
      unitCount: quote3.unitCount,
      rangeOrCapacity: quote3.rangeOrCapacity,
      units: quote3.units,
      requestedTurnaround: quote3.requestedTurnaround,
      documentationRequirements: quote3.documentationRequirements,
      customerNotes: quote3.issueDescription,
      internalNotesSummary: "Prep for turnaround outage scheduling and field coordination.",
      exportPayload: draftPayload,
    },
    create: {
      draftNumber: "WO-3001",
      sourceQuoteRequestId: quote3.id,
      customerId: redwood.id,
      status: WorkOrderDraftStatus.READY_TO_EXPORT,
      requestedServiceType: quote3.serviceType,
      calibrationCategory: null,
      serviceMode: quote3.serviceMode,
      companyName: redwood.company,
      contactName: redwood.mainContact,
      contactEmail: redwood.email,
      contactPhone: redwood.phone,
      equipmentType: quote3.equipmentType,
      manufacturer: quote3.manufacturer,
      modelNumber: quote3.modelNumber,
      serialNumber: quote3.serialNumber,
      unitCount: quote3.unitCount,
      rangeOrCapacity: quote3.rangeOrCapacity,
      units: quote3.units,
      requestedTurnaround: quote3.requestedTurnaround,
      documentationRequirements: quote3.documentationRequirements,
      customerNotes: quote3.issueDescription,
      internalNotesSummary: "Prep for turnaround outage scheduling and field coordination.",
      exportPayload: draftPayload,
    },
  });

  await prisma.quoteRequest.update({
    where: { id: quote3.id },
    data: {
      status: QuoteStatus.CONVERTED_TO_WORK_ORDER_DRAFT,
    },
  });

  const ticketFinancials = calculateTicketFinancials({
    actualHours: 22,
    laborRate: 118,
    materialsCost: 340,
    shippingCost: 120,
    billedAmount: 4550,
  });

  const ticket = await prisma.ticket.upsert({
    where: { ticketNumber: "T-2001" },
    update: {
      quoteId: quote2.id,
      workspaceId: workspaces.auto.id,
      customerId: atlas.id,
      assignedUserId: technicianUser.id,
      type: TicketType.REPAIR,
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.NORMAL,
      assignedTo: "Ava Martinez",
      dueDate: new Date("2026-04-25T16:00:00Z"),
      estimatedHours: 18,
      actualHours: 22,
      laborRate: 118,
      materialsCost: 340,
      shippingCost: 120,
      quotedAmount: 3200,
      billedAmount: 4550,
      totalCost: ticketFinancials.totalCost,
      profitLoss: ticketFinancials.profitLoss,
      marginPercent: ticketFinancials.marginPercent,
      notes: "Parts ordered; brake pads and front control-arm inspection scheduled.",
    },
    create: {
      ticketNumber: "T-2001",
      quoteId: quote2.id,
      workspaceId: workspaces.auto.id,
      customerId: atlas.id,
      assignedUserId: technicianUser.id,
      type: TicketType.REPAIR,
      status: TicketStatus.IN_PROGRESS,
      priority: Priority.NORMAL,
      assignedTo: "Ava Martinez",
      dueDate: new Date("2026-04-25T16:00:00Z"),
      estimatedHours: 18,
      actualHours: 22,
      laborRate: 118,
      materialsCost: 340,
      shippingCost: 120,
      quotedAmount: 3200,
      billedAmount: 4550,
      totalCost: ticketFinancials.totalCost,
      profitLoss: ticketFinancials.profitLoss,
      marginPercent: ticketFinancials.marginPercent,
      notes: "Parts ordered; brake pads and front control-arm inspection scheduled.",
    },
  });

  const demoInvoice = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-1001" },
    update: {
      workspaceId: workspaces.auto.id,
      customerId: atlas.id,
      quoteId: quote2.id,
      ticketId: ticket.id,
      status: InvoiceStatus.SENT,
      subtotal: 4550,
      tax: 0,
      discount: 0,
      total: 4550,
      dueDate: new Date("2026-05-25T16:00:00Z"),
      notes: "Invoice for fleet van brake and suspension service workflow.",
      paymentInstructions: "Payment due within 15 days by ACH, check, or card on file.",
    },
    create: {
      invoiceNumber: "INV-1001",
      workspaceId: workspaces.auto.id,
      customerId: atlas.id,
      quoteId: quote2.id,
      ticketId: ticket.id,
      status: InvoiceStatus.SENT,
      subtotal: 4550,
      tax: 0,
      discount: 0,
      total: 4550,
      dueDate: new Date("2026-05-25T16:00:00Z"),
      notes: "Invoice for fleet van brake and suspension service workflow.",
      paymentInstructions: "Payment due within 15 days by ACH, check, or card on file.",
      lineItems: {
        create: [
          {
            description: "Brake service, front-end diagnosis, and road test",
            quantity: 1,
            unitPrice: 4550,
            amount: 4550,
            sortOrder: 1,
          },
        ],
      },
    },
  });

  await prisma.activityLog.upsert({
    where: { id: "seed-activity-invoice-1" },
    update: {
      customerId: atlas.id,
      quoteId: quote2.id,
      ticketId: ticket.id,
      invoiceId: demoInvoice.id,
    },
    create: {
      id: "seed-activity-invoice-1",
      type: ActivityType.INVOICE_CREATED,
      entityType: "Invoice",
      entityId: demoInvoice.id,
      title: "Demo invoice created",
      description: "INV-1001 demonstrates quote-to-job-to-invoice flow.",
      actor: "ops@stanleysync.app",
      customerId: atlas.id,
      quoteId: quote2.id,
      ticketId: ticket.id,
      invoiceId: demoInvoice.id,
    },
  });

  const generalTicketFinancials = calculateTicketFinancials({
    actualHours: 14,
    laborRate: 96,
    materialsCost: 180,
    shippingCost: 0,
    billedAmount: 1875,
  });

  const generalTicket = await prisma.ticket.upsert({
    where: { ticketNumber: "T-2002" },
    update: {
      quoteId: quote3.id,
      workspaceId: workspaces.general.id,
      customerId: redwood.id,
      assignedUserId: salesUser.id,
      type: TicketType.FIELD_SERVICE,
      status: TicketStatus.COMPLETED,
      priority: Priority.HIGH,
      assignedTo: "Noah Carter",
      dueDate: new Date("2026-04-29T16:00:00Z"),
      estimatedHours: 12,
      actualHours: 14,
      laborRate: 96,
      materialsCost: 180,
      shippingCost: 0,
      quotedAmount: 1650,
      billedAmount: 1875,
      totalCost: generalTicketFinancials.totalCost,
      profitLoss: generalTicketFinancials.profitLoss,
      marginPercent: generalTicketFinancials.marginPercent,
      notes: "General service demo ticket completed for tenant move-in punch list.",
    },
    create: {
      ticketNumber: "T-2002",
      quoteId: quote3.id,
      workspaceId: workspaces.general.id,
      customerId: redwood.id,
      assignedUserId: salesUser.id,
      type: TicketType.FIELD_SERVICE,
      status: TicketStatus.COMPLETED,
      priority: Priority.HIGH,
      assignedTo: "Noah Carter",
      dueDate: new Date("2026-04-29T16:00:00Z"),
      estimatedHours: 12,
      actualHours: 14,
      laborRate: 96,
      materialsCost: 180,
      shippingCost: 0,
      quotedAmount: 1650,
      billedAmount: 1875,
      totalCost: generalTicketFinancials.totalCost,
      profitLoss: generalTicketFinancials.profitLoss,
      marginPercent: generalTicketFinancials.marginPercent,
      notes: "General service demo ticket completed for tenant move-in punch list.",
    },
  });

  const generalInvoice = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-1002" },
    update: {
      workspaceId: workspaces.general.id,
      customerId: redwood.id,
      quoteId: quote3.id,
      ticketId: generalTicket.id,
      status: InvoiceStatus.PAID,
      subtotal: 1875,
      tax: 0,
      discount: 0,
      total: 1875,
      dueDate: new Date("2026-05-15T16:00:00Z"),
      notes: "General service invoice for completed punch-list ticket.",
      paymentInstructions: "Paid by ACH on receipt.",
    },
    create: {
      invoiceNumber: "INV-1002",
      workspaceId: workspaces.general.id,
      customerId: redwood.id,
      quoteId: quote3.id,
      ticketId: generalTicket.id,
      status: InvoiceStatus.PAID,
      subtotal: 1875,
      tax: 0,
      discount: 0,
      total: 1875,
      dueDate: new Date("2026-05-15T16:00:00Z"),
      notes: "General service invoice for completed punch-list ticket.",
      paymentInstructions: "Paid by ACH on receipt.",
      lineItems: {
        create: [
          {
            description: "Facility punch-list labor and materials",
            quantity: 1,
            unitPrice: 1875,
            amount: 1875,
            sortOrder: 1,
          },
        ],
      },
    },
  });

  await prisma.activityLog.upsert({
    where: { id: "seed-activity-invoice-2" },
    update: {
      customerId: redwood.id,
      quoteId: quote3.id,
      ticketId: generalTicket.id,
      invoiceId: generalInvoice.id,
    },
    create: {
      id: "seed-activity-invoice-2",
      type: ActivityType.INVOICE_CREATED,
      entityType: "Invoice",
      entityId: generalInvoice.id,
      title: "General service invoice paid",
      description: "INV-1002 demonstrates QuoteFlow to WorkFlow ticket to paid invoice.",
      actor: "ops@stanleysync.app",
      customerId: redwood.id,
      quoteId: quote3.id,
      ticketId: generalTicket.id,
      invoiceId: generalInvoice.id,
    },
  });

  await prisma.internalNote.createMany({
    data: [
      {
        id: "seed-note-q1",
        quoteRequestId: quote1.id,
        body: "Customer may accept standard lead time if audit date moves.",
        author: "ops@stanleysync.app",
      },
      {
        id: "seed-note-q3",
        quoteRequestId: quote3.id,
        body: "Likely first candidate for future CalOps field-service handoff.",
        author: "ops@stanleysync.app",
      },
      {
        id: "seed-note-d1",
        workOrderDraftId: draft.id,
        body: "Draft includes field reporting expectations and restart timing notes.",
        author: "ops@stanleysync.app",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.integrationExportLog.createMany({
    data: [
      {
        id: "seed-export-log-1",
        workOrderDraftId: draft.id,
        targetSystem: "CalOps",
        status: IntegrationExportStatus.SUCCESS,
        actor: "ops@stanleysync.app",
        message: "Sample JSON handoff generated for future CalOps import.",
        payload: draftPayload,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.activityLog.createMany({
    data: [
      {
        type: ActivityType.QUOTE_SUBMITTED,
        entityType: "QuoteRequest",
        entityId: quote1.id,
        title: "Quote submitted",
        description: "Q-1001 submitted by Jordan Lee.",
        customerId: summit.id,
        quoteId: quote1.id,
      },
      {
        type: ActivityType.QUOTE_STATUS_CHANGED,
        entityType: "QuoteRequest",
        entityId: quote1.id,
        title: "Quote status changed",
        description: "Q-1001 moved to Reviewing.",
        customerId: summit.id,
        quoteId: quote1.id,
      },
      {
        type: ActivityType.QUOTE_CONVERTED_TO_TICKET,
        entityType: "QuoteRequest",
        entityId: quote2.id,
        title: "Quote converted to ticket",
        description: "Q-1002 converted to T-2001 for legacy internal tracking.",
        customerId: atlas.id,
        quoteId: quote2.id,
        ticketId: ticket.id,
      },
      {
        type: ActivityType.WORK_ORDER_DRAFT_CREATED,
        entityType: "WorkOrderDraft",
        entityId: draft.id,
        title: "Work order draft created",
        description: "WO-3001 created from Q-1003 for future CalOps handoff.",
        customerId: redwood.id,
        quoteId: quote3.id,
      },
      {
        type: ActivityType.WORK_ORDER_DRAFT_EXPORTED,
        entityType: "WorkOrderDraft",
        entityId: draft.id,
        title: "Work order draft exported",
        description: "WO-3001 exported as QuoteFlow JSON for future CalOps import.",
        customerId: redwood.id,
        quoteId: quote3.id,
        payload: draftPayload,
      },
      {
        type: ActivityType.TICKET_CREATED,
        entityType: "Ticket",
        entityId: ticket.id,
        title: "Ticket created",
        description: "T-2001 created from approved repair quote.",
        customerId: atlas.id,
        quoteId: quote2.id,
        ticketId: ticket.id,
      },
      {
        type: ActivityType.ASSIGNMENT_CHANGED,
        entityType: "Ticket",
        entityId: ticket.id,
        title: "Assignment changed",
        description: "T-2001 assigned to Ava Martinez.",
        customerId: atlas.id,
        ticketId: ticket.id,
      },
      {
        type: ActivityType.TICKET_COMMENT_ADDED,
        entityType: "Ticket",
        entityId: ticket.id,
        title: "Technician note added",
        description: "Technician added a bench update note for T-2001.",
        actor: technicianUser.email,
        customerId: atlas.id,
        ticketId: ticket.id,
      },
      {
        type: ActivityType.EMAIL_SENT,
        entityType: "QuoteRequest",
        entityId: quote3.id,
        title: "Notification email sent",
        description: "Admin notification triggered for Q-1003.",
        customerId: redwood.id,
        quoteId: quote3.id,
      },
    ],
  });

  await prisma.ticketComment.createMany({
    data: [
      {
        id: "seed-ticket-comment-1",
        ticketId: ticket.id,
        authorUserId: technicianUser.id,
        body: "Bench inspection started. Two gauges need sensor replacement before final calibration.",
      },
      {
        id: "seed-ticket-comment-2",
        ticketId: ticket.id,
        authorUserId: managerUser.id,
        body: "Replacement sensors approved. Keep customer updated if shipping slips past Friday.",
      },
    ],
    skipDuplicates: true,
  });

  const idea1 = await prisma.ideaPost.upsert({
    where: { id: "seed-idea-1" },
    update: {
      title: "Add calibration certificate checklist to intake review",
      description:
        "Sales keeps chasing certificate requirements after the quote is submitted. Add a review checklist so the team can spot missing documentation needs earlier.",
      category: "Workflow",
      priority: Priority.HIGH,
      status: IdeaStatus.REVIEWING,
      createdByUserId: salesUser.id,
      ownerUserId: managerUser.id,
    },
    create: {
      id: "seed-idea-1",
      title: "Add calibration certificate checklist to intake review",
      description:
        "Sales keeps chasing certificate requirements after the quote is submitted. Add a review checklist so the team can spot missing documentation needs earlier.",
      category: "Workflow",
      priority: Priority.HIGH,
      status: IdeaStatus.REVIEWING,
      createdByUserId: salesUser.id,
      ownerUserId: managerUser.id,
    },
  });

  const idea2 = await prisma.ideaPost.upsert({
    where: { id: "seed-idea-2" },
    update: {
      title: "Technician overdue board for ship-in repairs",
      description:
        "Create a lightweight technician-focused board that highlights due dates, waiting-on-parts items, and blocked jobs before they turn overdue.",
      category: "Operations",
      priority: Priority.NORMAL,
      status: IdeaStatus.PLANNED,
      createdByUserId: technicianUser.id,
      ownerUserId: adminUser.id,
    },
    create: {
      id: "seed-idea-2",
      title: "Technician overdue board for ship-in repairs",
      description:
        "Create a lightweight technician-focused board that highlights due dates, waiting-on-parts items, and blocked jobs before they turn overdue.",
      category: "Operations",
      priority: Priority.NORMAL,
      status: IdeaStatus.PLANNED,
      createdByUserId: technicianUser.id,
      ownerUserId: adminUser.id,
    },
  });

  await prisma.ideaComment.createMany({
    data: [
      {
        id: "seed-idea-comment-1",
        postId: idea1.id,
        authorUserId: managerUser.id,
        body: "Agreed. We can surface this in review controls and the export draft summary.",
      },
      {
        id: "seed-idea-comment-2",
        postId: idea2.id,
        authorUserId: adminUser.id,
        body: "Planned for the next operations pass after team roles are live.",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.activityLog.createMany({
    data: [
      {
        type: ActivityType.IDEA_POST_CREATED,
        entityType: "IdeaPost",
        entityId: idea1.id,
        title: "Idea posted",
        description: "Sales proposed a certificate checklist improvement for intake review.",
        actor: salesUser.email,
      },
      {
        type: ActivityType.IDEA_STATUS_CHANGED,
        entityType: "IdeaPost",
        entityId: idea2.id,
        title: "Idea status changed",
        description: "Technician dashboard idea moved into Planned.",
        actor: adminUser.email,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.notificationEvent.createMany({
    data: [
      {
        id: "seed-notification-quote-submitted",
        workspaceId: workspaces.general.id,
        type: NotificationEventType.QUOTE_SUBMITTED,
        status: NotificationStatus.SENT,
        recipient: "ops@stanleysync.app",
        subject: "New quote submitted",
        provider: "placeholder",
        payload: { quoteNumber: quote1.quoteNumber },
        sentAt: new Date("2026-04-18T09:16:00Z"),
      },
      {
        id: "seed-notification-job-assigned",
        workspaceId: workspaces.auto.id,
        type: NotificationEventType.JOB_ASSIGNED,
        status: NotificationStatus.PENDING,
        recipient: technicianUser.email,
        subject: "Job assigned: T-2001",
        provider: "placeholder",
        payload: { ticketNumber: ticket.ticketNumber },
      },
      {
        id: "seed-notification-cert-ready",
        workspaceId: workspaces.calibration.id,
        type: NotificationEventType.CERTIFICATE_READY,
        status: NotificationStatus.PENDING,
        recipient: managerUser.email,
        subject: "Certificate ready for review",
        provider: "placeholder",
        payload: { workspace: workspaces.calibration.businessName },
      },
    ],
    skipDuplicates: true,
  });

  await prisma.auditEvent.createMany({
    data: [
      {
        id: "seed-audit-quote-change",
        workspaceId: workspaces.general.id,
        actorUserId: salesUser.id,
        actorEmail: salesUser.email,
        action: "quote.status.changed",
        entityType: "QuoteRequest",
        entityId: quote1.id,
        summary: "Quote moved into review.",
        payload: { quoteNumber: quote1.quoteNumber, status: QuoteStatus.REVIEWING },
      },
      {
        id: "seed-audit-ticket-edit",
        workspaceId: workspaces.auto.id,
        actorUserId: managerUser.id,
        actorEmail: managerUser.email,
        action: "ticket.assignment.changed",
        entityType: "Ticket",
        entityId: ticket.id,
        summary: "Repair job assigned to technician.",
        payload: { ticketNumber: ticket.ticketNumber, assignedTo: technicianUser.email },
      },
      {
        id: "seed-audit-calops-traceability",
        workspaceId: workspaces.calibration.id,
        actorUserId: adminUser.id,
        actorEmail: adminUser.email,
        action: "calops.traceability.reviewed",
        entityType: "CalibrationWorkOrder",
        summary: "Seeded traceability review entry for the CalOps audit center.",
        payload: { module: "CalOps" },
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
