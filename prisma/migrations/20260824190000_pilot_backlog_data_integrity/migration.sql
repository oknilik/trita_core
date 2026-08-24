-- P0-CORE-02: scope assessment drafts to self-serve or a concrete campaign.
ALTER TABLE "AssessmentDraft" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'self';
DROP INDEX IF EXISTS "AssessmentDraft_userProfileId_key";
CREATE UNIQUE INDEX "AssessmentDraft_userProfileId_scope_key"
  ON "AssessmentDraft"("userProfileId", "scope");
CREATE INDEX "AssessmentDraft_userProfileId_idx"
  ON "AssessmentDraft"("userProfileId");

-- P0-CORE-01: a campaign self-step has one idempotent result per participant.
-- A korabbi, egyedisegi korlat nelkuli idoszakban letrejohetett tobb eredmeny
-- ugyanahhoz a resztvevohoz es kampanyhoz. Csak szemantikailag azonos sorokat
-- vonunk ossze automatikusan; eltero meresi eredmenyt vagy tobb publikus
-- megosztasi linket nem dobunk el csendben, hanem egyertelmu hibaval megallitjuk
-- a migraciot, hogy az adatgazda feloldhassa az utkozest.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "AssessmentResult" left_result
    JOIN "AssessmentResult" right_result
      ON left_result."userProfileId" = right_result."userProfileId"
     AND left_result."campaignId" = right_result."campaignId"
     AND left_result."id" < right_result."id"
    WHERE left_result."userProfileId" IS NOT NULL
      AND left_result."campaignId" IS NOT NULL
      AND (
        left_result."scores" IS DISTINCT FROM right_result."scores"
        OR left_result."testType" IS DISTINCT FROM right_result."testType"
        OR left_result."isSelfAssessment" IS DISTINCT FROM right_result."isSelfAssessment"
      )
  ) THEN
    RAISE EXCEPTION
      'AssessmentResult deduplication aborted: conflicting campaign results exist'
      USING HINT = 'Reconcile rows sharing (userProfileId, campaignId) before retrying the migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "AssessmentResult"
    WHERE "userProfileId" IS NOT NULL
      AND "campaignId" IS NOT NULL
    GROUP BY "userProfileId", "campaignId"
    HAVING COUNT(*) > 1 AND COUNT("shareToken") > 1
  ) THEN
    RAISE EXCEPTION
      'AssessmentResult deduplication aborted: duplicate campaign results have multiple share tokens'
      USING HINT = 'Choose the share URL to preserve before retrying the migration.';
  END IF;
END $$;

-- Ha pontosan egy sorhoz tartozik publikus link, azt tartjuk meg; egyebkent
-- az eredeti (legkorabbi) beadast. A null campaignId-s self-serve retake-eket
-- szandekosan nem erinti a deduplikacio es a PostgreSQL unique index sem.
WITH ranked_campaign_results AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "userProfileId", "campaignId"
      ORDER BY ("shareToken" IS NOT NULL) DESC, "createdAt" ASC, "id" ASC
    ) AS duplicate_rank
  FROM "AssessmentResult"
  WHERE "userProfileId" IS NOT NULL
    AND "campaignId" IS NOT NULL
)
DELETE FROM "AssessmentResult" result
USING ranked_campaign_results ranked
WHERE result."id" = ranked."id"
  AND ranked.duplicate_rank > 1;

CREATE UNIQUE INDEX "AssessmentResult_userProfileId_campaignId_key"
  ON "AssessmentResult"("userProfileId", "campaignId");

-- P2-SCALE-01: anonymous responses are isolated by aggregate team key.
ALTER TABLE "PsychSafetyResponse" ADD COLUMN "teamId" TEXT;
UPDATE "PsychSafetyResponse" response
SET "teamId" = COALESCE(campaign."teamIds"[1], campaign."teamId")
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
