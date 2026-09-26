# A karrierkatalógus magyar leírásainak felülvizsgálata

Dátum: 2026. szeptember 26.

## Mi készült el?

Mind a 477 aktív foglalkozás magyar leírását összeolvastuk az aktív
megnevezéssel és az azonos SOC-kódú eredeti O*NET-leírással. A 21
foglalkozáscsalád definíciója is nyelvi szerkesztést kapott. A leírások
rövid, természetes magyar mondatokban mutatják be a feladatokat.

Az angol tartalékszövegeket lefordítottuk. Ahol a magyar leírás más
foglalkozáshoz tartozott, az adott SOC szerinti feladatokat írtuk le.
Például a szonográfusnál az ultrahangos képalkotás, a baristánál a
kávékészítés, a vámügyintézőnél az ügyfél vámügyeinek intézése szerepel.

A fordítási referencia a [helyben tárolt forrásállomány](../product/data/occupations-v2.json)
azonos SOC-kódú `enDescription` mezője. Az importált adatokat és licenceket
az [eredeti forrásjegyzék](../product/occupation-catalog-sources.md) ismerteti:
O*NET 30.3 és ESCO v1.2. Az eredeti `descSource` megmaradt, az új
`descRevisionSource` jelzi a magyar átdolgozás forrását.

Az amerikai képzési vagy hatásköri előírásokat nem kezeltük magyar
jogosultsági szabályként. Különösen az egészségügy, az oktatás és a
járművezetés esetében kell külön vizsgálni a magyar megfeleltetést.

## Mi igényel külön adatfelülvizsgálatot?

A nyelvi szerkesztés több meglévő eltérést talált a SOC-foglalkozás, a
magyar megnevezés és a hozzá kapcsolt FEOR között. A kódok, a rögzített
nevek, a képzettségi adatok és az illeszkedési számítások változatlanok.
Az alábbi jegyzék az észlelt eltéréseket rögzíti; nem teljes szakmai
besorolási audit, és nem hagy jóvá új kódmegfeleltetéseket.

A sorszámok az aktív katalógus 2026. szeptember 26-i sorrendjét jelölik;
a stabil hivatkozási alap a SOC-kód.

### 1–100. tétel


| Sor / SOC | Megjelenő név | Jelenlegi FEOR | Észrevétel |
|---|---|---|---|
|25 / 25-2022.00|Általános iskolai tanár (felső tagozat)|2421 Középiskolai tanár|A név és a SOC middle-school tartalma összeillik, a FEOR más iskolafokot nevez meg. KSH: 2431 Általános iskolai tanár, tanító.|
|31 / 13-2011.00|Könyvelő|2512 Adótanácsadó, adószakértő|A SOC Accountants and Auditors; a FEOR 2513 Könyvvizsgáló, könyvelő, könyvszakértő közvetlenebb megfelelés. A leírás könyvelési feladatokra javítva, kód változatlan.|
|49 / 23-1011.00|Ügyvéd|2612 Ügyész|Külön jogi foglalkozások; a szöveg az ügyvédi/SOC Lawyers feladatokat írja le, nem ügyészi hatásköröket.|
|79 / 35-2014.00|Szakács|5131 Vendéglős|KSH 5134 Szakács tartalma felel meg a magyar címnek és a SOC Cooks, Restaurant címnek.|
|84 / 39-5092.00|Manikűrös|5212 Kozmetikus|KSH 5213 Manikűrös, pedikűrös közvetlen megfelelés. A leírás kéz- és körömápolásról szól.|

Ellenőrzött elsődleges KSH oldalak:
- https://www.ksh.hu/docs/szolgaltatasok/hun/feor08/2/2431.html
- https://www.ksh.hu/docs/szolgaltatasok/hun/feor08/2/2513.html
- https://www.ksh.hu/docs/szolgaltatasok/hun/feor08/2/2612.html
- https://www.ksh.hu/docs/szolgaltatasok/hun/feor08/5/5134.html
- https://www.ksh.hu/docs/szolgaltatasok/hun/feor08/5/5213.html

## További szakmai megfeleltetést igénylő párok az 1–100. sorban

