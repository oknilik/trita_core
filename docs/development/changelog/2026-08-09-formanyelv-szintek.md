# 2026-08-09 — formanyelv: háromszintű rendszer, szerkesztői ábrák

A típus-ábrák (`type-glyph.ts`) eddig egy szigetet alkottak: működő vizuális
nyelvtan, de csak az eredmény-felületeken. A blog közben másik nyelven
beszélt — radar/háló/oszlop/hullám, hajszálvonalakkal és áttetsző
kitöltéssel. Ez a kör a kettőt egy családba hozza **anélkül**, hogy a
jelentés felhígulna.

## A döntés: három szint, és a legfelső zárt

| Szint | Mi tartozik ide | Hol | Szabály |
|---|---|---|---|
| **1. jelentő** | a hat alapforma + hat motívum | profil-hero, archetípus, megosztókártya, PDF | csak valódi pontszám mellett rajzolható |
| **2. szerkesztői** | nem foglalt formák (folt, holdsarló, ék, létra, ívsor, pontsor, lencse) | blog, landing-átkötő, /patterns, OG | ugyanaz a paletta és kézírás, de nem állít semmit |
| **3. textúra** | csillag, nap, ellensúly, talajvonal | elválasztó, üres állapot, 404 | önmagában semmit nem jelent |

Miért ez a tét: ha a hat alapforma egyszer dekorációként is megjelenik, az
olvasó megtanulja, hogy néha semmit sem jelent — és ez visszafordíthatatlan.
Egy cikkfejlécen ugyanaz a bronz csepp azt sugallná, hogy a cikk az
Emocionalitásról szól, vagy hogy a saját eredménye köszön vissza. Ez
szembemegy a termék „becsült vs. mért mindig jelölve" alapelvével.

A `type-glyph.ts` **szándékosan nem** importál az új közös modulból: a
level-1 geometria befagyasztva marad, hogy egy szerkesztői hangolás soha ne
tudja elmozdítani a profil-ábrát. A közös elem a *szabály*, nem a kód.

## Új modulok

- **`src/lib/miro-primitives.ts`** — a 3. szint: determinisztikus PRNG
  (`hashString` / `mulberry32`), csillag-, talajvonal- és kíséret-geometria,
  méret-mód (`resolveArtScale`), valamint a két színkészlet.
- **`src/lib/editorial-art.ts`** — a 2. szint: hét nem foglalt forma +
  konstelláció-építő (`buildConstellation`, `buildCompactShape`).
- **`src/components/ui/EditorialArt.tsx`** — a konstelláció komponense,
  plusz `SectionTransition` a szekció-átkötőkhöz.
- **`scripts/preview-editorial-art.ts`** — előnézet-generátor mindkét
  színsémára, minden méret-módban (mintája: `preview-type-glyphs.ts`).

Szín kizárólag meglévő szemantikus tokenből — **nem kellett új token**. A
`line` szerep `--color-text-primary`, ami sötét sémán világossá fordul,
tehát a tintavonal a sötét kártyán is látszik.

## Blog — „színpad" kompozíció

A `BlogArtVisual` API-ja (`slug`, `tags`, `seed`, `motif`, `variant`)
**változatlan**, tehát a bloglista, a frontmatter `artMotif`/`artSeed` és az
admin-előnézet érintetlen. A kép TÁRGYA is ugyanaz maradt (a téma→motívum
leképezés bitre azonos), tehát a vizuál nem állít semmit, amit eddig ne
állított volna. Ami változott, az a kézírás:

- tömör bronz felület az áttetsző kitöltés helyett, 3–5px tinta az 1,2px
  hajszálvonal helyett — a kártyák eddig sápadtnak látszottak;
- köré a kíséret: csillag, nap, zsálya ellensúly, vándorló talajvonal;
- a kiugró oszlop kontúrossá válik (a magnitúdó formában is látszik).

Új: **a cikkoldal is kap fejléc-vizuált**. Eddig a `/blog/[slug]` teljesen
kép nélkül indult, pedig ott tölt az olvasó 4–8 percet, és onnan készül a
megosztott képernyőkép. Ugyanaz a slug + seed + motívum, mint a listán, így
a kártya és a cikk ugyanazt az arcot mutatja.

## Landing — halk átkötő

Egy `SectionTransition` került a „hogyan működik" és a képesség-blokk közé,
`quiet` módban: két kisebb forma, csillag nélkül, vékony gerinccel. Az
átkötő feladata levegőt adni, nem versenyezni a tartalommal. A kulcsban
benne van a mód (self/team), így a két nézet nem ugyanazt kapja.

## Három hiba, amit a renderelés és a tesztek fogtak

1. **A `compact` küszöb a rövidebb oldalra nézett.** Egy 1120×96-os
   landing-átkötő így „apró jelnek" minősült, és a háromelemű kompozícióból
   egyetlen forma maradt. A küszöb most a nagyobbik oldalt nézi — a széles
   sáv nem kicsi, csak lapos. Regressziós teszt őrzi.
2. **A talajvonal átvágta a kiemelt idézetet.** A hero alsó sávjában szöveg
   ül, ezért ott a talajvonal elmarad. Ugyanez a hullám-motívumnál: a
   hullám maga a talaj-gesztus, egymás mellett három közel párhuzamos
   vonallá esett szét.
3. **A `textSafeCorner` slotja benyúlt a szövegzónába** nagy formánál. Unit-
   teszt fogta (a legnagyobb megengedett méretre is ellenőriz), a slotok és
   a méretkeret szűkültek.

Külön tanulság a formakészletből: a holdsarlót **nem** lehet „kör mínusz
eltolt kör"-ként megadni. Az `evenodd` a metszeten kívüli sarlót is
kitölti, a `nonzero` pedig a negatív körüljárású részt is — a szabály a
≠0 winding-ot festi, nem a pozitívat. Két azonos irányba hajló ív a
megoldás.

## Ellenőrzés

`pnpm check` (type-check + lint + check:colors) zöld, unit 593/593, client
17/17. Új teszt: `tests/unit/design/editorial-art.test.ts` (12 eset) — a
szintbesorolást is őrzi: a szerkesztői formanevek nem ütközhetnek a jelentő
formákéval.

## Ami szándékosan kimaradt

- **OG-kép.** A satori nem old fel CSS-változót, ott a `COLORS` hexeiből
  kell dolgozni, és a kompozíciót külön kell portolni — önálló kör.
- **Csapatábrák konstellációja.** Csábító, de az 1. szint: ha a
  csapat-ábra Miró-formákból áll, minden formának valódi mérési tartalmat
  kell hordoznia. Saját tervezési kör, nem melléktermék.
- **`type-glyph.ts` refaktor a közös modulra.** Viselkedés-megőrző lépés
  lenne, de a level-1 befagyasztása most többet ér.
