-- CreateTable
CREATE TABLE "ResearchSurvey" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "priorTest" TEXT NOT NULL,
    "has360Process" TEXT,
    "selfAccuracy" INTEGER,
    "personalityImportance" INTEGER,
    "observerUsefulness" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureInterest" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResearchSurvey_userProfileId_key" ON "ResearchSurvey"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureInterest_userProfileId_featureKey_key" ON "FeatureInterest"("userProfileId", "featureKey");

-- CreateIndex
CREATE INDEX "FeatureInterest_featureKey_idx" ON "FeatureInterest"("featureKey");

-- AddForeignKey
ALTER TABLE "ResearchSurvey" ADD CONSTRAINT "ResearchSurvey_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureInterest" ADD CONSTRAINT "FeatureInterest_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
