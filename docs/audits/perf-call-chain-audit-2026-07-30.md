# Teljesítmény-audit: hívási láncok, nézetenkénti statisztika

> 2026-07-30 · **futásidejű mérés** + statikus call-graph elemzés
>
> Mérés: `pnpm perf:pages` ([scripts/measure-page-queries.mjs](codebase/scripts/measure-page-queries.mjs))
> — Prisma `$extends` query-számláló (`DB_METRICS=1`), kérésenként korrelálva
> az `x-request-id`-vel. Éles DB, `next dev`, org-admin + csapattag persona
> (`horizont-anna`), 1 bemelegítő + 1 mérő kör.
>
> **Caveat:** a query-DARABSZÁM prod-ban ugyanennyi (az érintett route-ok
> `force-dynamic`-ok, nincs mit cache-elni), a `DB ms` viszont dev-gépről,
> Neonra mért latenciát tartalmaz — abszolút értékben prod-ban (azonos
> régióban) kisebb lesz, az arányok maradnak.

---

## 1. A legfontosabb megállapítás

**Nincs semmilyen request-szintű memoizáció.** A kódbázisban `React.cache()`
és `unstable_cache()` **nulla** előfordulás. Minden szerver-komponens és minden
helper külön DB-kört indít ugyanarra az adatra.

Következmény: a `userProfile.findUnique({ where: { clerkId } })` mintázat
**137 helyen** szerepel, ebből **118 a `src/app/` alatt**. Egy átlagos oldal-
render 3–6× kérdezi le ugyanazt a profilsort.

Ehhez jön: `connection_limit=3` a poolban ([src/lib/prisma.ts:9](codebase/src/lib/prisma.ts:9)),
tehát ~40–90 query/render mellett a lekérdezések hármasával sorosodnak.
Ez a két tény együtt magyarázza a lassulást, nem az API-hívások száma.

---

## 2. Layout-alapdíj — MINDEN belépett oldalon lefut

`(app)/layout.tsx` → `resolveWorkspaceNavContext()`
([src/lib/navigation/nav-context.server.ts](codebase/src/lib/navigation/nav-context.server.ts))

| Hullám | Mi fut | Query |
|---|---|---|
| W1 | `userProfile.findUnique` | 1 |
| W2 | `Promise.all`: **`resolveJourney`** + notification.count + campaignParticipant.findMany + observerInvitation.count | 3 + journey |
| W2/journey | `resolveJourneyContext` — 5–6 egymás utáni hullám | 24–26 |
| W3 | `getActiveOrgMembership` — **másodszor** (a journey már lefuttatta) | 2–3 |
| W4 | `Promise.all`: organization.findUnique + getAccessibleTeamIds + campaign.count + resolveOrgPolicySnapshot | 4–5 |
| W5 | `team.findMany` | 1 |

**Mérve: 36 query minden belépett oldalon** (org-admin + csapattag persona),
~9–11 soros körfordulás-hullámban. Ez az az alapdíj, ami alá egyetlen
belépett nézet sem tud menni — a `/profile` és a `/tasks` pontosan ennyi.

A `resolveJourneyContext` belső bontása
([src/lib/journey/context.ts:105](codebase/src/lib/journey/context.ts:105)):

| Blokk | Query | Megjegyzés |
|---|---|---|
| fő `Promise.all` (9 ág) | 10–11 | egyik ág maga is 2–3 query (`getActiveOrgMembership`) |
| pending invite `Promise.all` | 4 | csak ha van email (mindig van) |
| teamMembership feloldás | 2–3 | `userProfile.findUnique` **újra** (activeTeamId) |
| team completionSummary | 3 | `teamMember.findMany` → `assessmentResult.findMany` |
| org completionSummary | 5 | `organizationMember.findMany` → `assessmentResult.findMany` |

A `completionSummary` (8 query) a nav-fejlécnek **nem kell** — csak
`journey.destination` + `experienceHints` használódik a layoutban.

---

> **ÁLLAPOT 2026-07-30 este: a javítások MEGVANNAK és meg vannak mérve.**
> Az alábbi 3–4. fejezet a KIINDULÓ állapotot rögzíti, a 8. fejezet az
> elvégzett munkát és az eredményt. Rövid összegzés:
> **961 → 637 query (−34 %)**, a kérésen belüli duplikátumok **281 → 4 (−99 %)**.

## 3. Nézetenkénti statisztika — KIINDULÓ MÉRÉS

Egy oldal-render alatt kiment DB-query. A „duplikátum" ugyanaz a
`model.operation` **ugyanazokkal az argumentumokkal**, ugyanabban a kérésben —
tehát pontosan az, amit a request-szintű memoizáció megszüntetne.

| Nézet | Query | Ebből duplikátum | DB ms (kumulált) | Wall ms |
|---|---:|---:|---:|---:|
| `/team/[id]?tab=members` | **84** | 30 (36 %) | 4221 | 1703 |
| `/team/[id]?tab=overview` | 82 | 30 (37 %) | 3964 | 1501 |
| `/team/[id]?tab=report` | 82 | 30 (37 %) | 4311 | 1758 |
| `/org/[id]` (cockpit) | **80** | 32 (40 %) | 3886 | 1155 |
| `/org/[id]?tab=campaigns` | 80 | 32 (40 %) | 3974 | 1186 |
| `/org/[id]?tab=members` | 80 | 32 (40 %) | 4066 | 1186 |
| `/team/[id]?tab=intelligence` | 73 | 28 (38 %) | 3555 | 1069 |
| `/dashboard` (csak dispatcher!) | **64** | 28 (44 %) | 3291 | 865 |
| `/team` | 40 | 4 | 1979 | 717 |
| `/org` | 40 | 6 | 1868 | 693 |
| `/org/[id]/settings` | 40 | 5 | 2294 | 750 |
| `/profile/results` | 36 | 4 | 1602 | 692 |
| `/profile` | 36 | 4 | 1589 | 677 |
| `/tasks` | 36 | 4 | 1592 | 713 |
| `/manager` | 36 | 4 | 1765 | 742 |
| `/assessment` | 36 | 4 | 1868 | 731 |
| `GET /api/nav/context` | 36 | 4 | 1739 | 675 |
| **Összesen (17 nézet)** | **961** | **281 (29 %)** | | |

