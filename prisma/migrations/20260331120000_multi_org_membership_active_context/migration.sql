-- Non-destructive multi-org membership support
-- 1) Allow many org memberships per user
-- 2) Track active org context on UserProfile

ALTER TABLE "UserProfile"
ADD COLUMN "activeOrgId" TEXT;

-- Backfill active org context from existing active membership.
UPDATE "UserProfile" AS up
SET "activeOrgId" = om."orgId"
FROM "OrganizationMember" AS om
WHERE om."userId" = up."id"
  AND om."leftAt" IS NULL;

-- Drop one-org-per-user hard constraint to allow multi-org memberships.
ALTER TABLE "OrganizationMember"
DROP CONSTRAINT IF EXISTS "OrganizationMember_userId_key";

-- Add indexes for active context and active membership lookups.
CREATE INDEX IF NOT EXISTS "UserProfile_activeOrgId_idx"
ON "UserProfile"("activeOrgId");

CREATE INDEX IF NOT EXISTS "OrganizationMember_userId_leftAt_idx"
ON "OrganizationMember"("userId", "leftAt");

ALTER TABLE "UserProfile"
ADD CONSTRAINT "UserProfile_activeOrgId_fkey"
FOREIGN KEY ("activeOrgId") REFERENCES "Organization"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
