# Trita UX- és journey-átszabás — döntési dokumentum és megvalósítási terv

**Dátum:** 2026-08-12

**Ág:** `codex/ux-journey-simplification`

**Kiindulópont:** `origin/main` (`84867e5`)
**Státusz:** minden tervezett szelet és a korábbi UX-audit backlogja elkészült

## 1. Vezetői döntés

A Trita vizuális megújítás helyett journey-egyszerűsítést kap. A jelenlegi
designrendszer, tipográfia, színvilág, tokenek és felületi karakter megmarad.
A változtatások célja, hogy a felhasználó minden helyzetben értse:

1. hol tart;
2. miért fontos a következő lépés;
3. pontosan egy elsődleges teendőként mit kell most megtennie.

A termék következő fejlődési szakasza nem újabb insightblokkok hozzáadása,
hanem az insightig vezető út rövidítése és az insight utáni végrehajtás
megerősítése.

## 2. Nem változó alapelvek

- A meglévő Trita design tokeneket és UI-primitíveket használjuk.
- Nem vezetünk be új vizuális stílust vagy párhuzamos komponenskönyvtárat.
- A Fraunces + DM Sans tipográfiai hierarchia, a cream/ink/bronze/sage
  karakter és a jelenlegi felületi tónusok megmaradnak.
- A mérési validitást és a kérdések sorrendjét UX-okból nem módosítjuk.
- A szerepköri és adatvédelmi jogosultságokat nem lazítjuk.
- Minden új viselkedést magyar és angol szöveggel, billentyűzetes és mobil
  használatra is tervezünk.

## 3. Célállapot

### 3.1 Egyéni journey

```text
landing → vendégmérés → eredmény-előnézet → regisztráció
        → minimális aktiválás → azonnali eredmény
        → egy ajánlott következő lépés
        → opcionális profilgazdagítás / külső nézőpont / karrier
```

**Kulcsdöntés:** a már elkészült eredmény elé nem kerülhet kötelező
demográfiai adatfal. A vendégmérésből érkező felhasználó csak a megszólításhoz
szükséges nevet és az adatkezelési hozzájárulást adja meg. A születési év, nem,
ország és karrierháttér később, a profilban tölthető ki.

### 3.2 Csapat- és B2B journey

```text
csapat landing → rövid kapcsolatfelvétel → tanácsadói egyeztetés
              → program-setup → meghívás → egy közös teendőlista
              → részvétel követése → tanácsadói jóváhagyás
              → vezetői összefoglaló → workshop → akciókövetés
```

**Kulcsdöntés:** a publikus fejléc elsődleges CTA-ja követi a landing aktuális
módját. Egyéni módban a mérésre, csapatmódban a kapcsolatfelvételre visz.

### 3.3 Szerepköri cél-IA

| Szerep | Elsődleges navigáció |
|---|---|
| Egyéni felhasználó | Kezdőlap, Eredményeim, Teendők |
| Csapattag | Kezdőlap, Eredményeim, Teendők, Csapatom |
| Vezető | Teendők, Csapatok, Riportok |
| Tanácsadó | Ügyfelek, Ellenőrzésre vár, Workshopok, CRM |
| Platformadmin | Platform, Analitika, Beállítások |

Ez célállapot, nem egyetlen release-ben végrehajtandó navigációcsere.

## 4. Megvalósítási szakaszok

### Szelet 1 — konverziós töréspontok

- [x] külön ág az aktuális `origin/main` állapotából;
- [x] gyors aktiválás a vendégmérésből érkezőknek;
- [x] az onboarding API-ban opcionális demográfiai adatok;
- [x] sikeres claim után egyértelmű, eredményorientált aktiválási nézet;
- [x] csapatmódot követő publikus fejléc-CTA;
- [x] célzott unit- és client tesztek;
- [x] desktop és mobil vizuális ellenőrzés.

### Szelet 2 — egy következő lépés

- [x] egy ajánlott következő lépés minden fő cockpit tetején;
- [x] a versengő helyi teendőblokkok összevonása a csapat-áttekintésben;
- [x] „Feladataim” és helyi fókuszkártya felelősségi határának rögzítése;
- [x] kampány-időzítési vezérlők áthelyezése a kampány részletezőjére.

