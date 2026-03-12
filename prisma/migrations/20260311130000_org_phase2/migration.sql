-- Organization: add status field
ALTER TABLE "Organization" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- OrganizationMember: migrate role values (ADMIN → ORG_ADMIN, MEMBER → ORG_MEMBER)
UPDATE "OrganizationMember" SET "role" = 'ORG_ADMIN' WHERE "role" = 'ADMIN';
UPDATE "OrganizationMember" SET "role" = 'ORG_MEMBER' WHERE "role" = 'MEMBER';

-- OrganizationMember: 1-user-1-org unique constraint
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_key" UNIQUE ("userId");

-- OrganizationPendingInvite: migrate role values
UPDATE "OrganizationPendingInvite" SET "role" = 'ORG_MEMBER' WHERE "role" = 'MEMBER';
UPDATE "OrganizationPendingInvite" SET "role" = 'ORG_ADMIN' WHERE "role" = 'ADMIN';
