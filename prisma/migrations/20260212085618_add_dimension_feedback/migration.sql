-- CreateTable
CREATE TABLE "DimensionFeedback" (
    "id" TEXT NOT NULL,
    "assessmentResultId" TEXT NOT NULL,
    "dimensionCode" TEXT NOT NULL,
    "accuracyRating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DimensionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DimensionFeedback_assessmentResultId_idx" ON "DimensionFeedback"("assessmentResultId");

-- CreateIndex
CREATE UNIQUE INDEX "DimensionFeedback_assessmentResultId_dimensionCode_key" ON "DimensionFeedback"("assessmentResultId", "dimensionCode");

-- AddForeignKey
ALTER TABLE "DimensionFeedback" ADD CONSTRAINT "DimensionFeedback_assessmentResultId_fkey" FOREIGN KEY ("assessmentResultId") REFERENCES "AssessmentResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
