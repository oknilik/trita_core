# Team Operating Style — design note és implementációs specifikáció

Dátum: 2026-09-16. Státusz: **kísérleti mérési terv + futtatható domain-prototípus**.
Kiinduló main: `fbf6af94095fde2f3989684da21aeef3ef24134c`.
Ág: `feat/team-operating-style-design`. Automatikus merge nincs.

## 1. Kiinduló rendszer: módosítás előtti felmérés

| Terület | Jelenlegi működés | Következmény |
|---|---|---|
| `src/lib/team-pattern.ts` | `calculateTeamPattern`: drive=X; cohesion=(A+H)/2; discipline=C; openness=O. Tagonkénti személyiségpontok átlaga és mintaszórása; legalább 3 tag. | Ez **összetétel**, nem a csapat közvetlenül megfigyelt működése. A cohesion itt személyiségproxy, nem mért kohézió. |
| `src/lib/pattern-data.ts` | 16 meglévő mintázat; explicit nem validált tipológia. | Régi kódok/nevek megmaradnak a composition névtérben; az új katalógus külön él. |
| `src/lib/team-stats.ts`, `src/app/api/team/[id]/pattern/route.ts` | Személyiség-eredményekből származtatott kép, jogosultságkapukkal. | Nem használhatók Operating Style adatforrásként. |
| `prisma/schema.prisma` | `AssessmentResult.scores` egyéni személyiség; `TeamMember` aktuális tagság; `Campaign` több csapatot is célozhat. | Új, csapat- és körspecifikus adatmodell szükséges. Tilos egy többcsapatos kör válaszait összemosni. |
| `TeamReport.aggregates`, `src/lib/team-report.ts` | Publikáláskor befagyasztott JSON; DRAFT/PUBLISHED; a `comparisonBasis` belső adat, redaktálva. | Additív, verziózott új mezők; a régi pillanatképeket nem számoljuk újra. |
| `team-report-composition.ts` | Pszeudonim, egyéni személyiségpontokat tároló összehasonlítási alap. | Nem az új operating réteg és nem publikálandó. |
| `TeamReportView.tsx`, `TeamReportMemberView.tsx`, `components/pdf/TeamReportPdf.tsx` | Meglévő riportfogyasztók; a tagsági nézet külön view modellel él. | A későbbi bekötés mindhárom fogyasztót és a fordítást együtt érinti. |

A felmérés a main kódjának és sémájának olvasásával történt, éles adatbázis-hozzáférés nélkül. A prototípus kizárólag új fájlokat ad hozzá. Nem változik a régi kérdésbank, számítás, API, séma vagy publikált riport.

## 2. Mérési cél és konstrukcióhatárok

**Team Operating Style:** a csapat tényleges munkavégzésének tagok által észlelt mintázata, az elmúlt négy hétben. Csapatreferensű kérdezés, nem egyéni preferencia, nem vezetői önbesorolás, nem teljesítményosztályzat. A kérdőív közvetlen viselkedésbeszámoló, de nem független viselkedésmegfigyelés.

| Dimenzió | Bal pólus (0) ↔ jobb pólus (100) | Pontosan mi tartozik ide? | Mi nem tartozik ide? |
|---|---|---|---|
| Információ | Strukturált ↔ informális | Tudnivalók rögzítésének, visszakeresésének és átadásának módja | Felelősök kiosztása, végső döntési jog, változtatási hajlandóság |
| Koordináció | Explicit ↔ organikus | Függő feladatok, felelősségek és átadások összehangolása kimondott egyeztetéssel vagy kialakult rutinból | Dokumentáltság, hierarchia, végrehajtási terv módosítása |
| Döntés | Centralizált ↔ elosztott | Hol van a végső döntési jogosultság? | Ki ad ötletet, beszél sokat, ír jegyzőkönyvet vagy kezdeményez feladatot |
| Végrehajtás | Tervvezérelt ↔ adaptív | Az előzetes munkamenet követése vagy tapasztalatokra reagáló módosítása | Ki engedélyezi a módosítást, ki felel a feladatért, mennyire jó az eredmény |

