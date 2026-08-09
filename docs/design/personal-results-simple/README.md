# Egyszerű nézet a személyes eredményekhez — koncepció

> Készült: 2026-08-09 · Állapot: **koncepció + makettek**, nincs production kód
> Makettek: `index.html` (áttekintés), `a-egy-tortenet.html`, `b-kartyak.html`,
> `c-vizualis.html` — böngészőben megnyithatók, működő nézetváltóval.

## 1. A feladat

A `/profile/results` ma egy teljes riport. Kapjon mellé egy **rövidített
nézetet** — szövegben és vizuálisan is egyszerűbbet —, amiből egy kapcsolóval
át lehet menni a jelenlegi, kibővített képre.

## 2. Diagnózis

Az „Eredmények" fül egyetlen görgetésben (kikapcsolt paywall mellett) ezt
tartalmazza:

1. Hero (típus, összegző mondat, chipek, PDF/megosztás)
2. Áttekintés: radar + 6 dimenzió-sáv pontszámokkal
3. Dimenziók részletesen: 6 nyitható blokk, összesen 24 alskálával
4. Altruizmus-kártya
5. Kulcs-tanulságok
6. Hogyan dolgozom (munkastílus + nyomás alatt)
7. Ideális környezet
8. Szerep-illeszkedés
9. Csapatszerepek (9 szerep, self + társ-visszajelzés)
10. Fejlődési fókusz + háromlépcsős fejlődési ív
11–13. Átvezetők (Interakció, Karrier) + következő-lépés kártya
14. Visszajelzés-űrlap

Ez tanácsadói munkához jó, első találkozáshoz sok. Két konkrét probléma:

