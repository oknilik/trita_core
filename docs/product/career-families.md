# Karrier-családok — véglegesített váz

> Státusz: **kitöltve (2026-07-31)**, a `step12_families.py` bemenete.
> A darabszámok és szórások MÉRTEK, a lenti hozzárendelési eljárással
> előállítva a 477 tételes katalóguson.

## Az eljárás

A hozzárendelés **hibrid**: szemantikus korlát + viselkedés-alapú döntés.

1. Minden családhoz tartozik egy **ISCO-alcsoport-halmaz** (szemantikus
   korlát) és 2–3 **horgony-foglalkozás** (a család viselkedési magja).
2. Egy foglalkozás csak olyan családba kerülhet, amelynek ISCO-halmaza
   tartalmazza az ő alcsoportját. A megengedett családok közül a
   **viselkedés-vektor** dönt (6 dimenzió-szint + 7 tengely + RIASEC dupla
   súllyal), a horgonyok centroidjához mért távolság alapján.
3. A 85. percentilis fölötti távolságú tételek **kézi review-ra** mennek.

**Miért kell a szemantikus korlát?** Tisztán viselkedés-alapon a `Pék` a
logisztikába, az `Autóbuszvezető` a vendéglátásba került — viselkedésileg
közeliek, a felhasználónak képtelenség. Az ISCO-korlát ezt kizárja.

**Miért nem futásidőben számoljuk?** Mert nem stabil. Mérés: sima k-means
8 különböző maggal → a párok 13,6 %-a ingadozik, a foglalkozások 91 %-a
vándorol. A besorolás ezért **egyszer készül és befagy** a katalógusba.

## A családok

| kulcs | név | definíció | horgonyok | ISCO | db | szórás |
|---|---|---|---|---|---:|---:|
| `vezetes` | Vezetés és üzletirányítás | Emberekért és eredményért felel: dönt, irányt ad, felelősséget visel. | Ügyvezető · HR vezető · Projektmenedzser | 11,12,13,14 | 37 | 0,94 |
| `penzugy` | Pénzügy, jog és szakértői háttér | Szabályokkal és számokkal dolgozik, ő a szakmai biztonság őre. | Könyvelő · Bérelszámoló · Pénzügyi tanácsadó | 24,33,43 | 60 | 1,19 ⚠ |
| `admin` | Adminisztráció és ügyvitel | Háttérből tartja működésben a folyamatokat, hogy másnak menjen a dolga. | Irodai adminisztrátor · Titkár · Ügyfélkapcsolati munkatárs | 41,42,44,33 | 24 | 0,88 |
| `it` | Informatika és adat | Rendszereket épít, és adatból választ keres. | Szoftverfejlesztő · Adattudós · Rendszergazda | 25,35 | 23 | 0,90 |
| `muszaki` | Mérnöki és műszaki fejlesztés | Fizikai rendszereket tervez, mér és működésben tart. | Gépészmérnök · Földmérő · Villamosipari műszaki rajzoló | 21,31 | 47 | 1,02 |
| `tudomany` | Tudomány és labor | Kísérletez, mér, bizonyít — a válasz nála az adatból jön. | Vegyész · Biológus · Mikrobiológus | 21,31 | 19 | 0,84 |
| `gyogyitas` | Gyógyítás | Diagnosztizál és dönt egy ember egészségéről, szakmai felelősséggel. | Háziorvos · Belgyógyász · Fogorvos | 22 | 33 | 0,82 |
| `apolas` | Ápolás és gondozás | Napi jelenléttel kíséri azt, aki nem boldogul egyedül. | Szakápoló · Ápolási asszisztens · Gyermekgondozó | 32,53 | 32 | 1,28 ⚠ |
| `oktatas` | Oktatás és képzés | Tud valamit, és át tudja adni úgy, hogy a másik is tudja. | Középiskolai tanár · Óvodapedagógus · Középiskolai szakoktató | 23 | 13 | **0,55** |
| `segito` | Segítő és társadalmi szakmák | Nehéz élethelyzetben lévő emberrel dolgozik, hosszú távon. | Családsegítő szociális munkás · Klinikai szakpszichológus | 26,34 | 20 | 1,25 ⚠ |
| `alkotas` | Alkotás, média, kommunikáció | Formát ad gondolatnak, üzenetnek, terméknek. | Grafikus · Újságíró · Divattervező | 21,26,34 | 17 | 1,07 |
| `ertekesites` | Értékesítés és ügyfélkapcsolat | Emberekkel találkozik, meggyőz, kiszolgál. | Bolti eladó · Ingatlanügynök | 52,42 | 8 | 1,26 ⚠ |
| `epites` | Építés és szerelés | Kézzel épít és szerel, a helyszínen, látható eredménnyel. | Kőműves · Ács · Víz- és gázvezeték-szerelő | 71,74,93 | 29 | **0,70** |
| `gyartas` | Gyártás és karbantartás | Gépet kezel, alkatrészt készít, hibát javít. | Hegesztő · CNC-gépkezelő · Autószerelő | 72,73,81,82 | 55 | **0,70** |
| `logisztika` | Szállítás és logisztika | Mozgatja az árut és az embereket, időre. | Kamionsofőr · Targoncavezető · Autóbuszvezető | 83,93 | 16 | 0,87 |
| `vendeglatas` | Vendéglátás és élelmiszer | Ételt készít és vendéget lát el, tempóban. | Szakács · Pék · Felszolgáló | 51,75,94 | 23 | 1,12 |
| `szemelyes` | Személyes szolgáltatás | Egy emberrel foglalkozik egyszerre, a külsejéért és a jóllétéért. | Fodrász · Kozmetikus · Fitneszedző | 51,91,96 | 13 | 1,37 ⚠ |
| `vedelem` | Védelem és biztonság | Mások testi épségéért felel, kiszámíthatatlan helyzetben is. | Tűzoltó · Rendőr · Biztonsági őr | 54 | 5 | 0,86 |
| `agrar` | Kertészet és zöldterület | Élő anyaggal dolgozik, a szabadban, évszakok szerint. | Parkgondozó · Kertészeti munkás | 61 | 3 | 0,85 |

