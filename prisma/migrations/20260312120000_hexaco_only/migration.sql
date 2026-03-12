-- Migration: hexaco_only
-- Removes HEXACO_MODIFIED and BIG_FIVE from TestType enum.
-- Clears all research data so the DB starts fresh with HEXACO only.

-- Step 1: Clear all research-related data (FK order matters)
DELETE FROM "DimensionFeedback";
DELETE FROM "SatisfactionFeedback";
DELETE FROM "ResearchSurvey";
DELETE FROM "FeatureInterest";
DELETE FROM "ObserverAssessment";
DELETE FROM "ObserverDraft";
DELETE FROM "ObserverInvitation";
DELETE FROM "AssessmentDraft";
DELETE FROM "AssessmentResult";

-- Step 2: Reset testType on all user profiles
UPDATE "UserProfile" SET "testType" = NULL, "testTypeAssignedAt" = NULL;

-- Step 3: Recreate TestType enum with HEXACO only
CREATE TYPE "TestType_new" AS ENUM ('HEXACO');

ALTER TABLE "UserProfile"
  ALTER COLUMN "testType" TYPE "TestType_new"
  USING "testType"::text::"TestType_new";

ALTER TABLE "AssessmentDraft"
  ALTER COLUMN "testType" TYPE "TestType_new"
  USING "testType"::text::"TestType_new";

ALTER TABLE "AssessmentResult"
  ALTER COLUMN "testType" TYPE "TestType_new"
  USING "testType"::text::"TestType_new";

ALTER TABLE "ObserverInvitation"
  ALTER COLUMN "testType" TYPE "TestType_new"
  USING "testType"::text::"TestType_new";

DROP TYPE "TestType";
ALTER TYPE "TestType_new" RENAME TO "TestType";
