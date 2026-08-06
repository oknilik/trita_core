# Trita — Project Context

> Utolsó mélyfrissítés: 2026-07-10. Napi részletek: `docs/development/changelog/`.

## Mi ez a projekt?

**Trita** — személyiség- és csapatintelligencia platform, **tanácsadás-vezérelt
(consulting-led) modellben**. Önértékelő személyiségfelmérés + ismerősi/kollégai
(observer) visszajelzés + csapat-szintű elemzések (heatmap, mintázatok,
csapatszerepek). A platform a tanácsadói munka demonstrációs és követő eszköze;
az ügyfelek és csapataik visszanézhetik az eredményeket.

**Üzleti modell (2026-07 óta):**
- A fizetés a platformon KÍVÜL történik (tanácsadói számlázás).
- A Stripe/Billingo billing réteg eltávolítva — visszaállítható a
  `billing-v1-parked` git tagből. A Prisma sémában a Subscription/Purchase/
  BillingEventLog modellek megmaradtak.
- Org-hozzáférést a platform admin ad kézzel: `/admin?tab=orgs` →
  `POST /api/admin/org-access` (activate/trial/extend/deactivate/set_credits,
  assign_consultant/remove_consultant).
- Minden upgrade/checkout CTA a `/contact`-ra mutat.
- A korábbi kutatás-platform narratíva a publikus felületről eltávolítva;
  a platform termékként kommunikál.

## Tech stack

- Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind CSS v4
- Auth: Clerk (custom sign-in/up flow-k `useSignIn`/`useSignUp` hookokkal,
  Google SSO, webhook-szinkron a `UserProfile`-lal)
- DB: Neon PostgreSQL + Prisma 6 (30+ modell)
- Email: Resend (wrapper: `src/lib/resend.ts`, sablonok: `src/lib/emails.ts`)
- i18n: HU/EN (`src/lib/i18n/` modul; `Locale = "hu" | "en"`)
- Design: CSS-variable token rendszer (`src/app/globals.css` +
  `docs/development/ui-token-map.md`); tipikus osztályok: `bg-cream`,
  `text-ink`, `text-bronze`, `bg-sage`, `border-sand`, `font-fraunces`
- Tesztek: unit/integration/client/e2e rétegek (`scripts/run-tests.mjs`)

## Architektúra — kulcsrendszerek

| Rendszer | Hol | Mit csinál |
|---|---|---|
| **Journey engine** | `src/lib/journey/` | Belépés utáni központi elosztó. `/dashboard` = tiszta dispatcher; `resolveHome()` dönt szerep+állapot alapján. Stage-ek: SELF_* → TEAM_* → ORG_*. |
| **Policy engine + capabilities** | `src/lib/policy-engine.ts`, `capabilities.ts`, `policy-service.ts` | Szerep × subscription-állapot → capability set (read/manage/invite/launchCampaign/orgAdminManage…). Subscription state gép: active/restricted/frozen (`src/lib/subscription.ts`). |
| **Org/Team domain** | `src/lib/org-stats.ts`, `team-stats.ts`, `org-context.ts` | Multi-org tagság (aktív org kontextussal), csapatok, 360° kampányok (DRAFT→ACTIVE→CLOSED, visszafordíthatatlan). |
| **Team intelligence** | `src/lib/team-intelligence.ts`, `team-pattern.ts`, `components/team/` | Súlyozott modellek confidence-szel: `resolveContributionPlacement()` (TeamMap), profil-alapú dinamika-becslés (`team-stats.ts` friction), csapatszerepek (valódi kitöltés > HEXACO-becslés, forrás-badge kötelező). |
| **Observer flow** | `/observe/[token]`, `src/lib/observer/` | Publikus (auth nélkül), token-alapú, 30 nap lejárat, max 5 aktív meghívó, confidence rating, szerver-oldali draft. |
| **Notification hub** | `src/lib/notifications/` | Orchestrator + repository + policy rétegek, dedupe kulcs, role-aware címzés. |
| **Analitika** | `src/lib/analytics/`, `/api/e`, `/admin?tab=analytics` | Saját, first-party esemény-követés. ZÁRT katalógus (`events.ts`) zod `.strict()` sémákkal — PII szerkezetileg nem kerülhet bele. Nincs süti és semmilyen eszköz-tárolás: napi rotáló látogató-álnév. Üzleti szám mindig DB-ből, esemény csak mintázatra. Doksi: `docs/development/analytics.md` |
| **Admin** | `/admin` (+ `/api/admin/*`) | Csak `ADMIN_EMAILS` env-ben listázott emailek (nincs nav-link, beírt URL). Tabok: Áttekintés/Kutatás/Emlékeztetők/Szervezetek. |

