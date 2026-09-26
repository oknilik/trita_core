# Magyar nyelvi lektorálás – 2026. szeptember 26.

## Cél és módszer

A felület és a riportok természetes magyar mondatokkal, szakmailag pontosan,
közvetlen és kedves hangon szóljanak az olvasóhoz. A munka a helyesírás mellett
a szórendre, a vonzatokra, az utalásokra és az angolból átvett mondatlogikára
is kiterjedt.

Három párhuzamos lektorálási kör készült: marketing és blog, személyes
riportok, illetve szervezeti és csapatriportok. A központi kör a fennmaradó
felületeket, leveleket, közös terminológiát és a megjelenítést ellenőrizte.
A kereshető szövegkészlet feltérképezését forrásolvasás, a dinamikus mondatok
vizsgálata, meglévő tesztek és renderelt minták ellenőrzése egészítette ki.

A folytatáshoz használható szabályok és a magyar nyelvi források a
[magyar stílusútmutatóban](hungarian-style-guide.md) találhatók. A
[blogstíluskalauz](blog-style-guide.md) is ehhez igazodik.

## Lefedettség

| Terület | Átnézett anyag |
| --- | --- |
| Marketing | Főoldal, csapatoldal, árak, pilot, GYIK, bemutatkozás, kapcsolat, hírlevél, SEO-leírások, mintázatfelfedezők |
| Blog | Mind a 9 magyar cikk, a piszkozatokkal, beágyazott ábrákkal és mintalevéllel együtt |
| Személyes riport | Dimenziók, alskálák, összefoglalók, munkastílus, fejlődés, szerepilleszkedés, érdeklődés, ismerősi visszajelzés és páros összehasonlítás |
| Céges riport | Csapatösszetétel, csapatműködés, bizalom, pszichológiai biztonság, csapatszerepek, riportolvasó, szerkesztő, workshopnézet, összehasonlítás és visszamérés |
| Szervezeti folyamat | Vezetői és tanácsadói felület, mérési programok, jelöltfelmérés, meghívások, tagok és hozzáférés kezelése |
| Kérdőív körüli szöveg | Bevezetők, útmutatók, haladás, mentés, hibák, kiértékelés és lezárás |
| Közös felület | Navigáció, belépés, regisztráció, profilkezelés, súgó, értesítések, üres állapotok és hibák |
| Adminisztráció | CRM, ajánlatkészítő, kereskedelmi dokumentumok, blog- és hírlevélszerkesztő, statisztikák, emlékeztetők |
| Levelek | Az alkalmazás magyar levélsablonjai, a HTML- és az egyszerű szöveges változattal együtt |
| Jogi oldalak | Platformfeltételek, B2B feltételek, adatfeldolgozási megállapodás és adatkezelési tájékoztató nyelvi lektorálása |

A karrierhez tartozó TypeScript-szövegek és a parkolt felületek rövid feliratai
is szerepeltek az átnézésben. A jelenleg nem elérhető karrierfelület nagy
foglalkozási JSON-katalógusa nem kapott tételes szerkesztést. A felhasználók
által megadott neveket és üzeneteket nem írtuk át. Az adatbázisban tárolt
szabad szövegekhez, például a mentett tanácsadói narratívákhoz és szerkesztett
hírlevélszámokhoz nem készült tartalommigráció.

## Jellemző javítások

| Korábbi szöveg | Javított szöveg |
| --- | --- |
| „Hogyan fordítsd ezt működésre?” | „Hogyan hasznosíthatod a gyakorlatban?” |
| „Kinyílt a következő lépésed” | „Elérhető a következő feladatod” |
| „Nincs szervezet linkelve” | „Nincs szervezet az ügyhöz kapcsolva” |
| „tanácsadó által validált riport” | „tanácsadó által ellenőrzött riport” |
| „Már majdnem kész vagy a teszttel” | „Folytasd a megkezdett tesztet” – a levél a tényleges válaszszámot közli |
| „Elkészült a Termék csapat csapat riportja” | „Elkészült a csapatriport: Termék csapat” |

Az „observer”, „pulse”, „insight”, „scope” és más belső kifejezések helyére
a konkrét feladatot vagy tartalmat leíró magyar szöveg került. Az „e-mail”,
„e-mail-cím”, a szóösszetételek és az idézőjelek írásmódja egységesebb lett.
A felhasználó által megadott nevekhez és a formázott dátumokhoz több helyen
elmaradt a bizonytalan toldalékolás.

A csomagtartalom leírását a díjkártyához igazítottuk. A bevezetési mintalevél
pontosabban nevezi meg a tanácsadói hozzáférést. A csapat- és szervezeti
meghívó leírja, hogy a regisztrációt a csatlakozás megerősítése követi.
E tartalmi pontosítások angol párja is frissült; általános angol lektorálás
nem történt.

