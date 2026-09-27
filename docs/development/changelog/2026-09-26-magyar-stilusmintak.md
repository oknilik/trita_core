# 2026-09-26 – Közvetlenebb magyar stílus három teljes mintán

A második szerkesztői kör egy teljes személyes riportot, egy céges
riportot és az „Amikor a csapatriport beszélgetést indít” című blogcikket
dolgozza át. A cél a természetesebb mondatfűzés, a kevesebb ismétlés és
az olyan javaslat, amelyből kiderül, mit próbálhat ki az olvasó.

## Változások

- A személyes mintában a rövid összkép és a részletes fejezetek külön
  feladatot kapnak. A munkastílus, a szerepek és az együttműködés leírása
  konkrét helyzetekből indul; a személyiségprofilból készült becslések
  értelmezési határa megmarad.
- A céges riport közös kísérőszövegei és az új riportok előkitöltése
  közvetlenebb lett. A vezetői útmutató kevesebb ismétlést tartalmaz,
  a cselekvési terv feladatait igék és kezdő kérdések teszik érthetőbbé.
- A blogban a szereplők döntései és tapasztalatai viszik tovább a
  történetet. A megismételt tanulságok helyét rövidebb átvezetések veszik át.
- A [magyar stílusútmutató](../hungarian-style-guide.md) és a
  [blogstíluskalauz](../blog-style-guide.md) pozitív mintákkal és a teljes
  szöveg átolvasásának szempontjaival bővült. A
  [három minta leírása](../hungarian-style-samples.md) előtte–utána példákat
  és újragenerálási parancsot is tartalmaz.
- Az új `scripts/preview-hungarian-copy.tsx` bemutatóadatokból készíti el
  a két teljes PDF-et és a blogcikk másolatát. A céges minta a közös
  `makeEditorialTeamReport()` forrásból készül.

## A teljes riportok olvasásakor javított hibák

- Az önjellemzés és a külső visszajelzés átlagos eltérése a PDF-ben
  tévesen százalékjellel szerepelt. A helyes egység magyarul „pont”,
  angolul „points”; ezt a webes felület is egységesen használja.
- Az összehasonlítás bevezetője nem állítja két kiválasztott dimenzióról,
  hogy kizárólag ott a legnagyobb az eltérés, ha több érték azonos.
- A személyes PDF módszertani jegyzete az áttekintéshez került. Mind a
  12 riportforgatókönyvben teljes egészében, pontosan egyszer jelenik meg.
- A PDF-ek közös fontbeállítása megszünteti az angol szabályok szerinti,
  magyarul hibás szóelválasztásokat.
- A személyes bevezető közös függvényből készül a felületen és a mintában;
  a szerepilleszkedés webes és PDF-címei közös fordítási kulcsot használnak.

## Ellenőrzés

| Ellenőrzés | Eredmény |
| --- | --- |
| `pnpm check` | TypeScript, ESLint és színellenőrzés sikeres |
| `pnpm test:unit` | 1325 sikeres |
| `pnpm test:client` | 424 sikeres, 83 fájl |
| `pnpm build` | Sikeres, működésképtelen helyi tesztkulcsokkal |
| `pnpm test:quality-gate:staged` | Sikeres |
| Személyes PDF-regresszió | Mind a 12 forgatókönyv renderelve; nincs üres vagy levágott oldal, a módszertani jegyzet teljes |
| Végleges minták | 11 oldalas személyes és 7 oldalas céges PDF; teljes szerkesztői és vizuális ellenőrzés, nincs üres oldal vagy oldalon kívüli szöveg |
| Fordítások | Nincs törölt kulcs vagy megváltozott helyőrző; az új kulcsokhoz magyar és angol szöveg is tartozik |

Az integrációs és böngészős tesztek előző, átfogó lektorálási körben kapott
eredményeit az [első változásnapló](2026-09-26-magyar-lektoralas.md) rögzíti.

## Hatókör

A teljes szövegek egymástól független szerkesztői átolvasást is kaptak.
A három minta a további stílusmunkához ad viszonyítási pontot; a többi
pontszámváltozat második szerkesztői köre és a célközönséggel végzett
olvasói próba további feladat.

A kérdőívtételek, a pontozás, a mérési küszöbök és a kanonikus
dimenziónevek megmaradtak. A már mentett tanácsadói szövegekhez nem
készült adatbázis-migráció.
