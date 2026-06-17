UPDATE "QuoteRequest"
SET "status" = 'APPROVED'::"QuoteStatus"
WHERE "status"::text = 'QUOTED';

UPDATE "QuoteRequest"
SET "status" = 'DECLINED'::"QuoteStatus"
WHERE "status"::text = 'CLOSED';
