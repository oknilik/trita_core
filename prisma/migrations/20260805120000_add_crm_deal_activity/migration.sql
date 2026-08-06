-- CRM alapréteg: Deal (pipeline-folyamat) + CrmActivity (idővonal), plusz
-- opcionális Inquiry.dealId link. Tisztán additív — adat-UPDATE nincs, az
-- Inquiry meglévő mezői és státusz-értékkészlete érintetlen.

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "company" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'NEW',
    "source" TEXT NOT NULL DEFAULT 'inquiry',
    "expectedValue" INTEGER,
    "nextActionAt" TIMESTAMP(3),
    "nextActionNote" TEXT,
    "adminNote" TEXT,
    "outcomeKind" TEXT,
    "outcomeNote" TEXT,
    "closedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "organizationId" TEXT,
    "userProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmActivity" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN "dealId" TEXT;

-- CreateIndex
CREATE INDEX "Deal_stage_nextActionAt_idx" ON "Deal"("stage", "nextActionAt");
CREATE INDEX "Deal_contactEmail_idx" ON "Deal"("contactEmail");
CREATE INDEX "Deal_organizationId_idx" ON "Deal"("organizationId");
CREATE INDEX "CrmActivity_dealId_occurredAt_idx" ON "CrmActivity"("dealId", "occurredAt");
CREATE INDEX "Inquiry_dealId_idx" ON "Inquiry"("dealId");

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
