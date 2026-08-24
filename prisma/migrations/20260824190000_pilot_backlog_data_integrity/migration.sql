-- P0-CORE-02: scope assessment drafts to self-serve or a concrete campaign.
ALTER TABLE "AssessmentDraft" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'self';
DROP INDEX IF EXISTS "AssessmentDraft_userProfileId_key";
CREATE UNIQUE INDEX "AssessmentDraft_userProfileId_scope_key"
  ON "AssessmentDraft"("userProfileId", "scope");
CREATE INDEX "AssessmentDraft_userProfileId_idx"
  ON "AssessmentDraft"("userProfileId");

-- P0-CORE-01: a campaign self-step has one idempotent result per participant.
CREATE UNIQUE INDEX "AssessmentResult_userProfileId_campaignId_key"
  ON "AssessmentResult"("userProfileId", "campaignId");

-- P2-SCALE-01: anonymous responses are isolated by aggregate team key.
ALTER TABLE "PsychSafetyResponse" ADD COLUMN "teamId" TEXT;
UPDATE "PsychSafetyResponse" response
SET "teamId" = COALESCE(campaign."teamId", campaign."teamIds"[1])
FROM "Campaign" campaign
WHERE response."campaignId" = campaign."id"
  AND cardinality(campaign."teamIds") <= 1;
CREATE INDEX "PsychSafetyResponse_campaignId_teamId_idx"
  ON "PsychSafetyResponse"("campaignId", "teamId");

-- P2-PROD-01: append-only action history.
CREATE TABLE "TeamActionEvent" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "actionKey" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "evidenceUrl" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeamActionEvent_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "TeamActionEvent"
  ADD CONSTRAINT "TeamActionEvent_reportId_fkey"
  FOREIGN KEY ("reportId") REFERENCES "TeamReport"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "TeamActionEvent_reportId_actionKey_createdAt_idx"
  ON "TeamActionEvent"("reportId", "actionKey", "createdAt");
CREATE INDEX "TeamActionEvent_actorUserId_createdAt_idx"
  ON "TeamActionEvent"("actorUserId", "createdAt");
