# A magyar stílusminták kiterjesztése a teljes szövegkészletre

## Mi változott?

Az elfogadott személyes riport, céges riport és blogcikk hangját a többi
magyar szövegre is alkalmaztuk. A szerkesztés teljes bekezdésekből és
összeálló riportokból indult: természetes magyar szórend, világos alanyok,
kevesebb körülírás és konkrét, kipróbálható javaslatok kerültek a szövegekbe.

| Terület | Lefedettség |
| --- | --- |
| Blog és marketing | Mind a 9 magyar cikk, köztük a piszkozatok; nyilvános oldalak, árak, pilot, hírlevél, keresési leírások és a 16 személyiségalapú csapatminta |
| Személyes riport | Minden alacsony, közepes és magas pontszámhoz tartozó értelmezés, összefoglaló, munkastílus, fejlődési javaslat, szerepbecslés, visszajelzés és páros összehasonlítás |
| Céges kommunikáció | A 16 személyiségalapú és 16 közvetlenül mért csapatminta, 9 csapatszerep, bizalom, pszichológiai biztonság, tanácsadói előkitöltés, vezetői és jelöltfelmérési folyamatok |
| Felület és levelek | Magyar fordítási készletek, helyi komponensszövegek, belépés, útmutatók, súgó, értesítések, adminisztráció, CRM és az alkalmazás összes magyar levélsablonja |
| Karrier | A szöveggenerátorok, a 477 foglalkozási leírás és a 21 foglalkozáscsalád definíciója |
| Dokumentumok | Személyes és céges PDF-ek, ajánlat és megrendelőlap, jogi oldalak nyelvi szerkesztése |

A már megfelelő rövid feliratok megmaradtak. A négy szerkesztő egymás
munkájából is olvasott; a közös végső kör a megszólításra, a vonzatokra,
a pontszámok értelmezésére és az összefűzött mondatokra figyelt.

## Pontosítások a tényleges működés alapján

- A visszajelzések összehasonlításának üres állapota korábban két választ
  ígért, a tényleges küszöb három. Az új `{min}` helyőrzőt a meglévő
  `MIN_RATERS_FOR_ANONYMOUS_AGGREGATE` tölti ki. A régi, jelenleg nem használt
  megfelelő feliratok is ugyanezt a konstansot használják magyarul és angolul.
- A pilot visszaigazolása a jelentkezési oldalhoz igazodva egy munkanapon
  belüli választ jelez. A megszólítás megőrzi a teljes megadott nevet:
  például „Tóth Anna” helyett korábban csak „Tóth” maradt.
- A /patterns oldal fizetős pilotprogramra mutató gombja és magyarázata
  a céloldal tartalmát nevezi meg. A téves ingyenességi ígéret kikerült.
- A GYIK a pszichológiai biztonság név nélküli rögzítését és a bizalmi
  térkép páronkénti összesítését külön, pontosan írja le.
- A személyiségprofilból készült becslések nem ígérnek bizonyított
  teljesítményt, csapaton belüli bizalmat vagy biztos alkalmasságot.
  A magasabb pontszámot nem értelmezzük általánosan jobb eredményként.
- A nem igazolt validálási és AI-szolgáltatási ígéreteket tényszerű
  megfogalmazások váltják fel. Az érintett angol állítások is igazodnak
  a tényleges funkcióhoz; általános angol lektorálás nem készült.
- A céges PDF mérési melléklete a már meglévő szűkebb térközt használja.
  Így a visszamérési mintában a módszertani bekezdés a táblázattal egy
  oldalon marad, és nem keletkezik csak ezt tartalmazó záróoldal.

## Karrierkatalógus

