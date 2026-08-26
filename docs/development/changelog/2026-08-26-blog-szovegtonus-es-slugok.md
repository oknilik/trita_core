# 2026-08-26 — Blog: vezetői hangvétel, hírlevél-dedupe, slug-visszanevezés

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
frissítve.