Amit ez megmutat:

- **Nincs 36 query alatti belépett oldal.** A `/profile` gyakorlatilag statikus,
  mégis 36 query — ez tisztán a layout-alapdíj. A mért 36 magasabb, mint a
  statikus becslés (~33–38 sáv teteje), mert a `getActiveOrgMembership`
  fallback-ága és a policy-snapshot `Subscription` lekérése is beleszámít.
- **A `/dashboard` 64 query — és nem is renderel semmit**, csak eldönti, hova
  irányítson. Ez a belépés utáni első kérés, tehát a legfeltűnőbb késleltetés.
- **A duplikáció 29 %**, a nehéz nézeteken **36–44 %**. Ez a `React.cache`
  egyszeri bevezetésével eltűnik, viselkedés-változás nélkül.
- A `wall ms` jóval kisebb, mint a kumulált `DB ms` (pl. 84 query / 4221 ms DB
  / 1703 ms wall) — vagyis a `Promise.all`-ok dolgoznak. **De** a
  `connection_limit=3` miatt a párhuzamosság 3-ban megáll: 84 query átlag
  50 ms-mal, hármasával = ~1,4 s alsó korlát. Ez a mért 1,7 s.

### A legdrágább nézet bontása — `/team/[id]?tab=members`, 84 query

```
UserProfile.findUnique        ×11   ← ebből 3 bitre azonos
ObserverInvitation.count      ×5
TeamPendingInvite.count       ×4
OrganizationPendingInvite.count ×4
TeamMember.findMany           ×4    ← ebből 3 azonos
AssessmentResult.findMany     ×4
Subscription.findUnique       ×4    ← MIND A 4 AZONOS (policy-snapshot)
ObserverInvitation.findMany   ×4
CampaignParticipant.findMany  ×3
OrganizationMember.findFirst  ×3    ← MIND A 3 AZONOS
OrganizationMember.findMany   ×3
Campaign.count                ×3    ← MIND A 3 AZONOS
```

`UserProfile.findUnique` **11×** egy kérésben. `Subscription.findUnique`
4× ugyanazzal az argumentummal — a `resolveOrgPolicySnapshot` négyszer fut le
(layout nav, journey, team-policy, org-policy).

### Client-oldali hívások

| Nézet | Mount-időben induló fetch |
|---|---|
| minden belépett oldal | `/api/profile/locale`, `/api/org/context` |
| `/profile/results` | + `/api/dashboard/status` **30 s-os pollban** |
| marketing oldalak (belépve) | `/api/nav/context` → **szerveren 36 query** |
| `/assessment` | + `/api/assessment/draft` |
| harang (mindenhol) | `/api/notifications/unread-count` 60 s-ban |

> Megjegyzés a méréshez: a `/api/dashboard/status` és `/api/org/context`
> 401-et adott, a `/api/notifications/unread-count` és `/api/profile/locale`
> pedig 0 query-vel tért vissza — ezek a route-ok **közvetlenül a Clerk
> `auth()`-ját hívják**, nem a `getServerAuth()`-ot, így az E2E-bypass nem
> vonatkozik rájuk. Ez önmagában is javítandó: e2e-ből ma nem tesztelhetők.
> A `/api/nav/context` viszont `getServerAuth()`-ot használ, ezért mérhető volt
> — és 36 query-t költ.

### A két legdrágább nézet lánca

**`/team/[id]`** ([src/app/(app)/team/[id]/page.tsx](codebase/src/app/(app)/team/[id]/page.tsx))
— ~18 *egymás utáni* `await`, alig van `Promise.all`:

```
userProfile.findUnique (104)
  → resolveJourneyFallbackForProfileId (108)   ← TELJES journey engine, ~26 query
  → team.findUnique (110)
  → organizationMember.findUnique (116)
  → releaseDueCampaignSteps (127)
  → campaignParticipant.findMany (129)
  → hasStartedStep (180) — ciklusban
  → observerInvitation.findMany ×2 (204, 234)
  → teamMember.findUnique (273)
  → userProfile (278) → teamMember.findMany (284)
  → canAccessTeam (294)
  → getLatestPublishedReport (307)
  → canManageTeam (315)
  → resolveTeamPolicySnapshot (319)
  → getTeamPageData (382)   ← teljes aggregáció: trust-network, minden tag
                              assessment-eredménye, kampány, pending invite
```

Két külön probléma:
1. A **journey engine kétszer fut le** ugyanabban a requestben (layout + a 108. sor).
2. A `getTeamPageData` **mind a 7 fülre** lefut, pedig a `members` és `feedback`
   fülnek nem kell trust-network és observer-aggregáció.

**`/org/[id]`** ugyanez kisebben: `requireOrgContext` (2 query) + eager
`resolveJourneyFallbackForProfileId` a 67. sorban (~26 query) + `getOrgPageData`
(soros lánc: campaign.findMany → count-hármas → assessmentResult.findMany →
observerInvitation.findMany).

---

## 4. Egyszerűsítési javaslatok — hatás/ráfordítás sorrendben

### R1. Request-szintű memoizáció (`React.cache`) — **a legnagyobb nyereség**

Zéró viselkedésváltozás; a Next App Routerben a layout, a page és a
`generateMetadata` **ugyanaz a request**, tehát dedupálódnak.

