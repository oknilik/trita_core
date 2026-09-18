# Csapatriport: olvasói nézet és PDF

2026-09-17. A jóváhagyott koncepció implementációja a Team Operating Style branchen.

## Ügyfélkérdések és sorrend

1. Hogyan dolgozunk együtt? Viselkedési beszámolók, négy kétpólusú sáv, érvényes válaszok száma.
2. Miből építkezik a csapat? Külön személyiség-összetétel, négy tengely és a meglévő mintázat.
3. Mit jelent együtt a két kép? A meglévő 16×16 összevetés kérdései. Minden elérhető nézőpont megmarad; a weben az első nyitott, a többi kibontható. Ez nem fontossági rangsor.
4. Mit viszünk tovább? Teljes tanácsadói értelmezés és egy következő lépés.

A két mérés pontozása, adatforrása, publikálási kapui és anonimitási szabályai nem módosulnak. A középérték nem rugalmasságcímke, az eltérő tengelyenkénti válaszadói kör továbbra is megakadályozza a teljes működési mintázat megadását. A két rétegnek nincs közös illeszkedési százaléka.

## Web

A vezetői/tanácsadói riport három nézete:

- **Csapatkép:** egy egységes olvasási felület, működés → összetétel → összevetés → tanácsadói értelmezés → következő lépés. A nagy KPI-sáv, a külön 3×3 összefoglaló és az ismételt 30/60/90-es akciólista kikerül. A tanácsadói kockázatokat nem csonkítjuk három elemre. A mért alacsony pszichológiai biztonság és a mért bizalmi körben jelzett gyenge beágyazottság külön kiemelést kap.
- **Mérési háttér:** táblázatos átlagok, mintaszórás, létszám, pólusgyakoriságok és lefedettség; az eredeti részletes modulok külön komponensben megmaradnak. Hiányzó moduloknak nincs üres kártyájuk. Az önkép/külső kép elérhető aggregátuma is bekerül.
- **Utánkövetés:** a már létező akciók, leírások, felelősök, határidők, státuszok és célmutatók. Ugyanaz a mentési végpont és jogosultság. A nézetváltás nem veszíti el a még nem mentett szerkesztést. A vázlat akciói itt nem szerkeszthetők.

A tablista ARIA-kapcsolatokkal, nyílbillentyűkkel, Home/End és látható fókuszjelzéssel működik. A tagi nézet a közös, átrajzolt működés/összetétel/összevetés komponenst kapja, a meglévő szűkebb hozzáférési metszete megmarad.

A következő lépés meglévő, még nem kész akcióból származik. Ha nincs ilyen és minden akció kész, visszatekintést javasol. Akcióadat nélkül kifejezetten javasolt műhelylépést mutat, felelős és dátum kitalálása nélkül; ez nem kerül adatbázisba. A látványterv illusztratív vállalásai nem kerültek a termékbe.

## PDF

Nincs külön üres borító. Az eredmények rögtön az első oldalon látszanak. A működési sávok és az összetételi sávok vektorosan rajzolódnak. Ezt az összevetés, a tanácsadói fókuszok és a tényleges akciók követik. A számok és módszertan külön mellékletben szerepelnek.

A PDF a rögzített riport adatait használja, nem élő adatbázist. A kapcsolati kiemelések nevei, az egyéni válaszok és a belső tanácsadói jegyzetek továbbra sem kerülnek ki. A pszichológiai biztonság szórása nem jelenik meg számszerűen. A fordított biztonság-itemek normalizált eredménye területnévvel és a skálairány jelzésével látszik. A hosszú tanácsadói próza és akcióleírás tovább tördelhető.

Az eltérő válaszadói körű, akció nélküli példában három oldal készül: csapatkép, közös értelmezés és jegyzetlap, mérési háttér. A több további modult és akciókat tartalmazó füstteszt ötoldalas. Az oldalszám a tartalomtól függ. A jegyzetlap nyomtatható munkalap, nem interaktív PDF-űrlap.

## Designnyelv és inspiráció

Meglévő trita tokenek, krém/fehér felületek, zsálya és bronz hangsúlyok, Fraunces címek, az alkalmazás alapbetűje és a PDF DM Sans családja. Rövid bekezdések, következetes fejezetközök, kevesebb egymásba ágyazott kártya. Új paletta vagy ikonrendszer nem került be.

Az előzetes, nyilvános termékanyagokra támaszkodó kutatásból átvett szerkezeti elvek, nem lemásolt kérdések/skálák:

