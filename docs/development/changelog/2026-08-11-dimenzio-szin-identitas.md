# 2026-08-11 — Dimenzió-szín: értékelő rámpából identitás-paletta

> Bejelentés: „jelenleg két színt látok, nincs skála. 68%-al már piros az
> érték." A vizsgálat a küszöbnél mélyebb problémát talált.

## Mi volt a baj

A dimenzió-felületek a `tierColors` értékelő rampot használták (≥70 zsálya,
40–69 bronz, <40 homok) — ez festette a kártyát, a keretet, a pöttyöt, a
sávot és a számot. Három, egymástól független hiba:

**1. A gyakorlatban bináris volt.** Három fokozat létezett, de a <40 sáv
ritka, így egy tipikus profil csak kettőt mutatott. „Skála" helyett
megfelelt / nem-felelt-meg kép.

**2. A 70-es vágás a mérési hibán belül járt.** A dimenzió-SEM az
alapértelmezett rövid formán **≈7,6 pont**. A 68 hibasávja tehát ~60–76 —
*átfedi a 70-et*. A szín kategorikus különbséget állított 68 és 82 közé,
amit az instrumentum nem tud feloldani, miközben 68 és 46 azonos színt
kapott. Lépcsőfüggvény nagyságrend helyett — szemben a projekt minden más
felületén érvényesített SEM-tudatossággal.

**3. Értékelő rámpa leíró skálán.** A tokenek neve `--color-eval-*`, a
címkék „erősség / mérsékelt / figyelendő". De a 82% Extraverzió nem *jobb*,
mint a 68% Becsületesség-Alázat. Ez ellentmondott
- a szekció saját alcímének („a dimenziók nem skatulyák, hanem mintázatok"),
- a `score-valence.ts` aznapi termékdöntésének (az Emocionalitás **mindkét**
  pólusa valencia-mentes — mégis ugyanazt a zöld/bronz/homok kezelést kapta;
  egy E=30 user a „figyelendő" tintet kapta azért, mert érzelmileg stabil),
- és a `color-system.ts` saját doksijának, amely kimondja: *„a dimenzió
  identitást kódol, nem értéket"*, illetve hogy egy hue csak EGY
  jelentés-osztályban élhet.

A `/share` oldal ezen felül kézzel gyártott tier→szín leképezést használt, és
abban a **self réteg-akcentjét** (`--color-action-primary-bg`) tette
adat-markká — vagyis a „hol vagyok" osztályt keverte a „mit látok"-ba.

Árulkodó jel volt, hogy a radar melletti strip a pöttyöt és a számot már
eddig is **dimenzió-identitás** szerint színezte, csak a badge-et tier
szerint — két színrendszer futott egymás mellett ugyanazon a soron.

## Mi lett helyette

**A szín a dimenziót AZONOSÍTJA, az értéket a sáv hossza és a szám hordozza.**

A `DIMENSION_COLORS` paletta (indigó · viola · okker · moha · petrol · mályva)
már létezett, és a radar is ezt használja — most minden dimenzió-felület erre
állt át. A kártya és a keret semleges lett; a hue a pöttyön, a sávon és a
számon azonosít. A facetek a saját dimenziójuk hue-ját öröklik.

Új: `DIMENSION_COLORS_CSS` + `dimColorsCss()` a `color-system.ts`-ben — a
`DYNAMICS_COLORS` / `DYNAMICS_COLORS_CSS` páros mintájára. A literál hex a fix
médiumoké (react-pdf, OG, email), a CSS-változós alak a DOM-é, hogy kövesse a
színsémát. A kettő szinkronját a meglévő `ts-color-maps` teszt őrzi (kiterjesztve).

Érintett felületek: eredményoldal-akkordeon (+ facet-rács), radar melletti
strip, `/share` (strip + részletkártyák), landing hero, Segítőkészség-kártya,
és a négy PDF-komponens (`PdfDimStrip`, `PdfDimDetails`, `PdfFacets`,
`PdfDimensionChart`).

**Segítőkészség:** nem a hat főfaktor egyike, ezért nincs saját hue-ja —
semleges tintet kap. A kártya vizuálisan is azt mondja, amit a bannere
szövegben állít; a fájl saját kommentje eddig is panaszkodott a valenciás
kezelésre.

**Kivezetve:** a `tierColors` Tailwind-térkép (halott kód lett). A
`getDimensionTier` / `getDimensionLabel` **megmarad** — a szöveges címkét és a
próza-kapukat továbbra is az vezérli.

## Regressziós védelem

Új: `tests/unit/design/dimension-color-identity.test.ts` (7 teszt)

- a 70-es vágás SEM-en belüli volta **számszerűen** rögzítve (ha az indoklás
  alapja megdőlne, a teszt szól);
- a dimenzió-paletta és az `EVAL_RAMP` színhalmaza nem metszi egymást
  (jelentés-osztályok szétválasztva);
- mind a hat dimenzió külön hue-t visel, a Segítőkészség egyiket sem;
- az E színe a pontszámtól **szerkezetileg** független (valencia-mentesség
  garanciája, nem konvenció);
- forrás-őrszem: a 9 dimenzió-felület egyike sem hivatkozhat `tierColors`-ra
  vagy `--color-eval-*` tokenre, és mindegyik a kanonikus lookupot hívja;
- a `tierColors` export nem születhet újra.

Ellenőrzés: type-check 0, lint 0, check-colors OK (nyers hex 22/22 keret
tartva), unit 945/945, client 154/154.

## Nyitva hagyva (külön termék-kérdés)

A **szöveges** tier-címke („erősség / mérsékelt / figyelendő") változatlan.
Ugyanaz a valencia-érv áll rá, ami a színre állt — de ez terméknyelv-döntés,
nem vizuális szabály, ezért nem a színjavítással együtt kezelendő.
