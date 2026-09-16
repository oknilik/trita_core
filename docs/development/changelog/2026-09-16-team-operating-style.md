# 2026-09-16 — Team Operating Style tervezési ág

- Módosítás előtti audit: team-pattern/team-stats/pattern API, Prisma Team/Campaign/TeamReport, riport snapshot és fogyasztók.
- Új, elkülönített pilot domain: 24 saját HU/EN viselkedési tétel, négy dimenzió, 16 saját működésminta.
- Átlag és tagok közötti mintaszórás, pólusgyakoriságok, hiány/lefedettség/közeli pólus/eltérő tapasztalat kezelése; szigorú bemenetvalidáció.
- Riportkontraktus: operating style → személyiség-összetétel → review-zott beszélgetési hipotézisek. Nincs személyiségből becsült operating score.
- Design note: fogalmi határok, adatmodell és integrációs terv, kutatási források és validációs terv.
- Csak új fájlok. Nincs éles adatbázis-migráció, UI-bekötés, publikálás vagy main merge.

## Ellenőrzés

- Teljes projekt `pnpm type-check`: sikeres, a Prisma kliens generálása után.
- Célzott ESLint az új modulokra és tesztre: sikeres.
- `tests/unit/team/*.test.ts`: 228/228 sikeres; ebből 19 új Operating Style teszt.
- A helyi tsx CLI IPC socketet nem tudott nyitni, ezért ugyanazok a node:test tesztek a tsx Node loaderével futottak (`node --import <tsx-loader> --conditions=react-server --test tests/unit/team/*.test.ts`).
- UI/client/e2e és adatbázis-integrációs teszt nem futott: az ág nem köt be felületet, API-t vagy perzisztenciát.

## Folytatás — felületi és riportbekötés

- Új Csapatkép és működés csomag; aktiváláskor rögzített csapat/névsor/időablak.
- Privát szerverpiszkozat, végleges beadás, tranzakciós léptetés és idempotens retry.
- Közös web/tag/PDF riportprezentáció; mind a 16×16 mintapár összevetése, személyiségfüggő értelmezési kérdésekkel.
- Két additív Prisma-modell és migráció; nem alkalmazva éles környezetben.
- Ellenőrzési eredmények és elérési út: `docs/product/team-operating-style-integration.md`.

## Véglegesítés: hiányzó válaszok jelzése

- A hiányos kérdőív véglegesítése többé nem néma, letiltott gomb: az első hiányzó válaszhoz helyezi a fókuszt, jelzi a hiányzó sorszámokat és alul is mutatja a kitöltöttséget. Hiányos adatok nem kerülnek beküldésre.
- HU/EN szövegek; a piszkozat mentése változatlan.
- Kliensregresszió: hiányos beadás nem hív API-t, fókusz a hiányzó válaszon; üres kérdőívből 24 válasz (N/A is) után sikeres beadás.
