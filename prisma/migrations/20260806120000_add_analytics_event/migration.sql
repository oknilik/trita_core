-- Analitika: first-party esemény-tábla.
--
-- Egyetlen széles tábla, napi rotáló pszeudonim látogató-azonosítóval
-- (visitorRef). IP-cím, e-mail és szabad szöveg NEM kerül bele — ld.
-- docs/development/analytics.md és a Prisma-modell megjegyzéseit.
--
-- Indexek:
--   (name, occurredAt)          — eseményenkénti idősor (a leggyakoribb lekérdezés)
--   (occurredAt)                — megőrzési takarítás és teljes idősor
--   (visitorRef, occurredAt)    — látogatónkénti tölcsér egy napon belül
--   (userProfileId, occurredAt) — bejelentkezett út + profil-törléskori anonimizálás

CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitorRef" TEXT NOT NULL,
    "userProfileId" TEXT,
    "isAuthed" BOOLEAN NOT NULL DEFAULT false,
    "roleClass" TEXT,
    "path" TEXT,
    "locale" TEXT,
    "deviceClass" TEXT,
    "referrerHost" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'client',
    "appVersion" TEXT,
    "props" JSONB,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEvent_name_occurredAt_idx" ON "AnalyticsEvent"("name", "occurredAt");
CREATE INDEX "AnalyticsEvent_occurredAt_idx" ON "AnalyticsEvent"("occurredAt");
CREATE INDEX "AnalyticsEvent_visitorRef_occurredAt_idx" ON "AnalyticsEvent"("visitorRef", "occurredAt");
CREATE INDEX "AnalyticsEvent_userProfileId_occurredAt_idx" ON "AnalyticsEvent"("userProfileId", "occurredAt");
