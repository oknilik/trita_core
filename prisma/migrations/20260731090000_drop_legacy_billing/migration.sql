-- A régi, dobozos árazási modell kivezetése (2026-07-31).
--
-- Az üzleti modell tanácsadás-vezérelt: a fizetés a platformon KÍVÜL történik
-- (tanácsadói számlázás, átutalás), a hozzáférést platform admin adja kézzel.
-- A Stripe/Billingo réteg már korábban eltávolításra került; ez a két tábla
-- maradt utána árván.
--
-- Ellenőrizve a törlés előtt: MINDHÁROM adatbázisban (production, preview,
-- lokál dev) 0 sor. Kódhivatkozás: az AdvisorySession-höz egy sem, a
-- Purchase-höz csak halott ágak a src/lib/access.ts-ben (getTeamAccessLevel,
-- hasUnusedAdvisorySession, markAdvisoryUsed — egyiket sem hívta senki).
--
-- A `Subscription` NEM része ennek: az él és teherhordó — az admin
-- org-hozzáférés (aktiválás/trial/hosszabbítás) és a policy-motor
-- állapotgépe (active/restricted/frozen) abból dolgozik.
--
-- A korábbi árazás visszaállítható a `billing-v1-parked` git tagből.

DROP TABLE IF EXISTS "AdvisorySession";
DROP TABLE IF EXISTS "Purchase";
