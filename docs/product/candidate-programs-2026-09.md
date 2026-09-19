# Jelölti profilprogram visszavezetése

A jelölti felület tanácsadói előkészítést, önjellemzést és ember által jóváhagyott visszajelzést támogat. A meglévő self/observer kérdéskártyát, ötfokú választást, automatikus léptetést és fókuszált fejlécet használja. Nem képez alkalmassági pontszámot vagy jelöltrangsort.

## Program és kitöltés

- Új meghívónként változatlan CANDIDATE_PROFILE v1 snapshot: TSFI_V2 rövid, 60 kérdéses forma, opcionális csapatszerep, tanácsadói fókusz és opcionális csapatreferencia.
- A csapatreferencia csak ugyanazon szervezet/csapat publikált, lezárt Scan-riportjából jöhet, legalább három válaszadóval. Csak a hat személyiségátlag és a forrás azonosítója, revíziója, dátuma, elemszáma kerül át.
- A jelölt a tájékoztató elfogadása után kezd. Szerveroldali piszkozat, revízióellenőrzés és soros mentés védi a több eszközről történő felülírás ellen. A beküldés idempotens.
- A csapatszerep a self után nyílik és kihagyható. Csapatműködés, pszichológiai biztonság, observer és kapcsolati háló nincs ebben a programban.
- A v1 csak az ismert kérdésbank-azonosítókat fogadja el. Új instrumentum/verzió bevezetése kódváltozás; nincs automatikus snapshot-migráció.

## Riport

A tanácsadó leíró profilábrát lát, opcionális, dátumozott csapatreferenciával. Külön szerkeszti a jelölti visszajelzést, a megbízói kivonatot és a belső jegyzetet. Mentés után új jóváhagyás szükséges; függő csapatszerep mellett a jóváhagyás nem engedélyezett.

A megosztott kivonat immutábilis, közönségenként elkülönített snapshot, 30 napos, visszavonható tokennel. Nem tartalmaz nyers válaszokat, emailt, belső jegyzetet, másik közönség szövegét vagy csapatszintű adatokat. Forrásriport visszavonása vagy revízióváltása blokkolja az új megosztást. A korábbi megosztást külön lehet visszavonni.

## Aktiválás és hatókör

A hiring portfóliókapu külön commitban nyílik meg, de minden új folyamat szervezetenkénti `candidateProgramsEnabled` kapu mögött marad. Az alapérték false; az admin szervezeti hozzáférés paneljén kapcsolható. Kikapcsoláskor a kitöltés és a megosztás is elérhetetlenné válik. Aktív szervezeti tagság és tanácsadói jogosultság kell a kezeléshez.

A migráció additív. A régi, programSnapshot nélküli meghívók és eredmények megmaradnak, de a régi tokenek nem élednek újra. Nincs automatikus jelölt→csapattag átalakítás. A régi kreditkapu külön, jelenleg kikapcsolt működési döntés marad; ennek UI/API visszanyitása nem része az aktiválásnak.

A kiadás előtt az adatbázis-migrációt kell alkalmazni, utána lehet a kiválasztott pilot szervezetet engedélyezni. A valós Clerk-belépés és email-kézbesítés staging ellenőrzése szükséges; a helyi tesztek dummy kulcsokkal futnak.

## Többcsapatos tanácsadói nézet (2026-09-19)

A report szintjén legfeljebb nyolc, ugyanazon szervezeten belüli csapat referencia-riportja rögzíthető. Az eredeti meghívó programja nem módosul. Egy csapat egyszer szerepel; forráscseréhez az adott referencia eltávolítható, majd az új publikált riport hozzáadható. Minden változás új tanácsadói jóváhagyást igényel.

A radar azonos skálán és tengelysorrendben mutatja a jelöltet és az aktív csapatátlagot. A többi csapat saját kártyán marad. A sorrend a hozzáadás sorrendje, nincs összesített illeszkedési szám vagy rangsor. A kapcsolódások és eltérések tanácsadói szövegek, nem személyiségpontszámokból generált következtetések. A csapatreferenciák a tanácsadói munkanézethez tartoznak; a megosztott kivonatok továbbra is külön jóváhagyott, adatszegény snapshotok.
