ALTER TYPE "ServiceMode" ADD VALUE IF NOT EXISTS 'IN_LAB';

ALTER TYPE "QuoteStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "QuoteStatus" ADD VALUE IF NOT EXISTS 'CONVERTED';
ALTER TYPE "QuoteStatus" ADD VALUE IF NOT EXISTS 'DECLINED';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Priority') THEN
    CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketType') THEN
    CREATE TYPE "TicketType" AS ENUM ('CALIBRATION', 'REPAIR', 'FIELD_SERVICE', 'CUSTOM_SERVICE', 'OTHER');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketStatus') THEN
    CREATE TYPE "TicketStatus" AS ENUM (
      'NEW',
      'SCHEDULED',
      'IN_PROGRESS',
      'WAITING_ON_CUSTOMER',
      'WAITING_ON_PARTS',
      'COMPLETED',
      'INVOICED',
      'CLOSED'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ActivityType') THEN
    CREATE TYPE "ActivityType" AS ENUM (
      'QUOTE_SUBMITTED',
      'AI_SUMMARY_GENERATED',
      'EMAIL_SENT',
      'QUOTE_STATUS_CHANGED',
      'QUOTE_CONVERTED_TO_TICKET',
      'TICKET_CREATED',
      'ASSIGNMENT_CHANGED',
      'DUE_DATE_CHANGED',
      'TICKET_STATUS_CHANGED',
      'TICKET_COMPLETED',
      'ADMIN_NOTE_UPDATED',
      'PROJECT_CREATED',
      'PROJECT_UPDATED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Customer" (
  "id" TEXT NOT NULL,
  "customerRef" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "mainContact" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Customer_customerRef_key" ON "Customer"("customerRef");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_email_key" ON "Customer"("email");

DO $$
BEGIN
  IF to_regclass('"Lead"') IS NOT NULL THEN
    INSERT INTO "Customer" ("id", "customerRef", "company", "mainContact", "email", "phone", "createdAt", "updatedAt")
    SELECT
      "id",
      'CUS-' || UPPER(SUBSTRING(REPLACE("id", '-', '') FROM 1 FOR 10)),
      COALESCE(NULLIF("company", ''), "name"),
      "name",
      "email",
      "phone",
      "createdAt",
      "updatedAt"
    FROM "Lead"
    ON CONFLICT ("id") DO UPDATE
    SET
      "company" = EXCLUDED."company",
      "mainContact" = EXCLUDED."mainContact",
      "email" = EXCLUDED."email",
      "phone" = EXCLUDED."phone",
      "updatedAt" = EXCLUDED."updatedAt";
  END IF;
END $$;

ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "priority" "Priority";
ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "suggestedPriority" "Priority";
ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "suggestedTicketType" "TicketType";
ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "assignedTo" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "requestedTurnaround" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "targetDueDate" TIMESTAMP(3);
ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "rangeOrCapacity" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "units" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "documentationRequirements" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "structuredSummary" JSONB;
ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "extractedFields" JSONB;
ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;
ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "quotedAmount" DOUBLE PRECISION;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'QuoteRequest' AND column_name = 'leadId'
  ) THEN
    UPDATE "QuoteRequest"
    SET
      "customerId" = COALESCE("customerId", "leadId"),
      "priority" = COALESCE("priority", 'NORMAL'::"Priority"),
      "requestedTurnaround" = COALESCE("requestedTurnaround", "turnaroundRequirement"),
      "rangeOrCapacity" = COALESCE("rangeOrCapacity", "measurementRange"),
      "documentationRequirements" = COALESCE(
        "documentationRequirements",
        CASE
          WHEN "certificationNeeded" IS TRUE THEN 'Certification required'
          WHEN "certificationNeeded" IS FALSE THEN 'No certification requirement specified'
          ELSE NULL
        END
      ),
      "structuredSummary" = COALESCE("structuredSummary", "structuredPayload"),
      "extractedFields" = COALESCE(
        "extractedFields",
        jsonb_build_object(
          'equipmentType', "equipmentType",
          'manufacturer', "manufacturer",
          'modelNumber', "modelNumber",
          'serialNumber', "serialNumber",
          'unitCount', "unitCount",
          'requestedTurnaround', "turnaroundRequirement",
          'rangeOrCapacity', "measurementRange",
          'serviceMode', "serviceMode",
          'certificationNeeded', "certificationNeeded"
        )
      ),
      "suggestedTicketType" = COALESCE(
        "suggestedTicketType",
        CASE "serviceType"
          WHEN 'CALIBRATION'::"ServiceType" THEN 'CALIBRATION'::"TicketType"
          WHEN 'REPAIR'::"ServiceType" THEN 'REPAIR'::"TicketType"
          WHEN 'CUSTOM_SERVICE'::"ServiceType" THEN 'CUSTOM_SERVICE'::"TicketType"
          ELSE 'OTHER'::"TicketType"
        END
      ),
      "suggestedPriority" = COALESCE("suggestedPriority", "priority")
    WHERE
      "customerId" IS NULL
      OR "priority" IS NULL
      OR "requestedTurnaround" IS NULL
      OR "rangeOrCapacity" IS NULL
      OR "documentationRequirements" IS NULL
      OR "structuredSummary" IS NULL
      OR "extractedFields" IS NULL
      OR "suggestedTicketType" IS NULL
      OR "suggestedPriority" IS NULL;
  ELSE
    UPDATE "QuoteRequest"
    SET
      "priority" = COALESCE("priority", 'NORMAL'::"Priority"),
      "structuredSummary" = COALESCE("structuredSummary", '{}'::jsonb),
      "extractedFields" = COALESCE("extractedFields", '{}'::jsonb),
      "suggestedTicketType" = COALESCE("suggestedTicketType", 'OTHER'::"TicketType"),
      "suggestedPriority" = COALESCE("suggestedPriority", COALESCE("priority", 'NORMAL'::"Priority"));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "QuoteRequest" WHERE "customerId" IS NULL) THEN
    ALTER TABLE "QuoteRequest" ALTER COLUMN "customerId" SET NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "QuoteRequest" WHERE "priority" IS NULL) THEN
    ALTER TABLE "QuoteRequest" ALTER COLUMN "priority" SET NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "QuoteRequest" WHERE "structuredSummary" IS NULL) THEN
    ALTER TABLE "QuoteRequest" ALTER COLUMN "structuredSummary" SET NOT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "QuoteRequest" WHERE "extractedFields" IS NULL) THEN
    ALTER TABLE "QuoteRequest" ALTER COLUMN "extractedFields" SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'QuoteRequest_customerId_fkey'
  ) THEN
    ALTER TABLE "QuoteRequest"
    ADD CONSTRAINT "QuoteRequest_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Ticket" (
  "id" TEXT NOT NULL,
  "ticketNumber" TEXT NOT NULL,
  "quoteId" TEXT,
  "customerId" TEXT NOT NULL,
  "type" "TicketType" NOT NULL,
  "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
  "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
  "assignedTo" TEXT,
  "dueDate" TIMESTAMP(3),
  "estimatedHours" DOUBLE PRECISION,
  "actualHours" DOUBLE PRECISION,
  "laborRate" DOUBLE PRECISION,
  "materialsCost" DOUBLE PRECISION DEFAULT 0,
  "shippingCost" DOUBLE PRECISION DEFAULT 0,
  "quotedAmount" DOUBLE PRECISION,
  "billedAmount" DOUBLE PRECISION,
  "totalCost" DOUBLE PRECISION,
  "profitLoss" DOUBLE PRECISION,
  "marginPercent" DOUBLE PRECISION,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_ticketNumber_key" ON "Ticket"("ticketNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_quoteId_key" ON "Ticket"("quoteId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Ticket_customerId_fkey'
  ) THEN
    ALTER TABLE "Ticket"
    ADD CONSTRAINT "Ticket_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Ticket_quoteId_fkey'
  ) THEN
    ALTER TABLE "Ticket"
    ADD CONSTRAINT "Ticket_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id" TEXT NOT NULL,
  "type" "ActivityType" NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "actor" TEXT,
  "payload" JSONB,
  "customerId" TEXT,
  "quoteId" TEXT,
  "ticketId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ActivityLog_customerId_fkey'
  ) THEN
    ALTER TABLE "ActivityLog"
    ADD CONSTRAINT "ActivityLog_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ActivityLog_quoteId_fkey'
  ) THEN
    ALTER TABLE "ActivityLog"
    ADD CONSTRAINT "ActivityLog_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ActivityLog_ticketId_fkey'
  ) THEN
    ALTER TABLE "ActivityLog"
    ADD CONSTRAINT "ActivityLog_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "ActivityLog" (
  "id",
  "type",
  "entityType",
  "entityId",
  "title",
  "description",
  "payload",
  "createdAt"
)
SELECT
  "id",
  CASE
    WHEN "entityType" = 'WebsiteProject' THEN 'PROJECT_UPDATED'::"ActivityType"
    ELSE 'ADMIN_NOTE_UPDATED'::"ActivityType"
  END,
  "entityType",
  "entityId",
  "action",
  "description",
  "payload",
  "createdAt"
FROM "AdminAuditLog"
ON CONFLICT ("id") DO NOTHING;