Példák az elkülönülésre: a vezető dönthet központilag úgy, hogy közben folyamatosan módosítja a tervet; egy autonóm csapat követhet szigorú munkamenetet. Az informális információátadás mellett lehet kifejezetten kimondott felelősségi rend. A jó dokumentáció mellett működhet begyakorolt, külön egyeztetést nem igénylő koordináció.

**Nem feltételezzük igazoltnak a pólusok kizárólagosságát vagy a négy faktor függetlenségét.** Strukturált és informális gyakorlat egyszerre is gyakori lehet. Emiatt mindkét pólus nyers gyakoriságát megtartjuk; a tengelypontszám relatív kontraszt, nem a teljes működés intenzitása.

## 3. Kérdésbank és felvétel

Kanonikus bank: [`questions.ts`](../../src/lib/team-operating-style/questions.ts), verzió `tos-pilot-1`. Összesen 24 saját tétel, 6/dimenzió, 3/pólus, magyar és angol szöveggel. Az angol változat munkafordítás; nyelvi ekvivalenciája még nincs ellenőrizve. Nincs átvett kereskedelmi kérdőív vagy közvetlen típusválasztó kérdés.

Instrukció: „Az elmúlt négy hét közös munkájára gondolj ebben a csapatban. Azokban a helyzetekben, amikor az állítás értelmezhető volt, milyen gyakran történt így? A tényleges gyakorlatot jelöld. Ha nem volt ilyen helyzet, vagy nem láttál rá, válaszd a Nem megítélhető lehetőséget.”

Válaszok: 1 szinte soha; 2 ritkán; 3 az esetek körülbelül felében; 4 gyakran; 5 szinte mindig; külön **nem megítélhető** (`null`). A hiányzó válasz nem középérték. A két pólus tételei külön helyzetekre is igazak lehetnek.

A felület ne mutassa a pontozási irányt és a mintázatneveket válaszadás közben. Dimenziókat váltó, stabil sorrend javasolt (INF1, COO1, DEC1, EXE1, INF2, …), akadálymentes rádiógombokkal és a kihagyás megőrzésével. Új csapattagnál a teljes négyhetes rálátást ne feltételezzük; az induláskor rögzített jogosult körbe a megfigyelési időszakban együtt dolgozó tagok kerüljenek. Kizárásokat dokumentálni kell, nem eredmény alapján meghozni.

## 4. Pontozás, hiány és szórás

A futtatható referencia: [`scoring.ts`](../../src/lib/team-operating-style/scoring.ts), `tos-score-1`.

1. Egy csapat, egy kör, egy instrumentumverzió, személyenként egy végleges válasz. Ismeretlen item, tört/hibás érték, duplikált válasz/jogosult és körön kívüli résztvevő: hiba. Az adatbázis-adapternek kell igazolnia a kör és csapat összetartozását; a tiszta függvény nem jogosultsági kapu.
2. Személyenként és dimenziónként legalább 5/6 érvényes válasz, pólusonként legalább kettő. Pólusátlagok: L és R, 1–5 skálán.
3. Személy dimenziópontja: **x = 50 + 12,5 × (R − L)**. Bal túlsúly 0 felé, jobb túlsúly 100 felé. Teljes kitöltésnél a bal tételek `6−válasz` fordításával vett átlag 0–100 transzformációjával egyenértékű. Hiánynál továbbra is azonos a két pólus súlya.
4. Csapatátlag: az érvényes személypontok számtani átlaga. Minden személy egyforma súllyal szerepel, nem az összes itemválaszt öntjük össze.
5. Csapatszórás: **s = sqrt(Σ(xᵢ − átlag)² / (n−1))**, személypontok között. A Bessel-korrekció a varianciabecslésre vonatkozik; a szórás nem általánosan torzítatlan. Nem standard error, nem reliabilitás és nem automatikus statisztikai konfidencia.
6. Tengelyenként külön `n`, jogosult létszámhoz viszonyított lefedettség, bal és jobb gyakoriságátlag. `n<3`: számok és pólus elrejtve, nem nullának látszó hiány.
7. Mintázat csak akkor, ha mind a négy dimenzión legalább 3 válaszoló, legalább 60% lefedettség és **ugyanaz az érvényes válaszolói kör**. Eltérő tengelyenkénti mintából nem készül összerakott csapattípus. A tengelyeredmények ettől még közölhetők a saját nevezőjükkel.

