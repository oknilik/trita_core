# Karrier-illeszkedési motor (v2) — audit és megvalósítási terv

> Készült: 2026-07-30 · Státusz: JÓVÁHAGYOTT terv, fejlesztés még NEM indult
> · Érintett kód: `src/lib/industry-fit.ts`, `src/components/results/CareerCompass.tsx`,
> `src/components/profile/ProfileTabs.tsx` (PDF-ág), `src/lib/questions/riasec.ts`
> · Kapcsolódó: `tsfi-item-provenance.md` (instrumentum), `riport-javitasi-terv-2026-07.md`

## 0. Döntések (user, 2026-07-30)

1. **A szakmailag helyes utat visszük**, akkor is, ha terméknyelven kevésbé
   hatásos. Konkrétan: ahol a szerepek konfidencia-sávja átfed, ott **nem
   sorrendet, hanem klasztert** mutatunk („ez a 3–4 irány egyformán illik
   hozzád — a különbség a mérési hibán belül van"). A hero-kártya ezért
   gyakran több szerepet fog tartalmazni.
2. **Egységes motor**: egy belépési pont, amit a képernyő, a PDF és a
   jelölt-réteg egyaránt hív. Inputok: személyiség (self + observer),
   wizard-válaszok, mért Holland-eredmény (ha van), munka-katalógus.
3. Ez a dokumentum előbb készül el, mint a fejlesztés — a kódolás külön
   ütemben, a terv jóváhagyása után indul.

---

## 0.1 Megvalósítás állása (2026-07-30)

**Adatréteg kész.** A validált Excel visszaolvasva: 477 aktív foglalkozás
(`src/lib/career/catalog/occupations.core.json`), 413 archivált, magyar nevek
kézzel véglegesítve. Levezetés és források: `occupation-catalog-sources.md`.

**Tárolás: fájl a repóban, nem DB.** Indok: statikus referencia-adat, amit
verziózni és diffként review-zni kell (a provenance-elvárás így teljesül),
migráció nem kell, és a motor tiszta függvény marad. A JSON három részre bomlik:
`occupations.core.json` (scoring, 51 KB gzip), `occupations.content.json`
(leírás/aliasok, csak megjelenítéshez), `occupations.archived.json`. DB-be az
kerül, ami felhasználói adat: a wizard-háttér (`UserProfile.careerBackground`)
és a visszajelzések. Ha később kell ügyfél-specifikus felülírás, egy
`OccupationOverride` tábla overlay-ként ráolvasható.

**Motor kész (F0+F1 magja):** `src/lib/career/` — `engine.ts`,
`psychometrics.ts`, `interests.ts`, `feasibility.ts`, `catalog.ts`, `person.ts`,
`types.ts`. Egyetlen belépési pont: `computeCareerFit(person, options)`.
21 unit teszt: `tests/unit/career/engine.test.ts`.

Ami már ebben benne van a tervből:

| Terv-pont | Állapot |
|---|---|
| Ideal-point pontozás (cél + tolerancia, kétirányú) | kész |
| Differenciál rangsor (profil-centrálás) + külön `general` | kész |
| Reliabilitás-alapú SE és sáv (item-számból) | kész |
| Klaszterezés a kompozit hibáján (nincs hamis sorrend) | kész |
| Observer-súly értékelő-szám szerint (nem fix 50/50) | kész |
| H-padló (aszimmetrikus szabály) | kész |
| Teljes 6-vektoros Holland-congruence + differenciáltság-jelzés | kész |
| Megvalósíthatóság külön tengelyen (nem keveredik a fitbe) | kész |
| Szakmacsalád-diverzifikálás | kész |
| `prefs`/`env`/`leadIntent` perzisztálás | kész (career-background zod séma bővítve) |
| Szerver-oldali számítás egy helyen | kész (`POST /api/career/fit`) |
| Irány-tudatos fejlődési szöveg | kész (`growth-content.ts` + `CareerGrowthPlan`) |
| UI átkötés (CareerCompass klaszteres nézetre) | kész (`CareerResults`, szerver-oldali kezdeti render) |
| PDF-ág ugyanabból az eredményből | kész (`ProfileTabs` a `careerResult` propból) |
| Kalibrációs visszajelzés a v2 azonosítókra (`/api/industry-fit/feedback`) | kész (`occupationId` = O\*NET-SOC) |
| Admin visszajelzés-nézet a v2 katalógusból | kész (a régi kulcsok „régi katalógus" jelöléssel) |
| Régi v1 motor kivezetése | kész — az `industry-fit.ts` már csak wizard-adat (iparágak, címkék, típusok), a rangsoroló kód és a hozzá tartozó teszt törölve |
| F3 validáció — infrastruktúra | kész (`calibration.ts`, `scripts/career-validation/report.ts`, admin Wilson-korlát, fairness-tesztek) |
| F3 validáció — eredmény | ADATRA VÁR: a known-groups n=0, amíg a felhasználók meg nem adják a jelenlegi munkájukat |
| Wizard-visszaállítás („Kezdés elölről") | kész (DELETE /api/profile/career-background) |

## 1. Mai állapot — mi hol van

Egyetlen monolit fájl, `src/lib/industry-fit.ts` (1005 sor), amiben együtt él
a katalógus, a pontozás, a Holland-becslés, a preferencia-egyezés és a
rangsor-boostok.

Fogyasztók:

| Hol | Mit hív | Eltérés |
|---|---|---|
| `CareerCompass.tsx` (képernyő) | `rankCareerSuggestions` | self+observer keverés **a komponensben**; `prefs`, `env`, `leadFocus` csak React state |
| `ProfileTabs.tsx:805` (PDF-export) | `rankCareerSuggestions` | **nincs** observer-keverés, **nincs** prefs, **nincs** leadFocus |
| `OnboardingClient.tsx` | részleges háttér mentése | a wizard előtöltése |
| `api/industry-fit/feedback` | 👍/👎 → `Feedback kind="role_fit"` | gyűlik, de **semmi nem olvassa** vissza a súlyokhoz |

Adatfolyam ma:

```
dims (self) ─┐
             ├─ (self+observer)/2   ← a KOMPONENSBEN, nem a motorban
observer ────┘
facetScores ─── scoreRoleFit ────── score 0-100 + fix ±8/±5 sáv
prefs + env ─── scorePrefMatch ──── prefMatch
riasec ──────── resolveUserRiasec (mért > címke > személyiség-becslés)
                      ↓
   combined = 3 különböző formula-ág + eduBoost(+6) + tagBoost(+4) + riasecBónusz(±3)
                      ↓
   globális top-6  +  jelenlegi iparág top-3  +  developDims (watch-dimenziókból)
```

### 1.1 A „munka" objektum ma

```ts
{ key: "dev", hu: "Fejlesztő", en: "Developer",
  weights: [ {dim:"THOR",direction:"high",weight:0.5},
             {dim:"OPEN",direction:"high",weight:0.3},
             {dim:"TEMP",direction:"low", weight:0.2} ],
  prefs: { people:-1, variety:0, autonomy:1, creation:1 },  // -1..1
  edu: "course",
  env: { pace:0, structure:0, setting:-1 } }                // init tölti fel
```

Külső táblákból kapcsolódik még: `ROLE_RIASEC_OVERRIDE["dev"]="IR"` (2 betűs
string), `FACET_REFINEMENTS["dev"]` (opcionális facet-szintű súlykészlet),
`ROLE_ENV_OVERRIDE`, `INDUSTRY_ENV_DEFAULT`.

Katalógus-méret: **16 iparág / 109 szerep**, mindegyik **pontosan 3 súllyal**,
24 szerepnél van facet-finomítás.

Ami NINCS a szerep-objektumban: stabil külső azonosító (ISCO-08 / O\*NET-SOC),
provenance (honnan a súly), verzió és review-dátum, 6 elemű Holland-vektor,
munkaérték-profil, készség-lista, HU-specifikus belépési útvonal, kereslet.
A súlyok kézi szakértői becslések, szerep-szintű hivatkozás nélkül.

### 1.2 Rangsorolás ma

`alignment = direction === "high" ? v : 100 − v`,
`score = Σ(alignment · w) / Σw` — lineáris, monoton („minél több, annál jobb").

`combined` három ágon:

```
mért Holland + prefs :  0.55·score + 0.20·prefMatch + 0.25·interestMatch
mért Holland, prefs∅ :  0.70·score + 0.30·interestMatch
mért Holland nélkül  :  (prefs ? 0.7·score + 0.3·prefMatch : score) + riasecBónusz(±3)
mindhárom ághoz      :  + eduBoost(+6, iparág-affinitás) + tagBoost(+4)
```

---

## 2. Mérési eredmények (2026-07-30)

Szimuláció: 800 korrelálatlan, normál-szerű profil × 109 szerep, a mai
`scoreRoleFit`-tel. Reprodukálható a repo gyökeréből:

```bash
npx tsx -e "import {INDUSTRIES,scoreRoleFit} from './src/lib/industry-fit'; /* ld. 2.1 */"
```

| Mérés | Érték | Értelmezés |
|---|---|---|
| szerepek közti szórás egy személyen belül | SD **5.3** | egy user 109 szerepe ~15 pontos sávban van |
| konfidencia-sáv (rövid forma) | **±8** | a sáv **szélesebb**, mint a jel, amire rangsorolunk |
| r(C / THOR, átlagos illeszkedés) | **0.82** | a pontszint gyakorlatilag a C-vel egyenlő |
| r(profil-átlag, átlagos illeszkedés) | 0.70 | elevation-hatás, nem illeszkedés |
| THOR „high" előfordulás | **84 / 109 szerep**, a teljes súlymassza ~31%-a | egydimenziós motor |
| dimenziók, amik sok szerepből teljesen kimaradnak | INTE (H) 73, ADAP 68, OPEN 57, RESO 55 szerepnél nincs súly | a H (második legerősebb általános prediktor) alulhasznált |
| becsült Holland-betűk gyakorisága 3000 profilon | E 1298 · I 1208 · S 1153 · R 922 · A 829 · **C 590** | a becslő letűnkénti skálái nem egyneműek |

**Fő diagnózis:** a motor nem *differenciál*. A rangsor tetején 1–3 pontos
különbségek döntenek, amik a mérési hibán belül vannak — miközben a felület
sorrendet, hero-kártyát és „a legerősebb irányod" címkét épít rájuk. Ez a
termék legtámadhatóbb pontja HR-szakmai szemmel.

### 2.1 A szimulációs szkript

A fejlesztés F0 lépésében ez bekerül a repóba
(`scripts/career-engine-simulate.ts`), hogy a metrikák a változások után
újrafuthassanak: profil-generálás → minden szerepre `score` → (a) within-person
SD, (b) r(dim, átlagos fit) minden dimenzióra, (c) győztes-szerep entrópia,
(d) iparág-lefedettség a top-3-ban. Ezek a **regressziós korlátok** a v2-höz.

---

## 3. Hibalista (súly szerint)

1. **Elveszett válaszok.** `prefs`, `env`, `leadFocus` nincs a
   `career-background` zod-sémában → csak memóriában él. Újratöltés után a
   „result" nézet `prefs={}`, `leadFocus=false` mellett számol: **más sorrend,
   mint amit a user a wizard végén látott**. A PDF-ág ráadásul observer-keverés
   nélkül fut → ugyanarra a userre három különböző eredmény.
2. **Irány-vak fejlődési tanács.** A `watchDim` nem hordozza az irányt, a
   `DIMENSION_GROWTH_TIPS` dimenzió-szintű. Példa: ADAP 90-es user a `sales`
   szerepen (ahol ADAP „low" a kívánt) → watchDim = ADAP → a 30 napos terv azt
   tanácsolja, hogy *jobban* hallgassa meg a másik felet, holott a mismatch
   éppen a túlzott engedékenység. Ugyanez minden `low`-irányú súlynál
   (audit/ADAP, QA/OPEN, dev/TEMP, emergency/RESO).
3. **Hamis precizitás.** A facet-mód **szűkíti** a sávot és „facet-pontos"
   badge-et kap, holott 2–3 item/facet mellett a facet-pontszám reliabilitása
   jóval a dimenzió alatt van. A sáv ma konstans (±8 / ±5 / −2), nem a
   tényleges mérési hibából származik.
4. **Monoton illeszkedés.** Nincs ideal-point modell: a „több C mindig jobb"
   feltevés ellentmond a dokumentált curvilinearitásnak (Le et al. 2011;
   Carter et al. 2014 — C és A esetén too-much-of-a-good-thing). A szélsőérték
   ma jutalom, nem jelzés.
5. **Kompozit fekete doboz.** Három formula-ág + nyers pontos boostok
   (+6 / +4 / ±3): a `combined` skálája ágtól függ, 100 fölé mehet, nem
   kalibrálható és nem magyarázható el a usernek.
6. **Végzettség rossz helyen.** Az `edu` csak +6 iparág-affinitás-boost és egy
   🎓 caption; a `eduLevel` és a szerep `edu` igénye nincs összevetve. Alapfokú
   végzettségnél is előre kerülhet a „Orvos". A megvalósíthatóság nem
   illeszkedés — külön tengely.
7. **Holland alulhasznált.** A mért 6 pontszámból csak a top-2 betűt
   használjuk, a szerep oldalán is 2 betű; a congruence = 2 szám átlaga. Nincs
   differenciáltság-ellenőrzés (max−min), így tagolatlan érdeklődésnél is
   rangsorolunk rá. Az `estimateUserRiasec` skálái inkonzisztensek (letűnként
   90 vs 100 maximum, a személyiség-hozzájárulás 0.3–0.8 közt szór,
   `(1 − p("people")) * 15` valójában 0–30-at ad).
8. **Naiv observer-keverés.** Fix `(self + obs) / 2`, értékelő-szám és
   egyetértés nélkül; egy értékelő annyit nyom, mint öt. Nagy self–observer
   eltérésnél a sáv nem szélesedik.
9. **Katalógus-higiénia.** Duplikátumok (`tech/data` ≈ `science/dataanalyst` ≈
   `finance/analyst`), uniform 3 súly szerepenként (nincs „ez a szerep 2
   dologtól függ" vs „ehhez 5 kell"), H (INTE) 73 szerepnél nem szerepel.
10. **Használatlan adatbekérés.** Az `ageBand` semmilyen számításban nem
    szerepel (a wizard „csak hangoláshoz" szöveget mutat) — vagy kapjon szerepet
    (belépési idő keretezése), vagy ne kérdezzük (adatminimalizálás).
11. **Nincs kalibráció.** A `Feedback kind="role_fit"` sorok gyűlnek, de
    egyetlen számítás sem használja őket. Közben van kutatási adat — a
    validáció elérhető közelségben van.

---

## 4. Célarchitektúra

Új réteg, `src/lib/career/`:

```
src/lib/career/
  engine.ts          computeCareerFit() — az EGYETLEN belépési pont
  psychometrics.ts   SE / reliabilitás / sáv / klaszterezés
  interests.ts       Holland: congruence, differenciáltság, forrás-lépcső
  feasibility.ts     belépési távolság (végzettség, licenc, HU útvonal)
  catalog/
    occupations.ts   Occupation[] v2 (vagy JSON + loader)
    families.ts      szerep-családok, dedup-térkép
  legacy.ts          átmeneti adapter az industry-fit.ts exportokhoz
```

### 4.1 Belépési pont

```ts
computeCareerFit(person: PersonInput, catalog: Occupation[], opts?: EngineOptions): CareerFitResult

interface PersonInput {
  dims: Record<DimCode, number>;                 // self, 0-100
  facets?: Record<string, number>;
  form: "short" | "full";
  observer?: { dims: Partial<Record<DimCode, number>>; raterCount: number; agreement?: number };
  interests?: { vector: Record<RiasecLetter, number>; source: "measured" | "tags" | "estimated" };
  prefs: UserPrefs;                              // motiváció + környezet (PERZISZTÁLT)
  leadIntent: "lead" | "expert" | "unsure";
  background: CareerBackground;
}
```

Kimenet szerepenként **négy külön tengely** — nem egy kalapba öntve:

| Tengely | Mit mér | Hogyan |
|---|---|---|
| `demandFit` | személyiség ↔ szerep-igény | ideal-point: cél-érték + tolerancia dimenziónként, `se` és sáv |
| `interestCongruence` | Holland-illeszkedés | teljes 6-vektor congruence + differenciáltság-flag |
| `preferenceFit` | motiváció + munkakörnyezet | a mai `scorePrefMatch`, de tengelyenkénti visszajelzéssel |
| `feasibility` | belépési távolság | `ready / course / vocational / degree / licence` + HU útvonal, lépésekkel |

Plusz két profil-szintű mutató:

- **`general`** — általános munkahelyi propenzitás (C + H, meta-analitikus
  súlyokkal). **Egyszer** jelenik meg a profilon, nem 109-szer a szerepeknél.
- **`differential`** — profil-**centrált** pontszámokból (a személy saját
  átlagát kivonva) számolt illeszkedés. Ez oldja a 0.82-es C-dominanciát: a
  rangsort nem a user általános szintje, hanem a profil *alakja* vezérli.

### 4.2 A munka-objektum v2

```ts
interface Occupation {
  id: "hu.dev.software";                  // stabil, verziózható
  isco08: "2512";  onetSoc?: "15-1252.00";
  labels: { hu: string; en: string };
  family: "tech";  aliases?: string[];
  demand: Array<{
    dim: DimCode; facet?: string;
    target: number;      // 0-100 ideális érték (nem "high"/"low")
    tolerance: number;   // mekkora eltérés még nem számít
    weight: number;
    evidence: "meta" | "onet" | "expert" | "local";   // provenance
    note?: string;
  }>;
  riasec: Record<RiasecLetter, number>;   // 6-vektor
  workValues?: Record<WorkValue, number>; // O*NET 6 (F4)
  env: EnvProfile;  prefs: Record<PrefAxis, number>;
  entry: { level: EduReq; huPath?: string; licence?: boolean; typicalYears?: number };
  version: 2;  reviewedAt: string;  reviewedBy: string;
}
```

Az `evidence` mező a hitelességi alapelv kiterjesztése a katalógusra: minden
súlyról látszik, szakirodalmi, O\*NET-eredetű, szakértői becslés vagy saját
adatból kalibrált-e.

### 4.3 Megjelenítési szabály (a 0.1-es döntés)

- A motor `clusters: OccupationFit[][]` alakban adja vissza a rangsort: egy
  klaszterbe azok a szerepek kerülnek, amiknek a sávja átfed (küszöb: a
  csúcs-szerep sávjával való átfedés > 0).
- A UI klaszteren belül **nem sorrendez** és nem ad „legerősebb" címkét —
  „ez a 4 irány egyformán illik hozzád" keretezéssel mutatja.
- Sorrend csak klaszterek KÖZÖTT jelenik meg.
- A lista diverzifikált: iparágonként max 2 szerep, legalább 3 különböző
  Holland-betű képviselve, plusz egy „nyújtózó" és egy „a mostani területeden"
  tétel.
- Alacsony érdeklődés-differenciáltságnál (max − min kicsi) a felület kiírja,
  hogy az érdeklődés-alapú rangsorolás ilyenkor gyenge jel.

---

## 5. Fázisok

### F0 — kivonás és rögzítés (0,5–1 nap, viselkedés nem változik)

- `src/lib/career/engine.ts`: `computeCareerFit` mint egyetlen belépési pont;
  az `industry-fit.ts` marad adat- és legacy-rétegként (`legacy.ts` adapter).
- A self/observer keverés **a motorba** kerül, értékelő-szám szerinti
  shrinkage-dzsel (`w_obs = k / (k + 2)` a mai fix 0.5 helyett).
- A három `combined`-ág **egy** dokumentált formulába, nevesített
  konstansokkal (`WEIGHTS.demand`, `WEIGHTS.interest`, …), 0-100-ra vágva.
- `scripts/career-engine-simulate.ts` + golden-teszt a mai kimenetre.
- **Kész-kritérium:** a PDF és a képernyő bit-azonos eredményt ad ugyanarra az
  inputra; a szimulációs metrikák riportolva vannak.

### F1 — a három azonnali hiba (1 nap, itt már látszik a UI-n)

- `prefs` / `env` / `leadIntent` perzisztálás: Prisma-mező bővítés + zod séma
  + a PDF-ág ugyanabból az inputból számol.
- Irány-tudatos watch/growth: a `watchDim` mellé `direction`, és a növekedési
  szöveg pólusonként (`DIMENSION_GROWTH_TIPS[dim][pole]`).
- Reliabilitás-alapú sáv: `SE_fit = √(Σ wᵢ² · SEᵢ²)`, ahol az `SEᵢ` a facet /
  dimenzió item-számából és a saját adatból számolt reliabilitásból jön. A
  facet-mód **szélesíti** a sávot; a „facet-pontos" badge szövege ehhez
  igazodik („facet-szintű, nagyobb bizonytalansággal").
- Klaszteres megjelenítés a hamis sorrend helyett (0.1 döntés).
- **Kész-kritérium:** wizard → reload → PDF ugyanazt a rangsort adja; nincs
  olyan szerep-pár, ami átfedő sávval sorrendezve jelenik meg.

### F2 — katalógus v2 (2–3 nap)

- Ideal-point `demand` profilok (target + tolerance) a mai `direction`-ok
  helyett; szerepenként 2–6 komponens, nem uniform 3.
- 6-vektor Holland minden szerephez (a 2 betűs kód levezetett érték marad).
- ISCO-08 / O\*NET azonosítók, `evidence`, `version`, `reviewedAt`.
- Dedup (`data` / `dataanalyst` / `analyst` összevonás vagy elkülönítés
  indoklással), szerep-családok.
- H (INTE) bevezetése ott, ahol a szakirodalom támogatja (integritás-érzékeny
  szerepek), C-súly visszavétele ahol csak „általános szorgalom" volt.
- `general` / `differential` szétválasztás bekötése a felületre.
- Katalógus áttolása JSON-ba (vagy jól szerkeszthető TS-tömbbe), hogy
  nem-fejlesztő is review-zhassa.
- **Kész-kritérium:** a szimulációban r(C, átlagos fit) < 0.45, a within-person
  szerep-szórás > 10, és minden iparág megjelenik valamely profil top-3-ában.

### F3 — validáció (szakdolgozat-fejezet) — INFRASTRUKTÚRA KÉSZ

- `currentIndustry` → `currentRole` bővítés (opcionális kérdés), majd
  **known-groups** vizsgálat: az X szerepben dolgozók valóban magasabb
  `demandFit`-et kapnak-e X-re, mint mások.
- A `Feedback kind="role_fit"` sorokból szerepenkénti találati arány; admin
  kalibrációs nézet, ami megjelöli a véletlen alatt teljesítő szerepeket.
- Fairness-teszt a CI-ben: 10k szimulált profil — minden iparág megjelenik
  valakinek a top-3-ában, egyik sem gyakoribb X%-nál.
- **Kész-kritérium:** a validációs számok dokumentálva; a katalógus azon
  szerepei, amiknél a feedback ellentmond a súlyoknak, `evidence: "local"`
  jelöléssel felülvizsgálva.

### F4 — opcionális kiterjesztések

- 12 itemes munkaérték-kérdőív (O\*NET Work Values mintájára) a Holland mellé.
- HU-specifikus belépési útvonalak (szakma, diploma, kamarai tagság,
  tipikus idő) a `feasibility` szöveges kimenetéhez.
- Kereslet-jelzés (ha van megbízható, ingyenes forrás) — külön badge, nem a
  fit része.

---

## 6. Kockázatok és mérséklés

| Kockázat | Mérséklés |
|---|---|
| A klaszteres nézet „bizonytalannak" tűnik a usernek | A keretezés a hitelesség része: „négy irány egyformán illik" konkrétabb ígéret, mint egy hamis első hely. A hero-kártya klaszter-szinten is tud erős lenni (közös nevező megnevezése). |
| A v2 katalógus munkája nagy | F2 szerep-családonként bontható; a v1 súlyok `evidence: "expert"` jelöléssel átvehetők, nem kell nulláról indulni. |
| A `differential` pontszám félreérthető | A UI két számot mutat, világos címkével: „általános munkahelyi alap" (profil-szint) és „ehhez a szerephez képest" (alak). |
| Reliabilitás-becslés a saját adatból bizonytalan kis N-nél | Konzervatív alapérték (a mai ±8-nál nem szűkebb), amíg az N nem elég; a sáv szűkítése csak adattal indokolható. |

## 7. Nyitott kérdések

1. `prefs` / `env` / `leadIntent` perzisztálás helye: a `careerBackground`
   JSON-mező bővítése (egyszerűbb) vagy külön `CareerPreference` modell
   (tisztább, verziózható)?
2. A `general` mutató megjelenjen-e a usernek egyáltalán, vagy csak a
   tanácsadói nézetben? (Etikai megfontolás: „általános munkahelyi propenzitás"
   könnyen alkalmasság-ítéletként olvasható.)
3. `ageBand`: kapjon szerepet a `feasibility`-ben, vagy kivezetjük a wizardból?
4. F2-ben a katalógus JSON-ba kerüljön (review-zható) vagy maradjon TS
   (típusbiztos)? Kompromisszum: TS `satisfies` + generált JSON-export a
   review-hoz.

---

## 8. F3 — hogyan futtasd a validációt (2026-07-30)

```bash
npx tsx scripts/career-validation/report.ts                    # konzol-riport
npx tsx scripts/career-validation/report.ts --json out.json    # gépi kimenet is
```

**Known-groups.** A felhasználó a karrier-fülön megadhatja a jelenlegi
foglalkozását (`CurrentRolePicker`, katalógus-kereső). A riport azt nézi, hogy a
saját, betöltött szerep hányadik percentilisben van a SAJÁT rangsorában. Ha a
motor nem mérne semmit, ez átlagosan 50 lenne; a szisztematikus eltérés a
bizonyíték. A mező a rangsorolásba nem számít bele — külön van tárolva
(`careerBackground.currentOccupationId`), hogy ne legyen körkörös.

**Kalibráció.** A „találó volt?" visszajelzések foglalkozásonként, **Wilson-féle
95%-os alsó korláttal**: kis mintánál a nyers arány félrevezet (1/1 = 100% nem
bizonyíték). Felülvizsgálandónak csak azt jelöljük, ahol legalább 5 szavazat van
és a NEM-találó arány alsó korlátja is 50% fölött van. Ugyanez látszik az admin
Visszajelzések fülén (`Wilson-alsó` oszlop + ⚠).

**Fairness-korlátok a CI-ben** (`tests/unit/career/fairness.test.ts`, determinisztikus
ál-véletlennel): egy szakmacsalád sem viheti a top-3 ajánlások negyedénél többet;
legalább 15 szakmacsalád megjelenik; 300 profil mellett a katalógus több mint
harmada előfordul; két ellentétes profil top-10-e legfeljebb 3 tételben fedi egymást.

**Jelenlegi állás:** known-groups n = 0 (még senki nem adta meg a munkáját),
kalibráció n = 1. A számok akkor válnak értelmezhetővé, ha a pilot-körben
összegyűlik pár tucat adatpont — a t-próba és a Cohen d n < 30 alatt jelzésként
van kiírva, nem következtetésként.

---

## 9. Finomítások (2026-07-30, valós felhasználói visszajelzés alapján)

Diagnózis a `kilinko@me.com` beállításaival (`npx tsx scripts/career-validation/diagnose-user.ts <email>`):

| Panasz | Mi volt valójában | Javítás |
|---|---|---|
| „nem veszi figyelembe a Holland-kódom" | Használta, de a wizardban bejelölt iparág (tech) HARD SZŰRŐ volt, és kiszűrte azt a ~470 szerepet, amerre a mért E-domináns kód mutatott | Az iparág-választás **kiemelés** lett (+5 rang-bónusz, `industry-pick` jelölés), nem szűrés. Ha a bejelölés ellentmond a mért kódnak, a felület ki is írja. |
| „nem látom a Holland-kódom" | Sehol nem jelent meg | Fejléc-blokk: a kód, mind a hat betű értéke, a betűk jelentése tooltipben, és hogy **hány százalék súllyal** számít |
| „végzettségem alatti munkákat ajánl előre" | A lista vegyesen tartalmazta a `course`/`vocational` belépésű szerepeket | Három szakasz: **Most elérhető** (a szintednek megfelelő) · **Tanulással elérhető** · **A végzettséged alatti** (összecsukva) |
| — | Az érdeklődés súlya forrástól függetlenül 0.30 volt | Forrás szerint: **mért 0.35 · címke 0.25 · becsült 0.15** — a becsült kód ne vezérelje a rangsort |

### Kérdés-audit — mit kérdezünk és miért

| Kérdés | Számol vele a motor? | Döntés |
|---|---|---|
| Mi jellemez most (tanulok/dolgozom/váltanék) | a „jelenlegi területed" blokk vezérlése | marad |
| Legmagasabb végzettség | igen — megvalósíthatóság és szakaszolás | marad |
| Képzési **terület** (max 3) | **nem** (a v1 iparág-affinitása volt, a v2 nem használja) | **kivezetve** |
| **Kor** (sáv) | nem | **kivezetve** — a születési év a profilban van, kiszámolható |
| Érdeklődés-**címkék** (max 4) | csak Holland-kérdőív híján, gyengébb proxy | **kivezetve** — helyette a Holland-kérdőív (mért), ennek híján személyiség-alapú becslés |
| Érdeklődő iparágak (max 3) | igen — kiemelés | marad |
| Jelenlegi terület | igen — külön blokk | marad |
| Munka-preferenciák (4 tengely) | igen | marad |
| Munkakörnyezet (3 tengely) | igen | marad |
| Vezetői szándék | igen — súly-eltolás | marad |

A wizard így **9 lépésről 7-re** rövidült.

### Megjelenítési döntések (user, 2026-07-30)

- **Az „Általános munkahelyi alap" (C·0,6 + H·0,4) NEM jelenik meg a felhasználói
  nézetben.** Csupasz számként osztályzatnak olvasható, márpedig a self-riport nem
  értékel. Az érték a szolgáltatás kimenetében marad (`result.general`) a későbbi
  tanácsadói nézethez — ezzel a tervben nyitva hagyott etikai kérdés lezárva.
- **FEOR-kód és FEOR-megnevezés nem jelenik meg** a szerep-kártyákon, a
  foglalkozás-keresőben és a PDF-ben sem (egyelőre). Az adat megvan a
  katalógusban; a forrás-blokk (licencfeltétel) továbbra is nevesíti a KSH-t.


---

## 10. Szakirány-tudatos hozzáférés (2026-07-30)

**Probléma:** „a végzettséged elég" sokszor hazugság volt — egy közgazdász diploma
nem képesít ápolónak, és egy diploma önmagában nem nyit meg szabályozott szakmát.

**Adat:** az O\*NET **CIP-crosswalkja** (Classification of Instructional Programs)
megmondja, milyen képzési programokból vezet út egy foglalkozásba. A 2 jegyű
CIP-családokat a wizard magyar képzési-terület kategóriáira képezzük
(`scripts/career-catalog/step9_cip_fields.py`): **477-ből 404 tételnek** van így
szakirány-adata (`occupation.eduFields`).

**Négy állapot** (`feasibility.state`), és amit a felhasználó lát:

| Állapot | Feltétel | Szöveg |
|---|---|---|
| `field-match` | a szint megvan ÉS a szakirány egyezik | „a szakirányod illik hozzá" |
| `level-only` | a szint megvan, de más/ismeretlen szakirány | „a szinted megvan, de más szakirány" |
| `licence-needed` | szabályozott szakma, és nincs meg hozzá a szakvizsga + szakirány | „szabályozott szakma — szakvizsga / kamarai tagság kell" |
| `training-needed` | a belépési szint magasabb a végzettségnél | „képzés kell hozzá — …" |

A szabályozott szakmáknál a **szakirány feltétel, nem opció**: hiába van diploma
és akár szakvizsga is, ha más területen van, az állapot `licence-needed` marad.

**Végzettségi szintek**: a skála 5 fokú lett — `primary · secondary · vocational ·
higher · specialized` (szakvizsga / kamarai tagság). A wizardba visszakerült a
**szakirány-kérdés** (max 3 terület) — most már számol vele a motor, tehát nem
felesleges kérdés.

**Megjelenítés:** a „Most elérhető" szakaszon belül, a klasztereken belül a
szakirány-egyezés kerül előre (a klaszteren belül illeszkedés-sorrend úgysem
értelmezhető).


---

## 11. Kétlépcsős (interest-led) rangsorolás — 2026-07-30

**Döntés (user):** az 1. opció — az érdeklődés + preferencia jelöli ki a
halmazt, a személyiség rendez azon belül, és ezt ki is mondjuk a felületen.

**Miért ez a helyes sorrend.** A két konstruktum MÁS kritériumot jósol: az
érdeklődés-kongruencia a választást, a kitartást és az elégedettséget (Nye és
mtsai, 2012), a személyiség (C, H) a teljesítményt és a kontraproduktív
viselkedést (Barrick & Mount, 1991; Sackett és mtsai, 2022). A self-réteg
kérdése „merre induljak" — az választás-kérdés. Adatoldalon is ez erősebb: a
katalógus Holland-vektora MÉRT O\*NET-adat, a személyiség cél-profil viszont
szakértői loading-mátrixból származtatott becslés.

**Hogyan fut:**

1. **Jelölt-halmaz** — `choiceScore = 0,7 · érdeklődés-kongruencia + 0,3 ·
   preferencia-egyezés`. A halmaz RELATÍV: a legjobb pontszámtól legfeljebb
   12 ponttal elmaradó tételek, 30 és 60 közé vágva. (Fix, bő halmaz — pl. 120 —
   nem működik: a 2. lépcső visszaveszi a vezetést, és pont az veszik el, amiért
   a kétlépcsős rendezés készült.)
2. **Sorrend a halmazon belül** — `rank = demandFit` (személyiség ideal-point),
   a klaszterezés ennek a hibasávján fut (`orderedBy: "demandFit"`).

**Mikor NEM indul:** ha az érdeklődés-kód **becsült** (nincs kitöltött kérdőív),
vagy a profil differenciálatlan. Ilyenkor marad a kompozit rangsor, mert a
személyiségből becsült „érdeklődéssel" válogatni körkörös lenne. A felület
mindkét esetben kiírja, mi rendezi a listát.

**Előfeltétel, ami megépült:** az érdeklődés-kérdőív bekerült a wizardba önálló
lépésként (kitöltöm / most kihagyom), nem csak az eredmény után ajánljuk.

**Az iparág-jelölés helye:** a bejelölt iparágak a **jelölt-halmaz** pontszámába
számítanak (+5 a `choiceScore`-ra), nem a sorrendbe. Enélkül interest-led módban
nulla hatásuk lett volna: a 2. lépcső felülírja a kompozit rangot, és vele a
bónuszt is.

**Kártya-szintű indoklás:** „Azért van a listán, mert az érdeklődésed és a
preferenciáid ide húznak (73%). A sorrendben azért van itt, mert a legerősebb
komponens a Nyitottság: a szerep tipikus sávja 71 körül van, nálad 79."

---

## 12. Scope-alapú lista (kimondott szándék = kemény szűrő) — 2026-07-30

**Jelszint-hierarchia (user-döntés):** 1) kimondott szándék (bejelölt iparágak,
státusz, jelenlegi terület) adja a HALMAZT — kemény szűrő; 2) a mért Holland-kód
+ preferenciák adják a SORRENDET; 3) a személyiség a klasztereken belül rendez
és tételenként annotál — nem szűr. Indok: a kimondott érdeklődés a
pályaválasztás legerősebb prediktora (Whitney 1969; Slaney), és a rendszer nem
bírálhatja felül láthatatlanul, amit a felhasználó kimondott.

**Iparág-címkék:** `occupation.industries` (többes) — `step10_industry_tags.py`:
ISCO-2 inverz térkép + kurált ISCO-4 tábla (vezetői + határterületi csoportok) +
magyar név-kulcsszavak. 5 univerzális szerep (üres címke = minden scope-ban
megjelenik, pl. ügyvezető). Ez oldotta meg, hogy az „Informatikai igazgató"
(ISCO 1330) kiesett a prefix-alapú tech-szűrőből. Review-Excel:
`docs/product/data/industry-tags-review.xlsx`.

**Motor:** `options.scope` — szűrés a címkéken, 8 tételes padlóval (alatta nem
szűrünk, `meta.scopeWidened` + felület-jelzés). `strategy: "scoped"`: rang =
`choiceScore` (0,7 érdeklődés + 0,3 preferencia) + 6 pont metszet-bónusz, ha a
szerep TÖBB bejelölt területet fed (`industry-intersect` flag); klaszteren belül
a személyiség (demandFit) rendez. Scope-feloldás a service-ben: bejelölés = scope;
„dolgozom + csak a saját területem" = stay-mód; üres = a 11. szakasz
interest-led logikája.

**Felület:** a sáv kimondja a szűrőt és a sorrend-logikát; „Szűrés nélkül is
megnézem" kapcsoló (vissza is); tétel-szintű jelzők: „több bejelölt területed
metszete", „az érdeklődés-kódodtól eltér (x%)" (<55), „a személyiségeddel
kevésbé harmonizál" (demandFit<55). A wizard érdeklődés-lépése kimondja, hogy a
bejelölés szűrő.


### 12.1 Pontosítások a Látszerész-esetből (2026-07-30)

Panasz: eü-diplomás, eü-ben dolgozó, eü-be váltó felhasználó a top-listában
szakma-szintű Látszerészt kapott. Három ok, három javítás:

1. **Szint-csúszás a szakaszolásban.** A „Most elérhető" egy szintnyi lefelé
   engedett (entry >= edu−1), így diplomásnál a vocational-belépésű szerepek a
   fő listába kerültek. Új szabály (`AT_LEVEL`): a fő szakasz PONTOSAN a szint
   (specializáltnál higher+specialized, érettséginél open+course); minden ez
   alatti a „Végzettséged alatti" összecsukott szakaszba megy — az lefelé-váltás,
   nem alap-ajánlat.
2. **53-as ISCO-csoport szétválasztása.** A prefix-öröklés a pedagógiai
   asszisztenseket (5312) egészségügynek címkézte; a rekreáció (3423) szintén
   klinikumnak tűnt. Kurált ISCO-4 sorok: 5311/5312 → oktatás, 5321/5322/5329 →
   egészségügy, 3423 → szolgáltatás+oktatás.
3. **A szakirány nem számított a sorrendben.** Scoped módban a `field-match`
   állapot +6 rang-bónuszt kap — a szakirány kimondott jel (a diploma területe),
   nem mérés, tehát a jelszint-hierarchia 1. szintjére tartozik.

Ellenőrzés szintetikus eü-personával (S-domináns kód, higher+health): MOST =
Intenzív terápiás szakápoló · Közösségi eü. dolgozó · Eü. intézményvezető;
TANULÁSSAL = Dietetikus · Eü. szociális munkás · Iskolapszichológus; a Látszerész
és az Ápolási asszisztens a összecsukott „szint alatti" szakaszban.
Regressziós tesztek: tech- és health-címke őrzők a `catalog.test.ts`-ben.

## 13. Vétó-rendszer (determinisztikus kizárás) — 2026-07-30

**Probléma.** A lista a beállítások ellenére is adhat kirívóan oda nem illő
tételt (valós eset: a felhasználó nem szeretne gyerekekkel foglalkozni, mégis
dadust kapott). LLM helyett determinisztikus megoldás: a kifogások eloszlása
fejnehéz — egy ~15 elemű zárt szótár lefedi a valós elutasítás-okok tömegét.

**Vétó-címkék** (`occupation.attrs`, `VetoTag` a types.ts-ben): children, care,
blood, customers, sales, conflict, shift, physical, outdoor, screen, driving,
heights, hazard, monotony, animals.

**Címkézés** (`step11_veto_tags.py`): O*NET Work Context (CX küszöbök:
betegség-expozíció, magasság, veszély, kültér, jármű, konfliktus, ügyfél, ülés,
ismétlődés) + Work Activities (IM: gondozás, értékesítés, fizikai munka,
járművezetés) + Work Schedules (CTP 2. kategória ≥ 40% = szabálytalan
munkarend); ahol nincs O*NET-mérés (gyerekek, állatok): ISCO-4 struktúra +
név-kulcsszó; hiányzó SOC-adatnál ISCO-4 csoportátlag fallback; SOC-szintű kézi
felülbírálás réteg. Review-Excel: `docs/product/data/veto-tags-review.xlsx`.

**Motor.** `person.vetoes` KEMÉNY szűrő a scope után (kimondott szándék, 1.
jelszint) — vétózott címkéjű szerep soha nem kerül a listába. `only`-szűkítésnél
(kifejezetten kért összevetés) nem fut. A kizárt darabszám a
`meta.vetoExcluded`-ben — a UI kiírja (nincs néma eltüntetés).

**UI.** Wizard-lépés az érdeklődés-területek után: „Mivel NEM szeretnél
foglalkozni?" — max 5 chip, kihagyható; az eredmény-nézetben banner: mit zártál
ki + hány szerep esett ki. Mentés a careerBackground.vetoes-ba (zod-enum),
teljes reset törli.

**Garancia** (LLM-mel szemben): a precizitás a címkézett halmazon 100% —
unit-teszt mondja ki, hogy children-vétó mellett soha nincs dadus/óvodapedagógus
a listában (`engine.test.ts`), a kritikus címkék regresszió-őrök
(`catalog.test.ts`). A lefedettséget (recall) a review-Excel és a későbbi
„Nem nekem való" visszajelzés-hurok bővíti; szabadszöveg-értelmezés (LLM mint
fordító ugyanerre a szótárra) opcionális későbbi réteg.
