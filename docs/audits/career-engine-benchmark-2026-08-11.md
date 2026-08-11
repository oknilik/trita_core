# Karrier-motor (jobfit) — mérési jegyzőkönyv és visszakötés

> Készült: 2026-08-11 · Mérés: `npx tsx scripts/career-validation/simulate.ts --n 800`
> · Alapvonal: `docs/product/career-engine-plan.md` 2. fejezet (v1, 2026-07-30)
> · Kapcsolódó: `docs/audits/motor-known-residuals.md` (ledger)

## Kérdés

A karrier-modul 2026-07-31 óta parkolt (`CAREER_MODULE_READY = false`), a `/career`
a kereslet-mérő fake doort mutatja. Közben a motor-audit körök (v1–v9) rendbe tették
a mögöttes pszichometriai magot. **Javult-e ettől a jobfit teljesítménye, és
visszaköthető-e?**

A kérdés eddig nem volt megválaszolható: a v1 motor számai egy eldobható inline
szkriptből származtak, tehát nem lehetett újrafuttatni. Ezért az első lépés a
hiányzó mérőeszköz volt.

## 1. A mérőeszköz

`scripts/career-validation/simulate.ts` — determinisztikus (seeded) szimuláció,
800 korrelálatlan, normál-szerű profil × 477 foglalkozás, négy input-állapotban.
A profil-szórás a MÉRT `SCORE_SD` (IPIP-referencia, n = 21 681), nem kézi prior.

**Ez szimuláció, nem validáció.** A motor BELSŐ viselkedését méri (differenciál-e,
a saját hibáján belül rangsorol-e, stabil-e mérési zajra). Hogy a rangsor a
valóságban jó tanácsot ad-e, azt csak pilot-adat mondja meg — a known-groups
harness (`calibration.ts`) továbbra is N = 0.

Új metrika a tervben szereplőkön túl: **test-retest**. Ugyanazt a „valódi" profilt
kétszer megmérjük a motor saját `dimSe`-jével zajosítva, és nézzük, mennyire
ugyanaz a lista. Ez az a szám, ami közvetlenül megmondja, hogy a lista feje
jelent-e valamit.

## 2. Eredmény — a v1 fődiagnózisa megszűnt

A v1 verdiktje az volt, hogy „a motor nem *differenciál*": a rangsor tetején a
mérési hibán belüli különbségek döntenek, és a pontszám gyakorlatilag a
lelkiismeretességgel egyenlő.

| Mérés | v1 (2026-07-30) | v2 (ma) | Ítélet |
|---|---|---|---|
| rangsor-szórás egy személyen belül | 5,3 | **10,0–11,9** | 2,1× több jel |
| rangsor-hiba (SE) | ±8 (fix konstans) | **4,2–8,1** (reliabilitásból) | szűkebb ÉS levezetett |
| jel/zaj (szórás ÷ SE) | ~0,66 | **1,24–2,63** | a jel a hiba fölé került |
| r(profil-átlag, átlagos fit) — elevation | 0,70 | **0,01–0,09** | gyakorlatilag megszűnt |
| legerősebb r(dimenzió, átlagos fit) | 0,82 (C) | **0,26–0,43** | nem egydimenziós |
| győztes-szerep entrópia | — | 0,72–0,84 | szétszórt, nem egy-nyertes |

Katalógus-oldalon ugyanez: a v1-ben a THOR (C) „high" **109-ből 84 szerepben**
szerepelt és a súlymassza ~31%-át vitte. Ma a hat dimenzió súlymasszája
**9,8% (E) … 22,7% (O)** között oszlik, és minden dimenzió 342–426 szerepben
kap súlyt. Az egydimenziós motor megszűnt.

**Válasz a kérdésre: igen, érdemben javult.** A javulás nagyobb részt a v2 motor
szerkezeti döntéseiből jön (ideal-point pontozás, differenciál-rangsor,
klaszterezés), kisebb részt a motor-körökből: a mért SEM-konstansok
(`MEAN_ITEM_R = 0,264`, `SCORE_SD = 16,2`) ~25%-kal szűkítették a hibasávot,
és ez közvetlenül a jel/zaj arányban látszik.

