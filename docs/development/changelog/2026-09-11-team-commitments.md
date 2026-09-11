# Közös vállalások — 2026-09-11

A csapat vállalásai önálló munkafelületet kaptak. A publikált riport javaslatokat őriz; a felelőshöz rendelt élő vállalást a csapat és a tanácsadó ugyanott követi. Új riport közzététele nem indítja újra a korábbi munkát.

## Megvalósítás

- Új Vállalások fül és közös belépők az áttekintőből, riportból, csapattag nézetből és workshopból.
- Tanácsadói és vezetői nézetben az egyeztetést igénylő vállalások kerülnek előre. A csapattagnak a saját következő lépései jelennek meg először; a többiek munkája is olvasható.
- Létrehozás, felelős és vállalt időpont, következő lépés, teljesítési feltétel; Haladunk / Segítség kell / Elkészült gyors frissítés.
- Közös fókusz és külön egyeztetési időpont, lezárt vállalások keresése, változási előzmények. Magyar és angol szövegek, közös UI primitívek és tématokenek.
- Felhasználónként és csapatonként elkülönített böngészőlap-piszkozat; mentési hiba vagy 409 verzióütközés után megmarad. Új mentés előtt a friss állapot összevethető.
- A szerver ellenőrzi a csapat- és szervezeti hozzáférést, előfizetési korlátozást, aktuális tagságot és a felelős személyazonosságát. A régi szöveges felelős önmagában nem jogosít frissítésre.
- Az import megőrzi a korábbi állapotot és forráspillanatképet; ismételt vagy párhuzamos import nem duplikál. Az azonosító nélküli régi javaslatok későbbi azonosító-hozzárendelése és sorrendváltozása is kezelt.
- A régi riport-akció PATCH jogosult kérésre 410 `ACTION_TRACKING_MOVED` választ ad, a publikált riportot nem írja át.

## Tartós adatok és kiadás

Két additív migráció szükséges a kód kiadása előtt: `20260911080000_add_team_commitments` és `20260911120000_add_commitment_plan_events`. A tételes események és a fókusz/egyeztetés verziói a tényleges módosítóval, a mentéssel közös tranzakcióban kerülnek a naplóba. A meglévő riportok nem alakulnak át automatikusan. Az ellenőrzés kizárólag helyi adatbázisokon történt.

Automatikus emlékeztető-küldés és új hatásmérési automatizmus későbbi bővítés. A közös terv verzióinak naplója adatbázisban érhető el; a felületen a vállalások előzményei láthatók.

## Regressziós védelem

Új unit-, kliens-, PostgreSQL- és Playwright-esetek fedik a sorrendet, jogosultságot, explicit importot, versenyhelyzeteket, piszkozatot, ütközéskezelést és a mobilos csapattag → tanácsadó folyamatot. A kritikus út bekerült a pilot- és UI smoke-listába.

A teljes ellenőrzés két meglévő időzítési bizonytalanságot is feltárt: a közös adatbázison párhuzamos notification sweep fájlok elfogyaszthatták egymás fixture-jeit; az assessment kattintássorozat-teszt a valódi 120 ms-os zárhoz képest későn folytatódhatott. A tesztek izolációja és óravezérlése javítva, a termék notification- és assessment-viselkedése változatlan.

Használati és technikai részletek: [Közös vállalások](../../product/team-commitments.md). Végső ellenőrzés és képi példák: [megvalósítási összefoglaló](../team-commitments-2026-09-11/README.md).
