ALTER TYPE "QuoteStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "QuoteStatus" ADD VALUE IF NOT EXISTS 'DECLINED';
ALTER TYPE "QuoteStatus" ADD VALUE IF NOT EXISTS 'CONVERTED';

ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'INVOICE_CREATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'INVOICE_STATUS_CHANGED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'WORKFLOW_STAGE_UPDATED';

ALTER TYPE "CalibrationWorkOrderStatus" ADD VALUE IF NOT EXISTS 'INVOICED';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InvoiceStatus') THEN
    CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'VOID');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkflowModule') THEN
    CREATE TYPE "WorkflowModule" AS ENUM ('QUOTEFLOW', 'WORKFLOW', 'CALOPS');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT NOT NULL,
  "invoiceNumber" TEXT NOT NULL,
  "workspaceId" TEXT,
  "customerId" TEXT NOT NULL,
  "quoteId" TEXT,
  "ticketId" TEXT,
  "calibrationWorkOrderId" TEXT,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "dueDate" TIMESTAMP(3),
  "notes" TEXT,
  "paymentInstructions" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InvoiceLineItem" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WorkflowStage" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "module" "WorkflowModule" NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkflowStage_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ActivityLog" ADD COLUMN IF NOT EXISTS "invoiceId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE INDEX IF NOT EXISTS "Invoice_workspaceId_idx" ON "Invoice"("workspaceId");
CREATE INDEX IF NOT EXISTS "Invoice_customerId_idx" ON "Invoice"("customerId");
CREATE INDEX IF NOT EXISTS "Invoice_quoteId_idx" ON "Invoice"("quoteId");
CREATE INDEX IF NOT EXISTS "Invoice_ticketId_idx" ON "Invoice"("ticketId");
CREATE INDEX IF NOT EXISTS "Invoice_calibrationWorkOrderId_idx" ON "Invoice"("calibrationWorkOrderId");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "Invoice_dueDate_idx" ON "Invoice"("dueDate");
CREATE INDEX IF NOT EXISTS "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");
CREATE INDEX IF NOT EXISTS "InvoiceLineItem_sortOrder_idx" ON "InvoiceLineItem"("sortOrder");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkflowStage_workspaceId_module_key_key" ON "WorkflowStage"("workspaceId", "module", "key");
CREATE INDEX IF NOT EXISTS "WorkflowStage_workspaceId_idx" ON "WorkflowStage"("workspaceId");
CREATE INDEX IF NOT EXISTS "WorkflowStage_module_idx" ON "WorkflowStage"("module");
CREATE INDEX IF NOT EXISTS "WorkflowStage_sortOrder_idx" ON "WorkflowStage"("sortOrder");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_workspaceId_fkey') THEN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_customerId_fkey') THEN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_quoteId_fkey') THEN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_ticketId_fkey') THEN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_calibrationWorkOrderId_fkey') THEN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_calibrationWorkOrderId_fkey" FOREIGN KEY ("calibrationWorkOrderId") REFERENCES "CalibrationWorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InvoiceLineItem_invoiceId_fkey') THEN
    ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkflowStage_workspaceId_fkey') THEN
    ALTER TABLE "WorkflowStage" ADD CONSTRAINT "WorkflowStage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ActivityLog_invoiceId_fkey') THEN
    ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