## Szerepek

`OrganizationMember.role` **sima String** (nem enum): `ORG_ADMIN` >
`ORG_MANAGER` > `ORG_MEMBER`, plusz:

- **`ORG_CONSULTANT`** — trita admin által kiosztott tanácsadó
  (`/admin?tab=orgs`, email alapján). Admin-paritású hozzáférés a
  szervezetben (rank 3, admin capability set, org cockpit home, admin nav),
  de: „Tanácsadó" badge-dzsel jelenik meg, NEM számít bele a
  LAST_ADMIN-védelembe, a tag-számokba/seat-be/HEXACO-átlagokba, és az
  org-meghívó flow-kból nem osztható ki (role-PATCH enum sem tartalmazza).

Szerep-döntési pontok (mindig EZEKET bővítsd, ne írj literal összehasonlítást):
`auth.ts` (ORG_ROLE_RANK, hasOrgRole), `policy-engine.ts`
(canRoleManage/isAdmin), `capabilities.ts` (normalizeOrgRole),
`journey/context.ts` (deriveJourneyCurrentContext), `navigation/roles.ts`
(resolveWorkspaceNavRole).

## Felmérés (instrumentum) — FONTOS

- Jelenleg **egyetlen kérdésbank él**: a **TSFI v2** (2026-07-16,
  `src/lib/questions/tritan.ts`, `TestType.TRITAN`). Minden új user ezt
  kapja (`assignTestType.ts` — fix, nem random). Alapértelmezett forma:
  **TSFI-S** (60 item, ~9 perc; `DEFAULT_ASSESSMENT_FORM = "short"` az
  operating-mode-ban, a 100 itemes full későbbi tanácsadói opció).
- **Licenc rendezve**: a TSFI-itemek az IPIP public domain poolból jönnek
  (92 IPIP–HEXACO + 8 kiegészítő) — kereskedelmi használatra is szabad,
  engedély/díj nélkül. Provenance: `docs/product/tsfi-item-provenance.md`;
  jogi audit: `tsfi-item-audit-2026-07.md` (az EN-itemek IPIP-eredete
  2026-07-29-én szövegszintű összevetéssel igazolva — B1 szál lezárva,
  ld. provenance-doksi). A korábbi HEXACO-PI-R bank kivezetve.
- **HEXACO névtér (2026-07-29 — a TRITAN-branding KIVEZETVE)**: a
  megjelenítés mindenhol a HEXACO-jelöléseket követi (H Becsületesség-Alázat
  · E Emocionalitás · X Extraverzió · A Barátságosság · C Lelkiismeretesség
  · O Nyitottság; facetek a HEXACO-PI-R terminológiával). A user-facing
  szöveg NEVESÍTHETI a HEXACO-t és az IPIP-eredetet — ez a hitelesség
  forrása. Kanonikus térkép: `src/lib/tritan.ts` (a fájlnév és a TRITAN_*
  export-azonosítók history-okból maradtak — az ÉRTÉKEK HEXACO-k). Új
  felületen NE vezess be saját dimenzió-címkét — a tritan.ts-ből dolgozz.
  A kérdőív-név TSFI maradt.
- BELSŐ dimenziókódok (DB score-JSON-ok, számítások): TEMP/RESO/INTE/THOR/
  ADAP/OPEN — NEM változtak (INTE→H, RESO→E, TEMP→X, ADAP→A, THOR→C,
  OPEN→O). E fordított: magasabb = érzelmesebb.
- TestType enum a sémában: **TRITAN** (egyedüli érték — a korábbi
  HEXACO/HEXACO_MODIFIED/BIG_FIVE örökség törölve).
- **Csapatszerep-modell (2026-07-20)**: saját 27 itemes bank
  (`team-role-questions.ts`), self + peer perspektíva, kódok:
  OG/KE/KO/HA/ER/CS/MV/MI/SZ. User-facing szövegben NE szerepeljen
  „Belbin" (védjegy + licencelt instrumentum) — a mérés neve
  „csapatszerep-kérdőív" / „csapattársi szerep-visszajelzés", a modell
  „Trita csapatszerep-modell (9 szerep)". A peer-kép mindig aggregált,
  min. 3 értékelő (TEAM_ROLE_PEER_MIN_RATERS). Tervek:
  `docs/product/team-role-360-plan.md` + kiváltási terv.

