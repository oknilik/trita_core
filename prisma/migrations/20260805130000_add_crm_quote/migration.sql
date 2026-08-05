-- CRM ajánlat-réteg: Quote — kalkulátor-input + kimenet + rate card
-- pillanatkép, globális quoteNo sorszámmal (megjelenítés: "TRT-ÉÉÉÉ-NNNN").
-- SENT-től immutábilis; módosítás = másolat új DRAFT-ként.

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "quoteNo" SERIAL NOT NULL,
    "dealId" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "input" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "rateCardSnapshot" JSONB NOT NULL,
    "netTotal" INTEGER NOT NULL,
    "discountPct" INTEGER NOT NULL DEFAULT 0,
    "validUntil" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNo_key" ON "Quote"("quoteNo");
CREATE INDEX "Quote_dealId_createdAt_idx" ON "Quote"("dealId", "createdAt");
CREATE INDEX "Quote_status_validUntil_idx" ON "Quote"("status", "validUntil");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