Amit be kell csomagolni:

```ts
// src/lib/auth-server.ts
export const getServerAuth = cache(async (): Promise<ServerAuthResult> => { … });

// új: src/lib/profile.server.ts
export const getProfileByClerkId = cache((clerkId: string) => prisma.userProfile.findUnique(…));
export const getProfileById      = cache((id: string) => prisma.userProfile.findUnique(…));

// src/lib/org-context.ts
export const getActiveOrgMembership = cache(async (profileId: string) => { … });

// src/lib/journey/context.ts
export const resolveJourneyContext = cache(async (profileId, options) => { … });

// src/lib/policy-service.ts
export const resolveOrgPolicySnapshot = cache(…);
```

Figyelem: a `cache()` a **paraméterre** memoizál, tehát az `options` objektumot
literálként átadó hívások nem találnak be — a journey-nél kulcsold ki
(`profileId + orgId + teamId`) egy belső, primitív-paraméteres `cache`-elt függvénnyel.

**Mért hatás-felső korlát:** a duplikátumok pontosan ezek a hívások, tehát
`/team/[id]?tab=members` **84 → 54 query**, `/org/[id]` **80 → 48**,
`/dashboard` **64 → 36**, app-szinten **−29 %**. Viselkedés-változás nincs.

A mérésből kiderült konkrét csúcstartók:
`Subscription.findUnique` **4× bitre azonos argumentummal** (a
`resolveOrgPolicySnapshot` négyszer fut: layout-nav, journey, team-policy,
org-policy) — ezt egyetlen `cache()` megszünteti.

### R2. Az eager `resolveJourneyFallbackForProfileId` kivezetése

[team/[id]/page.tsx:108](codebase/src/app/(app)/team/[id]/page.tsx:108) és
[org/[id]/page.tsx:67](codebase/src/app/(app)/org/[id]/page.tsx:67) **feltétel
nélkül** kiszámolja a fallback URL-t, ami csak `redirect()` ágakban kell.
A többi 4 hívóhely már helyesen, ágon belül csinálja.

Javítás: mozgasd az `await`-et a redirect-ágakba, vagy vezess be egy
`resolveJourneyFallbackLazy()` thunkot. **~26 query/render megtakarítás
a két legdrágább nézeten** (R1-gyel átfedésben, de R1 nélkül is önállóan hat).

### R3. „Lite" journey a nav-fejléchez

A layoutnak `destination` + `experienceHints` kell, nem a `completionSummary`.
Vezess be `resolveJourneyDestination(profileId)`-t, ami kihagyja a team/org
completion-blokkot (8 query) — vagy tedd lusta getterré a `completionSummary`-t.

Ugyanitt: a `teamMember.findMany({select:{userId}})` + `assessmentResult.findMany({distinct})`
páros helyett **egy** `groupBy`/`_count` vagy egy CTE-s raw query.

### R4. `/team/[id]` waterfall → 3 hullám + fül-szerinti lazy load

- A 104–290 sorok közti 12 független `await` `Promise.all`-ba vonható
  (a `team`, `organizationMember`, `campaignParticipant`, `observerInvitation`,
  `teamMember` lekérések nem függenek egymástól).
- `getTeamPageData` bontása: `getTeamCore()` (minden fülnek) +
  `getTeamIntelligence()` (csak `intelligence`/`profile`/`report` fülnek) +
  `getTrustNetwork()` (csak `intelligence`). A `members`/`feedback`/`overview`
  fül így a nehéz aggregációt átugorja.

### R5. Kliens-oldali felesleges hívások

| Hívás | Hol | Probléma | Javítás |
|---|---|---|---|
| `/api/profile/locale` | [LocaleProvider.tsx:91](codebase/src/components/LocaleProvider.tsx:91) | **minden** oldal-mountkor lefut, pedig a szerver `getServerLocale()`-lel már feloldotta | add propként a layoutból, a fetch törölhető |
| `/api/org/context` | [nav-header-ui.tsx:207](codebase/src/components/layout/nav-header-ui.tsx:207) | mountkor tölti az org-váltó listáját, amit a user ritkán nyit meg | szerver-prop, vagy fetch a dropdown megnyitásakor |
| `/api/nav/context` | [MarketingHeader.tsx:40](codebase/src/components/layout/MarketingHeader.tsx:40) | `cache-control: no-cache`, és szerveren a **teljes ~35 query-s** nav-kontextust újraépíti minden marketing-oldalon | R1+R3 után olcsóbb; érdemes rövid `s-maxage`-et adni neki |
| `/api/dashboard/status` | [DashboardAutoRefresh.tsx:30](codebase/src/components/dashboard/DashboardAutoRefresh.tsx:30) | 30 s poll, és változáskor `router.refresh()` = **teljes layout+page újrarender (~61 query)** | lásd R7 |

### R6. Pool és driver

`connection_limit=3` mellett a ~60–95 query/render hármasával sorosodik.
Két lépés:
1. Neon **pooled** endpoint (`-pooler` host) + magasabb `connection_limit`.
2. Közép-távon `@prisma/adapter-neon` (HTTP driver) — megszünteti a pool-
   torlódást és a Neon auto-suspend/`connect_timeout` gondot is
   (ez már nyitott tétel a projekt-memóriában).

Fontos sorrend: **előbb R1–R4** (query-szám), utána driver. HTTP driverrel
minden query egy külön HTTP-kör, tehát a darabszám még fontosabb lesz.

---

## 5. Notification-réteg — solution architect nézet

### Mi van most

[NotificationsProvider.tsx](codebase/src/components/layout/NotificationsProvider.tsx):
60 s poll a `/api/notifications/unread-count`-ra, **csak látható fülön**,
in-flight dedup, a kezdő count szerver-renderből jön, a lista panel-nyitáskor
töltődik 20 s staleness-szel, mutációk optimisták.

