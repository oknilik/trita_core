# Lumina-benchmark végrehajtás — 2026-08-16

Forrás: `docs/product/lumina-benchmark-strategia-2026-08.md`.

## P0.1 — mérési-hiba kapu

- A pszichometriai mag két független csapatátlag különbségének standard
  hibáját is számolja; érvénytelen mintán fail-closed működik.
- A riport-összehasonlító a dimenzióeltéréseket a résztvevőszám és a mért
  TSFI-S dimenzió-SEM alapján kapuzza.
- A pszichológiai biztonság változása ideiglenes, konzervatív reliabilitási
  priorral kapott kaput. A prior a pilotadatból újrabecsülendő.
- A felület csak a mérési hibán túli eltérést emeli változássá; a többit nem
  rangsorolja és halk összesítő jelzésben kezeli.
- Unit teszt védi a mintanagyság-invariánst és az önmagával összevetett riport
  nulla érdemi változását.

## P0.2 — kompozíció-kontroll és stabil mag

- A riport-pillanatkép tanácsadói, belső összehasonlítási alapot tárol:
  csapat-specifikus SHA-256 pszeudonim kulcsot és a hat befagyasztott
  dimenziópontot. Név, email, user ID és itemválasz nem kerül bele.
- A belső alap a szervezeti vezető/tag szerializációjából redaktálódik; csak a
  kontrollált tanácsadói felület kapja meg.
- Az összehasonlító számolja a közös, új és kimaradt kitöltőket. A kisebbik
  kör 70%-a és legalább 3 közös fő kell az értelmezhető stabil maghoz.
- Megfelelő átfedésnél a dimenziódeltát csak a mindkét körben jelen lévő
  tagokból számolja újra; gyenge vagy ismeretlen kompozíciónál fail-closed,
  explicit figyelmeztetéssel nem állít profilváltozást.

## P0.3 — self-eredmény kör-címkézése

- Az `AssessmentResult` opcionális, indexelt `campaignId` mezőt és
  `ON DELETE SET NULL` kapcsolatot kapott; a legacy és self-serve rekordok
  továbbra is érvényesek.
- A kampányból nyitott self-kérdőív URL-je hordozza a konkrét kör azonosítóját.
  A szerver ellenőrzi, hogy a user abban az aktív, nyitott lépésben áll-e.
- Egy beadás csak a címkézett kampányt lépteti; két átfedő kör nem záródhat le
  ugyanattól az eredménytől.
- A fresh-kör olvasói a pontos címkét részesítik előnyben. A dátumheurisztika
  csak a migráció előtti, címke nélküli rekordok kompatibilitási fallbackje.
- A csapatadat- és riportépítő opcionális kampányszűrőt kapott; alapértelmezése
  változatlanul tagonként a legfrissebb self-eredmény.

## P1.1 — a változékony rétegek visszamérése

- Az összehasonlító a pszichológiai biztonság indexe mellett itemenként is
  visszamér. Narratívába csak a konzervatív, dokumentált item-szórás priorból
  képzett mérési kapun túli elmozdulás kerül.
- A befagyasztott riportokból összevethető a mért bizalmi háló lefedettsége,
  él-, hub- és beágyazatlan-tag száma; a háló-pillanatkép akkor sem vész el,
  ha éppen nincs hub vagy beágyazatlan találat.
- A csapatszerep-lefedettség, a megszűnt/új szerephézagok, valamint az
  önkép–peer szerepkép eltérése külön visszamérési réteget kapott.
- A riport-pillanatkép anonimitási padló felett tárolja a személyen belüli
  önkép–observer összhang aggregátumát. Kör-szűrt riportnál az observer-adat
  is ugyanarra a kampányra szűrhető.
- A HEXACO-delta a felületen már mérési kontroll, nem fejlődési mutató. Az
  összetétel-változás a relációs/szerepeltéréseket is leíró kontextussá
  fokozza vissza, és az oksági korlátot a felület kimondja.

## P1.2 — akció → kimenet kapcsolat

- Az akcióelem opcionális, strukturált `targetMetric` mezőt kapott. Választható
  cél a pulse-index vagy konkrét pulse-item, a bizalmi háló lefedettsége vagy
  beágyazatlansága, illetve egy konkrét csapatszerep-hézag.
