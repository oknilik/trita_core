# 2026-09-09 — Árak: közvetlenebb kalkulátor-szövegek, egységes ár-szekció

- **Kalkulátor-szövegek átírva közvetlen mondatokra**, a körülírások helyett
  konkrét ármagyarázattal (`pricing.*` kulcsok, HU + EN):
  - cím és bevezető: „Mennyibe kerül a csapatotoknak?" + csomagválasztás,
    létszám, teljes díj és egy főre jutó ár; több csapatnál is az összes
    résztvevő alapján számolunk;
  - csomag-leírások: „Felmérések, riportok és az eredmények közös
    átbeszélése online" / „A Csapatkép minden eleme, személyes workshoppal
    és hat hónappal későbbi újraméréssel";
  - létszámválasztó: „Hányan vesztek részt?"; a csúszka alatti magyarázat a
    díjkártya számaival: az első {band} résztvevő fejenkénti díja, a
    {band+1}. résztvevőtől a további fők díja (`headcountNote`, új `first`
    és `next` változó);
  - csomagtartalom címe: „Mit tartalmaz a {tier}?";
  - **a nagy szám címkét kapott**: „Egy főre jutó ár", a sáv felett „Egy főre
    jutó átlagár" (`perHeadLabel` / `perHeadAverageLabel`), hogy ne
    keveredjen a további résztvevők kedvezményes díjával;
  - **a csapatszám-sáv („1–2 csapat") kikerült** — korlátozónak hatott;
    helyette egy mondat: a résztvevők több csapatból is érkezhetnek, minden
    csapat külön csapatképet és saját eredménymegbeszélést kap. Az
    `estimateTeamRange` helper és tesztje törölve;
  - fizetés: „A program díja akár több részletben is fizethető." (a
    kalkulátorban és a GYIK-ben is; a korábbi „egy összegben, a program
    indulásakor" ellentmondott volna);
  - gomb: „Beszéljünk a csapatotokról"; alatta: „Egy munkanapon belül
    válaszolunk. Az egyeztetés után írásos ajánlatot küldünk.";
  - pilot: „Pilotpartnerként – az első {total} csapat egyikeként – a
    Csapatprogram fenti díjából {pct}% kedvezményt kaptok." — kiderül, hogy a
    kijelzett ár NEM tartalmazza a kedvezményt, és melyik csomagra érvényes;
  - záró szekció címe: „Az egyeztetés után a kalkulált díjat írásos
    ajánlatban is megerősítjük." az „ugyanezt kapjátok írásban" helyett.
- **/team-dynamics ár-szekció**: a cím és a bevezető az /pricing fejlécével
  azonos („Létszám alapú, átlátható árazási struktúra." + az ingyenes egyéni
  szint és a létszám-alap).

## Csomagtartalom és összehasonlító tábla (ugyanaznap)

- **„szint" → „csomag"** az Árak oldalon végig (csomagválasztó címke, GYIK).
- **A tábla címe és bevezetője**: „Mit tartalmaz a két csomag?" + egy mondat
  a két csomag különbségéről (`compareLead`).
- **A négy mérést összezsúfoló sor négy külön sorra bomlott**, mindegyik a
  saját megnevezésével (`tier_kep_item2..5`); az „observer-visszajelzés"
  helyett kimondjuk, KI ad visszajelzést és MIRŐL (a résztvevő kollégái és
  ismerősei, ugyanarról a személyiségfelmérésről — az observer flow szerint),
  a „bizalmi kör" helyett pedig azt, hogy ki kihez fordul és kivel lehet
  nyíltan beszélni (a trust-kérdések szerint).
- **A workshop-sor megmondja, mivel ad többet** a 90 perces megbeszélésnél:
  megnevezzük a legfontosabb erősséget és feszültségpontot, és a csapat
  megállapodik az első lépésben (a program leírásával egyezően).
- **Az ár két külön sor lett**: „Az első {band} résztvevő díja, fejenként" és
  „Minden további résztvevő díja a {band+1}. főtől" (`comparePriceRowOver`).
  A korábbi „{band} fő felett …" jegyzet úgy is olvasható volt, mintha
  onnantól mindenkire a kedvezményes díj vonatkozna.
- **Alsó három kártya**: az egész napos workshop díja „/ alkalom" egységgel és
  a tisztázással, hogy önálló alkalom teljes díja, csapatonként, a csomagban
  lévő félnapos workshopon felül; a több csapat kártyáról lekerült a
  „létszám szerint" kiemelés (a szöveg magában érthető) és az 5–8 csapatos
  példa; az egyéni próba kártya azt ígéri, amit ad: saját eredmények.
- Az admin/PDF `QUOTE_TIER_INCLUDES` a publikus listát tükrözi.

## Csúszka, időigény, záró CTA és PR-átnézés (ugyanaznap, második kör)

- **A létszám-csúszka skálája elcsúszott**: a feliratok egyenletesen
  oszlottak el (`justify-between`), a skála viszont 5-től 41-ig megy, így a
  „10" felirat kb. 14 fő fölé esett. A feliratok és a sáv kitöltése mostantól
  a fogantyú tényleges középpontjához igazodik
  (`calc(13px + (100% − 26px) × arány)`, `--pct` helyett `--pos`); a Firefox-
  fogantyú is 26 px, hogy ugyanaz a korrekció érvényes legyen. Mérve: 10 főnél
  a fogantyú középpontja és a „10" felirat középpontja ugyanaz a pixel.
- **Időigény ~10 perc → ~30 perc / fő** mindkét csomagnál és a GYIK-ben: a
  csapatcsomagban a személyiségfelmérés mellett a csapatszerep-, bizalmi és
  pszichológiai biztonság kérdőív is megy.
- **Kiegészítő kártyák**: az „Ezen felül" eyebrow lekerült; a workshop-kártya
  címe „További személyes workshop", és a szöveg már nem köti csapatonkénti
  alkalomhoz (több csapat is részt vehet rajta).
- **Záró CTA gomb-oszlopa**: a „Egyeztessünk a csapatotokról" felirat 960 px
  alatt kettétört. A gomb-oszlop csak `lg`-től kerül a szöveg mellé,
  `shrink-0` + `whitespace-nowrap` — 430–1440 px között egy sor.
- **Angol szövegek**: a tábla „a {band+1}. főtől" sora angolul a sávra
  hivatkozik („after the first {band}"), mert a sorszám ragozása nyelvenként
  csúszna; a /pilot ténysáv euró-jelzése a komponensből jön (mint az
  ár-horgonyon), nem a lefordított mondatba építve.
- **Átnézés nyomán**: a pipa/gondolatjel cella felolvasva is érthető
  (`compareIncluded` / `compareExcluded`) a „✓"/„–" karakter helyett; halott
  behelyettesítések (`pageLead` `{band}`, `belowWorkshopBody` `{fee}`)
  kivezetve; a csak tesztekben élő `formatHuf` helyett a pénzformázás egyetlen
  forrása az `fx.ts`; elavult kommentek (`/how-we-work`, `--pct`, csillagos
  lábjegyzet) frissítve.
- **Mobil**: a kalkulátor csomagválasztója két hasábban volt; 640 px alatt a
  „Csapatprogram" szó (Fraunces 20 px) szélesebb, mint a hasáb, ezért kilógott
  a kártyából. A két gomb `sm` alatt egymás alá kerül (`min-w-0` a hasáb-alsó
  határ miatt). Ellenőrizve 360/390/430/640/768/1024/1280 px-en: nincs sem
  gomb-, sem oldalszintű vízszintes túlcsordulás (a tábla a saját görgethető
  régióján belül marad).
- **Mobil sorrend**: a kalkulátor három rács-blokkra bomlott (beállítás ·
  ár · tartalom). Mobilon a sorrend beállítás → ár → tartalom, hogy a
  csúszka eredménye görgetés nélkül látszódjon; korábban a hosszú
  tartalom-lista kitolta az árat a képernyőről. `md`-től a rácsban változatlan
  a kép: bal hasáb beállítás + tartalom, jobb hasáb az ár, két sort átfogva.
- **Az összehasonlító táblából kikerült a két ár-sor**: az árat a fölötte
  lévő kalkulátor és a hero-csempék mondják, a tábla a tartalomról szól.
  A `comparePriceRow` / `comparePriceRowOver` kulcsok törölve.
- **„További fők" → „További résztvevők"** a kalkulátor ár-bontásában; az
  első sor marad „Első {band} fő" (egyes számban természetes), angolul
  mindkettő „participants".

## Review-javítások (ugyanaznap, harmadik kör)

- **[P1] A korábban kiadott dokumentumok újra megnyithatók.** Az új
  ajánlat-séma miatt a 2026-09-07 előtti pillanatképeket a rendszer
  elutasította: a PDF-letöltés és a „kiküldve/aláírva” állapotváltás is
  hibára futott. A pillanatkép mostantól **verziózva olvasható**
  (`readCommercialDocumentSnapshot`): a mentett ÁRAT sosem számoljuk újra, a
  bemenetet a mai alakra fordítjuk, az EREDETI tételeket pedig a
  `legacyScope` viszi tovább — a régi ajánlat PDF-je ugyanazt a mérési kört,
  workshop-napot és visszamérés-számot mutatja, mint kiküldéskor. Új
  dokumentum `schemaVersion: 2`-vel készül. Unit tesztek: régi pillanatkép
  megnyitása, az összeg és a tételek megőrzése.
- **[P2] Több csapatnál reális az óra-becslés.** A szint alkalmai
  (online eredménymegbeszélés, félnapos workshop, utánkövetés) csapatonként
  ismétlődnek — a publikus szöveg is így ígéri —, de a becslés egyszer
  számolta őket. 35 fő / 5 csapat: 32 óra helyett 72; az effektív óradíj és
  a `floorPrice` így már a valóságot mutatja, és a `BELOW_TARGET_HOURLY`
  figyelmeztetés is megjelenik. Az ÁR változatlanul a létszámtól függ.
- **[P2] A pilotkedvezmény a helyes árra utal.** A Csapatkép mellett nem
  hivatkozunk a „fenti díjra”: ott a `pilotNoteOtherTier` mondja, hogy a
  kedvezmény a Csapatprogramra érvényes.
- **[P2] Az időigény a csomag teljes tartalmát mondja.** A Csapatprogramból
  eddig kimaradt a 90 perces online megbeszélés és az újramérés. A sor
  mondat hosszúságú lett, ezért saját, balra zárt blokkba került a jobbra
  zárt szám-oszlop helyett.
- **Szöveg**: a `{max}` fő feletti egyedi ajánlat magyarázata rövidebb (a
  csapatok számához és a tervezett alkalmakhoz igazított ajánlat); a workshop
  záró fordulata „közösen kiválasztjuk az első lépést”.
- **Guardok**: a publikus és az admin/PDF tartalom-lista együtt mozgását
  teszt védi; a GYIK sáv feletti díja a két csomag közül a magasabbat mondja,
  ha valaha eltérnének.
- **Menüpont: „Árak" → „Árazás"** (fejléc, lábléc, oldal-eyebrow, morzsa).
  Az oldal nem árlista, hanem a létszám-alapú árazási szerkezet; az angol
  „Pricing" eleve ezt mondta. Az ikon a menüpont maradék „Együttműködés"-
  jelképéből (két metsző kör) árcédulára cserélve.