Az endpoint egyetlen indexelt `count` — relation-filterrel, külön profil-lookup nélkül.

**Ez már jó tervezés.** A poll nem a szűk keresztmetszet.

### Kell-e WebSocket?

**Nem — most nem.** Három ok:

1. **Költség-arány.** Egy poll = 1 indexelt count query. Egy oldal-navigáció =
   60–95 query. A felhasználó egy óra alatt 60-szor pollozik, de közben
   10–30-szor navigál is. A poll a teljes DB-terhelés **kb. 2–5 %-a.**
   A WebSocket bevezetése a probléma 5 %-át oldaná meg.
2. **Deployment.** Vercel serverless (`vercel.json` cron) — nincs natív WS-szerver.
   Managed pub/sub kellene (Pusher / Ably / Supabase Realtime): új szállító,
   új havidíj, új hibamód, új auth-integráció.
3. **Esemény-ráta.** A `NotificationType` enum eseményei emberi akciókból
   származnak (observer beadás, meghívó elfogadás, kampány-lépés, inquiry) —
   napi 0–10 user-enként. Sub-szekundumos latencia egy naponta párszor
   előforduló eseményre: rossz ROI.

### Amit helyette érdemes (növekvő ráfordítás szerint)

1. **Adaptív backoff.** 60 s → 120 s → 300 s N változatlan poll után; reset
   `visibilitychange`-re, `focus`-ra és bármely saját mutációra. Az idle fülek
   poll-forgalma ~4-szeresére csökken. ~15 sor a meglévő providerben.
2. **Navigáció-piggyback.** A layout `force-dynamic`, tehát minden navigáció
   már **friss count-tal** tér vissza. Ha a provider `initialCount`-ot kap egy
   navigációval, halaszd el a következő pollt egy teljes periódussal. Aktívan
   kattintgató user így gyakorlatilag nem pollozik.
3. **`BroadcastChannel` leader-election.** 3 nyitott fül ma 3× pollozik.
   Egy fül pollozzon, a többinek broadcastolja a countot. ~30 sor.
4. **`DashboardAutoRefresh` nyugdíjazása.** A 30 s-os poll ugyanazt az eseményt
   figyeli (`OBSERVER_COMPLETED`), amire **már születik notification**.
   Vagy töröld, vagy vidd 120 s-ra — és `router.refresh()` helyett frissítsd
   csak az érintett szekciót. Ez ma a legdrágább kliens-oldali ciklus:
   egy `router.refresh()` a `/profile/results`-on **mért 36 query**.
5. **Ha később tényleg kell real-time: SSE, nem WebSocket.** Egyirányú
   adatfolyam elég, az `EventSource` beépítetten újracsatlakozik, proxykon
   átmegy. Trigger-pont: [src/lib/notifications/orchestrator.ts](codebase/src/lib/notifications/orchestrator.ts)
   — egy choke point, itt kell publikálni.
   **De:** Vercelen minden nyitott SSE-stream leköt egy függvény-példányt
   (max futásidő-limit → kényszerű reconnect-ciklus), ami drágább lehet, mint
   a mostani poll. Az SSE akkor éri meg, ha közben hosszú-életű hosztra
   (Fly / Railway / konténer) vagy managed pub/sub-ra mentek.

### Döntési küszöb

Váltás real-time-ra akkor indokolt, ha teljesül valamelyik:
- egy user átlagosan **>1 notification/óra** kap (ma nagyságrendekkel kevesebb), vagy
- megjelenik olyan funkció, ahol a késleltetés **termék-követelmény**
  (élő kampány-kitöltöttség tanácsadói nézetben, jelenlét-jelzés, chat), vagy
- a poll-forgalom mérhetően a DB-terhelés **>20 %-a** lesz.

---

## 6. Javasolt sorrend

| # | Tétel | Ráfordítás | Mért/becsült hatás |
|---|---|---|---|
| 1 | R2 — eager journey-fallback kivezetése (2 fájl) | ~30 perc | −20…26 query a 2 legdrágább nézeten |
| 2 | R1 — `React.cache` a 6 hot helperre | fél nap | **−29 % app-szerte, −36…44 % a nehéz nézeteken (mért)** |
| 3 | R5 — `/api/profile/locale` + `/api/org/context` mount-fetch törlése | ~2 óra | −2 API-hívás minden navigációnál |
| 4 | Notif 1+2+4 — backoff, piggyback, DashboardAutoRefresh | ~3 óra | −70 % háttér-forgalom |
| 5 | R4 — `/team/[id]` waterfall + fül-szintű lazy load | 1 nap | 84 → ~35 query a `members`/`feedback` fülön |
| 6 | R3 — lite journey a navnak | fél nap | −8 query minden oldalon |
| 7 | R6 — pooled endpoint / Neon adapter | fél nap | a `connection_limit=3` sorosítás feloldása |

Célszám: **belépett oldal alapdíja 36 → 12 query alá**, a `/dashboard`
dispatcher 64 → 15 alá, a `/team/[id]` 84 → 40 alá.

## 7. Mérő-eszköz — hogyan reprodukálható

```bash
pnpm perf:pages
```

Mit csinál ([scripts/measure-page-queries.mjs](codebase/scripts/measure-page-queries.mjs)):
felderít egy org-admin + csapattag personát, indít egy `next dev`-et
`DB_METRICS=1` + `TRITA_E2E_AUTH_BYPASS=1` mellett, végigjárja a mért
nézeteket saját `x-request-id`-vel, és a szerver `db.request_summary`
logsoraiból nézetenkénti táblát ír.

Kapcsolók:

