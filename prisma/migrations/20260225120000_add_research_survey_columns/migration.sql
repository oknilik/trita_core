-- Add missing columns to ResearchSurvey
-- These fields were added to the schema after the initial table creation.

ALTER TABLE "ResearchSurvey"
  ADD COLUMN IF NOT EXISTS "motivation"      TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "sharingIntent"   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "positionLevel"   TEXT,
  ADD COLUMN IF NOT EXISTS "studyField"      TEXT,
  ADD COLUMN IF NOT EXISTS "industry"        TEXT,
  ADD COLUMN IF NOT EXISTS "feedbackSources" TEXT;

-- Make selfAccuracy NOT NULL with a safe default for any existing rows
-- (schema defines it as Int, not Int?)
UPDATE "ResearchSurvey" SET "selfAccuracy" = 3 WHERE "selfAccuracy" IS NULL;
ALTER TABLE "ResearchSurvey" ALTER COLUMN "selfAccuracy" SET NOT NULL;

-- Add missing column to UserProfile
ALTER TABLE "UserProfile"
  ADD COLUMN IF NOT EXISTS "consentVersion" TEXT;
