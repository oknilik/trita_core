-- Organization
CREATE TABLE "Organization" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "ownerId"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId")
        REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Organization_ownerId_idx" ON "Organization"("ownerId");

-- OrganizationMember
CREATE TABLE "OrganizationMember" (
    "id"       TEXT NOT NULL,
    "orgId"    TEXT NOT NULL,
    "userId"   TEXT NOT NULL,
    "role"     TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrganizationMember_orgId_fkey" FOREIGN KEY ("orgId")
        REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrganizationMember_orgId_userId_key" UNIQUE ("orgId", "userId")
);
CREATE INDEX "OrganizationMember_orgId_idx" ON "OrganizationMember"("orgId");
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- OrganizationPendingInvite
CREATE TABLE "OrganizationPendingInvite" (
    "id"        TEXT NOT NULL,
    "orgId"     TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "role"      TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizationPendingInvite_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrganizationPendingInvite_orgId_fkey" FOREIGN KEY ("orgId")
        REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganizationPendingInvite_orgId_email_key" UNIQUE ("orgId", "email")
);
CREATE INDEX "OrganizationPendingInvite_email_idx" ON "OrganizationPendingInvite"("email");

-- Team: add optional orgId
ALTER TABLE "Team" ADD COLUMN "orgId" TEXT;
ALTER TABLE "Team" ADD CONSTRAINT "Team_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Team_orgId_idx" ON "Team"("orgId");
