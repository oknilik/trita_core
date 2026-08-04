-- Fake door kereslet-mérés: megtekintés-napló + válaszok.
-- Kézzel írt migráció: a `prisma migrate dev` shadow DB-je egy örökölt
-- migráció NotificationType hibáján elhasal (ld. CLAUDE.md / memória).

CREATE TABLE "FakeDoorView" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "profileId" TEXT,
    "audience" TEXT NOT NULL,
    "priceVariant" INTEGER NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FakeDoorView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FakeDoorView_module_sessionId_key" ON "FakeDoorView"("module", "sessionId");
CREATE INDEX "FakeDoorView_module_createdAt_idx" ON "FakeDoorView"("module", "createdAt");

CREATE TABLE "FakeDoorResponse" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "profileId" TEXT,
    "audience" TEXT NOT NULL,
    "priceVariant" INTEGER NOT NULL,
    "interest" TEXT NOT NULL,
    "reasonNo" TEXT,
    "valueGoal" TEXT,
    "otherText" TEXT,
    "emailOptIn" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "source" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FakeDoorResponse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FakeDoorResponse_module_sessionId_key" ON "FakeDoorResponse"("module", "sessionId");
CREATE INDEX "FakeDoorResponse_module_interest_idx" ON "FakeDoorResponse"("module", "interest");
CREATE INDEX "FakeDoorResponse_module_priceVariant_idx" ON "FakeDoorResponse"("module", "priceVariant");