**Rögzített felelősségi határ:** a csapat-áttekintés egyetlen, azonnal
végrehajtható teendőt emel ki. A prioritás: nyitott mérési lépés → megkezdett
vagy beérkezett visszajelzéskérés → saját observer-kör → később nyíló mérés.
A teljes mérési backlog és a további párhuzamos feladatok kanonikus helye a
`/tasks`; a csapatoldal nem ismétli meg listaként ugyanazokat a tételeket.

### Szelet 3 — csapatoldal és riport

- [x] tanácsadói csapatfülek összevonása: Áttekintés / Emberek / Elemzések / Riport;
- [x] a régi profil-, csapatszerep- és visszajelzés-linkek megőrzése célzott átirányítással;
- [x] mobil fülsor görgethetőségének látható jelzése;
- [x] vezetői riport első képernyő: legfeljebb 3 erősség, 3 kockázat, 3 akció;
- [x] belső dimenziókódok elrejtése az alapnézetből;
- [x] „validált” helyett „tanácsadó által jóváhagyott”.

### Szelet 4 — végrehajtás és megtartás

- [x] akciók felelőssel, határidővel és státusszal;
- [x] a publikált riport akcióállapotának külön, jogosultságkezelt mentése;
- [x] workshop- és facilitátori nézet 90 perces menetrenddel és guardraillel;
- [x] 30/60/90 napos utánkövetés;
- [x] két publikált mérési kör közötti változásnézet;
- [x] vezetői heti összefoglaló és elakadásjelzés.

**Adatmodell-döntés:** az akciókövetés a meglévő `TeamReport.actionItems` JSON
mezőt bővíti opcionális `owner`, `dueDate` és `status` mezőkkel. Így nincs
migráció, a korábbi riportok `not_started` alapállapottal továbbra is
olvashatók, miközben a publikált riport befagyasztott mérési aggregátumai nem
változnak. A külön akció-végpont csak a legutolsó publikált riportot engedi
módosítani, szervezeti vezetői vagy tanácsadói jogosultsággal.

## 5. Szelet 1 elfogadási feltételei

### Vendégből regisztrált felhasználó

1. A teljes vendégmérés claimje változatlanul idempotens és veszteségmentes.
2. Sikeres claim után a felhasználó a gyors aktiválási nézetre érkezik.
3. A gyors nézeten csak a megszólítás és a hozzájárulás kötelező.
4. Születési év, nem, ország és karrierháttér nem blokkolja az eredményt.
5. Mentés után a journey közvetlenül a személyes eredményre visz.
6. Normál, mérés nélküli regisztrációnál a jelenlegi teljes onboarding marad.
7. Org-meghívás és tanácsadói flow viselkedése nem változik.

### Marketing CTA

1. Egyéni landingmódban a sticky CTA `/try` célú.
2. Csapat landingmódban a sticky CTA `/contact` célú.
3. A desktop és mobil fejléc azonos kontextust követ.
4. A landing statikus prerenderje és LCP-optimalizálása nem sérül.

## 6. Mérési terv

Az átszabás hatását az alábbi funnel eseményekkel kell mérni:

| Lépés | Fő mérőszám |
|---|---|
| Vendégmérés indítása | landing → try CTR |
| Vendégmérés befejezése | completion rate |
| Regisztráció | teaser → signup rate |
| Claim | sikeres claim arány |
| Gyors aktiválás | megnyitás → mentés arány és idő |
| Első eredmény | claim → result eljutási arány |
| Következő lépés | observer/team/career CTA aktiválás |
| B2B | team landing → contact conversion |

Az elsődleges eredménymutató a `claim siker → első eredmény megnyitása` arány.

## 7. Tesztstratégia

- unit: aktiválási mód és validáció;
- client: gyors és teljes onboarding render/submit;
- integration: onboarding API minimális és teljes payload;
- journey: guard és eredményhez irányítás;
- e2e smoke: vendégmérés → regisztráció → gyors aktiválás → eredmény;
- vizuális: 390 px mobil és 1280 px desktop, világos és sötét téma;
- quality gate: typecheck, lint, színtoken-ellenőrzés és új UI-hex guard.

## 8. Rollout és visszaállítás

A gyors aktiválás forrásparaméterhez kötött (`source=claim`), így csak a
vendégmérésből érkező út változik. Ha regresszió jelentkezik, a claim redirect
visszaállítható a normál `/onboarding` célra adatmodell-változás nélkül.

