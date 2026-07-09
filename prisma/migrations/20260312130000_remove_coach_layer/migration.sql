-- Migration: remove_coach_layer
-- Drops all coaching/manager layer tables and related enum.
-- The coach layer (CoachProfile, ManagerClientRelationship, RecommendationBlock,
-- GeneratedOutput, CoachApplication) is removed from the product scope.

-- Drop tables in FK-safe order
DROP TABLE IF EXISTS "CoachApplication";
DROP TABLE IF EXISTS "GeneratedOutput";
DROP TABLE IF EXISTS "RecommendationBlock";
DROP TABLE IF EXISTS "ManagerClientRelationship";
DROP TABLE IF EXISTS "CoachProfile";

-- Remove MANAGER value from UserRole enum
-- (INDIVIDUAL, ORG_ADMIN, ORG_MEMBER remain)
UPDATE "UserProfile" SET "role" = 'INDIVIDUAL' WHERE "role" = 'MANAGER';

CREATE TYPE "UserRole_new" AS ENUM ('INDIVIDUAL', 'ORG_ADMIN', 'ORG_MEMBER');

ALTER TABLE "UserProfile"
  ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "UserProfile"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING "role"::text::"UserRole_new";

ALTER TABLE "UserProfile"
  ALTER COLUMN "role" SET DEFAULT 'INDIVIDUAL'::"UserRole_new";

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Drop CoachRelationshipStatus enum (no longer referenced)
DROP TYPE IF EXISTS "CoachRelationshipStatus";
