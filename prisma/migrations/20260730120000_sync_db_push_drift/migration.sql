-- Séma-drift felzárkóztatása: `prisma db push`-sal a lokál DB-be került
-- változások, amikhez migrációs fájl sosem készült. Élesben ezért P2022-vel
-- ("column does not exist") hasalt el az app, miközben lokálban ment.
--
-- Forrás: `prisma migrate diff --from-url <friss migrate deploy DB>
--          --to-schema-datamodel prisma/schema.prisma --script`
--
-- IDEMPOTENS szándékosan: a lokál dev DB-ben ezek az objektumok már léteznek
-- (db push hozta létre őket), így ott is lefuttatható anélkül, hogy elhasalna.
-- Ezért van mindenhol IF NOT EXISTS, illetve a FK-knál duplicate_object-et
-- elnyelő DO-blokk.

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'INQUIRY_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CANDIDATE_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PEER_KUDOS_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PEER_FEEDBACK_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PEER_FEEDBACK_RESPONSE';

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "peerFeedbackAnonymous" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CandidateInvite" ADD COLUMN IF NOT EXISTS "includeTeamRole" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CandidateInvite" ADD COLUMN IF NOT EXISTS "orgId" TEXT;

-- AlterTable
ALTER TABLE "CandidateResult" ADD COLUMN IF NOT EXISTS "teamRoleSelections" JSONB;

-- AlterTable
ALTER TABLE "TeamReport" ADD COLUMN IF NOT EXISTS "translationsEn" JSONB;

-- AlterTable: token oszlopok.
-- A Prisma-oldali @default(cuid()) alkalmazás-szintű, nem DB-default, ezért a
-- generált diff NOT NULL-t ad DB-default nélkül — az meghasalna, ha a táblában
-- már lenne sor. Átmeneti DB-defaulttal töltjük fel a meglévő sorokat, majd a
-- defaultot elvesszük, hogy a Prisma viselkedése maradjon a mérvadó.
ALTER TABLE "OrganizationPendingInvite" ADD COLUMN IF NOT EXISTS "token" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE "OrganizationPendingInvite" ALTER COLUMN "token" DROP DEFAULT;

ALTER TABLE "TeamPendingInvite" ADD COLUMN IF NOT EXISTS "token" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE "TeamPendingInvite" ALTER COLUMN "token" DROP DEFAULT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PeerFeedbackItem" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "campaignId" TEXT,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'appreciation',
    "visibility" TEXT NOT NULL DEFAULT 'named',
    "payload" JSONB NOT NULL,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeerFeedbackItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "FeedbackRequest" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "askerId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "allowAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'open',
    "audienceIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Inquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "topic" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'contact_form',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "userProfileId" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PeerFeedbackItem_teamId_toUserId_createdAt_idx" ON "PeerFeedbackItem"("teamId", "toUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "PeerFeedbackItem_fromUserId_createdAt_idx" ON "PeerFeedbackItem"("fromUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "PeerFeedbackItem_campaignId_idx" ON "PeerFeedbackItem"("campaignId");
CREATE INDEX IF NOT EXISTS "PeerFeedbackItem_requestId_idx" ON "PeerFeedbackItem"("requestId");
CREATE INDEX IF NOT EXISTS "FeedbackRequest_teamId_status_idx" ON "FeedbackRequest"("teamId", "status");
CREATE INDEX IF NOT EXISTS "FeedbackRequest_askerId_createdAt_idx" ON "FeedbackRequest"("askerId", "createdAt");
CREATE INDEX IF NOT EXISTS "Inquiry_status_createdAt_idx" ON "Inquiry"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Inquiry_organizationId_idx" ON "Inquiry"("organizationId");
CREATE INDEX IF NOT EXISTS "Inquiry_email_idx" ON "Inquiry"("email");
CREATE INDEX IF NOT EXISTS "CandidateInvite_orgId_idx" ON "CandidateInvite"("orgId");
CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationPendingInvite_token_key" ON "OrganizationPendingInvite"("token");
CREATE INDEX IF NOT EXISTS "OrganizationPendingInvite_token_idx" ON "OrganizationPendingInvite"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "TeamPendingInvite_token_key" ON "TeamPendingInvite"("token");
CREATE INDEX IF NOT EXISTS "TeamPendingInvite_token_idx" ON "TeamPendingInvite"("token");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "PeerFeedbackItem" ADD CONSTRAINT "PeerFeedbackItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "FeedbackRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "PeerFeedbackItem" ADD CONSTRAINT "PeerFeedbackItem_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "PeerFeedbackItem" ADD CONSTRAINT "PeerFeedbackItem_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "PeerFeedbackItem" ADD CONSTRAINT "PeerFeedbackItem_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "PeerFeedbackItem" ADD CONSTRAINT "PeerFeedbackItem_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "FeedbackRequest" ADD CONSTRAINT "FeedbackRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "FeedbackRequest" ADD CONSTRAINT "FeedbackRequest_askerId_fkey" FOREIGN KEY ("askerId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
