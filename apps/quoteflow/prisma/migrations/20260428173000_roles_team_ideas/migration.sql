DO $$
BEGIN
  CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'TECHNICIAN', 'SALES');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "IdeaStatus" AS ENUM ('NEW', 'REVIEWING', 'PLANNED', 'DONE', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'TICKET_COMMENT_ADDED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'IDEA_POST_CREATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'IDEA_STATUS_CHANGED';

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

ALTER TABLE "QuoteRequest"
ADD COLUMN IF NOT EXISTS "assignedUserId" TEXT;

ALTER TABLE "Ticket"
ADD COLUMN IF NOT EXISTS "assignedUserId" TEXT;

CREATE TABLE IF NOT EXISTS "TicketComment" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "IdeaPost" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
  "status" "IdeaStatus" NOT NULL DEFAULT 'NEW',
  "createdByUserId" TEXT NOT NULL,
  "ownerUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "IdeaPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "IdeaComment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "IdeaComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "QuoteRequest_assignedUserId_idx" ON "QuoteRequest"("assignedUserId");
CREATE INDEX IF NOT EXISTS "Ticket_assignedUserId_idx" ON "Ticket"("assignedUserId");
CREATE INDEX IF NOT EXISTS "TicketComment_ticketId_idx" ON "TicketComment"("ticketId");
CREATE INDEX IF NOT EXISTS "TicketComment_authorUserId_idx" ON "TicketComment"("authorUserId");
CREATE INDEX IF NOT EXISTS "IdeaPost_status_idx" ON "IdeaPost"("status");
CREATE INDEX IF NOT EXISTS "IdeaPost_category_idx" ON "IdeaPost"("category");
CREATE INDEX IF NOT EXISTS "IdeaPost_ownerUserId_idx" ON "IdeaPost"("ownerUserId");
CREATE INDEX IF NOT EXISTS "IdeaComment_postId_idx" ON "IdeaComment"("postId");
CREATE INDEX IF NOT EXISTS "IdeaComment_authorUserId_idx" ON "IdeaComment"("authorUserId");

DO $$
BEGIN
  ALTER TABLE "QuoteRequest"
    ADD CONSTRAINT "QuoteRequest_assignedUserId_fkey"
    FOREIGN KEY ("assignedUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Ticket"
    ADD CONSTRAINT "Ticket_assignedUserId_fkey"
    FOREIGN KEY ("assignedUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "TicketComment"
    ADD CONSTRAINT "TicketComment_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "TicketComment"
    ADD CONSTRAINT "TicketComment_authorUserId_fkey"
    FOREIGN KEY ("authorUserId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "IdeaPost"
    ADD CONSTRAINT "IdeaPost_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "IdeaPost"
    ADD CONSTRAINT "IdeaPost_ownerUserId_fkey"
    FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "IdeaComment"
    ADD CONSTRAINT "IdeaComment_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "IdeaPost"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "IdeaComment"
    ADD CONSTRAINT "IdeaComment_authorUserId_fkey"
    FOREIGN KEY ("authorUserId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
