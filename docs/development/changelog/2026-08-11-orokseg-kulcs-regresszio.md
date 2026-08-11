# 2026-08-11 — Örökség-kulcs regresszió: üres eredményoldal a meglévő usereknél

> A HEXACO-refaktor (`8388a5f`) utáni éles hiba javítása. Tünet: a bejelentkezett
> user eredményoldala ÜRESEN renderelt — üres radar (csak a 25/50/75 rácsgyűrűk),
> üres „Gyors áttekintés" strip, nincs dimenzió-akkordeon.

## A gyökérok

A `8388a5f` a belső dimenziókódokat kivezette
(`INTE/RESO/TEMP/ADAP/THOR/OPEN` → `H/E/X/A/C/O`), és ezzel a kérdésbank
`dimensions[].code` mezője is HEXACO-betűre váltott. A DB-ben **már tárolt**
score-JSON-ok viszont — tudatosan, migráció nélkül — az örökség-kulcsokat
hordozzák tovább.

A commit ehhez helyesen szállította az örökség-normalizálást
(`normalizeDimensionKeys` / `normalizeFacetKeys`) és a kanonikus olvasókat
(`extractDimensionScores` / `extractFacetScores`, `scoring.ts`) — a
`scoring.ts` doc-blokkja ki is mondja, hogy *„minden dimenzió-olvasásnak ezen
a függvényen kell átmennie; nyers `scores.dimensions` hozzáférés örökség-soron
hibás (üres) képet ad"*.

A refaktor viszont a **hívóoldalt** nem állította át mindenhol: több felület
nyersen indexelt tovább (`scores.dimensions[dim.code]`). Így a bank
HEXACO-kódja és a tárolt örökség-kulcs sosem találkozott, a
`typeof score !== "number"` szűrő minden dimenziót kidobott, és a
`dimensions` tömb üresen ment ki a `ProfileTabs`-nek.

**Ez nem csak az eredményoldalt érintette** — ugyanez a nyers olvasási minta
kilenc kódúton élt tovább. Minden 2026-08-11 előtt kitöltő user érintett;
az azóta született sorok már HEXACO-kulccsal íródnak, ezért új kitöltésen
a hiba nem reprodukálódik (ez rejtette el).

## Javítás — minden olvasó a kanonikus olvasón megy át

| Felület | Tünet a javítás előtt |
|---|---|
| `/profile/results` | teljes eredményoldal üres (radar, strip, akkordeon, fejlődési fókusz, hero-mondat, típuscímke) |
| `/profile/results` — külső kép | az observer-készletek is nyersen olvasódtak: „nincs külső adat" meglévő értékelések mellett (dimenzió- ÉS facet-átlag) |
| `/share/[token]` | a megosztott profil dimenzió nélkül renderelt |
| `share-og.ts` | a link-előnézet generikus brand-képre esett vissza (nincs típuscímke/glyph) |
| `/api/team/[id]/pattern` | a régi kitöltők kimaradtak a csapat-mintázatból |
| `member-dossier.server.ts` | a tag-dossié önkép-oszlopa és observer-átlaga üres |
| `notifications/sweep.ts` | a reflexiós emlékeztető pont a régi userekhez nem ment ki |
| `career/person.ts` | a karrier-illeszkedés személyiség-bemenet nélkül, csak preferenciákból számolt |
| `/career` — fejlődési fókusz | üres lista |
| `/interaction` | üres típuscímke, glyph nélküli oldal; a pár-szimuláció mindkét oldala üres bemenetet kapott |

Mindegyik a `extractDimensionScores` / `extractFacetScores` kanonikus olvasóra
állítva. A `team-stats.ts`, `org-stats.ts`, `manager-cockpit.ts` és a
jelölt-oldal már korábban is helyesen olvasott — ezek változatlanok.

## Egy külön (nem a refaktorból származó) hiba is kiesett

`/career` fejlődési fókusz: a facet-map **kétszintű**
(`{dimenzió: {facetKód: 0–100}}`), a kód viszont egyszintűen indexelt
(`scores.facets?.[facet.code]`) — ez **mindig** `undefined`-ot adott, így a
facet-ág sosem tüzelt, és a lista némán a dimenzió-fallbackre esett vissza.
A riport-oldal ugyanezt a blokkot facet-szinten mutatja, tehát a két felület
eltérő fejlődési fókuszt közölt. Javítva a kétszintű olvasásra.

## Regressziós védelem

Új: `tests/unit/results/stored-score-legacy-keys.test.ts` (5 teszt) — két szinten:

1. **Viselkedés:** örökség-kulcsos tárolt sor a kérdésbank `code` mezőivel
   indexelhető (ez a konkrét kapcsolat, amit a bug megtört); a facet-bontás
   külső kulcsa átfordul, a facet-kódok nem; a kanonikus és az örökség-alak
   azonos profilt ad; nyers örökség-kód nem szivárog a kimenetbe.
2. **Forrás-őrszem:** a tárolt score-JSON-t olvasó 12 fájl mindegyike
   használja a kanonikus olvasót, ÉS egyikben sem tér vissza a nyers
   `.dimensions[…]` / `.facets[…]` indexelés. A scanner kommentmentes
   forráson fut, hogy a tiltott alakot magyarázó kommentek ne bukjanak el
   önmagukon.

Az őrszem visszamérve a hiba előtti forráson: mindhárom szempontból elbukik.

Ellenőrzés: type-check 0, lint 0, unit 937/937, client 154/154.
