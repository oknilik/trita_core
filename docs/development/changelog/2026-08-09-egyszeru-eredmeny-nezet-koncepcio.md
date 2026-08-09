# 2026-08-09 — egyszerű eredmény-nézet: koncepció + három makett

A `/profile/results` ma egy teljes riport: kikapcsolt paywall mellett
tizennégy blokk fut egyetlen fülön (hero → radar + hat sáv → hat nyitható
dimenzió 24 alskálával → altruizmus → kulcs-tanulságok → munkastílus →
ideális környezet → szerep-illeszkedés → csapatszerepek → fejlődési fókusz →
három átvezető → visszajelzés-űrlap). Tanácsadói munkához jó; első
találkozáshoz sok.

Ez a kör **nem kódot** ad, hanem egy kidolgozott koncepciót és három teljes
értékű makettet egy rövidített, „egyszerű" nézetre, amiből egy kapcsolóval át
lehet menni a mostani, részletes képre.

## A koncepció hat döntése

| # | Döntés | Miért |
|---|---|---|
| 1 | **Mondat először** | Az első dolog egy róla szóló mondat, nem ábra és nem szám. |
| 2 | **Nincs osztályzat** | Kétpólusú skála (pl. „Csendes háttér ↔ Lendületes jelenlét") — mindkét vég viselkedést jelöl, egyik sem rosszabb. A 0–100-as sáv teljesítménynek olvasódik. |
| 3 | **A szám opció** | „Számok" kapcsoló, alapból ki: a szám olyan pontosságot ígér, amivel egy önjellemzés nem rendelkezik. |
| 4 | **Három üzenet** | Erősség → működésmód → figyelendő; a tanácsadói visszajelzés természetes íve. |
| 5 | **Forrás mindig látszik** | Minden állítás alatt ott a dimenzió, amiből jön (becsült vs mért alapelv). |
| 6 | **A váltás visszafordítható** | Egyszerű ⇄ Részletes ugyanazon az URL-en, megjegyzett választással. |

## A három irány

- **A — „Egy oldal, egy történet"**: a szöveg viszi; három állítás, alattuk hat
  kétpólusú skála rövid magyarázó mondattal. Súlypont: érthetőség.
- **B — „Három kártya"**: ugyanaz az üzenet önálló, szkennelhető kártyákban;
  a hat dimenzió csukott mini-listában. Súlypont: mobil és megoszthatóság.
- **C — „A formád"**: a hat dimenzió egyetlen organikus alakzattá áll össze,
  koppintásra magyarázza magát. Súlypont: emlékezetesség.

**Ajánlás:** az A legyen az alap, B-ből a csukott dimenzió-lista mobilra,
C-ből a forma a megosztó-képre és a PDF borítójára.

## Amit a koncepció tart

- A dimenzió-címkék változatlanul a `src/lib/tritan.ts` értékei; a
  pólus-feliratok viselkedés-leírók, **nem** új dimenzió-nevek.
- A felület nem nevezi a modellt HEXACO-nak — „hat személyiségdimenzió".
- Nincs piros az értékelő rampán; a „figyelendő" is a zsálya→bronz skálán él.
- Új adat nem kell: a típus, az összegző mondat, a pontok és a szintek ma is
  elkészülnek a szerveren (`personality-type.ts`, `dimension-insights.ts`).
  Új tartalom a pólus-címkék (6×2) és a hat rövid mondat, i18n kulcson (HU+EN).

## Hol van

```
docs/design/personal-results-simple/
  README.md             — írásos koncepció, nyitott döntések, implementációs vázlat
  index.html            — áttekintés, irány-összevetés, ajánlás
  a-egy-tortenet.html   — A irány (makett + mobil + tervezői jegyzetek)
  b-kartyak.html        — B irány
  c-vizualis.html       — C irány
  shared.css / shared.js — közös stílus és renderelők (valós token-értékekkel)
```

Mindegyik makettben működik a nézetváltó, a szám-kapcsoló, a 372 px-es
mobil-keret és a jelenlegi részletes nézet rekonstrukciója az
összehasonlításhoz. A minta-persona (X 81 · O 78 · H 74 · A 55 · C 46 · E 38)
a valós számítási logikát követi: a „Kísérletező hajtóerő" címke és az
összegző mondat pontosan az, amit a kód adna ezekre az értékekre.

## Nyitott döntések

Melyik legyen a kezdőnézet · mi történjen a fülsávval egyszerű nézetben ·
pontszám a PDF-ben és a megosztó-képen · a mintaszövegek tartalmi átnézése
(HU+EN) · külső visszajelzés esetén negyedik állítás. Részletek a
`README.md` 7. fejezetében.
