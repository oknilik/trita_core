# Segítség widget – tartalmi és UX/UI audit

Dátum: 2026-09-03
Vizsgált ág: `codex/help-tab-review-20260903` (lokális `main`: `fbb025c6`)

## Rövid értékelés

A widget jó alap: kétnyelvű, szerepkör szerint szűrt, tömör válaszokat ad, a fontos válaszokból közvetlenül a megfelelő felületre visz, és mindig kínál emberi segítséget. A jelenlegi megoldás azonban inkább háromszintű statikus menü, mint valódi segítségi felület. A tartalom néhány helyen lemaradt a termék jelenlegi információs architektúrájától, és az engedélymodell sem írható le elég pontosan a négy jelenlegi `HelpAudience` értékkel.

## Ami ma jól működik

- A `public`, `member`, `manager`, `admin` szűrés nem enged üres témát vagy más célcsoportnak szánt bejegyzést a nézetbe.
- A magyar és angol szöveg minden bejegyzésben együtt, egy forrásban él.
- A válaszok rövidek, közérthetők, és ahol van valódi következő lépés, CTA-linket adnak.
- Bejelentkezve helyben küldhető kérdés az inquiry pipeline-ba; publikus nézetből a kapcsolat oldal a kiút.
- A marketing oldalon lustán töltődik be, fókuszált kitöltési útvonalakon pedig nem zavarja a felhasználót.

## Tartalmi relevancia – javítandó pontok

### P0 – jogosultság és ígéret nincs összhangban

Az `org-admin` válasz azt állítja, hogy a szervezeti vezérlőn elérhetők a kampányok. A szervezetoldal forrása szerint a Kampányok/Mérések fül csak tanácsadói nézetben jelenik meg; a help audience ugyanakkor az `ORG_ADMIN` szerepet automatikusan `admin` értékre képezi. Egy nem tanácsadó admin ezért olyan funkcióról kap útmutatást, amelyet nem feltétlenül ér el.

Javaslat: a tartalomszűrés ne csak szerepkört, hanem képességeket is kapjon (`canViewCampaigns`, `canInviteMembers`, `canLaunchCampaign`). Alternatívaként külön `consultant` audience szükséges.

### P1 – elavult vagy eltérő terminológia

- Az ismerősi visszajelzés útmutató „Meghívók fülről” beszél. A jelenlegi eredményoldalon három fül maradt; a meghívók a `Külső kép` fülön belül vannak.
- A vezetői tartalom „visszajelzés-kampányt” és „kampányok felületet” mond, miközben a jelenlegi UI következetesen `mérés` nyelvet használ.
- A publikus CTA `Árak és csomagok` feliratú, de a céloldal és a marketing szöveg szerint nincs dobozos csomag vagy listaár; a navigáció neve `Együttműködés`.

Javasolt csere:

- „Az Eredményeim oldal Külső kép fülén, a Meghívások résznél…”
- „Hogyan indítok új mérést?” / „A szervezet Mérések felületén…”
- `Árak és csomagok` helyett `Együttműködés és árazás`.

### P1 – hiányzó, nagy valószínűségű kérdések

- Miért nem látok még eredményt, és mi a következő lépés?
- Miért vár jóváhagyásra egy külső meghívás?
- Hogyan módosítom vagy törlöm a fiókomat?
- Mit jelent egy dimenzió, eltérés vagy becslés – és mit nem jelent?
- Hol tart az aktuális mérésem / mi vár rám most?
- Nem működik egy link, meghívó vagy beküldés – mit ellenőrizzek először?

Ezeket nem általános FAQ-ként érdemes előre tenni, hanem oldal- és állapotfüggő gyors válaszként.

## UX/UI audit

### Felfedezhetőség és navigáció

- A `?` ikon önmagában gyenge jelentésű. Desktopon a `Segítség` feliratú kompakt launcher egyértelműbb; mobilon maradhat az ikon hozzáférhető címkével.
- Nincs keresés, ezért admin nézetben 7 témán és 16 bejegyzésen keresztül csak háromszintű böngészéssel lehet eljutni egy válaszig.
- Minden listaelem azonos vizuális súlyú; nincs „Ezen az oldalon”, „Gyakori kérdések” vagy feladat-alapú prioritás.
- A válasz nézet végpont: egy CTA-n kívül nincs kapcsolódó kérdés vagy hasznossági visszajelzés.

### Akadálymentesség

- A panel vizuálisan dialógus, de nincs `role="dialog"`, `aria-modal`, stabil címke, fókuszcsapda vagy nyitáskori fókuszkezelés.
- Bezárás után nincs explicit fókusz-visszaadás a launcherre.
- Az Escape bezárja a teljes panelt; mélyebb nézetben a visszalépés természetesebb első művelet lehet, vagy ezt világosan dokumentálni kell.
- Mobilon a panel inkább lebegő kártya, nem valódi alsó lap; háttér és egyértelmű rétegződés nélkül könnyebben összemosódik az oldallal.

### Mérhetőség

Az eseménykatalógusban létezik `faq.open`, de a HelpWidget nem használja. Nem látható, mely keresések eredménytelenek, mely válaszok hasznosak, illetve melyik súgóút végződik emberi kérdéssel.

Javasolt minimális események:

- `help.open` – oldal, audience, belépési pont;
- `help.search` – csak normalizált eredménydarabszám, a nyers érzékeny kérdés nélkül;
- `help.answer_open` – entry id;
- `help.answer_feedback` – entry id + igen/nem;
- `help.contact_start` – entry id vagy `no_result`.

## Javasolt célélmény

1. Nyitáskor először az aktuális oldalhoz és felhasználói állapothoz kapcsolódó 2–3 gyors válasz jelenjen meg.
2. Egy keresőmező egyszerre keressen a kérdésben, válaszban és kulcsszavakban; gépelés közben frissítse a találatokat.
3. A témák maradjanak másodlagos böngészési útként, ikonokkal és rövid leírással.
4. A válasz legyen tagolt: rövid lényeg, lépések, elsődleges CTA, kapcsolódó kérdések.
5. Minden válasz alatt legyen „Hasznos volt?” visszajelzés, a panel alján pedig állandó, de halk emberi segítség.
6. Mobilon 100% széles alsó lap, desktopon 420–440 px-es oldalsó panel; közös tartalom- és fókuszmodell.

## Javasolt megvalósítási sorrend

1. Tartalmi drift javítása és capability-alapú szűrés.
2. Dialógus-szemantika, fókuszkezelés és mobil bottom sheet.
3. Aktuális oldalhoz kötött gyors válaszok és kliensoldali keresés.
4. Strukturált válasznézet, kapcsolódó kérdések, hasznossági feedback.
5. Analitika alapján a témák sorrendjének és a hiányzó tartalomnak a finomítása.

## Elfogadási kritériumok az első fejlesztési körhöz

- Egyetlen szerepkör sem kap olyan CTA-t vagy instrukciót, amelyhez nincs képessége.
- A `Külső kép`, `mérés` és `Együttműködés` terminológia egyezik az aktuális UI-val.
- Kereséssel legfeljebb két interakcióból elérhető bármely válasz.
- Billentyűzettel nyitható, bejárható és bezárható; a fókusz a launcherre tér vissza.
- 320 px szélességen nincs vízszintes túlcsordulás vagy levágott elsődleges művelet.
- Minden válaszmegnyitás és hasznossági visszajelzés mérhető, személyes szöveg naplózása nélkül.
