# Feature Ideas

Validált ötletek, amik a backlogba kerültek. Minden bejegyzés tartalmazza a motivációt, a minimális scope-ot, és a szükséges előfeltételeket.

---

## 1. Csapaton belüli bizalmi háló — gyors 360° kör

**Státusz:** ✅ MVP MEGVALÓSÍTVA (2026-07-21) — a TEAM_ROLE_360
peer-infrastruktúra mintájára: `TrustObservation` séma, 5 kérdéses
kérdéssor (`src/lib/trust-network.ts`), TRUST_360 kampánylépés,
batch-upsert API (`/api/trust/peers`), kitöltő UI (`/assessment/trust`),
és a dinamika-térkép edge-forrás cseréje (profile_estimate →
trust_round, becslés-fallbackkel) mért/becsült jelöléssel. A tervezett
outputokból él: páronkénti score + edge-típus, hub- és beágyazatlan-tag
felismerés (aggregátum-libben; dedikált háló-vizualizáció még nincs).
Az alábbi leírás az eredeti ötlet archívuma.
**Prioritás:** közepes-magas
**Előfeltétel:** működő campaign/feedback round infra (megvan)

### Motiváció

A jelenlegi csapatdinamika térkép a TRITAN személyiségprofil-eltérésekből **becsli** a potenciális súrlódási pontokat. Ez kutatásban megalapozott, de nem mért adat — nem veszi figyelembe a tényleges bizalmi szintet, együttműködési tapasztalatot, vagy kommunikációs mintákat.

Egy rövid, célzott 360°-os mikro-kérdőív valódi relációs adatot ad, ami:
- pontosítja a dynamics map edge típusait (becslés → mérés)
- lehetővé teszi a bizalmi háló időbeli változásának követését
- actionable insight-ot ad a csapatvezetőnek (ki kivel nem kommunikál elég?)

### Minimális scope

**Kérdőív:** 5-8 kérdés tagonként, minden csapattársról:
1. "Mennyire bízol X szakmai ítéletében?" (1-5)
2. "Milyen gyakran kérsz segítséget X-től?" (soha / ritkán / rendszeresen)
3. "Mennyire nyíltan tudsz kommunikálni X-szel?" (1-5)
4. "Ha fontos döntés előtt állsz, bevonnád-e X-et?" (igen / nem / attól függ)
5. "Hogyan jellemezéd a közös munkátokat?" (zökkenőmentes / működik / nehézkes)

**Kitöltési idő:** ~2-3 perc (N-1 csapattárs × 5 kérdés, ahol N a csapatméret)

**Output:**
- Páronkénti bizalmi score (0-100)
- Edge type: `strong_trust` / `moderate` / `weak_trust` / `disconnected`
- Hub felismerés: ki a csapat összekötője
- Izolált tag felismerés: ki nincs beágyazva

**Adatmodell (vázlat):**
```
TrustRound {
  id, teamId, createdAt, status (ACTIVE/CLOSED)
}

TrustResponse {
  id, roundId, fromUserId, toUserId,
  trustScore, helpFrequency, communicationOpenness,
  decisionInclusion, workQuality
}
```

### Kapcsolat a jelenlegi rendszerhez

- A campaign infra újrahasználható (ACTIVE/CLOSED lifecycle)
- A dynamics map vizualizáció megvan — csak az edge source-t kell cserélni `profile_estimate` → `trust_round`
- A profil-alapú becslés fallbackként megmarad ha nincs trust round adat

### Nem scope

- Nem helyettesíti a személyiségtesztet — kiegészíti
- Nem nyilvános (csapaton belüli, csak a vezető látja az aggregált képet)
- Nem egyéni visszajelzés — a dynamics map szintjén aggregált

---

## 2. Csapat szerep teszt (Csapatszerep) menedzselése és riportba foglalása

**Státusz:** ✅ MEGVALÓSULT (2026-07-20, `99236ac`) — sőt túlteljesült:
a tervezett A–B–C fázisokon felül peer-réteg is épült (TEAM_ROLE_360
kampánylépés, 27 itemes bank self+peer perspektívával, n≥3 aggregátum,
önkép vs. csapatkép összevetés). Részletek:
`docs/product/team-role-360-plan.md`. Az alábbi leírás archív.
**Prioritás:** magas
**Előfeltétel:** a Csapatszerep teszt kód megvan, a self-layer szinten kitölthető

### Jelenlegi állapot a kódban