- 34 / 13-1051.00 Kalkulátor ↔ 2521 Szervezetirányítási elemző, szervező.
- 44 / 51-9162.00 CNC-programozó ↔ 2144 Alkalmazásprogramozó (informatikai gyűjtőcsoport); a megfelelő magyar ipari besorolás szakmai ellenőrzést igényel.
- 51 / 27-3023.00 Újságíró ↔ 2715 Könyv- és lapkiadó szerkesztője.
- 54 / 49-1011.00 Karbantartási művezető ↔ 3213 Építőipari szakmai irányító, felügyelő; a SOC nem csak építőipari munkát fed le.
- 78 / 43-5011.00 Szállítmányozási ügyintéző ↔ 3161 Munka- és termelésszervező.
- 87 / 39-9011.00 Gyermekgondozó ↔ 3512 Hivatásos nevelőszülő, főállású anya; a SOC Childcare Workers tágabb feladatcsoport.
- 58 / 31-9011.00 Gyógymasszőr: a magyar cím specializáltabb, mint a SOC Massage Therapists. A leírás a terápiás masszázsról beszél, magyar képesítési jogosultságot nem állít.


### 101–290. tétel

| Elem / SOC | Aktív magyar név | Jelenlegi besorolás vagy értelmezési eltérés |
|---|---|---|
| 110 / 51-3011.00 | Pék | FEOR 5135: Cukrász. |
| 116 / 53-3033.00 | Kisteherautó-vezető | FEOR 8416: Személygépkocsi-vezető; az O*NET áruszállítást ír le. A régi taxisleírás cserélve. |
| 118 / 53-3052.00 | Autóbuszvezető | FEOR 8413: Villamosvezető. |
| 120 / 53-7051.00 | Targoncavezető | FEOR 8417: Tehergépkocsi-vezető, kamionsofőr; az O*NET üzemen/raktáron belüli ipari anyagmozgatásról szól. |
| 133 / 33-1012.00 | Rendőrkapitány | FEOR 1123: Helyi önkormányzat kinevezett vezetője. Az O*NET rendőrök közvetlen vezetőit általánosan foglalja össze. |
| 176–182 / 17-2112.01, 17-2112.02, 13-1081.01, 17-2199.03, 17-2111.00, 17-2199.08, 17-2131.00 | Ergonómiai, validációs, logisztikai, energetikai, munkavédelmi, robotikai, anyagmérnök | Mindegyik FEOR 2113: Élelmiszer-ipari mérnök. A leírás mindegyiknél a saját O*NET foglalkozásról szól most. |
| 206 / 29-1141.02 | Pszichiátriai szakápoló | Az O*NET „Advanced Practice Psychiatric Nurses”, amerikai szabályok szerinti diagnosztikai/kezelési és gyógyszerfelírási feladatokkal; a magyar név önmagában ezt nem jelenti. |
| 207 / 29-1171.00 | Kiterjesztett hatáskörű ápoló | Az O*NET hatásköri felsorolása amerikai. A leírás az akut és krónikus ellátást őrzi, a feladatokat a szakmai hatáskörhöz köti. |
| 209 / 29-1161.00; 210 / 29-9099.01 | Szülésznő; Bába | Az O*NET külön kategóriája a Nurse Midwives és Midwives. A leírásokat megkülönböztettem; nem állítok magyar jogosultsági azonosságot. |
| 215 / 29-1041.00 | Optometrista | Az amerikai forrás a szembetegségek kezelését is tartalmazza. A leírás a vizsgálatot és látáskorrekciót nevezi meg, a további ellátást a helyi szakmai jogosultsághoz köti, ahogy a korábbi magyar szöveg is jelezte. |
| 216 / 29-1224.00 | Radiológus | FEOR 2229: Egyéb humán-egészségügyi (társ)foglalkozású; a SOC radiológus szakorvos. A korábbi radiográfusleírás cserélve. |
| 218 / 25-2023.00 | Szakmai tanár | FEOR 2421: Középiskolai tanár, de az O*NET middle/intermediate/junior high school szakaszt ír. A desc a középfok előtti szakaszt írja le; ezt az oktatási szinthez tartozó mappinggel együtt érdemes vizsgálni. |
| 222 / 25-3011.00 | Felnőttoktató | FEOR 2441: Gyógypedagógus; az O*NET alapoktatás, írás-olvasás, angol mint idegen nyelv és középiskolai egyenértékűségi képzés. |
| 225 / 13-2031.00 | Költségvetési elemző | FEOR 2512: Adótanácsadó, adószakértő. |
| 230 / 33-3021.06 | Hírszerzési elemző | FEOR 2522: Üzletpolitikai elemző, szervező; a SOC rendészeti/bűnmegelőzési információelemzés. |
| 235 / 13-1199.06 | Online kereskedő | FEOR 2531: Piackutató, reklám- és marketingtevékenységet tervező, szervező. Az O*NET teljes online kiskereskedelmi munkát ír le. |
| 241 / 15-1211.01 | Egészségügyi informatikus | Az O*NET kifejezetten ápolási és informatikai ismeretek együttes alkalmazásából indul. A magyar név tágabb; a fordítás egészségügyi rendszerek fejlesztésére összpontosít. |
| 248 / 11-9199.01; 249 / 13-1041.07 | Regulatory affairs menedzser; Regulatory affairs specialista | A régi halottkémi szöveg cserélve a szabályozási megfelelés feladataira. A nevek továbbra is részben angolok; a névmező külön lektorálásakor „Szabályozási megfelelőségi vezető” / „Szabályozási megfelelőségi szakértő” megfontolható. FEOR 2611: Jogász, jogtanácsos; a SOC termelési/hatósági megfelelési feladatokat ír le. |
| 253–256 / 21-1013.00, 21-1022.00, 21-1014.00, 21-1023.00 | Pár- és családterapeuta; Egészségügyi szociális munkás; Mentálhigiénés szakember; Mentálhigiénés és addiktológiai szociális munkás | Mindegyik FEOR 2311: Szociálpolitikus. A desc most a saját terápiás/támogató feladatra vonatkozik. |
| 257 / 27-3043.00; 258 / 27-3042.00 | Író; Műszaki szakíró | FEOR 2715: Könyv- és lapkiadó szerkesztője. |
| 269 / 33-2021.00 | Tűzvédelmi ellenőr | FEOR 3117: Építő- és építésztechnikus. A korábbi építésztechnikusi desc cserélve. |
| 278–281 / 17-3025.00, 19-4099.01, 17-3024.01, 17-3026.00 | Környezetmérnöki technikus; Minőség-ellenőrzési analitikus; Automatizálási technikus; Ipari technikus | Mindegyik FEOR 3113: Élelmiszer-ipari technikus. |
| 283–284 / 53-1042.00, 53-1043.00 | Anyagmozgatási csoportvezető; Szállítási csoportvezető | Mindkettő FEOR 3213: Építőipari szakmai irányító, felügyelő. |


