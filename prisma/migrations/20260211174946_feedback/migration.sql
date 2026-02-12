/*
  Warnings:

  - You are about to drop the column `observerAssessmentAccuracy` on the `SatisfactionFeedback` table. All the data in the column will be lost.
  - You are about to drop the column `overallSatisfaction` on the `SatisfactionFeedback` table. All the data in the column will be lost.
  - You are about to drop the column `selfAssessmentAccuracy` on the `SatisfactionFeedback` table. All the data in the column will be lost.
  - Added the required column `agreementScore` to the `SatisfactionFeedback` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SatisfactionFeedback" DROP COLUMN "observerAssessmentAccuracy",
DROP COLUMN "overallSatisfaction",
DROP COLUMN "selfAssessmentAccuracy",
ADD COLUMN     "agreementScore" INTEGER NOT NULL,
ADD COLUMN     "interestedInUpdates" BOOLEAN NOT NULL DEFAULT false;