## 3. Amit a mérés ÚJONNAN talált — és amit javítottunk

### 3.1 A H-padló dokumentált invariánsa nem állt (JAVÍTVA)

Az `engine.ts` kimondja: *„magas H-val nem lehet rosszabbul illeszkedni,
alacsonnyal pedig nem lehet »jobban«"*. A mérés szerint ez **nem teljesült**.

40 véletlen alapprofilon, csak a H-t változtatva (20 → 85):

| Szerep-csoport | Sértés a javítás ELŐTT | legrosszabb | javítás UTÁN |
|---|---|---|---|
| H-padlós szerepek (H-cél < 50) — **ide szól a garancia** | 1426/8640 (**16,5%**) | 25 pont | **0** |
| H-t egyáltalán nem kérő szerepek | 1302/2640 (**49,3%**) | 27 pont | **0** |
| H-t kérő, nem padlós szerepek (H-cél ≥ 50) | 2175/7800 (27,9%) | 26 pont | 30,7% (ld. lent) |

Konkrét példák a javítás előttről: *Adattudós* — az őszinte iker 11 ponttal
rosszabbul illeszkedett; *Operációkutatási elemző* — 18 pont; *Energetikai
mérnök* — 17 pont.

**Gyökér-ok.** A padló a NYERS H-értéken fut (szándékosan: az invariáns az
abszolút becsületességről szól), minden más komponens viszont a CENTRÁLT
profilon. A centrálás nulla-összegű: a H 20 → 85 emelése a hatból számolt
átlagot ~10,8-del emeli, tehát **az összes többi komponens centrált értékét
ugyanennyivel elcsúsztatja a céljától**. Kis H-súlyú szerepeken ez a
mellékhatás nagyobb volt, mint a padló nyeresége — így a kevésbé őszinte iker
került előre.

Ez az a hiba-osztály, amit a motor-audit körök kerestek (kereszt-csatolás két,
külön-külön helyes szabály között), de a karrier-ágon nem talált meg, mert
komponens-szinten minden helyes volt — csak a végeredményen látszott.

**Javítás.** A centráló átlag a **H nélkül** számol
(`CENTERING_DIMS`, `engine.ts`). Ha a H-t a padló abszolút skálán pontozza,
akkor nem lehet része a relatív alapvonalnak sem. Így a H változtatása a többi
komponenst egyáltalán nem mozdítja, és az invariáns **szerkezetileg** áll —
nem utólagos vágással. Mellékhaszon: egy olyan szerep, ami nem is kér
becsületesség-alázatot, többé nem mozdul a felhasználó H-pontjától (eddig
akár 27 pontot mozdult).

Kötő tesztek (`tests/unit/career/engine.test.ts`):
`H-padló: az invariáns a TELJES pontszámon áll, nem csak a komponensen` és
`centrálás: a H változtatása nem mozdítja a H-t nem kérő szerepek pontját`.

