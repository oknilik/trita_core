# 2026-08-18 — A PDF-riport szerkezeti és vizuális egységesítése a webbel

A letölthető egyéni riport színpalettája és betűcsaládjai már közel álltak a
webhez, de az információ-architektúra, a tipográfiai hierarchia és az
oldalsűrűség jelentősen eltért: a PDF saját fejezetsorrendet, saját
összefoglalót és saját, PDF-only fejezeteket vitt, a lényegi szöveg zöme
5,5–7,5 pt volt, és a számozás a borítót is beleszámolta.

Ez a kör a **webes eredményoldalt tette a PDF tartalmi source of truth-jává**,
és az odavezető tartalmi logikát egyetlen, médiumfüggetlen view-modelbe emelte.

## Amit a felhasználó lát

**Új oldalsorrend** — pontosan a webes fejezetszerkezet
(`ProfileTabs` / `LinearReport`):

```
Borító → Gyors összkép → 01 · Áttekintés → 02 · Dimenziók
       → 03 · Munkastílus és fejlődés
       → mellékletek: Külső nézőpont · Kapcsolati dinamika
```

> A **Karrier-iránytű melléklet parkolva** — ld. lentebb.

- **Gyors összkép**: ugyanaz a HÁROM insight, mint a weben („Ami természetesen
  megy" · „Ami több figyelmet kérhet" · „Ahol a legtöbbet fejlődhetsz"), szó
  szerint ugyanabból a builderből. A korábbi erősség–vakfolt–nyomás–csapatszerep
  kéthasábos mikroszöveg kivezetve. Az oldal alján `01–03` tartalomjegyzék
  oldalszámokkal.
- **01 · Áttekintés**: radar, hat dimenziós sávlista pólus-tudatos
  szint-címkékkel, radar-magyarázat, profil-karakter.
- **02 · Dimenziók**: dimenziónként érték, értelmezés és alskálák — oldalanként
  legfeljebb három részletes dimenzió; a fejezet végén a kiegészítő skála (ha
  valóban mérve lett) és a kulcstanulságok.
- **03 · Munkastílus és fejlődés**: Ahogy működsz → **Ideális környezet** (ez a
  webes szekció eddig egyáltalán nem jutott át a PDF-be) → Szerepkör-illeszkedés
  → Csapatszerepek → Fejlődési fókusz háromlépcsős akciótervvel.
- **Kapcsolati dinamika**: a korábbi „Csapatban működve" és „Vakfoltok és nyomás
  alatt" oldalak — amelyek a webes három fejezetben ilyen formában nem
  szerepelnek — a riport VÉGÉRE kerültek, világosan megnevezett, profil-alapú
  BECSLÉSKÉNT. Nem ékelődnek főfejezetként a webes struktúrába.
- **Nincs ismétlés**: identitás és archetípus csak a borítón; a három fő insight
  csak a Gyors összképben; mérési adat az Áttekintésben és a Dimenziókban;
  gyakorlati alkalmazás a Munkastílusban.

**Olvasható tipográfia.** A skála tokenizálva
(`src/components/pdf/styles.ts` → `type`): fejezetcím 24 pt Fraunces,
szekciócím 15, kártyacím 9,5, törzsszöveg 9,5/1,5 sorköz, caption 8 pt. A 6 pt
`micro` token KIZÁRÓLAG a láblécre való. Lényegi szöveg 8 pt alatt nincs
(guardrail-teszt őrzi). Valódi fejezetfejléc készült (bronz sorszám · eyebrow-
kérdés · Fraunces cím · leírás · elválasztó) a korábbi „minden cím apró,
széthúzott uppercase eyebrow" helyett.

**Kártyák és sűrűség.** 12 pt sarok, 14–16 pt belső padding, egy kártya = egy
tartalmi egység, kevesebb egymásba ágyazott színezett doboz; a sage/bronz/
semleges tónus ugyanazt jelenti, mint a weben. Egy insight- vagy dimenziókártya
nem törik ketté, a fejezet viszont törhet.

**Borító.** Rákerült a karakterábra (`PdfTypeGlyph` — ugyanaz a vizuális
nyelvtan, mint a képernyőn és a megosztó-kártyán, a közös `type-glyph.ts`
geometriából), a hero-insight és a kanonikus Trita szójel.

## Karrier-iránytű: parkolva a riportban is

A karrier-felület a `portfolio-parking.ts`-ben `parked` állapotú, és a webes
eredményoldal már ma is elrejti (`careerModuleHidden`). A riport-réteg viszont
nem tudott erről: ha a hívó bármilyen okból karrier-adatot adott át, a PDF
legyártotta a mellékletet (a regressziós készlet éppen ezt csinálta).

A kapu ezért a közös view-modelbe került (`careerAppendixEnabled()` →
`isPortfolioSurfaceActive("career")`): parkolt felület mellett sem melléklet,
sem PDF-könyvjelző, sem karrier-adat nem kerül a modellbe — hívótól függetlenül.

**Ez parkolás, nem törlés.** Az `AppendixCareerPage`, a `pdf.career*` i18n-
kulcsok és a `ProfileTabs` karrier-építő blokkja a repóban maradnak; a felület
`active`-ra váltásával a melléklet magától visszatér, kód-változtatás nélkül.
A szerkezeti teszt ehhez igazodik: a parkolási állapotot olvassa, tehát
visszakapcsoláskor automatikusan a melléklet JELENLÉTÉT várja el.

## Javított hibák

**1. Nem létező kiegészítő skála 0%-ként.** A persona-dosszié „Segítőkészség
0%"-ot mutatott, holott a rövid TSFI-S formában nincs ilyen item: a generátor
`persona.dimensions[dim.code] ?? 0` fallbackje koholta a nullát. A kiegészítő
skála mostantól csak VALÓDI, kitöltésből származó `I` értékre renderel — a
kapu a közös view-modelben ül, a hiányzó adat sehol nem válik nullává.

**2. Oldalszámozás.** A borító komment szerint számozáson kívüli volt, de a
lábléc dokumentum-szintű `pageNumber / totalPages`-t írt, ezért az első
tartalmi oldal `2 / 6`-ot mutatott. A `PdfFooter` most kivonja a borító-eltolást
(`coverPages`), a borítón pedig nincs lábléc: az első tartalmi oldal `1 / N`,
és automatikusan áttört oldalak mellett is helyes marad.

**3. Nem renderelhető unicode ikonok.** Az önkép–visszajelzés összegző „✓ / ⚠"
jelére sem a DM Sans, sem a Fraunces nem tartalmaz glyphet: a böngészőben tofu
lett belőle, node-ban (persona-dosszié, snapshot-készlet) pedig a szövegmérés
szállt el rajta (`Cannot read properties of null (reading 'unitsPerEm')`). A
jel View-alapú lett — ugyanaz a minta, mint a `PdfAltruism` info-jelénél.

**4. Átfedő fejléc oldaltörésnél.** A `fixed` mini-fejléc a flow-ban ült, ezért
a folytatás-lapokon a beúszó tartalom alá csúszott. A fejléc és a lábléc most
abszolút pozicionált, a helyüket a lap paddingje foglalja (`styles.chrome`).

**5. Árva címkék az összevetés-mellékletben.** A vakfolt-tételek és az
összevetés-sorok `wrap={false}`-ok, így nem törnek ketté oldalhatáron.

**6. `rgba()` a keret-shorthandben.** A react-pdf `border` parsere nem oldja fel
az `rgba()`-t, ezért a sage kártyák bronz keretet kaptak. Előkevert
`sage200` / `bronze200` tint a `design-tokens.ts`-ben.

## Technikai egységesítés

**`src/lib/profile-report-view-model.ts` (új).** A riport tartalmi
összeállítása korábban KÉT helyen élt — a `ProfileTabs` letöltés-handlerében és
a persona-generátorban —, külön sorrenddel és külön fallbackekkel, ezért a két
kimenet folyamatosan szétcsúszott. Az összkép-insightok, a bulletek, a
profil-karakter, az archetípus-sztori, a csapatszerep-precedencia, a fejezet-
metaadat és a mellékletek listája innentől egy helyen készül; a web és a PDF
csak megjelenít. A webes `ProfileSummary` ugyanezt a buildert hívja
(re-exporttal), tehát a „három insight" definíció szerint azonos.

**PDF-metaadat és navigáció.** Dokumentumcím, szerző, tárgy, nyelv; PDF-
könyvjelző a borítóra, a Gyors összképre, mind a három főfejezetre és minden
mellékletre.

**Kivezetett fájlok.** `StartPage` · `SummaryPage` · `PlusFacetsPage` ·
`PlusWorkStylePage` · `CollabPage` · `PdfHeader` · `PdfInsightPair` ·
`PdfDimStrip` · `PdfDimDetails` · `PdfFacets` — helyettük fejezet-alapú lapok
(`QuickOverviewPage`, `Chapter*Page`, `Appendix*Page`) és a közös
`PdfWordmark` / `PdfChapterHeader` / `PdfDimensionDetail` /
`PdfIdealEnvironment` / `PdfTypeGlyph` építőelemek.

## Tördelési javítások (éles riport-visszajelzés)

Egy valódi Plus riport két hibát hozott vissza:

**1. Üresen lebegő lap.** Az utolsó kártya `marginBottom`-ja éppen túllógott a
tartalom-dobozon — a törzs 795,9 pt-nál ért véget, +12 pt margó = 808 pt = a
doboz alja —, és a react-pdf tartalom nélküli folytatás-lapot nyitott: csak a
fixed fejléc és lábléc látszott rajta. A kártya-közöket innentől a KONTÉNER
`gap`-je adja (`styles.ts` → `s.body`), így az utolsó elem után nincs margó,
ami túllóghatna. A hiba ezzel szerkezetileg kizárt, nem csak eltalált.

**2. Árva kártyafejléc.** Egy törhető (`wrap`) kártya fejléce még kifért a lap
aljára, a tartalma viszont már a következőre került — üres kártyahéj maradt a
lap alján. A react-pdf a törhető gyereknél a `minPresenceAhead` orphan-védelmet
NEM alkalmazza (`shouldBreak`: `shouldSplit && canWrap` ágon a jelenlét-
számítás ki sem fut), tehát konténer-szinten nincs mód a fejléc megtartására.
A riport minden kártyája bőven egy lapnál kisebb, ezért a helyes viselkedés az,
hogy a kártya EGYBEN csúszik a következő lapra — a `wrap` mind a kilenc
hívási helyről kivezetve.

Mellékesen: a 02 fejezet záró blokkjai (kiegészítő skála + kulcstanulságok)
egy nem törhető csoportba kerültek, így nem sodródik szét a fejezetzárás.

## Regressziós készlet

`pnpm report:pdf-snapshots` — 11 forgatókönyv a VALÓDI dokumentum-komponensből
(Start/Plus, HU/EN, kiegyensúlyozott, több magas, több alacsony, hosszú magyar
szövegek, kiegészítő skálával és nélküle, observer-melléklettel, hiányzó
opcionális tartalmakkal). Két eset szándékosan karrier-adatot is átad — annak
védelmére, hogy parkolt felület mellett SEM készül karrier-melléklet. PDF mindig
készül; PNG akkor, ha van `pdftoppm`/`pdftocairo` a PATH-on.

A snapshot-script minden renderelt PDF-et le is auditál: ha bármelyik lapon
csak a fixed fejléc és lábléc van (üres lap), hibával áll le.

Automatikus szerződés:
- `tests/client/results/pdf-report-blank-pages.test.ts` — valódi rendereléssel
  ellenőrzi, hogy nincs üres, lebegő lap. (A client rétegben fut: a unit réteg
  `--conditions=react-server` alatt indul, ahol a react-pdf reconcilere nem
  működik.)
- `tests/unit/results/pdf-report-pagination.test.ts` — a két tördelési hiba
  SZERKEZETI oka: a lap-törzs gap-pel tart közt (a kártya nem visz alsó
  margót), és a riport kártyái nem törhetnek.
- `tests/unit/results/pdf-report-structure.test.ts` — fejezetsorrend, melléklet-pozíció, a három
  insight szövegszintű egyezése a webes builderrel, TOC-oldalszámok, „nincs
  0% hiányzó adatból", oldalanként max. 3 dimenzió, Start-riport zártsága,
  a karrier-melléklet parkolás-követése.
- `pdf-typography-scale.test.ts` — nincs 8 pt alatti lényegi szöveg, a skála
  tokenjei a sávban maradnak, és minden leírt karakterre VAN glyph a
  regisztrált fontokban (a cmap-ot a teszt a TTF-ekből olvassa).

## Verifikáció

Type-check 0 hiba · ESLint tiszta · `check:colors` zöld · unit **1060/1060** ·
client **215/215** · mind a 12 PDF-forgatókönyv renderel üres lap nélkül, a
számozás a borító utáni `1 / N`-nel indul, és a tartalomjegyzék oldalszámai a
tényleges lapokra mutatnak.

A két tördelési őrt visszaellenőriztem a javítás ELŐTTI állapoton is: mindkettő
bukik, és a blank-page teszt pontosan a bejelentett `#8` lapra mutat.
