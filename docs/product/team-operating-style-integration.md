# Team Operating Style — felületi és riportintegráció

2026-09-16 · PR #97 folytatása · kísérleti mérés, nem validált tipológia.

## Elérés a telepített verzióban

1. Tanácsadói felületen: **Szervezet → Mérési körök → Új mérési kör → Csapatkép és működés**.
2. Pontosan egy célcsapatot és legalább három résztvevőt válassz. Aktiváld a kört. A résztvevői lista és a négyhetes referenciaablak ekkor rögzül.
3. A tag **Feladataim / csapatoldali mérési feladat** hivatkozásából éri el a **Csapatműködés** lépést. Közvetlen út: `/assessment/team-operating-style?campaignId=<id>`.
4. A 24 állítás mindegyikénél válasz vagy „Nem megítélhető” kell a véglegesítéshez. Részleges válaszok külön menthetők; folytatáskor a szerver saját piszkozatot tölt vissza. Párhuzamos körök esetén a felület választást kér, nem választ észrevétlenül egy másik kört.
5. A csomag a működésmérés után friss önértékelést, bizalmi kört és pszichológiai biztonság pulse-t tartalmaz. Az előző Scan v1 összetétele változatlan.
6. A kör lezárása után: **Csapat → Riport → Új vázlat**, a konkrét körből. Előnézet, tanácsadói narratíva és publikálás a meglévő folyamat szerint.

Az új mérés az egyedi méréskatalógusban is kiválasztható, de a teljes új riporthoz a **Csapatkép és működés** csomagot használd. Az egyedi, önálló működéskör nem válik automatikusan a másik körből származó személyiségriport forrásává.

## Riport: a két 16-mintázatos réteg

A vezetői és tagi webnézet, illetve a PDF közös prezentációs modult használ (`presentation.ts`). A sorrend:

1. **Hogyan működtök együtt?** — Operating Style név, négy tengely, átlag, mintaszórás, tengelyenkénti n és lefedettség, mindkét pólus gyakorisága, megfigyelési időszak, bizonytalansági jelzések.
2. **Milyen a személyiség-összetételetek?** — az eredeti személyiségmotor 16 mintázatának neve/kódja és négy tengelyének változatlan átlaga/szórása. A kohéziós tengely külön jelzi a proxy-jelleget.
3. **A két mintázat együtt** — mindkét mintanév, majd négy konkrét értelmezési kontextus és lehetséges támasz/súrlódás kérdései.

A 16×16 kombináció mindegyike feloldható. A kérdések az operating pólus és a személyiség-összetételi tengely magas/alacsony/küszöbközeli állapota szerint is változnak. A négy beszélgetési kapcsolat: információ–fegyelem; koordináció–kohéziós proxy; döntés–hajtóerő; végrehajtás–nyitottság. **Ezek értelmezési témák, nem azonos konstrukciók vagy validált megfeleltetések.** Nincs pontszámkivonás, százalékos illeszkedés vagy automatikus konfliktusmegállapítás.

Az automatikus szöveg kérdésként jelenik meg. A tanácsadó a meglévő narratív/interjús mezőkben rögzítheti a konkrét példával megerősített megállapításokat. Az eredeti `report.ts` review-zott hipotézisszerződése nem kerül jogosultságot megkerülő kliensbemenetként az új API-ba.

Eltérő válaszolói kör esetén az összevetés ezt jelzi. Hiányzó mérésből nem gyártunk típust. Küszöbközeli vagy nagy szórású adatoknál az ideiglenes jelzés és az alternatívák megmaradnak. Nem besorolható operating mintázatnál a részletes tengelyek látszanak, a típusok összevetése üres állapotot kap.

## Adatmodell és tranzakció

A korábbi terv külön participant/draft táblái helyett az első integráció két additív táblát használ:

