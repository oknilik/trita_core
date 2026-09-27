# 2026-09-26 – Magyar lektorálás és a riportok tördelése

A magyar szövegek rövidebb, természetesebb mondatokkal magyarázzák el az
eredményeket és a teendőket. A lektorálás a személyes és céges riportokra,
a 9 magyar blogcikkre, a marketingre, a kérdőívek útmutatóira, a levelekre,
a súgóra, az adminisztrációra és a jogi oldalakra is kiterjedt.

## Változások

- Magyar mondatlogika, következetes tegezés, természetes vonzatok és
  szókapcsolatok; az angol belső kifejezések helyett közérthető magyarázatok.
- Pontosabb hibaüzenetek és gombfeliratok. A meghívások, eredmények és mérési
  feladatok egyértelműbb megnevezése.
- A dinamikus mondatokban helyes névelők, nevek és dátumok. A csapatnevek
  mellett megszűnt a „csapat” szó lehetséges megkettőződése a riportértesítőben.
- A csomagtartalom, a tanácsadói hozzáférés és a meghívás utáni csatlakozás
  leírása a tényleges működést követi. E pontosítások angol párjai is frissültek.
- A mentett válaszokból képzett személyes riportok az új szövegeket használják.
  A már mentett tanácsadói narratívákat és a korábban letöltött PDF-eket nem
  módosítja adatbázis-migráció.
- Elkészült a [magyar stílusútmutató](../hungarian-style-guide.md), és hozzá
  igazodik a blogstíluskalauz. A [részletes audit](../hungarian-editorial-audit-2026-09-26.md)
  felsorolja a lefedettséget és a külön szakmai döntést igénylő kérdéseket.

## PDF-javítások

A munkastílust bemutató PDF-kártya a függőleges szövegblokkokat is `flex: 1`
beállítással rajzolta. A hosszabb Kontextus szöveg ezért kilóghatott a dobozból
és ráfolyhatott a következő kártyára. A függőleges blokkok most megtartják a
tartalmukhoz szükséges magasságot.

A tartalomjegyzék korábban előre becsülte a fejezetek helyét. A hosszabb
dimenzióösszefoglaló után egy oldallal korábbra mutathatott. Az oldalszámok
most a react-pdf tényleges tördelésekor keletkeznek, dokumentumonként külön
nyilvántartásban. A persona PDF-generátor is ezt használja.

Három renderelt regresszió ellenőrzi a magas, az alacsony és a hosszú
szöveggel kitöltött mintán a tényleges szöveghatárokat és a tartalomjegyzék
hivatkozásait. Az elemszámból oldalszámot feltételező unit teszt helyét ezek
vették át.

## Ellenőrzés

| Ellenőrzés | Eredmény |
| --- | --- |
| `pnpm check` | TypeScript, ESLint és színellenőrzés sikeres |
| `pnpm test:unit` | 1324 sikeres |
| `pnpm test:integration` | 220 sikeres, elkülönített helyi PostgreSQL-adatbázison |
| `pnpm test:client` | 414 sikeres, 83 fájl |
| Playwright, `--workers=1 --retries=0` | 81 sikeres, 44 a konfiguráció szerint kihagyott eset |
| `pnpm build` | Éles build sikeres, működésképtelen tesztkulcsokkal |
| Személyes PDF | Mind a 12 minta újrarenderelve; 36/36 tartalomjegyzék-hivatkozás helyes |
| Csapat- és üzleti PDF | Teljes csapatriport, olvasói és visszamérési nézet HU/EN; ajánlat és megrendelőlap |
| Összes PDF-minta | 19 dokumentum, 144 oldal; nincs üres oldal vagy oldalon kívüli szöveg; vizuális ellenőrzés |
| Levélelőnézetek | 49 HTML-minta; 25 magyar változat 390 px szélességen, vízszintes túlfolyás nélkül |
| Kulcsok és változók | A módosított fordítási helyőrzők megmaradtak; a kérdőívtételek és a pontozás változatlanok |

A böngészős kör konfiguráció szerint kihagyott esetei külön engedélyezendő
vizuális és funkciókapcsolóhoz kötött tesztek. A lektorálás nem állítja, hogy
a feljegyzett mérőeszköz- vagy jogi tartalmi kérdések szakmai ellenőrzése is
megtörtént.
