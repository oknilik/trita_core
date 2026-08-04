# Nyelvi és pszichológiai szöveg-lektorálás — 2026-08

> Állapot: KÉSZÜL — a leltár feltöltése és a javítások folyamatban.
> Kapcsolódik: `docs/product/ux-simplification-2026-08.md` (a „→ NYELVI KÖR"
> jelű tételek ide kerültek át), `docs/product/riport-javitasi-terv` 1.2/1.4.

## Cél és szemüveg

Két lencse egyszerre:

1. **Nyelvi**: a magyar szövegek gördülékenysége — tükörfordítások,
   töredezett mondatok, szórendi kalkok, tegezés/magázás-keveredés,
   terminológiai szórás kigyomlálása. A HU az elsődleges termék-nyelv;
   az EN-t ott javítjuk, ahol tartalmilag eltér vagy magyarról fordított.
2. **Pszichológiai-szakmai**: önértékelés-alapú mérés nem jogosít
   kategorikus kijelentésre — valószínűségi keretezés („jellemzően",
   „hajlamos"), nem-ítélkező skálapólusok (a magas/alacsony nem jó/rossz),
   Barnum-mondatok és klinikai hangütés kerülése, becsült vs mért adat
   forrás-transzparenciája. Ez a termék hitelességi alapelvének
   (CLAUDE.md: kötelező confidence-jelölés) szöveg-szintű kiterjesztése.

## Módszer

- Két párhuzamos, teljes körű sweep: (A) i18n szótárak + hardcode-olt
  UI-szövegek; (B) tartalom-generáló libek (archetípusok, csapatminták,
  interakciós atomok, journey-szövegek, emailek) pszichológiai lencsével.
- A kérdőív-itemek (`src/lib/questions/`) NEM részei a körnek — validált
  instrumentum-szövegek, azokhoz mérési okból nem nyúlunk.
- A HEXACO dimenzió-nevek (`src/lib/tritan.ts`) kanonikusak — a leíró
  szövegeik viszont lektorálandók.
- Prioritás: **P1** = pilot előtt javítandó (értelemzavaró / szakmai
  hitelességet sértő) · **P2** = érdemi gördülékenység · **P3** = polish.

## Előre ismert, áthozott tételek

| # | Honnan | Mi | Terv |
|---|---|---|---|
| L1 | UX-kör B12 | Két szomszédos riport-szekció neve „szerep" (RoleFit vs Csapatszerep) — az olvasó nem tudja, miben különböznek | címek megkülönböztetése + egy-egy alcím-mondat |
| L2 | UX-kör B18 | Nav-címkék hardcode magyarok a bilingvális felület közepén (`navigation/config.ts`) | i18n-kulcsosítás a teljes nav-ra |
| L3 | UX-kör A20 | Journey-szövegek belső zsargont szivárogtatnak a user felé (`next-best-action.ts`, `engine-core.ts`) | köznyelvi átírás i18n kulcsokon át |
| L4 | Riport-terv 1.2 | „a(z)" tákolás interpolált címkék előtt (results.ts facet-kulcsok) | `huArticle()` helper (magánhangzó → „az") + kulcs-átírás névelő nélküli sablonra |
| L5 | Riport-terv 1.4 | Kategorikus tagline-ok az archetípus verb/desc mapekben („Te vagy, aki…") | valószínűségi keretezés, egységes hangütéssel |

## Leltár

_A sweep eredménye tölti fel — P1/P2/P3 bontásban, tételes
jelenlegi→javasolt párokkal._

### P1 — pilot előtt javítandó

_(feltöltés alatt)_

### P2 — érdemi gördülékenység-javítás

_(feltöltés alatt)_

### P3 — polish

_(feltöltés alatt)_

## Terminológia-egységesítés

_(feltöltés alatt — fogalmanként: választott terminus + lecserélendő
változatok + előfordulási helyek)_

## Végrehajtási napló

_(a javítások batch-enként ide kerülnek, verifikációval)_