- [PI Team Discovery](https://www.predictiveindex.com/learn/support/teams-and-team-discovery/): a csapatképet munkahelyzeti kérdésekhez kapcsolni.
- [TeamDynamics](https://www.teamdynamics.io/resources/teamdynamics-team-personality-test-sample): közös nyelv és használható normák.
- [The Five Behaviors mintariport](https://www.fivebehaviors.com/FiveBehaviors/media/SiteFiles/assets/Team-Development-Sample-Profile_DiSC.pdf): eredmény → megbeszélés → cselekvés; részletek a mellékletben.
- [Atlassian Team Health Monitor](https://www.atlassian.com/team-playbook/health-monitor): kevés fókusz, felelős és visszatérés a vállalásokhoz.

Ezek designkövetkeztetések, nem ügyfélteszttel igazolt UX-eredmények.

## Kipróbálás

A branch Vercel előnézetében, bejelentkezés után: **Csapat → Riport → publikált riport vagy vázlat-előnézet**. A megjelenéshez nem kell visszavonni és újrapublikálni a riportot. A korábban lefagyasztott snapshot adathiányát ez az átrendezés nem tölti ki.

1. Csapatkép: működés, összetétel és összevetés egymás után; 4/5 és 5/5 tengelylétszámok és a tiltott közös besorolás oka látható.
2. Mérési háttér: a négy átlag/szórás és a válaszadói kör ellenőrizhető.
3. Utánkövetés: meglévő akció leírása látszik; jogosult vezető a felelőst/dátumot/státuszt mentheti. Nézetváltás szerkesztés közben nem törli a bevitelt.
4. PDF: nyelvváltás után is letölthető, nincs borító vagy üres folytatóoldal; a statisztikák a mellékletben vannak.

Automatikus ellenőrzés: RTL nézetváltás/mentés/jogosultság/adatkorlát, tényleges HU/EN PDF-render és hosszú szöveg tördelése, releváns személyiség-összetétel és összevetés regressziók, TypeScript és ESLint. Vizuális ellenőrzés: renderelt PDF-oldalak. Bejelentkezett böngészős E2E nem futott: a helyi Chromium letöltése hálózati időtúllépéssel meghiúsult.

Új migráció nem szükséges ehhez a megjelenítési változáshoz. A teljes korábbi Operating Style-integráció migrációigénye változatlan. Main merge nincs; a munka a draft PR része.

## Működési térkép és rétegzett riport — 2026-09-17

- Új publikus `/operating-patterns` aloldal: négy család, 16 kiválasztható minta, saját név/kód, leírás és pólusok. A családok az információ + koordináció tengelyeiből képződnek. Az aloldalon nincs workshopkérdés. `?pattern=IEDA&lang=hu` mélylink támogatott; a nyelv egyébként a közös LocaleProviderből jön.
- Közös HU/EN katalógus: `src/lib/team-operating-style/catalogue.ts`. A belső bináris kulcsok, kérdések, küszöbök és a fagyasztott mérések változatlanok; a már tárolt mintakódokhoz is a katalógus aktuális megnevezése jelenik meg.
- Riport belépő: mért működési minta, geometrikus jel, négybetűs kód és aloldali mélylink. Ideiglenes besorolásnál nem jelenik meg a kategorikus katalógusleírás. Minden tengely megőrzi az átlagot, az értékelhető létszámot és az összes bizonytalansági jelzést. Teljesen középközeli vagy nem besorolható eredményhez nincs kiemelt típuskód.
- Sorrend: működés → aggregált HEXACO (csapatátlag és ahol elérhető, mintaszórás) → a személyiségből képzett négy tengely → meglévő, adatokhoz igazodó 16×16 összevetés. A hatdimenziós adat és a négytengelyes snapshot hiánya külön kezelt; hiányzó értékből nincs nullapont vagy visszabecsült profil.
- A származtatott tengelyek választása kiemeli a HEXACO-forrásokat: Hajtóerő=X, Kohéziós proxy=tagonként (H+A)/2 majd csapatátlag, Fegyelem=C, Nyitottság=O. Az E nem része ennek a képzésnek. Nem illeszkedési pontszám és nem közvetlen kohéziómérés.
- A Csapatkép / Mérési háttér / Utánkövetés fülek, a tanácsadói szövegek, figyelmeztetések és menthető akciók megmaradnak. A tagi nézet ugyanezt az aggregált blokkot kapja, egyéni adatok nélkül.
- A PDF azonos katalógusneveket/kódokat és rétegsorrendet használ. Az aggregált és származtatott személyiség külön oldalon együtt marad, a pontos statisztikák mellékletben elérhetők.

Ellenőrzés: 37 kliens/PDF-teszt, 30 kapcsolódó unit teszt; TypeScript és ESLint. Tényleges Next.js oldalak és riportkomponensek HU/EN böngészős próbája, 1280/390/320 px; minta- és riportfülváltás, személyiségforrás-kiemelés. Szintetikus helyi riportelőnézet, nem bejelentkezett adatbázisos E2E. HU/EN PDF-render, üresoldal-tesztek és oldalképek ellenőrzése. Nincs új migráció.
