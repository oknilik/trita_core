# 2026-09-19 — Jelölti profilprogram

Új, szervezetenként engedélyezhető tanácsadói jelöltprogram váltja a régi jelölti kitöltést. A self/observer tényleges komponenseire épül: egy kérdés, ötfokú skála, automatikus léptetés, billentyűzet, fókuszált fejléc és mobilos dokk. Szerveroldali, revíziózott mentés, folytatás, idempotens beküldés és opcionális csapatszerep-kihagyás támogatott.

A program rögzíti az instrumentumot és az opcionális publikált Scan-referenciát. A tanácsadó leíró profilábrát, két külön közönségnek szánt szöveget és belső jegyzetet kap. A megosztás csak aktuális jóváhagyás után, változatlan és visszavonható kivonattal működik. Nincs rangsor vagy automatikus alkalmassági ítélet.

## Migráció / kiadás

- `20260919140000_candidate_programs` additív migráció: Organization pilot flag, CandidateInvite snapshot/draft/state és CandidateReport/Share táblák.
- `candidateProgramsEnabled` alapértéke false. Admin → szervezet hozzáférése alatt kapcsolható, a migráció után.
- Régi tokenek nem aktiválódnak; meglévő adatok nem törlődnek. Hiring portfóliókapu feloldása külön commit.
- A migráció csak elkülönített helyi tesztadatbázisra került alkalmazásra. Éles engedélyezés vagy manuális deploy nem történt.

## Ellenőrzés

- 8 célzott unit, 7 PostgreSQL integrációs, 4 kliens és 3 Chromium E2E teszt: programverziók, szervezeti kapu, párhuzamos mentés, ismételt beküldés, kihagyás, forrásriport-rögzítés és visszavonás, közönségek adatszétválasztása, mobilos kitöltés.
- TypeScript, lint és színellenőrzés; production build. Egy meglévő, másik tesztfájlban lévő unused-import lint figyelmeztetés marad.
- Nem teljes unit/client újrafuttatás; a main korábban dokumentált hibái nem részei ennek a változásnak. A helyi böngészőteszt development auth bypass-t és dummy kulcsokat használ, valódi email-kézbesítést nem igazol.
