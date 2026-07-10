-- CreateTable: TeamReport (consultant-validated, published team picture)
CREATE TABLE IF NOT EXISTS "TeamReport" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "orgId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "aggregates" JSONB,
    "summary" TEXT,
    "strengths" TEXT,
    "risks" TEXT,
    "recommendations" TEXT,
    "interviewFindings" TEXT,
    "internalNotes" TEXT,
    "createdById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TeamReport_teamId_status_idx" ON "TeamReport"("teamId", "status");

ALTER TABLE "TeamReport" ADD CONSTRAINT "TeamReport_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
