ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CAL_ASSET_CREATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CAL_WORK_ORDER_CREATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CAL_WORK_ORDER_STATUS_CHANGED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CAL_WORK_ORDER_NOTE_ADDED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'CERTIFICATE_DRAFT_CREATED';

DO $$
BEGIN
  CREATE TYPE "AssetType" AS ENUM ('TORQUE', 'PRESSURE', 'LOAD', 'DIMENSIONAL', 'ELECTRICAL', 'TEMPERATURE', 'MASS', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "AssetStatus" AS ENUM ('IN_TOLERANCE', 'DUE_SOON', 'OVERDUE', 'OOT', 'REPAIR_HOLD');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "CalibrationIntervalUnit" AS ENUM ('DAYS', 'MONTHS', 'YEARS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "CalServiceType" AS ENUM ('CALIBRATION', 'REPAIR', 'ADJUSTMENT', 'DATA_ONLY', 'ONSITE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "CalibrationWorkOrderStatus" AS ENUM ('RECEIVED', 'IN_PROCESS', 'CALIBRATION_COMPLETE', 'TECHNICAL_REVIEW', 'CERTIFICATE_READY', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "CertificateStatus" AS ENUM ('DRAFT', 'READY', 'ISSUED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "CalAsset" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "manufacturer" TEXT,
  "model" TEXT,
  "serialNumber" TEXT,
  "assetType" "AssetType" NOT NULL,
  "capacityRange" TEXT,
  "accuracyTolerance" TEXT,
  "procedureId" TEXT,
  "calibrationInterval" INTEGER,
  "intervalUnit" "CalibrationIntervalUnit" NOT NULL DEFAULT 'MONTHS',
  "lastCalDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "status" "AssetStatus" NOT NULL DEFAULT 'IN_TOLERANCE',
  "parentAssetId" TEXT,
  "notes" TEXT,
  "history" TEXT,
  "attachmentsNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CalibrationProcedure" (
  "id" TEXT NOT NULL,
  "procedureNumber" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "discipline" TEXT NOT NULL,
  "revision" TEXT NOT NULL,
  "controlledIssueDate" TIMESTAMP(3) NOT NULL,
  "uncertaintyReference" TEXT,
  "instructions" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalibrationProcedure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CalibrationStandard" (
  "id" TEXT NOT NULL,
  "standardId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "traceabilitySource" TEXT,
  "certNumber" TEXT,
  "dueDate" TIMESTAMP(3),
  "uncertainty" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalibrationStandard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CalibrationWorkOrder" (
  "id" TEXT NOT NULL,
  "woNumber" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "serviceType" "CalServiceType" NOT NULL,
  "assignedUserId" TEXT,
  "assignedTechnician" TEXT,
  "dueDate" TIMESTAMP(3),
  "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
  "status" "CalibrationWorkOrderStatus" NOT NULL DEFAULT 'RECEIVED',
  "procedureId" TEXT,
  "intakeNotes" TEXT,
  "calibrationData" TEXT,
  "uncertaintyNotes" TEXT,
  "certificateNotes" TEXT,
  "revenueAmount" DOUBLE PRECISION,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalibrationWorkOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CalibrationWorkOrderAsset" (
  "id" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "asFound" TEXT,
  "asLeft" TEXT,
  "passFail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalibrationWorkOrderAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CalibrationWorkOrderStandard" (
  "id" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "standardId" TEXT NOT NULL,
  "usageNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalibrationWorkOrderStandard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CalibrationRecordEntry" (
  "id" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "enteredByUserId" TEXT,
  "label" TEXT NOT NULL,
  "asFound" TEXT,
  "asLeft" TEXT,
  "tolerance" TEXT,
  "result" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalibrationRecordEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CalibrationFinding" (
  "id" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "authorUserId" TEXT,
  "findingType" TEXT NOT NULL,
  "severity" TEXT,
  "description" TEXT NOT NULL,
  "correctiveAction" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalibrationFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CalActivityLog" (
  "id" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CertificateDraft" (
  "id" TEXT NOT NULL,
  "certificateNumber" TEXT NOT NULL,
  "workOrderId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "assetId" TEXT,
  "status" "CertificateStatus" NOT NULL DEFAULT 'DRAFT',
  "asFoundSummary" TEXT,
  "asLeftSummary" TEXT,
  "passFail" TEXT,
  "notes" TEXT,
  "uncertaintyStatement" TEXT,
  "traceabilityStatement" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CertificateDraft_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "_AssetStandards" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "_ProcedureStandards" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "CalAsset_assetId_key" ON "CalAsset"("assetId");
CREATE INDEX IF NOT EXISTS "CalAsset_customerId_idx" ON "CalAsset"("customerId");
CREATE INDEX IF NOT EXISTS "CalAsset_procedureId_idx" ON "CalAsset"("procedureId");
CREATE INDEX IF NOT EXISTS "CalAsset_status_idx" ON "CalAsset"("status");
CREATE INDEX IF NOT EXISTS "CalAsset_dueDate_idx" ON "CalAsset"("dueDate");
CREATE INDEX IF NOT EXISTS "CalAsset_assetType_idx" ON "CalAsset"("assetType");
CREATE UNIQUE INDEX IF NOT EXISTS "CalibrationProcedure_procedureNumber_key" ON "CalibrationProcedure"("procedureNumber");
CREATE INDEX IF NOT EXISTS "CalibrationProcedure_discipline_idx" ON "CalibrationProcedure"("discipline");
CREATE INDEX IF NOT EXISTS "CalibrationProcedure_isActive_idx" ON "CalibrationProcedure"("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "CalibrationStandard_standardId_key" ON "CalibrationStandard"("standardId");
CREATE INDEX IF NOT EXISTS "CalibrationStandard_dueDate_idx" ON "CalibrationStandard"("dueDate");
CREATE UNIQUE INDEX IF NOT EXISTS "CalibrationWorkOrder_woNumber_key" ON "CalibrationWorkOrder"("woNumber");
CREATE INDEX IF NOT EXISTS "CalibrationWorkOrder_customerId_idx" ON "CalibrationWorkOrder"("customerId");
CREATE INDEX IF NOT EXISTS "CalibrationWorkOrder_assignedUserId_idx" ON "CalibrationWorkOrder"("assignedUserId");
CREATE INDEX IF NOT EXISTS "CalibrationWorkOrder_status_idx" ON "CalibrationWorkOrder"("status");
CREATE INDEX IF NOT EXISTS "CalibrationWorkOrder_dueDate_idx" ON "CalibrationWorkOrder"("dueDate");
CREATE INDEX IF NOT EXISTS "CalibrationWorkOrder_procedureId_idx" ON "CalibrationWorkOrder"("procedureId");
CREATE UNIQUE INDEX IF NOT EXISTS "CalibrationWorkOrderAsset_workOrderId_assetId_key" ON "CalibrationWorkOrderAsset"("workOrderId", "assetId");
CREATE INDEX IF NOT EXISTS "CalibrationWorkOrderAsset_assetId_idx" ON "CalibrationWorkOrderAsset"("assetId");
CREATE UNIQUE INDEX IF NOT EXISTS "CalibrationWorkOrderStandard_workOrderId_standardId_key" ON "CalibrationWorkOrderStandard"("workOrderId", "standardId");
CREATE INDEX IF NOT EXISTS "CalibrationWorkOrderStandard_standardId_idx" ON "CalibrationWorkOrderStandard"("standardId");
CREATE INDEX IF NOT EXISTS "CalibrationRecordEntry_workOrderId_idx" ON "CalibrationRecordEntry"("workOrderId");
CREATE INDEX IF NOT EXISTS "CalibrationRecordEntry_enteredByUserId_idx" ON "CalibrationRecordEntry"("enteredByUserId");
CREATE INDEX IF NOT EXISTS "CalibrationFinding_workOrderId_idx" ON "CalibrationFinding"("workOrderId");
CREATE INDEX IF NOT EXISTS "CalibrationFinding_authorUserId_idx" ON "CalibrationFinding"("authorUserId");
CREATE INDEX IF NOT EXISTS "CalActivityLog_workOrderId_idx" ON "CalActivityLog"("workOrderId");
CREATE INDEX IF NOT EXISTS "CalActivityLog_actorUserId_idx" ON "CalActivityLog"("actorUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "CertificateDraft_certificateNumber_key" ON "CertificateDraft"("certificateNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "CertificateDraft_workOrderId_key" ON "CertificateDraft"("workOrderId");
CREATE INDEX IF NOT EXISTS "CertificateDraft_customerId_idx" ON "CertificateDraft"("customerId");
CREATE INDEX IF NOT EXISTS "CertificateDraft_assetId_idx" ON "CertificateDraft"("assetId");
CREATE INDEX IF NOT EXISTS "CertificateDraft_status_idx" ON "CertificateDraft"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "_AssetStandards_AB_unique" ON "_AssetStandards"("A", "B");
CREATE INDEX IF NOT EXISTS "_AssetStandards_B_index" ON "_AssetStandards"("B");
CREATE UNIQUE INDEX IF NOT EXISTS "_ProcedureStandards_AB_unique" ON "_ProcedureStandards"("A", "B");
CREATE INDEX IF NOT EXISTS "_ProcedureStandards_B_index" ON "_ProcedureStandards"("B");

DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT * FROM (VALUES
      ('CalAsset_customerId_fkey', 'ALTER TABLE "CalAsset" ADD CONSTRAINT "CalAsset_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('CalAsset_procedureId_fkey', 'ALTER TABLE "CalAsset" ADD CONSTRAINT "CalAsset_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "CalibrationProcedure"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('CalAsset_parentAssetId_fkey', 'ALTER TABLE "CalAsset" ADD CONSTRAINT "CalAsset_parentAssetId_fkey" FOREIGN KEY ("parentAssetId") REFERENCES "CalAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('CalibrationWorkOrder_customerId_fkey', 'ALTER TABLE "CalibrationWorkOrder" ADD CONSTRAINT "CalibrationWorkOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('CalibrationWorkOrder_assignedUserId_fkey', 'ALTER TABLE "CalibrationWorkOrder" ADD CONSTRAINT "CalibrationWorkOrder_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('CalibrationWorkOrder_procedureId_fkey', 'ALTER TABLE "CalibrationWorkOrder" ADD CONSTRAINT "CalibrationWorkOrder_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "CalibrationProcedure"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('CalibrationWorkOrderAsset_workOrderId_fkey', 'ALTER TABLE "CalibrationWorkOrderAsset" ADD CONSTRAINT "CalibrationWorkOrderAsset_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "CalibrationWorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('CalibrationWorkOrderAsset_assetId_fkey', 'ALTER TABLE "CalibrationWorkOrderAsset" ADD CONSTRAINT "CalibrationWorkOrderAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "CalAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('CalibrationWorkOrderStandard_workOrderId_fkey', 'ALTER TABLE "CalibrationWorkOrderStandard" ADD CONSTRAINT "CalibrationWorkOrderStandard_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "CalibrationWorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('CalibrationWorkOrderStandard_standardId_fkey', 'ALTER TABLE "CalibrationWorkOrderStandard" ADD CONSTRAINT "CalibrationWorkOrderStandard_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "CalibrationStandard"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('CalibrationRecordEntry_workOrderId_fkey', 'ALTER TABLE "CalibrationRecordEntry" ADD CONSTRAINT "CalibrationRecordEntry_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "CalibrationWorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('CalibrationRecordEntry_enteredByUserId_fkey', 'ALTER TABLE "CalibrationRecordEntry" ADD CONSTRAINT "CalibrationRecordEntry_enteredByUserId_fkey" FOREIGN KEY ("enteredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('CalibrationFinding_workOrderId_fkey', 'ALTER TABLE "CalibrationFinding" ADD CONSTRAINT "CalibrationFinding_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "CalibrationWorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('CalibrationFinding_authorUserId_fkey', 'ALTER TABLE "CalibrationFinding" ADD CONSTRAINT "CalibrationFinding_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('CalActivityLog_workOrderId_fkey', 'ALTER TABLE "CalActivityLog" ADD CONSTRAINT "CalActivityLog_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "CalibrationWorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('CalActivityLog_actorUserId_fkey', 'ALTER TABLE "CalActivityLog" ADD CONSTRAINT "CalActivityLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('CertificateDraft_workOrderId_fkey', 'ALTER TABLE "CertificateDraft" ADD CONSTRAINT "CertificateDraft_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "CalibrationWorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('CertificateDraft_customerId_fkey', 'ALTER TABLE "CertificateDraft" ADD CONSTRAINT "CertificateDraft_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('CertificateDraft_assetId_fkey', 'ALTER TABLE "CertificateDraft" ADD CONSTRAINT "CertificateDraft_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "CalAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE'),
      ('_AssetStandards_A_fkey', 'ALTER TABLE "_AssetStandards" ADD CONSTRAINT "_AssetStandards_A_fkey" FOREIGN KEY ("A") REFERENCES "CalAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('_AssetStandards_B_fkey', 'ALTER TABLE "_AssetStandards" ADD CONSTRAINT "_AssetStandards_B_fkey" FOREIGN KEY ("B") REFERENCES "CalibrationStandard"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('_ProcedureStandards_A_fkey', 'ALTER TABLE "_ProcedureStandards" ADD CONSTRAINT "_ProcedureStandards_A_fkey" FOREIGN KEY ("A") REFERENCES "CalibrationProcedure"("id") ON DELETE CASCADE ON UPDATE CASCADE'),
      ('_ProcedureStandards_B_fkey', 'ALTER TABLE "_ProcedureStandards" ADD CONSTRAINT "_ProcedureStandards_B_fkey" FOREIGN KEY ("B") REFERENCES "CalibrationStandard"("id") ON DELETE CASCADE ON UPDATE CASCADE')
    ) AS constraints(name, sql)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = constraint_record.name) THEN
      EXECUTE constraint_record.sql;
    END IF;
  END LOOP;
END $$;