- `TeamOperatingRound`: egyedi campaignId, teamId, instrumentVersion, induláskor rögzített eligibleUserIds és referenciaablak. Állapotát a kapcsolt Campaign DRAFT/ACTIVE/CLOSED életciklusa adja. Egy kör egy csapat; több csapat esetén külön köröket kell indítani.
- `TeamOperatingResponse`: egyedi roundId/userId, answers JSON, submittedAt, updatedAt. `submittedAt=null` privát piszkozat; nem számít az aggregátumba. Végleges válasz nem írható át. Azonos végleges válasz újraküldése idempotens siker, eltérő tartalom 409.

A kör az aktiválási tranzakcióban jön létre. A válaszbeadás ugyanazt a Campaign sort zárolja, mint a kampánykezelés, ez sorosítja a párhuzamos beadást/lezárást. Mentés és léptetés egy tranzakció; az értesítés utána történik. A válasz userId-ját csak a bejelentkezett profil adja, a kliens teamId/userId mezőjét a strict séma elutasítja. Válaszadáskor aktív szervezeti és aktuális csapattagság, induló névsor, körverzió, kampányállapot és lépéskapu is ellenőrzött.

A résztvevőket kezelő normál API-k a rögzített operating névsor után nem engednek hozzáadást/törlést. A lefedettség nevezője tagságváltozás után sem csökken. A forráscsapat és kör explicit: a riportépítő nem keres „legutóbbi” operating eredményt.

A befagyasztott JSON új, opcionális `teamStyle` mezője kizárólag aggregátumot és előre elkészített értelmezési kérdéseket tartalmaz. Nincs benne egyéni azonosító, nyers válasz vagy a régi `styleDistances`. Régi snapshotok olvashatók maradnak; a régi PDF-ekhez nem adódik három üres fejezet. Új operating riport publikálásához minden tengelyen legalább 3 értékelhető válasz és 60% lefedettség kell, a többi korábbi publikálási feltétellel együtt.

## Telepítés és hatókör

Migráció: `prisma/migrations/20260916193000_team_operating_style/migration.sql`. Két új tábla, egyediség és FK-k; nincs korábbi mérés átalakítása vagy személyiségpontszám felülírása.

A szokásos kiadási folyamatban **a migrációt az új alkalmazásverzió előtt kell alkalmazni**, majd Prisma kliensgenerálás/build. A migráció ebben a munkamenetben nem futott éles adatbázison. Main merge és deployment nem történt; a felület a PR-t tartalmazó, migrált környezetben érhető el.

Aktív régi körökbe utólag nem injektálunk új lépést; új Csapatkép és működés kört kell indítani. A kérdések és küszöbök pilot-státusza változatlan. A mérés nem technikailag anonim: az alkalmazás a saját piszkozatot/választ jogosultsággal védi; a csapat a publikált aggregátumot látja.

## Ellenőrzések

- Teljes unit csomag: 1299 teszt sikeres; a később hozzáadott publikálási és személyiségfüggő kérdésválasztási tesztek külön is sikeresek.
- Klienscsomag: 72 tesztfájl sikeres az első futásban; a PDF öröklött oldalszám-regressziója javítva, mind a 6 érintett PDF-teszt sikeres az újrafuttatásban.
- Új RTL, mentési szolgáltatás és API tesztek: kitöltési állapot, mentési hiba utáni megőrzés, N/A, bejelentkezés, hamis identitás, másik névsor, kilépett tag, zárt kör/kapu, verzió, tranzakciós léptetés és idempotencia.
- Mind a 256 típuspárosítás magyar és angol prezentációja ellenőrzött.
- Teljes TypeScript-ellenőrzés sikeres; lint: 0 hiba, egy már meglévő, másik tesztfájlbeli unused-import figyelmeztetés.
- Magyar és angol PDF renderelése, továbbá a működés/összetétel/összevetés fejezetek vizuális ellenőrzése megtörtént.
- Valós adatbázisos aktiválás–párhuzamos beadás–snapshot integrációs teszt elkészült: `tests/integration/team/team-operating-style.integration.test.ts`. **Nem futott**, mert nincs dedikált TEST_DATABASE_URL. A mockolt szolgáltatás/API tesztek nem helyettesítik ezt a kiadási ellenőrzést.
- Böngészős, bejelentkezett teljes E2E nem futott; a kiadási környezetben ezt és az új migrációt külön ellenőrizni kell.