| Kapcsoló | Mire |
|---|---|
| `--db=test` | `TEST_DATABASE_URL`-re vált (éles adat érintése nélkül) |
| `--user=<clerkId> --org=<id> --team=<id>` | kézi persona-választás |
| `--list-users` | választható userek listája |
| `--attach=3000` | már futó, `DB_METRICS=1`-es dev szerverhez csatlakozik |
| `--port=3210` | másik port (ha 3000 foglalt) |
| `--json=out.json` | nyers adat kiírása |
| `--verbose` | a dev szerver logja is látszik |

A számláló maga: [src/lib/db-metrics.ts](codebase/src/lib/db-metrics.ts) —
Prisma `$extends` `$allOperations` hook, `x-request-id` alapján bucketel,
az utolsó query után 400 ms csenddel kiír egy `db.request_summary` sort
(query-szám, duplikátumok, DB-idő, top operációk, duplikált signature-ök).
**`DB_METRICS=1` nélkül az extension rá sem kerül a kliensre** — nulla
futásidejű költség, prod-ban alapból kikapcsolt.

Így minden javítás előtt/után újramérhető, és a fenti tábla frissíthető.

### Két buktató, amibe a mérés belefutott (hogy legközelebb ne kelljen újra)

1. **Clerk dev-handshake.** `accept: text/html` fejléccel a Clerk dev-instance
   dokumentum-kérésnek látja a kérést, és a hiányzó dev-browser süti miatt a
   handshake endpointra irányít — a render el sem indul. `accept: */*`-gal
   a proxy lefut és az E2E-bypass érvényesül.
2. **Árva `next dev`.** A `pnpm dev` gyerekfolyamatai túlélik a szülő
   SIGTERM-jét, és `.next/dev/lock`-ot fogva a következő mérés csendben a
   RÉGI szerverhez beszél. A szkript ezért saját process-groupban indít, és
   a mérés előtt ellenőrzi, hogy a port szabad-e.

---

## 8. VÉGREHAJTÁS — mit csináltunk és mit nyertünk (2026-07-30)

### 8.1 Eredmény

Ugyanaz a mérés (`pnpm perf:pages`), ugyanaz a persona, ugyanaz az éles DB:

| Nézet | Előtte | Utána | Δ |
|---|---:|---:|---:|
| `/team/[id]?tab=members` | 84 | **49** | −42 % |
| `/team/[id]?tab=overview` | 82 | **47** | −43 % |
| `/team/[id]?tab=report` | 82 | **47** | −43 % |
| `/team/[id]?tab=intelligence` | 73 | **41** | −44 % |
| `/org/[id]` (cockpit) | 80 | **44** | −45 % |
| `/org/[id]?tab=campaigns` | 80 | **44** | −45 % |
| `/org/[id]?tab=members` | 80 | **44** | −45 % |
| **`/dashboard`** (dispatcher) | 64 | **32** | **−50 %** |
| `/org` | 40 | 32 | −20 % |
| `/org/[id]/settings` | 40 | 33 | −17 % |
| `/team` | 40 | 34 | −15 % |
| `/profile`, `/profile/results`, `/tasks`, `/manager`, `/assessment` | 36 | **31** | −14 % |
| `GET /api/nav/context` | 36 | 35 | −3 % |
| **Összesen (17 nézet)** | **961** | **637** | **−34 %** |
| **Kérésen belüli duplikátum** | **281** | **4** | **−99 %** |

Fal-idő (dev gépről, éles Neonra — zajos, de az irány egyértelmű):
`/team/[id]?tab=members` 1703 → ~1050 ms, `/dashboard` 865 → ~560 ms,
`/org/[id]` 1155 → ~800 ms.

A maradék 4 duplikátum mind a `/api/nav/context` **route handlerben** van —
ott a React `cache()` elvi okból nem működik (ld. 8.4).

### 8.2 Mi történt, tételesen

**A. Kérés-szintű memoizáció (`React.cache`) — a fő nyereség**

| Hol | Mit |
|---|---|
| `src/lib/profile.server.ts` (ÚJ) | `getProfileCoreById` / `getProfileCoreByClerkId` — közös, bővebb select. A `userProfile.findUnique` a team-oldalon **11× → 3×** |
| `src/lib/subscription.ts` | `getOrgSubscription` — volt 4× bitre azonos hívás/render |
| `src/lib/org-context.ts` | `getActiveOrgMembership` — a journey és a nav is hívta |
| `src/lib/team-auth.ts` (ÚJ függvény) | `getTeamMembershipRole` — a `canAccessTeam`, `canManageTeam` és `resolveTeamPolicySnapshot` **három külön köre** egyre esett |
| `src/lib/journey/context.ts` | `resolveJourneyContext` primitív kulcsokra bontva (a `cache()` objektum-argumentumra referencia szerint kulcsol, tehát objektummal nem dedupál) |
| `src/lib/journey/guardrails.server.ts` | `resolveStaffDestination` |
| `src/lib/team-auth.ts` | `getAccessibleTeamIds`, `getManageableTeamIds` |
| `src/lib/org-counts.server.ts` (ÚJ) | `getOrgTeamCount` / `getOrgPendingInviteCount` / `getOrgActiveCampaignCount` — a journey és az `org-stats` ugyanazokat a count-okat számolta külön |

**B. Eager munka kivezetése**

- `team/[id]/page.tsx:111` és `org/[id]/page.tsx:69` — a
  `resolveJourneyFallbackForProfileId` (a TELJES journey-motor, ~25 query)
  feltétel nélkül futott, pedig csak a redirect-ágakban kell. Most lusta.
  **A kapu-logika NEM változott**, csak a fallback-URL kiszámításának
  időzítése.

**C. Lekérdezés-alak javítása**

