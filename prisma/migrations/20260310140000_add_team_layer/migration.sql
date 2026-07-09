-- Team layer: Team, TeamMember, TeamPendingInvite, CandidateInvite, CandidateResult

-- Team
CREATE TABLE "Team" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "ownerId"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Team_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId")
        REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Team_ownerId_idx" ON "Team"("ownerId");

-- TeamMember
CREATE TABLE "TeamMember" (
    "id"       TEXT NOT NULL,
    "teamId"   TEXT NOT NULL,
    "userId"   TEXT NOT NULL,
    "role"     TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId")
        REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamMember_teamId_userId_key" UNIQUE ("teamId", "userId")
);
CREATE INDEX "TeamMember_teamId_idx" ON "TeamMember"("teamId");
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- TeamPendingInvite
CREATE TABLE "TeamPendingInvite" (
    "id"        TEXT NOT NULL,
    "teamId"    TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamPendingInvite_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TeamPendingInvite_teamId_fkey" FOREIGN KEY ("teamId")
        REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamPendingInvite_teamId_email_key" UNIQUE ("teamId", "email")
);
CREATE INDEX "TeamPendingInvite_email_idx" ON "TeamPendingInvite"("email");

-- CandidateInvite
CREATE TABLE "CandidateInvite" (
    "id"          TEXT NOT NULL,
    "token"       TEXT NOT NULL,
    "managerId"   TEXT NOT NULL,
    "teamId"      TEXT,
    "email"       TEXT,
    "name"        TEXT,
    "position"    TEXT,
    "status"      TEXT NOT NULL DEFAULT 'PENDING',
    "testType"    TEXT NOT NULL DEFAULT 'HEXACO',
    "expiresAt"   TIMESTAMP(3) NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "CandidateInvite_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CandidateInvite_token_key" UNIQUE ("token"),
    CONSTRAINT "CandidateInvite_managerId_fkey" FOREIGN KEY ("managerId")
        REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CandidateInvite_teamId_fkey" FOREIGN KEY ("teamId")
        REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "CandidateInvite_managerId_idx" ON "CandidateInvite"("managerId");
CREATE INDEX "CandidateInvite_token_idx" ON "CandidateInvite"("token");
CREATE INDEX "CandidateInvite_teamId_idx" ON "CandidateInvite"("teamId");

-- CandidateResult
CREATE TABLE "CandidateResult" (
    "id"        TEXT NOT NULL,
    "inviteId"  TEXT NOT NULL,
    "testType"  TEXT NOT NULL,
    "scores"    JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CandidateResult_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CandidateResult_inviteId_key" UNIQUE ("inviteId"),
    CONSTRAINT "CandidateResult_inviteId_fkey" FOREIGN KEY ("inviteId")
        REFERENCES "CandidateInvite"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
