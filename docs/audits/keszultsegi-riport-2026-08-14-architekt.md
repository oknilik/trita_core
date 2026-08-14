# Készültségi riport — ARCHITEKT szemmel

> Alap: `main` @ `63da5ae` (2026-08-12). Vizsgálat dátuma: 2026-08-14.
> A mérések ebben a konténerben futottak le (friss `pnpm install`, saját futtatás),
> nem doksiból átvett számok.

## 0. Egymondatos ítélet

**A kód-alap éles indulásra érett; ami hiányzik, az nem architektúra, hanem
üzemeltetési műszerezettség és néhány konkrét, félrevezető viselkedésű végpont.**
Nem javasolok refaktort a pilot előtt — a lenti P0/P1 tételek napok, nem hetek.

---

## 1. Mért alapállapot

| Mutató | Érték | Hogyan mértem |
|---|---:|---|
| TypeScript hiba | **0** | `tsc --noEmit` |
| ESLint hiba/warning | **0** | `eslint .` |
| Unit teszt | **986 / 986 zöld** (80 suite, 16,6 s) | `node scripts/run-tests.mjs unit` |
| TS/TSX fájl | 706 (130 576 sor) | `find` + `wc` |
| React komponens | 211 | `src/components/**/*.tsx` |
| lib modul | 116 (`src/lib/*.ts`) | |
| API route | 110 | `src/app/api/**/route.ts` |
| Oldal | 63 | `src/app/**/page.tsx` |
| Prisma modell / migráció | 38 / 20 | `prisma/schema.prisma` |

A `CLAUDE.md` „~60 örökölt lint-hiba" megjegyzése **elavult** — a lint ma tiszta.
Érdemes frissíteni, mert ma az áll ott, hogy „ne szaporítsd", miközben nulláról indulunk.

### Ami a számokból következik

A projekt mérete (130 kLOC) és a tesztfedettség aránya rendben van, **de a
piramis fordítva áll**:

```
unit         126 fájl   ████████████████████
client        30 fájl   █████
integration   16 fájl   ███
e2e            6 fájl   █
```

63 oldal és 110 route mögött **6 e2e spec** áll (assessment-flow, journey-smoke,
critical-ia-smoke, observer-flow, team-intelligence-visual, theme-gallery).
Ez a legvékonyabb réteg pont ott, ahol egy consulting-led pilotnál a hiba
látszik: a tanácsadó élő ügyfél előtt kattint végig egy kampányt.

---

## 2. P0 — indulás előtt javítandó

### A1. A kampány-emlékeztető NEM küld emlékeztetőt, de azt állítja, hogy küldött

**Ez a riport legsúlyosabb egyedi lelete.**

`src/app/api/org/[id]/campaigns/[campaignId]/remind/route.ts:92-95`:

```ts
  // In a real implementation, you would send reminder emails here.
  // For now we just count and return.

  return NextResponse.json({ ok: true, remindedCount: notStartedCount });
```

A hívó (`src/components/org/CampaignCard.tsx:88-95`) ebből felhasználói
visszajelzést csinál, `src/lib/i18n/org.ts:626`:

> „**{count} személynek küldtünk emlékeztetőt**" / "Reminded {count} participants"

Tehát: az auth, a jogosultság-ellenőrzés (`ORG_MANAGER` + `canManageMeasurements`),
a lépés-tudatos „nem kezdte" számítás — mind gondosan meg van írva; a végén
**egyetlen e-mail sem megy ki**, a felület mégis sikert jelent. Egy pilotban a
tanácsadó ebből azt hiszi, dolgozott a rendszer, és nem küld kézzel emlékeztetőt.
Ez nem hiányzó feature, hanem **hazug visszajelzés** — és pont egy olyan
termékben, amelynek deklarált alapelve a forrás- és evidencia-őszinteség.

Két elfogadható javítás, sorrendben:
1. Az emlékeztető tényleges kiküldése (a `notifications/` orchestrator + Resend
   már megvan, az observer-reminder sweep mintája adott:
   `src/lib/notifications/sweep.ts`).
