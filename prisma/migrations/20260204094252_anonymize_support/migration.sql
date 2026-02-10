-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "clerkId" DROP NOT NULL;
