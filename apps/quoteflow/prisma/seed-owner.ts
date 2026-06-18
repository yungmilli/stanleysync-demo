import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();
const OWNER_EMAIL = "masonstanley@stanleysync.com";

async function main() {
  const ownerPassword = process.env.OWNER_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  if (!ownerPassword || ownerPassword.length < 8) {
    throw new Error("Set OWNER_PASSWORD or ADMIN_PASSWORD to the intended owner password.");
  }

  const primaryWorkspace = await prisma.businessWorkspace.findUnique({
    where: { workspaceKey: "general-service-demo" },
    select: { id: true, businessName: true },
  });

  if (!primaryWorkspace) {
    throw new Error(
      "StanleySync App workspace was not found. Run database migrations and the demo seed first.",
    );
  }

  const activeWorkspaceCount = await prisma.businessWorkspace.count({
    where: { isActive: true },
  });

  const passwordHash = await bcrypt.hash(ownerPassword, 12);
  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: {
      name: "Mason Stanley",
      role: UserRole.SYSTEM_OWNER,
      passwordHash,
      isActive: true,
      activeWorkspaceId: primaryWorkspace.id,
    },
    create: {
      name: "Mason Stanley",
      email: OWNER_EMAIL,
      role: UserRole.SYSTEM_OWNER,
      passwordHash,
      isActive: true,
      activeWorkspaceId: primaryWorkspace.id,
    },
  });

  await prisma.user.updateMany({
    where: {
      email: "owner@stanleysync.app",
      id: { not: owner.id },
    },
    data: { isActive: false },
  });

  console.info("StanleySync owner account is ready.", {
    email: owner.email,
    role: owner.role,
    workspace: primaryWorkspace.businessName,
    workspaceAccess: "all active workspaces via SYSTEM_OWNER",
    activeWorkspaceCount,
    isActive: owner.isActive,
  });
}

main()
  .catch((error) => {
    console.error("Owner seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
