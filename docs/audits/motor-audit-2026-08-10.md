# Motor-audit — egyéni és csapat-szintű számítások (2026-08-10)

> Teljes, vizuális változat (ábrákkal): claude.ai artifact „Trita motor-térkép —
> számítási audit”. Ez a doksi a repo-belüli referencia: motoronkénti összefoglaló
> + a priorizált leletlista. Minden konstans a kódból származik, fájl:sor
> hivatkozással; az állapot a 2026-08-10-i main.
>
> **JAVÍTÁSI ÁLLAPOT (2026-08-10, ugyanezen a napon):** a teljes P0-lista és a
> P2-réteg nagy része javítva, a contribution-placement modell kivezetve, három
> új funkció bekerült — részletek:
> `docs/development/changelog/2026-08-10-motor-javitasok.md`. A lenti
> hivatkozott sorszámok az audit-kori állapotra mutatnak.
>
> **P1-MÉLYÍTÉS (még aznap):** SEM a fő úton (típuscímke-óvatosság, ±SEM,
> dossier-küszöb), norma-infrastruktúra + kalibrációs scriptek, rater-minőség
> detektor, facet-szintű observer-összevetés, cockpit N+1 —
> `2026-08-10-p1-melyites.md` + `2026-08-10-manager-cockpit-koteg.md`.
> Pilot-adatra vár: norma-tábla feltöltése, 12/22 és minta-küszöb kalibráció,
> valódi α; nyitva még: recency-súlyozás a peer/trust poolokban, interakció
> „mért" szint, minta-motor Bessel/bimodalitás.

## Hatókör

Egyéni szint: TSFI-pontozás → értelmező réteg (típus/narratíva/ajánlás) →
observer/360 → (parkolt) karrier-motor. Csapat szint: `getTeamPageData` betöltő →
súrlódás-modell + trust-hálózat → csapatminta → csapatszerep (mért/becsült/peer) →
teljesítmény-mátrix → nyomás + pszich. biztonság → riport-aggregátum + tag-nézet +
prioritás-motor + cockpit/org-statisztika. Interakció-szimuláció (párdinamika) külön.

## Motoronkénti rövid kép

### Egyéni

- **Pontozás** (`scoring.ts`): `v′ = reversed ? 6−v : v`;
  `score = round(((Σv′/n − 1)/4)·100)` — POMP, nem percentilis. Kapu: pontosan
  60 vagy 100 item. Short felbontás: dim 2,5 pont/lépés, 2-itemes facet 12,5.
  SEM (analitikus): short ≈ ±10,4 — de csak a karrier-motor használja.
- **Értelmezés**: típus = top-2 dimenzió rangsorból (küszöb/min-távolság nélkül);
  tension-párok 65/35-ös sávokon (18 szabály, 3 kockázati); növekedési terv =
  legalacsonyabb dim <40; facet-fókusz <60. Legalább öt párhuzamos sávrendszer él
  (35/65 · 40/70 · 25/40/62/80 · 38/65 · 40/60).
- **Observer**: ugyanaz a 60 item E/3-ban + kapcsolat + ismertség + confidence
  (1–5). Aggregálás: HÁROM külön implementáció (member-dossier kanonikus n≥2;
  results-oldal inline n≥2, hibás 0-fallbackkel; career kapu nélkül), mind
  súlyozatlan átlag. Confidence: tárolva, sehol nem olvasva. Gap-küszöbök:
  dossier |Δ|≥5, képernyő 10/15, PDF 12/20.
- **Karrier** (PARKOLT, `CAREER_MODULE_READY=false`): ideál-pont illesztés
  toleranciával, profil-centrálás, SEM-propagáció, átfedő sávban nincs rangsor,
  Wilson-kalibráció — módszertanilag a legerősebb motor a repóban; élesítés előtt
  belső következetlenségek javítandók (ld. P0).

### Csapat

- **Betöltő** (`team-stats.ts:191`): tagonként a legutolsó self-eredmény;
  facet- és observer-pontszám sosem jut csapat-modellbe. `dimAvg` már n≥1-től —
  a riport ugyanazt n≥3-tól adja (inkonzisztens kapuk).
- **Súrlódás** (`friction-model.ts`): súlyok C .30 · A .25 · H .20 · E .15 ·
  X .05 · O .05; él: <12 aligned, <22 complementary, egyébként friction.
  Hiányzó dimnél nincs renormalizálás. Trust-él felülír (`mergeTrustEdges`).
- **Trust** (`trust-network.ts`): 5 irányított item (5/3/5/3/3 fokozat, egyenlő
  súllyal); sávok 75/55/35; irányok átlaga (aszimmetria elvész); csomópont-átlag
  n≥3; hub = erős-él fokszám max (≥2); izolált = ≥2 él, mind <55.
