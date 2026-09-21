# PR #98 — review utáni javítások

- A kampány adatgyűjtése hiányos kitöltés mellett is lezárható; a teljes riportaggregálás és az adatminimumok ellenőrzése a riport jóváhagyásához tartozik. Az áttekintő nem épít riportot minden oldalletöltésnél, és a legfrissebb riportot determinisztikusan választja.
- Hiányos observer-lefedettséghez opcionális, legalább 20 karakteres tanácsadói indoklás adható. Az indoklás, szereplő és időpont a riport snapshotjában és auditnaplójában rögzül; a publikált webes és PDF-riport jelzi a lefedettséget és az indoklást. Más mérési minimumot, egyéni observer-adatvédelmi küszöböt ez nem ír felül. Módosítás vagy visszavonás új jóváhagyást igényel.
- A programos előnézet csak olvas: nem aggregál újra, nem ír adatbázist, nem emel revíziót és nem vonja vissza a mentett jóváhagyást. A nem mentett mezőket ideiglenes előnézetben mutatja; a kliens a tényleges mezőértékekből számolja a változást.
- A Journey megtartja az admin/manager cockpitet, az állapotot és a blokkoló okokat. A tagok elvégezhető programfeladatai továbbra is prioritást kapnak.
- Nem támogatott program snapshot esetén a riport olvasása degradál, jóváhagyása tiltott. A policy konstansok külön, pontozófüggőségek nélküli modulban élnek. A legacy léptetésből kikerült az extra kampánylekérdezés. A Journey szervezeti tagság nélkül nem kérdez programot; a szükséges tagságfüggő lekérdezés az előfizetés olvasásával párhuzamos.
- A szerveroldali hiring navigáció már a review előtt is ellenőrizte a szervezeti kapcsolót és a tanácsadói jogosultságot. A korábbi parkolási elvárások elavultak; a tesztek a kapcsoló szerinti láthatóságot védik.
- A jelölti diagramok a jelenlegi, minősítésmentes nézetben jelzik az egyéni mérési bizonytalanságot és a kanonikus valenciaszabályt. A megszűnt automatikus illeszkedésminősítést nem állítjuk vissza.
- A két elavult jelölti integrációs teszt az engedélyezett, verziózott program és a revíziózott válaszmentés jelenlegi szerződését követi.
- Program UI: közös HU/EN fordításkulcsok, szerepalapú tipográfia, közös mező/panel primitívek, olvasható formázás. A megosztási dokumentáció egyértelműen kimondja: visszavonáskor az összes aktív link érvénytelenedik.

Nincs új adatbázis-migráció. A korábbi changelogok akkori állapotot rögzítenek; az observer-felülbírálásról és lezárási kapuról szóló korábbi korlátozásokat ez a javítás felváltja.

## Ellenőrzés

- `pnpm check`, produkciós build teszt Clerk-kulcsokkal, staging quality gate: sikeres. A lint egy korábbi, nem érintett unused-import figyelmeztetést jelez.
- Teljes unit: 1318/1319; kizárólag a review-ban mainen is igazolt `stored-score-legacy-keys` hiba maradt.
- Teljes klienskészlet: 404/407, ugyanaz a három main-hiba (publikus CTA, team landing tartalom, riportolvasó képszáma). Az utána hozzáadott előnézet-regresszióval az érintett programos klienskészlet 9/9.
- Teljes PostgreSQL-integráció sorosan: 220/220, beleértve a felülbírálás auditját/visszavonását, az előnézet változatlan mentett jóváhagyását, a nem támogatott snapshotot és a jelölti végpontokat.
- Chromium: 4 jelölti és 2 programteszt sikeres. A programteszt a hiányos mérés valódi lezárását és a kikapcsolt hiring-navigációt is ellenőrzi. A kampány API a közös auth wrappert használja; a tesztcookie csak nem-production környezetben, explicit E2E-kapcsolóval működik.

A tesztek elkülönített helyi adatbázist használtak. Éles migráció, szervezeti bekapcsolás és valódi levélküldés nem történt.
