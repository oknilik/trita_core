# Diagnostic Programs — megvalósítás és ellenőrzés

2026-09-18 · ág: `codex/diagnostic-programs-design` · kiindulás: `f71cbb81` (origin/main).

## Elkészült

- Két verziózott program: Team Scan és Follow-up. A kampány saját, rögzített programleírást tárol; a régi kampányok megtartják a lépésalapú működést.
- Team Scan: önértékelés után párhuzamosan nyílik a csapatműködés, pszichológiai biztonság és observer-gyűjtés. Az observer-küszöb résztvevőnként három beérkezett válasz.
- Follow-up: csapatműködés és pszichológiai biztonság, új személyiségteszt és observer-kör nélkül. Azonos szervezet és csapat kompatibilis, publikált baseline-riportjához kapcsolódik. A baseline-riport revízióját, aggregátumait és jogosult résztvevői körét létrehozáskor rögzíti.
- Programválasztó, résztvevőkezelés, kampányáttekintő, explicit kampányhoz kötött observer-meghívás, Journey- és feladatlista-integráció.
- A teljesítési nyugták a meglévő `stepCompletions` mezőben, tranzakciósan kerülnek rögzítésre; az anonim kérdőívválaszokhoz nem adunk személyazonosítót.
- Kézi kampányzárás után riportgenerálás, külön tanácsadói jóváhagyás és publikálás. Revízióellenőrzés véd az egymást felülíró szerkesztések ellen. Módosítás után új jóváhagyás kell; a publikálás a jóváhagyott pillanatképet használja.
- A Follow-up webes és PDF riportjában leíró működésbeli eltérések, baseline-időpont és összetételváltozás jelzése. A korábbi személyiségkép történeti háttérként szerepel.
- A publikált programriport akciókövetése csak végrehajtási mezőket módosíthat; a szakmai terv átírása nem kerülheti meg a riport jóváhagyását.

## Bekapcsolás

Előbb alkalmazni kell a `20260918160000_diagnostic_programs` additív Prisma-migrációt, majd a célkörnyezetben `DIAGNOSTIC_PROGRAMS_ENABLED=true` engedélyezi az új programok létrehozását. A flag kikapcsolása nem törli és nem rejti el a már létrehozott programokat. Nem alakítjuk át automatikusan a legacy kampányokat.

Éles migráció, konfigurációmódosítás, merge és deploy nem történt.

## Ellenőrzés

- TypeScript, ESLint és a végső produkciós build: sikeres. A staging előtti quality gate és a színtoken-ellenőrzés is sikeres.
- Új programtesztek: 5 unit, 3 kliens teszt sikeres. Valódi PostgreSQL-integráció igazolja a Scan → jóváhagyás → publikálás → Follow-up folyamatot, a baseline változatlanságát, az ismételt beküldést és a párhuzamos riportmódosítás védelmét.
- Teljes integrációs készlet soros futtatással: 215/215 sikeres. Párhuzamos futásban a CRM-sweep teszt és szülőtesztje hibázott; külön futtatva a CRM 9/9 sikeres. A párhuzamos futás nem tekinthető zöldnek.
- Teljes unit készlet: 1307/1308 sikeres. Teljes kliens készlet: 390/393 sikeres. Az egy unit és három kliens hiba a változatlan main kiinduló állapotán is reprodukálható: stored-score legacy kulcsok, publikus navigációs CTA, team landing tartalom, riportolvasó képszáma.
- A tesztek kizárólag külön helyi PostgreSQL-adatbázison futottak. Chromium böngészős ellenőrzés a meglévő helyi tesztbelépéssel: 2/2 sikeres (programválasztó és hiányzó baseline; párhuzamos feladatok és lezárási kapu). A teszt által feltárt, örökölt nyitási időpont miatti felületi zárolást javítottuk. Valódi Clerk-belépéssel és levélküldéssel teljes staging end-to-end próba még nem történt. A program E2E-tesztjéhez DIAGNOSTIC_PROGRAMS_ENABLED=true szükséges; flag nélkül ez a két teszt kihagyásra kerül.

## Következő kiadási ellenőrzés

