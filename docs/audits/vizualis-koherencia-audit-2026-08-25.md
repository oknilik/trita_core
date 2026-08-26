# Vizuális koherencia-audit — 2026-08-25

> Cél: egységes vizuális kép a userek felé. A kérdés: mely részek lógnak ki
> az egységből, és hogyan hozhatók be. Alap: `main@4191bce`.
>
> Módszer: a saját normatív doksik (ui-token-map, color-system-2026-08,
> ui-contribution-guide, ui-hotspots, email-design) mércéjén; teljes
> kódbázis-inventár (szín-, tipográfia-, radius-, shadow-, primitív- és
> eyebrow-használat számszerűen), a brand- és borító-assetek vizuális
> megtekintése, valamint a 08-24–25-ös napi audit vonatkozó leletei.
> A számok a jelentés készítésekor mért `grep`-leltárból jönnek.

## 0. Összkép

**A vizuális rendszer magja szokatlanul egységes** — a színrendszer az
állatorvosi minta, ahogy egy design-rendszert őrizni kell: szemantikus
token-rétegek (`color-system-2026-08`), CI-ben futó guardrail
(`scripts/check-colors.mjs`, pl. `bg-white → bg-surface-card` tiltás),
scope-olt és festés előtt beálló dark mode, szinkron-ellenőrzött
alias-réteg. Ennek eredménye mérhető: a teljes `src/`-ben **mindössze 4
fájlban** él arbitrary hex-utility (10 érték), és **1 fájlban** idegen
Tailwind-paletta (orange). A betű-identitás (Fraunces + DM Sans + DM Mono)
a weben, a PDF-ben, az emailben és az OG-képeken is ugyanaz; az emailek
színe a `design-tokens.ts`-ből jön (0 kósza hex a layoutban); egyetlen
saját ikonkészlet van (nincs lucide-keveredés); a SectionEyebrow 82
fájlban él, ad-hoc eyebrow-minta csak 8-ban.

**Ahol az egység törik, az három front:** (1) a tipográfiai skálák
párhuzamossága — a 9 szerep-utility mellett él egy nyers Tailwind-fok
réteg (~294 előfordulás, főleg az app-felületeken) és egy csak-marketing
`text-fluid-*` skála, amely már éles hibát is termelt; (2) a
**márka-háromszög**: a tipografikus fejléc-szójel, az új Miró-stílusú
böngésző-ikon és a még kiszolgált régi hexagon-ikonok három
brand-generációt mutatnak egyszerre; (3) a **blog képi világa** — önmagában
konzisztens, de a termék-tokenektől idegen árnyalatokra épül, és nincs
kimondva, hogy ez tudatos szub-brand.

## 1. Rangsorolt kilógás-lista

### 1.1 [ERŐSEN] Három párhuzamos tipográfiai skála

Mért állapot (`src/**/*.tsx`):

| Skála | Előfordulás | Hol |
|---|---|---|
| 9 szerep-utility (`text-hero…micro`) | ~1 592 | mindenhol — ez A rendszer |
| Nyers Tailwind-fok (`text-lg…7xl`) | 294 | főleg app: `(app)` 136, `components/team` 46 |
| `text-fluid-*` | 27 | csak marketing: landing, blog, career |

Top nyers-fok fájlok: `observe/[token]/page.tsx` (12),
`advisory/AdvisoryPageClient.tsx` (10), admin fakedoor (9, parkolt),
`org/[id]/campaigns/[campaignId]/page.tsx` (8), `profile/page.tsx`,
`TeamMemberSnapshot.tsx`, `TeamReportComparison.tsx` (6-6).

Két súlyosbító körülmény:
- A fluid skála **dokumentálatlan** a szerep-rendszer mellett, és már éles
  hibát termelt: a blog-index a nem létező `text-fluid-heading`-et
  használja (`BlogListContent.tsx:240,297`) → a kiemelt cikk címe alap
  méretben renderel. A lint ezt nem fogja (csak a `text-[Npx]`-et tiltja).
- A **legfrissebb** komponensek (a 08-25-i `profile/page.tsx`,
  `TeamMemberSnapshot`) nyers fokokkal készültek — a drift élő, nem örökség.

**Javaslat:**
1. Azonnal: `text-fluid-heading` → `text-fluid-title` (vagy az utility
   definiálása) — egysoros, látható javítás.
