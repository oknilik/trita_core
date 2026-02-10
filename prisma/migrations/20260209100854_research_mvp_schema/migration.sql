-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('HEXACO', 'HEXACO_MODIFIED', 'BIG_FIVE', 'MBTI');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('FRIEND', 'COLLEAGUE', 'FAMILY', 'PARTNER', 'OTHER');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED');

-- AlterTable
ALTER TABLE "AssessmentResult" ADD COLUMN     "isSelfAssessment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "testType" "TestType";

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "consentedAt" TIMESTAMP(3),
ADD COLUMN     "testType" "TestType",
ADD COLUMN     "testTypeAssignedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ObserverInvitation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "observerEmail" TEXT,
    "observerName" TEXT,
    "testType" "TestType" NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ObserverInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObserverAssessment" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "knownDuration" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObserverAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SatisfactionFeedback" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "selfAssessmentAccuracy" INTEGER NOT NULL,
    "observerAssessmentAccuracy" INTEGER NOT NULL,
    "overallSatisfaction" INTEGER NOT NULL,
    "freeformFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SatisfactionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ObserverInvitation_token_key" ON "ObserverInvitation"("token");

-- CreateIndex
CREATE INDEX "ObserverInvitation_inviterId_idx" ON "ObserverInvitation"("inviterId");

-- CreateIndex
CREATE INDEX "ObserverInvitation_token_idx" ON "ObserverInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ObserverAssessment_invitationId_key" ON "ObserverAssessment"("invitationId");

-- CreateIndex
CREATE UNIQUE INDEX "SatisfactionFeedback_userProfileId_key" ON "SatisfactionFeedback"("userProfileId");

-- AddForeignKey
ALTER TABLE "ObserverInvitation" ADD CONSTRAINT "ObserverInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObserverAssessment" ADD CONSTRAINT "ObserverAssessment_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "ObserverInvitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SatisfactionFeedback" ADD CONSTRAINT "SatisfactionFeedback_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