Kísérleti, verziózott megjelenítési szabályok: 50±6,25 zárt sáv = vegyes/közeli pólusok; SD≥25 = eltérő tapasztalatok jelzése; mindkét pólus átlaga ≥4 = mindkettő gyakori; mindkettő ≤2 = egyik sem gyakori. Utóbbi két esetben nincs mintázatnév. A közeli vagy nagy szórású esetben csak **ideiglenes leíró minta**, minden érintett pólusfordításból származó alternatívával. Pontosan 50-nél a katalóguskeresés determinisztikusan bal bitet választ, de a tengely „vegyes”, és a név soha nem jelenhet meg határozott besorolásként. Minden tengely vegyes esetén mind a 16 címke lehetséges: ilyenkor a felület „Többféle működésmód” főcímet mutasson.

Ezek terméktervezési küszöbök, **nem szakirodalomból származó normák**. A `descriptive` státusz sem validációs állítás. Az átlagos pólusgyakoriság nem tárja fel az összes item- vagy alcsoportmintát; a nyers, hozzáférésvédett kutatási adatot meg kell őrizni a pilot elemzéséhez. A kis szórás önmagában nem bizonyít valós konszenzust (közös torzítás is lehet).

## 5. A 16 működési mintázat

Bitrend: információ / koordináció / döntés / végrehajtás. 0=bal, 1=jobb. Saját, emlékeztető elnevezések, nem természetes csapattípusok és nem minőségi rangsor. A név mellett **mindig a négy konkrét póluscímke** jelenjen meg; külön 16 marketingnarratíva helyett ezek írják le pontosan a kombinációt.

| Kód | Név | Információ | Koordináció | Döntés | Végrehajtás |
|---|---|---|---|---|---|
| 0000 | Irányítótorony | Strukturált | Explicit | Centralizált | Tervvezérelt |
| 0001 | Navigációs központ | Strukturált | Explicit | Centralizált | Adaptív |
| 0010 | Óramű | Strukturált | Explicit | Elosztott | Tervvezérelt |
| 0011 | Kísérleti műhely | Strukturált | Explicit | Elosztott | Adaptív |
| 0100 | Vezényelt zenekar | Strukturált | Organikus | Centralizált | Tervvezérelt |
| 0101 | Kutatóhajó | Strukturált | Organikus | Centralizált | Adaptív |
| 0110 | Váltócsapat | Strukturált | Organikus | Elosztott | Tervvezérelt |
| 0111 | Felfedezőhálózat | Strukturált | Organikus | Elosztott | Adaptív |
| 1000 | Művezetői kör | Informális | Explicit | Centralizált | Tervvezérelt |
| 1001 | Bevetési csapat | Informális | Explicit | Centralizált | Adaptív |
| 1010 | Mesterek céhe | Informális | Explicit | Elosztott | Tervvezérelt |
| 1011 | Alkotóműhely | Informális | Explicit | Elosztott | Adaptív |
| 1100 | Összeszokott legénység | Informális | Organikus | Centralizált | Tervvezérelt |
| 1101 | Terepjáró csapat | Informális | Organikus | Centralizált | Adaptív |
| 1110 | Közös ritmus | Informális | Organikus | Elosztott | Tervvezérelt |
| 1111 | Jam session | Informális | Organikus | Elosztott | Adaptív |

## 6. Riportszerződés és összhang/feszültség

A [`report.ts`](../../src/lib/team-operating-style/report.ts) tesztelt sorrendje:

1. **Hogyan működtök együtt?** — az Operating Style négy folytonos tengelye, átlag/szórás, válaszolói létszám és lefedettség, dátumablak a körből, figyelmeztetések és feltételes mintázatnév. Mindkét pólus gyakorisága elérhető. Nincs adat: külön üres állapot, nem személyiségből pótlás.
2. **Milyen az összetételetek?** — a meglévő személyiség-aggregált négy tengely saját átlaggal és szórással, változatlan számítással, külön forrásjelöléssel. A régi mintakód csak ehhez a réteghez tartozik.
3. **Hol találkozik a működés és az összetétel?** — kizárólag megvitatandó összhangok/feszültségek, konkrét megfigyelt példával és kérdéssel. Ha nincs ilyen adat, nincs automatikusan generált probléma.

