/*
  Warnings:

  - You are about to drop the column `consentVersion` on the `UserProfile` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CoachApplication" DROP CONSTRAINT "CoachApplication_userProfileId_fkey";

-- DropForeignKey
ALTER TABLE "CoachClientRelationship" DROP CONSTRAINT "CoachClientRelationship_clientId_fkey";

-- DropForeignKey
ALTER TABLE "CoachClientRelationship" DROP CONSTRAINT "CoachClientRelationship_coachId_fkey";

-- DropForeignKey
ALTER TABLE "CoachProfile" DROP CONSTRAINT "CoachProfile_userProfileId_fkey";

-- DropForeignKey
ALTER TABLE "GeneratedOutput" DROP CONSTRAINT "GeneratedOutput_clientId_fkey";

-- DropForeignKey
ALTER TABLE "GeneratedOutput" DROP CONSTRAINT "GeneratedOutput_coachId_fkey";

-- AlterTable
ALTER TABLE "CoachApplication" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "reviewedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CoachClientRelationship" ALTER COLUMN "startedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "endedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CoachProfile" ALTER COLUMN "verifiedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "GeneratedOutput" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ObserverInvitation" ALTER COLUMN "lastReminderSentAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RecommendationBlock" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ResearchSurvey" ALTER COLUMN "motivation" DROP DEFAULT,
ALTER COLUMN "sharingIntent" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "consentVersion";

-- AddForeignKey
ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachClientRelationship" ADD CONSTRAINT "CoachClientRelationship_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachClientRelationship" ADD CONSTRAINT "CoachClientRelationship_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedOutput" ADD CONSTRAINT "GeneratedOutput_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedOutput" ADD CONSTRAINT "GeneratedOutput_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachApplication" ADD CONSTRAINT "CoachApplication_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
