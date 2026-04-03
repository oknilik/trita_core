# Team Intelligence Audit (2026-04-02)

## Scope

Auditált felületek:

- `/team/[id]?tab=intelligence`
- `/team/[id]?tab=profile`
- `/team/[id]?tab=team-role` (UI-ban: Csapatszerepek)
- overview nézetből ide vezető belépési pontok

Audit szempontok:

- mennyire relevánsak a mutatott eredmények
- milyen logika áll mögöttük (valós adat vs heurisztika/dummy)
- UI/UX érthetőség, döntéstámogatás, mobil használhatóság

---

## Rövid összkép

Jelen állapotban a csapatintelligencia réteg **vegyesen erős és gyenge**:

- A **Team Profile** (heatmap + átlagok + insightok) többnyire valós adatra épül.
- A **Team Pattern** logika szakmailag a legerősebb rész.
- Az **Intelligence Map / Dynamics / Role Fit** nézeteknél több helyen heurisztika és hiányzó adatforrás miatt a kimenet részben félrevezető.
- A UI több külön világot kever (vizuális “showcase” vs döntéstámogató dashboard), így a felhasználó nehezen érti: “mi biztos, mi becsült, mi következő teendő”.

---

## Relevancia értékelés modulonként

### 1) Team Pattern kártya

Relevancia: **7.5/10**

Mi jó:

- Valós HEXACO self adatra épül.
- Van threshold, stability, confidence, alternative pattern, style distance.
- Kimenet vezetői akciókat is ad.

Fő limit:

- Hardcoded küszöbök és szövegek, nincs kalibráció tenant/org baseline-hoz.
- Főleg self-assessment alapú, observer input nincs beépítve a pattern motorba.

Forrás:

- `src/lib/team-pattern.ts`
- `src/components/team/TeamPatternCard.tsx`

### 2) Team Profile (heatmap + TeamInsights)

Relevancia: **7/10**

Mi jó:

- Tényadatokra épülő dimenzióátlagok és member-szintű score vizualizáció.
- Diverzitás (szórás) is megjelenik.

Fő limit:

- Insight copy többnyire általános, kevéssé kontextusfüggő.
- “Top strength / growth area” túl egyszerű top-bottom logika.

Forrás:

- `src/components/team/TeamProfileTab.tsx`
- `src/components/manager/TeamHeatmap.tsx`
- `src/components/manager/TeamInsights.tsx`
- `src/lib/team-stats.ts`

### 3) Intelligence / TeamMap

Relevancia: **3.5/10**

Fő gondok:

- A `skillLevel` és `growthPotential` heurisztikus (C, illetve O+X), nincs termékoldali validáció.
- A member baseline több helyen fix 2/2 érték.
- Becslés jelölés és “no data” kezelés inkonzisztens.

Forrás:

- `src/components/team/TeamMap.tsx`
- `src/app/team/[id]/page.tsx`

### 4) Intelligence / DynamicsMap

Relevancia: **1/10** (jelenleg)

Fő gond:

- A route fixen `edges={[]}`-t ad át, így a dinamika nézet gyakorlatilag üres állapot.

Forrás:

- `src/app/team/[id]/page.tsx` (`edges={[]}`)
- `src/components/team/DynamicsMap.tsx`

### 5) Intelligence / RoleFitMap

Relevancia: **2.5/10**

Fő gondok:

- Zóna-besorolás top1 dimenzió alapján történik (`A` -> mediator, `C` -> executor stb.).
- A modell túlzottan leegyszerűsített, nincs multi-factor fit vagy confidence.

Forrás:

- `src/components/team/RoleFitMap.tsx`

### 6) Csapatszerepek (Csapatszerep becslés)

Relevancia: **5/10**

Mi jó:

- Expliciten becsült (HEXACO->Csapatszerep súlyozás), több hasznos role-balance nézettel.

Fő limit:

- Nem valódi Csapatszerep mérés; becslési hiba potenciál magas.
- Több helyen továbbra is “Csapatszerep” terminológia maradt a copy/key rétegben.

Forrás:

- `src/components/team/TeamCsapatszerepSection.tsx`
- `src/lib/team-role-estimate.ts`

---

## Kritikus gapek (prioritás szerint)

## P0 (hitelesség / bizalom)

1. **Dynamics adatforrás hiányzik**, de UI létezik.
2. **Intelligence map részben synthetic**, és nincs elég jól jelezve mi becslés.
3. **Eredmények confidence framingje nem egységes** a három intelligence alnézetben.

## P1 (döntéstámogatás)