### 291–477. tétel


- 292, 29-2032.00: a szonográfus leírása tévesen perfúziós asszisztensről szólt; a javítás az ultrahangos képalkotást írja le.
- 295, 29-2011.00: az analitikushoz asszisztensi rutinleírás tartozott; az O*NET összetett vizsgálatot és esetleges szakmai felügyeletet ír.
- 304–306: a két műtéti és az általános orvosi asszisztens azonos rendelői szöveget kapott; a leírások most a három külön O*NET-feladatkört követik.
- 308, 29-2042.00: a mentőápoló leírása korábban mentőautó-vezetőről szólt; az O*NET szerint sürgősségi betegellátó feladat. A FEOR „Mentőtiszt” ettől eltérő magyar képzettségi megnevezés; kódhoz nem nyúltam.

- 314, 13-2041.00: a hitelelemző leírása korábban hitelezési vezetőről szólt; az elemző és a vezető hatásköre elkülönítve.
- 321, 13-1041.08: a vámügyintéző korábbi leírása hatósági átléptetési döntést állított; az O*NET ügyféloldali vámügyintézésről szól.
- 326, 43-4031.00: az aktív „Bírósági ügyintéző” név szűkebb az O*NET „Court, Municipal, and License Clerks” körénél. A leírás mindhárom intézményi területet jelzi; névváltoztatás külön döntés.
- 328, 43-3061.00: a beszerzési ügyintéző eredeti magyar leírása általános vezetői asszisztensről szólt. A FEOR „Személyi asszisztens” is tág/eltérő megfeleltetés; a leírás az O*NET beszerzési megrendeléseit követi.