Stagingen, megfelelő szerepkörökkel végigjárandó a program létrehozása, meghívás, kitöltés, kampányzárás, riportjóváhagyás és publikálás, majd Follow-up létrehozás. Külön vizsgálandó a három observer-válasz személyenkénti követelményének gyakorlati teljesíthetősége. Automatikus átugrás nincs.

## PR #98 review-javítások

- Az aggregálás a kampányzárás és riportmutáció tranzakciója előtt fut. Záráskor a résztvevői nyugták változását optimista token ellenőrzi; eltéréskor újrapróbálás szükséges. A riportnál a revízió, a forráskampány és annak zárt állapota a zárolás után ismét ellenőrzött.
- A tiszta kampánysegédek, a Journey és a navigáció nem dob hibás/ismeretlen snapshotra. Az ismeretlen program nem legacy fallback: nem nyit feladatokat. Az író utak továbbra is szigorúan validálnak. A jelenlegi implementáció az 1-es sémaverziót támogatja; jövőbeli verzióhoz explicit implementáció kell.
- A snapshot policy numerikus, validált küszöböket tárol. A minimumok a scoring POLICY adatvédelmi/mérési padlóját nem csökkenthetik; a riport és összehasonlítás a tárolt policyt használja.
- Új teljesítési JSON: `{ v: 1, activities: {...} }`. A korábbi `__program` formátum olvasható, a következő programírás az új burkolást menti. Nincs destruktív adatmigráció.
- A baseline másolás whitelistelt; trustHighlights, dynamics, comparisonBasis és más, az összehasonlításhoz nem szükséges mezők nem kerülnek az új kampányba.
- Az observer-oldal a capability-motorból kapja a hozzáférési jelzőket. Lezárt körbe beadáskor külön CAMPAIGN_CLOSED hibát és lokalizált magyarázatot kap a kitöltő. A testType ellenőrzött lokális érték, non-null assertion nélkül.
- A Follow-up személyiség- és összetételi blokkja, tagi radarja, mérési háttere és PDF-je helyben jelzi a történeti forrást és a baseline-riport dátumát. A webes összehasonlítás táblázat; a PDF összehasonlítása a meglévő fejezetstílust használja, a személyiségoldal részeként, az eredményekkel induló első oldal után.
- A DIAGNOSTIC_PROGRAMS_ENABLED bekerült a .env.example-be. Létrehozási rollout-kapcsoló, nem portfolio parking: már létező programok elérhetőségét nem kapcsolja ki.
- Observer-felülbírálás nem került be: a küszöb és a naplózott kivételkezelés külön termékdöntés. A main örökölt teszthibáinak javítása külön változtatás marad.

Ellenőrzések: 8 program unit + 1 életciklus-integráció egykapcsolatos poollal sikeres; teljes integráció sorosan 215/215; program kliens 4/4; Chromium 2/2 (ismeretlen verzió renderelési ága is); HU/EN PDF render sikeres, az első oldal továbbra is Csapatkép. A korábbi teljes unit/client futás ismert hibái továbbra is külön kezelendők.

### Journey olvasási út — második review

A loadProgramJourney a safeParseProgram sikertelenségét most kihagyott kampányként kezeli, nem dob PROGRAM_SNAPSHOT_REQUIRED kivételt. A többi érvényes program változatlanul megjelenik; kizárólag hibás vagy ismeretlen verziójú programoknál üres a lista. Valódi adatbázisos regressziós teszt ellenőrzi a vegyes és a kizárólag érvénytelen esetet. A két program-integráció egykapcsolatos poollal, a típusellenőrzés és az érintett fájlok lintje sikeres. A scoring-konstansok külön modulba emelése és az observer-felülbírálás továbbra is külön feladat.

### Observer-meghívó visszajelzése

A meghívás után lokalizált sikerjelzés jelenik meg, a szervernézet frissül, a lista pedig átveszi a friss szerverpropokat. A mentés utáni email-küldési hiba 502-es válasza tartalmazza a már létrejött meghívó adatait; a kliens így megmutatja a meghívót és másolható linkjét, az email hibáját külön jelezve. Ez nem jelent sikeres kézbesítést. Regressziós tesztek: sikeres létrehozás, részleges siker/email-hiba, szerverlista-frissítés; összesen 6/6 komponens-teszt sikeres, típusellenőrzés és lint tiszta.