Nem vonjuk ki egymásból a két réteg azonos 0–100 skálájú, de eltérő jelentésű pontjait. Nincs automatikus `discipline → explicit coordination`, `openness → adaptive execution` megfeleltetés, illeszkedési százalék vagy személyiségből következtetett vezetési rend.

Példa beszélgetési hipotézisre: „A csapat összetételében magas a nyitottság, a beszámolók alapján most rögzített munkamenetet követtek. A workshopon említett kísérlet elhalasztása kapacitásról, előírásról vagy döntési gyakorlatról szólt?” Az eltérés önmagában nem feszültség; adaptív alkalmazkodás is lehet. Összhangként sem állítunk okozati magyarázatot.

A prototípus csak review-zott, csapathoz, operating körhöz és összetétel-pillanatképhez kötött hipotézist fogad be. A review boolean itt domain-előfeltétel: a későbbi szervernek jogosultság alapján kell létrehoznia, kliensből nem fogadható el. Szabad szöveget publikálás előtt személyesadat-ellenőrzéssel kell jóváhagyni. A report adapter nem másolja át a `styleDistances` egyéni azonosítóit. Új eredményobjektumot készít, a bemenetet nem módosítja; a tényleges befagyasztás az adatbázisos publikálási tranzakció feladata.

## 7. Tervezett perzisztencia és integráció — még nincs migráció

| Új modell | Mezők és kényszerek |
|---|---|
| `TeamOperatingRound` | id, teamId (FK), campaignId opcionális (FK), instrumentVersion, scoringVersion, referenceStart, referenceEnd, status DRAFT/OPEN/CLOSED, openedAt, closedAt. Egy kör pontosan egy csapat. A referenciaablak nyitás után nem változtatható. |
| `TeamOperatingParticipant` | roundId + userProfileId összetett egyedi kulcs, eligibleAt, eligibilityReason, submittedAt. A lefedettség nevezőjét induláskor rögzíti. |
| `TeamOperatingResponse` | id, roundId + userProfileId egyedi FK a résztvevőre, answers Json, submittedAt. Első végleges beadás után változatlan; retry azonos eredményt ad, eltérő payload 409. Új mérés új kör. |
| `TeamOperatingDraft` | roundId + userProfileId egyedi kulcs, answers Json, updatedAt. Csak a kitöltő érheti el; nem számít kész válasznak. |
| `TeamReport.aggregates` additív mezők | `operatingStyle` nullable verziózott snapshot; `composition` új, explicit névtér; `operatingReflections` review-zott hipotézislista. A régi `pattern` mező megőrzött kompatibilitási adat. |

A válasz személyazonosítóval védett háttéradat, tehát nem ígérünk technikai anonimitást. Szervezeti vezető/tag kizárólag publikált aggregátumot kap; nyers válaszhoz csak indokolt tanácsadói/kutatási jogosultság férjen. Létszámküszöb és differenciálás elleni védelem kell: nincs alcsoportfilter, egyenként frissülő élő pontszám vagy egyetlen új válasz hatását felfedő publikálás. Háromfős küszöb nem anonimitási garancia.

Javasolt megvalósítási lépések a következő PR-ekben:

- Additív Prisma-modellek és migráció; relációk, kör/tag egyediség, szerveroldali verzió- és 1–5 validáció. Keresztcsapatos kampány és jogosultsági tesztek.
- Kampánylépés `TEAM_OPERATING_STYLE` bekötése az aktuális step policy-ba; egységes nyitás/zárás és jogosult taglista. A TSFI `TestType` nem bővül: más konstrukció és más kitöltési egység.
- Beadás/draft API a meglévő auth/policy infrastruktúrával; idempotencia, lezárt kör elutasítása, adatmegőrzési és törlési szabályok.
- HU/EN kérdőív az alkalmazás `t`/`tf` rendszerébe kötve, nem új lokalizációs mechanizmusként. A bank kétnyelvű mérési tartalomként marad verziózott.
- `buildTeamReportAggregates` explicit operatingRoundId-val olvas, több kör közül nem választ hangtalanul „legfrissebbet”; publikáláskor számít és fagyaszt. A jogosult roster és dátumablak is a snapshot része.
- A manager, member és PDF riport közös rétegsorrendet követ. Régi snapshot hiányzó új mezője „Nincs működésmérés” állapot, nem hibás/üres személyiségmérés.
- A régi csapat- és publikus mintázatfelületek feliratainak későbbi rendezése „személyiség-összetétel”-re; régi URL/kód visszafelé kompatibilis marad. A parkolt `/patterns` nem aktiválódik ettől.

