-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "orgId" TEXT,
    "teamId" TEXT,
    "tier" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "includesAdvisory" BOOLEAN NOT NULL DEFAULT false,
    "advisoryUsed" BOOLEAN NOT NULL DEFAULT false,
    "includedCredits" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvisorySession" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "teamId" TEXT,
    "purchaseId" TEXT,
    "subscriptionId" TEXT,
    "requestedById" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisorySession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Purchase_userProfileId_idx" ON "Purchase"("userProfileId");

-- CreateIndex
CREATE INDEX "Purchase_orgId_idx" ON "Purchase"("orgId");

-- CreateIndex
CREATE INDEX "Purchase_teamId_idx" ON "Purchase"("teamId");

-- CreateIndex
CREATE INDEX "Purchase_tier_idx" ON "Purchase"("tier");

-- CreateIndex
CREATE INDEX "Purchase_stripeCheckoutSessionId_idx" ON "Purchase"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "AdvisorySession_orgId_idx" ON "AdvisorySession"("orgId");

-- CreateIndex
CREATE INDEX "AdvisorySession_teamId_idx" ON "AdvisorySession"("teamId");

-- CreateIndex
CREATE INDEX "AdvisorySession_purchaseId_idx" ON "AdvisorySession"("purchaseId");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
