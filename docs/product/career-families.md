# Karrier-családok — véglegesített váz

> Státusz: **kitöltve (2026-07-31)**, a `step12_families.py` bemenete.
> A darabszámok és szórások MÉRTEK, a lenti hozzárendelési eljárással
> előállítva a 477 tételes katalóguson.

## Az eljárás

A hozzárendelés **hibrid**: szemantikus korlát + viselkedés-alapú döntés.

1. Minden családhoz tartozik egy **ISCO-prefix-lista** (szemantikus korlát),
   2–3 **horgony-foglalkozás** (a család viselkedési magja), és opcionálisan
   **tételesen ide sorolt nevek**.
2. **A leghosszabb illeszkedő prefix nyer.** Egy foglalkozás azokba a
   családokba kerülhet, amelyek a LEGPONTOSABBAN írják le az ISCO-kódját —
   így a `3411` (jogi asszisztens) a `jog`-hoz megy, nem a `34`-es
   `segito`-hoz. Az így megengedett családok közül a **viselkedés-vektor**
   dönt (6 dimenzió-szint + 7 tengely + RIASEC dupla súllyal), a horgonyok
   centroidjához mért távolság alapján.
3. A tételes besorolás mindent felülír (pl. `Adóügyintéző` az ISCO 2411-en
   ül a könyvelőkkel, mégis a `jog`-hoz tartozik).
4. A 85. percentilis fölötti távolságú tételek **kézi review-ra** mennek.

A leghosszabb-prefix szabály nem kozmetika: ez tette lehetővé a `jog` család
kiemelését, ami önmagában négy másik család szórását javította.

**Miért kell a szemantikus korlát?** Tisztán viselkedés-alapon a `Pék` a
logisztikába, az `Autóbuszvezető` a vendéglátásba került — viselkedésileg
közeliek, a felhasználónak képtelenség. Az ISCO-korlát ezt kizárja.

**Miért nem futásidőben számoljuk?** Mert nem stabil. Mérés: sima k-means
8 különböző maggal → a párok 13,6 %-a ingadozik, a foglalkozások 91 %-a
vándorol. A besorolás ezért **egyszer készül és befagy** a katalógusba.

## A családok

