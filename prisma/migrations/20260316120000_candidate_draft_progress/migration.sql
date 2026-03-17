-- AlterTable
ALTER TABLE "CandidateInvite" ADD COLUMN "draftStartedAt" TIMESTAMP(3),
ADD COLUMN "draftAnsweredCount" INTEGER NOT NULL DEFAULT 0;
