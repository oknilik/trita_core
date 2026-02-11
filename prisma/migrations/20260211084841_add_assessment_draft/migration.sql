-- CreateTable
CREATE TABLE "AssessmentDraft" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "testType" "TestType" NOT NULL,
    "answers" JSONB NOT NULL,
    "currentPage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentDraft_userProfileId_key" ON "AssessmentDraft"("userProfileId");

-- AddForeignKey
ALTER TABLE "AssessmentDraft" ADD CONSTRAINT "AssessmentDraft_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