| kulcs | név | definíció | horgonyok | ISCO-prefix | db | szórás |
|---|---|---|---|---|---:|---:|
| `vezetes` | Vezetés és üzletirányítás | Emberekért és eredményért felel: dönt, irányt ad, felelősséget visel. | Ügyvezető · HR vezető · Projektmenedzser | 11,12,13,14 | 36 | 0,87 |
| `penzugy` | Pénzügy és számvitel | Számokkal és szabályokkal dolgozik, ő a pénzügyi biztonság őre. | Könyvelő · Bérelszámoló · Pénzügyi tanácsadó | 24,33,43 | 55 | 1,05 ⚠ |
| **`jog`** | **Jog és hatósági munka** | **Szabályt értelmez és érvényesít — az ő döntése másokra nézve kötelező.** | **Ügyvéd · Adóellenőr · Bírósági ügyintéző** | **261,3342,3411,335,3331,1111** + `Adóügyintéző` | **13** | **1,03** |
| `admin` | Adminisztráció és ügyvitel | Háttérből tartja működésben a folyamatokat, hogy másnak menjen a dolga. | Irodai adminisztrátor · Titkár · Ügyfélkapcsolati munkatárs | 41,42,44,33 | 20 | 0,79 |
| `it` | Informatika és adat | Rendszereket épít, és adatból választ keres. | Szoftverfejlesztő · Adattudós · Rendszergazda | 25,35 | 23 | 0,86 |
| `muszaki` | Mérnöki és műszaki fejlesztés | Fizikai rendszereket tervez, mér és működésben tart. | Gépészmérnök · Földmérő · Villamosipari műszaki rajzoló | 21,31 | 47 | 0,97 |
| `tudomany` | Tudomány és labor | Kísérletez, mér, bizonyít — a válasz nála az adatból jön. | Vegyész · Biológus · Mikrobiológus | 21,31 | 19 | 0,75 |
| `gyogyitas` | Gyógyítás | Diagnosztizál és dönt egy ember egészségéről, szakmai felelősséggel. | Háziorvos · Belgyógyász · Fogorvos | 22 | 33 | 0,76 |
| `apolas` | Ápolás és gondozás | Napi jelenléttel kíséri azt, aki nem boldogul egyedül. | Szakápoló · Ápolási asszisztens · Gyermekgondozó | 32,53 | 32 | 1,05 ⚠ |
| `oktatas` | Oktatás és képzés | Tud valamit, és át tudja adni úgy, hogy a másik is tudja. | Középiskolai tanár · Óvodapedagógus · Középiskolai szakoktató | 23 | 13 | **0,51** |
| `segito` | Segítő és társadalmi szakmák | Nehéz élethelyzetben lévő emberrel dolgozik, hosszú távon. | Családsegítő szociális munkás · Klinikai szakpszichológus | 26,34 | 17 | 1,06 ⚠ |
| `alkotas` | Alkotás, média, kommunikáció | Formát ad gondolatnak, üzenetnek, terméknek. | Grafikus · Újságíró · Divattervező | 21,26,34 | 16 | 0,93 |
| `ertekesites` | Értékesítés és ügyfélkapcsolat | Emberekkel találkozik, meggyőz, kiszolgál. | Bolti eladó · Ingatlanügynök | 52,42 | 8 | 1,04 |
| `epites` | Építés és szerelés | Kézzel épít és szerel, a helyszínen, látható eredménnyel. | Kőműves · Ács · Víz- és gázvezeték-szerelő | 71,74,93 | 29 | **0,65** |
| `gyartas` | Gyártás és karbantartás | Gépet kezel, alkatrészt készít, hibát javít. | Hegesztő · CNC-gépkezelő · Autószerelő | 72,73,81,82 | 55 | **0,65** |
| `logisztika` | Szállítás és logisztika | Mozgatja az árut és az embereket, időre. | Kamionsofőr · Targoncavezető · Autóbuszvezető | 83,93 | 16 | 0,79 |
| `vendeglatas` | Vendéglátás és élelmiszer | Ételt készít és vendéget lát el, tempóban. | Szakács · Pék · Felszolgáló | 51,75,94 | 23 | 1,02 |
| `szemelyes` | Személyes szolgáltatás | Egy emberrel foglalkozik egyszerre, a külsejéért és a jóllétéért. | Fodrász · Kozmetikus · Fitneszedző | 51,91,96 | 13 | 1,09 ⚠ |
| `vedelem` | Védelem és biztonság | Mások testi épségéért felel, kiszámíthatatlan helyzetben is. | Tűzoltó · Rendőr · Biztonsági őr | 54 + `Bűnügyi nyomozó` | 6 | 0,81 |
| `agrar` | Kertészet és zöldterület | Élő anyaggal dolgozik, a szabadban, évszakok szerint. | Parkgondozó · Kertészeti munkás | 61 | 3 | 0,92 |

**20 család, 477 foglalkozás, 0 besorolatlan.**

### A `jog` család bevezetésének mellékhatása

A jogi és hatósági tételek addig négy másik család közt voltak szétszórva.
Kiemelésük mindegyiket javította:

| család | előtte | utána |
|---|---|---:|
| `penzugy` | 60 tétel · 1,19 | 55 · **1,05** |
| `apolas` | 1,28 | **1,05** |
| `segito` | 1,25 | **1,06** |
| `szemelyes` | 1,37 | **1,09** |

A `jog` család teljes tartalma (13 tétel): Ügyvéd · Törvényhozó ·
Adóügyintéző · Regulatory affairs menedzser · Regulatory affairs specialista ·
Vámügyintéző · Bírósági ügyintéző · Jogi titkár · Adóellenőr · Engedélyezési
ügyintéző · Műszaki vizsgabiztos · Teheráru-felügyelő · Jogi asszisztens.

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

