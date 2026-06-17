DO $$
BEGIN
  CREATE TYPE "BusinessType" AS ENUM ('GENERAL_SERVICE', 'AUTO_REPAIR', 'CONTRACTOR_FIELD_SERVICE', 'CALIBRATION_LAB', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "BusinessWorkspace" (
  "id" TEXT NOT NULL,
  "workspaceKey" TEXT NOT NULL,
  "businessName" TEXT NOT NULL,
  "businessType" "BusinessType" NOT NULL,
  "industry" TEXT,
  "serviceCategories" JSONB NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "website" TEXT,
  "address" TEXT,
  "logoPlaceholder" TEXT,
  "brandColors" JSONB NOT NULL,
  "enabledModules" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessWorkspace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BusinessWorkspace_workspaceKey_key" ON "BusinessWorkspace"("workspaceKey");
CREATE INDEX IF NOT EXISTS "BusinessWorkspace_businessType_idx" ON "BusinessWorkspace"("businessType");
CREATE INDEX IF NOT EXISTS "BusinessWorkspace_isActive_idx" ON "BusinessWorkspace"("isActive");

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "activeWorkspaceId" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "WebsiteProject" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "CalAsset" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "CalibrationProcedure" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "CalibrationStandard" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "CalibrationWorkOrder" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "CertificateDraft" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

CREATE INDEX IF NOT EXISTS "User_activeWorkspaceId_idx" ON "User"("activeWorkspaceId");
CREATE INDEX IF NOT EXISTS "Customer_workspaceId_idx" ON "Customer"("workspaceId");
CREATE INDEX IF NOT EXISTS "QuoteRequest_workspaceId_idx" ON "QuoteRequest"("workspaceId");
CREATE INDEX IF NOT EXISTS "Ticket_workspaceId_idx" ON "Ticket"("workspaceId");
CREATE INDEX IF NOT EXISTS "WebsiteProject_workspaceId_idx" ON "WebsiteProject"("workspaceId");
CREATE INDEX IF NOT EXISTS "CalAsset_workspaceId_idx" ON "CalAsset"("workspaceId");
CREATE INDEX IF NOT EXISTS "CalibrationProcedure_workspaceId_idx" ON "CalibrationProcedure"("workspaceId");
CREATE INDEX IF NOT EXISTS "CalibrationStandard_workspaceId_idx" ON "CalibrationStandard"("workspaceId");
CREATE INDEX IF NOT EXISTS "CalibrationWorkOrder_workspaceId_idx" ON "CalibrationWorkOrder"("workspaceId");
CREATE INDEX IF NOT EXISTS "CertificateDraft_workspaceId_idx" ON "CertificateDraft"("workspaceId");

DO $$
BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_activeWorkspaceId_fkey" FOREIGN KEY ("activeWorkspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Customer" ADD CONSTRAINT "Customer_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "WebsiteProject" ADD CONSTRAINT "WebsiteProject_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CalAsset" ADD CONSTRAINT "CalAsset_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CalibrationProcedure" ADD CONSTRAINT "CalibrationProcedure_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CalibrationStandard" ADD CONSTRAINT "CalibrationStandard_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CalibrationWorkOrder" ADD CONSTRAINT "CalibrationWorkOrder_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CertificateDraft" ADD CONSTRAINT "CertificateDraft_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
