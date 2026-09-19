-- NULL preserves the initial program baseline; [] explicitly means no comparisons.
ALTER TABLE "CandidateReport" ADD COLUMN "comparisons" JSONB;