A Csapatszerep teszt infrastruktúra implementált:
- **Kérdőív:** `src/lib/team-role-questions.ts` — 7 szekció × 8 állítás, pontelosztásos formátum
- **Scoring:** `src/lib/team-role-scoring.ts` — 9 Csapatszerep szerep (PL, RI, CO, SH, ME, TW, IM, CF, SP), top 3 kiválasztás
- **TRITAN becslés:** `src/lib/team-role-estimate.ts` — ha nincs kitöltött Csapatszerep teszt, TRITAN profilból becsül
- **Kitöltő felület:** `src/app/assessment/team-role/CsapatszerepClient.tsx` + `page.tsx`
- **Submit API:** `src/app/api/team-role/submit/route.ts`
- **Adatmodell:** `CsapatszerepAnswer` (válaszok) + `CsapatszerepScore` (eredmény, source: `questionnaire` | `estimate`)
- **Csapat nézet:** `src/components/team/TeamCsapatszerepSection.tsx` (492 sor) — szerep-eloszlás, heatmap, hiányzó/túlreprezentált szerepek, tag-szerep mátrix
- **Team intelligence-be bekötve:** a team page-en a Csapatszerep szekció renderelődik TRITAN becslésből

### Ami hiányzik

**1. Manager-vezérelt Csapatszerep kör indítás:**
A személyiségteszt kitöltés a self-layer-en történik (user saját maga tölti ki). A Csapatszerep tesztre viszont nincs campaign/round mechanizmus — a manager nem tud köröket indítani, emlékeztetőt küldeni, vagy nyomon követni a kitöltöttséget.

**2. Becslés vs. valódi kitöltés megkülönböztetése a riportban:**
Jelenleg a `TeamCsapatszerepSection` a TRITAN-ból becsült Csapatszerep szerepeket használja. A riportnak egyértelműen jeleznie kellene:
- ki töltötte ki ténylegesen a Csapatszerep tesztet (`source: "questionnaire"`)
- kinél fut becslésből (`source: "estimate"`)
- mekkora a lefedettség (X/Y tag valódi kitöltéssel)

**3. Egyéni Csapatszerep eredmény a személyes profilon:**
A self dashboard-on nincs Csapatszerep eredmény megjelenítés. A user kitölti a tesztet, de az eredményt csak a csapat nézetben látja (ha csapattag).

**4. PDF/export integrálás:**
A csapat riportba a Csapatszerep szerep-eloszlás nem kerül bele.

### Minimális scope

**Fázis A — Riport pontosítás (kis effort):**
- `TeamCsapatszerepSection` jelezze a source-t tagonként (becslés badge vs. kitöltött badge)
- Összesítő: "3/8 tag valódi kitöltéssel, 5 becslésből"
- A profil results oldalon jelenjen meg a saját Csapatszerep eredmény (top 3 szerep + leírás)

**Fázis B — Csapatszerep kör menedzselés (közepes effort):**
- Campaign-szerű lifecycle: manager indít Csapatszerep kitöltési kört
- Tagok kapnak értesítést / a dashboardon megjelenik a teendő
- Kitöltöttség tracking a team oldalon
- A journey engine felismeri a Csapatszerep köröt mint next-best-action

**Fázis C — Riport export (kis effort):**
- A csapat PDF-be bekerül a Csapatszerep szekció
- Szerep-eloszlás, hiányzó szerepek, erősségek

### Meglévő kód referencia

| Fájl | Méret | Funkció |
|------|-------|---------|
| `src/lib/team-role-scoring.ts` | 62 sor | 9 szerep scoring + `getTopRoles()` |
| `src/lib/team-role-estimate.ts` | 45 sor | TRITAN → Csapatszerep becslés mapping |
| `src/lib/team-role-questions.ts` | 137 sor | 7 szekció × 8 állítás kérdésbank |
| `src/app/assessment/team-role/` | 85 sor | Kitöltő UI + page |
| `src/app/api/team-role/submit/route.ts` | 54 sor | Submit + score mentés |
| `src/components/team/TeamCsapatszerepSection.tsx` | 492 sor | Csapat Csapatszerep vizualizáció |
| Prisma: `CsapatszerepAnswer`, `CsapatszerepScore` | — | Adatmodell kész |

### Nem scope

- Nem új kérdőív fejlesztés — a meglévő Csapatszerep teszt marad
- Nem módosítja a TRITAN becslés logikát — az fallback marad
- Nem ad egyéni coaching ajánlást — csak a szerep felismerés és csapat szintű eloszlás

---

## 3. Trust-háló minimál-vizualizáció a csapatriportban

