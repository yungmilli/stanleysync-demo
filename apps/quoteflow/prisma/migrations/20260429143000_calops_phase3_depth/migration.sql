DO $$
BEGIN
  CREATE TYPE "CalibrationDecision" AS ENUM ('PASS', 'FAIL', 'ADJUSTED_PASS', 'REVIEW_REQUIRED', 'NOT_EVALUATED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "RecallStatus" AS ENUM ('OPEN', 'SCHEDULED', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "AssetHistoryType" AS ENUM ('CREATED', 'CALIBRATED', 'REPAIRED', 'OOT_FOUND', 'RECALL_SENT', 'NOTE', 'STANDARD_LINKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ExportPackageType" AS ENUM ('WORK_ORDER_PACKAGE', 'CERTIFICATE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Lab" (
  "id" TEXT NOT NULL,
  "labCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "phone" TEXT,
  "accreditation" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Lab_labCode_key" ON "Lab"("labCode");
CREATE INDEX IF NOT EXISTS "Lab_isActive_idx" ON "Lab"("isActive");

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "labId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "labId" TEXT;
ALTER TABLE "CalAsset" ADD COLUMN IF NOT EXISTS "labId" TEXT;
ALTER TABLE "CalibrationProcedure" ADD COLUMN IF NOT EXISTS "labId" TEXT;
ALTER TABLE "CalibrationStandard" ADD COLUMN IF NOT EXISTS "labId" TEXT;
ALTER TABLE "CalibrationWorkOrder" ADD COLUMN IF NOT EXISTS "labId" TEXT;
ALTER TABLE "CertificateDraft" ADD COLUMN IF NOT EXISTS "labId" TEXT;

ALTER TABLE "CalibrationRecordEntry" ADD COLUMN IF NOT EXISTS "nominalValue" DOUBLE PRECISION;
ALTER TABLE "CalibrationRecordEntry" ADD COLUMN IF NOT EXISTS "asFoundValue" DOUBLE PRECISION;
ALTER TABLE "CalibrationRecordEntry" ADD COLUMN IF NOT EXISTS "asLeftValue" DOUBLE PRECISION;
ALTER TABLE "CalibrationRecordEntry" ADD COLUMN IF NOT EXISTS "toleranceLow" DOUBLE PRECISION;
ALTER TABLE "CalibrationRecordEntry" ADD COLUMN IF NOT EXISTS "toleranceHigh" DOUBLE PRECISION;
ALTER TABLE "CalibrationRecordEntry" ADD COLUMN IF NOT EXISTS "units" TEXT;
ALTER TABLE "CalibrationRecordEntry" ADD COLUMN IF NOT EXISTS "decision" "CalibrationDecision" NOT NULL DEFAULT 'NOT_EVALUATED';
ALTER TABLE "CalibrationRecordEntry" ADD COLUMN IF NOT EXISTS "isOutOfTolerance" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "CertificateDraft" ADD COLUMN IF NOT EXISTS "accreditationStatement" TEXT;
ALTER TABLE "CertificateDraft" ADD COLUMN IF NOT EXISTS "environmentalConditions" TEXT;
ALTER TABLE "CertificateDraft" ADD COLUMN IF NOT EXISTS "calibrationMethod" TEXT;
ALTER TABLE "CertificateDraft" ADD COLUMN IF NOT EXISTS "statementOfConformity" TEXT;
ALTER TABLE "CertificateDraft" ADD COLUMN IF NOT EXISTS "decisionRule" TEXT;
ALTER TABLE "CertificateDraft" ADD COLUMN IF NOT EXISTS "authorizedReviewer" TEXT;
ALTER TABLE "CertificateDraft" ADD COLUMN IF NOT EXISTS "issueDate" TIMESTAMP(3);
ALTER TABLE "CertificateDraft" ADD COLUMN IF NOT EXISTS "revision" TEXT;

CREATE TABLE IF NOT EXISTS "AssetRecall" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "recallDate" TIMESTAMP(3) NOT NULL,
  "status" "RecallStatus" NOT NULL DEFAULT 'OPEN',
  "method" TEXT,
  "message" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssetRecall_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AssetHistoryEvent" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "workOrderId" TEXT,
  "actorUserId" TEXT,
  "type" "AssetHistoryType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssetHistoryEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WorkOrderPackageExport" (
  "id" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "exportedByUserId" TEXT,
  "packageType" "ExportPackageType" NOT NULL,
  "title" TEXT NOT NULL,
  "format" TEXT NOT NULL DEFAULT 'PRINT_PDF',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkOrderPackageExport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Customer_labId_idx" ON "Customer"("labId");
CREATE INDEX IF NOT EXISTS "User_labId_idx" ON "User"("labId");
CREATE INDEX IF NOT EXISTS "CalAsset_labId_idx" ON "CalAsset"("labId");
CREATE INDEX IF NOT EXISTS "CalibrationProcedure_labId_idx" ON "CalibrationProcedure"("labId");
CREATE INDEX IF NOT EXISTS "CalibrationStandard_labId_idx" ON "CalibrationStandard"("labId");
CREATE INDEX IF NOT EXISTS "CalibrationWorkOrder_labId_idx" ON "CalibrationWorkOrder"("labId");
CREATE INDEX IF NOT EXISTS "CertificateDraft_labId_idx" ON "CertificateDraft"("labId");
CREATE INDEX IF NOT EXISTS "AssetRecall_assetId_idx" ON "AssetRecall"("assetId");
CREATE INDEX IF NOT EXISTS "AssetRecall_dueDate_idx" ON "AssetRecall"("dueDate");
CREATE INDEX IF NOT EXISTS "AssetRecall_status_idx" ON "AssetRecall"("status");
CREATE INDEX IF NOT EXISTS "AssetHistoryEvent_assetId_idx" ON "AssetHistoryEvent"("assetId");
CREATE INDEX IF NOT EXISTS "AssetHistoryEvent_workOrderId_idx" ON "AssetHistoryEvent"("workOrderId");
CREATE INDEX IF NOT EXISTS "AssetHistoryEvent_actorUserId_idx" ON "AssetHistoryEvent"("actorUserId");
CREATE INDEX IF NOT EXISTS "AssetHistoryEvent_type_idx" ON "AssetHistoryEvent"("type");
CREATE INDEX IF NOT EXISTS "WorkOrderPackageExport_workOrderId_idx" ON "WorkOrderPackageExport"("workOrderId");
CREATE INDEX IF NOT EXISTS "WorkOrderPackageExport_exportedByUserId_idx" ON "WorkOrderPackageExport"("exportedByUserId");
CREATE INDEX IF NOT EXISTS "WorkOrderPackageExport_packageType_idx" ON "WorkOrderPackageExport"("packageType");

DO $$
BEGIN
  ALTER TABLE "Customer" ADD CONSTRAINT "Customer_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CalAsset" ADD CONSTRAINT "CalAsset_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CalibrationProcedure" ADD CONSTRAINT "CalibrationProcedure_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CalibrationStandard" ADD CONSTRAINT "CalibrationStandard_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CalibrationWorkOrder" ADD CONSTRAINT "CalibrationWorkOrder_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CertificateDraft" ADD CONSTRAINT "CertificateDraft_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "AssetRecall" ADD CONSTRAINT "AssetRecall_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "CalAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "AssetHistoryEvent" ADD CONSTRAINT "AssetHistoryEvent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "CalAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "AssetHistoryEvent" ADD CONSTRAINT "AssetHistoryEvent_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "CalibrationWorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "AssetHistoryEvent" ADD CONSTRAINT "AssetHistoryEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "WorkOrderPackageExport" ADD CONSTRAINT "WorkOrderPackageExport_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "CalibrationWorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "WorkOrderPackageExport" ADD CONSTRAINT "WorkOrderPackageExport_exportedByUserId_fkey" FOREIGN KEY ("exportedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
