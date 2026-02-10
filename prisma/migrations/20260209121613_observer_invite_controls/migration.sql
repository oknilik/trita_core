-- AlterEnum
ALTER TYPE "InvitationStatus" ADD VALUE 'CANCELED';

-- DropForeignKey
ALTER TABLE "AssessmentResult" DROP CONSTRAINT "AssessmentResult_userProfileId_fkey";

-- AlterTable
ALTER TABLE "AssessmentResult" ALTER COLUMN "userProfileId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ObserverInvitation" ADD COLUMN     "observerProfileId" TEXT;

-- CreateIndex
CREATE INDEX "ObserverInvitation_observerProfileId_idx" ON "ObserverInvitation"("observerProfileId");

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObserverInvitation" ADD CONSTRAINT "ObserverInvitation_observerProfileId_fkey" FOREIGN KEY ("observerProfileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