Az első szelet nem igényel Prisma-migrációt: a demográfiai mezők már most is
nullable mezők. Ez csökkenti a rollout és a rollback kockázatát.

## 9. Első szelet verifikációs eredménye

**Sikeres ellenőrzések:**

- TypeScript typecheck;
- sikeres optimalizált production build (102 statikus oldal generálva);
- a módosított fájlok célzott ESLint-ellenőrzése;
- színtoken- és új-hex guard;
- 967/967 unit teszt;
- 156/157 client teszt az első teljes futásban; az egyetlen, módosítástól
  független assessment-időzítési teszt önálló újrafuttatása 10/10 zöld;
- az új onboarding- és navigációtesztek 3/3 zöld;
- böngészős ellenőrzés világos/sötét rendszerkörnyezetben, desktopon és
  390×844-es mobil viewporton;
- a claim aktiválási submit eljut a `/profile/results` célra a korábbi
  Next Router hook-sorrend hiba nélkül.

**Környezeti korlátok:**

- a helyi fejlesztői adatbázis sémája lemaradt a friss `origin/main`
  Prisma-sémájától (`AnalyticsEvent`, `Deal`, `lifecycleEmailsOptOut` hiányzik),
  ezért az eredményoldal teljes adatfüggő renderje ezen a DB-n nem tekinthető
  release-verifikációnak;
- a teljes `pnpm check` a már jelen lévő, untracked `playwright-report/`
  generált JavaScript-fájljait is linteli. A saját változások célzott lintje
  tiszta; a felhasználói riportkönyvtárat nem módosítottuk és nem töröltük.

## 10. Második szelet részverifikációja

- a csapat-fókusz prioritási szabályának 4/4 unit tesztje zöld;
- a szervezeti fókusz prioritási szabályának 4/4 unit tesztje zöld;
- a fókuszkártya kliensoldali render- és linktesztje 1/1 zöld;
- a kampányütemezés kontextusváltásának kliensoldali tesztje 1/1 zöld;
- a teljes unit suite 975/975 zöld;
- TypeScript typecheck és célzott ESLint hibamentes;
- színtoken- és új-hex guard hibamentes;
- az optimalizált production build sikeres, 102 statikus oldallal.

## 11. Harmadik szelet részverifikációja

- a hét csapatfül négy, feladat-alapú célra egyszerűsödött;
- a régi `profile`, `teamRole`, `roles` és `feedback` mélylinkek a megfelelő
  új fejezethez irányítanak;
- a vezetői 3–3–3 összefoglaló tisztán prezentációs réteg, nem írja át a
  tanácsadói tartalmat;
- az új narratíva-kiemelő és a régi linkek regressziós tesztjei zöldek;
- a teljes unit suite 978/978 zöld;
- TypeScript typecheck hibamentes.

## 12. Negyedik szelet részverifikációja

- a régi és bővített akciószerkezet egyaránt szerializálható;
- a heti összefoglaló külön számolja a kész, folyamatban lévő, elakadt,
  lejárt és hét napon belül esedékes akciókat;
- az akcióállapot-írás csak a legutóbbi publikált riportot és csak vezetői
  vagy tanácsadói szervezeti szerepet enged;
- a mérési összevetés a részvételt, a pszichológiai biztonságot és a legnagyobb
  profilmozgásokat mutatja, oksági állítás nélkül;
- a teljes unit suite 981/981 zöld;
- TypeScript typecheck hibamentes.

## 13. Korábbi audit-backlog lezárása

- a személyes riport fejezet-ugró sávot kapott, a hosszú munkastílus- és
  fejlődési rész igény szerint nyitható;
- a két eredményfül egyszerű, kétoszlopos szegmens lett: nincs vízszintes
  scroll-state, él-fade, auto-center vagy routeres lapugrás;
- az interakciós archetípusválasztás kétlépcsős, és nem mutat előre kitöltött
  elemzést explicit választás előtt;
- a kolléga-meghívó skeletonja és az értesítés-elvetés visszavonása a
  kódbázisban már elkészült volt; a korábbi audit státusza ehhez igazodott;
