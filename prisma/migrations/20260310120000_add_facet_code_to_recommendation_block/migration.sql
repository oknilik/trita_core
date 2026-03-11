-- AlterTable: add facetCode column to RecommendationBlock
ALTER TABLE "RecommendationBlock" ADD COLUMN "facetCode" TEXT;

-- DropIndex: old index without facetCode
DROP INDEX IF EXISTS "RecommendationBlock_dimensionCode_scoreRange_idx";

-- CreateIndex: new composite index including facetCode
CREATE INDEX "RecommendationBlock_dimensionCode_facetCode_scoreRange_idx" ON "RecommendationBlock"("dimensionCode", "facetCode", "scoreRange");