- A tanácsadói riport-szerkesztő célmutató-választót ad; az akciókövető a
  hozzárendelt célt a vezetőnek is megmutatja. A régi akciók cél nélkül
  változatlanul olvashatók.
- A generált pulse-akciók automatikusan a gyenge itemre, a mért bizalmi kör
  adatgyűjtési akciója a hálólefedettségre mutat.
- A következő riport összehasonlítója táblában kapcsolja össze az előző kör
  vállalását, státuszát, célmutatóját és mért kimenetét.
- Pulse-célnál a P0.1 mérési kapu dönti el, védhető-e az elmozdulás.
  Relációs célhoz kalibrált hiba híján a rendszer nem gyárt hamis
  „szignifikáns” címkét; kategorikus szerephézagnál az állapotváltást jelzi.

## P1.3 — rögzített Scan v1 mérési készlet

- A kampány-létrehozó alapértelmezett, nevesített `SCAN_V1` csomagot kínál;
  a szerver oldja fel a rögzített lépés-sort, ezért a kliens nem módosíthatja
  észrevétlenül a pilot mérési készletét.
- A kódban korábban az `OBSERVER_360` összekötötte a self kérdőívet és a
  külső értékelőket. Külön `SELF_ASSESSMENT` kampánylépés készült, így a
  Scan v1 ténylegesen csak self + bizalmi háló + pszichológiai biztonság.
- Az observer, a csapatszerep-self/peer és az elismerés-kör az egyedi,
  haladó összeállításban maradt a második körök és kiegészítők számára.
- A self és observer lépés együtt nem választható: az observer eleve
  tartalmaz selfet, ezért a szerver és mindkét szerkesztő kiszűri a
  duplikációt.
- Az új self-lépés végigkapta az explicit kampánylinket, kör-címkézett
  beadást, fresh-fast-forwardot, értesítést, feladat- és riporthaladást.

## P2.1 — norma- és mintázatígéret kalibrálása

- A 16 minta kódban rögzített módszertani státusza „értelmezési nyelv”;
  nem validált tipológia. A publikus felfedező, SEO/LLM leírások és a
  csapatriportok ugyanezt a keretezést használják.
- A pilot- és főoldali ígéret a mért bizalmi hálót, pszichológiai
  biztonságot, célzott akciót és kapuzott visszamérést teszi előre. A
  mintanév többé nem a diagnosztika bizonyítékaként szerepel.
- Külön kutatási protokoll választja szét az egyéni norma `n≈200–500`
  és a 16-as csapatminta `n≈15–20 csapat` elemzési egységét.
- A norma-script csak pontos kampánycímkékkel scope-olt, `short` formás,
  forrásleírással ellátott, legalább 200 fős kohorsznál ad ki
  `ACTIVE_NORM_TABLE`-jelöltet. Minden más futás leíró kalibráció és
  fail-closed módon felsorolja az aktiválási blokkolókat.

## P2.2 — aktív portfólió-parkolás

- A parkolás előtti teljes állapot annotált git taget kapott:
  `portfolio-v1-pre-parking-2026-08-16` (`b7d78cb2`).
- Egy kliensbiztos központi állapottábla kapuzza a karrier-, hiring-, CRM-,
  blog-, fakedoor-, pattern explorer- és publikus share felületet.
- A parkolt oldalak és API-k mélylinkről sem élnek; eltűntek a workspace,
  marketing, admin, org-, eredmény- és riportfelületi belépők.
- A blog és a mintafelfedező nem marad a sitemapben, robots allow-listában
  vagy `llms.txt`-ben. A parkolt hiring/CRM értesítések nem növelik a látható
  olvasatlan számlálót.
- A CRM napi sweepje és inquiry auto-attach folyamata szünetel; az inquiry
  továbbra is rögzül, és a működő admin Kérdések fülre mutat.
- Sem kód, sem adat nem törlődött. A felületenkénti visszaállítás pontos
  lépéseit a `docs/product/portfolio-parking-2026-08.md` checklistje rögzíti.