- a rétegzett interakció kliens-integrációs tesztje 14/14 zöld;
- a teljes unit suite 981/981, a teljes client suite 159/159 zöld;
- TypeScript typecheck, célzott ESLint, színtoken- és új-hex guard hibamentes;
- az optimalizált production build sikeres, 102 statikus oldallal;
- a publikus egyéni/csapatos mód és a kontextuális fejléc-CTA 390x844-es mobil
  viewporton böngészőben is ellenőrizve, a meglévő vizuális rendszerben maradt.

Az autentikált képernyők teljes böngészős adat-ellenőrzését a helyi adatbázis
korábban jelzett sémaeltérése korlátozza; a komponens-, integrációs és production
build ellenőrzések ettől függetlenül teljesen zöldek.

## 14. Szervezetből kilépő felhasználó self-fallbackje

- a szervezeti eltávolítás egyetlen tranzakcióban soft-exittel lezárja az
  `OrganizationMember` sort, és törli az adott org aktív csapattagságait;
- a személyes profil, a self `AssessmentResult` és az observer-kapcsolatok nem
  törlődnek;
- ha nem marad más valódi org-tagság, a profil `INDIVIDUAL` szerepre, üres
  `activeOrgId` és `activeTeamId` kontextusra áll vissza;
- több-szervezetes fióknál a megmaradt aktív, illetve legfrissebb tagság lesz a
  fallback, és csak az eltávolított org csapatkapcsolatai szűnnek meg;
- a szervezeti, kampány-, team- és riport-API-k a `leftAt` értéket is
  jogosultsági kapuként kezelik, ezért a kilépett user mélylinkkel sem őrzi meg
  a korábbi hozzáférést;
- a taglisták és admin létszámok csak az aktív tagságokat számítják;
- az új unit tesztek 4/4 zöldek; a két új adatbázisos integrációs eset a self
  eredmény megőrzését és a több-org fallbacket ellenőrzi. Helyben a teszt-DB
  `prisma migrate deploy` bootstrapja schema-engine hibával megállt a tesztek
  indulása előtt, ezért ennek végső bizonyítéka a PR hermetikus GitHub CI-je;
- a teljes unit suite 985/985, a teljes client suite 159/159 zöld;

## 15. Eredményoldal progresszív feltárása

A következő UX-kör a személyes eredmény első olvasását egyszerűsíti úgy, hogy
a meglévő mély riport és a Trita vizuális karaktere megmarad.

- az alapértelmezett `Összkép` három értelmezési kapaszkodót, szám nélküli
  hatdimenziós profilképet és egy helyzetfüggő következő lépést mutat;
- a `Részletes riport` őrzi meg a radart, a pontos értékeket, alskálákat,
  munkastílust, fejlődési fókuszt és a további modulok átvezetőit;
- a régi `?tab=results` és `?tab=workstyle` mélylinkek a részletes riportba,
  a comparison/invites linkek a `Külső kép` nézetbe érkeznek;
- a hero erősség/figyelendő chipjei kikerültek, mert az Összkép értelmezési
  kártyái ugyanazt a feladatot egyértelműbb kontextussal látják el;
- a karakterábra magyarázata a részletes nézetbe került, ahol igény szerint
  nyitható, nem verseng az első összképpel;
- a pontos értékek `x / 100` formátumot és explicit skálamagyarázatot kaptak:
  nem osztályzatok és norma nélkül nem percentilisek;
- a Segítőkészség információja és értéke egyetlen kompakt blokk lett;
- a kapcsolati és karrier-átvezetők egy `További felfedezési irányok`
  szekcióban nyithatók meg;
- az Összképen egyetlen gyors érthetőségi kérdés jelenik meg, a hosszabb
  elégedettségi kérdőív csak a Részletes riport végén;
- a meglévő `surface.tab_view` méri a három olvasási módot, az új
  `results.section_open` pedig a dimenzió-, munkastílus- és további irányok
  megnyitását. A sémák zártak, szabad szöveg vagy pontszám nem kerül az
  analitikai streambe.