## Mérési tételek és külön szakmai döntések

A kérdőív állításának átírása megváltoztathatja, mire válaszol a kitöltő.
Ezért a mért dimenziók nevei, a pontozás, a küszöbök és a kérdőívtételek
változatlanok. Az alábbi megfogalmazások a következő kérdőív-adaptációban
érdemelnek külön vizsgálatot; nem elfogadott új tételek:

| Hely | Nyelvi észrevétel |
| --- | --- |
| `questions/tritan.ts`, 57. tétel | A „Mindenkiről van egy jó szavam” vonzata szokatlan. A „mindenkihez” és a „mindenkiről tudok jót mondani” más viselkedést is jelenthet. |
| `questions/riasec.ts`, 26. tétel | A „Táblázatokat építenék” helyett természetesebb lehet a „Táblázatokat készítenék”; a tételváltozatot az adaptáció részeként érdemes rögzíteni. |
| `team-role-questions.ts`, KO3 | Az „elő tudom hívni a hozzájárulásukat” körülírása pontosítást igényel. |
| `team-role-questions.ts`, ER3 | A „mielőtt drágák lennének” nem nevezi meg világosan a hibák várható költségét. |
| `team-role-questions.ts`, SZ1 | A „Mély szaktudást hozok” angolos; a szaktudás és annak csapatbeli használata eltérő állítás lehet. |
| `team-operating-style/questions.ts`, EXE3 | A „munkalépést … ütemezésből vettük” helyett természetesebb mondat kell, az előzetes tervezésre vonatkozó jelentés megőrzésével. |

További tartalmi kérdések külön döntést igényelnek:

- A személyiségteszt rövid leírása „validált személyiségteszt (IPIP-itemek)”
  megfogalmazást használ. A magyar tételkészlet validáltsága szakmai állítás;
  a nyelvi lektorálás nem igazolta és nem módosította.
- A platformfeltételek 18 éves alsó korhatárt írnak, az adatkezelési
  tájékoztató 16 éves korhatárt említ. Ezt nem lehet pusztán nyelvi
  szerkesztéssel eldönteni. A mostani javítás a korhatárokat és a többi jogi
  kötelezettséget, határidőt, összeget, valamint a dokumentumverziókat megőrzi.
- A B2B feltételek „munkanapon 24 órán belül” vállalásánál tisztázandó,
  hogyan számít a hétvége és a munkaszüneti nap. Az adatfeldolgozói melléklet
  meglévő „ellenőrzendő” megjegyzései szolgáltatói szerződések és beállítások
  ellenőrzését kérik; ezeket nem lehetett pusztán jobb mondatokkal lezárni.
- Az adatkezelési tájékoztató egy kivonatolt adatot anonimizáltnak is nevez.
  E technikai állítás helyességét a nyelvi lektorálás nem igazolja.

## Mi történik a korábban készült riportokkal?

- A személyes eredmény, a megosztott profil és a páros elemzés az eltárolt
  pontszámokból, megnyitáskor állítja össze a szöveget. Élesítés és frissítés
  után a korábbi kitöltésekhez is az új megfogalmazások jelennek meg.
- Az új PDF-export az aktuális szövegkészletet használja. A régen letöltött
  PDF-fájlok változatlanok maradnak.
- A csapatriport feliratai frissülnek. A mentett tanácsadói összefoglalók
  külön adatbázismezők; azokat a sablonjavítás nem írja felül. Új riport
  előkitöltésekor már az új sablonszöveg kerül a szerkesztőbe.
- A jelenlegi kódban nincs aktív magyar AI-riportgenerátor. A meglévő LLM-végpont
  magyar csapatriporthoz készít angol fordítási javaslatot. A `package.json`
  előgenerálási és kimenetellenőrzési parancsai hiányzó scriptekre hivatkoznak;
  ez külön technikai adósság.
- A régi Start PDF-ben maradt „Plus · €9” ajánlat jelenleg csak tesztmintából
  vagy a persona CLI-ből állítható elő. Az élő személyes export teljes
  hozzáféréssel, Plus nézetben készül (`SELF_PAYWALL_ENABLED=false`). A régi
  ágat nem kapcsoltuk vissza, és az árazást nem módosítottuk.

## Ellenőrzés

A futtatott ellenőrzések eredménye és a PDF-megjelenítési javítás a
[változásnaplóban](changelog/2026-09-26-magyar-lektoralas.md) található.
Az ellenőrző képek, PDF-ek és tesztnaplók helyi munkaanyagok; nem részei az
alkalmazáscsomagnak.
