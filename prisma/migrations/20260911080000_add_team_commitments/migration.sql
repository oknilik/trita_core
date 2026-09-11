-- Dedicated live commitments; report snapshots and legacy action events stay untouched.
CREATE TABLE "TeamCommitment" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "nextStep" TEXT NOT NULL DEFAULT '',
    "successCriteria" TEXT NOT NULL DEFAULT '',
    "ownerUserId" TEXT,
    "ownerLabel" TEXT,
    "dueDate" VARCHAR(10),
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "latestNote" TEXT,
    "targetMetric" JSONB,
    "sourceReportId" TEXT,
    "sourceActionKey" TEXT,
    "sourceSnapshot" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeamCommitment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TeamCommitment_status_check" CHECK ("status" IN ('not_started', 'in_progress', 'blocked', 'done')),
    CONSTRAINT "TeamCommitment_version_check" CHECK ("version" > 0),
    CONSTRAINT "TeamCommitment_source_check" CHECK (("sourceReportId" IS NULL) = ("sourceActionKey" IS NULL))
);

CREATE TABLE "TeamCommitmentEvent" (
    "id" TEXT NOT NULL,
    "commitmentId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamCommitmentEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TeamCommitmentEvent_version_check" CHECK ("version" > 0)
);

CREATE TABLE "TeamCommitmentPlan" (
    "teamId" TEXT NOT NULL,
    "focus" TEXT NOT NULL DEFAULT '',
    "nextCheckInDate" VARCHAR(10),
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeamCommitmentPlan_pkey" PRIMARY KEY ("teamId"),
    CONSTRAINT "TeamCommitmentPlan_version_check" CHECK ("version" > 0)
);

CREATE UNIQUE INDEX "TeamCommitment_teamId_sourceReportId_sourceActionKey_key" ON "TeamCommitment"("teamId", "sourceReportId", "sourceActionKey");
CREATE INDEX "TeamCommitment_teamId_status_idx" ON "TeamCommitment"("teamId", "status");
CREATE INDEX "TeamCommitment_ownerUserId_idx" ON "TeamCommitment"("ownerUserId");
CREATE UNIQUE INDEX "TeamCommitmentEvent_commitmentId_version_key" ON "TeamCommitmentEvent"("commitmentId", "version");
CREATE INDEX "TeamCommitmentEvent_actorUserId_createdAt_idx" ON "TeamCommitmentEvent"("actorUserId", "createdAt");

ALTER TABLE "TeamCommitment" ADD CONSTRAINT "TeamCommitment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamCommitment" ADD CONSTRAINT "TeamCommitment_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeamCommitmentEvent" ADD CONSTRAINT "TeamCommitmentEvent_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "TeamCommitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamCommitmentPlan" ADD CONSTRAINT "TeamCommitmentPlan_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
