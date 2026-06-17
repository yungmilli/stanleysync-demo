ALTER TABLE "QuoteRequest" DROP CONSTRAINT IF EXISTS "QuoteRequest_leadId_fkey";

ALTER TABLE "QuoteRequest" DROP COLUMN IF EXISTS "leadId";
ALTER TABLE "QuoteRequest" DROP COLUMN IF EXISTS "measurementRange";
ALTER TABLE "QuoteRequest" DROP COLUMN IF EXISTS "turnaroundRequirement";
ALTER TABLE "QuoteRequest" DROP COLUMN IF EXISTS "certificationNeeded";
ALTER TABLE "QuoteRequest" DROP COLUMN IF EXISTS "structuredPayload";
ALTER TABLE "QuoteRequest" DROP COLUMN IF EXISTS "intakeVersion";

DROP TABLE IF EXISTS "Lead";
