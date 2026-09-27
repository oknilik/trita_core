# Magyar szövegminták

A 2026. szeptember 26-i második szerkesztői kör három teljes szövegen
alakítja ki a Trita közvetlenebb magyar hangját. A közös irányelveket a
[stílusútmutató](hungarian-style-guide.md) tartalmazza.

## A három teljes minta

| Minta | Mit olvasunk együtt? | Forrás |
| --- | --- | --- |
| Személyes riport | Borító, áttekintés, hat dimenzió és alskálák, munkastílus, fejlődési javaslat, mások visszajelzése és együttműködés. | A `plus-hu-mixed-full` eset a [riportforgatókönyvekben](../../scripts/pdf-report-scenarios.ts); a szövegeket az alkalmazás tartalomépítői és fordítási kulcsai adják. |
| Céges riport | Tanácsadói összefoglaló, mért és becsült adatok magyarázata, közös megbeszélési szempontok és cselekvési terv. | A `makeEditorialTeamReport()` szintetikus példája a [csapatriport mintái között](../../scripts/fixtures/team-report-reader.ts), a valódi `TeamReportDocument` megjelenítővel. |
| Blogcikk | A felmérés utáni első beszélgetéstől az egy hónappal későbbi visszatérésig tartó teljes történet. | [Amikor a csapatriport beszélgetést indít](../../content/blog/amikor-a-csapatriport-beszelgetest-indit.mdx). |

A két riport bemutatóadatokból készül. A céges mintában a tanácsadói
szövegek is szerkesztett példák. Az alkalmazásban már eltárolt tanácsadói
összefoglalókat ez a módosítás nem írja át.

### Újragenerálás

A repó gyökerében:

```sh
npx tsx scripts/preview-hungarian-copy.tsx --out /tmp/trita-magyar-mintak
```

A könyvtárba két PDF, a teljes blogcikk MDX-másolata és egy rövid olvasási
útmutató kerül. A parancs a kijelölt könyvtárban az azonos nevű kimeneteket
frissíti; adatbázis vagy külső szolgáltatás nem szükséges hozzá.

## Hogyan dolgozzunk a mintákkal?

### Személyes riport

A fő megállapítás után azt keressük, milyen helyzetben ismerhet magára az
olvasó. A javaslat nevezzen meg kipróbálható lépést. A személyiségpontokból
származó következtetés bizonytalansága a külön is olvasható szakaszokban
maradjon világos.

Az összkép előre jelezheti a részletes fejezetek témáit. A folytatásban
legyen új magyarázat vagy alkalmazási szempont; azonos mondatok sorozata
ne helyettesítse a kifejtést. A kiválasztott profil magas, közepes és
alacsony értéket is tartalmaz, és mások visszajelzését is bemutatja.

> **Korábban:** A csendesebb kollégákkal kialakuló súrlódás ritkán látványos:
> könnyen visszahúzódhatnak a beszélgetésben, ha minden gyorsan és szóban
> történik. Sokat segít, ha nem kell mindenkinek azonnal szóban reagálnia,
> és írásban is van lehetőség hozzászólni.
>
> **A mintában:** Ha gyorsan követik egymást a hozzászólások, a csendesebb
> kollégák nehezebben kaphatnak szót. Hagyj időt a válaszra, és adj
> lehetőséget arra is, hogy valaki később, írásban ossza meg a gondolatait.

A mondat egy megfigyelhető helyzetből indul. A javaslatból kiderül, mit
tehet az olvasó a következő beszélgetésen. A fejezet bevezetője továbbra is
jelzi, hogy személyiségpontokból készült becslést olvasunk.

> **Korábban:** Próbálj ki havonta egy alacsony tétű feladatban egy
> módszert vagy eszközt, amihez nincs kész recepted.
>
> **A mintában:** Válassz ebben a hónapban egy kisebb feladatot, és próbálj
> ki hozzá egy számodra új módszert vagy eszközt. Olyat válassz, ahol
> belefér, ha elsőre nem sikerül.

Az „alacsony tétű” rövidítés jelentését a második mondat bontja ki. A
gyakorlási terv végén külön kérdés segít eldönteni, bevált-e az új módszer.

### Céges riport

