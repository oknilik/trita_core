# Biztonsági audit — 2026-07-22

Hatókör: teljes kódbázis (~80 API route, middleware, auth-réteg, token-flow-k,
RBAC, headerek, secret-kezelés). Módszer: route-onkénti guard-átvilágítás +
célzott mélyvizsgálat a token-alapú publikus flow-kon.

Súlyosság: 🔴 magas · 🟠 közepes · 🟡 alacsony · ℹ️ megjegyzés

---

## Javítva ebben a körben ✅

### 🟠 F1 — Meghívó-tokenek cuid() defaulttal (részben megjósolható)
`ObserverInvitation.token` és `CandidateInvite.token` a séma `@default(cuid())`
értékére támaszkodott. A cuid időbélyeget + számlálót tartalmaz, bearer
tokenhez nem elég véletlen.
**Fix:** mindkét létrehozási ponton explicit `crypto.randomBytes(16).toString("hex")`
(observer/invite route, candidate-apply/service). Régi tokenek érvényesek
maradnak; lejáratuk (30 nap) kifuttatja őket.

### 🟠 F2 — Email-küldő végpontok rate limit nélkül
`POST /api/profile/share/send` és `POST /api/inquiry` belépett userként
korlátlanul küldethetett emailt (spam / költség-vektor).
**Fix:** `checkRateLimit("contact", userId)` mindkettőn.

### 🟠 F3 — Hiányzó biztonsági headerek
Nem volt X-Frame-Options / nosniff / Referrer-Policy / Permissions-Policy /
HSTS.
**Fix:** next.config.ts headers() bővítve. CSP szándékosan kimaradt — külön
körben, először Report-Only módban (Clerk + inline style-ok miatt).

### 🟡 F4 — Cron endpoint fail-open
`GET /api/cron/release-steps` CRON_SECRET nélkül nyitott volt.
**Fix:** prodban secret nélkül 401 (fail closed); dev-viselkedés változatlan.

---

## Nyitott javaslatok (döntést igényel)

### 🔴 P1 — Team/Org meghívó-elfogadás nem ellenőrzi az emailt
`TeamPendingInvite` / `OrganizationPendingInvite`: a join-link a rekord `id`-ját
(cuid) használja bearer tokenként, és az elfogadásnál **nincs email-egyezés
ellenőrzés** (acceptance/service.ts) — bármely belépett user csatlakozhat, aki
ismeri az id-t. A cuid-előrejelezhetőség + a szándékos link-továbbítás UX
együtt teszi ezt kockázattá (jogosulatlan org/team tagság → csapat-adatok).
**Javaslat:** (a) named-email meghívónál kötelező email-egyezés az elfogadáskor
(`__open__` reusable meghívó marad szabad), ÉS (b) külön `token` mező
crypto-random értékkel az id helyett. UX-döntés is (link-továbbítás ma
működik) — ezért nem javítottam csendben.

### 🟠 P2 — CSP bevezetése
`Content-Security-Policy-Report-Only` először, majd enforce. Clerk-domainek +
`'unsafe-inline'` style szükséges lesz; a JSON-LD script statikus (biztonságos).

### 🟠 P3 — Org-váltó / role-PATCH mélyteszt
`org/[id]/members/[userId]` PATCH enum nem tartalmazza az ORG_CONSULTANT-ot
(helyes), LAST_ADMIN-védelem él. Javasolt integrációs teszt-kör: consultant
nem eszkalálhat, member nem PATCH-elhet.

### 🟡 P4 — Cron secret timing-safe összehasonlítás
`header !== Bearer secret` — elvi timing-oldalcsatorna. `crypto.timingSafeEqual`
javasolt (gyakorlati kockázat alacsony).

### 🟡 P5 — Duplikált feedback-végpontok
`/api/feature-interest` és `/api/features/interest` átfedő funkció — egyiket
érdemes kivezetni (támadási felület + karbantartás).

### 🟡 P6 — E2E auth bypass
`TRITA_E2E_AUTH_BYPASS` + cookie: NODE_ENV=production alatt tiltva (helyes).
Figyelendő: staging környezet production build-del fusson, különben a bypass
elérhető.

### ℹ️ P7 — requireOrgContext API-kontextusban redirectel
Nem-belépett API-hívásnál 307-et ad JSON-hiba helyett (pl. org/[id]/remind).
Funkcionálisan zárt, de API-konzisztencia szempontból NextResponse 401 lenne
tiszta.

### ℹ️ P8 — Resend domain-verify
Prod előtt kötelező, különben admin-értesítő emailek némán elhalnak
(CONTACT_FORM_TO).

---

## Rendben talált területek ✅

- **Auth-lefedettség:** mind a ~80 route self-guardol (Clerk `auth()` /
  `getServerAuth` / `requireAdmin` / org-membership check / bearer / svix).
  A middleware szándékosan engedi át az /api-t — route-szintű guard a minta.
- **RBAC:** szerep-döntések központi helyeken (ORG_ROLE_RANK, policy-engine,
  capabilities); ORG_CONSULTANT nem osztható ki org-meghívóból; LAST_ADMIN-
  védelem él; team-adatok `canAccessTeam`/`getAccessibleTeamIds` mögött;
  élő tritanAvg csak tanácsadói nézetben; notification dismiss ownership-
  szűrt (`userId` a where-ben); org-context váltás csak saját tagságra.
- **Input-validáció:** Zod minden mutáló route-on; hibakód-minta konzisztens.
- **Webhook:** Svix-aláírás ellenőrzött, secret hiányán 500 (fail closed).
- **Observer-flow:** token-lifecycle (lejárat, státusz), max 5 aktív meghívó,
  OBSERVER_MISMATCH védelem linkelésnél.
- **Share-flow:** 128 bit véletlen token, visszavonás mindent töröl, a
  megosztott nézet nem tartalmaz email-t/érzékeny azonosítót.
- **Secrets:** .env gitignore-olva, repo-ban nincs secret; example fájlok
  placeholder-esek.
- **SQL/XSS:** nincs raw query; egyetlen `dangerouslySetInnerHTML` statikus
  JSON-LD.
- **Fiók-törlés:** soft delete + PII-nullázás + Clerk user törlés.

---

## API-dokumentáció

Teljes, csoportosított OpenAPI 3.1 leíró: `docs/api/openapi.yaml`
(~80 végpont, auth-sémák, request bodyk a Zod-sémákból).

**Automatikus generálás:** a projekt sima Next.js route-handlereket használ,
dekorátor-réteg nélkül — ezért nincs "ingyen" generátor. Opciók:
1. **zod-openapi / @asteasolutions/zod-to-openapi** (ajánlott): a meglévő Zod
   sémákat `.openapi()` metaadattal annotálva a spec generálható szkriptből;
   fokozatosan bevezethető, a kézi yaml addig marad a forrás.
2. **next-rest-framework**: route-handlerek wrappelése typed factory-val —
   teljes automatizmus, de minden route átírását igényli.
3. Kézi karbantartás (jelen állapot): új route → yaml-bejegyzés; a
   `docs/development/changelog` fegyelmével működik.
