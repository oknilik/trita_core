-- CreateEnum
CREATE TYPE "ObserverType" AS ENUM ('INTERNAL', 'EXTERNAL', 'ANONYMOUS');

-- AlterTable
ALTER TABLE "ObserverInvitation" ADD COLUMN     "externalContext" TEXT,
ADD COLUMN     "observerType" "ObserverType" NOT NULL DEFAULT 'INTERNAL';

-- AlterTable
ALTER TABLE "OrganizationMember" ADD COLUMN     "leftAt" TIMESTAMP(3),
ALTER COLUMN "role" SET DEFAULT 'ORG_MEMBER';

-- AlterTable
ALTER TABLE "OrganizationPendingInvite" ALTER COLUMN "role" SET DEFAULT 'ORG_MEMBER';