Az egyes foglalkozások magyar szövegét az azonos SOC-kódú eredeti O*NET
leírással olvastuk össze. Az angol tartalékszövegek magyar fordítást kaptak;
a más szakmához tartozó leírások helyére a megfelelő tevékenységek kerültek.
Az eredeti forrásmező megmaradt, az új `descRevisionSource` mező jelzi a
magyar átdolgozás forrását. Az aktuális forrástájékoztató mindkét nyelven
O*NET/ESCO alapú magyar szerkesztést nevez meg.

A foglalkozáskódok, a hivatalos megnevezések és az illeszkedési számítások
változatlanok. A kódok és a magyar megnevezések közötti meglévő eltérések
külön adatfelülvizsgálatot igényelnek; a nyelvi szerkesztés nem írja át
csendben a szakmai besorolást. A részletes eltéréseket a
[katalógusjegyzék](../hungarian-career-catalogue-review-2026-09-26.md) rögzíti.

## Ellenőrzés

| Ellenőrzés | Eredmény |
| --- | --- |
| `pnpm check` | Típusellenőrzés, lint és színellenőrzés sikeres |
| Unit | 1326 sikeres, 93 tesztcsoport |
| Kliens | 426 sikeres, 83 fájl |
| Integráció | 220 sikeres, elkülönített helyi PostgreSQL-adatbázison |
| Playwright | 82 sikeres, 44 konfiguráció szerint kihagyott eset; egy worker, újrapróbálás nélkül |
| PDF | 21 dokumentum, 150 oldal: 12 személyes, 7 céges és 2 kereskedelmi dokumentum; nincs üres oldal, kilógó szöveg vagy hibás karakter |
| E-mail | 49 előnézet, köztük mind a 25 magyar változat; 390 px szélességen nincs túlfolyás vagy feloldatlan helyőrző |
| Web | 54 mobilos és asztali nézet; minden oldal betöltött, vízszintes túlfolyás nélkül; a reprezentatív oldalakat képen is ellenőriztük |
| Fordítási kulcsok | Nincs törölt vagy új kulcs ebben a körben; 391 megváltozott lokalizált érték, a `{min}` két szándékos bővítésén kívül minden helyőrző megmaradt |
| Védett adatok | Az 5 kérdőív tételkészlete, a jogi JSON 311 levélértékének kulcsai és számadatai, valamint a katalógus védett mezői változatlanok |

A végleges `pnpm build`, a `pnpm test:quality-gate:staged`, a
`pnpm lint:ui:hex:new` és a `git diff --cached --check` is sikeres.

A PDF-eket valódi megjelenítőkkel, szintetikus adatokból állítottuk elő.
A hosszú személyes szöveg, a teljes és rövidített céges riport, valamint a
visszamérés külön mintát kapott. A képi ellenőrzés a magyar ékezetekre,
a tördelésre, a táblázatokra és az együtt megjelenő bekezdésekre is kiterjedt.
A 44 kihagyott böngészős eset külön engedélyezendő vizuális vagy
funkciókapcsolóhoz kötött teszt; nem sikertelen teszt.

A katalógusban 477 magyar leírás maradt, közülük 475 változott; mind az
52 korábbi angol tartalékszöveg magyar fordítást kapott. A kódok, a sorrend,
a nevek és az eredeti forrásmezők gépi összevetése eltérést nem talált.

## Határok és fenntartás

A mérési tételek, a pontozás és a számítási küszöbök megmaradtak. Az új
szövegek a forrásból újra összeállított riportokon és az új PDF-exportokon
jelennek meg. A már letöltött dokumentumok, a felhasználók saját szövegei
és az adatbázisban tárolt tanácsadói narratívák nem kapnak automatikus
átírást. Éles adatbázison nem futott tartalommigráció.

Az új szövegekhez továbbra is a [magyar stílusútmutató](../hungarian-style-guide.md)
és a [teljes minták](../hungarian-style-samples.md) adnak alapot. A további
szakmai kérdéseket a [lefedettségi audit](../hungarian-editorial-audit-2026-09-26.md)
rögzíti. Olvasói próba a célközönséggel ebben a körben nem történt.