**Vizuális és technikai ellenőrzés:** az Összkép külön komponens-előnézetben
1280×720 és 390×844 viewporton is vízszintes túlcsordulás nélkül, a meglévő
cream/ink/sage/bronze tokenekkel renderelt. Az autentikált teljes oldal helyi
ellenőrzését továbbra is a 9. fejezetben rögzített, lemaradt fejlesztői
adatbázisséma korlátozza. A célzott typecheck, ESLint és 16 érintett kliens- és
analitikai teszt zöld; a teljes repo-lint a meglévő, generált
`playwright-report/` bundle-ök miatt nem használható tiszta jelként.

### 15.1 Részletes riport — C irány

A külön fejezet-ugró sáv helyett a részletes riport egyetlen, számozott
fejezet-akkordeont használ. Egyszerre egy fejezet nyitott: Áttekintés,
Dimenziók, majd Munkastílus és fejlődés. A nyitott fejezet végén egy vezetett
„Következő fejezet” gomb visz tovább, miközben bármelyik fejezet közvetlenül
is megnyitható. A karakterábra az Áttekintés tartalma lett, így nem képez
negyedik navigációs sávot. A régi `?tab=workstyle` mélylink közvetlenül a
harmadik fejezetet nyitja; a fejezetnyitások továbbra is mértek.

A komponens desktopon és 390×844-es mobil viewporton vízszintes túlcsordulás
nélkül működik. Mobilon a hosszabb fejezetleírások rejtve maradnak, a cím,
sorszám és nyitási állapot egyetlen, legalább 78 px magas érintési célban él.

- TypeScript typecheck, célzott ESLint és a szín/hex guardok hibamentesek;
- mind a 985 unit és 167 kliens teszt sikeres;
- az optimalizált production build sikeres, 103 oldallal.

### 15.2 Fókusznézet — a C irány egyszerűsítése

A mobil vizuális ellenőrzés alapján az akkordeon rendezte ugyan a tartalmat,
de a három állandó fejezetfejléc továbbra is második teljes navigációként
versengett a három eredménynézettel. A fókusznézet ezért szétválasztja a két
szintet:

- mobilon az Összkép, Részletes riport és Külső kép egyetlen natív
  eredménynézet-választóban él;
- desktopon ugyanez egy keret nélküli, aláhúzott szöveges tabsor;
- a részletes riport egyszerre csak az aktuális fejezet címét, leírását és
  tartalmát mutatja;
- a helyzetet három finom progressz-szakasz és az `1 / 3` számláló jelzi;
- a közvetlen fejezetugrás mobilon alsó lapként, desktopon kompakt dialógusként
  csak kérésre jelenik meg;
- a fejezet végén egyetlen „Következő fejezet” CTA vezeti tovább az olvasást.

Így alapállapotban nem jelenik meg egyszerre két teljes navigációs rendszer.
A `?tab=workstyle` mélylink továbbra is közvetlenül a harmadik fejezetet nyitja;
az új `?tab=details&chapter=…` állapot az aktuális fejezetet frissítéskor és
megosztáskor is megőrzi. A fejezetváltások analitikai mérése változatlan marad.

A fókusznézetet 390×844-es mobil és 1280×800-as desktop viewporton ellenőriztük.
Mindkettőn vízszintes túlcsordulás nélkül működik; a mobil fejezetválasztó
lezárja a háttérgörgetést, Escape-pel és explicit bezárógombbal is zárható.

### 15.3 Újratervezett eredményélmény — összkép + lineáris riport

A következő validációs körben az eredményoldalt nem a meglévő navigációból,
hanem a felhasználó első két kérdéséből indítottuk újra: „mit jelent ez nekem?"
és „hol találom az összes bizonyítékot?". Az oldal ezért már nem három
egyenrangú nézetet kínál.

- az `Összkép` maga a kezdőoldal: három, számozott értelmezési kapaszkodóval;
- a hat dimenzió sávjai kikerültek az első olvasási rétegből, mert a gyors
  összképen egyszerre növelték az információs és a vizuális terhelést;
- két kontextuális belépő maradt: `Minden részlet` és `Külső nézőpont`;
- a teljes riport egyetlen lineáris dokumentum, így minden információ bent
  marad, de nincs fejezetállapot, akkordeon-navigáció vagy módválasztó;
- a rövid tartalomjegyzék csak gyorshivatkozás: nem rejt el tartalmat;
- a fejezetcímek felhasználói kérdést kapnak (`Milyen mintázat rajzolódik
  ki?`, `Mi van a profilod mögött?`, `Hogyan fordítsd ezt működésre?`), hogy
  a szakmai struktúra mellett a várható haszon is azonnal érthető legyen;