- 331, 13-1041.00: az aktív „Engedélyezési ügyintéző” név szűkebb a Compliance Officers általános megfelelési és ellenőrzési feladatkörénél. A leírás az O*NET szélesebb körét követi.
- 334, 53-6051.00: az aktív „Teheráru-felügyelő” név csak a Transportation Inspectors egyik területét nevezi meg; az O*NET személyszállítási és vasúti ellenőrzést is tartalmaz.
- 336, 25-3021.00: a szabadidős tanfolyami oktatóhoz korábban életvezetési tanácsadói leírás tartozott; javítva az oktatói feladatkörre.
- 345, 27-1026.00: a dekoratőr korábbi leírása belsőépítészeti munkát és szerkezeti átalakítást állított; az O*NET kirakatokat és kereskedelmi bemutatókat ír le.
- 347–349: azonos általános audiovizuális szöveg helyett a három kód külön hangtechnikusi, operatőri és audiovizuális feladatai szerepelnek.

- 351, 43-5051.00: a postai ügyintéző FEOR-megnevezése „Banki pénztáros”; ezt az eltérő besorolást a leírás nem próbálja összemosni.
- 355, 39-7012.00: túravezető helyett korábban utazási tanácsadói szöveg állt; javítva.
- 357, 43-5031.00: segélyhívó operátor helyett korábban általános telefonközpont-kezelő szerepelt; javítva.
- 366–367: a szállítmányozóhoz kizárólag vízi szállítási, a diszpécserhez kizárólag repülésüzemi leírás tartozott. A szövegek most az általános O*NET-köröket követik.
- 366–370: több eltérő postai/logisztikai szerep FEOR-neve „Munka- és termelésszervező”. Ez tág vagy eltérő megfeleltetés; külön besorolási ellenőrzést igényel, nem nyelvi javítást.

- 373, 53-2031.00: légiutas-kísérőnél a korábbi szöveg csak ételfelszolgálást említett minden közlekedési ágazatra; a repülésbiztonsági és vészhelyzeti feladat visszakerült.
- 374, 35-9031.00: éttermi hostesshez tévesen idegenvezetői leírás és FEOR-név tartozik. A leírás javítva, FEOR-besorolás változatlan.
- 376, 35-3023.01: baristához korábban mixer/bárpultos leírás tartozott; kávékészítésre javítva.
- 384–385: a bébiszitter és iskolabusz-kísérő FEOR-neve „Hivatásos nevelőszülő, főállású anya”; a foglalkozások nem felcserélhetők, a besorolás külön ellenőrzendő.
- 388–389: biztonságszervezési szakértő és vagyonvédelmi csoportvezető helyett korábban egyszerű őri leírás állt; a szakértői tervezés és a vezetői feladat visszakerült.
- 390, 37-1012.00: a parkfenntartási csoportvezető FEOR-neve „Zöldségtermesztő”; külön besorolási eltérés.

- 391, 37-3011.00: a parkgondozó FEOR-neve „Zöldségtermesztő”, ugyanaz az eltérés, mint a 390. sornál.
- 392, 45-2092.00: az aktív „Kertészeti munkás” megnevezés szűkebb a szántóföldi és gyümölcstermesztési munkát is tartalmazó O*NET-leírásnál; a leírás a teljes felsorolt kört jelzi.
- 393, 47-2022.00: az eredeti magyar szöveg épületszobrászt ír, az O*NET kőfalazásra és kőburkolásra utal; a név változatlan, a leírás a kód szerinti munkát követi.
- 403, 49-9044.00: az ipari gépszerelő/géptelepítő leírása korábban darukötözőről szólt; javítva.
- 407, 51-4034.00: esztergályos helyett korábban általános CNC-gépkezelői szöveg szerepelt; a gép és műveletei pontosítva.