2. Döntés: a fluid skála vagy legyen a marketing display-rétegének
   **dokumentált** része (globals.css-ben definiált teljes lépcső + egy
   sor a CLAUDE.md-ben: „marketing hero/cím: fluid; minden más: szerep-
   utility"), vagy olvadjon be a szerep-utilitykbe.
3. A `check-colors.mjs` mintájára tipográfia-guardrail: app-felületen
   (`(app)`, `components/team|org|results|dashboard`) tiltsa az új nyers
   `text-lg…7xl` bevezetését (meglévők allowlistben, fokozatos leépítés).
4. Migráció a top-lista sorrendjében — először az observer-oldal (publikus,
   első benyomás!) és a friss snapshot-komponensek.

### 1.2 [ERŐSEN] Márka-háromszög: szójel vs Miró-ikon vs hexagon-örökség

Ma egyszerre él három brand-kifejezés:
- **Fejléc**: tipografikus `trıta` szójel (Fraunces black, bronz i-pont) —
  minimál, elegáns (`TritaLogo.tsx`).
- **Böngésző-ikon / kereső-logó**: Miró-stílusú illusztratív kompozíció
  (`public/brand/*`) — játékos, organikus; palettája a termékhez közeli
  (sage-zöld, bronz, krém, homok), de tartalmaz **piros** akcentust, ami a
  token-rendszerben nem létezik.
- **Örökség**: a `/icon` és `/apple-icon` route (`src/app/icon.tsx`,
  `apple-icon.tsx`) még a RÉGI meleg-barna hexagon-ikont szolgálja ki
  (#6B4A3F/#B5836A/#B85A34); árva `public/favicon.svg`, `icon.svg`,
  `trita-logo.svg`; a `favicon.ico` 159 kB és duplikált.

Egy user a fülön az egyiket, a headerben a másikat, egy régi
könyvjelzőn/olvasóban a harmadikat láthatja.

**Javaslat:** (1) a régi ikon-route-ok és árva SVG-k törlése + favicon.ico
optimalizálás — kockázatmentes takarítás; (2) rövid „brand-lockup" szabály
a CLAUDE.md-be: mikor szimbólum (Miró-jel), mikor szójel, mikor a kettő
együtt; (3) a piros akcentus rendezése: vagy token legyen (pl.
`--color-accent-editorial-red`, kimondott használati körrel), vagy a jel
következő iterációjában bronz/rozsda árnyalatra hangolni.

### 1.3 [KÖZEPESEN] A blog képi világa mint kimondatlan szub-brand

A 7 borító (`public/blog-covers/`) önmagában feszes, egységes editorial
család: homok alap, erdőzöld, bordó, mustár/oliva, krém — flat, organikus
formák. Ez a világ **közeli, de idegen** a termék-tokenekhez: nincs benne
a sage (#3d6b5e) és a bronz (#c17f4a), helyette bordó és mustár. A
Miró-ikon szellemében ehhez a világhoz áll közelebb, nem a termék-UI-hoz.

Ez működhet tudatos editorial szub-brandként — de ma nincs kimondva, így
driftként viselkedik (a #55-ös borítócsere pl. változatlan fájlnéven hozott
új bájtokat, cache-kockázattal).

**Javaslat:** rögzíteni egy rövid doksiban (pl.
`docs/development/editorial-art.md` bővítése): az editorial paletta nevesített
értékei, hol jelenhet meg (blog, borító, social/OG), és mi a viszonya a
termék-tokenekhez (pl. „a zöld/bronz tengely közös, a bordó/mustár csak
editorial felületen élhet"). A következő borító-generálásnál a zöldet a
sage-hez közelíteni olcsó nyereség.

### 1.4 [KÖZEPESEN] Radius/shadow/spacing: nincs tokenizált lépcső

Mért szórás: `rounded-lg` 430 · `rounded-xl` 347 · `rounded-2xl` 186 (+
full 572, md 25, sm 17) — három kártya-léptékű radius él egymás mellett,
miközben a kanonikus panel-recept (ui-hotspots) `rounded-2xl`. Shadow:
`shadow-sm` 132 a domináns, de md/lg/xl/2xl is él (60 együtt). A
ui-token-map már 2026-04-ben jelezte: radius/shadow/spacing token-lépcső
nincs.

**Javaslat:** 3 radius-szerep rögzítése (vezérlő: `lg`, kártya/panel:
`2xl`, pill: `full`) + 2 shadow-szerep (nyugvó: `sm`, kiemelt/overlay:
`lg`), a guardrail-be emelve fokozatosan. Nem kell tömeges migráció —
„érintésre konvergálás": amihez hozzányúl egy PR, azt hozza a szerepre.

### 1.5 [KÖZEPESEN] A publikus observer-út peremképernyői

A 08-25-i redesign után az intro/kitöltő/záró képernyők egységesek
(AssessmentFocusHeader), de a lejárt/visszavont/hibás token állapotok
**króm nélküli zsákutcák** (se fejléc, se footer, se téma-váltó), és az
`observe/[token]/page.tsx` a legrosszabb nyers-tipográfia offender (12).
Ez kifelé a legelső Trita-élmény egy meghívott külsősnek — brand-kritikus
felület.

**Javaslat:** a hibaállapotok is kapják meg az AssessmentFocusHeader +
minimál footer keretet; a szerver-oldali oldal tipográfiáját a
szerep-utilitykre hozni (a 1.1-es migráció első tétele).

### 1.6 [KISSÉ] Kisebb tételek

- **Gomb-primitív adopció részleges**: 129 fájl használja a primitíveket,
  de a ui-hotspots P0-listája (OrgSetupWizard, CampaignWizard,
  OrgCampaignsTab…) részben ma is kézi gombokat hordoz — a meglévő
  hotspot-lista szerinti ütemben érdemes folytatni.
- **PDF-gondolatjel inkonzisztencia**: a TeamReportPdf kötőjelre váltott,
  az egyéni riport nagykötőjelet használ — egyik irányba egységesíteni
  (a font-guardrail szerint a „—" elérhető, tehát a nagykötőjel a jó irány).
- **`onboarding-styles.ts` orange-villanás**: az egyetlen idegen
  Tailwind-paletta használat (`bg-orange-50`, `border-orange-400`) —
  bronz-soft tokenekre cserélendő.
- **4 fájlban arbitrary hex** (`ABSelector`, `DashboardPrimitives`,
  hiring-oldal (parkolt), observer page): 10 érték, tokenre emelhetők.
- **Inline HU/EN ternary-k** (a napi auditban részletezve): közvetlenül nem
  vizuális, de a copy-hang egységének mechanizmusát erodálja — visszahozni
  az i18n kulcsrendszerbe.
- Az **admin** felület mono-eyebrow-s, utilitárius jellege konvenció
  szerint szándékos — nem kilógás; a szabály betartása jónak látszik
  (mono=admin, clean=ügyfél).

## 2. Ami példásan egységes — ehhez érdemes igazítani

1. **Színrendszer + guardrail**: szemantikus rétegek, CI-ellenőrzés,
   scope-olt dark mode szinkron-őrzéssel. Ez a minta (token + doksi +
   script a CI-ben) az, amit a tipográfiára és a radiusra is érdemes
   átvinni — a szín azért a legfegyelmezettebb réteg, mert gép őrzi.
2. **Betű-identitás médiumokon át**: Fraunces + DM Sans + DM Mono a weben,
   PDF-ben, emailben, OG-képeken.
3. **Email-réteg**: minden szín a `design-tokens.ts`-ből, közös keret
   (`email-layout.ts`), arculati doksi mellette.
4. **Eyebrow-rendszer** (82 fájl SectionEyebrow, 8 ad-hoc) és az egyetlen
   saját ikonkészlet.

## 3. Top 5 javaslat, prioritási sorrendben

1. **Egysoros éles javítás**: `text-fluid-heading` → `text-fluid-title`
   a blog-indexen (látható címhiba a publikus felületen).
2. **Tipográfia-döntés + guardrail** (1.1): a fluid skála sorsának
   kimondása, és a nyers Tailwind-fokok tiltása app-felületen a
   check-colors mintájára — ez állítja meg az élő driftet.
3. **Brand-takarítás** (1.2): régi ikon-route-ok + árva SVG-k törlése,
   favicon-optimalizálás, rövid lockup-szabály; a piros akcentus
   rendezése.
4. **Observer-peremképernyők keretbe hozása** (1.5) — a legkifelé néző
   felület legyen a legfegyelmezettebb.
5. **Editorial szub-brand kimondása** (1.3) + radius/shadow szerepek
   rögzítése „érintésre konvergálás" elvvel (1.4).

---

*Korlát: a felületenkénti komponens-mélyolvasás e körben mintavételes volt
(a leltár-számok teljes körűek, a képi ellenőrzés a brand-assetekre és
borítókra terjedt ki); élő, böngészőben renderelt oldal-összevetés ebben a
környezetben nem volt lehetséges. Ha kell, egy következő kör
képernyőkép-alapú összevetéssel mélyíthető.*
