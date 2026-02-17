-- Remove MBTI from TestType enum
-- PostgreSQL does not support DROP VALUE directly, so we recreate the enum

-- Step 1: Create new enum without MBTI
CREATE TYPE "TestType_new" AS ENUM ('HEXACO', 'HEXACO_MODIFIED', 'BIG_FIVE');

-- Step 2: Alter all columns that use TestType
ALTER TABLE "UserProfile" ALTER COLUMN "testType" TYPE "TestType_new" USING ("testType"::text::"TestType_new");
ALTER TABLE "AssessmentDraft" ALTER COLUMN "testType" TYPE "TestType_new" USING ("testType"::text::"TestType_new");
ALTER TABLE "AssessmentResult" ALTER COLUMN "testType" TYPE "TestType_new" USING ("testType"::text::"TestType_new");
ALTER TABLE "ObserverInvitation" ALTER COLUMN "testType" TYPE "TestType_new" USING ("testType"::text::"TestType_new");

-- Step 3: Drop old enum and rename new one
DROP TYPE "TestType";
ALTER TYPE "TestType_new" RENAME TO "TestType";
