-- ============================================================
-- Coach layer: UserRole enum, CoachProfile, CoachClientRelationship,
-- RecommendationBlock, GeneratedOutput
-- coachId / clientId are nullable to support pre-generated template outputs
-- ============================================================

-- 1. Enums
CREATE TYPE "UserRole" AS ENUM ('INDIVIDUAL', 'COACH', 'ORG_ADMIN', 'ORG_MEMBER');
CREATE TYPE "CoachRelationshipStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');
CREATE TYPE "ScoreRange" AS ENUM ('LOW', 'MED', 'HIGH');

-- 2. Add role to UserProfile
ALTER TABLE "UserProfile"
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'INDIVIDUAL';

-- 3. CoachProfile
CREATE TABLE "CoachProfile" (
  "id"            TEXT        NOT NULL PRIMARY KEY,
  "userProfileId" TEXT        NOT NULL UNIQUE,
  "bio"           TEXT,
  "specializations" JSONB,
  "maxClientSlots"  INT        NOT NULL DEFAULT 10,
  "verifiedAt"    TIMESTAMP,
  "createdAt"     TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP   NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE
);

-- 4. CoachClientRelationship
CREATE TABLE "CoachClientRelationship" (
  "id"        TEXT                      NOT NULL PRIMARY KEY,
  "coachId"   TEXT                      NOT NULL,
  "clientId"  TEXT                      NOT NULL,
  "status"    "CoachRelationshipStatus" NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMP                 NOT NULL DEFAULT NOW(),
  "endedAt"   TIMESTAMP,
  UNIQUE ("coachId", "clientId"),
  FOREIGN KEY ("coachId")  REFERENCES "UserProfile"("id") ON DELETE CASCADE,
  FOREIGN KEY ("clientId") REFERENCES "UserProfile"("id") ON DELETE CASCADE
);

CREATE INDEX "CoachClientRelationship_coachId_idx"  ON "CoachClientRelationship"("coachId");
CREATE INDEX "CoachClientRelationship_clientId_idx" ON "CoachClientRelationship"("clientId");

-- 5. RecommendationBlock
CREATE TABLE "RecommendationBlock" (
  "id"            TEXT       NOT NULL PRIMARY KEY,
  "dimensionCode" TEXT       NOT NULL,
  "scoreRange"    "ScoreRange" NOT NULL,
  "deltaFlag"     TEXT,
  "testType"      TEXT       NOT NULL DEFAULT 'ALL',
  "locale"        TEXT       NOT NULL DEFAULT 'hu',
  "content"       JSONB      NOT NULL,
  "createdAt"     TIMESTAMP  NOT NULL DEFAULT NOW()
);

CREATE INDEX "RecommendationBlock_dimensionCode_scoreRange_idx" ON "RecommendationBlock"("dimensionCode", "scoreRange");
CREATE INDEX "RecommendationBlock_locale_idx" ON "RecommendationBlock"("locale");

-- 6. GeneratedOutput
-- coachId / clientId nullable: pre-generated template outputs have no specific coach or client
CREATE TABLE "GeneratedOutput" (
  "id"        TEXT      NOT NULL PRIMARY KEY,
  "coachId"   TEXT,
  "clientId"  TEXT,
  "cacheKey"  TEXT      NOT NULL UNIQUE,
  "content"   TEXT      NOT NULL,
  "model"     TEXT      NOT NULL DEFAULT 'claude-opus-4-6',
  "hitCount"  INT       NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("coachId")  REFERENCES "UserProfile"("id") ON DELETE SET NULL,
  FOREIGN KEY ("clientId") REFERENCES "UserProfile"("id") ON DELETE SET NULL
);

CREATE INDEX "GeneratedOutput_coachId_idx"  ON "GeneratedOutput"("coachId");
CREATE INDEX "GeneratedOutput_clientId_idx" ON "GeneratedOutput"("clientId");
