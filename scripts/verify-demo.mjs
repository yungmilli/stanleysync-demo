import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const requiredEnv = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "APP_BASE_URL",
  "ADMIN_EMAIL",
];

const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

if (process.env.DEMO_MODE !== "true") {
  console.error("DEMO_MODE must be true for hosted demo verification.");
  process.exit(1);
}

if (process.env.PILOT_MODE !== "true") {
  console.error("PILOT_MODE must be true for hosted demo verification.");
  process.exit(1);
}

if (process.env.ENABLE_LABS_MODULE !== "false") {
  console.error("ENABLE_LABS_MODULE should be false for the general-service hosted demo.");
  process.exit(1);
}

if (process.env.ENABLE_PUBLIC_SIGNUP !== "false") {
  console.error("ENABLE_PUBLIC_SIGNUP should be false for the hosted demo.");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const [demoUser, quoteCount, ticketCount, invoiceCount, workspaceCount] = await Promise.all([
    prisma.user.findUnique({ where: { email: "demo@stanleysync.app" } }),
    prisma.quoteRequest.count(),
    prisma.ticket.count(),
    prisma.invoice.count(),
    prisma.businessWorkspace.count(),
  ]);

  const failures = [];

  if (!demoUser || !demoUser.isActive) {
    failures.push("demo@stanleysync.app is missing or inactive.");
  }

  if (workspaceCount < 1) failures.push("No business workspaces found.");
  if (quoteCount < 1) failures.push("No quote records found.");
  if (ticketCount < 1) failures.push("No job records found.");
  if (invoiceCount < 1) failures.push("No invoice records found.");

  if (failures.length) {
    console.error("Demo verification failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log("Demo verification passed.");
  console.log(`Workspaces: ${workspaceCount}`);
  console.log(`Quotes: ${quoteCount}`);
  console.log(`Jobs: ${ticketCount}`);
  console.log(`Invoices: ${invoiceCount}`);
  console.log("Demo user: demo@stanleysync.app active");
} finally {
  await prisma.$disconnect();
}