- **Csapatminta** (`team-pattern.ts`, n≥3 teljes profil): 4 tengely (lendület =
  TEMP; kohézió = (ADAP+INTE)/2 — kompozit proxy; fegyelem = THOR; nyitottság =
  OPEN), küszöbök 55/60/62,5/57,5, sávok ±6,25/±18,75, instabil ±3,75 → 16 kód +
  stabilitás + alternatíva + 3 faktoros konfidencia (a „tisztaság” faktor sosem
  lehet alacsony). Populációs szórás (÷n) → homogén-torzítás kis n-nél.
- **Csapatszerep**: mért = Σsúly/6·100 (rács: 0/17/33/50/67/83/100); becslés =
  50 + Σ(dim−50)·w (folytonos, felül nyitott); precedencia
  `resolveDisplayRoleScores` (mért > becslés) — de ~8 hívóhelyből 1 használja;
  peer-aggregátum n≥3, raterenkénti profilok átlaga, top-3 halmaz-összevetés.
- **Teljesítmény-mátrix** (`team-intelligence.ts:99`): szállítás = .60·C + .25·H
  + .15·(100−E); fejlődés = .50·O + .30·X + .20·(100−E); sávok 40/60; konfidencia
  = sávhatár-távolság. KISZÁMOLVA, DE SOSEM RENDEREL (a TeamMap fogyasztót törölték).
- **Nyomás** (`team-pressure.ts`): pólus ≥65/≤35, találat ha count≥2 ÉS arány≥50%,
  max 3. Ugyanazon dim mindkét pólusa tüzelhet (ellentmondó bekezdések).
- **Pszich. biztonság** (`psych-safety.ts`): 8 item, n≥3 anonimitás; sávok 75/55;
  gyenge item <3,4 → vezetői csapda-kártyák (PS7 egyikhez sincs kötve).
- **Riport** (`team-report.ts`): publikáláskor fagyasztott aggregátum (jó minta!);
  narratíva-váltók frictionShare≥0,40 / alignedShare≥0,50 / szórás≥12 /
  TPS-spread≥20; `topFrictionDims` súly·szórás szerint rangsorol, de nyers
  szórás≥12-n szűr. Tag-nézet: „átlag felett” = fix Δ≥6.
- **Interakció** (`interaction-engine.ts`): 30 reláció-atom, pólus 65/35,
  salience = FRICTION_WEIGHTS × min(pólus-erő), max 3 atom, dim-dedup;
  a „measured” szint sosem áll elő, a `meta.level` a szerializálásnál elvész;
  a hivatkozott `interaction-language.test.ts` nem létezik.

## Leletek — P0 (kóddal igazolt hibák)

1. **ComparisonTab insight-doboz sosem renderel** — `GAP_INSIGHTS` kulcs
   `H_higher…`, lookup `INTE_higher…` (ComparisonTab.tsx:16–29, 91–98).
2. **Hamis vakfolt**: hiányzó observer-dim → 0 pontként jelenik meg
   (results/page.tsx:274, 296).
3. **`observer ?? self` maszkolás**: hiányzó adat = „tökéletes egyezés”
   (ComparisonTab.tsx:76, ProfileTabs.tsx:908).
4. **`RISK_TEXTS` halott** — a 3 kockázati pár mitigációs tanácsa sosem jut ki
   (profile-content.ts:212, workstyle-content.ts:168).
5. **Teljesítmény-mátrix zsákutca + hamis konfidencia**: adat nélküli tag all-50
   fallbackkel „high” konfidenciát kap (intelligence-data.ts:57–66); döntés:
   visszaépítés vagy törlés.
6. **Súrlódás: nincs renormalizálás hiányzó dimre** → részleges profil hamisan
   „aligned” (friction-model.ts:35–38); friction-model.test.ts nem létezik.
7. **Nyomás: kettős pólus** ugyanarra a dimenzióra (team-pressure.ts:127–135).
8. **Hub-számítás**: DynamicsMap csak `e.to`-t számol (a legrégebbi tag sosem
   hub); három ütköző hub-definíció (DynamicsMap.tsx:49, team-report.ts:350,
   trust-network.ts:240).
9. **Dinamika-provenance**: intelligence-nézet fixen „profil becslés”-t ír mért
   trust-körnél is; evidencia „self_plus_observer” forrást ad becsült élekre
   (intelligence-data.ts:101, 129–132).
10. **Vezető-detektálás csak angolul** (`manager|lead|owner|admin`) — a magyar
    „vezető” nem talál (team-intelligence.ts:80–88).
11. **Observer-kvóta lifetime**: COMPLETED is számít az 5-be, a UI „5 aktív”-ot
    ígér (api/observer/invite/route.ts:181–187).
12. **Guest-teaser tie-break ≠ belépett út** → más archetípus a /try-on és claim
    után (guest-teaser.ts:57 vs personality-type.ts:115).
13. **Dossier**: `disconnected` → „friction” (adathiány konfliktusként);
    hiányzó self-dim `?? 0` → hamis −100-as delta (member-dossier.server.ts:44,
    member-dossier.ts:162).
