# Publikus árlétra — döntési dokumentum (2026-09-09)

> Állapot: **csapatalapdíj + létszámdíj, fejenkénti átlagár (v3)**.
> A számok forrása a díjkártya (`src/lib/quote/rate-card.ts`,
> `DEFAULT_RATE_CARD`), az élő érték az admin felületen mentett kártya
> (`/admin/quote` → Díjtételek). Ez a doksi az indoklást őrzi.

## 1. Mi változott

A teljes díj csapatalapdíjból és sávos létszámdíjból áll. A publikus felületek az egy főre jutó átlagárat emelik ki:

| Szint | Tartalom | Alapértelmezett ár (nettó) |
|---|---|---|
| **Csapatkép** | minden mérés (személyiség, csapatszerep, bizalmi kör, pszichológiai biztonság, observer), validált csapatriport, vezetői visszajelzés, 90 perces online közös értelmezés | **150 000 Ft/csapat + 20 000 Ft/fő** |
| **Csapatprogram** | Csapatkép + félnapos értelmező workshop + utánkövető mérés fél év múlva | **350 000 Ft/csapat + 30 000 Ft/fő az első 10 résztvevőre** |
| 10 fő feletti tagok | mindkét szinten | 20 000 Ft/fő |
| További egész napos, helyszíni workshop | | 260 000 Ft |
| Pilot-partneri kedvezmény (/pilot ténysáv) | a Csapatprogram árából | 50% |

Belső (nem publikus) tételek: további mérési kör (a fejenkénti díj 35%-a),
havi kísérés (150 000 Ft/hó), kiszállás (60 000 Ft/nap, továbbhárítva),
óra-becslés, cél-óradíj (25 000 Ft/óra), kedvezmény-keret (30%).

**Képlet:** csapatok száma × csapatalapdíj + min(összlétszám, 10) × létszámdíj
+ max(összlétszám − 10, 0) × sáv feletti díj. Nincs további csapatfelár.
A létszámsáv az összes résztvevőre együtt vonatkozik, nem csapatonként indul újra.
Minden csapat saját riportot és eredménymegbeszélést kap; a Csapatprogram workshopja
is csapatonként ismétlődik. A publikus és az admin kalkulátor ugyanabból számol.

Egy 5 fős csapat teljes díja 250 000 / 500 000 Ft; egy 10 fősé 350 000 / 650 000 Ft.
Két csapat, összesen 20 fő: 700 000 / 1 200 000 Ft.
A kiemelt statikus referenciaár egy 10 fős csapat átlaga: 35 000 / 65 000 Ft/fő + ÁFA.
A kalkulátor 3–40 fő között a kiválasztott létszám átlagát mutatja; a teljes díj és a bontás másodlagos.

**Elv:** a mérések száma nem növeli az árat. A több mérés több
magyarázatot igényel, ami a workshop-időben (a felső szintben és az
extra napokban) jön vissza — így az ügyfél szabadon választhat mérést,
az ár pedig egy mondatban elmondható.

## 2. Miért ez a nagyságrend

A korábbi (placeholder) díjkártya egy 10 fős, teljes mérést kérő csapatra
1,4 M Ft listaárat adott (140 e Ft/fő), 30%-os pilot-kedvezménnyel is
~1 M Ft-ot. Ez az UK/US practitioner-piac szintje, nem a magyar kkv-é.

Piaci viszonyítás (2026-09, nettó, hozzávetőleges Ft-átváltással —
1 £ ≈ 450, 1 $ ≈ 350, 1 € ≈ 400 Ft):

| Eszköz | Publikált ár / fő | kb. Ft / fő |
|---|---|---|
| Innermetrix DISC (HU) | 30 000 Ft | 30 000 (riport, konzultáció nélkül) |
| Belbin egyéni riport | £49 + VAT | 22 000 |
| Everything DiSC Workplace | $73–90 | 26–32 000 |
| Insights Discovery profil | £85–130 | 38–60 000 |
| Five Behaviors Team Profile | $171–210 | 60–75 000 |
| Lumina Spark portré + debrief | £285-től | 130 000-től |

Facilitáció: magyar tréneri napidíj 150–200 e (kisvállalati) → 333 e Ft
(vállalati benchmark, HR Portál 2024); OD-tanácsadó ~205 e Ft/nap.
Egy 10 fős csapatdiagnosztika + egynapos feldolgozás a magyar piacon
500–900 e Ft között hihető.

A Csapatkép 35 000 Ft/fő-vel egy DISC-riport áráért csapatriportot és
közös értelmezést is ad; a Csapatprogram 500 000 Ft egy 10 fős csapatra
egy jobb tréningnap ára, méréssel, riporttal és visszaméréssel.

## 3. A padló (saját költség)

A kalkulátor óra-modellje (mind belső, az admin felületen állítható):
setup 4 + csapatonként 2 + minden 10 főre 2 + online értelmezés 2;
Csapatprogramnál + félnapos workshop 5 + utánkövető mérés 3; extra
workshop-nap 10, extra mérési kör 3, kísérés-hó 3, kiszállás-nap 4.

| 10 fős csapat | Ár | Óra | Effektív óradíj | Cél 25 000 |
|---|---|---|---|---|
| Csapatkép | 350 000 | 10 | 35 000 | ✓ |
| Csapatprogram | 650 000 | 18 | 36 100 | ✓ |
| Csapatprogram, pilot −50% | 325 000 | 18 | 18 100 | ✗ tudatos befektetés az első 10 csapatra |
| 6 fős Csapatkép | 270 000 | 10 | 27 000 | ✓ |

A kisebb csapatok teljes díja csökken. Az óradíjfigyelmeztetés továbbra is jelzi a cél alatti ajánlatokat. A pilot
továbbra is tudatos befektetés az első 10 partnercsapat megszerzésébe.

