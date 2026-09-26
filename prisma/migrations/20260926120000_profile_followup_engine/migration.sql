-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'LIFECYCLE_NUDGE';

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "verifiedEmail" TEXT;

-- CreateTable
CREATE TABLE "LifecycleOpportunity" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "goalKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reason" TEXT,
    "anchorAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "snoozedUntil" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ruleVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LifecycleOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifecycleDelivery" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "rule" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CLAIMED',
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "providerEmailId" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "templateVersion" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB,
    "unsubscribeToken" TEXT,
    "actorId" TEXT,

    CONSTRAINT "LifecycleDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSuppression" (
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSuppression_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "LifecycleEmailEvent" (
    "id" TEXT NOT NULL,
    "providerEmailId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifecycleEmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifecycleRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "leaseUntil" TIMESTAMP(3),
    "cursor" TEXT,
    "summary" JSONB,

    CONSTRAINT "LifecycleRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LifecycleOpportunity_status_dueAt_idx" ON "LifecycleOpportunity"("status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "LifecycleOpportunity_profileId_rule_goalKey_key" ON "LifecycleOpportunity"("profileId", "rule", "goalKey");

-- CreateIndex
CREATE UNIQUE INDEX "LifecycleDelivery_key_key" ON "LifecycleDelivery"("key");

-- CreateIndex
CREATE UNIQUE INDEX "LifecycleDelivery_providerEmailId_key" ON "LifecycleDelivery"("providerEmailId");

-- CreateIndex
CREATE UNIQUE INDEX "LifecycleDelivery_unsubscribeToken_key" ON "LifecycleDelivery"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "LifecycleDelivery_recipient_claimedAt_idx" ON "LifecycleDelivery"("recipient", "claimedAt");

-- CreateIndex
CREATE INDEX "LifecycleDelivery_profileId_claimedAt_idx" ON "LifecycleDelivery"("profileId", "claimedAt");

-- CreateIndex
CREATE INDEX "LifecycleDelivery_status_claimedAt_idx" ON "LifecycleDelivery"("status", "claimedAt");

-- CreateIndex
CREATE INDEX "LifecycleEmailEvent_providerEmailId_idx" ON "LifecycleEmailEvent"("providerEmailId");

-- CreateIndex
CREATE INDEX "LifecycleEmailEvent_createdAt_idx" ON "LifecycleEmailEvent"("createdAt");

-- CreateIndex
CREATE INDEX "UserProfile_createdAt_id_idx" ON "UserProfile"("createdAt", "id");

-- AddForeignKey
ALTER TABLE "LifecycleOpportunity" ADD CONSTRAINT "LifecycleOpportunity_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifecycleDelivery" ADD CONSTRAINT "LifecycleDelivery_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifecycleDelivery" ADD CONSTRAINT "LifecycleDelivery_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "LifecycleOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Legacy reflection notifications do not prove email delivery. Reserve their
-- lifetime dedupe keys conservatively so rollout cannot resend old messages.
INSERT INTO "LifecycleDelivery" ("id", "key", "profileId", "rule", "recipient", "status", "claimedAt")
SELECT 'legacy_' || md5(n."id"), 'reflection:' || p."id", p."id", 'REFLECTION', lower(trim(p."email")), 'LEGACY', n."createdAt"
FROM "Notification" n JOIN "UserProfile" p ON p."id" = n."userId"
WHERE n."type" = 'REFLECTION_PROMPT' AND p."email" IS NOT NULL AND NOT p."deleted"
ON CONFLICT ("key") DO NOTHING;

-- Preserve the known count and latest timestamp of the old manual reminders.
INSERT INTO "LifecycleDelivery" ("id", "key", "profileId", "rule", "recipient", "status", "claimedAt")
SELECT 'legacy_' || md5(d."id" || ':' || s.n), 'legacy-draft:' || d."id" || ':' || s.n,
 p."id", 'RESUME_SELF', lower(trim(p."email")), 'LEGACY', d."lastDraftReminderSentAt"
FROM "AssessmentDraft" d JOIN "UserProfile" p ON p."id" = d."userProfileId"
CROSS JOIN LATERAL generate_series(1, LEAST(d."draftReminderCount", 2)) s(n)
WHERE d."lastDraftReminderSentAt" IS NOT NULL AND p."email" IS NOT NULL AND NOT p."deleted"
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "LifecycleDelivery" ("id", "key", "profileId", "rule", "recipient", "status", "claimedAt")
SELECT 'legacy_' || md5(i."id" || ':observer:' || s.n), 'observer:' || i."id" || ':' || s.n,
 i."inviterId", 'OBSERVER_REMINDER', lower(trim(i."observerEmail")), 'LEGACY', i."lastReminderSentAt"
FROM "ObserverInvitation" i
CROSS JOIN LATERAL generate_series(1, LEAST(i."reminderCount", 2)) s(n)
WHERE i."lastReminderSentAt" IS NOT NULL AND i."observerEmail" IS NOT NULL
ON CONFLICT ("key") DO NOTHING;

-- Carry over known hard bounces; complaints arrive via the shared webhook.
INSERT INTO "EmailSuppression" ("email", "reason")
SELECT lower(trim("email")), 'bounce' FROM "NewsletterSubscriber" WHERE "status" = 'BOUNCED'
ON CONFLICT ("email") DO NOTHING;
