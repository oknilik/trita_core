# Interakció-összehasonlítás lefedettség-audit (/interaction, /interaction?pair)

> Kérdés (2026-08-18): a két profil összevetése ma a két domináns dimenzió
> mentén történik — kevés információt ad. Kiterjeszthető-e a többi
> dimenzióra és a facetekre?
>
> Rövid válasz: **igen, és a szűk keresztmetszet nem ott van, ahol
> látszik.** Nem a „csak két dimenziót nézünk" szabály szorítja a
> kimenetet, hanem a pólus-kapu (>65 / <35), ami egy átlagos kitöltőnél
> 6-ból csak ~2 dimenziót enged be. A dimenzió-kiterjesztés olcsó és
> psichometrikusan védhető; a facet-kiterjesztés csak SZŰKEN az.
>
> Mérés: `npx tsx scripts/diagnose-interaction-coverage.ts` (determinisztikus,
> DB nélkül futtatható — a számok újraellenőrizhetők).
>
> **ÁLLAPOT (2026-08-18): az L1, L2 és L4 lépcső MEGVALÓSULT.** Az eredményt
> a 7. szakasz rögzíti; az alábbi elemzés a bevezetés ELŐTTI állapotot írja
> le, és úgy is olvasandó.

## 1. Mit csinál ma a motor

`src/lib/interaction-engine.ts` — `simulateInteraction(self, other)`:

1. Mindkét oldalon kiválasztja a **pólusos** dimenziókat: `>65` = high,
   `<35` = low (`PROFILE_HIGH_THRESHOLD` / `PROFILE_LOW_THRESHOLD`). A
   középsáv **szándékosan néma**.
2. A két pólus-halmaz minden párosítására megkérdezi az atom-indexet
   (`interaction-atoms.ts`, 30 atom).
3. A találatokat `FRICTION_WEIGHTS × pólus-erősség` szerint rangsorolja,
   és **legfeljebb 3-at** választ ki úgy, hogy mindegyik ÚJ dimenziót
   hozzon.
4. A kiválasztott atomok szövegeit három blokkba rendezi (*ami magától
   megy · ahol súrlódás várható · mit beszéljetek meg előre*).

Fontos: a motor **elvileg mind a 6 dimenziót nézi** — a „két domináns
dimenzió" nem a motorban, hanem a bemenetben és a kapukban él.

## 2. Mérés — mennyit lát ma a profilból

`scripts/diagnose-interaction-coverage.ts`, `DIFF_MIN_GAP = 11` (√2·SEM).

| | pólusos dim / profil | atom / pár | ÜRES kimenet | **megszólaló dim** | mérési hibát meghaladó eltérés |
|---|---|---|---|---|---|
| **Szintetikus pár** (realisztikus: mért SD-kből) | 1,98 / 6 | 1,06 | **34,7 %** | **1,39 / 6** | **3,83 / 6** |
| **Persona pár** (sarkos fixture, legjobb eset) | 2,86 / 6 | 2,05 | 1,2 % | 2,75 / 6 | 3,42 / 6 |
| **Archetípus-út** (`/interaction` alapértelmezés) | 2,00 / 6 | 1,37 | 19,9 % | 1,90 / 6 | 3,79 / 6 |

Olvasata:

