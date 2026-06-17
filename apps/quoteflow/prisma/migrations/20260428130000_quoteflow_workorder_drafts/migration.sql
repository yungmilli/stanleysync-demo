ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'WORK_ORDER_DRAFT_CREATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'WORK_ORDER_DRAFT_EXPORTED';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkOrderDraftStatus') THEN
    CREATE TYPE "WorkOrderDraftStatus" AS ENUM ('DRAFT', 'READY_TO_EXPORT', 'EXPORTED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IntegrationExportStatus') THEN
    CREATE TYPE "IntegrationExportStatus" AS ENUM ('SUCCESS', 'FAILED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuoteStatus_v2') THEN
    CREATE TYPE "QuoteStatus_v2" AS ENUM (
      'NEW',
      'REVIEWING',
      'NEEDS_MORE_INFO',
      'QUOTED',
      'CONVERTED_TO_WORK_ORDER_DRAFT',
      'CLOSED'
    );
  END IF;
END $$;

ALTER TABLE "QuoteRequest" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "QuoteRequest"
ALTER COLUMN "status" TYPE "QuoteStatus_v2"
USING (
  CASE "status"::text
    WHEN 'NEW' THEN 'NEW'::"QuoteStatus_v2"
    WHEN 'REVIEWING' THEN 'REVIEWING'::"QuoteStatus_v2"
    WHEN 'NEEDS_INFO' THEN 'NEEDS_MORE_INFO'::"QuoteStatus_v2"
    WHEN 'NEEDS_MORE_INFO' THEN 'NEEDS_MORE_INFO'::"QuoteStatus_v2"
    WHEN 'APPROVED' THEN 'QUOTED'::"QuoteStatus_v2"
    WHEN 'QUOTED' THEN 'QUOTED'::"QuoteStatus_v2"
    WHEN 'CONVERTED' THEN 'CONVERTED_TO_WORK_ORDER_DRAFT'::"QuoteStatus_v2"
    WHEN 'CONVERTED_TO_WORK_ORDER_DRAFT' THEN 'CONVERTED_TO_WORK_ORDER_DRAFT'::"QuoteStatus_v2"
    WHEN 'DECLINED' THEN 'CLOSED'::"QuoteStatus_v2"
    WHEN 'CLOSED' THEN 'CLOSED'::"QuoteStatus_v2"
    ELSE 'NEW'::"QuoteStatus_v2"
  END
);

DROP TYPE "QuoteStatus";
ALTER TYPE "QuoteStatus_v2" RENAME TO "QuoteStatus";
ALTER TABLE "QuoteRequest" ALTER COLUMN "status" SET DEFAULT 'NEW'::"QuoteStatus";

CREATE TABLE IF NOT EXISTS "WorkOrderDraft" (
  "id" TEXT NOT NULL,
  "draftNumber" TEXT NOT NULL,
  "sourceQuoteRequestId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "status" "WorkOrderDraftStatus" NOT NULL DEFAULT 'DRAFT',
  "requestedServiceType" "ServiceType" NOT NULL,
  "calibrationCategory" TEXT,
  "serviceMode" "ServiceMode",
  "companyName" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "contactEmail" TEXT NOT NULL,
  "contactPhone" TEXT,
  "equipmentType" TEXT,
  "manufacturer" TEXT,
  "modelNumber" TEXT,
  "serialNumber" TEXT,
  "unitCount" INTEGER,
  "rangeOrCapacity" TEXT,
  "units" TEXT,
  "requestedTurnaround" TEXT,
  "documentationRequirements" TEXT,
  "customerNotes" TEXT,
  "internalNotesSummary" TEXT,
  "exportPayload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkOrderDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkOrderDraft_draftNumber_key" ON "WorkOrderDraft"("draftNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkOrderDraft_sourceQuoteRequestId_key" ON "WorkOrderDraft"("sourceQuoteRequestId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WorkOrderDraft_customerId_fkey'
  ) THEN
    ALTER TABLE "WorkOrderDraft"
    ADD CONSTRAINT "WorkOrderDraft_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'WorkOrderDraft_sourceQuoteRequestId_fkey'
  ) THEN
    ALTER TABLE "WorkOrderDraft"
    ADD CONSTRAINT "WorkOrderDraft_sourceQuoteRequestId_fkey"
    FOREIGN KEY ("sourceQuoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "IntegrationExportLog" (
  "id" TEXT NOT NULL,
  "workOrderDraftId" TEXT NOT NULL,
  "targetSystem" TEXT NOT NULL,
  "status" "IntegrationExportStatus" NOT NULL,
  "actor" TEXT,
  "message" TEXT,
  "payload" JSONB NOT NULL,
  "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationExportLog_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'IntegrationExportLog_workOrderDraftId_fkey'
  ) THEN
    ALTER TABLE "IntegrationExportLog"
    ADD CONSTRAINT "IntegrationExportLog_workOrderDraftId_fkey"
    FOREIGN KEY ("workOrderDraftId") REFERENCES "WorkOrderDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "InternalNote" (
  "id" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "author" TEXT,
  "quoteRequestId" TEXT,
  "workOrderDraftId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'InternalNote_quoteRequestId_fkey'
  ) THEN
    ALTER TABLE "InternalNote"
    ADD CONSTRAINT "InternalNote_quoteRequestId_fkey"
    FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'InternalNote_workOrderDraftId_fkey'
  ) THEN
    ALTER TABLE "InternalNote"
    ADD CONSTRAINT "InternalNote_workOrderDraftId_fkey"
    FOREIGN KEY ("workOrderDraftId") REFERENCES "WorkOrderDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "InternalNote" (
  "id",
  "body",
  "author",
  "quoteRequestId",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy-note-' || "id",
  "adminNotes",
  'system-migration',
  "id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "QuoteRequest"
WHERE "adminNotes" IS NOT NULL
  AND LENGTH(TRIM("adminNotes")) > 0
  AND NOT EXISTS (
    SELECT 1
    FROM "InternalNote"
    WHERE "InternalNote"."quoteRequestId" = "QuoteRequest"."id"
      AND "InternalNote"."body" = "QuoteRequest"."adminNotes"
  );
