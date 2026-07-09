-- CreateTable
CREATE TABLE "CandidateCredit" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateCredit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateCredit_orgId_idx" ON "CandidateCredit"("orgId");

-- CreateIndex
CREATE INDEX "CandidateCredit_orgId_createdAt_idx" ON "CandidateCredit"("orgId", "createdAt");

-- AddForeignKey
ALTER TABLE "CandidateCredit" ADD CONSTRAINT "CandidateCredit_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