- Egy **átlagos valós páron a kimenet 6-ból 1,39 dimenzióról szól**, és
  minden harmadik pár **egyáltalán semmit nem kap** (a felület ilyenkor a
  „nincs elég markáns eltérés" üzenetet mutatja).
- Ugyanezeken a párokon **3,83 dimenzión van olyan eltérés, ami
  MEGHALADJA a mérési hibát** — tehát elmondható volna. A kimondott és a
  kimondható közti rés **~2,8×**.
- A persona-sor azért fontos, mert a fejlesztés és a demók ezen futnak
  (2,75/6, 1,2 % üres) — **a fixture-készlet szisztematikusan jobb képet
  mutat, mint a valóság.** Ez magyarázza, miért nem tűnt fel eddig.

## 3. Miért szűk — négy ok, sorrendben

**(1) A pólus-kapu, nem a plafon.** Ez a legfontosabb lelet. A `maxAtoms`
emelése gyakorlatilag semmit nem ad:

```
maxAtoms=3 : atom 1,06 · megszólaló dimenzió 1,39/6
maxAtoms=6 : atom 1,09 · megszólaló dimenzió 1,42/6
maxAtoms=12: atom 1,09 · megszólaló dimenzió 1,42/6
```

A plafon **soha nem telik be** valós profilokon. A kimenet azért rövid,
mert kevés atom AKTIVÁLÓDIK, nem azért, mert levágjuk. A „mutassunk
többet" típusú javítás önmagában hatástalan.

**(2) A modell PÓLUS-alapú, holott a párdinamika RÉS-alapú.** Az atom
csak akkor szólal meg, ha MINDKÉT fél pólusos ugyanazon (vagy két
kapcsolódó) dimenzión. Ezért egy 62 vs 38 pár a Lelkiismeretességen —
24 pontos rés, a mérési hiba (11) **több mint kétszerese** — ma
**semmit** nem produkál, mert egyik fél sem éri el a 65-öt. Márpedig a
platform saját súrlódás-modellje (`friction-model.ts`) éppen a súlyozott
|Δ|-ra épül, és a csapat-nézet (`DynamicsMap`) már így számol. Az
interakció-motor ezt a modellt nem használja.

**(3) Az atom-bank kereszt-fele 20 %-os.**

| | megvan | lehetséges |
|---|---|---|
| azonos dimenziós atom | 18 | 18 (teljes) |
| kereszt-atom | **12** | **60** (15 dimenzió-pár × 4 pólus-kombináció) |

A hiányzó 48 slot élén pont a `FRICTION_WEIGHTS` szerint legerősebbek
állnak: `A×C` (3 kombináció hiányzik), `C×H` (mind a 4), `A×H` (3),
`C×E` (3).

**(4) Az archetípus-út szerkezetileg 2 dimenziós.** Az
`archetypePrototype()` recept: domináns 86, második 74, **a maradék négy
pontosan 50**. Az az 50 definíció szerint középsávos → soha nem aktivál
atomot. Az „ő" oldala tehát **2/6 dimenzión** hordoz információt, bármit
teszünk a motorral. Ez a felhasználó által észlelt „két domináns
dimenzió mentén" — és ez a `?pair` valós útra **nem** igaz, ott mind a 6
elérhető, csak a (2)-es ok miatt néma marad.

## 4. Mit lehet kiterjeszteni — négy lépcső

### L1 — Rés-alapú aktiválás a hat dimenzión (a legnagyobb hozam)

A pólus-kapu mellé (nem helyette) egy **eltérés-kapu**: ha
`|Δ| ≥ DIFF_MIN_GAP` (11 = √2·SEM) egy dimenzión, a pár arról a
dimenzióról kap mondatot — akkor is, ha egyik fél sem pólusos. Az irány
a két pontszám relatív helyzetéből jön (ki a magasabb), a meglévő
`same-*-high-low` atomok szövegei **változtatás nélkül** használhatók,
csak a hozzájuk vezető kapu változik.

- Hozam: **1,39 → ~3,8 megszólaló dimenzió**, az üres kimenet ~35 %-ról
  gyakorlatilag 0-ra (a mérés szerint a párok **99,8 %-ánál** van
  legalább egy mérési hibát meghaladó eltérés).
- Költség: motor + kapu + tesztek. **Nulla új content.**
- Kockázat: a `high-low` szöveg ma sarkosan fogalmaz („te hozod a
  lendületet, ő a nyugalmat") — egy 58 vs 44 résre ez túl erős. Ezért
  **erősség-fokozat** kell: a rés-alapú sorok halkabb megfogalmazást
  kapjanak, VAGY külön, rövidebb szövegváltozatot (`view.mild`). Ez
  ~18 × 2 blokk × 2 nyelv ≈ 70 string — még mindig nagyságrenddel
  olcsóbb, mint az atom-bank bővítése.
- **Confidence-jelölés kötelező** (CLAUDE.md: becsült vs mért): a
  pólus-alapú sor „markáns eltérés", a rés-alapú „mérhető eltérés" —
  a kettő nem keveredhet jelöletlenül.

### L2 — Teljes hat dimenziós összevetés-sáv (olcsó, azonnali „átfogóság")

A narratíva mellé egy **mind a 6 dimenziót mindig megmutató** csík. Nem
generál új állítást, csak láthatóvá teszi, hogy a rendszer mind a hatot
megnézte.

> Javítás a megvalósításkor: itt eredetileg három állapot szerepelt —
> *együtt* / *eltérés* / *mérési hibán belül*. Ez pontatlan volt: az
> „együtt" ÉS a „mérési hibán belül" ugyanaz az állítás, hiszen a kapu maga
> a mérési hiba. A megvalósított sáv ezért **két** állapotot ismer
> (*hasonló* / *eltérés*), az eltérésnél iránnyal.

**Ehhez már van bevált minta a kódbázisban:** a
`ComparisonTab.tsx` (önkép vs külső kép) pontosan ezt csinálja
`DIFF_MIN_GAP`-kapuval, plusz egy facet-szintű alszekciót
(`FacetComparisonSection`) `facetSem`-kapuval. A pár-nézet ennek a
komponens- és kapu-mintának a második fogyasztója lehet.

- Költség: S–M. Adatvédelmi következmény: **a partner nyers pontszámai
  ma NEM kerülnek a kliensre** (`PairInteractionView` doc-comment) — egy
  számot mutató sáv ezt a határt átlépi. Vagy sáv/ikon szintre kell
  tompítani (szám nélkül), vagy tudatos termékdöntés kell róla. Ezt a
  kérdést a megvalósítás ELŐTT kell eldönteni.
  → **DÖNTÉS (2026-08-18): a szám nem megy ki.** A szerver a KÉSZ
  összevetést küldi (dimenziónként egy állapot + ki a magasabb), nem a
  pontszámokat, amikből a kliens visszafejtené. Guardrail-teszt őrzi, hogy
  a `PairSimulationView` egyetlen ága se hordozzon `number`-t.

### L3 — Kereszt-atomok pótlása (drága, de célzott)

A hiányzó 48-ból a `FRICTION_WEIGHTS` szerinti top ~12–16 megírása:
`A×C` (3), `C×H` (4), `A×H` (3), `C×E` (3). Atomonként 3 blokk × 2
nézőpont × 2 nyelv = **12 string**, tehát ~150–190 gondosan írt mondat.

- Hozam: közepes — a kereszt-atomok csak akkor lépnek be, ha mindkét fél
  pólusos KÜLÖNBÖZŐ dimenziókon, ami ritkább eset, mint az L1-é.
- Ezt L1 UTÁN érdemes, mert L1 után látszik, hol marad tényleg lyuk.

### L4 — Facet-réteg (szűken igen, széles körben nem)

**Ami adott:** a tárolt score-JSON hordoz facet-bontást
(`extractFacetScores`), 24 facet, mind a 6 dimenzión.

**Ami korlátoz:**

| | facet √2·SEM | item / facet |
|---|---|---|
| rövid forma (TSFI-S, alapértelmezés) | **17 pont** | 2–3 |
| teljes forma | 15 pont | 4 |

A rövid formán 2–3 item visz egy facetet, a különbség-küszöb ezért 17
pont — a `results?tab=comparison` doksija ezt már így kezeli
(„az eltérés-jelzés RITKÁN fog tüzelni… ez a facet-szintű megbízhatóság
őszinte kezelése"). Ugyanez itt is igaz. Ráadásul 24 facet egyszerre
tesztelve **többszörös összehasonlítási** probléma: a küszöböt átlépő
facetek egy része zaj.

**Ezért NEM javaslom:** 24 facethez pár-relációs atom-bank írását. Az
tartalmilag 24 × 4 kombináció nagyságrend, mérési oldalról pedig a
rövid formán nem áll meg.

**Amit VISZONT érdemes** — egy szűk, olcsó és tartalmilag erős lépés:
**„azonos címke, más motor"**. Ha egy dimenzió már megszólalt (L1 vagy
pólus-kapu), és a KÉT fél ugyanabba a sávba esik, nézzük meg, melyik
facet viszi az eredményt mindkettőjüknél. Ha a domináns facet más, és a
facet-rés ≥ 17 pont:

> „Mindkettőtöknél magas a Lelkiismeretesség, de nálad a Szervezettség
> viszi, nála a Szorgalom — ugyanaz a címke, más működés. Határidőnél ez
> nem ütközik, minőség-vitánál igen."

Ez **egy sablon** (dimenziónként 1 mondat + a facet-nevek behelyettesítése
a meglévő `HEXACO_FACETS` térképből), nem 96 új atom: ~6 × 2 nyelv ≈ 12
string. És pont azt a kérdést válaszolja meg, amit a dimenzió-szint nem
tud: **miért súrlódik két „egyforma" ember.**

Kapuk, amiket ehhez tartani kell: csak valódi facet-adaton (örökség-sor
kimarad), csak ≥ 17 pontos facet-résre, dimenziónként **legfeljebb 1**
sor, és a felületen jelölve, hogy ez a legbizonytalanabb réteg. A teljes
formára (15 pont) érdemes külön küszöböt vinni — a `facetStandardError`
már formánként számol.

## 5. Javasolt sorrend

| # | Lépés | Hozam | Költség | Blokkoló döntés |
|---|---|---|---|---|
| 1 | **L1** rés-alapú aktiválás + halkabb szövegváltozat | 1,39 → ~3,8 dim | M | a „mild" szövegek hangneme |
| 2 | **L2** hat dimenziós összevetés-sáv | átfogóság-érzet | S–M | **kimehet-e a partner pontszáma a kliensre?** |
| 3 | **L4** facet-nüansz („azonos címke, más motor") | mély, differenciáló | S | rövid formán is engedjük-e |
| 4 | **L3** top kereszt-atomok pótlása | közepes | L (content) | — |

Amit **ne** csináljunk: a `maxAtoms` emelését önmagában (mérés szerint
hatástalan), és a pólus-küszöb általános lazítását (az a
SAJÁT-profil-oldalt is elrontaná — a 65/35 ott kalibrált).

## 6. Nyitott kérdések — DÖNTÖTT (2026-08-18)

1. ~~**Adatvédelem:** kimehet-e a partner pontszáma a kliensre?~~ →
   **NEM.** A számítás a szerveren marad, és a KÉSZ összevetés megy ki:
   dimenziónként egy állapot (*hasonló* / *eltérés*) és az irány. Ez
   dimenziónként egyetlen bit — beszélgetés-indításhoz elég, a profil
   visszafejtéséhez nem. Guardrail-teszt őrzi, hogy a `PairSimulationView`
   egyetlen ága se hordozzon `number`-t (`pair-simulation.test.ts`).
2. ~~**Archetípus-út:** kapjon-e differenciáltabb receptet a prototípus?~~
   → **NEM, marad a jelenlegi út.** A 86/74/50×4 recept négy dimenziója
   szerkezetileg néma, és ez így őszinte: a típuscímke tényleg nem hordoz
   információt a másik négy dimenzióról. Következmény, amit a motor
   KIKÉNYSZERÍT: a rés-alapú réteg, a dimenzió-sáv és a facet-nüansz
   kizárólag `profile-profile` / `measured` szinten fut — archetípus ellen
   a „rés" a kitalált 50-hez mérődne.
3. ~~**Rövid forma és facet:** engedjük-e a facet-nüanszt a TSFI-S-en?~~ →
   **IGEN, de a forma szerinti küszöbbel** (rövid: 17, teljes: 15 pont), és
   a felületen kimondva, hogy ez a legbizonytalanabb réteg. Ugyanaz az
   őszinte kezelés, amit az önkép–külső kép facet-összevetése már követ: a
   jelzés ritkán tüzel, és ez nem hiba.

## 7. Megvalósítás (2026-08-18)

Az L1, L2 és L4 lépcső bekerült. Az L3 (kereszt-atomok pótlása) tudatosan
kimaradt: content-nehéz, és a saját sorrendünk szerint is L1 UTÁN
értékelendő újra — most már látszik, hogy a rés-réteg a lyuk nagy részét
betölti.

### Mit ad a mérés a bevezetés után

| | előtte | utána |
|---|---|---|
| megszólaló dimenzió (valós pár) | 1,39 / 6 | **3,80 / 6** |
| üres kimenet | 34,7 % | **0,1 %** |
| elméleti plafon (mérési hibát meghaladó eltérés) | 3,83 / 6 | 3,83 / 6 |

A próza tehát gyakorlatilag mindent elmond, ami psichometrikusan
elmondható — a maradékot a hat dimenziós sáv fedi, ami akkor is nyilatkozik,
ha szöveg nem született. Az archetípus-út változatlan (1,91 / 6): ott a
prototípus szerkezeti korlátja köt, nem a motor.

### Hol él

| Réteg | Fájl |
|---|---|
| rés-atom content (6 × 2 nézőpont × 3 blokk × 2 nyelv) | `src/lib/interaction-atoms.ts` → `GAP_ATOMS` |
| rés-aktiválás, dimenzió-összevetés, facet-nüansz | `src/lib/interaction-engine.ts` |
| szerializálás (pontszám nélkül) | `src/lib/interaction-view.ts` |
| facet-küszöb a formából | `src/app/(app)/interaction/page.tsx` |
| felület | `PairDimensionBand.tsx`, `PairFacetNuances.tsx`, `InteractionDynamicPanels.tsx` |

### Két döntés, ami menet közben derült ki

- **A rés-erősséget ugyanarra a skálára kellett tenni, mint a
  pólus-erősséget.** Az első változat a küszöbtől 50 pontig skálázott, és
  emiatt egy 90 vs 10 páron a rés-atom KIÜTÖTTE a konkrétabb pólus-atomot
  (a meglévő tükrözés-teszt fogta meg). A rés most `|Δ| / 100`, ahogy a
  pólus `|pont − 50| / 50` — plusz egy 0,8-as diszkont, mert a rés
  gyengébb bizonyíték. Ezen felül: ha ugyanarra a dimenzióra AZONOS
  DIMENZIÓS pólus-atom is aktiválódott, a rés-jelölt eleve elmarad — a
  döntést nem bízzuk két skála összemérésére.
- **A `maxAtoms` plafon most már köt.** Az audit szerint korábban inert
  volt (1,06 atom a 3-as keret mellett); a rés-réteg után 3,5–3,7, ezért
  `DEFAULT_MAX_ATOMS = 4`. Az ennél szélesebb lefedettséget a sáv viszi,
  nem a próza hossza.

### Ami nyitva maradt

- **L3 — kereszt-atomok.** A bank 12/60-as; a hiányzók élén az `A×C`,
  `C×H`, `A×H`, `C×E` kombinációk állnak. ~150–190 mondat.
- **Facet-küszöb újraértékelése a magyar pilot után.** A 17 pontos rövid
  formás küszöb az IPIP-referencián áll (nemzetközi, angol, önszelektált
  minta) — a pilot adata ezt felülírja, és vele a nüansz-réteg tüzelési
  gyakorisága is változik.
- **A `comparePairThinNote` szöveg** arra az esetre íródott, amikor a pár
  egyetlen markáns ponton tér el. Ez a rés-réteg után ritka; a szöveg
  helyes marad, de a következő copy-körben érdemes újraolvasni.

## 8. Facet-szint — meddig mehetünk le? (2026-08-18)

> Kérdés: le lehet-e vinni az összevetést facet-szintre, finomabb és
> pontosabb riportért? **Finomabb igen, pontosabb nem** — a granularitás és
> a pontosság itt egymás ellen dolgozik.

### A mérés

| | item/skála | α | √2·SEM | zaj-arány (1−α) |
|---|---|---|---|---|
| dimenzió (rövid) | 10 | 0,78 | 10,7 | 22 % |
| **facet (rövid)** | 2,5 | **0,47** | 16,6 | **53 %** |
| dimenzió (teljes) | 16 | 0,85 | 8,8 | 15 % |
| **facet (teljes)** | 4 | **0,59** | 14,7 | **41 %** |

A rövid formán egy alskála-pontszám **több mint fele mérési zaj**.

Szimuláció **két olyan emberre, akiknek a valós profilja AZONOS**, és csak a
mérési hiba különbözteti meg őket (a `psychometrics.ts` mért SEM-jével):

```
hamisan jelzett „mérhető eltérés"
  dimenzió-szinten:  1,82 / 6
  facet-szinten:     7,33 / 24   (a párok 100%-ánál legalább egy)
```

Egy ÖNÁLLÓ, 24 facetes összevetés tehát **7–8 „itt eltértek" mondatot adna
két egyforma embernek**. A teljes forma nem menti meg (7,37): a kapu együtt
nő a mérési hibával. A hosszabb kérdőív a DIMENZIÓT javítja (1,82 → 1,26),
a facetet nem.

### Miért nem a kérdőív hossza a szűk keresztmetszet — és mikor lenne az

`r̄ = 0,264` mellett, facetenként:

| cél | item/facet | teljes kérdőív | kitöltés |
|---|---|---|---|
| α ≥ 0,60 | 5 | 120 item | ~18 perc |
| **α ≥ 0,70** (konvencionális minimum) | **7** | **168 item** | **~25 perc** |
| α ≥ 0,75 | 9 | 216 item | ~32 perc |

Önálló facet-riporthoz tehát ~170 item kellene a mai 60 helyett. Ez
TERMÉKDÖNTÉS, nem mérnöki kérdés — és a tanácsadás-vezérelt modellben nem
eleve abszurd. A jelenlegi 100 itemes teljes forma viszont nem elég hozzá
(α = 0,59).

### Amit ehelyett megvalósítottunk

A kulcs nem a facetek haszontalansága, hanem a **hipotézisek száma**. Ha a
facet csak azt bontja meg, amit a dimenzió-szint MÁR megállapított, akkor
továbbra is 6 döntés van, nem 24.

| | mit állít | státusz | kapu |
|---|---|---|---|
| **attribúció** (`driver`) | „ezen a dimenzión ide sűrűsödik az eltérés" | a dimenzió-szintű megállapítás hozzárendelése | 1×√2·SEM **+ pontosan egy alskála lépi át a dimenzió irányában** |
| **nüansz** (`nuance`) | „dimenzió-szinten egyeztek, de ezen az alskálán nem" | ÖNÁLLÓ állítás | **2×√2·SEM** |

Az attribúciónál nem a kapu a szűrő, hanem a koncentráció-feltétel: ha két
alskála is átlépi a küszöböt, az eltérés nem sűrűsödik egy helyre, és a
„főleg itt fut" mondat hamis volna — ilyenkor hallgatunk.

### A nüansz kapuját menet közben szigorítani kellett

A réteg először az 1×-es kapun állt, és a bevezetés utáni mérés megmutatta,
hogy **zajra tüzel**: páronként 1,4–1,7 nüansz-sor, azaz majdnem minden pár
két állítást kapott a legzajosabb rétegből. Az önálló nüansz sok facetre
EGYSZERRE fut (egyező dimenziónként négy teszt), ezért a kapu 2× lett:

```
hamis jelzés két AZONOS profil között, facetenként
  1× kapu (17 pont):   31,0 %
  2× kapu (34 pont):    4,0 %
```

### Mit ad ez a gyakorlatban

Modell-feltevés mellett (a facetek dimenzión belüli szórására nincs saját
adatunk — a diagnosztika ezért három feltevés-értékre is lefut):

```
σ_W    attribúció / pár   nüansz / pár   van legalább egy facet-sor
12          0,45               0,27              54 %
20          0,40               1,05              84 %
28          0,37               1,43              93 %
```

Ezek TÁJÉKOZÓDÓ számok, nem mérési eredmények — a feltevés-mentes szám a
fenti hamis-jelzés tábla.

### Ami nyitva marad

- **A magyar pilot felülírja az `r̄ = 0,264`-et.** Ha magasabb, a szükséges
  itemszám csökken — akkor a 168-as szám újraszámolandó.
- **Önálló facet-riport** csak egy ~170 itemes formával, tanácsadói
  opcióként. Addig a facet árnyalat, nem állítás.
- **A facetek dimenzión belüli szórása** (σ_W) mérendő a pilot-adatból — az
  a hiányzó paraméter, ami a réteg tüzelési gyakoriságát meghatározza.