**Ami tudatosan MARADT:** a H-cél ≥ 50 szerepeken a nagyon magas H továbbra is
kaphat ideal-point büntetést („a cél fölött vagy"). A dokumentált garancia
hatóköre az alacsony H-t kívánó szerepekre szól, és a kiterjesztése
termékdöntés, nem hiba-javítás — ld. 5. pont.

### 3.2 A rangsort a wizard preferencia-lépése tartja (NYITOTT, termékdöntés)

A négy input-állapot mérése:

| Input-állapot | jel/zaj | listavezető klasztere | test-retest top-10 átfedés |
|---|---|---|---|
| DIAGNOSZTIKA: csak személyiség | 1,51 | 107,7 szerep | **0,15** |
| wizard nélkül (becsült érdeklődés, nincs preferencia) | 1,75 | **78,9 szerep** | **0,22** |
| wizard preferenciákkal (becsült érdeklődés) | 2,63 | 11,1 szerep | 0,59 |
| + MÉRT érdeklődés (interest-led) | 1,24 | 13,9 szerep | 0,52 |

A döntő különbség a **preferencia-tengelyek** (emberekkel / változatosság /
önállóság / alkotás). Nélkülük a listavezető klasztere ~79 szerep, és két
mérés top-10-e alig fedi egymást (0,22) — a lista feje ilyenkor **zaj**.

A jelenlegi felület ezt részben már kezeli: a `/career` csak akkor számol
eredményt, ha a wizard `status` lépése megvan (`career/page.tsx`). **De a
preferencia-lépés átkattintható**: minden tengely alapértelmezése semleges (0),
és a `preferenceFit` a be nem állított tengelyeket kihagyja — nulla beállított
tengelynél `null`-t ad. Aki végigkattint a wizardon anélkül, hogy hozzányúlna a
preferencia-lépéshez, pontosan a fenti gyenge állapotba kerül, és semmi nem
szól róla.

Ez **nem kód-hiba**, hanem beavatkozást igénylő termék-kérdés — ezért itt nem
javítottuk (a repó kimondott elve, hogy nem gyártunk olvasatlan mezőt vagy
egyoldalú UX-döntést). Két járható út:
1. a preferencia-lépés válaszkényszeres (a „semleges" tudatos választás legyen,
   ne alapértelmezés);
2. vagy a felület kimondja, ha a rangsor felbontatlan („ez a ~20 irány
   egyformán illik — a preferencia-kérdések élesítik a képet").

A (2) illeszkedik jobban a termék kimondott hitelességi elvéhez (becsült vs
mért jelölés kötelező), de mindkettő UI-munka.

### 3.3 A becsült érdeklődés visszahozza a C-dominanciát (LEDGERELT, pilot-kérdés)

Wizard nélkül a legerősebb egydimenziós függés **r(C) = 0,43** — magasabb, mint
bármelyik másik állapotban. Ok: az `estimateInterests` HEXACO→RIASEC súlyaiban a
C három betűt hajt (R +0,4 · I +0,3 · C +0,6), a H egyet sem. Emellett a
becsült vektor **61%-ban „low differentiation"** lesz (a hat betű terjedelme
< 20), amire a motor felezi az érdeklődés súlyát — így a rangsor gyakorlatilag
a demandFit-re esik vissza.

A HEXACO→RIASEC leképezés súlyai a ledgerben **már szerepelnek** pilot-gated
priorként (`motor-known-residuals.md`, „Karrier súlyok (N=0)"). Átsúlyozásuk
kalibráció, nem hibajavítás — adat nélkül nem tesszük. A mostani mérés annyit
tesz hozzá, hogy **számot ad a hatás nagyságára** (r = 0,43), és megmutatja,
hogy a 3.2 pont beavatkozása ezt is nagyrészt elviszi (r 0,43 → 0,30).

## 4. Visszakötés

`CAREER_MODULE_READY = true` (`src/lib/career/module-state.ts`). Ezzel:

- a `/career` a működő iránytűt mutatja a fake door helyett (a felvett
  kereslet-mérési adat megmarad, a mérés magától elhallgat),
- a karrier menüpont megjelenik (`navigation/config.ts`),
- a PDF karrier-blokkja számolódik,
- a kapuzott route-ok (`/api/career/fit`, `/api/career/occupations`,
  `/api/profile/career-background`, `/api/industry-fit/feedback`) kinyílnak;
  az org-szintű elrejtés (`Organization.hideCareerModule`) változatlanul
  fölülír mindent.

A nav-teszt a kapcsoló mindkét állását leírja, hogy egy esetleges
vissza-parkolás se hagyjon hazug állítást a fájlban.

## 5. Ajánlás a merge előtt

1. **A 3.2 elrendezése** — ez az egyetlen mért, felhasználót érintő gyengeség.
   Amíg nincs meg, a széles élesítés olyan listát ad a preferenciát kihagyó
   felhasználóknak, aminek a feje mérésről mérésre cserélődik.
2. A H-invariáns kiterjesztésének **termékdöntése** (H-cél ≥ 50 szerepek):
   maradjon-e az ideal-point büntetés a nagyon magas becsületesség-alázatra?
3. A `simulate.ts` **regressziós korlátként** használandó: minden karrier-motor
   változás után futtatandó, és a 2. pont táblája ne romoljon.
4. A validáció (nem szimuláció) továbbra is **pilot-gated** — a known-groups
   harness N = 0 marad, amíg nincs mért-kérdőív pár.
