# 2026-08-18 — Valencia-mentes szint-besorolás a facet- és dimenzió-értékeken

> A pontszám melletti tier-címke **„erősség / mérsékelt / figyelendő"** →
> **„magas / közepes / alacsony"**. A facet-sorok (web + PDF) is megkapják
> ugyanezt a szint-szót. Tulajdonosi döntés, 2026-08-18.

## Miért

A `getDimensionLabel` ÉRTÉKELŐ szókincset tett egy LEÍRÓ skálára — pontosan az
a hibaosztály, amit a SZÍNNÉL 2026-08-11-én már kijavítottunk (a `tierColors`
értékelő rámpa kivezetése). A `DimensionAccordion` fejkommentje maga hagyta
nyitva: *„a tier-alapú SZÖVEGES címke ettől függetlenül él tovább a stripen —
az külön termék-kérdés."* Ez az a kérdés, lezárva.

Három indok:

1. **A 0–100 nem teljesítmény-skála.** A magas Extraverzió nem „jobb", mint a
   közepes Becsületesség-Alázat — a dimenzió-szekció saját alcíme is ezt mondja
   („a dimenziók nem skatulyák, minősítések vagy percentilisek"). A valenciás
   címke egy sorral feljebb mondott ellent a szekció ígéretének.
2. **A 70-es vágás a mérési hibán belül van** (dimenzió-SEM a rövid formán
   ≈7,6 pont). A miscalibráció nem tűnik el a szócserétől, de az ÁRA
   nagyságrenddel csökken: 68-nál „közepes"-t írni kerekítési pontatlanság,
   39-nél „figyelendő"-t írni ítélet.
3. **Külön-esetet szült.** A fordított kódolású Emocionalitáson a „figyelendő"
   hazudott, ezért egy pólus-tudatos folt (`poleAwareDimensionLabel`) írta
   felül „stabil"-ra. Semleges szint-szóval a folt tárgytalan — „alacsony
   Emocionalitás" tényállítás, nem verdikt.

## Doktrína (új szabály)

**Pontszám mellé szint-szó, narratíva mellé funkció — pontszám soha nem kap
valenciát.**

A valencia NEM tűnik el a termékből, csak elköltözik: a „mi visz előre / mire
figyelj" ítélet a NARRATÍV sloté (`workstyle-content` HowYouWork
mintázat-kártyái, a `score-valence.ts` kapuján át), mert az mintázatból
következik, nem pontszám-sávból. A `score-valence.ts` kapu ezért VÁLTOZATLANUL
él — csak a badge-ág esik ki a hatóköréből.

## Mi változott

**1. Kanonikus szint-szótár.** `dimension-utils.ts`: új
`DIMENSION_LEVEL_LABELS` (magas/közepes/alacsony · high/medium/low), a
`getDimensionLabel` ebből dolgozik. A `profile-content.ts` `CATEGORY_LABELS`-e
is EBBŐL származtat — eddig két helyen élt ugyanaz a három szó.

**2. A pólus-folt kivezetve.** `poleAwareDimensionLabel` törölve; a négy hívási
hely (`ProfileTabs` strip, `share/[token]`, `PdfDimensionDetail`,
`PdfDimensionChart`) közvetlenül a `getDimensionLabel`-t hívja.

**3. Facet-szint-szó (ÚJ).** A facet-sor eddig csak sáv + szám volt: egy
csupasz „Szorongás 82" horgony nélkül lóg. A név ALÁ (nem a szám mellé) került
a szint-szó — a 48%-os PDF-hasábban és a 2 oszlopos webes rácsban a hosszú HU
facet-nevek („Esztétikai fogékonyság") mellett nincs vízszintes hely. Web és
PDF azonos szerkezettel.

**4. „erősség" mint NAGYSÁGREND → semleges.** Ahol a szöveg a pontszám
méretére mondta, hogy „erősség", átírva (HU+EN): `balancedProfile`,
`heroBalancedInsight`, a glyph-nyelvtan négy kulcsa (`heroGlyphGrammar[Uncertain]`,
`glyphGrammar[Uncertain]`, `glyphPairUncertain`), `interactionPickDominant`,
a típus-becslés jegyzete, `assessment.teaserTopDims`, és a heti emlékeztető.
„a legerősebb dimenziód" → „a legmagasabb pontszámú dimenziód".

**5. Halott valenciás keretezés törölve.** A `buildInsightBullets`
(„Erősségeid"/„Figyelendő" bullet-listák) SEHOL nem renderelődött, viszont
pontszám-sávhoz kötött valenciát keretezett — halott kódként az volt a
kockázata, hogy egy jövőbeli felület a RÉGI keretezéssel köti vissza. Vele
együtt az öt szintén halott i18n kulcs (`results.insightStrengths`,
`insightWatch`, `pdf.yourStrengths`, `pdf.watchAreas`, `pdf.summaryStrengths`)
és a `content.noLowDimension`.

**6. Az AltruismCard különszótára beolvasztva.** A Segítőkészség-kártya saját
semleges szint-szavakat tartott (`content.altruismLevel*`) — pontosan azért,
hogy elkerülje az akkor még valenciás badge-et. A kanonikus címke azóta maga
szint-szó, így a különszótár már csak DRIFTET okozott: „mérsékelt" a kártyán,
„közepes" mindenhol máshol. A kártya a `getDimensionLabel`-t hívja, a három
kulcs törölve.

## Mit NEM változtattunk (szándékosan)

- **A narratív „Figyelendő" kártya** (`results.howYouWorkWatch`,
  `pdf.watchArea`). Az nem pontszám-besorolás, hanem egy MINTÁZAT
  következmény-jelzése, és a kódban már gondosan el van választva a semleges
  „Jellemző mintázat" slottól. Ez a valencia helyes helye.
- **Az ÉRTÉKELŐ felületek** (hiring, csapat-riport, manager-cockpit:
  „Csapat erőssége", „erősségek" eyebrow). Ott egy döntéshozó legitim módon
  keres valenciát; ezek nem a kitöltő önismereti nézetei.
- **A landing marketing-szövege.** Termékígéret, nem mérési besorolás.
- **`DIMENSION_STRENGTH_DESCS` / `DIMENSION_WATCH_DESCS`.** A
  `buildInsightBullets` kivezetésével jelenleg nem renderelődnek, de a
  `reso-valence-sweep` teszt a tartalmukat őrzi — maradnak, kommentben
  jelölve, hogy csak valencia-mentes keretben használhatók újra.

## Nyitva marad (kalibráció, nem szövegezés)

A két küszöbrendszer továbbra is eltér: badge 70/40 vs. `PROFILE_HIGH/LOW`
65/35 (motor-audit F3-lelet). Semleges szóval az összehangolás KOCKÁZATA
csökkent, de a helyes vágópont a pilot-mintától függ (a nyers POMP nem
normált) — amíg az nincs, egyik tuningolt rendszert sem billentjük a másikhoz.
Ugyanígy nyitva: kapjon-e a badge hedge-sávot („Inkább magas"), ahogy a
`getEnvRows` sorai már kapnak (`envLeaningLabel`).

## Verifikáció

Type-check 0 hiba, ESLint tiszta, `check:colors` zöld,
**unit 1061/1061**, **client 217/217**. Új guardrailek: a szint-címke
valencia-mentessége minden sávon és mindkét nyelven, a pólus-folt
vissza-nem-szivárgása (forrás-szintű), és a facet-sor szint-szava
(`dimension-accordion.test.tsx`).
