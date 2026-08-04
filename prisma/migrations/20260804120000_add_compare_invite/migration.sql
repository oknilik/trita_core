-- Valódi páros interakció-összehasonlítás (CompareInvite) — kézzel írt
-- migráció, a QuoteRateCard precedens szerint (a migrate dev shadow DB-je
-- egy örökölt migráción elhasal).
CREATE TABLE "CompareInvite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "partnerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompareInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CompareInvite_token_key" ON "CompareInvite"("token");
CREATE INDEX "CompareInvite_inviterId_idx" ON "CompareInvite"("inviterId");
CREATE INDEX "CompareInvite_partnerId_idx" ON "CompareInvite"("partnerId");

ALTER TABLE "CompareInvite" ADD CONSTRAINT "CompareInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CompareInvite" ADD CONSTRAINT "CompareInvite_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
