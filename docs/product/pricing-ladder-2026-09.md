# Publikus árlétra — döntési dokumentum (2026-09-07)

> Állapot: **bevezetve** (branch: `claude/pricing-details-per-person`).
> A számok forrása a díjkártya (`src/lib/quote/rate-card.ts`,
> `DEFAULT_RATE_CARD`), az élő érték az admin felületen mentett kártya
> (`/admin/quote` → Díjtételek). Ez a doksi az indoklást őrzi.

## 1. Mi változott

A platform 2026-09-07-től **publikál fejenkénti árat**. A korábbi
„egyedi ajánlat az első beszélgetés után" modell (programdíj + sávos
mérési díj + mérés-lépésenkénti felárak + workshop-nap) egy kétszintes,
fejenkénti létrára cserélődött:

| Szint | Tartalom | Alapértelmezett ár (nettó) |
|---|---|---|
| **Csapatkép** | minden mérés (személyiség, csapatszerep, bizalmi kör, pszichológiai biztonság, observer), validált csapatriport, vezetői visszajelzés, 90 perces online közös értelmezés | **35 000 Ft/fő** |
| **Csapatprogram** | Csapatkép + félnapos értelmező workshop + utánkövető mérés fél év múlva | **50 000 Ft/fő** |
| 10 fő feletti tagok | mindkét szinten | 20 000 Ft/fő |
| További egész napos, helyszíni workshop | | 180 000 Ft |
| Pilot-partneri kedvezmény (/pilot ténysáv) | a Csapatprogram árából | 50% |

Belső (nem publikus) tételek: további mérési kör (a fejenkénti díj 35%-a),
havi kísérés (120 000 Ft/hó), kiszállás (60 000 Ft/nap, továbbhárítva),
óra-becslés, cél-óradíj (25 000 Ft/óra), kedvezmény-keret (30%).

**Elv (létszám, nem csapatszám — 2026-09-08):** az ár a RÉSZTVEVŐK
létszámára megy, nem a csapatok számára. 35 fő lehet egy egység, de
jellemzően 5–8 kisebb csapat — mindegyik saját csapatképet, riportot és
közös értelmezést (csapatonként 90 perc, a Csapatprogramban csapatonként
félnapos workshop) kap, az ár nem változik. A kalkulátor a létszám mellett
mutatja, hány csapat lehet belőle (`estimateTeamRange`, tipikus 4–8 fős
csapatméretből; 12 főig egy csapat is hihető). A több csapatból adódó
tanácsadói többletidőt a belső óra-modell `perTeam` tétele viszi, az admin
kalkulátorban a csapatok száma külön mező — ez a publikus árat nem érinti.

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
| Csapatprogram | 500 000 | 18 | 27 800 | ✓ |
| Csapatprogram, pilot −50% | 250 000 | 18 | 13 900 | ✗ tudatos befektetés az első 10 csapatra |
| 6 fős Csapatkép | 210 000 | 10 | 21 000 | ✗ a legkisebb csapat a padló alatt |

A 6–8 fős csapatok a padló alatt vannak: ezt tudatosan vállaljuk (a
magyar kkv-csapat tipikusan 5–8 fő, és nem akarunk „minimum létszámot"
az első számban). Ha ez fáj, a kártyán a Csapatkép ára vagy az óra-modell
állítandó, nem a kód.

## 4. Kkv-létszám, amire az ár-horgony csillaga épül

~900 ezer kkv Magyarországon (2024), ebből ~240 ezer foglalkoztat 1 főnél
többet; a foglalkoztató cégek 85%-a 2–9 fős mikrovállalkozás (átlag ~6 fő,
becslés a KSH megoszlásból); a kisvállalkozás (10–49 fő) sávjában
jellemzően 5–12 fős csapategységek. Ezért az ár-horgony lábjegyzete
„5–10 fős kkv-csapatra" mond árat — ez a sáv, ahol a 35 000 Ft/fő igaz.
Források: GKI „Kicsi a bors, de erős" (2024-12), Makronóm (2024-12),
KSH STADAT 9.1.1.17.

## 5. Hol jelenik meg, és honnan jön a szám

Egyetlen forrás: a díjkártya (`QuoteRateCard` tábla, `key = "default"`),
ebből `derivePublicLadder()` vágja ki a publikus részhalmazt
(`src/lib/pricing/team-ladder.ts`). Fogyasztók:

| Felület | Mit mutat |
|---|---|
| `/pricing` (2026-09-08-tól önálló Árak oldal) | két szint csempéi · `TeamPricingConfigurator` (szint-váltó + létszám-csúszka + fejenkénti ár + tartalom) · összehasonlító tábla · ezen felül · pilot-ár sáv · ár-GYIK a számokkal; Service JSON-LD `UnitPriceSpecification` |
| `/team-dynamics` ár-szekció | `PriceAnchorCard`: a belépő szint ára „Ft/fő-től*", link az /pricing-re; a hero pirulája ugyanezt a számot viszi. A főoldalon (`/`) nincs ár (2026-09-08-tól): az egyéni ígéretről szól, statikus marad |
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
| Csempe / kalkulátor / horgony | 35 000 **Ft / fő + ÁFA** | **€88** / person + VAT |
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
