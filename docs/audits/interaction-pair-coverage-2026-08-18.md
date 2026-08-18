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

A narratíva mellé egy **mind a 6 dimenziót mindig megmutató** csík: két
pontszám, a rés, és három állapot — *együtt* / *eltérés* / *mérési
hibán belül*. Nem generál új állítást, csak láthatóvá teszi, hogy a
rendszer mind a hatot megnézte.

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

> „Mindkettőtöknél magas a Lelkiismeretesség, de nálad a Rendszerezettség
> viszi, nála a Kitartás — ugyanaz a címke, más működés. Határidőnél ez
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

## 6. Nyitott kérdések (döntést igényelnek)

1. **Adatvédelem:** a pár-nézet ma tudatosan nem küld nyers partner-
   pontszámot a kliensre. Az L2-sáv ezt átlépi. Szám nélküli sáv, vagy
   új termékdöntés?
2. **Archetípus-út:** a 86/74/50×4 prototípus 4 dimenziója szerkezetileg
   néma. Vállaljuk (és a felületen kiírjuk, mint ma), vagy a prototípus
   kapjon differenciáltabb receptet? Utóbbi kockázata: a típuscímke
   tényleg nem hordoz információt a másik négy dimenzióról — kitalált
   adat lenne.
3. **Rövid forma és facet:** engedjük-e a facet-nüanszt a TSFI-S-en
   (17 pontos küszöb), vagy csak a teljes formán?
