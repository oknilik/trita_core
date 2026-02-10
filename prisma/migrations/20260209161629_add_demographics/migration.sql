-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "birthYear" INTEGER,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "onboardedAt" TIMESTAMP(3);
