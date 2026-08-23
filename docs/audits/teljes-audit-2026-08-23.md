# Teljes projekt-audit — 2026-08-23

> Hatókör: a teljes kódbázis, a teszt- és CI-réteg, a build, az adatmodell, a
> jogi/ops felkészültség és a kész featureök minősége. Kérdés, amire válaszol:
> **mi az indulási minimum, és milyen minőségben állnak a kész funkciók.**
>
> Módszer: minden állítás mögött futtatott parancs vagy konkrét kódhely áll.
> Ami nem volt reprodukálható a konténerben (éles Vercel/Neon/Resend/Clerk
> konfiguráció), az külön jelölve „nem ellenőrizhető innen".

---

## 0. Egymondatos verdikt

A kódbázis **érettebb, mint a szokásos pre-pilot állapot** — a mérnöki alap
(típusbiztonság, tesztréteg, jogosultság-modell, anonimitás-padló, parkolási
kapu) rendben van, és a Scan v1 mérési lánc kódszinten hiánytalan. Az indulást
ma **nem a termék hiányossága blokkolja, hanem hét darab kód- és ops-tétel**,
amelyek közül öt egy-két órás munka, kettő üzleti/jogi döntést igényel.

---

## 1. Mérési alap — mit futtattam és mi jött ki

