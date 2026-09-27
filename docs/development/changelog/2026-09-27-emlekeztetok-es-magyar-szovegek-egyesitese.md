# Magyar szövegek és személyes emlékeztetők egyesítése

A #100 teljes emlékeztető-fejlesztése a #99 magyar lektorálási ágába került.
A közös változat a #99 stílusútmutatóját követi a levélben, az alkalmazáson
belüli értesítésben, a beállítási és leiratkozási oldalon, valamint az adminban.

## Szövegek és működés

- Az új kezdési, folytatási és visszajelzéskérési emlékeztető, illetve a kitöltés
  utáni levél közvetlen, természetes magyar szöveget kapott. A magyar és angol
  változat közös forrása a `src/lib/i18n/lifecycle.ts`.
- A visszajelzések összehasonlításához szükséges darabszámot itt is a
  `MIN_RATERS_FOR_ANONYMOUS_AGGREGATE` adja. Jelenleg 3 beérkezett visszajelzés kell.
- A halasztó gomb egyhetes szünetet ígér; pontos küldési napot nem garantál.
  A leállító gomb az adott lépéshez tartozó emlékeztetők végleges leállítását
  mondja ki. A kitöltés utáni levél beállítási linkje a tényleges céloldalt nevezi meg.
- A leiratkozás és az e-mail-beállítások az összes érintett levéltípust felsorolják.
  A meghívók, eredményértesítések és a külön hírlevél-beállítás szerepe világos.
- Az admin magyar neveket mutat a szabályokhoz és állapotokhoz. Küldési
  kísérleteket számol; a szolgáltatói átvételt és a kézbesítést külön jelzi.
- A meghívó emlékeztetője név hiányában is megőrzi a meghívó fél e-mail-címét,
  ugyanúgy, mint az eredeti meghívó. Ezt HTML- és szöveges regresszió is ellenőrzi.
- Az admin régi meghívólistájának leírása az új szabály szerinti négy napot jelzi.

A #99 blog-, riport- és felületi szerkesztései megmaradtak, beleértve az
„Amit érdemes kipróbálnod” webes és PDF-es kártyájának közös, gyakorlati javaslatát.
A #100 adatbázissémája, migrációja, időzítése és küldési korlátai változatlanul bekerültek.

## Ellenőrzés

- `pnpm check` és production build: sikeres.
- Egységteszt: 1345 sikeres.
- Kliens: 431 sikeres teszt, 84 fájl.
- Integráció: 233 sikeres teszt, elkülönített helyi PostgreSQL-adatbázison.
- Playwright: 83 sikeres, 44 konfiguráció szerint kihagyott; egy worker,
  automatikus újrapróbálás nélkül.
- A közös levélelőnézet 57 változatot generál. Az új négy sablon mindkét
  nyelven bekerült a közös arculati, képi és leiratkozási ellenőrzésbe.
  A nyolc új előnézet 390 px-en túlfolyás és feloldatlan helyőrző nélkül jelenik meg.
- A halasztási és leiratkozási oldal magyar mobilnézete külön képi ellenőrzést kapott.
- Staged quality gate, új UI-színek és diffellenőrzés: sikeres.

Az integrációs kör egy korábbi tesztversenyt is felszínre hozott: a CRM és
az eredményátgondolási teszt párhuzamos értesítési futása ugyanazt a lejárt
ajánlatot dolgozhatja fel. Az ellenőrzés ezért a saját ajánlat végállapotára,
naplóbejegyzésére és értesítéseire támaszkodik. Az üzleti kód nem változott.

## Bevezetés

Az új személyes automatikus küldés alapból kikapcsolva marad (`LIFECYCLE_MODE=off`).
Telepítés előtt szükséges a #100 migrációja; a meglévő fiókok személyes és
kitöltés utáni leveleihez az ellenőrzött elsődleges e-mail-cím szinkronja is kell.
A részletes lépések a [bevezetési útmutatóban](../profile-followup-rollout.md) szerepelnek.
Az összevonás nem futtatott éles migrációt és nem küldött valódi levelet.