E PR nem tartalmaz UI-, API- vagy adatbázis-élesítést. A kérés tervezési szakaszát, kérdésbankját, számítását és riportkontraktusát teszi felülvizsgálhatóvá.

## 8. Kutatási alap és validáció

A viselkedési folyamatokat, a kialakuló kognitív/érzelmi/motivációs csapatállapotokat és az egyéni összetételt külön fogalmi szinten kezeljük. Ennek alapja Marks, Mathieu és Zaccaro folyamatkerete; az időbeli és kontextuális kölcsönhatásokhoz Ilgen és munkatársai IMOI-áttekintése ad hátteret. **A négy új dimenzió, a kérdésbank, a küszöbök és a 16 név saját tervezési javaslat; ezeket a források nem validálják.**

- Marks, M. A., Mathieu, J. E., & Zaccaro, S. J. (2001). *A Temporally Based Framework and Taxonomy of Team Processes*. Academy of Management Review, 26(3), 356–376. [DOI](https://doi.org/10.5465/amr.2001.4845785).
- Ilgen, D. R., Hollenbeck, J. R., Johnson, M., & Jundt, D. (2005). *Teams in Organizations: From Input-Process-Output Models to IMOI Models*. Annual Review of Psychology, 56, 517–543. [Kiadói oldal](https://www.annualreviews.org/content/journals/10.1146/annurev.psych.56.091103.070250).
- Fyhn és munkatársai (2023). *Taking the emergent in team emergent states seriously: A review and preview*. Human Resource Management Review, 100928. [DOI](https://doi.org/10.1016/j.hrmr.2022.100928). Kiegészítő háttér a kialakuló állapotok értelmezéséhez.

Pilot előtt kognitív interjú: a kitöltő a csapat tényleges viselkedésére gondol-e; különösen INF–COO és COO–EXE összemosódás, DEC4 delegált és DEC6 közös döntés különbsége, valamint a végrehajtási itemek közeli jelentése vizsgálandó. Független szakértők vak tételbesorolása és tartalmi relevanciaértékelése. A magas belső konzisztencia önmagában nem cél, redundanciát is jelezhet.

A terepi pilotban: hiány/N/A arány, plafon/padló, itemeloszlások, pólusok együttjárása, kiegyensúlyozott válaszadásból fakadó módszerfaktor, kontextus (feladattípus/szabályozottság), vezető/tag eltérések hozzáférésvédett kutatási elemzése. Összevetendő modell: négy bipoláris faktor vs. nyolc pólusfacet, valamint kevesebb faktoros riválisok. Először feltáró, majd külön mintán megerősítő elemzés; faktorkorrelációk, keresztterhelések, omega, diszkrimináns validitás, itemek nyelvi invarianciája. Ha nincs bipolaritás, a 16-os tipológiát nem szabad erőltetni: maradjanak külön pólusgyakoriságok.

Csapatszintű aggregálhatóság: ICC(1), ICC(2), megfelelő nullmodellű r_wg, illetve az eltérő tapasztalatok érdemi vizsgálata. Nem 24 item × sok válasz jelenti a független csapatszintű mintanagyságot: a csapatok száma kritikus. 15–20 pilotcsapat használhatósági indulás, nem tipológia-validáció. A későbbi mintanagyságot a tervezett többszintű modellre szimulációval kell meghatározni. Ismételt felvétel és független megfigyelés szükséges az időbeli megbízhatósághoz; a működés valós változása nem mérési hiba.

## 9. Elfogadási feltételek

- A meglévő személyiségmotor változatlan és regressziós tesztjei zöldek.
- Mind a 16 új kombináció determinisztikus, külön névtérben és egyedi névvel.
- Átlag és mintaszórás kézzel számolható fixture-ön ellenőrzött; azonos átlagú homogén és heterogén csapat eltérően jelenik meg.
- Határértékek, hiány, mindkét/egyik pólus sem, lefedettség, eltérő válaszolói kör, duplikáció, ismeretlen item és hibás adat ellenőrzött.
- Riportsorrend, forrásrétegek megőrzése, egyéni azonosítók kizárása, téves csapat/kör/snapshot kapcsolás és bizonyíték nélküli hipotézis elutasítása tesztelt.
- Éles bekötés csak az előző szakasz API/DB/UI/PDF integrációs tesztjeivel, továbbra is kísérleti módszertani jelöléssel. Main merge külön döntés.

## Függelék: magyar kérdésbank, v1

A pólus a pontozási kulcs, a kitöltői felületen nem látszik.

| ID | Dimenzió | Pólus | Állítás |
|---|---|---|---|
| INF1 | information | bal | A munkához szükséges háttérinformációkat közös, előre kialakított szerkezetben rögzítettük. |
| INF2 | information | jobb | A feladat megértéséhez szükséges részleteket közvetlen beszélgetésekből szereztük meg. |
| INF3 | information | bal | Egy korábbi információt a közösen kijelölt nyilvántartásban kerestünk vissza. |
| INF4 | information | jobb | Egy korábbi információért ahhoz a kollégához fordultunk, aki emlékezett rá. |
| INF5 | information | bal | A munkával kapcsolatos új tudnivalókat egységes sablon szerint adtuk tovább. |
| INF6 | information | jobb | Az új tudnivalókat az adott helyzethez igazított, kötetlen üzenetekben adtuk tovább. |
| COO1 | coordination | bal | Az egymásra épülő feladatok előtt külön tisztáztuk, ki kinek adja át a munkát. |
| COO2 | coordination | jobb | Az egymásra épülő feladatokat a társaink haladását figyelve, külön egyeztetés nélkül kapcsoltuk össze. |
| COO3 | coordination | bal | Közös feladatnál kimondtuk, melyik résznek ki a felelőse. |
| COO4 | coordination | jobb | A közös feladat következő részét az vette át, aki a helyzetből látta, hogy rá van szükség. |
| COO5 | coordination | bal | Mielőtt más munkájára építettünk, külön jeleztük egymásnak, hogy az átadható. |
| COO6 | coordination | jobb | A megszokott közös munkamenetből tudtuk, mikor kapcsolódjunk be egymás feladataiba. |
| DEC1 | decision | bal | A felmerülő szakmai alternatívák közül ugyanaz a kijelölt vezető választotta ki, melyikkel haladjunk tovább. |
| DEC2 | decision | jobb | A feladaton dolgozó kollégák saját hatáskörben választottak a szakmai alternatívák közül. |
| DEC3 | decision | bal | A munkát érintő választás véglegesítéséhez a kijelölt vezető jóváhagyását kértük. |
| DEC4 | decision | jobb | A döntési jog annál a csapattagnál volt, akinek az adott szakterületéhez tartozott a kérdés. |
| DEC5 | decision | bal | Ha több megoldás maradt versenyben, a végső szót a kijelölt vezető mondta ki. |
| DEC6 | decision | jobb | Az érintett csapattagok közösen hozták meg a végső döntést, külön vezetői jóváhagyás nélkül. |
| EXE1 | execution | bal | A munka lépéseit az induláskor kijelölt sorrendben végeztük el. |
| EXE2 | execution | jobb | A munka közben szerzett tapasztalatok alapján átrendeztük a következő lépések sorrendjét. |
| EXE3 | execution | bal | A következő munkalépést az előre elkészített ütemezésből vettük. |
| EXE4 | execution | jobb | Egy köztes eredmény kipróbálása után módosítottuk a folytatás menetét. |
| EXE5 | execution | bal | A végrehajtás során az előre meghatározott munkamenetet követtük. |
| EXE6 | execution | jobb | Új visszajelzés érkezésekor átalakítottuk a még hátralévő munka menetét. |