| Ellenőrzés | Parancs | Eredmény |
|---|---|---|
| Típusellenőrzés | `pnpm type-check` | ✅ **0 hiba** |
| Lint | `pnpm lint` | ✅ **0 hiba** (a CLAUDE.md „~60 örökölt hiba" sora elavult) |
| Szín-guardrail | `pnpm check:colors` | ✅ tiszta |
| Unit | `pnpm test:unit` | ✅ **1136 / 1136** (87 suite, 24 s) |
| Integráció | `pnpm test:integration` | ✅ **175 / 175** (friss PG 16 + `migrate deploy`) |
| Kliens | `pnpm test:client` | ❌ **238 / 239 — 1 valódi bukás** |
| E2E | `pnpm test:e2e` | ⚠️ **36 zöld / 3 piros**, ebből 2 flaky, 1 reprodukálható |
| Prod build | `pnpm build` | ✅ sikeres, warning nélkül |
| Migrációk | `prisma migrate deploy` üres DB-re | ✅ mind a 25 lefut |
| Séma-drift | `prisma migrate diff` | ✅ **nincs drift** |

Méret: **777** `.ts/.tsx` a `src/` alatt, **69** oldal, **119** API route,
**222** tesztfájl, **25** migráció, **45** Prisma modell.

### 1.1 A piros kliens-teszt

`tests/client/results/pair-dimension-band.test.tsx:91`

```
expect(screen.getByText("Hol fut az eltérés")).toBeInTheDocument();
```

A `608a7d8` (PR #43, HU nyelvi átnézés) a `results.pairDriverTitle` kulcsot
„Hol fut az eltérés" → **„Hol jelenik meg az eltérés"**-re írta
(`src/lib/i18n/results.ts:1047`), a tesztet viszont nem. **A kód a helyes, a
teszt az elavult** — de a `main` ettől piros a kliens-rétegen, és ez azt is
megmutatja, hogy a merge nem várta meg a zöld CI-t.

### 1.2 Az E2E-bukások

- `assessment-flow.test.ts:122` és `observer-flow.test.ts:185` — **flaky**:
  második futásra zöld. Ok: a `next dev` első fordítása belefut a 30 s-os
  teszt-timeoutba.
- `navigation/critical-ia-smoke.test.ts:262` („admin critical flows remain
  healthy") — **reprodukálhatóan** elbukik 30 s-mal, `--timeout=120000`-rel
  **19,9 s alatt zöld**. Nem termékhiba: egyetlen teszt hét oldalletöltést
  végez, és a költségvetése nincs hozzáigazítva a dev-fordításhoz. CI-ben a
  `retries: 2` ma elfedi — ez viszont pont a `pnpm test:pilot` kapuban lévő
  két flow-t teszi megbízhatatlanná.

---

## 2. Indulási minimum — a blokkolók (P0)

Sorrend: ami nélkül nem szabad élesíteni.

### P0-1 · Valós cégadatok a jogi oldalra — ÜZLETI DÖNTÉS

`src/lib/legal/company.ts` ma placeholder cégnevet, székhelyet,
cégjegyzékszámot, adószámot és képviselőt tartalmaz, ezért
`LEGAL_DOCS_ARE_DRAFT = true`, a `/privacy` pedig **„tervezet" jelölést és
`noindex`-et** kap, és kimarad a sitemapből.

Ez a GDPR 13. cikk szerinti tájékoztatási kötelezettséget nem teljesíti. Egy
tanácsadói pilotnál, ahol relációs bizalmi adatot és névtelen pszichológiai
biztonság pulse-t gyűjtünk, ez nem formalitás — ez az első kérdés, amit egy
ügyfél jogásza feltesz.

A kód készen áll: valós adatok + `LEGAL_DOCS_ARE_DRAFT = false`, egy commit.

### P0-2 · Nincs ÁSZF / felhasználási feltételek

A `(marketing)` fában **egyetlen jogi oldal van: `/privacy`**. Regisztrációt,
fiókot és tárolt tartalmat kínáló platformnál a felhasználási feltételek
hiánya önálló hiány — nem az adatvédelmi tájékoztató pótolja. A pilot-
megállapodás és a DPA (mindkettő a playbookban ígérve) szintén nem kódtétel,
de nélkülük nem indulhat szervezeti mérés.

### P0-3 · Nincs hibamonitorozás és riasztás

Nincs Sentry vagy bármilyen hibakövető. A szerver-logok a Vercel stdout-jára
mennek (`src/lib/logger.server.ts`), a kliens-hibák a látogató böngésző-
konzoljára (`src/lib/client-logger.ts`) — **oda senki nem néz**.

A playbook 4. fejezete azt ígéri a partnernek, hogy „hiba élesben: munkanapon
24 órán belüli reakció". Ma ennek nincs meg a technikai feltétele: egy 500-as
hibáról csak akkor szerzünk tudomást, ha a felhasználó szól. Egy 15–20
csapatos pilotnál ez garantáltan elrontott mérési kör.

Minimum: hibakövető bekötése a `src/app/error.tsx` gyökér-határhoz és a
szerver-loggerhez, plusz riasztás legalább e-mailre.

### P0-4 · Az éles env-készlet nincs verziókövetve

A `CLAUDE.md` és a `docs/development/launch-checklist.md` egyaránt a
**`.env.example`-t nevezi meg** „a teljes, magyarázatos env-listaként". Ez a
fájl **nincs a repóban**: a `.gitignore` `.env*` mintája kizárja, és csak a
`.env.test.example` van kivételezve.

Következmény: az élesítéshez szükséges env-készlet ma egyetlen fejlesztő
gépén és a Vercel felületén él. Egy új környezet (staging, második
tanácsadó, katasztrófa-visszaállítás) felhúzásához nincs forrás.

A kódból kiolvasott, éles szempontból releváns készlet:

```
KÖTELEZŐ   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY · CLERK_SECRET_KEY
           CLERK_WEBHOOK_SECRET · DATABASE_URL · DIRECT_URL
           RESEND_API_KEY · RESEND_FROM_EMAIL · ADMIN_EMAILS
           NEXT_PUBLIC_APP_URL
ÉLESBEN    ANALYTICS_SALT · CRON_SECRET · RESEND_WEBHOOK_SECRET
KÖTELEZŐ   UPSTASH_REDIS_REST_URL · UPSTASH_REDIS_REST_TOKEN
OPCIONÁLIS CONTACT_FORM_TO · LOG_LEVEL · LOG_JSON · ANTHROPIC_API_KEY
           BLOG_STORE · PRISMA_CONNECTION_LIMIT · ANALYTICS_ENABLED
```

Javaslat: `.env.example` a `!` kivétellistára a `.gitignore`-ban, és a fenti
lista magyarázatokkal.

### P0-5 · Rate limit nélkül minden publikus végpont korlátlan

`src/lib/rate-limit.ts:66-80`: ha az Upstash env hiányzik, a limiter `null`,
és **a `newsletter` tier kivételével minden más fail-open** — a kérés
átmegy. A `checkRateLimit` 33 route-on van beépítve (contact, observer submit,
observer link, assessment submit, analytics `/api/e`, share/send…), de
mindegyik hatástalan Upstash nélkül.

A launch-checklist ezt ma **csak a hírlevél fejezete alatt** említi. Valójában
az Upstash a teljes publikus felület előfeltétele: nélküle az observer-token
végpontok és a levélküldő útvonalak korlátlanul szólíthatók.

Vagy állítsuk be az env-et (ez a helyes), vagy — ha tudatosan nem akarunk
Redist — a `contact` és `api` tiernek is fail-closed-nak kell lennie prodban.

### P0-6 · Clerk **dev-instance** hostname a prod válaszfejlécben

`next.config.ts:151-153` minden válaszra ezt teszi:

```
Link: <https://perfect-elf-67.clerk.accounts.dev>; rel=preconnect; crossorigin
```

A `*.clerk.accounts.dev` a Clerk **fejlesztői** instance-a. Éles Clerk
production instance mellett (`clerk.trita.io`) ez a preconnect:

1. rossz hostra nyit TLS-kapcsolatot minden oldalbetöltésnél (lassít, nem
   gyorsít — pont az ellenkezőjét csinálja, mint amiért betették),
2. a fejlesztői instance azonosítóját minden látogatónak kiszórja,
3. a CSP `connect-src`/`script-src` szintén csak a `*.clerk.accounts.dev` és
   `*.clerk.com` hostokat engedi — az éles instance saját domainje (a Clerk
   prodban a te domainedről szolgál ki) **nincs a listán**, tehát a CSP
   enforce-ra váltása a bejelentkezést törné el.

Ezt élesítés előtt env-vezéreltté kell tenni.

### P0-7 · A CI nem futtat type-checket, lintet és buildet

`.github/workflows/tests.yml` jobjai: `ui-audit`, `quality-gate`, `unit`,
`integration`, `client`, `e2e`. **Nincs `pnpm type-check`, `pnpm lint`,
`pnpm check:colors` és nincs `pnpm build`.**

Következmény: egy nem forduló build vagy egy típushiba először a Vercel
deploynál derül ki, éles ágon. A P0-8 (piros kliens-teszt a `main`-en) pedig
azt mutatja, hogy a meglévő tesztjobok sem blokkolják a merge-ölést.

Minimum: egy `checks` job (`pnpm check` + `pnpm build`), és a `main`-re
kötelező status check a `unit`/`client` jobokból.

### P0-8 · Piros teszt a `main`-en

Az 1.1 pontban részletezett `pair-dimension-band.test.tsx` bukás. Egysoros
javítás, de amíg ott van, a „zöld CI" mint jelzés nem használható.

---

## 3. A kész featureök minősége

Értékelés: 🟢 pilotra kész · 🟡 kész, de van nyitott tétel · 🟠 hiányos

### 🟢 Jogosultság- és szerepmodell

A szerep-döntések öt központi helyen élnek (`auth.ts` ORG_ROLE_RANK,
`policy-engine.ts`, `capabilities.ts`, `journey/context.ts`,
`navigation/roles.ts`), literal összehasonlítás nincs szétszórva. Az
`ORG_CONSULTANT` konzisztensen ki van zárva a LAST_ADMIN-védelemből, a
seat-számokból és a role-PATCH enumból. 7 unit-teszt őrzi az invariánsokat.
Az e2e `capability-gate` teszt a szerep-indok és a billing-indok
megkülönböztetését is fedi. **Ez a réteg éles használatra kész.**

### 🟢 Anonimitás és adatvédelmi kapuk

`src/lib/anonymity.ts` egyetlen konstansként (`MIN_RATERS_FOR_ANONYMOUS_AGGREGATE = 3`)
adja az egész termék padlóját, és a pulse (`psych-safety.ts:28`), a trust
(`trust-network.ts:27`) és a peer-szerep is erre hivatkozik. A
`PsychSafetyResponse` modellen **szándékosan nincs user-referencia**, a
beküldési dátum nap pontosságúra csonkolt.

A trust-háló láthatósági szabályai külön ki vannak dolgozva: a hub- és
beágyazatlan-jelölés csak *befelé evidenciált* élekből számol, hogy egy
szigorú értékelő ne bélyegezze meg saját magát. Ez a fajta gondosság ritka —
**ez a termék legerősebb minőségi jele.**

### 🟢 Parkolási kapu (portfólió-szűkítés)

`src/lib/portfolio-parking.ts` egyetlen állapot-objektumból zár le oldalt,
API-t, navigációt, admin-fület, `robots.txt`-et, sitemapet, `llms.txt`-et és
értesítés-típust. A negatív esetek (`/blogger`, `/patterns-library`) nem
záródnak le, és unit-teszt őrzi. Kiváló megvalósítás.

Egy rés: a `/api/newsletter/*` végpontok **nincsenek a `blog` kapu
prefixei között** (`portfolio-parking.ts:76`). Ma nem probléma (a blog
`active`), de ha a blog visszaparkol, a felület eltűnik, a feliratkozó API
viszont nyitva marad.

### 🟢 Scan v1 mérési lánc

A pilot-playbook három rétege kódszinten hiánytalan:
`CAMPAIGN_PRESETS.SCAN_V1 = ["SELF_ASSESSMENT", "TRUST_360", "PSYCH_SAFETY"]`
(`campaign-steps-core.ts:44`), `requireFreshResults: true` szerver-oldalon
kikényszerítve, a `presetId` külön mezőben provenance-ként (nem a steps-ből
visszakövetkeztetve — ez pont jó döntés a kohorsz-tisztaság miatt).

A riport oldalán megvan a `targetMetric` (S5), a
`team-report-comparison.ts` + `team-report-composition.ts` a
`common/joined/left` és stabil-mag döntéssel (S6), és a `TeamReport.aggregates`
publikáláskor befagy. **A playbook ígéretei mögött van kód.**

### 🟡 Tesztréteg

1311 zöld unit+integration teszt komoly háló. Két gyengeség:

1. **A pilot-kritikus útvonalnak nulla API-szintű fedése van.** Sem
   integrációs, sem e2e teszt nem érinti a `/api/trust/peers/submit`,
   `/api/psych-safety/submit`, `/api/team/[id]/report` (publish) és
   `/api/team/[id]/report/actions` végpontokat — pedig a tiszta logikájuk
   (trust-network, psych-safety, team-report) unit-szinten jól fedett. Az
   üzleti értéket adó lánc tehát végponti szinten teszteletlen.
2. **A `pnpm test:pilot` kapu nem a pilotot fedi.** A
   `scripts/run-pilot-gate.mjs` három e2e-t futtat: assessment, observer,
   analytics. Az observer a playbook szerint *nem* része a Scan v1-nek, a
   trust/pulse/riport pedig — ami igen — nincs a kapuban.

### 🟡 i18n

A rendszer jó (zárt szótár, unit-teszt őrzi, hogy minden publikus kulcs
feloldható HU+EN-ben), és a felület gyakorlatilag tiszta — **egyetlen
kivétellel**: `src/components/layout/nav-header-ui.tsx` **nyolc bedrótozott
magyar szöveget** tartalmaz a belépett fejlécben:

| sor | szöveg |
|---:|---|
| 527, 986 | „Profil beállítások" |
| 544, 1002 | „Eredményeim" |
| 625 | „Új ügyfél-szervezet" |
| 632, 1096 | „Nyelv" |
| 654, 1088 | „Kijelentkezés" |

Ez a legláthatóbb felület: egy angol nyelvre váltott felhasználó a
felhasználó-menüben magyarul lát mindent. Az admin/CRM felületek szintén
magyarul vannak bedrótozva, de az tudatos és elfogadható (belső eszköz).

### 🟡 Design-rendszer

A token-réteg és a `check:colors` guardrail kiváló: 0 tiltott literál, a
sötét alias-réteg teljes, az arbitrary `text-[Npx]` lint-hiba.

Viszont a dokumentált 9 szerep-utility (`text-hero/display/title/heading/
body/caption/note/label/micro` + `text-xs/sm/base`) mellett **213 helyen
használunk `text-lg/xl/2xl/3xl/4xl`-t** ügyfél-felületen (adminon kívül) —
a legtöbbet a `TrustPeersClient` (6), az `observe/[token]` (6) és a
`TeamReportComparison` (6), tehát pont a pilot-felületeken. A 2026-08-18-i
„tipográfia egységesítés" tehát részleges: a lint csak az arbitrary értéket
tiltja, a Tailwind-alapfokokat nem.

### 🟡 Biztonság

A 2026-07-22-i audit alapos volt, és a leletei javítva vannak (random
tokenek, timing-safe cron-secret, meghívó email-egyezés, biztonsági
fejlécek). Két nyitott tétel:

1. **A CSP report-only, de nincs report-uri/report-to direktíva**
   (`next.config.ts:13-26`). A fejléc-komment azt mondja, „a böngésző jelenti
   a sértéseket (console + report-to)" — a `report-to` valójában nincs
   beállítva. Így a sértések csak a látogató konzoljára kerülnek: az
   „élesben figyeljük, aztán enforce-ra váltunk" terv **nem hajtható végre**.
   Ráadásul a P0-6 miatt az enforce ma eltörné a bejelentkezést.
2. **Az audit óta 39 új route keletkezett** (~80 → 119): a hírlevél-, CRM-,
   quote-, analitika-, trust- és peer-feedback végpontok nagy része az
   akkori hatókörön kívül esett. Egy szűkített, csak az új route-okra
   fókuszáló kör indokolt.

### 🟠 Tanácsadói üzemeltetés (a legnagyobb termék-hiány)

A pilot kerete 15–20 csapat, **200–500 egyéni kitöltő**. Ehhez képest:

- **Nincs tömeges meghívás.** Sem az org (`/api/org/[id]/invite`), sem a
  csapat (`/api/team/[id]/invite`) végpont sémája nem fogad többes címet:
  `z.object({ email: z.string().email() })`. Nincs CSV-import, nincs
  vesszővel elválasztott lista, nincs beillesztős tömeges űrlap. 500 fő
  egyesével, kézzel, űrlapon át — ez a pilot legdrágább, teljesen
  automatizálható munkaórája.
- **Az emlékeztető kézi.** A playbook T+3 és T+10 napos emlékeztetőt ír elő;
  a `/api/org/[id]/campaigns/[campaignId]/remind` végpont működik, de csak
  gombnyomásra. Nincs ütemezett nudge. (A `release-steps` cron csak a
  lépés-nyitást fedi.)
- **Nincs GDPR adatexport-eszköz.** A tájékoztató ígéri az adathordozhatóságot
  (`privacy-policy.ts:955`), de nincs sem self-serve export, sem szkript —
  egy kérés teljesítése ad-hoc lekérdezést jelentene. (Jogilag a kézi
  teljesítés elfogadható, de dokumentált eljárás kell hozzá.)

### 🟠 API-dokumentáció

`docs/api/openapi.yaml` 82 útvonalat ír le, a kódban 119 van. **38 route
hiányzik** (32%), köztük az egész hírlevél- és CRM-felület, az analitika
(`/api/e`), a `/peer-feedback/submit` és a pilot-kritikus
`/team/{id}/report/actions`.

### 🟢 Teljesítmény

A `perf-stress-test-2026-07-31` mérése szerint a `fra1` régióváltás után az
authentikált nézetek **128–180 ms** mediánon vannak (Budapestről, teljes
SSR-rel). Egyetlen nyitott tétel a Neon autosuspend miatti **1713 ms-os
hidegindítás** — ritkán látogatott pilot-appnál ez minden munkamenet elején
jelentkezik, és ma ez a legnagyobb egyedi tétel.

---

## 4. Doksi-drift — a `CLAUDE.md` és a tervek elszakadtak a kódtól

Ezek nem kozmetikai hibák: a `CLAUDE.md` az elsődleges kontextus minden
jövőbeli munkához, és ma több ponton félrevezet.

| Állítás | Valóság |
|---|---|
| „Lint: ~60 örökölt hiba van" | 0 hiba |
| „a Prisma sémában a Subscription/**Purchase/BillingEventLog** modellek megmaradtak" | csak a `Subscription` van meg; `Purchase` és `BillingEventLog` nincs a sémában |
| Hiring/candidate flow „2026-07-23-tól ÚJRA AKTÍV (nem fagyasztott)" | `PORTFOLIO_SURFACE_STATE.hiring = "parked"` — az egész felület 404/redirect |
| Route-térkép: `/pricing` (tanácsadói ajánlat) publikus felület | `next.config.ts` **permanens (308) átirányítás** `/how-we-work`-re; a `(marketing)/pricing/page.tsx` halott kód |
| Route-térkép: `/patterns` publikus | `patternExplorer = "parked"` |
| Fejléc-nav admin: „…**Jelöltek**…" | a hiring nav-belépő a parkolás miatt nem épül fel |
| Admin tabok: „Áttekintés/Kutatás/Emlékeztetők/Szervezetek" (4) | 9 tab: Vezérlő, Analitika, CRM, Kérdések, Szervezetek, Tanácsadók, Blog, Rendszer, Visszajelzések, Emlékeztetők |
| „A teljes env-lista: `.env.example`" | a fájl nincs a repóban (P0-4) |

Ugyanez a `docs/product/portfolio-parking-2026-08.md`-ben: a táblázat a blogot
**parkoltként** sorolja fel, a kódban `active`.

És egy tartalmi ütközés: a `CLAUDE.md` copy-policy szerint user-facing
szövegben a „HEXACO" márkanévként tilos, a TRITAN pedig kivezetett. A
felületen ez tartható is (`src/lib/i18n/results.ts`-ben csak az
irodalom-hivatkozásban szerepel) — **a blogon viszont nem**:
`content/blog/tritan-vs-mbti.mdx` slugja a kivezetett brandet viszi a
publikus URL-be, a címe pedig „HEXACO vagy MBTI – miért számít a különbség?".
Vagy a policy kap egy kimondott blog-kivételt, vagy a két cikk slugot és
címet cserél (a slug-csere 301-et igényel).

---

## 5. Javítandók listája

### P0 — indulási blokkoló

| # | Tétel | Hol | Méret |
|---|---|---|---|
| 1 | Valós cégadatok + `LEGAL_DOCS_ARE_DRAFT = false` | `src/lib/legal/company.ts` | üzleti döntés + S |
| 2 | ÁSZF / felhasználási feltételek oldal; DPA-sablon | új `(marketing)/terms` | jogi + M |
| 3 | Hibakövető + riasztás bekötése | `app/error.tsx`, `logger.server.ts` | M |
| 4 | `.env.example` a repóba (gitignore-kivétel + tartalom) | `.gitignore`, gyökér | S |
| 5 | Upstash env élesben, vagy `contact`/`api` tier fail-closed | ops + `lib/rate-limit.ts` | S |
| 6 | Clerk preconnect + CSP host env-vezéreltté tétele | `next.config.ts:13-26, 151-153` | S |
| 7 | CI: `checks` job (`pnpm check` + `pnpm build`), kötelező status check | `.github/workflows/tests.yml` | S |
| 8 | A piros kliens-teszt szövegének frissítése | `tests/client/results/pair-dimension-band.test.tsx:91` | XS |

### P1 — a kész featureök minőségi hibái

| # | Tétel | Hol | Méret |
|---|---|---|---|
| 9 | 8 bedrótozott magyar szöveg i18n-kulcsra | `components/layout/nav-header-ui.tsx` | S |
| 10 | Tömeges meghívás (több cím / CSV) org- és csapat-szinten | `api/org/[id]/invite`, `api/team/[id]/invite` + űrlapok | M |
| 11 | Integrációs teszt a trust / pulse / riport-publish / action útvonalra | `tests/integration/team/` | M |
| 12 | `test:pilot` kapu átszabása a valódi Scan v1 láncra | `scripts/run-pilot-gate.mjs` | S |
| 13 | `critical-ia-smoke` teszt szétbontása vagy `test.slow()` | `tests/e2e/navigation/critical-ia-smoke.test.ts:262` | S |
| 14 | CSP `report-to` + gyűjtő végpont, utána enforce (a P0-6 után!) | `next.config.ts` | M |
| 15 | Biztonsági kör az audit óta keletkezett 39 route-ra | — | M |
| 16 | `openapi.yaml` felzárkóztatása (38 hiányzó route) | `docs/api/openapi.yaml` | M |
| 17 | `CLAUDE.md` + `portfolio-parking-2026-08.md` szinkron a kóddal | 4. fejezet táblázata | S |
| 18 | Blog: TRITAN-slug és HEXACO-cím döntés (kivétel vagy csere+301) | `content/blog/tritan-vs-mbti*.mdx` | S |

### P2 — higiénia és technikai adósság

| # | Tétel | Hol |
|---|---|---|
| 19 | `README.md` még a `create-next-app` boilerplate | gyökér |
| 20 | Halott `/pricing` oldal törlése (a `PricingContent` marad) | `(marketing)/pricing/page.tsx` |
| 21 | 213 db `text-lg/xl/2xl…` a 9 szerep-utility helyett, ügyfél-felületen | `src/` |
| 22 | Repo-szemét: `trita-landing-redesign-v13.html` (40 kB), `audit-reports/*.json` | gyökér |
| 23 | Nincs automatizált a11y-ellenőrzés (csak fókusz-teszt; nincs axe/WCAG) | `tests/e2e/accessibility/` |
| 24 | `/api/newsletter/*` felvétele a `blog` parkolási prefixek közé | `lib/portfolio-parking.ts:76` |
| 25 | GDPR adatexport-szkript vagy dokumentált eljárás | `scripts/` |
| 26 | Ütemezett emlékeztető (T+3 / T+10) a kézi remind mellé | `api/cron/` |
| 27 | Neon hidegindítás (1713 ms) — melegen tartás | ops |
| 28 | `sitemap.ts` `CONTENT_REVIEWED_AT` = 2026-08-06, azóta változott a marketing-tartalom | `src/app/sitemap.ts:16` |

---

## 6. Amit szándékosan NEM javasolok

- **Ne induljon újabb motor-audit kör.** A `motor-known-residuals.md`
  konvergencia-szabálya teljesült; ami maradt (nem-normált POMP, kalibrálatlan
  küszöbök), azt csak pilot-adat oldja fel. Újabb vak kör ugyanazt találná meg.
- **Ne bővüljön a pilot-scope.** A parkolás (career, hiring, fakedoor,
  patterns) helyes döntés volt; a P1-10 (tömeges meghívás) hiánya sokkal
  többe kerül, mint bármelyik parkolt modul visszaállítása.
- **Ne nyúljunk a paywall/billing réteghez.** A `billing-v1-parked` tag és a
  kapcsolók (`SELF_PAYWALL_ENABLED`, `CANDIDATE_GATING_ENABLED`) tisztán
  visszakapcsolhatók; a jelenlegi „minden ki van kapcsolva" állapot
  konzisztens és tesztelt.

---

## 7. Javasolt sorrend

1. **Egy nap kód** — P0-4, P0-5, P0-6, P0-7, P0-8 (env, rate limit, Clerk
   host, CI, piros teszt). Ezek után a „zöld CI" újra jelzés lesz.
2. **Egy nap kód** — P0-3 (hibakövetés) + P1-9 (i18n) + P1-13 (flaky e2e).
3. **Párhuzamosan, üzleti sávon** — P0-1 és P0-2 (cégadatok, ÁSZF, DPA). Ez a
   kritikus út: kód nélkül nem halad.
4. **Pilot előtti utolsó kör** — P1-10 (tömeges meghívás) és P1-11/12
   (a Scan v1 lánc végponti tesztelése). Ez a kettő dönti el, hogy az első
   két partnernél a mérés operatívan is működik-e.
