-- Add beta customer account, product/service catalog, and packing slip support.
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "billingEmail" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "billingPhone" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "billingAddress" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "shippingAddress" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "industry" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "preferredContactMethod" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "taxExempt" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "tags" JSONB;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;

ALTER TABLE "InvoiceLineItem" ADD COLUMN IF NOT EXISTS "productId" TEXT;
CREATE INDEX IF NOT EXISTS "InvoiceLineItem_productId_idx" ON "InvoiceLineItem"("productId");

CREATE TABLE IF NOT EXISTS "ProductService" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "sku" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "unitCost" DOUBLE PRECISION,
  "taxable" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductService_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProductService_workspaceId_idx" ON "ProductService"("workspaceId");
CREATE INDEX IF NOT EXISTS "ProductService_sku_idx" ON "ProductService"("sku");
CREATE INDEX IF NOT EXISTS "ProductService_isActive_idx" ON "ProductService"("isActive");

CREATE TABLE IF NOT EXISTS "PackingSlip" (
  "id" TEXT NOT NULL,
  "packingSlipNumber" TEXT NOT NULL,
  "workspaceId" TEXT,
  "customerId" TEXT NOT NULL,
  "invoiceId" TEXT,
  "ticketId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "shipToName" TEXT,
  "shipToAddress" TEXT,
  "shippingMethod" TEXT,
  "trackingNumber" TEXT,
  "shipDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PackingSlip_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PackingSlip_packingSlipNumber_key" ON "PackingSlip"("packingSlipNumber");
CREATE INDEX IF NOT EXISTS "PackingSlip_workspaceId_idx" ON "PackingSlip"("workspaceId");
CREATE INDEX IF NOT EXISTS "PackingSlip_customerId_idx" ON "PackingSlip"("customerId");
CREATE INDEX IF NOT EXISTS "PackingSlip_invoiceId_idx" ON "PackingSlip"("invoiceId");
CREATE INDEX IF NOT EXISTS "PackingSlip_ticketId_idx" ON "PackingSlip"("ticketId");

CREATE TABLE IF NOT EXISTS "PackingSlipLineItem" (
  "id" TEXT NOT NULL,
  "packingSlipId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "sku" TEXT,
  "partNumber" TEXT,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "notes" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PackingSlipLineItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PackingSlipLineItem_packingSlipId_idx" ON "PackingSlipLineItem"("packingSlipId");
CREATE INDEX IF NOT EXISTS "PackingSlipLineItem_sortOrder_idx" ON "PackingSlipLineItem"("sortOrder");

DO $$ BEGIN
  ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductService"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ProductService" ADD CONSTRAINT "ProductService_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "PackingSlip" ADD CONSTRAINT "PackingSlip_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "PackingSlip" ADD CONSTRAINT "PackingSlip_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "PackingSlip" ADD CONSTRAINT "PackingSlip_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "PackingSlip" ADD CONSTRAINT "PackingSlip_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "PackingSlipLineItem" ADD CONSTRAINT "PackingSlipLineItem_packingSlipId_fkey" FOREIGN KEY ("packingSlipId") REFERENCES "PackingSlip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;