- **Az első képernyőn szám van.** A 0–100-as sáv teljesítménynek olvasódik
  („38 = megbuktam"), mielőtt bármi elmagyarázná, hogy nem az.
- **Nincs kilépési pont.** Aki csak azt akarja tudni, „milyen vagyok", annak
  végig kell görgetnie 14 blokkot, hogy összeálljon a válasz.

## 3. Az elv — hat döntés

| # | Döntés | Miért |
|---|---|---|
| 1 | **Mondat először** | Az első dolog egy róla szóló mondat, nem ábra és nem szám. Az ábra alátámaszt. |
| 2 | **Nincs osztályzat** | Kétpólusú skála, ahol mindkét vég viselkedést jelöl, és egyik sem rosszabb. |
| 3 | **A szám opció** | Kapcsolóval előhozható, alapból ki — a szám olyan pontosságot ígér, amivel egy önjellemzés nem rendelkezik. |
| 4 | **Három üzenet** | Erősség → működésmód → figyelendő. A tanácsadói visszajelzés természetes íve. |
| 5 | **Forrás mindig látszik** | Minden állítás alatt ott a dimenzió, amiből jön (becsült vs mért alapelv). |
| 6 | **A váltás visszafordítható** | Egyszerű ⇄ Részletes ugyanazon az URL-en, megjegyzett választással. |

## 4. A közös váz (IA)

Mind a három irány ugyanazt a négy réteget rendezi el másképp; a sorrend nem
cserélhető.

| Réteg | Tartalom | Honnan jön |
|---|---|---|
| 1 · Felismerés | típusnév + egy összegző mondat | `personality-type.ts`, `dimension-insights.ts` — **kész** |
| 2 · Megértés | három állítás forrás-dimenzióval | meglévő pontszámokból, **új szöveg** |
| 3 · Kép | hat dimenzió vizuálisan | **új komponens** (irányonként más) |
| 4 · Kilépés | módszertani jegyzet + átvezetés a részletesre | meglévő minták |

## 5. A három irány

### A — „Egy oldal, egy történet" (`a-egy-tortenet.html`)
A szöveg viszi. Három egymásra épülő állítás, alattuk hat kétpólusú skála,
mindegyikhez egy rövid magyarázó mondat. Súlypont: **érthetőség**.
Gyengéje: kevésbé „látványos" egy screenshotban.

### B — „Három kártya" (`b-kartyak.html`)
Ugyanaz a három üzenet önálló, szkennelhető kártyákban, saját ábrával; a hat
dimenzió csukott mini-listában. Világos hero a sötét sáv helyett.
Súlypont: **mobil és megoszthatóság**. Gyengéje: a kártyák közti összefüggés
kevésbé érződik.

### C — „A formád" (`c-vizualis.html`)
A hat dimenzió egyetlen organikus alakzattá áll össze; a pontokra koppintva a
panel mondattá fordítja az adott irányt. Alatta a három állítás tömör
formában. Súlypont: **emlékezetesség**. Gyengéje: két profil nem hasonlítható
össze így — arra a részletes nézet radarja marad.

## 6. Ajánlás

**Az „A" legyen az alap**, a másik kettőből egy-egy elem beépítve:

1. **A-ból marad** a három állítás sorrendje és a kétpólusú skála — ez a
   koncepció lelke.
2. **B-ből átjön** a csukott dimenzió-lista mobilra: 372 px-en hat kifejtett
   spektrum-sor már sok, ott csukva induljon.
3. **C-ből átjön** a forma — de nem a nézet fő ábrájaként, hanem a megosztó-képre
   és a PDF borítójára, ahol pont az emlékezetesség a feladat.

Amit ez a koncepció **nem** old meg: a csapat- és külső-kép nézeteket nem
érinti (ott az összevetés a feladat, ahhoz a radar és a sávok a helyes eszköz),
és nem pótolja a tanácsadói beszélgetést — a célja, hogy a kliens fel tudja
idézni, amit hallott.

## 7. Nyitott döntések

| Kérdés | Javaslat | Állapot |
|---|---|---|
| Melyik a kezdőnézet? | Első megnyitáskor az egyszerű, utána az utoljára használt | döntés kell |
| Mi legyen a fülekkel egyszerű nézetben? | Fülsáv elrejtve; a „Külső kép" egy sorként a lap alján | döntés kell |
| Pontszám a PDF-ben / megosztó-képen? | PDF marad számokkal; megosztó-kép forma + típusnév, szám nélkül | javaslat |
| Ki írja a szövegeket? | A makett szövegei **tervezői mintaszövegek** — éles előtt tartalmi átnézés kell (HU+EN) | tartalom |
| Külső visszajelzés esetén negyedik állítás? | „Ahogy mások látnak", csak a küszöb felett, forrás-jelöléssel | későbbi kör |

## 8. Implementációs vázlat

Új adat nem kell — a típus, az összegző mondat, a dimenzió-pontok és a szintek
ma is elkészülnek a szerveren (`page.tsx`). A munka nagyja megjelenítés és szöveg.

```
src/app/(app)/profile/results/page.tsx
  └ searchParams.view === "simple" | "full"   (alap: felhasználói preferencia)

src/components/results/simple/
  ├ SimpleResultsView.tsx      — a négy réteg összerakása
  ├ StatementBlock.tsx         — három állítás + forrás-chipek
  ├ DimensionSpectrum.tsx      — kétpólusú skála (mobilon csukható)
  └ ViewModeSwitch.tsx         — Egyszerű ⇄ Részletes + „Számok" kapcsoló

src/lib/results/simple-summary.ts
  └ buildSimpleSummary(scores, locale) → { type, lede, statements[], dims[] }

src/lib/i18n/results.ts
  └ új kulcsok: pólus-címkék (6×2), dimenzió-mondatok (6), szekció-címek,
    kapcsoló-feliratok — HU + EN
```

Nézet-preferencia tárolása: `UserProfile` mező (pl. `resultsViewMode`), vagy
amíg nincs migráció, `localStorage` + URL-paraméter.

## 9. Konvenciók, amiket a koncepció tart

- **Dimenzió-címkék változatlanok** (`src/lib/tritan.ts`): Becsületesség-Alázat,
  Emocionalitás, Extraverzió, Barátságosság, Lelkiismeretesség, Nyitottság.
  A pólus-feliratok (pl. „Csendes háttér ↔ Lendületes jelenlét") *viselkedés-leírók*,
  nem új dimenzió-nevek.
- A felület **nem nevezi a modellt HEXACO-nak** — „hat személyiségdimenzió".
- **Nincs piros** az értékelő rámpán: a „figyelendő" is a zsálya→bronz skálán él.
- Szín, tipográfia, touch-target: `design-tokens.ts`, `color-system.ts`,
  `docs/development/ui-token-map.md`, min. 44 px érintőfelület.

## 10. A makett-készlet szerkezete

```
docs/design/personal-results-simple/
  index.html            — koncepció-áttekintés, irány-összevetés, ajánlás
  a-egy-tortenet.html   — A irány (teljes makett + mobil + jegyzetek)
  b-kartyak.html        — B irány
  c-vizualis.html       — C irány
  shared.css            — közös stílus, a valós token-értékekkel
  shared.js             — minta-adat + renderelők (spektrum, radar, forma,
                          részletes nézet, nézetváltó, mobil-klón)
  README.md             — ez a dokumentum
```

Minden makettben működik: **Egyszerű ⇄ Részletes** váltó, **Számok** kapcsoló,
mobil-keret (372 px) ugyanazzal a tartalommal, és a jelenlegi részletes nézet
rekonstrukciója az összehasonlításhoz.

A minta-persona („Kovács Anna", X 81 · O 78 · H 74 · A 55 · C 46 · E 38) a valós
számítási logikát követi: a típuscímke (`Kísérletező hajtóerő`) és az összegző
mondat pontosan az, amit a `personality-type.ts` és a `dimension-insights.ts`
adna ezekre az értékekre.

## 11. Önálló, egyfájlos változat (artifact)

`onallo-lap.html` — a teljes koncepció + mind a három makett **egyetlen,
külső függőség nélküli fájlban** (inline CSS/JS, semmilyen CDN). Ez a
megosztható/publikálható változat; a fenti több-fájlos készlet a
munkapéldány.

Két eltérés a több-fájlos változathoz képest:

- **Világos és sötét témában is renderel** — a sötét készlet a termék valós
  dark tokenjeit használja (`globals.css` `[data-theme="dark"]` réteg), a
  dimenzió-hue-k is a sötét változatukra váltanak.
- **Nem tölt webfontot** (a publikálási CSP tiltja a külső hosztokat): a
  Fraunces/DM Sans helyett rendszer-szerif és rendszer-sans a tartalék.
  Ahol a néző gépén megvan a Fraunces, ott az jelenik meg.