**19 család, 477 foglalkozás, 0 besorolatlan.** Kézi review-ra: **71 tétel**
(a 85. percentilis fölötti távolságúak).

## A négy határkérdés — eldöntve

**1. Vezetők: külön család.** A gyártási művezető viselkedésileg közelebb
van a vezérigazgatóhoz, mint a hegesztőhöz, de a `vezetes` család ISCO-korlátja
(11–14) csak a valódi vezetői beosztásokat engedi be — a művezető a
`13`-on keresztül ide kerül, a hegesztő nem. Visszavonható: ha a
felhasználók keresik a művezetőt a gyártásnál, a `13` átvihető.

**2. Orvos és ápoló: két család.** Szétvágva `gyogyitas` (33) és `apolas`
(32). A szétvágás igazolta magát: az egyesített család 57 tétellel és magas
szórással állt volna; így a `gyogyitas` 0,82-re szorult.

**3. Védelem (5) és agrár (3): önálló, kis családok.** Nem olvasztottam be
őket. Egy kicsi, de igaz család jobb, mint egy hazug besorolás — és mindkettő
olyan kategória, amit a felhasználó KERES.

**4. 19 család, nem 14.** Eredetileg 12–16-ot javasoltam. A szemantikus
korlát finomabb bontást kényszerít, és inkább vállalom a 19-et, mint hogy
hamis összevonásokat írjak. A megjelenítésre ez nincs hatással: a
felhasználó a top 3–5 családot látja részletesen, a többit összecsukva.

**Ára, amit ki kell mondani:** a 8 tétel alatti családoknál (`vedelem` 5,
`agrar` 3, `ertekesites` 8) a családszintű átlag maga is zajos — pont az a
statisztikai előny csökken, ami miatt a családosítás indult. Ezeket a
felületen **„kis család — tájékoztató jellegű"** jelöléssel kell mutatni,
nem ugyanolyan magabiztossággal, mint a 30–60 főseket.

## Gyenge pontok — ezekkel kell még dolgozni

⚠ jelöléssel a táblázatban. Négy család szórása kiugró:

- **`penzugy` (60 tétel, 1,19)** — ez a leggyengébb. Az ISCO 24 („üzleti és
  igazgatási szakértők") túl tág: könyvelő, jogász és HR-szakértő is ide
  esik. **Javaslat: bontsd `penzugy` + `jog` családra**, vagy vidd a
  HR-szakértőket a `vezetes`-hez. Ezt a review-listával a kezünkben döntsük el.
- **`apolas` (1,28)** és **`szemelyes` (1,37)** — az ISCO 51/53 keveri a
  gondozást a szépségiparral.
- **`segito` (1,25)** — az ISCO 26/34 keveri a szociális munkást a
  jogásszal és a kulturális szakmákkal.
- **`ertekesites` (8 tétel)** — a katalógusban kevés a tiszta értékesítő;
  érdemes lehet ide húzni néhány `42`-es ügyfélkapcsolati szerepet.

A legjobb három család viszont már most szállítható: `oktatas` (0,55),
`epites` (0,70), `gyartas` (0,70).

## Következő lépés

`scripts/career-catalog/step12_families.py` megírása, ami ezt a táblázatot
olvassa, elvégzi a hozzárendelést, kiírja a `family` mezőt a katalógusba, és
generál egy **71 tételes review-listát** Excelbe — ugyanaz a munkafolyamat,
mint a katalógus-validálásnál (`step7_apply_review.py`).
