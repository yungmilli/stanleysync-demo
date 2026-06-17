DO $$ BEGIN
  CREATE TYPE "NotificationEventType" AS ENUM (
    'QUOTE_SUBMITTED',
    'QUOTE_APPROVED',
    'JOB_ASSIGNED',
    'WORK_ORDER_DUE',
    'CERTIFICATE_READY'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationStatus" AS ENUM (
    'PENDING',
    'SENT',
    'FAILED',
    'SKIPPED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "BusinessWorkspace"
  ADD COLUMN IF NOT EXISTS "themeAccent" TEXT;

CREATE TABLE IF NOT EXISTS "DashboardWidgetPreference" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "widgetKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "size" TEXT NOT NULL DEFAULT 'standard',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DashboardWidgetPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NotificationEvent" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "type" "NotificationEventType" NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "recipient" TEXT,
  "subject" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'placeholder',
  "payload" JSONB,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditEvent" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "actorUserId" TEXT,
  "actorEmail" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "summary" TEXT NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DashboardWidgetPreference_workspaceId_widgetKey_key"
  ON "DashboardWidgetPreference"("workspaceId", "widgetKey");
CREATE INDEX IF NOT EXISTS "DashboardWidgetPreference_workspaceId_idx"
  ON "DashboardWidgetPreference"("workspaceId");
CREATE INDEX IF NOT EXISTS "DashboardWidgetPreference_sortOrder_idx"
  ON "DashboardWidgetPreference"("sortOrder");
CREATE INDEX IF NOT EXISTS "NotificationEvent_workspaceId_idx"
  ON "NotificationEvent"("workspaceId");
CREATE INDEX IF NOT EXISTS "NotificationEvent_type_idx"
  ON "NotificationEvent"("type");
CREATE INDEX IF NOT EXISTS "NotificationEvent_status_idx"
  ON "NotificationEvent"("status");
CREATE INDEX IF NOT EXISTS "NotificationEvent_createdAt_idx"
  ON "NotificationEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditEvent_workspaceId_idx"
  ON "AuditEvent"("workspaceId");
CREATE INDEX IF NOT EXISTS "AuditEvent_actorUserId_idx"
  ON "AuditEvent"("actorUserId");
CREATE INDEX IF NOT EXISTS "AuditEvent_entityType_idx"
  ON "AuditEvent"("entityType");
CREATE INDEX IF NOT EXISTS "AuditEvent_createdAt_idx"
  ON "AuditEvent"("createdAt");

DO $$ BEGIN
  ALTER TABLE "DashboardWidgetPreference"
    ADD CONSTRAINT "DashboardWidgetPreference_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "NotificationEvent"
    ADD CONSTRAINT "NotificationEvent_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AuditEvent"
    ADD CONSTRAINT "AuditEvent_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