**Státusz:** ✅ MEGVALÓSÍTVA (2026-07-22) — az #1 (bizalmi háló 360°)
follow-upja. A csapatriport (`TeamReportView`) kapott egy „Kapcsolati háló
— kiemelések" blokkot, ami névvel jelöli a csapat összekötő(i)t (hub) és a
beágyazatlan tag(oka)t, mért/becsült forrás-badge-dzsel. Fontos pontosítás
az eredeti ötlethez: a hub/beágyazatlan detektort NEM a `DynamicsMap`-be
kellett írni — a `trust-network.ts` `computeTrustNetwork()`-je már
kiszámolja a `hubUserIds` és `isolatedUserIds` mezőket a mért trust-kör
adatból (küszöb-szabályokkal). Így az implementáció ezt használja fel, nem
új detektort. Az alábbi „Minimális scope" a megvalósult megoldást tükrözi.
**Prioritás:** közepes (kis effort, magas debrief-érték)
**Előfeltétel:** trust round mérés (megvan, #1), `computeTrustNetwork()`
hub/isolated logika (megvolt)

### Motiváció

A tanácsadói debriefen a legértékesebb két állítás relációs szinten:
"ki a csapat összekötője (hub)" és "ki nincs beágyazva (izolált tag)".
Ez ma csak az interaktív intelligence tab dinamika-térképén látszik
(kattintgatással), a letölthető / megosztható **csapatriportba** nem
kerül bele. Egy statikus, egyszerű kiemelés a riportban azonnal
beszédtémát ad a tanácsadónak, kattintás nélkül.

### Megvalósult scope

A `TeamReportView` egy tömör, összefoglaló-orientált blokkot kapott (nem új
nehéz chart — a vizualizációs policy guardrailjével összhangban):

- **Hub-kiemelés:** mért adatnál a `computeTrustNetwork().hubUserIds`
  (legtöbb erős, kölcsönös bizalmi éllel, min. 2) — névvel. Mért adat híján
  profil-alapú becslés fallback: a legtöbb „aligned" (hasonló profilú)
  kapcsolattal rendelkező tag (aligned-fok ≥ 3), a dinamika-térkép
  hub-definíciójával összhangban.
- **Beágyazatlan-tag kiemelés:** a `computeTrustNetwork().isolatedUserIds`
  (≥ 2 mért éllel, de egyetlen ≥ moderate/erős él nélkül) — névvel. Csak
  mért trust-körből jelenik meg; becslésből tudatosan nem, hogy ne
  állítsunk többet az adatnál.
- **Forrás-jelölés:** a blokk fejlécében „mért" (sage) vagy „becsült"
  (amber) badge, lábjegyzetben a mért párok száma és a lefedettség (%).

Adatréteg: a `buildTeamReportAggregates` (`team-report.ts`) a publikáláskori
pillanatképbe egy új, opcionális `trustHighlights` mezőt tesz (`source`,
`measuredPairCount`, `possiblePairCount`, `coveragePct`, `hubs[]`,
`isolated[]`, mind névvel feloldva). Régebbi pillanatképekben nincs → a
render `agg?.trustHighlights`-tal guardol (a `psychSafety`/`peerRoles`
mintájára). A tagok névvel szerepelnek, mert a debrief tárgya konkrét tag; a
láthatóság a dinamika-térképpel azonos (vezető/tanácsadó).

### Érintett fájlok

- `src/lib/team-report.ts` — `TeamReportAggregates.trustHighlights` mező +
  feltöltés a `buildTeamTrustNetwork()`-ből (becslés-fallbackkel).
- `src/components/team/TeamReportView.tsx` — „Kapcsolati háló — kiemelések"
  szekció (hub + beágyazatlan-tag chipek, forrás-badge, debrief-mondat).
- Újrahasznált (változatlan): `src/lib/trust-network.ts`
  (`computeTrustNetwork` hub/isolated), `src/lib/trust-network.server.ts`
  (`buildTeamTrustNetwork`).
- `docs/product/team-intelligence-visualization-policy.md` — guardrail:
  a kiemelés summary-orientált maradt, nem duplikálja a deep-dive chartokat.

### Nem scope (megtartva)

- Nem új önálló háló-vizualizációs oldal — a meglévő `DynamicsMap` marad
  az interaktív felület, a riport csak névvel jelölt kivonatot mutat.
- Nem egyéni coaching-ajánlás — csapatszintű reláció-kiemelés.
- Nem cseréli a becslés-fallbacket — ha nincs mért trust adat, a riport
  a becsült hub-képet jelöli forrás-badge-dzsel, beágyazatlan-tag nélkül.