- 411, 51-4023.00: a hengerlőgép-kezelő leírása korábban kizárólag menethengerlésre vonatkozott; az O*NET általános hengerlési feladatkört ír.
- 418, 49-9062.00: az orvosi műszerésznél tervezés/gyártás helyett az O*NET vizsgálat, beállítás, javítás szerepel.
- 420, 51-5112.00: a nyomdai gépmester korábbi leírása csak flexonyomtatást említett; most a teljes felsorolt technológiakört jelzi.
- 421, 47-2231.00: napelem-telepítőhöz általános villanyszerelői szöveg tartozott; pontosítva.
- 423, 49-2092.00: villamosgép-műszerész helyett tévesen vidámparki karbantartó szerepelt; javítva.
- 427, 49-2094.00: ipari elektronikai műszerész helyett csak hajóelektronikai munka szerepelt; javítva.

- 431, 49-2022.00: a távközlési berendezésszerelő korábbi szövege rádiótechnikusi munkára szűkült; az O*NET telefonos/kábeles/internetes berendezéseit követi az új leírás.
- 432, 51-3022.00: a húsdaraboló leírása korábban csak halszeletelőt írt; visszakerült a hús/baromfi/tengeri élelmiszer teljes kör.
- 442, 51-4021.00: a „Fémhúzógép-kezelő” név szűkebb az O*NET-nél, amely extrudálást és hőre lágyuló műanyagok feldolgozását is tartalmazza; a leírás jelzi ezeket.
- 444–446: a különféle gépkezelői munkák leírásai korábban vegyianyag-keverőre és szappanprésre szűkültek; az O*NET külön feladatkörei szerint javítva. A mindháromnál használt „Kőolaj- és földgázfeldolgozó gép kezelője” FEOR-megfeleltetés lényegesen szűkebb.
- 449, 51-6062.00: az általános textilvágógép-kezelőhöz cipőalkatrész-vágási leírás és cipőgyártó FEOR-név tartozott; a leírás az általános textilvágást követi.

- 451–454: az általános élelmiszeripari/hőkezelő és szűrőberendezés-kezelő foglalkozásokhoz ugyanaz a „Borász és egyéb szeszesital-gyártó, szikvízkészítő” FEOR-név tartozik. A leírások ezt nem teszik kizárólagos ágazattá.
- 453, 51-9012.00: a szűrő- és lepárlóberendezés-kezelő eredeti magyar leírása hidrogénezésről szólt, amely eltér az O*NET-től; javítva.
- 456, 51-8021.00: a „Kazángépkezelő” aktív név szűkebb az O*NET helyhez kötött motorokat és más gépeket is tartalmazó körénél. A leírás megőrzi ezeket.
- 461, 51-2031.00: az általános motor- és gépösszeszerelő helyett csak hajómotorokról szólt a szöveg, nukleáris reaktorral is bővítve. Az O*NET-ben ez nincs; javítva.
- 463, 51-4122.00: hegesztő- és forrasztógép-kezelő helyett csak elektronikai hullámforrasztás szerepelt; a teljes kód szerinti feladatkör visszakerült.
- 464, 53-4041.00: metró- és villamosvezető helyett mozdonyvezetői/teherforgalmi leírás állt; javítva. A FEOR „Mozdonyvezető” szintén külön besorolási kérdés.
- 467, 53-3051.00: az iskolabusz-vezető FEOR-neve „Villamosvezető”; egyértelmű besorolási eltérés.
- 469, 47-4091.00: a térkőburkolóhoz gépkezelő FEOR és általános útépítő szöveg tartozott; a leírás az elemes burkolat készítését követi.
- 472, 47-4051.00: útkarbantartó munkás helyett mélyépítő technikus szerepelt; a munkakör pontosítva.
- 476–477: a jegyszedő és szórakoztatóparki munkatárs FEOR-neve „Háztartási alkalmazott”; a szerepkörök különböznek, a besorolás javítását külön kell kezelni.


## Importmezők és megjelenítés

A karrierszolgáltatás jelenlegi adatátadása nem küldi el a kliensnek az
`aliases`, `eduHu` és `feorName` importmezőket. Ezek, az angol névmezők,
a belső `reviewNote` megjegyzések és a besorolási alapadatok megmaradtak.
A részben angol, rögzített foglalkozásnevek honosítását a kódok és nevek
közös felülvizsgálatával érdemes elvégezni.

A magyar leírás önmagában nem igazolja a kapcsolt végzettség vagy
engedély magyarországi megfelelőségét. A fenti eltérések javításához
külön szakmai adatellenőrzés szükséges.