## Route-térkép (fő felületek)

```
PUBLIKUS:  / (landing, self/team mód) · /try (vendég teszt) · /pricing
           (tanácsadói ajánlat) · /founding · /contact · /blog · /patterns
           · /observe/[token] · /join/[token] · /join/org/[inviteId]
BELÉPVE:   /dashboard → journey elosztó (soha nem renderel tartalmat)
  user:    /profile/results (tabok: results/comparison/invites) · /profile
           · /assessment · /team/[id] (ha tag)
  manager: /manager (cockpit) · /team/[id] (tabok: overview/intelligence/
           profile/members/teamRole) · org?tab=campaigns (observer körök)
  admin:   /org/[id] (cockpit; tabok: overview/campaigns/teams/members)
           · /org/[id]/settings · /hiring/[orgId] (fagyasztott réteg)
  trita:   /admin (ADMIN_EMAILS guard)
```

Fejléc-nav szerepenként (`src/lib/navigation/config.ts` + `visibility.ts`):
admin: Vezérlő·Csapatok·Jelöltek·Szervezet·Analitika; manager:
Vezérlő·Csapatom·Jelöltek·Riportok; member: Vezérlő·Eredményeim·Csapatok.

## Tesztelés

```bash
pnpm check            # type-check + lint
pnpm test:unit        # node:test + tsx (gyors)
pnpm test:client      # vitest + testing-library
pnpm test:integration # test DB kell (bootstrap: test:integration:bootstrap)
pnpm test:e2e         # Playwright
```

Elvárás: type-check 0 hiba (2026-07-10 óta tiszta), unit+client zölden.
Lint: ~60 örökölt hiba van (no-explicit-any, `// eyebrow` jsx-comment) —
új kódban ne szaporítsd.

## Konvenciók és szabályok

- `.env`-hez SOHA ne nyúlj, secretet ne commitolj. Kötelező env-k:
  Clerk kulcsok, DATABASE_URL, RESEND_API_KEY, `ADMIN_EMAILS` (admin
  felület!), NEXT_PUBLIC_APP_URL.
- Minden user-facing szöveg i18n kulcson át (`t`/`tf`), HU+EN.
- API route-okon Zod-validáció; hibakód-minta: rövid kód a szerverről
  (pl. `INVITE_LIMIT_REACHED`), kliens lokalizálja.
- Mutáció után `router.refresh()`.
- Mobile-first, `min-h-[44px]` touch targetek, csak `md:` breakpoint.
- Tipográfia: a 7 szerep-utility (`text-display/title/heading/body/caption/
  label/micro`) az arbitrary `text-[Npx]` helyett; 10px alatt lint-error.
  Eyebrow: `SectionEyebrow` (mono=admin, clean=ügyfél). Gomb/input: Button/
  TextField primitív. TS-oldali szín: `design-tokens.ts` (PDF/email is innen)
  — részletek: `docs/development/ui-contribution-guide.md`.
- Becsült vs mért adat: minden intelligence-kimeneten kötelező a forrás/
  confidence jelölés (badge, módszertani jegyzet) — ez a termék hitelességi
  alapelve.
- Komponensek: PascalCase; lib: camelCase; pages: `page.tsx`.

## Fagyasztott / parkolt rétegek

- ~~Hiring/candidate flow~~ — **2026-07-23-tól ÚJRA AKTÍV** (nem fagyasztott):
  kapu ki (`CANDIDATE_GATING_ENABLED=false`, operating-mode), hozzáférés a
  tanácsadói körnek (isConsultantSurface); opcionális csapatszerep-lépés a
  jelöltnek, kitöltés-értesítés a tanácsadónak/org adminnak. Részletek:
  changelog 2026-07-23.
- **Billing (Stripe/Billingo)**: teljes implementáció a `billing-v1-parked`
  tagben; visszaállítási terv: `docs/development/billing-v1-launch-checklist.md`.
- **Advisory oldal** (`/advisory`): él, CTA-k `/contact`-ra mutatnak.

## Dokumentáció-mutatók

- `docs/development/changelog/` — napi változásnapló (KARBANTARTANDÓ)
- `docs/architecture/` — ADR-ek, journey/notification architektúra
- `docs/development/ui-token-map.md` + `ui-contribution-guide.md` — design
- `docs/audits/` — egyszeri auditok (team-intelligence audit itt)
- Üzleti kontextus (gyökér iCloud doksik): tanácsadói hibrid modell,
  founding customer program
