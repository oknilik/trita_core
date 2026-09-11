# Közös vállalások

A csapat fejlesztési vállalásainak kanonikus helye: `/team/[id]?tab=commitments`. A csapat áttekintője, a publikált riport és a workshop innen elérhető közös munkához vezet. A riport 30/60/90 napos akcióterve a riportban rögzített javaslat marad.

## Használat

- A tanácsadó vagy a csapatvezető új vállalást hozhat létre, vagy kiválaszthat javaslatokat a publikált riportokból. Az 1–3 vállalás fókuszálást segítő ajánlás.
- Egy vállalásnak címe, következő lépése, felelőse, vállalt időpontja, háttérmagyarázata és teljesítési feltétele lehet. A felelős a jelenlegi csapattagok közül választható.
- A csapattag saját aktív vállalásai jelennek meg először. A vezető és a tanácsadó csapatszintű listát lát, az elakadásokat, elmulasztott időpontokat és hiányzó hozzárendelést előresorolva. Az olvasási perspektíva korlátozott hozzáférésnél is megmarad, szerkesztési jog nélkül.
- Gyors frissítés: Haladunk / Segítség kell / Elkészült. Segítségkéréshez és lezáráshoz rövid szöveges jelzés szükséges. A jelzés a csapat és a tanácsadó számára látható; nem belső tanácsadói jegyzet.
- A csapat fókusza és a következő közös egyeztetés külön szerkeszthető. Az egyeztetés időpontja különbözik egy vállalás határidejétől.
- A részletek között elérhetők a jelzések, a módosító neve, az időpont és az eredeti riport címe. A lezárt vállalások megmaradnak.

## Adat és jogosultság

Az élő adatok a `TeamCommitment`, `TeamCommitmentEvent`, `TeamCommitmentPlan` és `TeamCommitmentPlanEvent` táblákban élnek. Az új riport publikálása vagy a korábbi riport visszavonása nem írja felül őket. A közös fókusz és egyeztetés minden sikeres verziója is tartósan naplózott a tényleges módosítóval; ez a tervnapló jelenleg adatbázisban érhető el.

Az explicit import a szerveren olvassa ki a kiválasztott, publikált forrást. Megőrzi a régi státuszt, határidőt, megjegyzést, célmutatót és egy importkori forráspillanatképet. Az ismételt import nem hoz létre új példányt és nem írja felül az élő munkát. A korábban azonosító nélküli javaslat normál riportmentéskor kapott új azonosítója és sorrendváltozása is kezelt; két valóban külön azonosítójú javaslat külön marad. A régi szöveges felelős megjeleníthető, de nem ad személyes szerkesztési jogot; felhasználóhoz rendeléshez külön kiválasztás szükséges. Az importált megjegyzés eredeti szerzője nem ismert, ezért az importáló nem jelenik meg a megjegyzés írójaként.

A szerver minden olvasás és írás előtt ellenőrzi az élő szervezeti és csapattagságot, valamint a központi előfizetési szabályt. Kezelői műveletekhez `teamManage` szükséges. A saját állapot frissítéséhez írható hozzáférés, aktuális csapattagság és egyező `ownerUserId` kell. Másik szervezet vagy másik csapat adatai nem olvashatók ezen a felületen. Fagyasztott vagy hozzáférés nélküli szervezetnél a munkafelület nem érhető el.

Minden tételes módosítás verzióellenőrzéssel és ugyanabban a tranzakcióban írt eseménnyel történik. Ütközéskor a szerver 409-et ad. A felület megőrzi a piszkozatot, és az aktuális állapot áttekintését kéri az újabb mentés előtt. A megnyitott űrlapok piszkozata az adott böngészőlap session tárában, felhasználó/csapat/tétel szerint elkülönítve marad meg; sikeres mentés vagy elvetés törli.

A korábbi `/api/team/[id]/report/actions` tömböt felülíró PATCH jogosult kérésre 410 `ACTION_TRACKING_MOVED` választ és az új belépőt adja. Többé nem módosít publikált riportot. A régi riportok és `TeamActionEvent` előzményeik megmaradnak.

## Értelmezés

Az „Elkészült” a vállalás végrehajtását jelenti. A közös tapasztalat és a későbbi mérés eredménye külön állítás; a státuszváltás önmagában nem bizonyítja a csapatmutatók javulását. A meglévő strukturált mérési cél importkor megmarad.

Ez az első megvalósítás a közös felületet, a személyes frissítést és a követhető előzményeket tartalmazza. Automatikus emlékeztető-küldés és új hatásmérési automatizmus nem része ennek a változásnak.

## Kiadás

A kódot megelőzően alkalmazandó additív migrációk: `20260911080000_add_team_commitments` és `20260911120000_add_commitment_plan_events`. Új táblákat és kapcsolatokat hoznak létre; meglévő riportadatokat nem alakítanak át és nem importálnak automatikusan. A második migráció az esetleg már meglévő terv ismert aktuális állapotát baseline eseményként rögzíti. Visszaállításkor a régi alkalmazás figyelmen kívül hagyhatja ezeket a táblákat; az új adatok törlése nem szükséges.