- `journey/context.ts` completionSummary: a `teamMember.findMany` +
  `assessmentResult.findMany({ distinct })` páros (2 kör, két teljes
  sorhalmaz, csak azért, hogy két számot kapjunk) helyett **relation-filteres
  count-ok**, egy hullámban. Csapat- és org-blokkban egyaránt. A szűrő-halmaz
  (pl. `leftAt: null`) mindkét számban azonos maradt, tehát a „kész arány"
  jelentése változatlan.

**D. `/team/[id]` waterfall → egy hullám**

Négy egymást váró `await` (aktív csapat kijelölése, a néző csapatai,
publikált riport, policy-pillanatkép) egy `Promise.all`-ba került —
**a hozzáférés-ellenőrzés UTÁN**, tehát a kapu-sorrend nem sérült.

**E. Kliens-oldali hívások**

| Hívás | Előtte | Utána |
|---|---|---|
| `/api/profile/locale` | MINDEN teljes oldalbetöltésnél (kijelentkezve is) | böngésző-munkamenetenként egyszer; kijelentkezéskor a jelző törlődik (`clearLocaleSyncFlag`, mind a 4 signOut-ponton bekötve) |
| `/api/org/context` | minden oldalbetöltésnél, az org-váltó listájához | csak a user-menü / mobil menü első megnyitásakor |

**F. Notification-réteg (websocket NÉLKÜL)**

- **Adaptív backoff**: 60 s → 120 s → 300 s három változatlan poll után.
  Bármilyen változás, fül-fókusz vagy saját mutáció visszaállítja az alapra.
- `setInterval` → önmagát újraütemező `setTimeout`, hogy a lépcsőváltás
  azonnal érvényre jusson.
- **Navigáció-piggyback**: a layout `force-dynamic`, tehát minden navigáció
  friss számlálót ad — ezt átvesszük, és a backoff állapotát is ehhez
  igazítjuk.
- **`DashboardAutoRefresh`**: 30 s → 180 s, rejtett fülön nincs időzítő
  (eddig csak a lekérés maradt el, a timer futott), fülre visszatéréskor
  egyszeri azonnali ellenőrzés, és in-flight védelem, hogy a `router.refresh()`
  alatt beeső poll ne indítson újabb teljes újrarendert. Ugyanezt az eseményt
  a harang is jelzi (`OBSERVER_COMPLETED`), tehát nem vész el információ.

**Websocket: továbbra sem.** Az indoklás a 5. fejezetben áll, és a mérés meg
is erősítette: egy poll 1 indexelt count query, egy oldal-render **31–49**.
A poll a terhelés töredéke volt, nem a szűk keresztmetszet.

### 8.3 Biztonsági ellenőrzés

A memoizáció felhasználói adatokat érint, ezért ezt külön megnéztük:

1. **A React `cache()` hatóköre.** A `react@19.2.3` forrásában
   (`cjs/react.react-server.development.js:575`) a `cache(fn)` így kezdődik:
   `var dispatcher = ReactSharedInternals.A; if (!dispatcher) return fn.apply(null, arguments);`
   A tároló a `dispatcher.getCacheForType(...)`-ból jön, amit a Next
   **RSC-renderenként** hoz létre. Következmény:
   - szerver-renderben: kérésenkénti gyorsítótár, kérések között nem szivárog;
   - route handlerben / cronban / szkriptben: **egyáltalán nincs memoizáció**,
     a függvény közvetlenül fut. Tehát ott nincs gyorsulás, de szivárgás sem.
   Ez a mérésben is látszik: a `/api/nav/context` az egyetlen, ahol maradtak
   duplikátumok.
2. **Minden cache-kulcs tartalmazza az azonosítót** (`profileId`, `clerkId`,
   `orgId`, `teamId`). Két felhasználó kérése soha nem eshet egy kulcsra.
3. **Kapu-logika nem került cache mögé.** A `canAccessTeam` / `canManageTeam`
   / `requireOrgContext` döntése továbbra is minden hívásnál lefut; csak a
   NYERS adatlekérés (tagsági sor, előfizetés, profil) memoizálódik.
4. **Sorrend megőrizve.** A `/team/[id]`-n a `Promise.all` a hozzáférés-
   ellenőrzés UTÁN van; a `releaseDueCampaignSteps` írás továbbra is a kapu
   után fut.
5. **Írás-utáni-olvasás átnézve.** A `getActiveOrgMembership` és a
   `getOrgSubscription` mögötti adatot módosító hívók (`api/org/context` POST,
   `api/org` POST, `acceptance/service`, kredit-visszatérítés) egyike sem
   olvassa vissza ugyanabban a kérésben a memoizált értéket. A kockázat
   jsdoc-ban rögzítve mindkét függvénynél és a `setActiveOrgContext`-nél.
6. **`clearLocaleSyncFlag`.** A munkamenetenkénti nyelv-szinkron miatt
   kijelentkezéskor törölni KELL a jelzőt, különben ugyanabban a böngésző-
   munkamenetben belépő MÁSIK user az előző user nyelvét kapná. Mind a négy
   `signOut()` hívóponton bekötve.

### 8.4 Ami nyitva maradt

| Tétel | Miért maradt |
|---|---|
| `/api/nav/context` 35 query, 4 duplikátum | route handler — a `React.cache` ott elvi okból nem hat. Külön, kézzel átadott kontextus vagy rövid `private` HTTP-cache oldaná; utóbbi kijelentkezés után rövid ideig személyes adatot hagyna a böngésző-cache-ben, ezért nem csináltuk meg most |
| `UserProfile.findUnique` × 3 az alapdíjban | három különböző kulcs/select: `byClerkId`, `byId`, és az `activeOrgId` (staged-migráció kompatibilitási ág mögött). Egyesítésük a kompat-ág átszervezését igényelné |
| Fül-szintű lusta betöltés a `/team/[id]`-n | a `getTeamPageData` továbbra is mind a 7 fülre lefut (trust-network + minden tag eredménye). Ez a következő nagy tétel: a `members`/`feedback` fül ~10 query-t spórolna |
| Neon pooled endpoint / `@prisma/adapter-neon` | a `connection_limit=3` továbbra is 3-ban fogja a párhuzamosságot |

