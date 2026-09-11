-- Keep a durable snapshot for every successful team plan revision.
CREATE TABLE "TeamCommitmentPlanEvent" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "nextCheckInDate" VARCHAR(10),
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamCommitmentPlanEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TeamCommitmentPlanEvent_version_check" CHECK ("version" > 0)
);

CREATE UNIQUE INDEX "TeamCommitmentPlanEvent_teamId_version_key" ON "TeamCommitmentPlanEvent"("teamId", "version");
CREATE INDEX "TeamCommitmentPlanEvent_actorUserId_createdAt_idx" ON "TeamCommitmentPlanEvent"("actorUserId", "createdAt");
ALTER TABLE "TeamCommitmentPlanEvent" ADD CONSTRAINT "TeamCommitmentPlanEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TeamCommitmentPlan"("teamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve the known latest state of pre-existing plans with its actual updater
-- and timestamp. Earlier versions cannot be reconstructed and are not invented.
INSERT INTO "TeamCommitmentPlanEvent" ("id", "teamId", "actorUserId", "focus", "nextCheckInDate", "version", "createdAt")
SELECT 'baseline:' || md5("teamId" || ':' || "version"::text), "teamId", "updatedById", "focus", "nextCheckInDate", "version", "updatedAt"
FROM "TeamCommitmentPlan";