Az olvasó tudja elkülöníteni a kitöltések összesítését, a profilból készült
becslést és a tanácsadó megállapítását. A forrásmagyarázat mellett derüljön
ki, miről beszéljenek a következő megbeszélésen. A gyakorlati javaslatokban
nevezzük meg a feladatot, a felelőst és az időkeretet, ha ezeket a terv
valóban rögzíti.

A tanácsadói összefoglaló és a cselekvési terv ugyanazt a vállalást írja le.
Az átfogalmazás ne állítson biztos ok-okozati kapcsolatot, és ne vonjon le
egyéni következtetést az összesített adatokból.

> **Korábban:** A riport közös értelmezése a csapattal: az erősségek
> megerősítése, a kockázatok nyílt megbeszélése és a kérdések tisztázása.
>
> **Az új riport előkitöltésében:** Olvassátok át együtt a riportot.
> Melyik megállapításra tudtok saját példát mondani, és melyik lepett meg?
> A beszélgetés végén válasszatok egy változtatást, amelyet kipróbáltok.

A feladatot igék viszik előre, és a csapat kap két kezdő kérdést. Az
átfogalmazás megmutatja, hogyan lehet elkezdeni a közös értelmezést.

> **Korábban:** A kohézió itt személyiségből becsült együttműködési hajlam,
> nem közvetlenül mért összetartás.
>
> **A közös kísérőszövegben:** Az együttműködési hajlamot a
> személyiségprofilokból becsüljük. A csapat tényleges összetartását ez az
> érték nem méri.

A két mondatban külön helyet kap az adat forrása és az értelmezés határa.
A szakmai különbség megmarad, az olvasónak kevesebb egymásba ágyazott
fogalmat kell egyszerre követnie.

### Blog

A történetet a szereplők tapasztalatai és döntései viszik tovább. A
magyarázat ott marad, ahol az olvasó különben félreérthetné a mérést vagy
a történetet. A visszatérésből látszódjon, mit tartottak meg, mi maradt
nehéz, és melyik ötlet nem vált be.

A szöveg élőbbé tétele nem ad új párbeszédet vagy eseményt a forráshoz.
A nevekre, összesített adatokra és az eredmények értelmezésére vonatkozó
megjegyzések a teljes cikk részei maradnak.

Például:

> **Korábban:** A beszélgetésből derült ki, hogy a közreműködők munkájának
> láthatósága többeket is foglalkoztat.
>
> **A mintában:** Kiderült, hogy többeket is foglalkoztat, mennyire veszik
> észre a munkájukat.

A második mondatban közvetlenül az emberekről és a tapasztalatukról van szó.
Az elvont „láthatóság” helyét olyan ige veszi át, amelyet ebben a helyzetben
beszélgetés közben is használnánk.

> **Korábban:** Dávid összegyűjti a folyamatok egyszerűsítésére vonatkozó
> javaslatokat, egy hónap múlva pedig együtt döntenek arról, min változtatnak.
>
> **A mintában:** Vállalta, hogy összegyűjti, min lehetne egyszerűsíteni.
> Megbeszélték, hogy egy hónap múlva átnézik a javaslatokat, és együtt
> döntenek róluk.

Az időkeret és a közös döntés megmarad, a mondatot Dávid vállalása indítja.
A szöveg két egymást követő cselekvést ír le.

## Szerkesztői olvasás

A három szöveg első változatán külön szerkesztők dolgoznak, majd egymás
munkáját is elolvassák. A közös végső körben ezeket vizsgáljuk:

- Meg lehet-e mondani első olvasásra, ki mit tesz, és mire utal a mondat?
- Van-e olyan bekezdés, amely csak új szavakkal ismétli az előzőt?
- Következetes-e a megszólítás és a megállapítás bizonyossága?
- Megmaradtak-e a számok, feltételek, adatvédelmi határok és forrásjelölések?
- A tanácsból kiderül-e, mit próbálhat ki az olvasó?
- A kész riport a felületen és PDF-ben is kényelmesen olvasható-e?

Az elfogadott minták alapján a teljes magyar szövegkészlet újabb szerkesztői
kört kapott. A lefedettséget és az ellenőrzést az
[átfogó stíluskör változásnaplója](changelog/2026-09-26-magyar-stilus-teljes-kiterjesztese.md)
rögzíti. A három minta továbbra is közös viszonyítási pont az új tartalmakhoz.
A célközönséggel végzett olvasói próba külön következő lépés.
