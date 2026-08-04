-- A csomag- és fizetés-integrációs mezők eltávolítása a Subscription-ből
-- (2026-07-31). A csomagok (Team / Org / Scale) nem léteznek, a fizetés a
-- platformon kívül történik, a Stripe/Billingo réteg pedig már korábban
-- kivezetésre került — ezek a mezők utána maradtak árván.
--
-- Ellenőrizve: a Stripe/Billingo mezőknek egyetlen valódi fogyasztója sem
-- volt (az advisory oldal csak SELECT-elte, nem használta az értéket).
--
-- A tábla MARAD, mert teherhordó: az admin org-hozzáférés (aktiválás,
-- trial, hosszabbítás) és a policy-motor állapotgépe (active / restricted /
-- frozen) a `status` + `currentPeriodEnd` + `trialEndsAt` mezőkből dolgozik.
-- A `candidateCredits` is marad: az KVÓTA, nem ár.

ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "stripeCustomerId";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "stripeSubscriptionId";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "stripePriceId";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "stripeLatestInvoiceId";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "billingoLastDocumentId";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "billingInterval";
