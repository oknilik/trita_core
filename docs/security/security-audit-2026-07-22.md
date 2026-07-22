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

### 🟠 P1 — Team/Org meghívó-elfogadás email-ellenőrzése — JAVÍTVA ✅
**(a) Email-egyezés — JAVÍTVA ✅.** A named (nem `__open__`) meghívó mostantól
csak a címzett fiókjával fogadható el. A kapu a `runJoinTransaction`-ben ül —
ez a mutáció egyetlen belépési pontja (shared + legacy + org-switch flow-k mind
ide futnak), így a kliens-állapottól függetlenül véd. Mismatch → 403
`INVITE_EMAIL_MISMATCH`, lokalizált kliens-üzenettel. Integrációs teszt hozzáadva
(join-acceptance-matrix). Ez zárja a tényleges authz-lyukat (jogosulatlan
csatlakozás).

**(b) Random token az id helyett — JAVÍTVA ✅ (döntés: B).** Új `token` mező
mindkét pending-invite modellen, create-nél `crypto.randomBytes(16)`; a link és
a lookup a tokent használja, a rekord id csak belső (delete/PK). Döntés szerint
a már kiküldött, id-alapú régi linkek megszűnnek (nincs átmeneti dupla-lookup);
bejelentkezett meghívottnak a journey friss token-linket ad. Verifikálva:
token ≠ id, token-lookup talál, régi-id-lookup null.

### 🟠 P2 — CSP bevezetése — REPORT-ONLY ÉLESÍTVE ✅
`Content-Security-Policy-Report-Only` a next.config.ts-ben (Clerk + Turnstile
engedve, frame-ancestors 'none', object-src 'none'). Landing + sign-in
sértés-jelentés nélkül fut. Következő lépés: éles reportok figyelése, majd a
header átnevezése `Content-Security-Policy`-ra (enforce).

### 🟠 P3 — Org-váltó / role-PATCH mélyteszt — JAVÍTVA ✅
7 unit-teszt rögzíti az invariánsokat (tests/unit/policy/
org-member-patch-authz.test.ts): member/manager nem kap orgAdminManage-et,
admin/consultant igen, de restricted/frozen/none előfizetés alatt nem; a PATCH
enum nem tartalmazza az ORG_CONSULTANT-ot.

### 🟡 P4 — Cron secret timing-safe összehasonlítás — JAVÍTVA ✅
`crypto.timingSafeEqual` + hossz-guard a Bearer-secret összevetésben.

### 🟡 P5 — Duplikált feedback-végpontok — RÉSZBEN
`/api/feature-interest` (results-bannerek, admin-email) és
`/api/features/interest` (dashboard CTA, GET-lista) VALÓJÁBAN külön fogyasztók,
más kulcs-készlettel — törlés UI-t törne. Hardening: a védtelen
`features/interest` POST rate limitet kapott. Egységesítés (közös enum + közös
POST) külön refaktor-kör.

### 🟡 P6 — E2E auth bypass
`TRITA_E2E_AUTH_BYPASS` + cookie: NODE_ENV=production alatt tiltva (helyes).
Figyelendő: staging környezet production build-del fusson, különben a bypass
elérhető.

### ℹ️ P7 — requireOrgContext API-kontextusban redirectel — JAVÍTVA (org/remind) ✅
Az `org/[id]/remind` mostantól saját JSON-auth (401/403). Más API-route-ok is
használják a `requireOrgContext`-et — ha valahol JSON kell redirect helyett,
ugyanezt a mintát kövessük (nem globális csere, hogy a page-flow ne törjön).

### ℹ️ P8 — Resend domain-verify — RÉSZBEN ✅ (ops-teendő marad)
Kódoldal: prodban RESEND_FROM_EMAIL hiányánál induláskori warning (lib/resend).
Ops-teendő: domain-verify a resend.com/domains alatt + RESEND_FROM_EMAIL env a
verifikált domainre — enélkül az admin-értesítők (lead, inquiry, contact)
némán elhalnak.

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