**4. 20 család, nem 14.** Eredetileg 12–16-ot javasoltam. A szemantikus
korlát finomabb bontást kényszerít, és inkább vállalom a 19-et, mint hogy
hamis összevonásokat írjak. A megjelenítésre ez nincs hatással: a
felhasználó a top 3–5 családot látja részletesen, a többit összecsukva.

**Ára, amit ki kell mondani:** a 8 tétel alatti családoknál (`vedelem` 5,
`agrar` 3, `ertekesites` 8) a családszintű átlag maga is zajos — pont az a
statisztikai előny csökken, ami miatt a családosítás indult. Ezeket a
felületen **„kis család — tájékoztató jellegű"** jelöléssel kell mutatni,
nem ugyanolyan magabiztossággal, mint a 30–60 főseket.

## NYITOTT: a bíró hiányzik — döntést igényel

A `jog` családban **nincs bíró, ügyész és közjegyző** — nem azért, mert
kimaradtak, hanem mert a katalógus-tierezésnél T3-ba (niche) kerültek, és a
T3 az adatban marad, de nem megy a termékbe. Ez a te Excel-validálásod
eredménye, ezért nem írom felül magamtól.

Az archívumban készen áll öt tétel:

| ISCO | név | tier |
|---|---|---|
| 2612 | Bíró | 3 |
| 2612 | Közigazgatási bíró | 3 |
| 2619 | Mediátor (közvetítő) | 3 |
| 3411 | Bírósági fogalmazó | 3 |
| 3343 | Bírósági jegyzőkönyvvezető | 3 |

**Kérdés: emeljük át ezt az ötöt T2-be?** Mellette szól, hogy karrier-
iránytűben a bíró olyan cél, amire emberek TÖREKSZENEK — a „niche" itt nem
gyakoriságot, hanem elérhetőséget jelentene. Ellene szól, hogy ez felülírja
a saját tier-döntésedet, és 477 → 482-re változtatja a validált készletet.

Amíg nincs döntés, a `jog` család 13 tétellel él, bíró nélkül.

## Gyenge pontok — ezekkel kell még dolgozni

⚠ jelöléssel a táblázatban. A `jog` kiemelése után három család marad
kiugró, mindegyik enyhébb, mint korábban:

- **`penzugy` (55 tétel, 1,05)** — az ISCO 24 még mindig tág: a HR- és
  szervezetfejlesztési szakértők (2423, 2424) itt ülnek, pedig a
  `vezetes`-hez tartoznának. Ez a következő kézenfekvő javítás.
- **`apolas` (1,05)** és **`szemelyes` (1,09)** — az ISCO 51/53 keveri a
  gondozást a szépségiparral. Egy `53` → `apolas`, `51` → `szemelyes`
  élesebb szétvágás segítene, de a `51`-en a vendéglátás is osztozik.
- **`ertekesites` (8 tétel)** — a katalógusban kevés a tiszta értékesítő;
  érdemes lehet ide húzni néhány `42`-es ügyfélkapcsolati szerepet.

A legjobb négy család már most szállítható: `oktatas` (0,51), `epites`
(0,65), `gyartas` (0,65), `tudomany` (0,75).

A `jog` szórása 1,03 — közepes. Oka kimondható: az `Ügyvéd` és a
`Teheráru-felügyelő` egy családban van. Ez tudatos: te egy jogi-hatósági
családot kértél, és a szabály-érvényesítés a közös nevező. Ha később szűkíteni
akarod, a `335` (hatósági ellenőrök) leválasztható önálló családdá.

## Következő lépés

`scripts/career-catalog/step12_families.py` megírása, ami ezt a táblázatot
olvassa, elvégzi a hozzárendelést, kiírja a `family` mezőt a katalógusba, és
generál egy **review-listát** Excelbe (a 85. percentilis fölötti távolságúak,
nagyságrendileg 60–70 tétel) — ugyanaz a munkafolyamat,
mint a katalógus-validálásnál (`step7_apply_review.py`).
