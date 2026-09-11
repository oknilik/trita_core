# Vállalások — review utáni javítások

## Szerkesztés és aktuális megjegyzés

- A vezető akkor is javíthatja a vállalás szövegét, ha annak felelőse már kilépett. A változatlan hozzárendelés nem fut át az új felelős ellenőrzésén; új személy választásakor továbbra is aktív csapat- és szervezeti tagság szükséges. A kilépett személy nem kap vissza írási jogot.
- A gyorsfrissítés aktuális megjegyzése az adott frissítéshez tartozik. Üres „Haladunk” jelzés után a korábbi segítségkérés nem marad aktuális megjegyzésként; az eseménynaplóban továbbra is visszakereshető.
- Mindkét hibát előbb sikertelen regressziós teszt reprodukálta. A javítás után 55 célzott kliens/API-teszt és 13 valódi PostgreSQL-teszt sikeres.

## Kisebb tisztítások

A riportfordítás élő tagságellenőrzése egyszer, a szerepdöntés előtt fut. Eltűnt a meg nem jelenített `BridgeNextStep.secondary` nézetmező és a három olvasatlan fordítás: `summaryOpenOutside`, `summaryExploreTitle`, `summaryDetailsMeta`. A journey motor más fogyasztóknál használt másodlagos ajánlása megmarad.

## Tudatosan megtartott viselkedés

- A javaslatok az összes publikált riportból származhatnak, a forrás címével. Régi javaslat nem válik automatikusan új vállalássá: a kezelőnek ki kell választania és importálnia kell. A kizárólag legfrissebb riportra korlátozás külön termékváltoztatás lenne.
- A 410-es régi végpont az átállási kompatibilitást szolgálja. Régebben megnyitott kliensből érkező írást is megállít, és az új felülethez vezet; az új funkció első kiadása előtt nem töröljük.
- A frozen állapotban tiltott részletes riportolvasás illeszkedik a jelenlegi felülethez, előfizetési üzenethez és tesztekhez. Restricted állapotban a riport olvasható. Ennek megváltoztatása hozzáférési termékdöntés.
- A `completedCount` ténylegesen két fogalmat fedhet: a manager nézet a beküldött eredményt, a csapatnézet az értelmezhető dimenzióadatot számolja. Üres/hibás pontszámadat esetén eltérhetnek. Az egységesítés jelentését külön kell eldönteni; ebben a javításban nem nevezzük át csendben egyik KPI-t a másikra.

## Fióktörlés

A strukturált hivatkozások törlésének részleteit és a kiadás migrációs feltételeit a [termékdokumentáció](../../product/team-commitments.md) rögzíti. A csapat szabad szöveges tartalmára vagy megbízható profilkapcsolat nélküli legacy névre nem vezetünk be névegyezéses automatikus törlést.

A `20260911160000_nullable_commitment_identity` migráció négy auditmező nullázhatóságát teszi lehetővé. A közös törlési tranzakció megszünteti a hozzárendelést és törli a jelenlegi, illetve történeti strukturált profilhivatkozásokat. A kapcsolódó regresszió az idempotenciát, másik személy adatainak megtartását és a régi szerkesztőből történő visszaállítás elutasítását is ellenőrzi.

## Ellenőrzés

Teljes unit: 1322/1322; kliens: 459/459; PostgreSQL integráció: 227/227. A célzott fióktörlés + vállalások DB-futás 24/24 sikeres. A full kliens futás egy korábbi assessment tesztben a kérdésváltó animáció befejezése előtt olvasta a visszaállított választ; az állítás most megvárja a látható kiválasztási állapotot. A termék kérdőív-viselkedése nem módosult.