### 8.5 Tesztek

- `pnpm type-check`: 0 hiba
- `pnpm lint`: 0 error (35 örökölt warning)
- unit: 321/321 ✅ · client: 64/64 ✅
- e2e: 11 teszt bukik — **de ugyanez a 11 bukik a változásaink NÉLKÜL is.**
  Ellenőrizve: a saját fájljainkat `git stash`-sel félretéve újrafuttatva
  azonos a bukó halmaz (guest-handoff redirect-elvárás, observer-flow,
  admin/manager IA-smoke, assessment happy path, egy vizuális snapshot).
  Ezek tehát előzetesen is fennálló, környezet-/seed-függő bukások, nem
  regresszió. Külön szálon vizsgálandók.

---

## 9. MÁSODIK KÖR — a válaszidő (nem a query-szám) támadása

A 8. fejezet a query-DARABSZÁMOT vitte le. Utána a válaszidő még mindig magas
volt, ezért megmértük, MI tartja fent.

### 9.1 Két mérés, ami eldöntötte az irányt

**A) Nyers DB-körfordulás és pool-hatás** (dev gépről Neon `eu-central-1`-re):

| | soros medián | 30 párhuzamos indexelt count |
|---|---:|---:|
| `connection_limit=3` | 24,2 ms | 282 ms |
| `connection_limit=10` | 24,4 ms | 116 ms |
| `connection_limit=20` | 26,1 ms | 91 ms |

Két tanulság: a **körfordulás ~24 ms** (ez a fal, nem a lekérdezés-futás), és a
`connection_limit=3` **háromszorosára** nyújtotta a párhuzamos szakaszokat.
A DATABASE_URL a POOLED endpointra mutat (`…-pooler.…neon.tech`), ahol a
PgBouncer multiplexel — ott a 3-as korlát már nem védett semmitől.

**B) Hullám-elemzés.** A `db-metrics` mostantól kiírja, hány EGYMÁS UTÁNI
körfordulás-hullámban ment ki a kérés (`waves`), és a tényleges
párhuzamossági fokot (`parallelism` = összes DB-idő / DB-időszak hossza).

A pool felemelése után a párhuzamosság **2–4** lett, nem 10 — vagyis onnantól
már **nem a pool fogta vissza, hanem a waterfall**: 5–11 egymás utáni hullám.
`hullám × 24 ms` = a DB-oldali alsó korlát.

### 9.2 Mit csináltunk

| Hol | Mit | Nyert hullám |
|---|---|---|
| `src/lib/prisma.ts` | `connection_limit` 3 → **10**, `PRISMA_CONNECTION_LIMIT` env-vel felülírható (deploy nélkül hangolható) | — (párhuzamosság) |
| `src/lib/org-context.ts` | `getActiveOrgMembership`: 2–3 EGYMÁS UTÁNI kör (activeOrgId → explicit tagság → fallback tagság) helyett **egy hullám** (activeOrgId ∥ tagság-lista, a választás memóriában). Ez a journey fő `Promise.all`-jának egyik ága volt, tehát az egész render erre a láncra várt | −2 |
| `src/lib/journey/context.ts` | a csapat- és az org-összegző FÜGGETLEN, mégis két hullámban futott → egy hullám | −1 |
| `src/lib/team-auth.ts` | új `getAccessibleTeams`: id-lista + név-lekérés **egy** lekérdezésben (eddig két egymás utáni kör minden belépett oldalon) | −1 |
| `src/lib/navigation/nav-context.server.ts` | az org-függő fejléc-adatok (org neve, csapatok, aktív kampányok) a journey UTÁN indultak → most az org-tagságot előre feloldjuk (memoizált, ingyen) és **a journey-vel PÁRHUZAMOSAN** töltenek. Plusz: a `resolveOrgPolicySnapshot` itt kiszámolódott, majd `void`-olva eldobódott — halott lekérdezés, törölve | −2 |
| `src/app/(app)/team/[id]/page.tsx` | 3 hullámra szervezve: ① csapat + a néző org-szerepe EGY beágyazott lekérdezésben, mellette a saját kampány-lépések kinyitása ② saját, egymástól független adatok (résztvevői lépések ∥ csapat-tagság ∥ nekem szóló visszajelzés-kérések) ③ `hasStartedStep` ∥ observer-gyűjtés | −3 |

Biztonság: a párhuzamosítás **kizárólag a hívó SAJÁT adatait** hozta a
csapat-kapu elé (saját résztvevő-sorok, saját tagsági szerep, nekem szóló
kérések). A CSAPAT adatai — publikált riport, policy-pillanatkép,
aggregátumok — továbbra is a `canAccessTeam` mögött maradtak.

### 9.3 Eredmény

| Nézet | Kiindulás (q / wall) | 8. fejezet után | Most |
|---|---:|---:|---:|
| `/dashboard` | 64 / 865 ms | 32 / 588 ms | **31 / 449 ms** |
| `/profile` | 36 / 677 ms | 31 / 561 ms | **30 / 333 ms** |
| `/team` | 40 / 717 ms | 34 / 544 ms | **33 / 314 ms** |
| `/team/[id]?tab=intelligence` | 73 / 1069 ms | 41 / 600 ms | **39 / 353 ms** |
| `/team/[id]?tab=members` | 84 / 1703 ms | 49 / 1100 ms | **47 / 1087 ms** |
| `/org/[id]` | 80 / 1155 ms | 44 / 828 ms | **43 / ~800 ms** |
| **Összesen (17 nézet)** | **961 q / 16 813 ms** | 637 q / 10 036 ms | **615 q / 10 036 ms** |

