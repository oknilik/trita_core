# 2026-08-11 — Jobfit (karrier-motor): mérés, invariáns-javítás, visszakötés

A parkolt karrier-modul (`CAREER_MODULE_READY = false` 2026-07-31 óta) felülvizsgálata
a motor-audit körök után: **javult-e a motor annyit, hogy visszaköthető?** Teljes
jegyzőkönyv: `docs/audits/career-engine-benchmark-2026-08-11.md`.

## Előbb a mérőeszköz — mert nem volt

A v1 motor számai (`career-engine-plan.md` 2. fejezet) egy eldobható inline
szkriptből származtak, tehát a v2 után nem lehetett hozzájuk mérni. A terv F0
lépése előírt egy szimulációt; ez most készült el:

**`scripts/career-validation/simulate.ts`** — determinisztikus (seeded), 800
korrelálatlan profil × 477 foglalkozás, négy input-állapotban. Metrikák:
within-person rangsor-szórás, rangsor-SE, **jel/zaj**, listavezető
klaszter-mérete, elevation-korreláció, per-dimenzió korreláció, győztes-entrópia,
család-lefedettség, és egy újdonság: **test-retest** (ugyanaz a „valódi" profil
kétszer, a motor saját `dimSe`-jével zajosítva).

Ez SZIMULÁCIÓ, nem validáció — a motor belső viselkedését méri. A known-groups
validáció továbbra is pilot-gated, N = 0.

## Az eredmény: a v1 fődiagnózisa megszűnt

| Mérés | v1 (2026-07-30) | v2 (ma) |
|---|---|---|
| rangsor-szórás egy személyen belül | 5,3 | **10,0–11,9** |
| rangsor-hiba (SE) | ±8 fix konstans | **4,2–8,1** reliabilitásból |
| jel/zaj | ~0,66 | **1,24–2,63** |
| r(profil-átlag, átlagos fit) | 0,70 | **0,01–0,09** |
| legerősebb r(dimenzió, átlagos fit) | 0,82 (C) | **0,26–0,43** |

Katalógus-oldalon: a v1-ben a C „high" 109-ből 84 szerepben szerepelt, a
súlymassza ~31%-át vitte. Ma a súlymassza 9,8% (E) … 22,7% (O) között oszlik.
**Az egydimenziós motor megszűnt.** A javulás nagyobb részt a v2 szerkezeti
döntéseiből (ideal-point, differenciál-rangsor, klaszterezés), kisebb részt a
motor-körök mért SEM-konstansaiból jön.

## Új lelet és javítás — a H-padló invariánsa nem állt

Az `engine.ts` kimondja: „magas H-val nem lehet rosszabbul illeszkedni". A mérés
szerint **a padló által VÉDETT szerepek 16,5%-án az alacsony H-jú iker kapott
magasabb pontot, legrosszabb esetben 25 ponttal** (pl. *Adattudós* 11 pont,
*Operációkutatási elemző* 18 pont). Ráadásul a H-t egyáltalán nem kérő
szerepek 49,3%-a is mozdult a felhasználó H-pontjától — akár 27 pontot.

**Gyökér-ok:** kereszt-csatolás két, külön-külön helyes szabály között. A padló a
NYERS H-n fut (szándékosan — az invariáns az abszolút becsületességről szól),
minden más komponens viszont a CENTRÁLT profilon; a centrálás nulla-összegű,
tehát a H emelése az összes többi komponenst elcsúsztatta a céljától. Komponens-
szinten minden helyes volt — csak a végeredményen látszott, ezért kerülte el a
korábbi köröket.

**Javítás:** a centráló átlag a **H nélkül** számol (`CENTERING_DIMS`). Ha a H-t a
padló abszolút skálán pontozza, nem lehet része a relatív alapvonalnak sem. Az
invariáns így szerkezetileg áll, nem utólagos vágással. Mérés a javítás után:
**0 sértés** mindkét érintett szerep-csoportban.

Két új kötő teszt (`tests/unit/career/engine.test.ts`), plusz két meglévő teszt
fixture-je frissült (a hatból számolt átlagot kódolták).

## Visszakötés

`CAREER_MODULE_READY = true`. A `/career` a működő iránytűt mutatja (a felvett
fake-door adat megmarad), a menüpont megjelenik, a PDF karrier-blokkja számolódik,
a kapuzott route-ok kinyílnak. Az org-szintű elrejtés
(`Organization.hideCareerModule`) változatlanul fölülír mindent. A nav-teszt
mostantól a kapcsoló **mindkét** állását leírja.

## Nyitva marad (termékdöntés, nem kód-hiba)

**A rangsort a wizard preferencia-lépése tartja.** Mérés:

| Input-állapot | jel/zaj | listavezető klasztere | test-retest top-10 |
|---|---|---|---|
| wizard nélkül (nincs preferencia) | 1,75 | 78,9 szerep | **0,22** |
| wizard preferenciákkal | 2,63 | 11,1 szerep | 0,59 |

A preferencia-lépés ma **átkattintható** (minden tengely alapértelmezése
semleges), és aki átkattintja, a felső sorba kerül — a lista feje ilyenkor zaj,
és semmi nem szól róla. Ez UI-beavatkozást igényel (válaszkényszer VAGY a
felbontatlanság kimondása); a merge előtti 1. számú teendő.

Szintén nyitva: a becsült érdeklődés C-dominanciája (r = 0,43 wizard nélkül) —
a HEXACO→RIASEC súlyok a ledgerben már pilot-gated priorok, átsúlyozásuk
kalibráció, nem hibajavítás.

## Ellenőrzés

`pnpm type-check` 0 hiba · `pnpm lint` 0 · unit **965 pass / 0 fail** ·
client **154 pass / 0 fail**.
