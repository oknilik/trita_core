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