## 4. Kkv-létszám, amire az ár-horgony csillaga épül

~900 ezer kkv Magyarországon (2024), ebből ~240 ezer foglalkoztat 1 főnél
többet; a foglalkoztató cégek 85%-a 2–9 fős mikrovállalkozás (átlag ~6 fő,
becslés a KSH megoszlásból); a kisvállalkozás (10–49 fő) sávjában
jellemzően 5–12 fős csapategységek. Ezért az ár-horgony lábjegyzete
egy 10 fős csapatra számolt átlagárat jelöl, nem minimumárat.
Források: GKI „Kicsi a bors, de erős" (2024-12), Makronóm (2024-12),
KSH STADAT 9.1.1.17.

## 5. Hol jelenik meg, és honnan jön a szám

Egyetlen forrás: a díjkártya (`QuoteRateCard` tábla, `key = "default"`),
ebből `derivePublicLadder()` vágja ki a publikus részhalmazt
(`src/lib/pricing/team-ladder.ts`). Fogyasztók:

| Felület | Mit mutat |
|---|---|
| `/pricing` | két szint csempéi · `TeamPricingConfigurator` (szint, létszám, csapatszám, átlagár) · összehasonlító tábla · pilot-ár · ár-GYIK; Service JSON-LD fejenkénti referencia-átlagárral |
| `/team-dynamics` ár-szekció | `PriceAnchorCard`: a referencia-átlagár „Ft/fő", egy 10 fős csapatra, link az /pricing-re; a hero pirulája ugyanezt a számot viszi |
| `/pilot` ténysáv 3. cella | a Csapatprogram listaára áthúzva, −50% jelvény, partneri ár |
| `/admin/quote` | ugyanebből számol az ajánlat (szint × létszám + extrák); a díjtételek mentése `revalidatePath`-tal frissíti a három publikus oldalt (ISR, 1 óra) |

A CRM-ben mentett, 2026-09-07 előtti ajánlatok bemenete (programdíjas
forma) olvasáskor átfordul a létrára (`readQuoteInput`): workshop vagy
hullám → Csapatprogram, egyébként Csapatkép. A régi díjkártya-pillanatképből
dokumentum már nem generálható (`QUOTE_SNAPSHOT_MISMATCH`) — másolat kell
friss kártyával.

A díjtételek mentése a `/team-dynamics`, `/pricing` és `/pilot` lapot
revalidálja (`PRICE_LADDER_PUBLIC_PATHS`); a főoldal nincs a listán, mert
nem mutat árat.

## 6. Euró az angol felületen (2026-09-08)

Az ár FORINTBAN rögzített és forintban számlázunk. Az angol felület
(`locale = "en"`) ugyanazt az összeget tájékoztató jelleggel EURÓBAN
mutatja, **napi középárfolyamon** váltva, egész euróra kerekítve, minden
ár mellett „+ VAT"-tal:

| | HU | EN |
|---|---|---|
| Csempe / horgony, 10 fős csapat | 35 000 **Ft / fő + ÁFA** | **€88** / person + VAT (400 Ft/EUR példa) |
| Összesen-sor | Összesen 350 000 Ft + ÁFA … | €875 + VAT in total … |

Forrás-sorrend (`src/lib/pricing/fx.server.ts`, fail-open): **MNB**
`GetCurrentExchangeRates` SOAP → **EKB** napi referencia-árfolyam →
tartalék `FALLBACK_HUF_PER_EUR` (400). A betöltés a `loadPublicLadder()`
része, az ISR miatt legfeljebb óránként fut; a létra `fx` mezője viszi a
kliensre. A parser-ek és a formázók keretmentesek (`src/lib/pricing/fx.ts`,
teszt: `tests/unit/pricing/fx.test.ts`). Az angol /pricing csempéi alatt
egy sor mondja, hogy forintban számlázunk és melyik napi árfolyamon
váltottunk (tartalék-árfolyamnál „approximate rate"); az ár-horgony és a
pilot lábjegyzete rövidebben ugyanezt. A JSON-LD forintban marad (a HU
lokál a kanonikus). Az admin ajánlat és a PDF forintos — a tanácsadói
számlázás forintban megy.

Az egység-címkék (`pricing.perHeadUnit`, `landing.teamPriceFrom`,
`pilot.fact3Unit` …) PÉNZNEM NÉLKÜLIEK: a pénznemet a lokál adja
(`moneyDisplay` / `formatMoney`), így egy kulcs szolgálja mindkét
pénznemet. Új publikus árat ezért soha ne írj „… Ft" formában — a
`formatMoney(huf, locale, ladder.fx)` adja a pénznemet.

## 7. Ami tudatosan NEM került be

- **Kkv- vs. szervezeti tarifa** (cégméret szerinti két ár, keresztfinanszírozással):
  megfontolt, de a kétszintes létra egyszerűbb. Ha a nagy szervezetek
  aránya nő, ez a következő lépés — a kártya `tiers` szerkezete bővíthető.
- **Kapcsolat-űrlap előtöltés** a csúszka állásával: a CTA ma sima
  `/contact`, a paraméterezés akkor éri meg, ha az űrlap tudja fogadni.

## 7. Díjkártya-váltás

A séma v3: a korábbi v2 csomagdíjai helyett az új alapértékek lépnek életbe.
A mentett kísérés-, workshop-, kiszállás-, kedvezmény- és óradíjbeállításokat megtartjuk.
Az admin ellenőrzést és mentést kér. Régi ajánlatpillanatképet nem értelmezünk át
az új képlettel: új másolat kell az új díjkártyával, a már létrehozott dokumentumok megmaradnak.