**Query: −36 %. Fal-idő: −40 %.** Hullámok: `/profile` 9 → 6,
`/org/[id]/settings` 5 → 2, `/team/[id]` 11 → 8.

### 9.4 A LEGNAGYOBB HÁTRALÉVŐ TÉTEL — a layout minden navigációnál újrafut

Böngészőben, valódi bejelentkezett munkamenettel mérve:

```
hidegindítás  /profile          → 19 query
hidegindítás  /profile/results  → 29 query
KLIENS-oldali navigáció /profile → /profile/results → 29 query, 8 hullám
```

A kliens-oldali navigáció **ugyanannyiba kerül, mint a hidegindítás**. Oka:
az `(app)/layout.tsx` `export const dynamic = "force-dynamic"`, tehát a
layout-szegmens minden RSC-navigációnál újrarenderelődik — a teljes
nav-kontextussal (~19–30 query) együtt.

Ráadásul a layout a `resolveWorkspaceNavContext`-et **`await`-eli, mielőtt
visszaadná a JSX-et**, amiben a `{children}` van. Következmény: az OLDAL
adatlekérése csak a nav teljes lefutása UTÁN indul. Ez ~6 hullám × 24 ms
tiszta sorosítás minden oldalon, még mielőtt a lényeg elkezdődne.

Két lehetséges irány, MINDKETTŐ látható viselkedés-változással jár, ezért
külön döntést igényel:

**(a) Suspense-re bontott fejléc.** A layout szinkron lesz (csak a
`getServerAuth()` + `getServerLocale()` marad benne — egyik sem DB), a
nav-kontextus egy `<Suspense>` mögé kerül. Így az oldal adatai a nav-adattal
PÁRHUZAMOSAN töltenek: a teljes idő `max(nav, oldal)` lesz `nav + oldal`
helyett. Becsült nyereség: további **30–40 % fal-idő**.
Ára: a fejléc egy pillanatra csontvázként jelenik meg minden navigációnál —
azonos magasságú skeleton kell, különben ugrál a layout.

**(b) `experimental.staleTimes.dynamic` a next.config-ban.** A kliens-router
N másodpercig újrahasználja a layout+oldal szegmenst, tehát a gyors
oda-vissza navigáció szinte ingyenes lesz. Nincs skeleton, nincs vizuális
változás. Ára: a nav-jelvények (értesítés, feladat) és az oldal-adat N
másodpercig elavult lehet — a mutáció utáni `router.refresh()` konvenció ezt
nagyrészt lefedi.

### 9.5 És a háttérben előtöltés (prefetch)?

Technikailag megy (`<Link prefetch>` / `router.prefetch()`), **de a mostani
felállásban ellenjavallt**: minden prefetch egy TELJES szerver-render, azaz
30–47 query. Öt nav-link előtöltése ~200 query-t indítana el olyan
oldalakra, amelyeket a felhasználó talán meg sem nyit — a `connection_limit`
és a Neon terhelése miatt ez lassítaná azt az oldalt, amit épp néz.

Sorrend tehát: előbb **9.4 (a) vagy (b)**, és csak utána, szűk körben
(1–2 leggyakoribb cél, pl. Vezérlő) érdemes prefetchet bekapcsolni.

### 9.6 DÖNTÉS: Router Cache (b), NEM a fejléc Suspense-bontása (a)

UX-indok: a fejléc **állandó kroom**. A tartalom 300 ms-os késését a
felhasználó alig veszi észre, azt viszont azonnal, ha a fejléc minden
kattintásra csontvázként felvillan — az „olcsó, széteső" érzetet kelt. A
hidegindítás érzetére nem a fejléc-Suspense a helyes eszköz, hanem a
route-szintű `loading.tsx` (az az OLDAL vázát mutatja, az állandó kroomhoz
hozzá sem nyúl); ebből 8 már megvan.

Bevezetve: `next.config.ts` → `experimental.staleTimes.dynamic = 30`.

**Mérve (böngésző, valódi bejelentkezett munkamenet):**

```
/profile → /profile/results  (első, nincs cache) → 29 query, 8 hullám
vissza a /profile-ra (30 s-on belül)             → 0 SZERVER-RENDER
```

A vissza-navigáció és az oda-vissza kattintgatás tehát ingyenes lett;
korábban minden ilyen lépés teljes layout+oldal újrarendert jelentett.

Elavulás-kockázat: a mutáció utáni `router.refresh()` (36 hívóhely,
projekt-konvenció) teljesen érvényteleníti a Router Cache-t, tehát a saját
műveletek után nincs csúszás. Marad a „valaki MÁS írt közben" eset: max.
30 s. Hangolható a config-ban (0 = korábbi viselkedés).

### 9.7 Hátralévő, sorrendben

1. **`/team/[id]` fül-szintű lusta betöltés** — a `getTeamPageData` továbbra is
   mind a 7 fülre lefut (trust-network + minden tag eredménye). A
   `members`/`feedback` fül ~10 query-t spórolna. Ez a legdrágább nézet
   (47 query) egyetlen hátralévő nagy tétele.
2. **`/api/nav/context` 33 query** — route handler, ott a `React.cache` nem hat.
3. **Prod-mérés.** A 24 ms-os körfordulás DEV-gépről Neon `eu-central-1`-re
   értendő. Ha a Vercel-projekt is `eu-central-1`/`fra1`, élesben 1–5 ms —
   akkor a mostani 30 query ~50–100 ms, nem 300–400. **Érdemes ellenőrizni a
   Vercel régió-beállítást**: ha nem egyezik a Neon régiójával, az önmagában
   nagyobb tétel, mint minden eddigi optimalizáció együtt.
4. **Prefetch** — csak a 9.4/9.6 után, szűk körben (1–2 leggyakoribb cél).
