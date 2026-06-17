ALTER TABLE "BusinessWorkspace"
  ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "invoiceTerms" TEXT,
  ADD COLUMN IF NOT EXISTS "quoteTerms" TEXT,
  ADD COLUMN IF NOT EXISTS "setupCompletedAt" TIMESTAMP(3);

UPDATE "BusinessWorkspace"
SET
  "quoteTerms" = COALESCE("quoteTerms", 'Quote is valid for 30 days unless otherwise stated. Pricing is subject to final inspection, schedule availability, and written approval.'),
  "invoiceTerms" = COALESCE("invoiceTerms", 'Payment due by the listed due date. Please reference the invoice number with payment.'),
  "setupCompletedAt" = COALESCE("setupCompletedAt", NOW())
WHERE "setupCompletedAt" IS NULL;

UPDATE "BusinessWorkspace"
SET
  "email" = REPLACE("email", '@stanleysync.local', '@stanleysync.app'),
  "website" = REPLACE("website", 'https://stanleysync.local', 'https://stanleysync.app')
WHERE "email" LIKE '%@stanleysync.local' OR "website" LIKE 'https://stanleysync.local%';

UPDATE "User"
SET "email" = REPLACE("email", '@stanleysync.local', '@stanleysync.app')
WHERE "email" LIKE '%@stanleysync.local';

UPDATE "NotificationEvent"
SET "recipient" = REPLACE("recipient", '@stanleysync.local', '@stanleysync.app')
WHERE "recipient" LIKE '%@stanleysync.local';