2. Ha ez most nem fér bele: a gomb tiltása / a szöveg cseréje arra, ami igaz
   („{count} tag nem kezdte el"), és a route `501`-et adjon.

Teszt nincs rá — a `tests/` alatt egyetlen találat sincs erre az útvonalra.

### A2. Halott stub-route ugyanezzel a mintával

`src/app/api/org/[id]/remind/route.ts:32-34` — `// TODO: implement actual
reminder sending via Resend` … `return NextResponse.json({ ok: true })`.
**Nincs hívója** a kódbázisban (végignéztem). Törlendő: egy `ok: true`-t adó,
nem működő végpont később biztosan bekötődik valahova.

### A3. Nincs hibafigyelés (error tracking / alerting)

`package.json`-ban nincs Sentry vagy bármilyen APM; a `src/lib/logger.ts`
strukturált JSON-t ad a Vercel log-drainbe — ez **passzív**. Ma senki nem tudja
meg, ha a pilot alatt egy `/observe/[token]` submit 500-at ad: az observer
feladja, a tanácsadó pedig „kevés visszajelzés jött" élményt kap, ok nélkül.

A logger `event`-mezős konvenciója (`domain.action_result`) kiváló alap — egy
Sentry (vagy akár egy `log.error`-ra kötött Vercel log-drain riasztás) fél nap.
**Pilot alatt ez a legnagyobb vak folt.**

### A4. `.env.example` — a `CLAUDE.md` nem létező fájlra hivatkozik

`CLAUDE.md`: „A teljes, magyarázatos env-lista: **`.env.example`**". A fájl
**nincs a repóban**, és nem is lehet: `.gitignore:34` `.env*`, alóla egyedül a
`!.env.test.example` van kivéve. A `docs/development/launch-checklist.md` is
ebből dolgozna.

A kódban ténylegesen olvasott 46 env-változó (kigyűjtve):

```
ADMIN_EMAIL ADMIN_EMAILS ANALYTICS_ENABLED ANALYTICS_SALT ANTHROPIC_API_KEY
APP_URL BLOG_STORE CLERK_SECRET_KEY CLERK_WEBHOOK_SECRET CONTACT_FORM_TO
CRON_SECRET DATABASE_URL DB_METRICS* DIRECT_URL JOURNEY_DEBUG LOG_JSON
LOG_LEVEL NEXT_PUBLIC_APP_URL PRISMA_CONNECTION_LIMIT RESEND_API_KEY
RESEND_FROM_EMAIL TRITA_E2E_AUTH_BYPASS TRITA_POLICY_ENGINE_ENFORCEMENT
UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN UI_AUDIT_* VERCEL_*
```

Ebből néhány **csendben ront, ha hiányzik** (`ANALYTICS_SALT`,
`RESEND_FROM_EMAIL`, `UPSTASH_*` → a rate-limit szó nélkül kikapcsol,
`src/lib/rate-limit.ts:12` `if (!process.env.UPSTASH_REDIS_REST_URL) return null`).
Javaslat: `.env.example` **kivétele a gitignore alól** (`!.env.example`), és
feltöltése a fenti listával, kötelező/éles/opcionális jelöléssel.

---

## 3. P1 — indulás után az első két hétben

### B1. `robots.ts` és `sitemap.ts` már elcsúszott egymástól

A `src/app/robots.ts:4-5` saját docstringje mondja ki az invariánst:
„**Együtt kell mozogniuk a `sitemap.ts` bejegyzéseivel**". Ma nem mozognak:
a `/about` és a `/rolunk` **benne van a sitemapben**
(`src/app/sitemap.ts`, priority 0.8 és 0.5), de **nincs benne** a robots
`PUBLIC_PATHS` tömbjében.

Funkcionálisan ma még nem tör el (amire nincs `Disallow`, az alapból engedett),
de az invariáns sérült, és a `tests/unit/seo/crawler-surface.test.ts` **csak azt
őrzi, hogy privát útvonal ne szivárogjon ki** — a fordított irányt (sitemap ⊆
robots-allow) semmi nem köti. Egy soros teszt megoldja, és utána nem tud
visszatérni.

### B2. `getTeamPageData` továbbra is fülönként túlfut

`src/lib/team-stats.ts:319` szignatúrája ma is `(teamId, locale)` — nincs
fül-scope —, és a `src/app/(app)/team/[id]/page.tsx:418` **feltétel nélkül**
hívja, bármelyik fül aktív. A `docs/audits/perf-stress-test-2026-07-31.md`
R2-ajánlása (a legdrágább nézeten ~10 query és a 7 hullám rövidülése)
**nyitott**. A `regions: ["fra1"]` viszont már be van állítva
(`vercel.json`) — az R1, a 6,7×-es tétel, tehát megvan.

Kontextusban: a mérés szerint a rendszer **késleltetés-kötött, nem adat-kötött**
(a legnagyobb tábla 358 soros volt). Pilot-terhelésen ez nem fog eltörni —
ezért P1 és nem P0 —, de a `csapat · tagok` 45 query-je a legtöbbet látott
tanácsadói nézet.

### B3. Rate-limit lefedettség: 110 route-ból 30

A publikus, auth nélküli felületek (`/observe/[token]`, `/candidate/[token]`,
`/api/e`, `/api/contact`, `/api/pilot-apply`) **le vannak fedve** — ezt
ellenőriztem. A hiány a belépés mögötti mutáló route-okon van. Alacsony
kockázat pilotban (ismert, kis felhasználói kör), de a `UPSTASH_*` hiánya
esetén a meglévő limitek is **némán** kikapcsolnak — ezt legalább induláskori
`log.warn`-nal jelezni kellene, ahogy a `RESEND_FROM_EMAIL`-nél már megvan
(`src/lib/resend.ts:38-45`).

### B4. Két route megkerüli az e-mail-wrappert

`src/app/api/pilot-apply/route.ts` és `src/app/api/advisory/request/route.ts`
saját `new Resend(...)`-et példányosít, és **bedrótozott feladót** használ
(`noreply@trita.io`, `hello@trita.io`) az `EMAIL_FROM` helyett. A
`src/lib/resend.ts:27-33` kommentje pont erről szól: a Resend DNS-rekordok a
`send.trita.io`-n élnek, és **verifikálatlan domainről a küldés 403-mal, némán
elhal**. Ha a `hello@trita.io` nincs verifikálva, a pilot-jelentkezés
visszaigazolója sosem ér célba — és a jelentkezés **sehol nincs eltárolva**
(a `/api/contact` ezzel szemben perzisztál: `inquiries.ts`).

Konkrétan: a `pilot-apply` route-on **nincs Zod-validáció** sem (a
`CLAUDE.md` konvenciója szerint kötelező), csak `body as Record<string, string>`
+ trim-ellenőrzés; és ha a második `resend.emails.send` dob, a hívó 500-at kap,
miközben az admin-értesítő már kiment. A `/pilot` a landing hero fő CTA-ja
(`src/components/landing/HeroSection.tsx`) — ez a **legfontosabb lead-út**,
és a legkevésbé védett kódrészlet a rendszerben.

---

## 4. P2 — tudatos adósság, nem sürgős

- **Akadálymentesség.** 211 komponensre 134 `aria-*`/`role` előfordulás, és
  **nincs automatizált a11y-teszt** (nincs `axe` a `tests/` alatt). A billentyű-
  navigáció pontszerűen kezelve van (notification-panel fókusz-csapda), de
  rendszerszinten nem mérjük. B2B SaaS-nál ez előbb-utóbb beszerzési kérdés lesz.
- **`pg_stat_statements` nincs telepítve** a Neonon (perf-audit F8) — éles
  lekérdezés-szintű rálátás nélkül minden jövőbeli mérés app-oldali marad.
- **`/api/nav/context` a leggyakrabban hívott végpont** — memoizáció bekerült
  (`nav-context.server.ts:67,113`), de a 30 query-s layout-padló (perf F3)
  szerkezeti tétel marad. A 2026-07-30-i kör tudatosan a Router Cache-t
  választotta helyette; ezt a döntést nem javaslom felnyitni pilot előtt.
- **A `TRITA_E2E_AUTH_BYPASS` guard helyes** (`NODE_ENV=production` alatt nem
  aktiválható) — a perf-audit F5 lelete a *mérőeszköz* hibája, nem a kódé.
  Semmiképp ne lazítsuk.

---

## 5. Amit kifejezetten NEM javaslok

1. **Újabb motor-audit kört.** A `docs/audits/motor-known-residuals.md`
   konvergencia-szabálya teljesült, a v9 zárókör tulajdonosi döntéssel lezárult.
   Ami maradt, azt **adat oldja fel, nem kód** — a következő lépés a pilot.
2. **A 30 query-s layout-padló megtámadását pilot előtt.** Nagy, kockázatos,
   és a `fra1`-régió már elvitte a nyereség javát.
3. **Billing visszaállítását.** A `billing-v1-parked` tag rendben parkol,
   a consulting-led modell nem igényli.

---

## 6. Sorrend, ahogy én csinálnám

| # | Tétel | Becslés |
|---|---|---|
| 1 | A1 — kampány-emlékeztető: küldjön, vagy mondjon igazat | fél nap |
| 2 | A3 — Sentry (vagy log-drain riasztás) `log.error`-ra | fél nap |
| 3 | A4 — `.env.example` unignore + feltöltés | 1 óra |
| 4 | B4 — `pilot-apply` + `advisory/request`: `EMAIL_FROM`, Zod, perzisztálás | fél nap |
| 5 | A2 — halott stub törlése | 10 perc |
| 6 | B1 — robots⊆sitemap invariáns-teszt + a két hiányzó path | 1 óra |
| 7 | B2 — `getTeamPageData` fül-scope | 1 nap |

Az 1–6 **egy nap alatt megvan**, és utána a rendszer őszintén viselkedik és
látható is, ha elromlik. A 7-es ráér a pilot első hete után, mérés alapján.
