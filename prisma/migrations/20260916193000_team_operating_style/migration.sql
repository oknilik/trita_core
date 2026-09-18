-- CreateTable
CREATE TABLE "TeamOperatingRound" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "instrumentVersion" TEXT NOT NULL,
    "eligibleUserIds" TEXT[],
    "referenceStart" TIMESTAMP(3) NOT NULL,
    "referenceEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamOperatingRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamOperatingResponse" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamOperatingResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamOperatingRound_campaignId_key" ON "TeamOperatingRound"("campaignId");

-- CreateIndex
CREATE INDEX "TeamOperatingRound_teamId_idx" ON "TeamOperatingRound"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamOperatingResponse_roundId_userId_key" ON "TeamOperatingResponse"("roundId", "userId");

-- AddForeignKey
ALTER TABLE "TeamOperatingRound" ADD CONSTRAINT "TeamOperatingRound_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamOperatingRound" ADD CONSTRAINT "TeamOperatingRound_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamOperatingResponse" ADD CONSTRAINT "TeamOperatingResponse_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "TeamOperatingRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamOperatingResponse" ADD CONSTRAINT "TeamOperatingResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
