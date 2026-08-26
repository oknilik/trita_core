# 2026-08-26 — Blog: vezetői hangvétel, hírlevél-dedupe, slug-visszanevezés, két cikkvázlat

## Szövegtónus — mind a hét cikkpár átdolgozva

A blog szerkesztői értékelése szerint a cikkek a szkeptikus pszichológusnak
szóltak, nem a KKV-vezetőnek: tagadás-túlsúly, lefordítatlan statisztikák,
nulla példa. A hét HU–EN cikkpár teljes törzsszövege átíródott:

- A törzsszöveg most azt mondja ki, mit tud kezdeni az eredménnyel egy
  vezető (példák, feltehető kérdések, a bevezetés-cikkben szó szerint
  másolható bejelentés-minta). A „mit nem szabad kiolvasni belőle”
  korlátok egy tömör bekezdésbe költöztek a záró „Források és korlátok”
  szakasz elejére — a tartalmi állítások változatlanok, a kiválasztási
  tiltás kulcsgondolat maradt.
- A számkártyák címkéi hétköznapi nyelven mondják ki a szám jelentését
  (pl. ρ = −0,44 → „közepesen erős kapcsolat: … kevesebb káros munkahelyi
  viselkedéssel jár együtt”); tagadás-kártya („0 önálló döntés”) nincs több.
- Rövidebb mondatok; a pszichológiai biztonság cikk nyitva hagyott
  validálási kérdése lezárva: a nyolctételes skála saját eszköz, a
  pszichometriai jellemzőit a gyűlő adatokkal együtt nyilvánosan, a blogon
  dokumentáljuk (build-in-public vállalás, kész eredmény állítása nélkül).
- Minden meta-description 165 karakter alá került, így a
  `clampMetaDescription` sehol nem vág mondat közben.

## Hírlevél-doboz duplikáció megszüntetve

A cikkoldal és a bloglista saját feliratkozó-panelje mellett a Footer inline
űrlapja másodikként jelent meg ugyanazon az oldalon. A Footer hírlevél-blokkja
mostantól a `/blog` útvonalakon sem renderelődik (a `/newsletter` kizárás
mintájára) — ott az oldal saját, magasabb szándékú panelje él.

## DimBadge: másolható szóköz

A blog-cikkbeli dimenzió-badge betű- és címke-spanje között nem volt
szövegköz, így a vágólapra „HBecsületesség–Alázat” került. Egy csak-szóköz
szövegcsomópont került a kettő közé: flex-konténerben nem renderelődik, a
másolt szövegben és a felolvasóban viszont elválaszt.

## Blog-slugok visszanevezve, 308-as redirecttel

A 2026-08-23-i audit lelete volt, hogy a `tritan-vs-mbti` pár a kivezetett
brandet viszi publikus URL-ben; a `miert-hazudik-az-onertekeles` pedig a
régi, bulvárosabb címhez tartozott. Átnevezés (a 2026-07-29-én hiányolt
redirecttel együtt):

- `tritan-vs-mbti` → `hexaco-vs-mbti`
- `tritan-vs-mbti-why-it-matters` → `hexaco-vs-mbti-why-it-matters`
- `miert-hazudik-az-onertekeles` → `miert-nem-eleg-az-onertekeles`
- `why-self-assessment-lies` → `why-self-assessment-is-not-enough`

A `translationSlug` párok frissítve. A `next.config.ts` mind a négy régi
slugra permanens redirectet ad a cikkoldalon ÉS az
`/api/newsletter/cover/<slug>` route-on is — a kiküldött hírlevelek `<img>`-je
a régi slugos borító-URL-t hordozza örökre. A sitemap és az `llms.txt` a
fájlokból épül, automatikusan követi az új neveket; a slugot említő tesztek
(blog-cover, blog-art, analytics-normalizePath, footer-clearance e2e)
frissítve, és új e2e fedi a redirect-szerződést
(`tests/e2e/navigation/blog-slug-redirects.test.ts`).

## Két új cikkpár (a tartalmi terv 1–2. tétele) — publikálva

Először piszkozatként készültek, majd még aznap élesítve (döntés:
mindkettő megy most, a kéthetes ritmus a következő cikkel indul):

- **`egy-csapat-egy-hoterkep` / `one-team-one-heatmap`** (2026-08-26) —
  végigvezetett, anonimizált csapateset az aggregált riport közös
  értelmezésétől a konkrét változtatások kipróbálásáig. A korábbi,
  név szerinti demópontokat mutató `TeamHeatmapFigure` helyét a
  `TeamReportFigure` MDX-komponens vette át
  (`src/components/blog/TeamReportFigure.tsx`): csapatátlagot és belső
  sokféleségi sávokat mutat, egyéni eredmények nélkül. Formabontás
  szándékosan: nincs StatRow.
- **`mi-az-a-hexaco` / `what-is-hexaco`** (2026-08-26) — alapozó
  hub-cikk: lexikai eredet (magyar szál!), a hat dimenzió érték-semleges
  leírása munkahelyi példákkal, „fokozatok, nem fiókok”, gyakori
  félreértések. A HEXACO-klaszter közepe, minden kapcsolódó cikkre linkel.

„Kezdd itt” sáv átrendezve: 1. mi-az-a-hexaco (a hőtérkép-olvasótól átvéve),
2. önértékelés, 3. hexaco-vs-mbti. Hátralévő kézi teendő: borítókép
feltöltése az adminban (addig a generatív vizuál él).

## Admin blog: beszédesebb tároló-hibák (két éles lelet)

A cikkvázlatok élesítése két lappangó konfigurációs ütközést hozott elő:

1. **NOT_FOUND ág-eltérésből.** Egy még nem merge-ölt ág előnézetében az
   admin listája (a futó deploy fájlrendszere) előrébb jár, mint a tároló
   cél-ága (`GITHUB_BRANCH` → `VERCEL_GIT_COMMIT_REF` → `main`), így a
   Szerkesztés/Publikálás „A cikk nincs meg a tárolóban — lehet, hogy
   időközben törölték.” üzenettel állt meg, ami törlésnek látszott. A
   NOT_FOUND válasz mostantól viszi a tároló-célt (`repo@ág`), a felület
   kiírja, és megnevezi az ág-eltérés esetét is. (Ha a preview-nak a saját
   ágára kellene írnia: Vercelen a system env-ek engedélyezése kell —
   `VERCEL_GIT_COMMIT_REF` —, vagy explicit `GITHUB_BRANCH`.)
2. **409 a védett main miatt.** A `main` branch-protection alatt áll, a
   tároló Contents API-s commitját a GitHub 409-cel utasítja el — a
   production adminból tehát a mentés/publikálás/visszavonás jelenleg
   nem tud landolni. A 409/422-es hibaüzenet mostantól ezt az okot is
   megnevezi a teendővel együtt (bypass a blog-tokennek a protection
   szabályban, vagy másik cél-ág `GITHUB_BRANCH`-csel). Döntést igényel,
   melyik utat járjuk — addig a blogtartalom útja a git + PR marad.
