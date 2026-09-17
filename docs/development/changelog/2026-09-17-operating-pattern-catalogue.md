# Működési mintakatalógus és rétegzett csapatriport

A 16 minta közös HU/EN katalógusból jelenik meg az új `/operating-patterns` aloldalon, a webes riportokban és a PDF-ben. A riport a mért működéssel indul, majd megmutatja az aggregált HEXACO-profilt és a belőle képzett négy tengely forrásait. A besorolási bizonytalanság, hiányos adatok és a válaszolói körök eltérései láthatók maradnak.

A kérdőív, pontozás, tárolt mintakódok és publikálási kapuk változatlanok. A korábbi személyiségi `/patterns` felület parkolása változatlan. A publikus lábléc és sitemap az új működési térképre mutat.

Részletek és ellenőrzések: `docs/product/team-report-reader-design.md`.

## Tengelynevek pontosítása

A közös tengelycímkék: Információáramlás / Information flow, Koordináció / Coordination, Döntéshozatal / Decision-making, Megvalósítás / Implementation. Az aloldal, a kérdőív, a webriport, az összevetés és a PDF ugyanezt a névkészletet használja. A mintakódokat továbbra is a pólusok angol kezdőbetűi adják (S/I, E/O, C/D, P/A); a belső mezőnevek és a mérési szabályok változatlanok. A hosszabb címkékhez a riport tengelyoszlopa szélesebb lett. Ellenőrzés: 37 kliens/PDF-teszt, TypeScript és célzott ESLint sikeres.
