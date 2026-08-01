-- Add structured invoice fields for customer-ready invoice documents.
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "customerVisibleNotes" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paymentReferenceNotes" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "shippingNotes" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "billingAddress" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "shippingAddress" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "purchaseOrderNumber" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "shippingMethod" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "shipDate" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT;

ALTER TABLE "InvoiceLineItem" ADD COLUMN IF NOT EXISTS "sku" TEXT;
ALTER TABLE "InvoiceLineItem" ADD COLUMN IF NOT EXISTS "partNumber" TEXT;
ALTER TABLE "InvoiceLineItem" ADD COLUMN IF NOT EXISTS "taxable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InvoiceLineItem" ADD COLUMN IF NOT EXISTS "notes" TEXT;