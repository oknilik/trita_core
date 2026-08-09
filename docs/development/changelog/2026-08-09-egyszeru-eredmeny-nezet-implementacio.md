# 2026-08-09 — egyszerű eredmény-nézet: implementáció

A koncepció (ld. `2026-08-09-egyszeru-eredmeny-nezet-koncepcio.md`) megépült.
A `/profile/results` mostantól két nézetben él, egy kapcsolóval köztük:

- **Egyszerű** — típus + egy mondat (hero) → három állítás → hat kétpólusú
  skála → módszertani jegyzet + két kilépési pont. **Ez az alapértelmezés.**
- **Részletes** — a mai riport, változatlanul.

## Termék-döntések (ezek nem technikaiak)

| Kérdés | Döntés |
|---|---|
| Melyik irány | Az „A" (három állítás + kétpólusú skála), a „B"-ből a mobil csukott lista |
| Kezdőnézet | Első megnyitáskor **egyszerű**, utána amit a felhasználó utoljára használt |
| Preferencia tárolása | `UserProfile.resultsViewMode` (eszközfüggetlen), Prisma-migrációval |
| Fülsáv az egyszerű nézetben | **Nincs** — a „Külső kép" a lap alján egy átvezető sor |

## A nézet öt szabálya, amit a kód is őriz

1. **Mondat először.** A hero (típus + összegző mondat) mindkét nézet közös
   eleme; alatta rögtön a három állítás jön, nem a radar.
2. **Nincs osztályzat.** A hat dimenzió kétpólusú skálán áll
   („Csendes háttér ↔ Lendületes jelenlét"): mindkét vég viselkedést jelöl.
   A 45–55 közti sávban egyik pólust sem emeljük ki — ott tényleg „mindkettő".
3. **A szám opció.** A „Számok" kapcsoló alapból KI; munkamenet-szintű,
   nem tárolt preferencia (nem hordoz szándékot, ellentétben a nézettel).
4. **Forrás mindig látszik.** Minden állítás alatt ott a dimenzió, amiből
   származik. Kiegyensúlyozott profilnál (a legalacsonyabb dimenzió ≥ 60) a
   „figyelendő" nem egy dimenzióról szól — ilyenkor nincs chip, nem gyártunk
   hamis forrást.
5. **A váltás visszafordítható.** Ugyanaz az URL, `?view=simple|full`.

## Mélylink-védelem (enélkül flow-k törtek volna)

Az egyszerű nézetben nincs fülsáv, viszont tíz+ helyről érkeznek
`?tab=comparison#invitations` alakú linkek (értesítő e-mailek, journey-CTA-k,
súgó, csapat-nézet). Ezért a feloldás sorrendje:

```
?view=  →  ?tab= (van fül-kérés → részletes)  →  tárolt preferencia  →  egyszerű
```

Aki fület kér, fület kap — a tárolt „egyszerű" preferencia sem írja felül.

## Új / módosult fájlok

```
prisma/schema.prisma                         UserProfile.resultsViewMode String?
prisma/migrations/20260809120000_add_results_view_mode/

src/lib/results/view-mode.ts                 nézet-mód feloldás (URL → tab → tárolt → alap)
src/lib/results/simple-summary.ts            nézetmodell: 6 pontszám → 3 állítás + 6 sor
src/lib/results/simple-copy.ts               szöveg-táblák (pólusok, szint-mondatok,
                                             erősség/működésmód/figyelendő) HU+EN

src/components/results/simple/SimpleResultsView.tsx
src/components/results/simple/StatementBlock.tsx
src/components/results/simple/DimensionSpectrum.tsx
src/components/results/simple/ViewModeSwitch.tsx

src/app/api/profile/view-mode/route.ts       POST { mode } → UserProfile
src/app/(app)/profile/results/page.tsx       nézet feloldása + nézetmodell (szerver-oldalon)
src/components/profile/ProfileTabs.tsx       nézet-ág; a hero, a megosztás és a
                                             PDF-generálás közös marad
src/lib/i18n/results.ts                       viewMode* / simple* kulcsok (HU+EN)
```

**Új adat nincs**: ugyanazokból a dimenzió-pontszámokból dolgozik, mint a
részletes kép, és nincs plusz DB-hívás. A szöveg-táblák szerver-oldalon
maradnak (a nézetmodell szerializálva megy a kliensre).

## Amit a nézet szándékosan NEM tartalmaz

Fülsáv, haladás-sáv, alskálák, altruizmus-kártya, munkastílus, ideális
környezet, szerep-illeszkedés, csapatszerepek, karrier-átvezető,
következő-lépés kártya. Mind ott van a részletes nézetben, egy kattintásra.
A **visszajelzés-űrlap mindkét nézetben renderel** — az alapértelmezett nézet
nem eshet ki az elégedettség-mérésből.

## Tesztek

- `tests/unit/results/simple-summary.test.ts` — tartalom-guardrail (mind a hat
  dimenzióhoz van pólus, szint-mondat és mindhárom állítás-szöveg, HU+EN),
  állítás-kiválasztás, determinisztikus döntetlen-feloldás, kiegyensúlyozott
  profil, altruizmus-kizárás.
- `tests/unit/results/view-mode.test.ts` — feloldási sorrend, mélylink-védelem.
- `tests/client/results/simple-results-view.test.tsx` — alapból nincs szám a
  képernyőn, a kapcsoló előhozza, három forrásolt állítás, kilépési pontok.

Gate: type-check + lint + check:colors tiszta, 611 unit, 127 client zöld.

## Nyitott (későbbi kör)

- Külső visszajelzésnél negyedik állítás („Ahogy mások látnak"), csak a
  küszöb felett, forrás-jelöléssel.
- A megosztó-kép és a PDF borítója a koncepció „C" irányának formájával.
- A mintaszövegek tartalmi átnézése éles előtt (HU+EN) — a táblák
  `src/lib/results/simple-copy.ts`-ben, egy helyen szerkeszthetők.