- a külső nézőpont saját fejlécet és egyértelmű visszautat kapott, de nem
  került vissza globális tabként az alapképernyőre;
- a régi `?tab=results`, `?tab=workstyle`, `?tab=comparison` és `?tab=invites`
  mélylinkek továbbra is a megfelelő tartalomhoz vezetnek.

Ez a változat tudatosan prototípus a meglévő UX-branchen: a vizuális rendszer,
a mérési logika, a jogosultságok és a teljes részletes tartalom változatlan.

### 15.4 Részletes riport — fejezetkártyás A irány

A lineáris riport vizuális tesztje után a részletes dokumentum fejezetei
önálló, erős kártyafelületet kaptak. A kártya fejléce egyszerre tartalomjegyzék,
összefoglaló és nyitási felület; külön fejezetnavigáció nincs.

- mindhárom fejezet címe, felhasználói kérdése és rövid tartalma mindig látszik;
- egyszerre legfeljebb egy fejezet tartalma nyitott, ezért mobilon sem nő kontrollálatlanul
  a vizuális és görgetési terhelés;
- a kezdőállapot és a `?chapter=...` mélylink a megfelelő kártyát nyitja;
- fejezetváltáskor a korábbi tartalom bezárul, az új kártya a viewportba kerül;
- az egész kártyafejléc nagy érintési cél, az állapot szöveggel és nyíllal is
  jelzett (`Megnyitás ↓` / `Bezárás ↑`), nem csak színnel;
- a riport összes szakmai tartalma és a korábbi analitikai mérés megmaradt.

### 15.5 Karakterábra — swipe-olható hero, B irány

A karakterábra kikerült a név melletti bélyegből és a részletes riport
Áttekintés fejezetéből. Most a profil mellett egy vízszintesen váltható második
hero-nézetként jelenik meg, nagy méretben.

- asztali nézetben a hero jobb széléhez kapcsolódó, szöveges lapfül jelzi a
  váltást; mobilon a jobb felső sarokban önálló, kétirányú swipe-ikon jelenik meg;
- mobilon az ikont egyszeri, finom betöltési mozgás teszi felfedezhetővé, a
  hozzáférhető név pedig mindig egyértelműen jelzi a céloldalt;
- a karakteroldalon a teljes ábra, a típusnév, a dimenziópár és a forma–motívum
  rövid magyarázata együtt látszik;
- a váltás nem változtat URL-t és nem szakítja meg az eredményoldal olvasási
  pozícióját;
- ha nincs érvényes karakterpár, a lapfül nem jelenik meg;
- a részletes riport Áttekintés kártyája így közvetlenül a radarhoz és a hat
  dimenzióhoz vezet, ismétlődő karakterábra-blokk nélkül.

#### Mobilos és mozgás-finomítás

- mobilon a széles alsó sáv helyett 48 × 48 px-es, csak ikonos swipe-vezérlő
  jelenik meg a hero jobb felső sarkában;
- asztalon megmarad a szöveges oldalsó lapfül;
- mobilon a hero valódi vízszintes húzógesztussal is váltható, a függőleges
  oldalgörgetést nem blokkolja;
- a hero megosztás- és PDF-gombjai egérrel továbbra is biztonságosan
  kattinthatók; az interaktív elemen induló egérhúzás nem vált nézetet;
- első betöltéskor a hero és a swipe-ikon egyszer néhány pixelt oldalra mozdul;
- váltáskor a két teljes nézet egyidejűleg, kis távolságon keresztezi egymást:
  a régi oldal kifelé, az új az ellenkező irányból befelé csúszik;
- a húzás közben a hero legfeljebb 10 px-en követi az ujjat, így a gesztus
  azonnal válaszol, de nem tud elszaladni;
- a két hero eltérő magassága is ugyanebben a 320 ms-os átmenetben változik,
  ezért az alatta lévő tartalom nem ugrik;
- `prefers-reduced-motion` esetén minden bevezető és váltóanimáció kikapcsol;
- a karakteroldal képkerete a self-réteg zsálya színét használja, az SVG külön
  krém vászna nélkül, így nem jelenik meg idegen fehér kártya a sötét heróban.
