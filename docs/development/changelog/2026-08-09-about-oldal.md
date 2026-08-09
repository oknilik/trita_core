# 2026-08-09 — `/about`: „Mi az a Trita" (gondolat-oldal)

A marketing-fa eddig minden lapon **ajánlatot tett**: a landing a felmérést,
a `/pricing` az együttműködést, a `/pilot` a programot. Nem volt olyan lap,
ami egyszerűen **elmagyarázza, mi ez az egész** — pedig a kapcsolatfelvételi
beszélgetések a „és ez hogyan áll össze?" kérdéssel kezdődnek. Ez a kör ezt
a lapot tette le.

## Mit mond a lap, és milyen sorrendben

1. **Hero** — a tét egy mondatban: a csapatról szóló döntéseknek ma nincs
   más alapjuk, mint a benyomás.
2. **Miért csináljuk** — a három dolog, amit a meglévő eszközök nem adnak
   meg (a benyomás nem összevethető · a típus-címke megáll a névnél · a
   hangulatmérés a tünetet nézi).
3. **Hogyan épül fel** — a négy mérési réteg + a belőlük készülő validált
   csapatkép (saját ábra).
4. **Az út** — magadtól a csapaton át a szervezetig (saját ábra).
5. **Amit betartunk** — a négy hitelességi szabály: becsült ≠ mért,
   aggregált csapatkép, emberi validálás, nincs jó és rossz profil.
6. **Mi a célunk** — rendezetlenből rendezett (saját ábra), majd CTA.

A CTA-k szándékosan **hátul** vannak, és a lap nem árazik: a `/pricing` és a
`/pilot` dolga az ajánlat, ezé a magyarázat.

## Három saját ábra — és miért nem `EditorialArt`

Az `EditorialArt` sorsolt kompozíció: szándékosan **nem állít semmit**. Itt
viszont az ábra maga a mondanivaló (négy réteg → egy kép; táguló kör;
rendezetlenből rendezett), tehát a geometriának kézzel meghatározottnak kell
lennie. Új modul: `src/components/about/AboutDiagrams.tsx`.

A szintbesorolás **nem sérül**: a modul kizárólag az `EDITORIAL_SHAPES`
(2. szint) nem foglalt készletéből dolgozik. A hat jelentő alapforma
(`type-glyph.ts`) itt nem jelenhetne meg — egy magyarázó ábrán ugyanaz a
bronz csepp azt sugallná, hogy egy konkrét dimenzióról beszélünk.

Két döntés, ami nem nyilvánvaló:

- **A validálás gyűrűje szaggatott.** A rétegábrán az összefutás pontját
  vékony, szaggatott tintagyűrű zárja körbe: ez az egyetlen elem, ami a „nem
  algoritmus dobja ki" állítást vizuálisan is elmondja. Folytonos vonallal
  gépi határnak látszana, nem emberi ellenőrzésnek.
- **Az útábrán minden boltívben pontosan EGY pont zsálya.** A kör tágul
  (1 → 2 → 4 → 7 pont), de a kiindulópont nem tűnik el belőle. Ez a
  „mindenki a saját eredményénél kezd" szabály képi megfelelője.

**SVG-ben nincs szöveg** — a kódbázis sehol nem tesz `<text>`-et ábrába. A
felirat mindig HTML: törik, fordul (HU/EN) és felolvasható. Az ábra
`role="img"` + `aria-label`, a tartalmát a mellette lévő kártyák amúgy is
teljesen leírják.

## Amit a renderelés fogott

Új előnézet-generátor (`scripts/preview-about-diagrams.ts`, mintája a
`preview-editorial-art.ts`): két szélesség × két színséma. Kézzel elhelyezett
geometriánál nem a méret-viselkedés a kockázat, hanem hogy két elem egymásba
lóg — az pedig csak kirenderelve látszik. Két hiba jött elő így:

1. **A négy összekötő egyetlen pontba csomózódott.** Az utolsó ~30 pixelen
   egymásra csúsztak, és a csomó nyílhegynek látszott: „belefúródik" a
   „összeér" helyett. Most a gyűrű bal ívének négy külön pontjára érkeznek.
2. **A `blob` path TÚLLÓG a saját −50…50 egységnégyzetén** (x ≈ −62…56).
   Emiatt a célábrán a 96-os folt jobb széle 410-ig ért, és a mellé tett
   holdsarlóból alig kilátszó szilánk lett. A méretek most az effektív
   dobozhoz igazodnak, nem a névleges 100-hoz.

## Egyéb

- **i18n**: az `about.*` kulcsok a `landing.ts` doménben (ahol a `pilot.*` és
  a `pricing.*` is él), tehát a szűk publikus szótár automatikusan viszi —
  nem kellett új domain-import a `public.ts`-be.
- **Belső linkelés**: lábléc (a Termék oszlop első tétele), `sitemap.ts`
  (0.8 prioritás) és `llms.txt`.
- **Szóhasználat** a CLAUDE.md szabályai szerint: „hat személyiségdimenzió"
  (modellnév nem megy ki a felületre), „csapatszerep-kérdőív" (nem Belbin),
  a kérdésbank „szabadon felhasználható, kutatásban használt".

## Ellenőrzés

`pnpm type-check` + `pnpm lint` + `pnpm check:colors` zöld (nyers hex a
UI-scope-ban 21/22 — az új kód nem visz be egyetlenegyet sem, minden szín
`ART_COLORS`-ból jön). Unit 598/598, client 120/120 — ebben benne van a
publikus szótár őrző tesztje is, ami minden `t()` kulcsot felold HU-ra és
EN-re. A `next build` TypeScript-fázisa átment; a teljes build ebben a
konténerben a hiányzó `RESEND_API_KEY` miatt áll meg (env-hiány, nem
kód-hiba), ezért a lap futásidejű renderje itt nem volt ellenőrizhető — az
ábrák viszont igen, az előnézet-generátorral.