14. **topFrictionDims**: másra szűr (nyers szórás≥12), mint amire rangsorol
    (súly·szórás) (team-report.ts:292–299).
15. **Facet-név káosz**: `dimensionFacets` HU-only, pozicionális, ellentmond a
    `TRITAN_FACETS`-nek (dimension-utils.ts:57 ↔ tritan.ts:63).
16. **Karrier belső hibák** (élesítés előtt): halott `RANK_WEIGHTS.interest`;
    service duplikált súlyok + kihagyott differenciáltság-szorzó (a UI 2× súlyt
    mutathat); PDF `data.career` táplálatlan; hiring team-fit = hasonlóság a
    csapatátlaghoz, 1 fős „átlagnál” is tüzel (career/engine.ts:74,403,
    career/service.ts:257, hiring/.../page.tsx:436).
17. **Observer-számláló széttartás**: `receivedCount` all-time vs
    activatedAt-szűrt team/tasks nézet (observer-flow.ts:44 ↔ team/[id]).

## Leletek — P1 (módszertani)

- **SEM/CI a fő útra** (a karrier-gépezet kész): típus-melléknév elhagyása, ha a
  top-2–3 különbség < SEM; pont ± SEM sáv; lapos profilnál nincs „leggyengébb”
  címke; dossier |Δ|≥5 emelése.
- **Norma-percentilis** (saját backlog P4.3): pilot-normák, `percentile` a
  score-JSON-ba, sáv-címkék kapuzása.
- **Observer-aggregáció egységesítés**: egy kanonikus aggregátor, egy min-N
  konstans (most 2/2/2/3/3 + career kapu nélkül), confidence-súlyozás vagy c≤2
  kizárás, szórás/egyetértés-kijelzés, N-függő gap-küszöb, facet-szintű
  összevetés (i18n-kulcsok készen).
- **Rater-minőség**: raterenkénti szórás (halo), straight-line detektor,
  reverse-item konzisztencia — mind a tárolt answers-ből.
- **Valódi α/SEM** offline jobbal + `form`/`bankVersion`/`engineVersion` pecsét
  a score-JSON-ba.
- **Súrlódás v2**: szint-hatás (közös alacsony C ≠ aligned), „complementary”
  átnevezés/teszt, 12/22 kalibráció mért trust-adattal.
- **Trust-aszimmetria megőrzése** (átlag helyett min/max vagy irány-pár;
  mutual/confidence megjelenítés).
- **Minta-motor**: Bessel-korrekció, bimodalitás-jelzés, konfidencia-faktor
  javítás, observer/peer-adat bevonása (kimondott TODO).
- **Mért/becsült szerep-pont szétválasztása** a roleDistribution-ben és a
  score% badge-ben; semleges-profil döntetlen jelzése.
- **Recency/kilépők** a peer- és trust-poolokban; kör-összehasonlítás alapjai.
- **Automata observer-emlékeztető** (oszlopok készen, cron hiányzik) — a kis
  rater-szám legvalószínűbb oka.
- **Interakció**: „measured” szint bekötése (trust-él megvan), meta.level
  szerializálása, hiányzó nyelvi guardrail-teszt pótlása.

## Leletek — P2 (konzisztencia, kód-egészség)

- Egy exportált `SCORE_BANDS` + közös `dimensionStats()` (4 mean/SD-implementáció
  és 5+ sávrendszer helyett).
- Konstans-deduplikáció: PEER_MIN_RATERS literál, PATTERN_THRESHOLDS másolat,
  65/35 komment-szinkron, trust <55 literál, meghívó-kvóta/TTL a policy-modulba.
- `resolveDisplayRoleScores` a ~8 inline másolat helyett.
- Halott kód: aspects-út, ScoreRange enum, 13 profile-content export (a
  kiegyensúlyozott-profil narratívát inkább bekötni!), rawDiversity
  emotionality/honesty, árva i18n-kulcsok, sosem írt `source:"estimate"`.
- Hiányzó tesztek: scoring.ts, friction-model, sáv-határok, tie-breakek,
  prioritás-küszöbök.
- Cockpit: N+1 team-pipeline, mért+becsült élek badge nélkül összeadva,
  multi-team esemény-attribúció.
- Nyers `answers` szétválasztása a `scores`-tól (ACL-szűkítés).
- Share-oldal: kapuzatlan narratíva + becslés-badge nélküli csapatszerep.

## Javasolt sorrend

1. **Gyors kör (S-tételek a P0-ból)**: observer-hibák, renormalizálás,
   kettős pólus, vezető-detektálás, provenance-címkék.
2. **Pilot előtt**: placement-döntés, observer-reminder cron, SEM-óvatosság a
   típuscímkén/dossier-gapeken, mért/becsült szerep-szétválasztás.
3. **Pilot alatt/után (adatigényes)**: norma-percentilis, valódi α/SEM,
   12/22 + minta-küszöbök kalibrálása mért adattal.