1. Az intelligence UI jelenleg “szép nézet”, de gyenge “mit tegyek most” támogatás.
2. A profile + pattern + role nézetek között nincs közös narratíva.

## P2 (technikai debt)

1. `TeamPageShell` és `TeamOverviewTab` jelenleg nem használt (legacy párhuzamos branch).
2. Több hardcoded vizuális szín és stílus maradt az intelligence komponensekben.

---

## Javasolt javítások (logika)

## 1) “Evidence-first” modell bevezetése

Minden intelligence modul kapjon kötelező meta mezőket:

- `dataQuality`: `none | partial | sufficient`
- `dataSource`: `self | self_plus_observer | inferred`
- `confidence`: `low | medium | high`
- `explain`: rövid “mi alapján számoltuk”

Ez UI-ban minden modul fejlécében látszódjon.

## 2) DynamicsMap átmeneti szabály

- Amíg nincs valós edge forrás, a DynamicsMap ne legyen külön tab.
- Helyette “Kapcsolati dinamika hamarosan” teaser + mi kell hozzá.
- Vagy: explicit “szimulált” címke, ha heurisztikát használunk.

## 3) TeamMap újradefiniálás

Opció A:

- Marad, de neve “Potential Matrix (beta)” és kötelező confidence.

Opció B (javasolt):

- Cseréljük le “Contribution Matrix”-ra, ahol a tengelyek:
  - `delivery reliability` (C + historical completion signal)
  - `change adaptability` (O + X + observer trend)

No-score member ne kapjon “normál pontot”, külön “adat hiányzik” bucketbe kerüljön.

## 4) RoleFitMap új modell

- Top1 dim alapú if-else helyett weighted archetype fit.
- Minden taghoz top2 fit + confidence.
- “Missing role” csak minimum sample és min confidence mellett jelenjen meg.

## 5) Csapatszerepek modul tisztázása

- Terminológia egységesítés: “Csapatszerepek (HEXACO-becslés)”.
- Csapatszerep szó ne jelenjen meg user-facing felületen.
- Rövid módszertani disclaimer kötelező.

---

## Javasolt UI újratervezés (nem tab-heavy)

Javasolt új IA a csapat áttekintés alatt:

1. **Állapotkép** (marad)
2. **Csapat intelligencia** (egy oldalon, vertikális blokkok)
   - A. Team Pattern + confidence + 3 teendő
   - B. Team Profile (heatmap condensed + 2 insight + 1 kockázat)
   - C. Csapatszerepek (distribution + hiány/túlsúly + vezetői akció)
   - D. (opcionális) Dinamika blokk csak ha tényleges adat van

Mobil-first viselkedés:

- Nincs belső al-tab csúszás.
- Blokkok accordionként nyithatók.
- Sticky “Következő lépés” CTA alul.

Vizualitás:

- Kevesebb “canvas-jellegű” diagram, több döntési kártya.
- Egységes status/chip/token rendszer.
- Minden blokk kapjon: “Mit látok” + “Mit tegyek”.

---

## Konkrét implementációs terv

## Fázis 1 (1-2 nap): hitelességi javítás

1. Dynamics tab ideiglenes kivonása vagy explicit beta állapot.
2. Intelligence payloadhoz `confidence/dataSource/dataQuality` meta.
3. No-score tagok külön kezelése matrix nézetekben.

## Fázis 2 (2-3 nap): IA + UI refaktor

1. Team intelligence al-tabok kiváltása blokkos elrendezéssel.
2. TeamPattern, TeamProfile, Team roles “single narrative” komponensbe rendezése.
3. Mobilra accordion + olvasható cards.

## Fázis 3 (2-4 nap): model quality

1. Role fit új scoring.
2. Potential matrix újrafogalmazás vagy kiváltás.
3. Observer-alapú dinamika edge modell (ha adatmodell elérhető).

---

## Teszt javaslat (minimum)

- Unit:
  - role fit scoring
  - potential matrix scoring
  - confidence/dataQuality resolver
- Integration:
  - `getTeamPageData` + intelligence contract shape
- E2E smoke:
  - `/team/[id]?tab=overview`
  - team intelligence blokkok render low/medium/high data quality állapotban

---

## Döntési javaslat

Rövid távon a legjobb ROI:

1. **ne mutassunk pseudo-dinamikát valós edge nélkül**,  
2. **egységes confidence framinget adjunk minden insight mellé**,  
3. **tabos mini-világ helyett blokkos, vezetői döntést támogató IA-ra váltsunk**.

Ez gyorsan javítja a bizalmat, érthetőséget és a gyakorlati használhatóságot.
