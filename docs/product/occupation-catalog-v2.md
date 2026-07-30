# Foglalkozás-katalógus v2 — nyers levezetés (review-hoz)

> Generált dokumentum, 2026-07-30. Forrás-adatok: **O\*NET 30.3 Database** (U.S. Department of Labor / ETA, CC BY 4.0), **ESCO v1.2** (Európai Bizottság, ISCO-08 alapú magyar megnevezések és leírások), **ESCO_to_ONET-SOC** crosswalk (O\*NET Resource Center). Generátor: `scripts/career-catalog/` (ld. `career-engine-plan.md` F2). Gépi kimenet: `docs/product/data/occupations-v2.json`.

**Tételszám:** 890 foglalkozás · kanonikus HU név piaci (ESCO) alakban: 374 · hivatalos ISCO/FEOR csoportnévre visszaesett (név-review kell): 516 · HU leírás ESCO-ból: 744 · FEOR-08 kóddal: 861

## Hogyan olvasd

- **Belépési minimum**: O\*NET Job Zone (1–5) → a mi `entryLevel` skálánk, plusz a birtokosok által leggyakrabban megjelölt végzettségi szint (modal Required Level of Education), magyar megfelelőre fordítva. A százalék azt mutatja, a válaszadók mekkora része jelölte ezt a szintet.
- **Holland-kód (RIASEC)**: O\*NET Occupational Interests 1–7 skálája 0–100-ra vetítve, mind a hat betűre. A `top3` a három legerősebb betű.
- **HEXACO differenciál cél-profil**: a 21 O\*NET Work Style *előjeles hatás-értékéből* (Work Styles Impact, −3…+3) származtatva. Foglalkozáson belül centrálva (az „itt minden fontos” hatás kiszűrve), stílusonként standardizálva, majd a dokumentált loading-mátrixszal HEXACO-dimenziókra aggregálva. `cél` = a dimenzió ideális értéke 0–100-on, `tol` = tolerancia (mekkora eltérés még nem számít), `w` = a dimenzió súlya ennél a foglalkozásnál. Ez az **alak** (mi jellemzi ezt a munkát a többihez képest).
- **HEXACO abszolút szint**: ugyanaz a levezetés centrálás NÉLKÜL — ez a „mennyi kell belőle egyáltalán” információ. A motor a kettőt külön használja (differenciál = rangsor, abszolút = általános szint).

## Nyitott döntések (ld. a dokumentum végén is)

1. **A H (becsületesség-alázat) alacsony célértéke** több értékesítési/tárgyalási foglalkozásnál megjelenik (a Work Style „Humility” negatív hatás-értéke miatt). Termékdöntés kell: a motor SOHA ne jutalmazza az alacsony H-t „illeszkedésként”, csak környezet-jellemzésként említse.
2. A magyar megnevezés kanonikus formája: ESCO-foglalkozásnév (piaci) vagy ISCO/FEOR csoportnév (hivatalos)? Jelenleg ESCO-név az elsődleges, ISCO-csoportnév a fallback.
3. A magyar belépési útvonal (szakmajegyzék, kamarai tagság, tipikus képzési idő) még nincs benne — a Job Zone és a végzettség-megoszlás amerikai adat.

# I. rész — termékbe javasolt tételek (T1+T2)

477 foglalkozás: 131 nagy létszámú (T1) + 346 létező, közepes/kisebb (T2).

## 1 — Vezetők, felsővezetők

### Törvényhozók

`11-1031.00` · **ISCO-08 1111** Törvényhozók · **FEOR-08:** 1110 Törvényhozó, miniszter, államtitkár; 1122 Helyi önkormányzat választott vezetője · ESCO `1111` · EN: Legislators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* önkormányzati képviselő, megyei önkormányzati képviselő, települési önkormányzati képviselő, miniszter, miniszterelnök, polgármester

_(HU leírás nincs; EN:)_ Develop, introduce, or enact laws and statutes at the local, tribal, state, or federal level. Includes only workers in elected positions.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** ESC — R 9 · I 39 · A 28 · S 45 · E 75 · C 44

**HEXACO differenciál cél-profil:** X cél 66±19 (w=0.29) · H cél 37±22 (w=0.23) · C cél 41±24 (w=0.17) · O cél 58±25 (w=0.14)

**HEXACO abszolút szint:** H 54 · E 36 · X 72 · A 65 · C 55 · O 65

### Országos közigazgatási vezetők

`33-1012.00` · **ISCO-08 1112** Országos közigazgatási vezetők · **FEOR-08:** 1123 Helyi önkormányzat kinevezett vezetője · ESCO `1112.5` · EN: First-Line Supervisors of Police and Detectives · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* rendőrkapitány, rendőr, rendőrnő

A rendőrkapitányok felügyelik az egész rendőrségi osztályt, nyomon követve és szabályozva a rendőrségi osztály adminisztratív és operatív tevékenységeit, valamint szakpolitikákat és eljárási módszereket dolgoznak ki.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 56.4%-a jelölte

**Holland-kód:** ECS — R 41 · I 22 · A 0 · S 46 · E 98 · C 68

**HEXACO differenciál cél-profil:** X cél 60±24 (w=0.28) · O cél 40±24 (w=0.28) · E cél 45±26 (w=0.16) · A cél 55±26 (w=0.15)

**HEXACO abszolút szint:** H 61 · E 37 · X 66 · A 64 · C 62 · O 51

### vezérigazgató

`11-1011.00` · **ISCO-08 1120** Ügyvezetők és vezérigazgatók · **FEOR-08:** 1210 Gazdasági, költségvetési szervezet vezetője (igazgató, elnök, ügyvezető igazgató) · ESCO `1120.3` · EN: Chief Executives

*Piaci megnevezések (ESCO):* munkaközvetítő iroda vezetője, ügyvezető, ügyvezető igazgató, cégvezető, csoportvezető

A vezérigazgatók egy társasági struktúrában a legmagasabb rangú vezető tisztségviselők. Teljes mértékben átlátják a vállalkozás működését, ismerik a szervezeti egységeket, a kockázatokat és az érdekelt feleket.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 45.9%-a jelölte

**Holland-kód:** ECS — R 4 · I 34 · A 19 · S 42 · E 99 · C 66

**HEXACO differenciál cél-profil:** X cél 68±18 (w=0.29) · H cél 34±19 (w=0.26) · E cél 38±22 (w=0.19) · O cél 59±24 (w=0.15)

**HEXACO abszolút szint:** H 53 · E 32 · X 73 · A 61 · C 60 · O 66

### Ügyvezetők és vezérigazgatók

`11-1021.00` · **ISCO-08 1120** Ügyvezetők és vezérigazgatók · **FEOR-08:** 1210 Gazdasági, költségvetési szervezet vezetője (igazgató, elnök, ügyvezető igazgató) · ESCO `1120.2` · EN: General and Operations Managers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* cégvezető, ügyvezető, csoportvezető, ügyvezető igazgató

A cégvezetők felelősek a társaság üzleti egysége célkitűzéseinek meghatározásáért, a műveletek megtervezéséért, valamint a terv célkitűzéseinek és végrehajtásának elősegítéséért az üzleti egység alkalmazottaival és az érdekelt felek együtt.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 28.8%-a jelölte

**Holland-kód:** ECS — R 20 · I 23 · A 5 · S 40 · E 100 · C 72

**HEXACO differenciál cél-profil:** X cél 67±19 (w=0.44) · H cél 39±23 (w=0.29) · E cél 46±27 (w=0.11)

**HEXACO abszolút szint:** H 53 · E 40 · X 69 · A 60 · C 57 · O 59

### Pénzügyi vezetők

`11-3031.01` · **ISCO-08 1211** Pénzügyi vezetők · **FEOR-08:** 1411 Számviteli és pénzügyi tevékenységet folytató egység vezetője · ESCO `1211.1.2` · EN: Treasurers and Controllers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* pénzügyi vezető, pénzügyi igazgató

A pénzügyi vezetők a vállalat pénzügyeivel és befektetéseivel kapcsolatos valamennyi üggyel foglalkoznak.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 56.0%-a jelölte

**Holland-kód:** CES — R 0 · I 20 · A 3 · S 28 · E 86 · C 91

**HEXACO differenciál cél-profil:** A cél 38±22 (w=0.36) · X cél 58±25 (w=0.23) · C cél 55±27 (w=0.14)

**HEXACO abszolút szint:** H 55 · E 47 · X 60 · A 49 · C 64 · O 57

### pénzügyi vezető

`11-3031.00` · **ISCO-08 1211** Pénzügyi vezetők · **FEOR-08:** 1411 Számviteli és pénzügyi tevékenységet folytató egység vezetője · ESCO `1211.1` · EN: Financial Managers

*Piaci megnevezések (ESCO):* pénzügyi igazgató

A pénzügyi vezetők a vállalat pénzügyeivel és befektetéseivel kapcsolatos valamennyi üggyel foglalkoznak.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 56.3%-a jelölte

**Holland-kód:** ECS — R 6 · I 24 · A 10 · S 34 · E 100 · C 76

**HEXACO differenciál cél-profil:** X cél 60±23 (w=0.41) · A cél 41±24 (w=0.36)

**HEXACO abszolút szint:** H 56 · E 45 · X 64 · A 52 · C 60 · O 56

### Emberi erőforrás-gazdálkodási vezetők

`11-3111.00` · **ISCO-08 1212** Emberi erőforrás-gazdálkodási vezetők · **FEOR-08:** 1412 Személyzeti vezető, humánpolitikai egység vezetője · ESCO `1212` · EN: Compensation and Benefits Managers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Plan, direct, or coordinate compensation and benefits activities of an organization.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 76.2%-a jelölte

**Holland-kód:** ECS — R 0 · I 20 · A 7 · S 47 · E 100 · C 78

**HEXACO differenciál cél-profil:** X cél 57±25 (w=0.38) · E cél 55±27 (w=0.26) · A cél 47±28 (w=0.16) · C cél 48±29 (w=0.11)

**HEXACO abszolút szint:** H 57 · E 49 · X 60 · A 54 · C 57 · O 56

### Emberi erőforrás-gazdálkodási vezetők

`11-3121.00` · **ISCO-08 1212** Emberi erőforrás-gazdálkodási vezetők · **FEOR-08:** 1412 Személyzeti vezető, humánpolitikai egység vezetője · ESCO `1212` · EN: Human Resources Managers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Plan, direct, or coordinate human resources activities and staff of an organization.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 81.8%-a jelölte

**Holland-kód:** ECS — R 4 · I 22 · A 8 · S 48 · E 100 · C 76

**HEXACO differenciál cél-profil:** X cél 59±24 (w=0.23) · C cél 41±24 (w=0.23) · H cél 58±24 (w=0.21) · O cél 44±26 (w=0.14)

**HEXACO abszolút szint:** H 68 · E 43 · X 66 · A 64 · C 56 · O 54

### Máshová nem sorolható üzleti és igazgatási vezetők

`13-1082.00` · **ISCO-08 1219** Máshová nem sorolható üzleti és igazgatási vezetők · **FEOR-08:** 1419 Egyéb gazdasági tevékenységet segítő egység vezetője · ESCO `1219.6` · EN: Project Management Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* projektmenedzser, projektkoordinátor, vezető projektmenedzser

A projektmenedzserek biztosítják, hogy a projekt időben, a költségvetés betartása mellett fejeződjön be, és hogy a célkitűzések megvalósuljanak.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** ECS — R 8 · I 29 · A 10 · S 39 · E 88 · C 76

**HEXACO differenciál cél-profil:** H cél 39±22 (w=0.35) · X cél 61±23 (w=0.34) · E cél 46±27 (w=0.12)

**HEXACO abszolút szint:** H 54 · E 39 · X 67 · A 62 · C 61 · O 58

### üzleti szolgáltatási vezető

`11-3013.00` · **ISCO-08 1219** Máshová nem sorolható üzleti és igazgatási vezetők · **FEOR-08:** 1419 Egyéb gazdasági tevékenységet segítő egység vezetője · ESCO `1219.1.1` · EN: Facilities Managers

*Piaci megnevezések (ESCO):* aktuáriusi tanácsadó szolgálat vezetője, reklámügynökség vezetője, karbantartási vezető gyártólétesítményben, karbantartási igazgató

Az üzleti szolgáltatások vezetői felelősek a vállalkozásoknak nyújtott szakmai szolgáltatásokért. Megszervezik az ügyfél igényeire szabott szolgáltatásokat, és kapcsolatot tartanak az ügyfelekkel, hogy megállapodjanak a két fél szerződéses kötelezettségeiről.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 57.3%-a jelölte

**Holland-kód:** ECR — R 52 · I 27 · A 10 · S 43 · E 72 · C 72

**HEXACO differenciál cél-profil:** X cél 60±23 (w=0.47) · H cél 43±25 (w=0.32) · E cél 47±28 (w=0.13)

**HEXACO abszolút szint:** H 51 · E 45 · X 60 · A 54 · C 55 · O 53

### üzleti szolgáltatási vezető

`11-3013.01` · **ISCO-08 1219** Máshová nem sorolható üzleti és igazgatási vezetők · **FEOR-08:** 1419 Egyéb gazdasági tevékenységet segítő egység vezetője · ESCO `1219.1.2` · EN: Security Managers

*Piaci megnevezések (ESCO):* aktuáriusi tanácsadó szolgálat vezetője, reklámügynökség vezetője

Az üzleti szolgáltatások vezetői felelősek a vállalkozásoknak nyújtott szakmai szolgáltatásokért. Megszervezik az ügyfél igényeire szabott szolgáltatásokat, és kapcsolatot tartanak az ügyfelekkel, hogy megállapodjanak a két fél szerződéses kötelezettségeiről.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 70.0%-a jelölte

**Holland-kód:** ECI — R 40 · I 45 · A 5 · S 29 · E 77 · C 74

**HEXACO differenciál cél-profil:** X cél 55±27 (w=0.27) · E cél 46±27 (w=0.21) · H cél 46±28 (w=0.20) · C cél 53±28 (w=0.16)

**HEXACO abszolút szint:** H 56 · E 41 · X 60 · A 57 · C 65 · O 55

### marketingigazgató

`11-2011.00` · **ISCO-08 1221** Értékesítési és marketingvezetők · **FEOR-08:** 1415 Értékesítési és marketingtevékenységet folytató egység vezetője · ESCO `1221.3.3` · EN: Advertising and Promotions Managers

*Piaci megnevezések (ESCO):* értékesítési és marketingigazgató, kereskedelmi igazgató

A marketingigazgatók egy vállalatnál a magas szintű marketingműveleteket kezelik. Koordinálják a marketing-, promóciós és reklámtevékenységekkel kapcsolatos valamennyi tevékenységeket az egységek vagy földrajzi területek között.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 60.0%-a jelölte

**Holland-kód:** ECA — R 0 · I 12 · A 48 · S 36 · E 100 · C 57

**HEXACO differenciál cél-profil:** H cél 25±14 (w=0.32) · X cél 72±15 (w=0.28) · O cél 62±22 (w=0.15) · E cél 40±24 (w=0.12)

**HEXACO abszolút szint:** H 38 · E 40 · X 69 · A 56 · C 46 · O 63

### marketingigazgató

`11-2021.00` · **ISCO-08 1221** Értékesítési és marketingvezetők · **FEOR-08:** 1415 Értékesítési és marketingtevékenységet folytató egység vezetője · ESCO `1221.3.2` · EN: Marketing Managers

*Piaci megnevezések (ESCO):* értékesítési és marketingigazgató, kereskedelmi igazgató, turisztikai termékmenedzser, termékmenedzser, idegenforgalmi termékmenedzser, nemzetközi kereskedelmi igazgató

A marketingigazgatók egy vállalatnál a magas szintű marketingműveleteket kezelik. Koordinálják a marketing-, promóciós és reklámtevékenységekkel kapcsolatos valamennyi tevékenységeket az egységek vagy földrajzi területek között.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 55.8%-a jelölte

**Holland-kód:** ECI — R 0 · I 32 · A 24 · S 30 · E 100 · C 62

**HEXACO differenciál cél-profil:** H cél 29±16 (w=0.30) · X cél 68±18 (w=0.26) · O cél 64±21 (w=0.20) · E cél 42±25 (w=0.12)

**HEXACO abszolút szint:** H 42 · E 40 · X 68 · A 55 · C 47 · O 65

### marketingigazgató

`11-2022.00` · **ISCO-08 1221** Értékesítési és marketingvezetők · **FEOR-08:** 1415 Értékesítési és marketingtevékenységet folytató egység vezetője · ESCO `1221.3.2.1` · EN: Sales Managers

*Piaci megnevezések (ESCO):* értékesítési és marketingigazgató, kereskedelmi igazgató, aukciósház-igazgató, aukciósház-vezető, aukciósház igazgatója

A marketingigazgatók egy vállalatnál a magas szintű marketingműveleteket kezelik. Koordinálják a marketing-, promóciós és reklámtevékenységekkel kapcsolatos valamennyi tevékenységeket az egységek vagy földrajzi területek között.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 71.4%-a jelölte

**Holland-kód:** ECS — R 8 · I 11 · A 6 · S 40 · E 100 · C 76

**HEXACO differenciál cél-profil:** X cél 72±15 (w=0.43) · H cél 32±18 (w=0.34) · E cél 43±25 (w=0.13)

**HEXACO abszolút szint:** H 45 · E 40 · X 71 · A 58 · C 53 · O 56

### kommunikációs vezető

`11-2032.00` · **ISCO-08 1222** Reklám- és PR-vezetők · **FEOR-08:** 1416 Reklám-, PR- és egyéb kommunikációs tevékenységet folytató egység vezetője · ESCO `1222.1.2` · EN: Public Relations Managers

*Piaci megnevezések (ESCO):* belső kommunikációs menedzser, kommunikációs menedzser

A kommunikációs vezetők szóvivőkként a vállalat által kiadott közleményeket kommunikálják mind a belső, mind a külső ügyfelek számára.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** ECS — R 0 · I 22 · A 44 · S 53 · E 100 · C 56

**HEXACO differenciál cél-profil:** X cél 67±19 (w=0.27) · H cél 35±20 (w=0.24) · C cél 40±23 (w=0.17) · A cél 59±24 (w=0.14)

**HEXACO abszolút szint:** H 51 · E 36 · X 72 · A 67 · C 54 · O 62

### Kutatási és fejlesztési vezetők

`11-9041.00` · **ISCO-08 1223** Kutatási és fejlesztési vezetők · **FEOR-08:** 1413 Kutatási és fejlesztési tevékenységet folytató egység vezetője · ESCO `1223` · EN: Architectural and Engineering Managers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Plan, direct, or coordinate activities in such fields as architecture and engineering or research and development in these fields.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: alapszak (BA/BSc) · a válaszadók 45.5%-a jelölte

**Holland-kód:** EIC — R 33 · I 59 · A 27 · S 32 · E 90 · C 57

**HEXACO differenciál cél-profil:** X cél 61±22 (w=0.27) · H cél 39±23 (w=0.26) · O cél 61±23 (w=0.25) · A cél 45±26 (w=0.13)

**HEXACO abszolút szint:** H 52 · E 43 · X 65 · A 56 · C 58 · O 65

### Kutatási és fejlesztési vezetők

`11-9121.00` · **ISCO-08 1223** Kutatási és fejlesztési vezetők · **FEOR-08:** 1413 Kutatási és fejlesztési tevékenységet folytató egység vezetője · ESCO `1223.2` · EN: Natural Sciences Managers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* kutatás-fejlesztési menedzser, kutatási és fejlesztési tevékenységet folytató egység vezetője, kutatás-fejlesztési egység/szervezet vezetője

A kutatás-fejlesztési menedzserek koordinálják a tudósok, a tudományos kutatók, a termékfejlesztők és a piackutatók erőfeszítéseit új termékek létrehozása, aktuális termékek vagy más kutatási tevékenységek fejlesztése érdekében, beleértve a tudományos kutatást is.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: alapszak (BA/BSc) · a válaszadók 35.1%-a jelölte

**Holland-kód:** IEC — R 29 · I 81 · A 24 · S 35 · E 77 · C 54

**HEXACO differenciál cél-profil:** O cél 66±19 (w=0.36) · H cél 37±21 (w=0.30) · X cél 59±24 (w=0.19)

**HEXACO abszolút szint:** H 52 · E 42 · X 64 · A 58 · C 58 · O 69

### Kutatási és fejlesztési vezetők

`11-9121.01` · **ISCO-08 1223** Kutatási és fejlesztési vezetők · **FEOR-08:** 1413 Kutatási és fejlesztési tevékenységet folytató egység vezetője · ESCO `1223.2` · EN: Clinical Research Coordinators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* kutatás-fejlesztési menedzser, kutatási és fejlesztési tevékenységet folytató egység vezetője, kutatás-fejlesztési egység/szervezet vezetője

A kutatás-fejlesztési menedzserek koordinálják a tudósok, a tudományos kutatók, a termékfejlesztők és a piackutatók erőfeszítéseit új termékek létrehozása, aktuális termékek vagy más kutatási tevékenységek fejlesztése érdekében, beleértve a tudományos kutatást is.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 60.1%-a jelölte

**Holland-kód:** ICE — R 10 · I 82 · A 13 · S 43 · E 55 · C 64

**HEXACO differenciál cél-profil:** C cél 45±27 (w=0.29) · E cél 53±28 (w=0.19) · A cél 53±28 (w=0.17) · O cél 53±28 (w=0.17)

**HEXACO abszolút szint:** H 63 · E 44 · X 60 · A 62 · C 60 · O 60

### Halgazdálkodási és halászati termelési vezetők

`45-1011.00` · **ISCO-08 1312** Halgazdálkodási és halászati termelési vezetők · **FEOR-08:** 1311 Mezőgazdasági, erdészeti, halászati és vadászati tevékenységet folytató egység vezetője · ESCO `1312.1` · EN: First-Line Supervisors of Farming, Fishing, and Forestry Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* akvakultúra-betakarítási menedzser, halgazdaság halászati menedzsere, akvakultúra-betakarítási felügyelő, akvakultúrás-tenyésztési menedzser, halgazdasági tenyésztési menedzser, tenyésztési menedzser

Az akvakultúra-betakarítási menedzserek a vízi szervezetek betakarítását szabályozzák, ami magában foglalja a betakarítási folyamatokhoz használt technikák és berendezések ismeretét.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 32.9%-a jelölte

**Holland-kód:** ERC — R 76 · I 20 · A 0 · S 32 · E 84 · C 61

**HEXACO differenciál cél-profil:** X cél 64±21 (w=0.48) · O cél 41±24 (w=0.33)

**HEXACO abszolút szint:** H 51 · E 49 · X 61 · A 53 · C 50 · O 44

### Feldolgozóipari vezetők

`11-3051.00` · **ISCO-08 1321** Feldolgozóipari vezetők · **FEOR-08:** 1312 Ipari tevékenységet folytató egység vezetője · ESCO `1321.2.1` · EN: Industrial Production Managers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Plan, direct, or coordinate the work activities and resources necessary for manufacturing products in accordance with cost, quality, and quantity specifications.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 29.4%-a jelölte

**Holland-kód:** ECR — R 50 · I 32 · A 7 · S 14 · E 84 · C 70

**HEXACO differenciál cél-profil:** X cél 61±22 (w=0.40) · H cél 41±24 (w=0.32) · A cél 47±28 (w=0.12) · E cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 52 · E 42 · X 63 · A 55 · C 59 · O 55

### Feldolgozóipari vezetők

`11-3051.01` · **ISCO-08 1321** Feldolgozóipari vezetők · **FEOR-08:** 1312 Ipari tevékenységet folytató egység vezetője · ESCO `1321.2.2` · EN: Quality Control Systems Managers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Plan, direct, or coordinate quality assurance programs. Formulate quality control policies and control quality of laboratory and production efforts.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 100.0%-a jelölte

**Holland-kód:** CEI — R 43 · I 52 · A 5 · S 18 · E 68 · C 74

**HEXACO differenciál cél-profil:** X cél 55±27 (w=0.23) · C cél 55±27 (w=0.22) · A cél 46±27 (w=0.20) · E cél 54±27 (w=0.20)

**HEXACO abszolút szint:** H 57 · E 47 · X 59 · A 55 · C 65 · O 55

### építési szakipari építésvezető

`11-9021.00` · **ISCO-08 1323** Építési vezetők · **FEOR-08:** 1313 Építőipari tevékenységet folytató egység vezetője · ESCO `1323.1` · EN: Construction Managers

*Piaci megnevezések (ESCO):* építési szakipari fő-építésvezető, mélyépítési építésvezető

Az építési szakipari építésvezető építési projektek tervezéséért és koordinálásáért felelősek. Szakértői segítséget nyújtanak az építési projektek tervezési szakaszában, elősegítve a költségek és a funkcionális vonzatok pontosabb becslését.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 40.0%-a jelölte

**Holland-kód:** ECR — R 61 · I 36 · A 12 · S 22 · E 79 · C 63

**HEXACO differenciál cél-profil:** X cél 62±22 (w=0.41) · H cél 42±25 (w=0.29) · E cél 44±26 (w=0.20)

**HEXACO abszolút szint:** H 54 · E 40 · X 65 · A 58 · C 60 · O 55

### Beszerzési, elosztási értékesítési és hasonló vezetők

`11-3061.00` · **ISCO-08 1324** Beszerzési, elosztási értékesítési és hasonló vezetők · **FEOR-08:** 1321 Szállítási, logisztikai és raktározási tevékenységet folytató egység vezetője · ESCO `1324.8.2` · EN: Purchasing Managers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Plan, direct, or coordinate the activities of buyers, purchasing officers, and related workers involved in purchasing materials, products, and services. Includes wholesale or retail trade merchandising managers and procurement managers.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 52.6%-a jelölte

**Holland-kód:** ECS — R 25 · I 13 · A 3 · S 28 · E 100 · C 83

**HEXACO differenciál cél-profil:** X cél 62±22 (w=0.57) · H cél 45±27 (w=0.21) · A cél 48±28 (w=0.10)

**HEXACO abszolút szint:** H 53 · E 47 · X 62 · A 54 · C 57 · O 53

### Beszerzési, elosztási értékesítési és hasonló vezetők

`11-3071.04` · **ISCO-08 1324** Beszerzési, elosztási értékesítési és hasonló vezetők · **FEOR-08:** 1321 Szállítási, logisztikai és raktározási tevékenységet folytató egység vezetője · ESCO `1324.8` · EN: Supply Chain Managers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* logisztikai és disztribúciós vezető, logisztikai vezető, disztribúciós vezető

_(HU leírás nincs; EN:)_ Direct or coordinate production, purchasing, warehousing, distribution, or financial forecasting services or activities to limit costs and improve accuracy, customer service, or safety.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 66.7%-a jelölte

**Holland-kód:** ECR — R 40 · I 24 · A 0 · S 17 · E 87 · C 71

**HEXACO differenciál cél-profil:** H cél 42±25 (w=0.31) · X cél 58±25 (w=0.29) · O cél 55±26 (w=0.20) · E cél 46±27 (w=0.15)

**HEXACO abszolút szint:** H 52 · E 43 · X 60 · A 55 · C 58 · O 59

### logisztikai és disztribúciós vezető

`11-3071.00` · **ISCO-08 1324** Beszerzési, elosztási értékesítési és hasonló vezetők · **FEOR-08:** 1321 Szállítási, logisztikai és raktározási tevékenységet folytató egység vezetője · ESCO `1324.3.1` · EN: Transportation, Storage, and Distribution Managers

*Piaci megnevezések (ESCO):* logisztikai vezető, disztribúciós vezető

A logisztikai és disztribúciós vezetők döntéseket hoznak a logisztikai szolgáltatásokról, a műveletekről és az anyagellátásról. Külső és belső változókat vesznek figyelembe a hatékony és sikeres szervezeti logisztikai szolgáltatások biztosítása érdekében.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** ECR — R 43 · I 27 · A 0 · S 23 · E 83 · C 79

**HEXACO differenciál cél-profil:** X cél 60±24 (w=0.49) · H cél 44±26 (w=0.32) · E cél 48±28 (w=0.13)

**HEXACO abszolút szint:** H 54 · E 43 · X 62 · A 56 · C 58 · O 55

### Információs szolgáltatások vezetői folytató egység vezetője

`11-3021.00` · **ISCO-08 1330** Információs szolgáltatások vezetői folytató egység vezetője · **FEOR-08:** — · ESCO `1330.2` · EN: Computer and Information Systems Managers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* informatikai igazgató, informatikai igazgatók, chief information officer, infokommunikációs üzemeltetési menedzser, IT folyamatmenedzser, IKT üzemeltetési menedzser

Az informatikai igazgatók meghatározzák és megvalósítják az információs és kommunikációs technológiákra vonatkozó stratégiát és irányítást.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 47.7%-a jelölte

**Holland-kód:** CEI — R 28 · I 58 · A 8 · S 22 · E 68 · C 82

**HEXACO differenciál cél-profil:** O cél 62±22 (w=0.38) · H cél 42±24 (w=0.26) · X cél 57±26 (w=0.20) · C cél 46±27 (w=0.13)

**HEXACO abszolút szint:** H 54 · E 43 · X 62 · A 58 · C 58 · O 66

### infokommunikációs projektmenedzser

`15-1299.09` · **ISCO-08 1330** Információs szolgáltatások vezetői folytató egység vezetője · **FEOR-08:** — · ESCO `1330.7` · EN: Information Technology Project Managers

*Piaci megnevezések (ESCO):* IKT projektmenedzser, IT projektvezető, informatikai igazgató, informatikai igazgatók, chief information officer, technológiai igazgató

Az infokommunikációs projektmenedzserek ütemezik, ellenőrzik és irányítják az erőforrásokat, a munkatársakat, a finanszírozást és a létesítményeket az IKT-projektek célkitűzéseinek elérése érdekében.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 38.1%-a jelölte

**Holland-kód:** ECI — R 12 · I 48 · A 13 · S 28 · E 82 · C 72

**HEXACO differenciál cél-profil:** H cél 38±22 (w=0.34) · X cél 60±23 (w=0.30) · O cél 55±27 (w=0.14) · E cél 46±28 (w=0.11)

**HEXACO abszolút szint:** H 54 · E 39 · X 66 · A 61 · C 62 · O 62

### Egészségügyi szolgáltatások vezetői

`11-9111.00` · **ISCO-08 1342** Egészségügyi szolgáltatások vezetői · **FEOR-08:** 1327 Egészségügyi tevékenységet folytató egység vezetője · ESCO `1342` · EN: Medical and Health Services Managers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* egészségügyi tevékenységet folytató egység vezetője, egészségügyi szolgáltató egység/szervezet vezetője, műtő vezetője

_(HU leírás nincs; EN:)_ Plan, direct, or coordinate medical and health services in hospitals, clinics, managed care organizations, public health agencies, or similar organizations.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 46.4%-a jelölte

**Holland-kód:** ECS — R 18 · I 46 · A 8 · S 57 · E 82 · C 70

**HEXACO differenciál cél-profil:** X cél 58±24 (w=0.33) · C cél 44±26 (w=0.24) · H cél 45±27 (w=0.18) · A cél 54±27 (w=0.15)

**HEXACO abszolút szint:** H 62 · E 40 · X 68 · A 66 · C 63 · O 61

### szociális tevékenységet folytató egység vezetője

`11-9151.00` · **ISCO-08 1344** Szociális szolgáltatások vezetői · **FEOR-08:** 1324 Szociális tevékenységet folytató egység vezetője · ESCO `1344.1` · EN: Social and Community Service Managers

*Piaci megnevezések (ESCO):* közösségi szolgálat vezetője, otthonvezető

A szociális tevékenységet folytató egységek vezetői felelnek a stratégiai és műveleti irányításért, valamint a személyzeti csoportok és erőforrások irányításáért a szociális szolgálatokon belül és között.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 50.4%-a jelölte

**Holland-kód:** ESC — R 0 · I 20 · A 24 · S 74 · E 100 · C 54

**HEXACO differenciál cél-profil:** X cél 61±23 (w=0.30) · C cél 39±23 (w=0.29) · A cél 56±26 (w=0.15) · H cél 54±27 (w=0.11)

**HEXACO abszolút szint:** H 66 · E 41 · X 69 · A 66 · C 54 · O 56

### Oktatási vezetők

`11-9032.00` · **ISCO-08 1345** Oktatási vezetők · **FEOR-08:** 1328 Oktatási-nevelési tevékenységet folytató egység vezetője · ESCO `1345.1.4` · EN: Education Administrators, Kindergarten through Secondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* iskolaigazgató, iskolavezető, oktatási igazgató

Az iskolaigazgatók irányítják az oktatási intézmények napi tevékenységeit. Döntéseket hoznak a felvételi eljárással kapcsolatban, felelnek a tantervi normák betartásáért, amelyek megkönnyítik a tanulók számára a tudományos fejlődést.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 60.7%-a jelölte

**Holland-kód:** SEC — R 5 · I 34 · A 31 · S 79 · E 72 · C 61

**HEXACO differenciál cél-profil:** X cél 64±21 (w=0.45) · C cél 41±24 (w=0.29) · H cél 46±28 (w=0.12)

**HEXACO abszolút szint:** H 61 · E 40 · X 71 · A 63 · C 58 · O 61

### Máshová nem sorolható szakmai szolgáltatások vezetői 1329 Egyéb szolgáltatást nyújtó egység vezetője

`11-3012.00` · **ISCO-08 1349** Máshová nem sorolható szakmai szolgáltatások vezetői 1329 Egyéb szolgáltatást nyújtó egység vezetője · **FEOR-08:** — · ESCO `1349.16` · EN: Administrative Services Managers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* könyvtári igazgató, könyvtárvezető, büntetés-végrehajtási intézet vezetője, börtönparancsnok, büntetés-végrehajtási intézet parancsnoka

A könyvtárak igazgatói felügyelik a könyvtári eszközök és tárgyak helyes használatát. Egy könyvtár szolgáltatásait és a könyvtáron belüli részlegek tevékenységeit irányítják.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 33.6%-a jelölte

**Holland-kód:** ECS — R 7 · I 19 · A 2 · S 46 · E 91 · C 88

**HEXACO differenciál cél-profil:** X cél 60±23 (w=0.34) · H cél 43±25 (w=0.24) · A cél 55±27 (w=0.16) · E cél 54±28 (w=0.13)

**HEXACO abszolút szint:** H 48 · E 51 · X 58 · A 55 · C 50 · O 50

### szálláshely-szolgáltatási tevékenységeket folytató egység vezetője

`11-9081.00` · **ISCO-08 1411** Szállodaigazgatók · **FEOR-08:** 1331 Szálláshely-szolgáltatási tevékenységet folytató egység vezetője · ESCO `1411.1` · EN: Lodging Managers

*Piaci megnevezések (ESCO):* vendéglátó egység menedzsere, vendéglátóipari menedzser

A szálláshely-szolgáltatási tevékenységeket folytató egységek vezetői felelnek a műveletek irányításáért és a vendéglátóipari létesítmény stratégiájának felügyeletéért.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 71.6%-a jelölte

**Holland-kód:** ECS — R 28 · I 2 · A 7 · S 55 · E 87 · C 70

**HEXACO differenciál cél-profil:** X cél 64±21 (w=0.34) · O cél 42±24 (w=0.21) · A cél 57±25 (w=0.18) · C cél 43±26 (w=0.17)

**HEXACO abszolút szint:** H 58 · E 42 · X 67 · A 63 · C 53 · O 50

### Étteremvezetők

`11-9051.00` · **ISCO-08 1412** Étteremvezetők · **FEOR-08:** 1332 Vendéglátó tevékenységet folytató egység vezetője · ESCO `1412.1` · EN: Food Service Managers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* konyhavezető étterem vezető, étterem vezetők, étterem menedzser

Az étteremvezetők feladata a konyhai és egyéb étel- és italértékesítési helyeken, illetve a vendéglátóiparban működő egységekben az élelmiszer- és italkészítés irányítása.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 29.7%-a jelölte

**Holland-kód:** ECR — R 53 · I 16 · A 10 · S 42 · E 83 · C 68

**HEXACO differenciál cél-profil:** X cél 63±21 (w=0.32) · O cél 43±25 (w=0.18) · H cél 43±25 (w=0.17) · A cél 56±26 (w=0.16)

**HEXACO abszolút szint:** H 53 · E 43 · X 65 · A 61 · C 54 · O 50

### Étteremvezetők

`35-1012.00` · **ISCO-08 1412** Étteremvezetők · **FEOR-08:** 1332 Vendéglátó tevékenységet folytató egység vezetője · ESCO `1412.1` · EN: First-Line Supervisors of Food Preparation and Serving Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* konyhavezető étterem vezető, étterem vezetők, étterem menedzser

Az étteremvezetők feladata a konyhai és egyéb étel- és italértékesítési helyeken, illetve a vendéglátóiparban működő egységekben az élelmiszer- és italkészítés irányítása.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 69.6%-a jelölte

**Holland-kód:** ECR — R 60 · I 6 · A 4 · S 40 · E 89 · C 62

**HEXACO differenciál cél-profil:** X cél 65±20 (w=0.35) · O cél 40±23 (w=0.25) · C cél 43±25 (w=0.17) · A cél 56±26 (w=0.14)

**HEXACO abszolút szint:** H 55 · E 44 · X 64 · A 59 · C 49 · O 46

### Kis- és nagykereskedelmi vezetők

`41-1011.00` · **ISCO-08 1420** Kis- és nagykereskedelmi vezetők · **FEOR-08:** 1333 Kereskedelmi tevékenységet folytató egység vezetője · ESCO `1420.2` · EN: First-Line Supervisors of Retail Sales Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* áruházi osztály-, részlegvezető, outlet áruház részlegvezetője, áruházi osztályvezető, áruházvezető, diszkontáruház vezetője, kiskereskedelmi értékesítési vezető

Az áruházi osztályok vezetői felelősek az üzlet valamely részlegén végzett tevékenységekért és a személyzetért.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 51.7%-a jelölte

**Holland-kód:** ECS — R 29 · I 2 · A 0 · S 44 · E 100 · C 77

**HEXACO differenciál cél-profil:** X cél 66±20 (w=0.39) · O cél 41±24 (w=0.23) · A cél 55±26 (w=0.13) · C cél 45±26 (w=0.13)

**HEXACO abszolút szint:** H 56 · E 43 · X 67 · A 60 · C 53 · O 49

### Kis- és nagykereskedelmi vezetők

`41-1012.00` · **ISCO-08 1420** Kis- és nagykereskedelmi vezetők · **FEOR-08:** 1333 Kereskedelmi tevékenységet folytató egység vezetője · ESCO `1420.4` · EN: First-Line Supervisors of Non-Retail Sales Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* boltvezető, butik vezetője, kiskereskedelmi bolt vezetője, szupermarket vezetője, diszkontáruház vezetője, élelmiszer-szupermarket vezetője

A boltvezetők felelősek a szaküzletekben végzett tevékenységekért és a személyzetért.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 45.0%-a jelölte

**Holland-kód:** ECS — R 12 · I 2 · A 0 · S 51 · E 100 · C 72

**HEXACO differenciál cél-profil:** X cél 67±18 (w=0.47) · H cél 41±24 (w=0.25) · C cél 45±27 (w=0.13)

**HEXACO abszolút szint:** H 50 · E 45 · X 67 · A 57 · C 52 · O 52

### Máshová nem sorolható szolgáltatások vezetői

`39-1022.00` · **ISCO-08 1439** Máshová nem sorolható szolgáltatások vezetői · **FEOR-08:** 1334 Üzleti szolgáltatási tevékenységet folytató egység vezetője 1.; 1339 Egyéb kereskedelmi, vendéglátó és hasonló szolgáltatási tevékenységet folytató egység vezetője · ESCO `1439.5` · EN: First-Line Supervisors of Personal Service Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* turisztikai információs központ menedzser, turisztikai információs központ irányítója, turisztikai információs központ koordinátora, utazási iroda menedzsere, utazási iroda vezetője, utazási iroda igazgatója

A turisztikai információs központok menedzserei felelősek egy olyan központ alkalmazottainak és tevékenységeinek irányításáért, amely tájékoztatást és tanácsadást nyújt az utazóknak és a látogatóknak a helyi látványosságokról, az eseményekről, az utazásokról és a szállásokról.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 47.8%-a jelölte

**Holland-kód:** ECS — R 40 · I 2 · A 2 · S 50 · E 98 · C 68

**HEXACO differenciál cél-profil:** X cél 64±20 (w=0.35) · O cél 41±24 (w=0.22) · C cél 41±24 (w=0.22) · A cél 56±26 (w=0.15)

**HEXACO abszolút szint:** H 59 · E 45 · X 66 · A 60 · C 49 · O 48


## 2 — Felsőfokú képzettséget igénylő foglalkozások

### vegyész

`19-2031.00` · **ISCO-08 2113** Kémikusok · **FEOR-08:** 2164 Kémikus · ESCO `2113.1` · EN: Chemists

*Piaci megnevezések (ESCO):* textilvegyész, vegyi analitikus

A vegyészek laboratóriumi kutatásokat végeznek anyagok kémiai szerkezetének tesztelése és elemzése révén. A kutatási eredményeket ipari gyártási eljárások során használják fel, amelyeket termékek fejlesztése vagy javítása során alkalmaznak.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 55.9%-a jelölte

**Holland-kód:** IRC — R 78 · I 95 · A 9 · S 2 · E 10 · C 64

**HEXACO differenciál cél-profil:** O cél 72±15 (w=0.40) · A cél 38±22 (w=0.21) · X cél 41±24 (w=0.15) · H cél 44±26 (w=0.11)

**HEXACO abszolút szint:** H 49 · E 50 · X 47 · A 45 · C 58 · O 68

### Matematikusok, biztosításmatematikusok (aktuáriusok) és statisztikusok és statisztikusok

`15-2031.00` · **ISCO-08 2120** Matematikusok, biztosításmatematikusok (aktuáriusok) és statisztikusok és statisztikusok · **FEOR-08:** 2166 Matematikus; 2625 Statisztikus · ESCO `2120` · EN: Operations Research Analysts · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Formulate and apply mathematical modeling and other optimizing methods to develop and interpret information that assists management with decisionmaking, policy formulation, or other managerial functions.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 42.9%-a jelölte

**Holland-kód:** ICE — R 15 · I 88 · A 20 · S 17 · E 36 · C 79

**HEXACO differenciál cél-profil:** O cél 70±16 (w=0.53) · A cél 40±23 (w=0.26) · H cél 45±27 (w=0.13)

**HEXACO abszolút szint:** H 51 · E 48 · X 52 · A 47 · C 53 · O 67

### statisztikus

`15-2041.00` · **ISCO-08 2120** Matematikusok, biztosításmatematikusok (aktuáriusok) és statisztikusok és statisztikusok · **FEOR-08:** 2166 Matematikus; 2625 Statisztikus · ESCO `2120.6` · EN: Statisticians

*Piaci megnevezések (ESCO):* bűnügyi statisztikus, energetikai statisztikus, demográfus, népességszociológus, népességstatisztikus

A statisztikusok különböző területekről származó kvantitatív információkat, adatokat gyűjtenek, csoportosítanak, és – ami a legfontosabb – elemeznek.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 61.9%-a jelölte

**Holland-kód:** ICR — R 19 · I 93 · A 13 · S 12 · E 14 · C 84

**HEXACO differenciál cél-profil:** O cél 72±16 (w=0.36) · A cél 34±20 (w=0.26) · X cél 38±22 (w=0.19)

**HEXACO abszolút szint:** H 49 · E 54 · X 42 · A 39 · C 55 · O 65

### Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak

`19-1042.00` · **ISCO-08 2131** Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak · **FEOR-08:** 2167 Biológus, botanikus, zoológus és rokon foglalkozású; 2169 Egyéb természettudományi foglalkozású · ESCO `2131.4.12` · EN: Medical Scientists, Except Epidemiologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* biológus, halbiológus, gombaszakértő, immunológus, immunológiai elemző, immunológiai kutató

A biológusok az élő szervezeteket és a tágabb értelemben életet tanulmányozzák a környezettel együtt. A kutatás révén arra törekednek, hogy elmagyarázzák a szervezetek funkcionális mechanizmusait, kölcsönhatásait és fejlődését.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 35.9%-a jelölte

**Holland-kód:** IRC — R 54 · I 100 · A 24 · S 38 · E 20 · C 45

**HEXACO differenciál cél-profil:** O cél 67±18 (w=0.42) · A cél 40±23 (w=0.25) · X cél 44±26 (w=0.14)

**HEXACO abszolút szint:** H 58 · E 45 · X 53 · A 51 · C 63 · O 69

### biológus

`19-1021.00` · **ISCO-08 2131** Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak · **FEOR-08:** 2167 Biológus, botanikus, zoológus és rokon foglalkozású; 2169 Egyéb természettudományi foglalkozású · ESCO `2131.4.2` · EN: Biochemists and Biophysicists

*Piaci megnevezések (ESCO):* halbiológus, gombaszakértő, bioinformatikus, bioinformatikai mérnök, bioinformatikus mérnök, immunológus

A biológusok az élő szervezeteket és a tágabb értelemben életet tanulmányozzák a környezettel együtt. A kutatás révén arra törekednek, hogy elmagyarázzák a szervezetek funkcionális mechanizmusait, kölcsönhatásait és fejlődését.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 40.0%-a jelölte

**Holland-kód:** IRC — R 68 · I 100 · A 27 · S 19 · E 14 · C 44

**HEXACO differenciál cél-profil:** O cél 70±16 (w=0.50) · A cél 37±21 (w=0.31)

**HEXACO abszolút szint:** H 54 · E 48 · X 52 · A 46 · C 55 · O 69

### biológus

`19-1022.00` · **ISCO-08 2131** Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak · **FEOR-08:** 2167 Biológus, botanikus, zoológus és rokon foglalkozású; 2169 Egyéb természettudományi foglalkozású · ESCO `2131.4.10` · EN: Microbiologists

*Piaci megnevezések (ESCO):* halbiológus, gombaszakértő, immunológus, immunológiai elemző, immunológiai kutató

A biológusok az élő szervezeteket és a tágabb értelemben életet tanulmányozzák a környezettel együtt. A kutatás révén arra törekednek, hogy elmagyarázzák a szervezetek funkcionális mechanizmusait, kölcsönhatásait és fejlődését.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 63.6%-a jelölte

**Holland-kód:** IRC — R 72 · I 100 · A 15 · S 16 · E 1 · C 48

**HEXACO differenciál cél-profil:** O cél 70±16 (w=0.41) · A cél 36±20 (w=0.28) · X cél 43±26 (w=0.14)

**HEXACO abszolút szint:** H 52 · E 49 · X 48 · A 44 · C 59 · O 68

### biológus

`19-1029.02` · **ISCO-08 2131** Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak · **FEOR-08:** 2167 Biológus, botanikus, zoológus és rokon foglalkozású; 2169 Egyéb természettudományi foglalkozású · ESCO `2131.4` · EN: Molecular and Cellular Biologists

*Piaci megnevezések (ESCO):* halbiológus, gombaszakértő, bioinformatikus, bioinformatikai mérnök, bioinformatikus mérnök, immunológus

A biológusok az élő szervezeteket és a tágabb értelemben életet tanulmányozzák a környezettel együtt. A kutatás révén arra törekednek, hogy elmagyarázzák a szervezetek funkcionális mechanizmusait, kölcsönhatásait és fejlődését.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: alapszak (BA/BSc) · a válaszadók 34.6%-a jelölte

**Holland-kód:** ICR — R 67 · I 94 · A 16 · S 21 · E 26 · C 68

**HEXACO differenciál cél-profil:** O cél 70±17 (w=0.47) · A cél 37±22 (w=0.30) · H cél 44±26 (w=0.15)

**HEXACO abszolút szint:** H 53 · E 45 · X 54 · A 48 · C 60 · O 69

### biológus

`19-1029.04` · **ISCO-08 2131** Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak · **FEOR-08:** 2167 Biológus, botanikus, zoológus és rokon foglalkozású; 2169 Egyéb természettudományi foglalkozású · ESCO `2131.4` · EN: Biologists

*Piaci megnevezések (ESCO):* halbiológus, gombaszakértő, bioinformatikus, bioinformatikai mérnök, bioinformatikus mérnök, immunológus

A biológusok az élő szervezeteket és a tágabb értelemben életet tanulmányozzák a környezettel együtt. A kutatás révén arra törekednek, hogy elmagyarázzák a szervezetek funkcionális mechanizmusait, kölcsönhatásait és fejlődését.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 55.0%-a jelölte

**Holland-kód:** ICR — R 52 · I 100 · A 23 · S 27 · E 29 · C 58

**HEXACO differenciál cél-profil:** O cél 71±16 (w=0.49) · A cél 41±24 (w=0.20) · E cél 58±25 (w=0.18) · C cél 45±27 (w=0.11)

**HEXACO abszolút szint:** H 54 · E 52 · X 53 · A 48 · C 49 · O 68

### Ipari és termelési mérnökök

`13-1081.00` · **ISCO-08 2141** Ipari és termelési mérnökök · **FEOR-08:** 3161 Munka- és termelésszervező; 3162 Energetikus; 3163 Munkavédelmi és üzembiztonsági foglalkozású · ESCO `2141.7` · EN: Logisticians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* karbantartási mérnök, karbantartó mérnök

A karbantartási mérnökök munkája a berendezések, az eljárások, a gépek és az infrastruktúra optimalizálására koncentrálódik. Biztosítják ezek lehető legjobb mértékű elérhetőségét a lehető legkisebb költségekkel.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 75.0%-a jelölte

**Holland-kód:** CEI — R 22 · I 47 · A 2 · S 22 · E 67 · C 74

**HEXACO differenciál cél-profil:** X cél 56±26 (w=0.41) · H cél 46±27 (w=0.30) · A cél 52±29 (w=0.12) · C cél 48±29 (w=0.10)

**HEXACO abszolút szint:** H 55 · E 45 · X 60 · A 58 · C 57 · O 56

### bőráruipari gyártásszervező

`17-2112.00` · **ISCO-08 2141** Ipari és termelési mérnökök · **FEOR-08:** 3161 Munka- és termelésszervező; 3162 Energetikus; 3163 Munkavédelmi és üzembiztonsági foglalkozású · ESCO `2141.4` · EN: Industrial Engineers

*Piaci megnevezések (ESCO):* bőripari technikus, bőripari üzemmérnök, textiltechnológus, textiltechnológiai mérnök, textilmérnök

A bőráruipari gyártásszervezők elemzik a termékleírásokat, meghatározzák a termelési műveleteket és azok sorrendjét, pontosítják a munkamódszereket, gyártási időket számítanak időmérési technikák segítségével.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 58.6%-a jelölte

**Holland-kód:** CIR — R 66 · I 66 · A 10 · S 6 · E 38 · C 72

**HEXACO differenciál cél-profil:** O cél 64±21 (w=0.42) · H cél 43±25 (w=0.22) · A cél 44±26 (w=0.19)

**HEXACO abszolút szint:** H 50 · E 49 · X 56 · A 50 · C 55 · O 63

### bőráruipari gyártásszervező

`17-2112.03` · **ISCO-08 2141** Ipari és termelési mérnökök · **FEOR-08:** 3161 Munka- és termelésszervező; 3162 Energetikus; 3163 Munkavédelmi és üzembiztonsági foglalkozású · ESCO `2141.4.1` · EN: Manufacturing Engineers

*Piaci megnevezések (ESCO):* bőripari technikus, bőripari üzemmérnök, textiltechnológus, textiltechnológiai mérnök, textilmérnök

A bőráruipari gyártásszervezők elemzik a termékleírásokat, meghatározzák a termelési műveleteket és azok sorrendjét, pontosítják a munkamódszereket, gyártási időket számítanak időmérési technikák segítségével.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 76.0%-a jelölte

**Holland-kód:** RIC — R 71 · I 59 · A 20 · S 10 · E 35 · C 57

**HEXACO differenciál cél-profil:** O cél 64±20 (w=0.44) · H cél 41±24 (w=0.28) · A cél 46±27 (w=0.14)

**HEXACO abszolút szint:** H 48 · E 47 · X 54 · A 50 · C 55 · O 64

### karbantartási mérnök

`13-1081.02` · **ISCO-08 2141** Ipari és termelési mérnökök · **FEOR-08:** 3161 Munka- és termelésszervező; 3162 Energetikus; 3163 Munkavédelmi és üzembiztonsági foglalkozású · ESCO `2141.7` · EN: Logistics Analysts

*Piaci megnevezések (ESCO):* karbantartó mérnök

A karbantartási mérnökök munkája a berendezések, az eljárások, a gépek és az infrastruktúra optimalizálására koncentrálódik. Biztosítják ezek lehető legjobb mértékű elérhetőségét a lehető legkisebb költségekkel.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 63.6%-a jelölte

**Holland-kód:** CEI — R 31 · I 51 · A 0 · S 9 · E 58 · C 96

**HEXACO differenciál cél-profil:** O cél 59±24 (w=0.36) · A cél 45±27 (w=0.20) · H cél 46±27 (w=0.15) · C cél 53±28 (w=0.13)

**HEXACO abszolút szint:** H 47 · E 50 · X 47 · A 46 · C 52 · O 56

### Építőmérnökök

`17-2051.00` · **ISCO-08 2142** Építőmérnökök · **FEOR-08:** 2116 Építőmérnök · ESCO `2142` · EN: Civil Engineers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Perform engineering duties in planning, designing, and overseeing construction and maintenance of building structures and facilities, such as roads, railroads, airports, bridges, harbors, channels, dams, irrigation projects, pipelines, power plants, and water and sewage systems.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 85.7%-a jelölte

**Holland-kód:** RIC — R 90 · I 69 · A 20 · S 12 · E 28 · C 60

**HEXACO differenciál cél-profil:** O cél 61±23 (w=0.39) · H cél 43±26 (w=0.24) · A cél 43±26 (w=0.24) · X cél 53±28 (w=0.12)

**HEXACO abszolút szint:** H 52 · E 46 · X 57 · A 51 · C 58 · O 62

### Építőmérnökök

`17-2051.01` · **ISCO-08 2142** Építőmérnökök · **FEOR-08:** 2116 Építőmérnök · ESCO `2142` · EN: Transportation Engineers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Develop plans for surface transportation projects, according to established engineering standards and state or federal construction policy. Prepare designs, specifications, or estimates for transportation facilities.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 77.3%-a jelölte

**Holland-kód:** RIC — R 73 · I 68 · A 19 · S 16 · E 35 · C 57

**HEXACO differenciál cél-profil:** O cél 60±23 (w=0.37) · A cél 43±26 (w=0.24) · H cél 45±27 (w=0.17) · C cél 53±28 (w=0.10)

**HEXACO abszolút szint:** H 50 · E 49 · X 51 · A 48 · C 57 · O 60

### Környezetvédelmi mérnökök

`19-2041.00` · **ISCO-08 2143** Környezetvédelmi mérnökök · **FEOR-08:** 2168 Környezetfelmérő, -tanácsadó · ESCO `2143.1` · EN: Environmental Scientists and Specialists, Including Health · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* környezetmérnök, természetvédelmi mérnök, környezetvédelmi mérnök, környezetvédelmi szakértő, környezettechnológiai mérnök

A környezetmérnökök környezetvédelmi és fenntartható intézkedéseket integrálnak különféle jellegű projektekbe. Céljuk a természeti erőforrások és természeti területek megőrzése.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 47.5%-a jelölte

**Holland-kód:** IRC — R 63 · I 100 · A 14 · S 29 · E 26 · C 55

**HEXACO differenciál cél-profil:** O cél 63±21 (w=0.52) · E cél 54±27 (w=0.17) · C cél 47±28 (w=0.13) · A cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 58 · E 48 · X 55 · A 54 · C 56 · O 65

### környezetmérnök

`17-2081.00` · **ISCO-08 2143** Környezetvédelmi mérnökök · **FEOR-08:** 2168 Környezetfelmérő, -tanácsadó · ESCO `2143.1` · EN: Environmental Engineers

*Piaci megnevezések (ESCO):* természetvédelmi mérnök, környezetvédelmi mérnök, környezetvédelmi szakértő, környezettechnológiai mérnök

A környezetmérnökök környezetvédelmi és fenntartható intézkedéseket integrálnak különféle jellegű projektekbe. Céljuk a természeti erőforrások és természeti területek megőrzése.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 61.9%-a jelölte

**Holland-kód:** IRC — R 70 · I 85 · A 16 · S 20 · E 36 · C 60

**HEXACO differenciál cél-profil:** O cél 63±21 (w=0.47) · A cél 45±27 (w=0.17) · H cél 46±28 (w=0.13) · E cél 53±28 (w=0.11)

**HEXACO abszolút szint:** H 55 · E 47 · X 57 · A 54 · C 57 · O 65

### gépészmérnök

`17-2141.00` · **ISCO-08 2144** Gépészmérnökök · **FEOR-08:** 2118 Gépészmérnök · ESCO `2144.1` · EN: Mechanical Engineers

*Piaci megnevezések (ESCO):* géptervező mérnök

A gépészmérnökök mechanikai termékeket és rendszereket kutatnak, terveznek és alakítanak ki, valamint felügyelik a rendszerek és termékek gyártását, üzemeltetését, alkalmazását, üzembe helyezését és javítását.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 52.3%-a jelölte

**Holland-kód:** RIC — R 90 · I 69 · A 17 · S 4 · E 16 · C 64

**HEXACO differenciál cél-profil:** O cél 66±19 (w=0.40) · A cél 38±22 (w=0.30) · H cél 44±26 (w=0.14)

**HEXACO abszolút szint:** H 49 · E 50 · X 51 · A 45 · C 56 · O 64

### gépészmérnök

`17-2141.02` · **ISCO-08 2144** Gépészmérnökök · **FEOR-08:** 2118 Gépészmérnök · ESCO `2144.1.3` · EN: Automotive Engineers

*Piaci megnevezések (ESCO):* géptervező mérnök

A gépészmérnökök mechanikai termékeket és rendszereket kutatnak, terveznek és alakítanak ki, valamint felügyelik a rendszerek és termékek gyártását, üzemeltetését, alkalmazását, üzembe helyezését és javítását.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 71.4%-a jelölte

**Holland-kód:** RIC — R 86 · I 78 · A 26 · S 6 · E 19 · C 51

**HEXACO differenciál cél-profil:** O cél 68±18 (w=0.54) · H cél 43±26 (w=0.20) · A cél 44±26 (w=0.19)

**HEXACO abszolút szint:** H 50 · E 47 · X 52 · A 49 · C 55 · O 66

### gépészmérnök

`17-2199.05` · **ISCO-08 2144** Gépészmérnökök · **FEOR-08:** 2118 Gépészmérnök · ESCO `2144.1.11` · EN: Mechatronics Engineers

*Piaci megnevezések (ESCO):* géptervező mérnök

A gépészmérnökök mechanikai termékeket és rendszereket kutatnak, terveznek és alakítanak ki, valamint felügyelik a rendszerek és termékek gyártását, üzemeltetését, alkalmazását, üzembe helyezését és javítását.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 66.1%-a jelölte

**Holland-kód:** RIC — R 78 · I 76 · A 24 · S 10 · E 12 · C 64

**HEXACO differenciál cél-profil:** O cél 70±17 (w=0.46) · A cél 39±23 (w=0.25) · H cél 41±24 (w=0.21)

**HEXACO abszolút szint:** H 47 · E 50 · X 51 · A 45 · C 55 · O 66

### vegyészmérnök

`17-2041.00` · **ISCO-08 2145** Vegyészmérnökök · **FEOR-08:** 2117 Vegyészmérnök · ESCO `2145.1` · EN: Chemical Engineers

*Piaci megnevezések (ESCO):* víztisztítási vegyészmérnök, pirotechnikai vegyészmérnök

A vegyészmérnökök jelentős méretű vegyi és fizikai termelési folyamatokat dolgoznak ki és fejlesztenek ki, és részt vesznek a nyersanyagok termékké történő átalakításához szükséges teljes ipari folyamatban.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 91.3%-a jelölte

**Holland-kód:** RIC — R 88 · I 79 · A 13 · S 0 · E 14 · C 59

**HEXACO differenciál cél-profil:** O cél 67±19 (w=0.40) · H cél 41±24 (w=0.22) · A cél 42±25 (w=0.18)

**HEXACO abszolút szint:** H 48 · E 45 · X 51 · A 49 · C 58 · O 66

### vegyészmérnök

`19-1012.00` · **ISCO-08 2145** Vegyészmérnökök · **FEOR-08:** 2117 Vegyészmérnök · ESCO `2145.1.4` · EN: Food Scientists and Technologists

*Piaci megnevezések (ESCO):* víztisztítási vegyészmérnök, pirotechnikai vegyészmérnök

A vegyészmérnökök jelentős méretű vegyi és fizikai termelési folyamatokat dolgoznak ki és fejlesztenek ki, és részt vesznek a nyersanyagok termékké történő átalakításához szükséges teljes ipari folyamatban.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 81.8%-a jelölte

**Holland-kód:** IRC — R 68 · I 78 · A 24 · S 19 · E 26 · C 49

**HEXACO differenciál cél-profil:** O cél 68±18 (w=0.51) · A cél 43±25 (w=0.21) · H cél 46±27 (w=0.12)

**HEXACO abszolút szint:** H 52 · E 49 · X 52 · A 49 · C 55 · O 66

### Máshová nem sorolható mérnökök

`17-2112.01` · **ISCO-08 2149** Máshová nem sorolható mérnökök · **FEOR-08:** 2113 Élelmiszer-ipari mérnök; 2114 Fa- és könnyűipari mérnök; 2137 Minőségbiztosítási mérnök; 2139 Egyéb, máshova nem sorolható mérnök · ESCO `2149.10` · EN: Human Factors Engineers and Ergonomists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* optikai mérnök, alkalmazásmérnök, alkalmazási mérnök

Az optikai mérnökök különböző, optikával kapcsolatos ipari alkalmazásokat terveznek és fejlesztenek ki.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 50.0%-a jelölte

**Holland-kód:** IRC — R 59 · I 87 · A 28 · S 19 · E 26 · C 57

**HEXACO differenciál cél-profil:** O cél 66±19 (w=0.44) · E cél 58±25 (w=0.21) · C cél 45±27 (w=0.13)

**HEXACO abszolút szint:** H 55 · E 51 · X 53 · A 56 · C 53 · O 66

### akusztikus mérnök

`17-2112.02` · **ISCO-08 2149** Máshová nem sorolható mérnökök · **FEOR-08:** 2113 Élelmiszer-ipari mérnök; 2114 Fa- és könnyűipari mérnök; 2137 Minőségbiztosítási mérnök; 2139 Egyéb, máshova nem sorolható mérnök · ESCO `2149.16` · EN: Validation Engineers

*Piaci megnevezések (ESCO):* akusztikai mérnök, alkalmazásmérnök, alkalmazási mérnök

Az akusztikus mérnökök a hang tudományát tanulmányozzák és alkalmazzák különféle alkalmazásokhoz.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 90.0%-a jelölte

**Holland-kód:** ICR — R 64 · I 76 · A 8 · S 7 · E 17 · C 68

**HEXACO differenciál cél-profil:** A cél 44±26 (w=0.25) · O cél 56±26 (w=0.25) · C cél 56±26 (w=0.22) · E cél 54±27 (w=0.15)

**HEXACO abszolút szint:** H 53 · E 51 · X 51 · A 49 · C 60 · O 57

### alkalmazásmérnök

`13-1081.01` · **ISCO-08 2149** Máshová nem sorolható mérnökök · **FEOR-08:** 2113 Élelmiszer-ipari mérnök; 2114 Fa- és könnyűipari mérnök; 2137 Minőségbiztosítási mérnök; 2139 Egyéb, máshova nem sorolható mérnök · ESCO `2149.2.6` · EN: Logistics Engineers

*Piaci megnevezések (ESCO):* alkalmazási mérnök

Az alkalmazásmérnökök a műszaki követelményekkel, az irányítással és a különböző mérnöki alkalmazásokkal, mint például a rendszerek, az új termékek tervezésének és a folyamatok javításának kidolgozásával kapcsolatban végzik munkájukat.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 73.9%-a jelölte

**Holland-kód:** CIR — R 50 · I 70 · A 1 · S 5 · E 46 · C 78

**HEXACO differenciál cél-profil:** O cél 68±18 (w=0.45) · H cél 40±24 (w=0.24) · A cél 42±24 (w=0.21)

**HEXACO abszolút szint:** H 46 · E 48 · X 52 · A 47 · C 54 · O 65

### anyagmérnök

`17-2199.03` · **ISCO-08 2149** Máshová nem sorolható mérnökök · **FEOR-08:** 2113 Élelmiszer-ipari mérnök; 2114 Fa- és könnyűipari mérnök; 2137 Minőségbiztosítási mérnök; 2139 Egyéb, máshova nem sorolható mérnök · ESCO `2149.9.8` · EN: Energy Engineers, Except Wind and Solar

*Piaci megnevezések (ESCO):* kerámiaipari mérnök, építőipari anyagmérnök

Az anyagmérnökök új vagy továbbfejlesztett anyagokat kutatnak és alakítanak ki különböző alkalmazások számára.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 50.0%-a jelölte

**Holland-kód:** RIC — R 70 · I 62 · A 17 · S 21 · E 35 · C 57

**HEXACO differenciál cél-profil:** O cél 65±20 (w=0.49) · A cél 41±24 (w=0.30) · H cél 47±28 (w=0.10)

**HEXACO abszolút szint:** H 52 · E 49 · X 54 · A 47 · C 55 · O 64

### optikai mérnök

`17-2111.00` · **ISCO-08 2149** Máshová nem sorolható mérnökök · **FEOR-08:** 2113 Élelmiszer-ipari mérnök; 2114 Fa- és könnyűipari mérnök; 2137 Minőségbiztosítási mérnök; 2139 Egyéb, máshova nem sorolható mérnök · ESCO `2149.10` · EN: Health and Safety Engineers, Except Mining Safety Engineers and Inspectors

Az optikai mérnökök különböző, optikával kapcsolatos ipari alkalmazásokat terveznek és fejlesztenek ki.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** IRC — R 73 · I 77 · A 1 · S 20 · E 21 · C 61

**HEXACO differenciál cél-profil:** O cél 56±26 (w=0.55) · A cél 47±28 (w=0.23) · H cél 49±29 (w=0.12)

**HEXACO abszolút szint:** H 58 · E 43 · X 57 · A 57 · C 61 · O 61

### ruhaipari kutató

`17-2199.08` · **ISCO-08 2149** Máshová nem sorolható mérnökök · **FEOR-08:** 2113 Élelmiszer-ipari mérnök; 2114 Fa- és könnyűipari mérnök; 2137 Minőségbiztosítási mérnök; 2139 Egyéb, máshova nem sorolható mérnök · ESCO `2149.15` · EN: Robotics Engineers

*Piaci megnevezések (ESCO):* textilipari kutató, vegyészmérnök

A ruhaipari kutatók ötvözik az anyagtudomány, a kémia, a fizika, a feldolgozó technológiák, az irányítás és a műszaki tudományok ismereteit, hozzájárulva a textilek, ruházati termékek, bőráruk és lábbelik területén megvalósuló jövőbeli innovációkhoz.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 50.0%-a jelölte

**Holland-kód:** RIC — R 86 · I 77 · A 13 · S 8 · E 13 · C 58

**HEXACO differenciál cél-profil:** O cél 71±16 (w=0.41) · H cél 38±22 (w=0.24) · A cél 40±23 (w=0.20)

**HEXACO abszolút szint:** H 44 · E 49 · X 49 · A 45 · C 56 · O 67

### szabadalmi mérnök

`17-2131.00` · **ISCO-08 2149** Máshová nem sorolható mérnökök · **FEOR-08:** 2113 Élelmiszer-ipari mérnök; 2114 Fa- és könnyűipari mérnök; 2137 Minőségbiztosítási mérnök; 2139 Egyéb, máshova nem sorolható mérnök · ESCO `2149.11` · EN: Materials Engineers

*Piaci megnevezések (ESCO):* akusztikus mérnök, akusztikai mérnök

A szabadalmi mérnökök tanácsokat adnak vállalkozásoknak a szellemi tulajdonjog különböző vonatkozásairól. Elemzik a találmányokat, és kutatják gazdasági potenciáljukat.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 47.6%-a jelölte

**Holland-kód:** RIC — R 81 · I 80 · A 26 · S 6 · E 18 · C 52

**HEXACO differenciál cél-profil:** O cél 68±18 (w=0.44) · A cél 41±24 (w=0.21) · H cél 42±24 (w=0.21)

**HEXACO abszolút szint:** H 48 · E 50 · X 52 · A 48 · C 56 · O 66

### villamosmérnök

`17-2071.00` · **ISCO-08 2151** Erősáramú villamosmérnökök · **FEOR-08:** 2121 Villamosmérnök (energetikai mérnök) · ESCO `2151.1` · EN: Electrical Engineers

*Piaci megnevezések (ESCO):* erősáramú villamosmérnök, villamossági szakértő

A villamosmérnök villamos rendszerek, elektromos berendezések, alkatrészek, motorok és energiaátviteli funkcióval rendelkező berendezések tervezését és fejlesztését végzik.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 81.6%-a jelölte

**Holland-kód:** RIC — R 84 · I 74 · A 19 · S 12 · E 24 · C 57

**HEXACO differenciál cél-profil:** O cél 64±21 (w=0.38) · A cél 41±24 (w=0.26) · H cél 43±25 (w=0.20)

**HEXACO abszolút szint:** H 49 · E 50 · X 53 · A 48 · C 57 · O 63

### elektronikai mérnök

`17-2061.00` · **ISCO-08 2152** Gyengeáramú villamosmérnökök · **FEOR-08:** 2122 Villamosmérnök (elektronikai mérnök) · ESCO `2152.1.1` · EN: Computer Hardware Engineers

*Piaci megnevezések (ESCO):* elektronikus mérnök, repülőelektronikai mérnök

Az elektronikai mérnökök elektronikus rendszereket kutatnak, terveznek és fejlesztenek, mint például áramkörök, félvezető eszközök és elektromos berendezések, amelyek energia-forrásként villamos energiát használnak.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 48.3%-a jelölte

**Holland-kód:** RIC — R 78 · I 76 · A 14 · S 14 · E 16 · C 73

**HEXACO differenciál cél-profil:** O cél 70±17 (w=0.47) · H cél 39±23 (w=0.24) · A cél 42±24 (w=0.19)

**HEXACO abszolút szint:** H 45 · E 49 · X 50 · A 46 · C 54 · O 66

### elektronikai mérnök

`17-2072.00` · **ISCO-08 2152** Gyengeáramú villamosmérnökök · **FEOR-08:** 2122 Villamosmérnök (elektronikai mérnök) · ESCO `2152.1` · EN: Electronics Engineers, Except Computer

*Piaci megnevezések (ESCO):* elektronikus mérnök, repülőelektronikai mérnök

Az elektronikai mérnökök elektronikus rendszereket kutatnak, terveznek és fejlesztenek, mint például áramkörök, félvezető eszközök és elektromos berendezések, amelyek energia-forrásként villamos energiát használnak.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 83.3%-a jelölte

**Holland-kód:** RIC — R 87 · I 80 · A 17 · S 10 · E 10 · C 61

**HEXACO differenciál cél-profil:** O cél 68±18 (w=0.43) · A cél 38±22 (w=0.28) · H cél 45±26 (w=0.13)

**HEXACO abszolút szint:** H 49 · E 50 · X 50 · A 45 · C 55 · O 65

### Telekommunikációs mérnökök

`15-1241.01` · **ISCO-08 2153** Telekommunikációs mérnökök · **FEOR-08:** 2123 Telekommunikációs mérnök · ESCO `2153.1` · EN: Telecommunications Engineering Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* távközlési mérnök, telekommunikációs mérnök, távközlési mérnökök

A távközlési mérnökök távközlési rendszerek és hálózatok, beleértve a rádió- és televízióberendezések tervezését, építését, tesztelését és karbantartását végzik.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 23.8%-a jelölte

**Holland-kód:** CRI — R 59 · I 55 · A 15 · S 22 · E 34 · C 66

**HEXACO differenciál cél-profil:** O cél 62±22 (w=0.53) · H cél 40±24 (w=0.41)

**HEXACO abszolút szint:** H 48 · E 47 · X 54 · A 54 · C 56 · O 63

### építész

`17-1011.00` · **ISCO-08 2161** Építészek · **FEOR-08:** 2115 Építészmérnök · ESCO `2161.1` · EN: Architects, Except Landscape and Naval

*Piaci megnevezések (ESCO):* építészmérnök, építőmérnök

Az építészek feladata az épületek, a városi területek, az infrastrukturális projektek és a szociális terek építésének és fejlesztésének vizsgálata, megtervezése és felügyelete.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: alapszak (BA/BSc) · a válaszadók 42.9%-a jelölte

**Holland-kód:** RCA — R 65 · I 48 · A 52 · S 26 · E 44 · C 57

**HEXACO differenciál cél-profil:** O cél 65±20 (w=0.36) · A cél 41±24 (w=0.23) · H cél 42±24 (w=0.20)

**HEXACO abszolút szint:** H 51 · E 47 · X 58 · A 50 · C 56 · O 66

### ipari tervező

`27-1021.00` · **ISCO-08 2163** Termék- és divattervezők · **FEOR-08:** 2723 Iparművész, gyártmány- és ruhatervező · ESCO `2163.1` · EN: Commercial and Industrial Designers

*Piaci megnevezések (ESCO):* csomagolástervező, ergonómiai tervező, textilszínezék-készítő, textilszínezék-keverő, színezékkeverő

Az ipari tervezők ötleteket dolgoznak ki és fejlesztenek ki a termékek széles körének tervezése és koncepciói során. Felhasználják a kreativitást, az esztétikát, a megvalósíthatóságot és a piaci relevanciát az új termékek tervezése során.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 67.9%-a jelölte

**Holland-kód:** ARI — R 60 · I 51 · A 76 · S 14 · E 45 · C 41

**HEXACO differenciál cél-profil:** O cél 70±16 (w=0.43) · H cél 33±19 (w=0.35) · X cél 56±26 (w=0.12)

**HEXACO abszolút szint:** H 40 · E 49 · X 55 · A 51 · C 46 · O 66

### ipari tervező

`27-1022.00` · **ISCO-08 2163** Termék- és divattervezők · **FEOR-08:** 2723 Iparművész, gyártmány- és ruhatervező · ESCO `2163.1.3` · EN: Fashion Designers

*Piaci megnevezések (ESCO):* csomagolástervező, ergonómiai tervező

Az ipari tervezők ötleteket dolgoznak ki és fejlesztenek ki a termékek széles körének tervezése és koncepciói során. Felhasználják a kreativitást, az esztétikát, a megvalósíthatóságot és a piaci relevanciát az új termékek tervezése során.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 50.7%-a jelölte

**Holland-kód:** ARE — R 56 · I 20 · A 100 · S 22 · E 49 · C 32

**HEXACO differenciál cél-profil:** H cél 26±14 (w=0.34) · O cél 68±18 (w=0.25) · X cél 64±21 (w=0.19) · E cél 42±24 (w=0.12)

**HEXACO abszolút szint:** H 34 · E 44 · X 60 · A 51 · C 41 · O 64

### Várostervezők és közlekedési mérnökök

`19-3051.00` · **ISCO-08 2164** Várostervezők és közlekedési mérnökök · **FEOR-08:** 2134 Település- és közlekedéstervező mérnök · ESCO `2164.4` · EN: Urban and Regional Planners · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* földrendező mérnök, ingatlanrendező földmérnök, földmérő és földrendező mérnök, településtervező mérnök, településfejlesztő és -üzemeltető mérnök, településmérnök

_(HU leírás nincs; EN:)_ Develop comprehensive plans and programs for use of land and physical facilities of jurisdictions, such as towns, cities, counties, and metropolitan areas.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 56.0%-a jelölte

**Holland-kód:** IEC — R 37 · I 72 · A 34 · S 34 · E 58 · C 49

**HEXACO differenciál cél-profil:** O cél 61±23 (w=0.36) · C cél 43±25 (w=0.23) · X cél 54±27 (w=0.13) · E cél 53±28 (w=0.10)

**HEXACO abszolút szint:** H 58 · E 46 · X 60 · A 60 · C 54 · O 64

### földmérő

`17-1022.00` · **ISCO-08 2165** Térképészek és földmérők · **FEOR-08:** 2135 Földmérő és térinformatikus · ESCO `2165.4` · EN: Surveyors

*Piaci megnevezések (ESCO):* térinformatikus, földmérnök, kataszteri földmérő mérnök, térképész

A földmérők speciális berendezések segítségével határozzák meg az építési területek felületén található pontok távolságát és elhelyezkedését.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 47.4%-a jelölte

**Holland-kód:** CRI — R 71 · I 62 · A 19 · S 10 · E 15 · C 72

**HEXACO differenciál cél-profil:** A cél 36±21 (w=0.39) · C cél 60±23 (w=0.28) · E cél 55±27 (w=0.14)

**HEXACO abszolút szint:** H 47 · E 57 · X 47 · A 38 · C 56 · O 46

### Tervezőgrafikusok és multimédiatervezők

`27-1011.00` · **ISCO-08 2166** Tervezőgrafikusok és multimédiatervezők · **FEOR-08:** 2136 Grafikus és multimédia-tervező · ESCO `2166.12` · EN: Art Directors · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* speciáliseffekt-tervező, speciáliseffekt-tervező művész, digitáliseffekt-tervező művész, stoptrükkanimátor, stoptrükk-bábanimátor, animációsfilm-készítő

A speciáliseffekt-tervezők illúziós hatásokat készítenek a filmekhez, videókhoz és számítógépes játékokhoz. Számítógépes szoftvereket használnak.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 68.0%-a jelölte

**Holland-kód:** AEC — R 32 · I 28 · A 100 · S 31 · E 71 · C 43

**HEXACO differenciál cél-profil:** H cél 30±17 (w=0.28) · X cél 67±19 (w=0.23) · O cél 66±19 (w=0.23) · C cél 40±24 (w=0.13)

**HEXACO abszolút szint:** H 41 · E 42 · X 65 · A 56 · C 44 · O 66

### szerencsejáték-tervező

`27-1024.00` · **ISCO-08 2166** Tervezőgrafikusok és multimédiatervezők · **FEOR-08:** 2136 Grafikus és multimédia-tervező · ESCO `2166.9` · EN: Graphic Designers

*Piaci megnevezések (ESCO):* szerencsejáték-fejlesztő, grafikus, grafikus és multimédia-tervező, reklámgrafikus, animációs háttérrajzoló, animációs háttértervező

Szerencsejáték-tervezők innovatív szerencsejátékokat, fogadásokat és lottójátékokat terveznek. Meghatározzák a játék kialakítását, a játékszabályokat vagy a játék szerkezetét.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 65.0%-a jelölte

**Holland-kód:** ACE — R 40 · I 31 · A 100 · S 19 · E 40 · C 49

**HEXACO differenciál cél-profil:** O cél 68±18 (w=0.50) · H cél 38±22 (w=0.32)

**HEXACO abszolút szint:** H 39 · E 53 · X 48 · A 46 · C 41 · O 62

### Általános orvosok

`29-1215.00` · **ISCO-08 2211** Általános orvosok · **FEOR-08:** 2211 Általános orvos · ESCO `2211.1` · EN: Family Medicine Physicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* háziorvos

A háziorvosok elősegítik az egészséget, megelőzik, azonosítják a beteg állapotokat, diagnosztizálják és kezelik a betegségeket, és segítik a testi és mentális betegségekből és az egészségügyi zavarokból való felépülést mindenki számára, életkoruktól, nemüktől vagy egészségügyi problémájuktól függetlenül.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 59.1%-a jelölte

**Holland-kód:** SIC — R 46 · I 85 · A 8 · S 87 · E 22 · C 49

**HEXACO differenciál cél-profil:** C cél 43±25 (w=0.27) · E cél 57±26 (w=0.26) · H cél 56±26 (w=0.21) · A cél 55±27 (w=0.19)

**HEXACO abszolút szint:** H 70 · E 42 · X 65 · A 69 · C 65 · O 60

### Szakorvosok

`29-1211.00` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Anesthesiologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 69.2%-a jelölte

**Holland-kód:** ISR — R 70 · I 79 · A 3 · S 71 · E 25 · C 45

**HEXACO differenciál cél-profil:** E cél 43±26 (w=0.27) · A cél 55±27 (w=0.20) · X cél 45±27 (w=0.20) · H cél 46±28 (w=0.14)

**HEXACO abszolút szint:** H 61 · E 36 · X 58 · A 65 · C 66 · O 61

### Szakorvosok

`29-1212.00` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Cardiologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: —

**Holland-kód:** IRS — R 66 · I 98 · A 2 · S 62 · E 21 · C 50

**HEXACO differenciál cél-profil:** H cél 43±26 (w=0.34) · O cél 55±26 (w=0.27) · A cél 53±28 (w=0.17) · X cél 47±28 (w=0.17)

**HEXACO abszolút szint:** H 60 · E 39 · X 60 · A 66 · C 68 · O 64

### Szakorvosok

`29-1213.00` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Dermatologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 56.4%-a jelölte

**Holland-kód:** IRS — R 64 · I 91 · A 14 · S 61 · E 13 · C 47

**HEXACO differenciál cél-profil:** E cél 59±24 (w=0.36) · O cél 55±26 (w=0.22) · X cél 47±28 (w=0.13) · C cél 48±28 (w=0.10)

**HEXACO abszolút szint:** H 61 · E 49 · X 56 · A 58 · C 60 · O 60

### Szakorvosok

`29-1214.00` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Emergency Medicine Physicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 62.1%-a jelölte

**Holland-kód:** ISC — R 52 · I 77 · A 0 · S 77 · E 28 · C 54

**HEXACO differenciál cél-profil:** H cél 35±20 (w=0.40) · A cél 62±22 (w=0.32) · E cél 44±26 (w=0.16)

**HEXACO abszolút szint:** H 52 · E 35 · X 64 · A 71 · C 68 · O 60

### Szakorvosok

`29-1216.00` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: General Internal Medicine Physicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 53.0%-a jelölte

**Holland-kód:** ISR — R 57 · I 97 · A 7 · S 85 · E 18 · C 44

**HEXACO differenciál cél-profil:** C cél 44±26 (w=0.25) · A cél 54±27 (w=0.18) · E cél 54±27 (w=0.17) · H cél 54±28 (w=0.15)

**HEXACO abszolút szint:** H 69 · E 40 · X 62 · A 68 · C 66 · O 63

### Szakorvosok

`29-1217.00` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Neurologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 63.7%-a jelölte

**Holland-kód:** ISR — R 52 · I 100 · A 18 · S 67 · E 23 · C 45

**HEXACO differenciál cél-profil:** O cél 58±25 (w=0.32) · X cél 44±26 (w=0.25) · E cél 56±26 (w=0.24) · C cél 46±28 (w=0.14)

**HEXACO abszolút szint:** H 64 · E 44 · X 57 · A 63 · C 64 · O 65

### Szakorvosok

`29-1218.00` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Obstetricians and Gynecologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 74.0%-a jelölte

**Holland-kód:** ISR — R 60 · I 75 · A 8 · S 74 · E 29 · C 45

**HEXACO differenciál cél-profil:** C cél 45±26 (w=0.33) · A cél 55±27 (w=0.28) · E cél 53±28 (w=0.21) · H cél 52±29 (w=0.11)

**HEXACO abszolút szint:** H 68 · E 40 · X 64 · A 68 · C 66 · O 61

### Szakorvosok

`29-1221.00` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Pediatricians, General · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 78.3%-a jelölte

**Holland-kód:** SIR — R 44 · I 86 · A 15 · S 94 · E 26 · C 43

**HEXACO differenciál cél-profil:** C cél 42±25 (w=0.37) · A cél 56±26 (w=0.30) · E cél 55±27 (w=0.24)

**HEXACO abszolút szint:** H 66 · E 41 · X 64 · A 69 · C 64 · O 60

### Szakorvosok

`29-1222.00` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Physicians, Pathologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 62.0%-a jelölte

**Holland-kód:** IRC — R 64 · I 100 · A 6 · S 43 · E 13 · C 62

**HEXACO differenciál cél-profil:** O cél 65±20 (w=0.35) · X cél 40±23 (w=0.25) · A cél 41±24 (w=0.21)

**HEXACO abszolút szint:** H 59 · E 46 · X 50 · A 52 · C 63 · O 66

### Szakorvosok

`29-1223.00` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Psychiatrists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 58.5%-a jelölte

**Holland-kód:** ISC — R 22 · I 93 · A 28 · S 80 · E 16 · C 43

**HEXACO differenciál cél-profil:** C cél 40±23 (w=0.24) · H cél 60±24 (w=0.23) · E cél 56±26 (w=0.15) · A cél 56±26 (w=0.15)

**HEXACO abszolút szint:** H 72 · E 42 · X 60 · A 69 · C 61 · O 63

### Szakorvosok

`29-1229.03` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Urologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 64.4%-a jelölte

**Holland-kód:** ISR — R 64 · I 98 · A 5 · S 74 · E 20 · C 40

**HEXACO differenciál cél-profil:** E cél 60±24 (w=0.38) · O cél 57±25 (w=0.27) · X cél 44±26 (w=0.23)

**HEXACO abszolút szint:** H 58 · E 50 · X 54 · A 58 · C 60 · O 61

### Szakorvosok

`29-1229.04` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Physical Medicine and Rehabilitation Physicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 54.9%-a jelölte

**Holland-kód:** ISR — R 65 · I 88 · A 14 · S 83 · E 12 · C 33

**HEXACO differenciál cél-profil:** C cél 43±25 (w=0.31) · A cél 56±26 (w=0.28) · E cél 55±27 (w=0.23) · O cél 52±28 (w=0.10)

**HEXACO abszolút szint:** H 65 · E 42 · X 62 · A 67 · C 62 · O 62

### Szakorvosok

`29-1241.00` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Ophthalmologists, Except Pediatric · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 42.1%-a jelölte

**Holland-kód:** ISR — R 57 · I 87 · A 12 · S 74 · E 33 · C 45

**HEXACO differenciál cél-profil:** E cél 56±26 (w=0.37) · X cél 47±28 (w=0.21) · O cél 53±28 (w=0.20) · A cél 48±28 (w=0.15)

**HEXACO abszolút szint:** H 61 · E 45 · X 57 · A 59 · C 65 · O 60

### Szakorvosok

`29-1242.00` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Orthopedic Surgeons, Except Pediatric · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: —

**Holland-kód:** IRS — R 68 · I 92 · A 8 · S 64 · E 23 · C 48

**HEXACO differenciál cél-profil:** H cél 39±23 (w=0.38) · A cél 45±26 (w=0.18) · O cél 55±27 (w=0.17) · X cél 54±28 (w=0.12)

**HEXACO abszolút szint:** H 54 · E 39 · X 63 · A 59 · C 68 · O 62

### Diplomás ápolók

`29-1141.03` · **ISCO-08 2221** Diplomás ápolók · **FEOR-08:** 2231 Ápoló (felsőfokú képzettséghez kapcsolódó) · ESCO `2221.3` · EN: Critical Care Nurses · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakápoló, ápoló, angiológiai szakápoló, osztályvezető ápoló, vezető ápoló, vezető szakápoló

A szakápolók elősegítik és helyreállítják az emberek egészségét, diagnosztizálják és gondozzák őket az ápolás terén.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 50.0%-a jelölte

**Holland-kód:** SIC — R 48 · I 67 · A 12 · S 76 · E 20 · C 54

**HEXACO differenciál cél-profil:** A cél 62±22 (w=0.44) · X cél 45±27 (w=0.19) · C cél 46±28 (w=0.13) · O cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 65 · E 36 · X 60 · A 72 · C 67 · O 58

### betegápoló

`29-1141.01` · **ISCO-08 2221** Diplomás ápolók · **FEOR-08:** 2231 Ápoló (felsőfokú képzettséghez kapcsolódó) · ESCO `2221.2` · EN: Acute Care Nurses

*Piaci megnevezések (ESCO):* védőnő, beteggondozó, szakápoló, ápoló, angiológiai szakápoló, osztályvezető ápoló

A betegápolók felelősek a betegek egészségének javításáért és helyreállításáért, a betegeknek, barátoknak és családoknak nyújtott fizikai és pszichológiai támogatás révén.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 57.1%-a jelölte

**Holland-kód:** SIR — R 45 · I 78 · A 12 · S 80 · E 13 · C 39

**HEXACO differenciál cél-profil:** A cél 60±24 (w=0.39) · C cél 46±27 (w=0.15) · E cél 46±28 (w=0.14) · X cél 47±28 (w=0.13)

**HEXACO abszolút szint:** H 64 · E 36 · X 61 · A 70 · C 67 · O 59

### osztályvezető ápoló

`29-1141.02` · **ISCO-08 2221** Diplomás ápolók · **FEOR-08:** 2231 Ápoló (felsőfokú képzettséghez kapcsolódó) · ESCO `2221.1` · EN: Advanced Practice Psychiatric Nurses

*Piaci megnevezések (ESCO):* vezető ápoló, vezető szakápoló, szakápoló, ápoló, angiológiai szakápoló, betegápoló

Az osztályvezető ápolók feladata a betegek egészségének előmozdítása és helyreállítása, az előrehaladott helyzetekben a diagnózis és a gondozás biztosítása, az ellátás koordinálása a krónikus betegségek kezelése terén, az integrált ellátás biztosítása és a kijelölt csoporttagok felügyelete.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 87.0%-a jelölte

**Holland-kód:** SIC — R 26 · I 82 · A 30 · S 84 · E 17 · C 39

**HEXACO differenciál cél-profil:** C cél 41±24 (w=0.42) · H cél 55±27 (w=0.23) · A cél 54±27 (w=0.21) · E cél 53±28 (w=0.13)

**HEXACO abszolút szint:** H 70 · E 39 · X 65 · A 69 · C 64 · O 62

### osztályvezető ápoló

`29-1171.00` · **ISCO-08 2221** Diplomás ápolók · **FEOR-08:** 2231 Ápoló (felsőfokú képzettséghez kapcsolódó) · ESCO `2221.1` · EN: Nurse Practitioners

*Piaci megnevezések (ESCO):* vezető ápoló, vezető szakápoló, szakápoló, ápoló, angiológiai szakápoló, betegápoló

Az osztályvezető ápolók feladata a betegek egészségének előmozdítása és helyreállítása, az előrehaladott helyzetekben a diagnózis és a gondozás biztosítása, az ellátás koordinálása a krónikus betegségek kezelése terén, az integrált ellátás biztosítása és a kijelölt csoporttagok felügyelete.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 65.2%-a jelölte

**Holland-kód:** ISC — R 43 · I 76 · A 6 · S 75 · E 18 · C 51

**HEXACO differenciál cél-profil:** A cél 58±25 (w=0.32) · C cél 44±26 (w=0.25) · E cél 53±28 (w=0.14) · H cél 53±28 (w=0.13)

**HEXACO abszolút szint:** H 68 · E 40 · X 63 · A 70 · C 66 · O 60

### szakápoló

`29-1141.00` · **ISCO-08 2221** Diplomás ápolók · **FEOR-08:** 2231 Ápoló (felsőfokú képzettséghez kapcsolódó) · ESCO `2221.3` · EN: Registered Nurses

*Piaci megnevezések (ESCO):* ápoló, angiológiai szakápoló, osztályvezető ápoló, vezető ápoló, vezető szakápoló, betegápoló

A szakápolók elősegítik és helyreállítják az emberek egészségét, diagnosztizálják és gondozzák őket az ápolás terén.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 55.9%-a jelölte

**Holland-kód:** SCI — R 41 · I 62 · A 6 · S 76 · E 23 · C 62

**HEXACO differenciál cél-profil:** A cél 60±24 (w=0.29) · C cél 41±24 (w=0.28) · H cél 57±26 (w=0.21) · O cél 46±27 (w=0.13)

**HEXACO abszolút szint:** H 68 · E 42 · X 61 · A 68 · C 61 · O 56

### szakápoló

`29-1141.04` · **ISCO-08 2221** Diplomás ápolók · **FEOR-08:** 2231 Ápoló (felsőfokú képzettséghez kapcsolódó) · ESCO `2221.3` · EN: Clinical Nurse Specialists

*Piaci megnevezések (ESCO):* ápoló, angiológiai szakápoló, osztályvezető ápoló, vezető ápoló, vezető szakápoló, betegápoló

A szakápolók elősegítik és helyreállítják az emberek egészségét, diagnosztizálják és gondozzák őket az ápolás terén.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 85.7%-a jelölte

**Holland-kód:** SIC — R 22 · I 64 · A 14 · S 87 · E 45 · C 51

**HEXACO differenciál cél-profil:** C cél 42±25 (w=0.33) · A cél 55±27 (w=0.21) · X cél 55±27 (w=0.19) · H cél 47±28 (w=0.10)

**HEXACO abszolút szint:** H 66 · E 38 · X 68 · A 70 · C 66 · O 61

### Szülésznők

`29-1161.00` · **ISCO-08 2222** Szülésznők · **FEOR-08:** 2232 Szülész(nő) (felsőfokú képzettséghez kapcsolódó) · ESCO `2222.1` · EN: Nurse Midwives · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szülész/szülésznő, független bába, bába

A szülész/szülésznők segítséget nyújtanak a nőknek a szülés során, biztosítva a szükséges támogatást, ellátást és tanácsadást a terhesség, a munka és a szülés utáni időszak során, szüléseket vezetnek le és újszülöttgondozást is végeznek.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 81.2%-a jelölte

**Holland-kód:** SIC — R 37 · I 54 · A 16 · S 83 · E 33 · C 40

**HEXACO differenciál cél-profil:** C cél 42±25 (w=0.28) · A cél 57±25 (w=0.26) · E cél 54±27 (w=0.16) · O cél 46±27 (w=0.16)

**HEXACO abszolút szint:** H 69 · E 40 · X 64 · A 70 · C 65 · O 58

### Szülésznők

`29-9099.01` · **ISCO-08 2222** Szülésznők · **FEOR-08:** 2232 Szülész(nő) (felsőfokú képzettséghez kapcsolódó) · ESCO `2222.1` · EN: Midwives · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szülész/szülésznő, független bába, bába

A szülész/szülésznők segítséget nyújtanak a nőknek a szülés során, biztosítva a szükséges támogatást, ellátást és tanácsadást a terhesség, a munka és a szülés utáni időszak során, szüléseket vezetnek le és újszülöttgondozást is végeznek.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 32.8%-a jelölte

**Holland-kód:** SRI — R 50 · I 42 · A 15 · S 84 · E 28 · C 38

**HEXACO differenciál cél-profil:** A cél 60±23 (w=0.30) · C cél 42±24 (w=0.24) · O cél 43±26 (w=0.19) · H cél 54±27 (w=0.12)

**HEXACO abszolút szint:** H 69 · E 36 · X 62 · A 71 · C 64 · O 56

### Állatorvosok

`29-1131.00` · **ISCO-08 2250** Állatorvosok · **FEOR-08:** 2241 Állatorvos · ESCO `2250` · EN: Veterinarians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* állat manuálterapeuta, állat kiropraktőr, állat csontkovács, víziállatokkal foglalkozó egészségügyi szakember, általános állatorvos, állatorvosok

_(HU leírás nincs; EN:)_ Diagnose, treat, or research diseases and injuries of animals. Includes veterinarians who conduct research and development, inspect livestock, or care for pets and companion animals.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 79.2%-a jelölte

**Holland-kód:** RIC — R 83 · I 83 · A 0 · S 41 · E 12 · C 41

**HEXACO differenciál cél-profil:** C cél 44±26 (w=0.34) · O cél 54±27 (w=0.24) · E cél 52±29 (w=0.12) · H cél 52±29 (w=0.11)

**HEXACO abszolút szint:** H 64 · E 42 · X 60 · A 62 · C 60 · O 62

### Fogorvosok

`29-1021.00` · **ISCO-08 2261** Fogorvosok · **FEOR-08:** 2213 Fogorvos, fogszakorvos · ESCO `2261` · EN: Dentists, General · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* fogszakorvos, dentofaciális szakorvos, szájsebész, fogorvos, gyermekfogász, kórházi fogorvos

_(HU leírás nincs; EN:)_ Examine, diagnose, and treat diseases, injuries, and malformations of teeth and gums. May treat diseases of nerve, pulp, and other dental tissues affecting oral hygiene and retention of teeth.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 81.4%-a jelölte

**Holland-kód:** IRS — R 70 · I 75 · A 3 · S 57 · E 17 · C 45

**HEXACO differenciál cél-profil:** E cél 56±26 (w=0.56) · C cél 48±28 (w=0.23) · A cél 49±29 (w=0.11)

**HEXACO abszolút szint:** H 59 · E 46 · X 58 · A 59 · C 61 · O 57

### gyógyszerész

`29-1051.00` · **ISCO-08 2262** Gyógyszerészek · **FEOR-08:** 2214 Gyógyszerész, szakgyógyszerész · ESCO `2262.1` · EN: Pharmacists

*Piaci megnevezések (ESCO):* gyógyszertáros, szakgyógyszerész

A gyógyszerészek készítik elő, adagolják és adják ki a gyógyszereket az orvosi rendelvények alapján. Klinikai információkat nyújtanak a gyógyszerekről, bejelentik a feltételezett mellékhatásokat, és személyre szabott támogatást nyújtanak a betegeknek.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 78.4%-a jelölte

**Holland-kód:** ISC — R 30 · I 78 · A 8 · S 65 · E 27 · C 59

**HEXACO differenciál cél-profil:** H cél 60±23 (w=0.32) · E cél 59±24 (w=0.27) · O cél 45±27 (w=0.15) · X cél 45±27 (w=0.15)

**HEXACO abszolút szint:** H 68 · E 47 · X 56 · A 62 · C 64 · O 55

### munkavédelmi képviselő

`19-5011.00` · **ISCO-08 2263** Környezet-, foglalkozás-egészségügyi és higiénés foglalkozásúak · **FEOR-08:** 2221 Környezet- és foglalkozás-egészségügyi foglalkozású · ESCO `2263.3` · EN: Occupational Health and Safety Specialists

*Piaci megnevezések (ESCO):* munkabiztonsági és munkaegészségügyi szakértő, munkavédelmi és munkaegészségügyi felelős, sugárvédelmi megbízott, sugárvédelmi felügyelő, sugárvédelmi menedzser

A munkavédelmi képviselők terveket valósítanak meg a munkahelyi környezet és -kultúra javítására.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 73.9%-a jelölte

**Holland-kód:** ICR — R 58 · I 66 · A 5 · S 41 · E 37 · C 62

**HEXACO differenciál cél-profil:** O cél 54±28 (w=0.40) · X cél 48±29 (w=0.18) · E cél 51±29 (w=0.12) · C cél 49±29 (w=0.12)

**HEXACO abszolút szint:** H 59 · E 44 · X 56 · A 57 · C 60 · O 58

### Fizioterapeuták

`29-1123.00` · **ISCO-08 2264** Fizioterapeuták · **FEOR-08:** 2224 Gyógytornász · ESCO `2264.1` · EN: Physical Therapists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* vezető fizioterapeuta, fizioterapeuta, gyógytornász, állat fizikoterapeuta, állat fizikoterapeuták, állat fizikoterápiás asszisztens

A vezető fizioterapeuták nagymértékben szakosodottak. Összetett döntéseket hoznak és kockázatokat kezelnek előre nem látható körülmények között és meghatározott területen belül.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 47.1%-a jelölte

**Holland-kód:** SIR — R 56 · I 64 · A 20 · S 82 · E 25 · C 34

**HEXACO differenciál cél-profil:** C cél 41±24 (w=0.33) · A cél 57±25 (w=0.28) · E cél 55±26 (w=0.20) · H cél 53±28 (w=0.12)

**HEXACO abszolút szint:** H 66 · E 43 · X 62 · A 67 · C 58 · O 58

### dietetikus

`29-1031.00` · **ISCO-08 2265** Dietetikusok és táplálkozás-szakértők · **FEOR-08:** 2223 Dietetikus és táplálkozási tanácsadó · ESCO `2265.1` · EN: Dietitians and Nutritionists

*Piaci megnevezések (ESCO):* táplálkozási tanácsadó, táplálkozástudós

A dietetikusok felmérik csoportok vagy egyének specifikus táplálkozási igényeit az életük során, és ez alapján tanácsokot fogalmaznak meg az emberek egészségének megőrzése, a kockázatok csökkentése vagy az egészség helyreállítása érdekében.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztgraduális szakirányú továbbképzés · a válaszadók 53.3%-a jelölte

**Holland-kód:** SIE — R 34 · I 63 · A 23 · S 75 · E 40 · C 39

**HEXACO differenciál cél-profil:** C cél 41±24 (w=0.31) · E cél 57±25 (w=0.24) · H cél 57±25 (w=0.23) · A cél 54±27 (w=0.13)

**HEXACO abszolút szint:** H 65 · E 47 · X 58 · A 62 · C 54 · O 58

### beszéd- és nyelvterapeuta

`29-1127.00` · **ISCO-08 2266** Audiológusok és beszédterapeuták · **FEOR-08:** 2227 Hallás- és beszédterapeuta · ESCO `2266.2` · EN: Speech-Language Pathologists

*Piaci megnevezések (ESCO):* beszédpatológus, beszédterapeuta, audiológus, gyermekaudiológus, audiológiai szakasszisztens

A beszéd- és nyelvterapeuták munkájuk során a kommunikációs nehézségek és a nyelési rendellenességek megelőzésére, értékelésére, diagnózisára, kezelésére és megelőzésére összpontosítanak, életkortól függetlenül, segítve a verbális és nem-verbális kommunikációs képességek fenntartását, ösztönzését, javítását, kezdeményezését, illetve helyreállítását.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 88.5%-a jelölte

**Holland-kód:** SIC — R 27 · I 76 · A 33 · S 85 · E 7 · C 50

**HEXACO differenciál cél-profil:** C cél 41±24 (w=0.28) · E cél 59±24 (w=0.28) · A cél 58±24 (w=0.26) · H cél 53±28 (w=0.10)

**HEXACO abszolút szint:** H 65 · E 46 · X 60 · A 67 · C 57 · O 59

### optometrista

`29-1041.00` · **ISCO-08 2267** Optometristák · **FEOR-08:** 2222 Optometrista · ESCO `2267.1` · EN: Optometrists

*Piaci megnevezések (ESCO):* látszerész optometrista, szemvizsgáló optometrista, ortoptikus, ortoptikus szakorvos

Az optometristák a szemet vizsgálják és tesztelik rendellenességeket, vizuális problémákat vagy betegségeket keresve.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 95.2%-a jelölte

**Holland-kód:** ISR — R 63 · I 80 · A 10 · S 67 · E 21 · C 49

**HEXACO differenciál cél-profil:** E cél 58±25 (w=0.28) · H cél 56±26 (w=0.23) · C cél 45±27 (w=0.19) · O cél 53±28 (w=0.12)

**HEXACO abszolút szint:** H 62 · E 49 · X 55 · A 56 · C 56 · O 58

### Máshová nem sorolható egészségügyi foglalkozásúak

`29-1224.00` · **ISCO-08 2269** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 2229 Egyéb humán-egészségügyi (társ)foglalkozású · ESCO `2269.8` · EN: Radiologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* radiográfus, radioterapeuta, orvosi képalkotó diagnosztikai és terápiás berendezés kezelője

A radiográfusok számos technológia segítségével vizsgálják, kezelik és gondozzák a betegeket.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 57.9%-a jelölte

**Holland-kód:** IRC — R 65 · I 94 · A 6 · S 48 · E 20 · C 58

**HEXACO differenciál cél-profil:** O cél 58±25 (w=0.42) · X cél 43±25 (w=0.41) · E cél 52±28 (w=0.12)

**HEXACO abszolút szint:** H 58 · E 45 · X 52 · A 58 · C 62 · O 61

### foglalkoztató terapeuta

`29-1122.00` · **ISCO-08 2269** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 2229 Egyéb humán-egészségügyi (társ)foglalkozású · ESCO `2269.4` · EN: Occupational Therapists

*Piaci megnevezések (ESCO):* ergoterapeuta, rehabilitációs terapeuta, rekreációs terapeuta, pszichomotoros terapeuta, munkaterápiás asszisztens, foglalkoztatásterápiás asszisztens

A foglalkoztató terapeuták olyan egyének vagy csoportok számára nyújtanak segítséget, akik betegségük, testi zavaraik, illetve átmeneti vagy tartós szellemi fogyatékosságuk miatt foglalkoztatási korlátokkal rendelkeznek, hogy visszanyerjék képességüket mindennapi tevékenységeik elvégzésére.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 86.4%-a jelölte

**Holland-kód:** SIR — R 43 · I 54 · A 34 · S 85 · E 14 · C 35

**HEXACO differenciál cél-profil:** C cél 38±22 (w=0.33) · A cél 62±22 (w=0.33) · H cél 54±27 (w=0.12) · E cél 54±27 (w=0.11)

**HEXACO abszolút szint:** H 66 · E 44 · X 60 · A 69 · C 54 · O 60

### Szakoktatók

`25-2032.00` · **ISCO-08 2320** Szakoktatók · **FEOR-08:** 2422 Középfokú nevelési-oktatási intézményi szakoktató, 2. gyakorlati oktató · ESCO `2320.1` · EN: Career/Technical Education Teachers, Secondary School · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakoktató, műszaki szakoktató

A szakoktatók tanulókat oktatnak a szakterületükön, elsősorban gyakorlati jelleggel.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 40.1%-a jelölte

**Holland-kód:** SCA — R 31 · I 40 · A 41 · S 100 · E 25 · C 49

**HEXACO differenciál cél-profil:** C cél 39±23 (w=0.43) · X cél 57±26 (w=0.26) · A cél 54±27 (w=0.16)

**HEXACO abszolút szint:** H 63 · E 42 · X 64 · A 63 · C 52 · O 58

### Középiskolai tanárok

`25-2022.00` · **ISCO-08 2330** Középiskolai tanárok · **FEOR-08:** 2421 Középiskolai tanár · ESCO `2330.1` · EN: Middle School Teachers, Except Special and Career/Technical Education · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* középiskolai tanár

A középiskolai tanárok középiskolai szinten nyújtanak képzést tanulók, általában gyermekek és fiatalok számára. Általában szakosított tanárok, szakterületükre specializálódva végzik az oktatást.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 66.9%-a jelölte

**Holland-kód:** SAC — R 26 · I 38 · A 52 · S 100 · E 28 · C 43

**HEXACO differenciál cél-profil:** C cél 40±24 (w=0.39) · A cél 56±26 (w=0.26) · X cél 54±27 (w=0.17) · H cél 54±27 (w=0.17)

**HEXACO abszolút szint:** H 65 · E 41 · X 64 · A 65 · C 54 · O 58

### Középiskolai tanárok

`25-2023.00` · **ISCO-08 2330** Középiskolai tanárok · **FEOR-08:** 2421 Középiskolai tanár · ESCO `2330.1` · EN: Career/Technical Education Teachers, Middle School · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* középiskolai tanár

A középiskolai tanárok középiskolai szinten nyújtanak képzést tanulók, általában gyermekek és fiatalok számára. Általában szakosított tanárok, szakterületükre specializálódva végzik az oktatást.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 64.9%-a jelölte

**Holland-kód:** SCA — R 38 · I 38 · A 40 · S 100 · E 21 · C 47

**HEXACO differenciál cél-profil:** C cél 39±22 (w=0.41) · X cél 56±26 (w=0.21) · A cél 56±26 (w=0.21) · H cél 53±28 (w=0.12)

**HEXACO abszolút szint:** H 63 · E 42 · X 63 · A 63 · C 51 · O 58

### középiskolai tanár

`25-2031.00` · **ISCO-08 2330** Középiskolai tanárok · **FEOR-08:** 2421 Középiskolai tanár · ESCO `2330.1` · EN: Secondary School Teachers, Except Special and Career/Technical Education

A középiskolai tanárok középiskolai szinten nyújtanak képzést tanulók, általában gyermekek és fiatalok számára. Általában szakosított tanárok, szakterületükre specializálódva végzik az oktatást.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 77.0%-a jelölte

**Holland-kód:** SAC — R 29 · I 36 · A 46 · S 100 · E 32 · C 44

**HEXACO differenciál cél-profil:** C cél 39±23 (w=0.39) · A cél 57±25 (w=0.25) · X cél 56±26 (w=0.21) · H cél 53±28 (w=0.12)

**HEXACO abszolút szint:** H 64 · E 41 · X 64 · A 65 · C 53 · O 58

### általános iskolai pedagógus

`25-2021.00` · **ISCO-08 2341** Általános iskolai tanárok · **FEOR-08:** 2431 Általános iskolai tanár, tanító · ESCO `2341.1` · EN: Elementary School Teachers, Except Special Education

*Piaci megnevezések (ESCO):* általános iskolai tanító, általános iskolai zenetanár

Az általános iskolai pedagógusok tanulókat oktatnak általános iskolai szinten.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 78.2%-a jelölte

**Holland-kód:** SAC — R 27 · I 39 · A 48 · S 100 · E 26 · C 46

**HEXACO differenciál cél-profil:** C cél 38±22 (w=0.31) · H cél 59±24 (w=0.23) · A cél 58±25 (w=0.19) · X cél 55±26 (w=0.14)

**HEXACO abszolút szint:** H 70 · E 41 · X 66 · A 67 · C 54 · O 57

### Óvodapedagógusok

`25-2011.00` · **ISCO-08 2342** Óvodapedagógusok · **FEOR-08:** 2432 Csecsemő- és kisgyermeknevelő, óvodapedagógus · ESCO `2342.1` · EN: Preschool Teachers, Except Special Education · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* óvodapedagógus, óvodai kisgyermeknevelő, óvónő, Freinet-pedagógus, általános iskolai Freinet-tanár, általános iskolai Freinet-oktató

Az óvodapedagógusok elsősorban kisgyermekeket tanítanak, az alapokat és a kreatív játékokat tanítják, informális módon fejlesztve szociális és szellemi készségeiket, a jövőbeli tanulásra való felkészítve őket.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 28.8%-a jelölte

**Holland-kód:** SAC — R 32 · I 29 · A 50 · S 100 · E 25 · C 44

**HEXACO differenciál cél-profil:** C cél 33±19 (w=0.30) · A cél 63±21 (w=0.24) · H cél 63±21 (w=0.24)

**HEXACO abszolút szint:** H 70 · E 43 · X 63 · A 68 · C 47 · O 53

### Óvodapedagógusok

`25-2012.00` · **ISCO-08 2342** Óvodapedagógusok · **FEOR-08:** 2432 Csecsemő- és kisgyermeknevelő, óvodapedagógus · ESCO `2342.1` · EN: Kindergarten Teachers, Except Special Education · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* óvodapedagógus, óvodai kisgyermeknevelő, óvónő, Freinet-pedagógus, általános iskolai Freinet-tanár, általános iskolai Freinet-oktató

Az óvodapedagógusok elsősorban kisgyermekeket tanítanak, az alapokat és a kreatív játékokat tanítják, informális módon fejlesztve szociális és szellemi készségeiket, a jövőbeli tanulásra való felkészítve őket.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 75.7%-a jelölte

**Holland-kód:** SAC — R 28 · I 35 · A 50 · S 100 · E 25 · C 47

**HEXACO differenciál cél-profil:** C cél 36±21 (w=0.31) · A cél 60±23 (w=0.22) · H cél 60±24 (w=0.22) · O cél 45±26 (w=0.12)

**HEXACO abszolút szint:** H 68 · E 42 · X 64 · A 67 · C 51 · O 54

### Oktatás-módszertani foglalkozásúak

`25-9031.00` · **ISCO-08 2351** Oktatás-módszertani foglalkozásúak · **FEOR-08:** 2491 Pedagógiai szakértő, szaktanácsadó · ESCO `2351.4` · EN: Instructional Coordinators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gyógypedagógiai koordinátor, gyógypedagógai igazgató, sajátos nevelési igényű tanulók oktatásával foglalkozó koordinátor, tantervfejlesztő, tanmenettervező, tantervtervező

A gyógypedagógiai koordinátorok felügyelik azokat a programokat és tevékenységeket, amelyek különféle fogyatékossággal élő gyermekek számára nyújtanak oktatási támogatást.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 59.8%-a jelölte

**Holland-kód:** SEI — R 10 · I 51 · A 43 · S 86 · E 54 · C 50

**HEXACO differenciál cél-profil:** C cél 38±22 (w=0.23) · A cél 61±22 (w=0.23) · O cél 59±24 (w=0.17) · H cél 43±25 (w=0.14)

**HEXACO abszolút szint:** H 55 · E 48 · X 61 · A 65 · C 49 · O 63

### Gyógypedagógusok

`25-2056.00` · **ISCO-08 2352** Gyógypedagógusok · **FEOR-08:** 2441 Gyógypedagógus; 2442 Konduktor · ESCO `2352.1` · EN: Special Education Teachers, Elementary School · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gyógypedagógus, jelnyelvtanár, sajátos nevelési igényű tanulók oktatója

A gyógypedagógusok értelmi vagy testi fogyatékossággal élő gyermekekkel, fiatalokkal, illetve felnőttekkel dolgoznak és tanítják őket.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 51.4%-a jelölte

**Holland-kód:** SIA — R 21 · I 49 · A 44 · S 100 · E 13 · C 41

**HEXACO differenciál cél-profil:** A cél 62±22 (w=0.33) · C cél 40±23 (w=0.30) · H cél 57±26 (w=0.19)

**HEXACO abszolút szint:** H 70 · E 41 · X 64 · A 71 · C 58 · O 58

### Gyógypedagógusok

`25-2057.00` · **ISCO-08 2352** Gyógypedagógusok · **FEOR-08:** 2441 Gyógypedagógus; 2442 Konduktor · ESCO `2352.1` · EN: Special Education Teachers, Middle School · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gyógypedagógus, jelnyelvtanár, sajátos nevelési igényű tanulók oktatója, tehetséggondozó pedagógus, tehetségfejlesztő tanár, tehetségfejlesztő oktató

A gyógypedagógusok értelmi vagy testi fogyatékossággal élő gyermekekkel, fiatalokkal, illetve felnőttekkel dolgoznak és tanítják őket.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 82.1%-a jelölte

**Holland-kód:** SAI — R 22 · I 49 · A 49 · S 100 · E 13 · C 38

**HEXACO differenciál cél-profil:** C cél 39±23 (w=0.34) · A cél 60±23 (w=0.32) · H cél 56±26 (w=0.17)

**HEXACO abszolút szint:** H 69 · E 41 · X 63 · A 70 · C 58 · O 58

### Gyógypedagógusok

`25-3011.00` · **ISCO-08 2352** Gyógypedagógusok · **FEOR-08:** 2441 Gyógypedagógus; 2442 Konduktor · ESCO `2352.1.1` · EN: Adult Basic Education, Adult Secondary Education, and English as a Second Language Instructors · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gyógypedagógus, jelnyelvtanár, sajátos nevelési igényű tanulók oktatója

A gyógypedagógusok értelmi vagy testi fogyatékossággal élő gyermekekkel, fiatalokkal, illetve felnőttekkel dolgoznak és tanítják őket.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 40.8%-a jelölte

**Holland-kód:** SAC — R 22 · I 36 · A 48 · S 100 · E 31 · C 40

**HEXACO differenciál cél-profil:** C cél 38±22 (w=0.37) · A cél 59±24 (w=0.26) · X cél 56±26 (w=0.18)

**HEXACO abszolút szint:** H 62 · E 44 · X 63 · A 65 · C 49 · O 58

### gyógypedagógus

`25-2058.00` · **ISCO-08 2352** Gyógypedagógusok · **FEOR-08:** 2441 Gyógypedagógus; 2442 Konduktor · ESCO `2352.1.6` · EN: Special Education Teachers, Secondary School

*Piaci megnevezések (ESCO):* jelnyelvtanár, sajátos nevelési igényű tanulók oktatója

A gyógypedagógusok értelmi vagy testi fogyatékossággal élő gyermekekkel, fiatalokkal, illetve felnőttekkel dolgoznak és tanítják őket.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 42.4%-a jelölte

**Holland-kód:** SIA — R 23 · I 47 · A 46 · S 100 · E 16 · C 42

**HEXACO differenciál cél-profil:** C cél 38±22 (w=0.35) · A cél 62±22 (w=0.34) · H cél 56±26 (w=0.16)

**HEXACO abszolút szint:** H 69 · E 41 · X 64 · A 71 · C 56 · O 60

### felsőoktatási tanulmányi tanácsadó

`25-3041.00` · **ISCO-08 2359** Máshová nem sorolható oktatási foglalkozásúak · **FEOR-08:** 2499 Egyéb szakképzett oktató, nevelő · ESCO `2359.14` · EN: Tutors

*Piaci megnevezések (ESCO):* felsőoktatási diáktanácsadó, pályaválasztási tanácsadó, kommunikációs tréner, nyilvánosbeszéd-tréner

A felsőoktatási tanulmányi tanácsadók segítenek tanulóknak oktatási céljaik felismerésében és megvalósításában a középfokúnál magasabb szinten.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 40.9%-a jelölte

**Holland-kód:** SCA — R 21 · I 31 · A 34 · S 96 · E 12 · C 39

**HEXACO differenciál cél-profil:** C cél 40±23 (w=0.27) · A cél 58±24 (w=0.23) · H cél 57±26 (w=0.17) · X cél 56±26 (w=0.15)

**HEXACO abszolút szint:** H 63 · E 48 · X 61 · A 63 · C 49 · O 55

### Könyvelők és könyvvizsgálók

`13-2082.00` · **ISCO-08 2411** Könyvelők és könyvvizsgálók · **FEOR-08:** 2512 Adótanácsadó, adószakértő; 2513 Könyvvizsgáló, könyvelő, könyvszakértő; 2514 Kontroller · ESCO `2411.1.12` · EN: Tax Preparers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* könyvelő, mérlegképes könyvelő, főkönyvelő

A könyvelők felülvizsgálják és elemzik a pénzügyi kimutatásokat, költségvetéseket, pénzügyi jelentéseket és üzleti terveket a tévedésből vagy csalásból eredő szabálytalanságok ellenőrzése céljából, és pénzügyi tanácsadást nyújtanak ügyfeleiknek az olyan kérdésekben, mint a pénzügyi előrejelzés és a kockázatelemzés.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 38.1%-a jelölte

**Holland-kód:** CEI — R 20 · I 23 · A 0 · S 21 · E 40 · C 96

**HEXACO differenciál cél-profil:** H cél 58±25 (w=0.31) · O cél 46±27 (w=0.18) · E cél 54±27 (w=0.17) · A cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 56 · E 53 · X 48 · A 48 · C 55 · O 46

### könyvelő

`13-2011.00` · **ISCO-08 2411** Könyvelők és könyvvizsgálók · **FEOR-08:** 2512 Adótanácsadó, adószakértő; 2513 Könyvvizsgáló, könyvelő, könyvszakértő; 2514 Kontroller · ESCO `2411.1` · EN: Accountants and Auditors

*Piaci megnevezések (ESCO):* mérlegképes könyvelő, főkönyvelő

A könyvelők felülvizsgálják és elemzik a pénzügyi kimutatásokat, költségvetéseket, pénzügyi jelentéseket és üzleti terveket a tévedésből vagy csalásból eredő szabálytalanságok ellenőrzése céljából, és pénzügyi tanácsadást nyújtanak ügyfeleiknek az olyan kérdésekben, mint a pénzügyi előrejelzés és a kockázatelemzés.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** CEI — R 2 · I 43 · A 1 · S 19 · E 48 · C 100

**HEXACO differenciál cél-profil:** A cél 36±20 (w=0.31) · H cél 64±21 (w=0.29) · C cél 57±25 (w=0.16) · E cél 56±26 (w=0.13)

**HEXACO abszolút szint:** H 60 · E 54 · X 48 · A 42 · C 59 · O 50

### könyvelő

`13-2031.00` · **ISCO-08 2411** Könyvelők és könyvvizsgálók · **FEOR-08:** 2512 Adótanácsadó, adószakértő; 2513 Könyvvizsgáló, könyvelő, könyvszakértő; 2514 Kontroller · ESCO `2411.1.4` · EN: Budget Analysts

*Piaci megnevezések (ESCO):* mérlegképes könyvelő, főkönyvelő

A könyvelők felülvizsgálják és elemzik a pénzügyi kimutatásokat, költségvetéseket, pénzügyi jelentéseket és üzleti terveket a tévedésből vagy csalásból eredő szabálytalanságok ellenőrzése céljából, és pénzügyi tanácsadást nyújtanak ügyfeleiknek az olyan kérdésekben, mint a pénzügyi előrejelzés és a kockázatelemzés.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 77.5%-a jelölte

**Holland-kód:** CEI — R 0 · I 45 · A 10 · S 21 · E 65 · C 100

**HEXACO differenciál cél-profil:** A cél 41±24 (w=0.38) · C cél 55±26 (w=0.22) · O cél 54±27 (w=0.18)

**HEXACO abszolút szint:** H 52 · E 51 · X 49 · A 45 · C 57 · O 54

### Pénzügyi és befektetési tanácsadók

`13-2052.00` · **ISCO-08 2412** Pénzügyi és befektetési tanácsadók · **FEOR-08:** 2511 Pénzügyi elemző és befektetési tanácsadó · ESCO `2412.4` · EN: Personal Financial Advisors · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* pénzügyi tervező, személyi bankár, személyi pénzügyi tervező, programfinanszírozási menedzser, programfinanszírozási felelős, finanszírozási felelős

A pénzügyi tervezők különféle pénzügyi kérdésekkel foglalkozó személyeknek nyújtanak segítséget. A pénzügyi tervezésre szakosodtak, például a nyugdíjtervezés, a beruházástervezés, a kockázatkezelés és a biztosítási tervezés, valamint az adótervezés terén.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 57.7%-a jelölte

**Holland-kód:** ECS — R 0 · I 38 · A 12 · S 51 · E 81 · C 77

**HEXACO differenciál cél-profil:** A cél 43±25 (w=0.28) · X cél 57±26 (w=0.26) · E cél 56±26 (w=0.25) · O cél 53±28 (w=0.13)

**HEXACO abszolút szint:** H 62 · E 45 · X 64 · A 57 · C 64 · O 61

### személyi vagyonkezelő

`11-3031.03` · **ISCO-08 2412** Pénzügyi és befektetési tanácsadók · **FEOR-08:** 2511 Pénzügyi elemző és befektetési tanácsadó · ESCO `2412.7` · EN: Investment Fund Managers

*Piaci megnevezések (ESCO):* vagyonkezelő, befektetésialap-kezelő, fix hozamú befektetési alap kezelője, befektetésialap-szakértő, kockázatitőke-befektető, informális kockázatitőke-befektető

A személyi vagyonkezelők nyomon követik és kezelik a személyi vagyonokat.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 63.3%-a jelölte

**Holland-kód:** ECI — R 8 · I 46 · A 11 · S 28 · E 99 · C 70

**HEXACO differenciál cél-profil:** H cél 34±19 (w=0.27) · A cél 38±22 (w=0.19) · O cél 62±22 (w=0.19) · E cél 42±24 (w=0.14)

**HEXACO abszolút szint:** H 47 · E 38 · X 62 · A 51 · C 64 · O 64

### Pénzügyi elemzők

`13-2054.00` · **ISCO-08 2413** Pénzügyi elemzők · **FEOR-08:** 2511 Pénzügyi elemző és befektetési tanácsadó · ESCO `2413.1` · EN: Financial Risk Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* pénzügyi elemző, pénzpiaci elemző, middle office munkatárs

A pénzügyi elemzők gazdasági kutatást végeznek, és olyan pénzügyi vonatkozású témákban végeznek értékes elemzéseket, mint a jövedelmezőség, a likviditás, a fizetőképesség és a vagyonkezelés.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** CIE — R 11 · I 66 · A 5 · S 25 · E 65 · C 73

**HEXACO differenciál cél-profil:** O cél 68±18 (w=0.38) · A cél 42±24 (w=0.17) · H cél 42±25 (w=0.15) · X cél 42±25 (w=0.15)

**HEXACO abszolút szint:** H 47 · E 46 · X 48 · A 48 · C 59 · O 65

### pénzügyi elemző

`13-2051.00` · **ISCO-08 2413** Pénzügyi elemzők · **FEOR-08:** 2511 Pénzügyi elemző és befektetési tanácsadó · ESCO `2413.1` · EN: Financial and Investment Analysts

*Piaci megnevezések (ESCO):* pénzpiaci elemző

A pénzügyi elemzők gazdasági kutatást végeznek, és olyan pénzügyi vonatkozású témákban végeznek értékes elemzéseket, mint a jövedelmezőség, a likviditás, a fizetőképesség és a vagyonkezelés.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** CEI — R 0 · I 68 · A 13 · S 21 · E 68 · C 76

**HEXACO differenciál cél-profil:** O cél 64±21 (w=0.37) · A cél 39±23 (w=0.29) · H cél 42±25 (w=0.21)

**HEXACO abszolút szint:** H 49 · E 45 · X 54 · A 48 · C 59 · O 63

### Vezetési tanácsadók és szervezeti elemzők

`13-1111.00` · **ISCO-08 2421** Vezetési tanácsadók és szervezeti elemzők · **FEOR-08:** 2521 Szervezetirányítási elemző, szervező · ESCO `2421` · EN: Management Analysts · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gazdasági elemző, üzleti elemző, szabványosítási tanácsadó

_(HU leírás nincs; EN:)_ Conduct organizational studies and evaluations, design systems and procedures, conduct work simplification and measurement studies, and prepare operations and procedures manuals to assist management in operating more efficiently and effectively.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 57.1%-a jelölte

**Holland-kód:** CIE — R 6 · I 74 · A 10 · S 30 · E 64 · C 84

**HEXACO differenciál cél-profil:** O cél 63±21 (w=0.39) · X cél 56±26 (w=0.18) · H cél 45±26 (w=0.16) · C cél 45±27 (w=0.14)

**HEXACO abszolút szint:** H 55 · E 45 · X 61 · A 55 · C 54 · O 66

### gazdasági elemző

`13-1051.00` · **ISCO-08 2421** Vezetési tanácsadók és szervezeti elemzők · **FEOR-08:** 2521 Szervezetirányítási elemző, szervező · ESCO `2421.1.1` · EN: Cost Estimators

*Piaci megnevezések (ESCO):* üzleti elemző, szabványosítási tanácsadó

A gazdasági elemzők vállalkozások és vállalatok stratégiai helyzetét kutatják és ismerik meg piacaikkal és érdekelt feleikkel kapcsolatban.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 81.8%-a jelölte

**Holland-kód:** CEI — R 34 · I 36 · A 2 · S 11 · E 61 · C 91

**HEXACO differenciál cél-profil:** A cél 43±25 (w=0.34) · C cél 55±27 (w=0.24) · X cél 54±27 (w=0.22)

**HEXACO abszolút szint:** H 50 · E 49 · X 53 · A 46 · C 56 · O 51

### gazdasági elemző

`15-2051.01` · **ISCO-08 2421** Vezetési tanácsadók és szervezeti elemzők · **FEOR-08:** 2521 Szervezetirányítási elemző, szervező · ESCO `2421.1` · EN: Business Intelligence Analysts

*Piaci megnevezések (ESCO):* üzleti elemző, szabványosítási tanácsadó, üzletiintelligencia-menedzser, üzleti kutatási tanácsadó, üzletiintelligencia-elemző

A gazdasági elemzők vállalkozások és vállalatok stratégiai helyzetét kutatják és ismerik meg piacaikkal és érdekelt feleikkel kapcsolatban.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 68.2%-a jelölte

**Holland-kód:** CIE — R 4 · I 74 · A 16 · S 14 · E 57 · C 80

**HEXACO differenciál cél-profil:** O cél 64±20 (w=0.40) · A cél 37±22 (w=0.35)

**HEXACO abszolút szint:** H 51 · E 50 · X 47 · A 42 · C 52 · O 60

### nemzetközi kapcsolatokkal foglalkozó tisztviselő

`33-3021.06` · **ISCO-08 2422** Stratégiai fejlesztők, elemzők · **FEOR-08:** 2522 Üzletpolitikai elemző, szervező · ESCO `2422.8` · EN: Intelligence Analysts

*Piaci megnevezések (ESCO):* nemzetközi kapcsolatokkal foglalkozó osztály vezetője, kormányközi együttműködésért felelős tisztviselő

A nemzetközi kapcsolatokért felelős tisztviselők biztosítják az állami szektorba tartozó, nemzetközi szervezetek és a kormányok közötti együttműködés fejlesztését.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 65.2%-a jelölte

**Holland-kód:** ICE — R 22 · I 80 · A 18 · S 15 · E 47 · C 73

**HEXACO differenciál cél-profil:** O cél 65±20 (w=0.38) · A cél 43±26 (w=0.17) · X cél 44±26 (w=0.16) · C cél 55±26 (w=0.14)

**HEXACO abszolút szint:** H 54 · E 45 · X 50 · A 50 · C 62 · O 64

### Személyzeti szakemberek és karrier-tanácsadók

`13-1075.00` · **ISCO-08 2423** Személyzeti szakemberek és karrier-tanácsadók · **FEOR-08:** 2523 Személyzeti és pályaválasztási szakértő · ESCO `2423.4` · EN: Labor Relations Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* munkaügyi kapcsolattartó, munkaügyi referens, szakszervezeti képviselő, személyzeti és pályaválasztási szakértő, humánpolitikai előadó, humánerőforrás-menedzser

A munkaügyi kapcsolattartók egy szervezeten belül hajtják végre a munkaügyi politikát, és tanácsokkal látják el a szakszervezeteket a szakpolitikák és a tárgyalások terén.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 33.3%-a jelölte

**Holland-kód:** ECS — R 5 · I 35 · A 12 · S 45 · E 78 · C 60

**HEXACO differenciál cél-profil:** X cél 58±24 (w=0.32) · A cél 55±27 (w=0.19) · C cél 45±27 (w=0.19) · H cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 55 · E 43 · X 62 · A 60 · C 53 · O 53

### Személyzeti szakemberek és karrier-tanácsadók

`13-1141.00` · **ISCO-08 2423** Személyzeti szakemberek és karrier-tanácsadók · **FEOR-08:** 2523 Személyzeti és pályaválasztási szakértő · ESCO `2423.3` · EN: Compensation, Benefits, and Job Analysis Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* személyzeti és pályaválasztási szakértő, humánpolitikai előadó, humánerőforrás-menedzser, munkaügyi elemző, humánpolitikai tanácsadó, személyzeti tanácsadó

A humánerőforrás tisztviselők olyan stratégiákat dolgoznak ki és hajtanak végre, amelyek segítik munkáltatóikat abban, hogy az adott üzleti ágazaton belül megfelelően képzett személyzetet válasszanak ki és tartsanak meg.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 85.7%-a jelölte

**Holland-kód:** CES — R 5 · I 40 · A 7 · S 44 · E 73 · C 80

**HEXACO differenciál cél-profil:** E cél 57±25 (w=0.49) · O cél 53±28 (w=0.20) · H cél 53±28 (w=0.18)

**HEXACO abszolút szint:** H 53 · E 54 · X 51 · A 51 · C 52 · O 53

### karriertanácsadó

`21-1012.00` · **ISCO-08 2423** Személyzeti szakemberek és karrier-tanácsadók · **FEOR-08:** 2523 Személyzeti és pályaválasztási szakértő · ESCO `2423.1` · EN: Educational, Guidance, and Career Counselors and Advisors

*Piaci megnevezések (ESCO):* pályaválasztási tanácsadó, továbbtanulási tanácsadó, foglalkoztatási tanácsadó, állami foglalkoztatási szolgálat tisztviselője, állami foglalkoztatási szolgálat szakértője

A pályaválasztási tanácsadók felnőtteknek és diákoknak nyújtanak útmutatást és tanácsot az oktatási, képzési és szakmai döntések meghozatalában, valamint a karriertervezés és a karrierlehetőségek feltárása révén segítséget nyújtanak az embereknek karrierjük irányításában.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: alapszak (BA/BSc) · a válaszadók 56.3%-a jelölte

**Holland-kód:** SCE — R 0 · I 38 · A 36 · S 100 · E 49 · C 52

**HEXACO differenciál cél-profil:** C cél 36±21 (w=0.36) · A cél 60±24 (w=0.25) · H cél 57±25 (w=0.18)

**HEXACO abszolút szint:** H 68 · E 43 · X 64 · A 68 · C 52 · O 58

### személyzeti és pályaválasztási szakértő

`13-1071.00` · **ISCO-08 2423** Személyzeti szakemberek és karrier-tanácsadók · **FEOR-08:** 2523 Személyzeti és pályaválasztási szakértő · ESCO `2423.3` · EN: Human Resources Specialists

*Piaci megnevezések (ESCO):* humánpolitikai előadó, humánerőforrás-menedzser, karriertanácsadó, pályaválasztási tanácsadó, továbbtanulási tanácsadó, foglalkoztatási tanácsadó

A humánerőforrás tisztviselők olyan stratégiákat dolgoznak ki és hajtanak végre, amelyek segítik munkáltatóikat abban, hogy az adott üzleti ágazaton belül megfelelően képzett személyzetet válasszanak ki és tartsanak meg.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 46.6%-a jelölte

**Holland-kód:** ECS — R 0 · I 25 · A 6 · S 46 · E 78 · C 75

**HEXACO differenciál cél-profil:** H cél 59±24 (w=0.23) · C cél 41±24 (w=0.23) · E cél 57±25 (w=0.18) · X cél 55±26 (w=0.14)

**HEXACO abszolút szint:** H 63 · E 49 · X 60 · A 60 · C 51 · O 52

### Továbbképzési és személyzet-fejlesztési foglalkozásúak 2524 Képzési és személyzetfejlesztési szakértő

`13-1151.00` · **ISCO-08 2424** Továbbképzési és személyzet-fejlesztési foglalkozásúak 2524 Képzési és személyzetfejlesztési szakértő · **FEOR-08:** — · ESCO `2424` · EN: Training and Development Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* vállalati képzési felelős, oktatásszervező, képzési felelős, üzleti coach, business coach, üzleti tréner

_(HU leírás nincs; EN:)_ Design or conduct work-related training and development programs to improve individual skills or organizational performance. May analyze organizational training needs or evaluate training effectiveness.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 78.3%-a jelölte

**Holland-kód:** SIC — R 17 · I 50 · A 36 · S 77 · E 45 · C 46

**HEXACO differenciál cél-profil:** C cél 38±22 (w=0.25) · X cél 60±23 (w=0.22) · O cél 59±24 (w=0.20) · A cél 56±26 (w=0.14)

**HEXACO abszolút szint:** H 58 · E 46 · X 65 · A 63 · C 49 · O 64

### vállalati képzési felelős

`11-3131.00` · **ISCO-08 2424** Továbbképzési és személyzet-fejlesztési foglalkozásúak 2524 Képzési és személyzetfejlesztési szakértő · **FEOR-08:** — · ESCO `2424.3` · EN: Training and Development Managers

*Piaci megnevezések (ESCO):* oktatásszervező, képzési felelős, üzleti coach, business coach, üzleti tréner, vállalati tréner

A vállalati képzési felelősök koordinálják a vállalatoknál az összes a képzési tevékenységet és fejlesztési programot.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 71.4%-a jelölte

**Holland-kód:** ESC — R 15 · I 34 · A 26 · S 76 · E 89 · C 51

**HEXACO differenciál cél-profil:** C cél 40±23 (w=0.23) · X cél 60±23 (w=0.23) · O cél 59±24 (w=0.20) · E cél 55±27 (w=0.12)

**HEXACO abszolút szint:** H 59 · E 45 · X 67 · A 63 · C 53 · O 65

### Reklám- és marketing foglalkozásúak

`13-1199.06` · **ISCO-08 2431** Reklám- és marketing foglalkozásúak · **FEOR-08:** 2531 Piackutató, reklám- és marketingtevékenységet tervező, szervező; 3632 Marketing- és PR-ügyintéző · ESCO `2431.10.4` · EN: Online Merchants · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* marketingszakértő, digitális marketingszakértő, marketingtanácsadó

A marketingszakértők tanácsot adnak a vállalkozásoknak a meghatározott célú marketingstratégiák kidolgozásában.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 41.3%-a jelölte

**Holland-kód:** CER — R 24 · I 10 · A 15 · S 22 · E 80 · C 83

**HEXACO differenciál cél-profil:** X cél 56±26 (w=0.26) · H cél 45±27 (w=0.21) · O cél 55±27 (w=0.21) · A cél 47±28 (w=0.14)

**HEXACO abszolút szint:** H 47 · E 49 · X 54 · A 48 · C 50 · O 54

### piackutatási elemző

`13-1161.00` · **ISCO-08 2431** Reklám- és marketing foglalkozásúak · **FEOR-08:** 2531 Piackutató, reklám- és marketingtevékenységet tervező, szervező; 3632 Marketing- és PR-ügyintéző · ESCO `2431.11` · EN: Market Research Analysts and Marketing Specialists

*Piaci megnevezések (ESCO):* adatbázis-elemző, piackutatási szakértő, marketingszakértő, digitális marketingszakértő, marketingtanácsadó, ármegállapító

A piackutatási elemzők összegyűjtik és tanulmányozzák a piackutatás során gyűjtött információkat, hogy következtetéseket vonjanak le belőlük. Meghatározzák egy termék potenciális vásárlóit, a célcsoportot és azok elérésének módját.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 56.5%-a jelölte

**Holland-kód:** ECI — R 1 · I 60 · A 26 · S 24 · E 75 · C 60

**HEXACO differenciál cél-profil:** O cél 67±19 (w=0.45) · H cél 40±24 (w=0.27)

**HEXACO abszolút szint:** H 46 · E 50 · X 54 · A 50 · C 47 · O 63

### PR foglalkozásúak

`13-1131.00` · **ISCO-08 2432** PR foglalkozásúak · **FEOR-08:** 2532 PR-tevékenységet tervező, szervező; 3632 Marketing- és PR-ügyintéző · ESCO `2432.3` · EN: Fundraisers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* adományszervezési menedzser, adományszervező, fundraising szakértő

Az adományszervezési menedzserek felelősek azért, hogy szervezetek, gyakran nonprofit szervezetek, például jótékonysági szervezetek nevében pénzt gyűjtsenek.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 90.5%-a jelölte

**Holland-kód:** ESC — R 0 · I 17 · A 37 · S 54 · E 84 · C 51

**HEXACO differenciál cél-profil:** X cél 66±19 (w=0.53) · C cél 44±26 (w=0.20) · E cél 53±28 (w=0.11)

**HEXACO abszolút szint:** H 60 · E 44 · X 70 · A 61 · C 52 · O 55

### PR-tanácsadó

`27-3031.00` · **ISCO-08 2432** PR foglalkozásúak · **FEOR-08:** 2532 PR-tevékenységet tervező, szervező; 3632 Marketing- és PR-ügyintéző · ESCO `2432.9` · EN: Public Relations Specialists

*Piaci megnevezések (ESCO):* közönségkapcsolati felelős, méditanácsadó, lobbista, lobbiszakértő, lobbitanácsadó, kampányszervező

A PR-tanácsadók egy vállalkozást vagy szervezetet képviselnek az érdekelt felek és a nyilvánosság felé. Kommunikációs stratégiákat alkalmaznak annak érdekében, hogy kedvező módon támogassák ügyfeleik tevékenységeinek és imidzsének megértését.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 90.9%-a jelölte

**Holland-kód:** EAS — R 0 · I 29 · A 61 · S 49 · E 80 · C 41

**HEXACO differenciál cél-profil:** X cél 66±19 (w=0.25) · H cél 34±20 (w=0.24) · C cél 39±23 (w=0.17) · A cél 59±24 (w=0.14)

**HEXACO abszolút szint:** H 47 · E 40 · X 67 · A 63 · C 47 · O 61

### adományszervezési menedzser

`11-2033.00` · **ISCO-08 2432** PR foglalkozásúak · **FEOR-08:** 2532 PR-tevékenységet tervező, szervező; 3632 Marketing- és PR-ügyintéző · ESCO `2432.3` · EN: Fundraising Managers

*Piaci megnevezések (ESCO):* adományszervező, fundraising szakértő, kampányszervező, kapmányaktivista, aktivista

Az adományszervezési menedzserek felelősek azért, hogy szervezetek, gyakran nonprofit szervezetek, például jótékonysági szervezetek nevében pénzt gyűjtsenek.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 65.5%-a jelölte

**Holland-kód:** ECS — R 0 · I 24 · A 27 · S 46 · E 100 · C 64

**HEXACO differenciál cél-profil:** X cél 67±19 (w=0.38) · E cél 60±23 (w=0.23) · H cél 44±26 (w=0.14) · A cél 55±26 (w=0.12)

**HEXACO abszolút szint:** H 53 · E 50 · X 69 · A 62 · C 53 · O 58

### műszaki értékesítő

`41-4011.00` · **ISCO-08 2433** Műszaki és gyógyászati termékek/szolgáltatások értékesítői (kivéve az IKT-t) · **FEOR-08:** 2533 Kereskedelmi tervező, szervező · ESCO `2433.6` · EN: Sales Representatives, Wholesale and Manufacturing, Technical and Scientific Products

*Piaci megnevezések (ESCO):* technológiai és értékesítési tanácsadó, technológiai és értékesítési tanácsadó-helyettes, orvoslátogató, orvostechnikaieszköz-értékesítő, orvostechnikai eszközök értékesítője

A műszaki értékesítők a vállalkozásban készült árut értékesítik, miközben műszaki rálátást biztosítanak az ügyfelek számára.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 39.5%-a jelölte

**Holland-kód:** ECI — R 30 · I 36 · A 7 · S 35 · E 71 · C 69

**HEXACO differenciál cél-profil:** H cél 26±14 (w=0.43) · X cél 69±18 (w=0.33) · O cél 56±26 (w=0.10)

**HEXACO abszolút szint:** H 39 · E 42 · X 67 · A 55 · C 55 · O 59

### értékesítési mérnök

`41-9031.00` · **ISCO-08 2433** Műszaki és gyógyászati termékek/szolgáltatások értékesítői (kivéve az IKT-t) · **FEOR-08:** 2533 Kereskedelmi tervező, szervező · ESCO `2433.4` · EN: Sales Engineers

*Piaci megnevezések (ESCO):* mérnök értékesítő, műszaki értékesítő, technológiai és értékesítési tanácsadó, technológiai és értékesítési tanácsadó-helyettes

Az értékesítési mérnökök az ügyfelek kérései és igényei szerinti (főként nagy teljesítményt illető) egyedi műszaki kialakítást biztosítanak, például az épületgépészeti berendezésekre vonatkozóan.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 57.3%-a jelölte

**Holland-kód:** ECI — R 40 · I 43 · A 13 · S 30 · E 80 · C 58

**HEXACO differenciál cél-profil:** H cél 33±18 (w=0.35) · X cél 64±20 (w=0.29) · O cél 60±23 (w=0.20)

**HEXACO abszolút szint:** H 47 · E 41 · X 66 · A 58 · C 54 · O 64

### IKT rendszerfejlesztő

`15-1299.08` · **ISCO-08 2511** Rendszerelemzők · **FEOR-08:** 2141 Rendszerelemző (informatikai) · ESCO `2511.14` · EN: Computer Systems Engineers/Architects

*Piaci megnevezések (ESCO):* automatizálási mérnök, IKT rendszerfejlesztők, informatikai auditor, informatikai minőségbiztosítási ellenőr, IKT-auditor, környezet tudatos IKT tanácsadó

Az IKT-rendszerfejlesztők fenntartják, ellenőrzik és javítják a szervezeti támogatási rendszereket. A meglévő vagy új technológiákat a sajátos igények kielégítésére használják fel.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 40.9%-a jelölte

**Holland-kód:** CIR — R 52 · I 74 · A 15 · S 18 · E 34 · C 79

**HEXACO differenciál cél-profil:** O cél 67±19 (w=0.49) · H cél 42±24 (w=0.25) · A cél 44±26 (w=0.18)

**HEXACO abszolút szint:** H 52 · E 44 · X 56 · A 52 · C 58 · O 67

### Rendszerelemzők

`15-1211.00` · **ISCO-08 2511** Rendszerelemzők · **FEOR-08:** 2141 Rendszerelemző (informatikai) · ESCO `2511` · EN: Computer Systems Analysts · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* IT rendszermérnök, IKT rendszermérnök, IT rendszermérnökök, IKT rendszerfejlesztő, automatizálási mérnök, IKT rendszerfejlesztők

_(HU leírás nincs; EN:)_ Analyze science, engineering, business, and other data processing problems to develop and implement solutions to complex applications problems, system administration issues, or network concerns.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 50.7%-a jelölte

**Holland-kód:** ICR — R 38 · I 90 · A 16 · S 15 · E 20 · C 82

**HEXACO differenciál cél-profil:** O cél 69±18 (w=0.54) · H cél 44±26 (w=0.19)

**HEXACO abszolút szint:** H 50 · E 47 · X 50 · A 52 · C 51 · O 66

### Rendszerelemzők

`15-1211.01` · **ISCO-08 2511** Rendszerelemzők · **FEOR-08:** 2141 Rendszerelemző (informatikai) · ESCO `2511.13` · EN: Health Informatics Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* IT rendszermérnök, IKT rendszermérnök, IT rendszermérnökök, IKT rendszerintegrációs tanácsadó, rendszerintegrátor, rendszerintegrációs tanácsadók

Az IKT rendszermérnökök architektúrát, alkatrészeket, modulokat, interfészeket valamint a több összetevőből álló rendszerekre vonatkozó adatokat terveznek meghatározott követelmények teljesítése érdekében.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 52.4%-a jelölte

**Holland-kód:** ICS — R 31 · I 88 · A 16 · S 59 · E 18 · C 62

**HEXACO differenciál cél-profil:** O cél 62±22 (w=0.42) · C cél 44±26 (w=0.22) · E cél 54±27 (w=0.14) · A cél 53±28 (w=0.10)

**HEXACO abszolút szint:** H 60 · E 45 · X 57 · A 61 · C 58 · O 66

### beágyazott rendszer tervező

`15-2051.00` · **ISCO-08 2511** Rendszerelemzők · **FEOR-08:** 2141 Rendszerelemző (informatikai) · ESCO `2511.4` · EN: Data Scientists

*Piaci megnevezések (ESCO):* beágyazott rendszer tervezők, beágyazott rendszer fejlesztő, adattudós, adattudósok, data scientist, IKT kutatási tanácsadó

A beágyazottrendszer-tervezők átültetik és megtervezik a követelményeket, valamint elkészítik a beágyazott ellenőrző rendszer magas szintű tervét vagy architektúráját a műszaki szoftverspecifikációknak megfelelően.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** ICA — R 20 · I 100 · A 27 · S 11 · E 12 · C 73

**HEXACO differenciál cél-profil:** O cél 76±13 (w=0.48) · A cél 37±21 (w=0.24) · X cél 44±26 (w=0.12) · H cél 44±26 (w=0.11)

**HEXACO abszolút szint:** H 50 · E 48 · X 48 · A 44 · C 55 · O 71

### felhasználói felület fejlesztő

`15-1252.00` · **ISCO-08 2512** Szoftverfejlesztők · **FEOR-08:** 2142 Szoftverfejlesztő · ESCO `2512.4` · EN: Software Developers

*Piaci megnevezések (ESCO):* front end fejlesztők, front end fejlesztő, szoftvermérnök, alkalmazásfejlesztők, alkalmazásfejlesztő, szoftverfejlesztő

A felhasználóifelület-fejlesztők végrehajtják, kódolják, dokumentálják és karbantartják a szoftverrendszer interfészét a front-end fejlesztési technológiák segítségével.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 84.8%-a jelölte

**Holland-kód:** ICR — R 44 · I 84 · A 23 · S 14 · E 14 · C 77

**HEXACO differenciál cél-profil:** O cél 69±17 (w=0.52) · A cél 42±24 (w=0.23) · H cél 42±25 (w=0.21)

**HEXACO abszolút szint:** H 50 · E 47 · X 53 · A 48 · C 55 · O 67

### Web- és multimédia-fejlesztők

`13-1161.01` · **ISCO-08 2513** Web- és multimédia-fejlesztők · **FEOR-08:** 2143 Hálózat- és multimédia-fejlesztő · ESCO `2513.2` · EN: Search Marketing Strategists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* keresőmotor-optimalizálás szakértő, SEO szakértő, keresőmotor optimalizáló

A keresőmotor-optimalizálási szakértők a keresőmotor céllekérdezései tekintetében javítják a cég weboldalainak rangsorolását. SEO kampányokat hoznak létre és indítanak, és azonosítják a fejlesztendő területeket.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 47.8%-a jelölte

**Holland-kód:** ECI — R 0 · I 46 · A 37 · S 29 · E 76 · C 61

**HEXACO differenciál cél-profil:** O cél 69±18 (w=0.37) · H cél 34±19 (w=0.32) · X cél 57±25 (w=0.14) · E cél 45±26 (w=0.11)

**HEXACO abszolút szint:** H 41 · E 46 · X 56 · A 51 · C 48 · O 65

### felhasználói felület tervező

`15-1255.00` · **ISCO-08 2513** Web- és multimédia-fejlesztők · **FEOR-08:** 2143 Hálózat- és multimédia-fejlesztő · ESCO `2513.3` · EN: Web and Digital Interface Designers

*Piaci megnevezések (ESCO):* felhasználói felület tervezők, UI designer, webfejlesztő, webes alkalmazásfejlesztő, webprogramozó

A felhasználóifelület-tervezők feladata, hogy felhasználói interfészeket tervezzenek alkalmazások és rendszerek számára. Elrendezést, grafikát és párbeszédeket, valamint alkalmazkodást szolgáló tevékenységeket végeznek.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** IAC — R 26 · I 65 · A 58 · S 20 · E 36 · C 57

**HEXACO differenciál cél-profil:** O cél 69±17 (w=0.42) · H cél 36±20 (w=0.32) · A cél 55±26 (w=0.12) · C cél 45±27 (w=0.11)

**HEXACO abszolút szint:** H 43 · E 48 · X 52 · A 55 · C 47 · O 65

### webfejlesztő

`15-1254.00` · **ISCO-08 2513** Web- és multimédia-fejlesztők · **FEOR-08:** 2143 Hálózat- és multimédia-fejlesztő · ESCO `2513.5` · EN: Web Developers

*Piaci megnevezések (ESCO):* webes alkalmazásfejlesztő, webprogramozó, webtartalom-menedzser, webtartalom-feltöltő, internetes tartalomfeltöltő

A webfejlesztők a rendelkezésre bocsátott terveken alapuló, interneten hozzáférhető szoftvereket fejlesztenek, valósítanak meg és dokumentálnak.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 45.8%-a jelölte

**Holland-kód:** CIA — R 33 · I 67 · A 36 · S 20 · E 33 · C 67

**HEXACO differenciál cél-profil:** O cél 69±17 (w=0.43) · H cél 40±23 (w=0.22) · A cél 44±26 (w=0.14) · X cél 45±27 (w=0.10)

**HEXACO abszolút szint:** H 43 · E 50 · X 46 · A 45 · C 51 · O 64

### Alkalmazásfejlesztők

`15-1251.00` · **ISCO-08 2514** Alkalmazásfejlesztők · **FEOR-08:** 2144 Alkalmazásprogramozó · ESCO `2514` · EN: Computer Programmers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* IKT alkalmazásfejlesztő, szoftverfejlesztők, szoftveres alkalmazásfejlesztő, ipari mobilkészülékek szoftvereinek fejlesztője, ipari mobilkészülékek szoftvereinek tervezője, mobilszoftver-fejlesztő

_(HU leírás nincs; EN:)_ Create, modify, and test the code and scripts that allow computer applications to run. Work from specifications drawn up by software and web developers or other individuals. May develop and write computer programs to store, locate, and retrieve specific documents, data, and information.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 88.0%-a jelölte

**Holland-kód:** CIR — R 40 · I 68 · A 25 · S 16 · E 18 · C 82

**HEXACO differenciál cél-profil:** O cél 71±16 (w=0.36) · A cél 38±22 (w=0.21) · X cél 39±23 (w=0.19) · H cél 42±25 (w=0.13)

**HEXACO abszolút szint:** H 43 · E 52 · X 40 · A 40 · C 53 · O 63

### Alkalmazásfejlesztők

`51-9162.00` · **ISCO-08 2514** Alkalmazásfejlesztők · **FEOR-08:** 2144 Alkalmazásprogramozó · ESCO `2514.4` · EN: Computer Numerically Controlled Tool Programmers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* irányítástechnikai programozó, automatizálási mérnök, folyamatirányítási szakmérnök

Az irányítástechnikai programozók számítógépes programokat fejlesztenek a gyártási folyamatokban részt vevő automata gépek és berendezések vezérlésére. Elemzik a terveket és a megbízásokat, számítógépes szimulációkat és próbafutásokat végeznek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 32.8%-a jelölte

**Holland-kód:** CRI — R 65 · I 44 · A 9 · S 8 · E 11 · C 82

**HEXACO differenciál cél-profil:** O cél 61±22 (w=0.23) · C cél 60±23 (w=0.20) · H cél 41±24 (w=0.19) · X cél 41±24 (w=0.18)

**HEXACO abszolút szint:** H 38 · E 54 · X 39 · A 40 · C 53 · O 55

### Máshová alkalmazásfejlesztők, -elemzők

`15-1253.00` · **ISCO-08 2519** Máshová alkalmazásfejlesztők, -elemzők · **FEOR-08:** — · ESCO `2519.5` · EN: Software Quality Assurance Analysts and Testers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* IKT-tesztelemző, informatikai tesztelő, IKT-teszttervező, szoftvertesztelő, szoftveralkalmazás tesztelő, tesztelő

Az IKT tesztelemzők tesztkörnyezetben dolgoznak, értékelik a termékeket, ellenőrzik a minőséget és a pontosságot, illetve a tesztforgatókönyveket hoznak létre.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 50.0%-a jelölte

**Holland-kód:** ICR — R 47 · I 79 · A 12 · S 9 · E 10 · C 78

**HEXACO differenciál cél-profil:** O cél 61±23 (w=0.32) · X cél 39±23 (w=0.32) · C cél 56±26 (w=0.17) · A cél 46±27 (w=0.12)

**HEXACO abszolút szint:** H 51 · E 52 · X 43 · A 47 · C 56 · O 58

### adatbázis adminisztrátor

`15-1242.00` · **ISCO-08 2521** Adatbázis-tervezők és -rendszergazdák · **FEOR-08:** 2151 Adatbázis-tervező és -üzemeltető · ESCO `2521.1` · EN: Database Administrators

*Piaci megnevezések (ESCO):* DBA, adatbázis-konfigurációval foglalkozó szakember, adatbázis-tervező, adatbázis-tervezők, adatbázis-felelős, adatbázis fejlesztő

Az adatbázis-rendszergazdák tesztelik, létrehozzák és kezelik a számítógépes adatbázisokat.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 89.0%-a jelölte

**Holland-kód:** CIE — R 30 · I 64 · A 3 · S 22 · E 32 · C 94

**HEXACO differenciál cél-profil:** O cél 61±23 (w=0.35) · A cél 44±26 (w=0.19) · X cél 44±26 (w=0.17) · C cél 55±26 (w=0.16)

**HEXACO abszolút szint:** H 51 · E 50 · X 48 · A 48 · C 58 · O 59

### adatbázis adminisztrátor

`15-1243.00` · **ISCO-08 2521** Adatbázis-tervezők és -rendszergazdák · **FEOR-08:** 2151 Adatbázis-tervező és -üzemeltető · ESCO `2521.1` · EN: Database Architects

*Piaci megnevezések (ESCO):* DBA, adatbázis-konfigurációval foglalkozó szakember, adatbázis-tervező, adatbázis-tervezők, adatbázis-felelős, adatbázis fejlesztő

Az adatbázis-rendszergazdák tesztelik, létrehozzák és kezelik a számítógépes adatbázisokat.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 76.2%-a jelölte

**Holland-kód:** CIE — R 27 · I 77 · A 19 · S 15 · E 28 · C 85

**HEXACO differenciál cél-profil:** O cél 68±18 (w=0.41) · H cél 40±23 (w=0.24) · A cél 43±25 (w=0.17)

**HEXACO abszolút szint:** H 46 · E 50 · X 49 · A 47 · C 57 · O 65

### IKT rendszeradminisztrátor

`15-1244.00` · **ISCO-08 2522** Rendszergazdák · **FEOR-08:** 2152 Rendszergazda · ESCO `2522.1` · EN: Network and Computer Systems Administrators

*Piaci megnevezések (ESCO):* IKT adminisztrátor, IT rendszeradminisztrátor

Az IKT rendszeradminisztrátorok felelősek a számítástechnikai és hálózati rendszerek, szerverek, munkaállomások és perifériás eszközök karbantartásáért, konfigurációjáért és megbízható működtetéséért.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 52.4%-a jelölte

**Holland-kód:** CRI — R 53 · I 51 · A 0 · S 20 · E 41 · C 86

**HEXACO differenciál cél-profil:** O cél 61±23 (w=0.35) · X cél 44±26 (w=0.19) · C cél 54±27 (w=0.14) · H cél 46±27 (w=0.12)

**HEXACO abszolút szint:** H 50 · E 46 · X 48 · A 50 · C 58 · O 60

### Rendszergazdák

`15-1231.00` · **ISCO-08 2522** Rendszergazdák · **FEOR-08:** 2152 Rendszergazda · ESCO `2522.1.1` · EN: Computer Network Support Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* IKT rendszeradminisztrátor, IKT adminisztrátor, IT rendszeradminisztrátor

Az IKT rendszeradminisztrátorok felelősek a számítástechnikai és hálózati rendszerek, szerverek, munkaállomások és perifériás eszközök karbantartásáért, konfigurációjáért és megbízható működtetéséért.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 46.9%-a jelölte

**Holland-kód:** CIR — R 56 · I 60 · A 0 · S 21 · E 27 · C 74

**HEXACO differenciál cél-profil:** O cél 60±23 (w=0.35) · X cél 43±25 (w=0.23) · E cél 45±27 (w=0.15) · H cél 46±27 (w=0.14)

**HEXACO abszolút szint:** H 49 · E 46 · X 46 · A 50 · C 55 · O 58

### IKT hálózati mérnök

`15-1241.00` · **ISCO-08 2523** Számítógép-hálózati foglalkozásúak · **FEOR-08:** 2153 Számítógép-hálózati elemző, üzemeltető · ESCO `2523.2` · EN: Computer Network Architects

*Piaci megnevezések (ESCO):* IKT hálózatmérnök, hálózati mérnök, hálózatfejlesztők, IKT kapacitástervező, IT kapacitástervező, IKT teljesítménymenedzser

Az IKT hálózattervezők alakítják ki a – például hardverből, infrastruktúrából, továbbá kommunikációs és hardver-összetevőkből – álló IKT hálózatok topológiáját és összekapcsolhatóságát.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 55.0%-a jelölte

**Holland-kód:** ICR — R 51 · I 71 · A 21 · S 20 · E 37 · C 68

**HEXACO differenciál cél-profil:** O cél 67±19 (w=0.44) · A cél 42±25 (w=0.20) · H cél 42±25 (w=0.19)

**HEXACO abszolút szint:** H 50 · E 45 · X 52 · A 49 · C 59 · O 66

### IKT biztonsági menedzser

`15-1299.05` · **ISCO-08 2529** Máshová nem sorolható adatbázis- és hálózati 2159 Egyéb adatbázis- és hálózati elemző, üzemeltető foglalkozásúak · **FEOR-08:** — · ESCO `2529.7` · EN: Information Security Engineers

*Piaci megnevezések (ESCO):* IT biztonsági koordinátor, IKT biztonsági menedzserek, biztonsági tesztelő, IKT biztonsági tesztelő, IT biztonsági tesztelő, IKT biztonságtechnikai tanácsadó

Az IKT biztonsági menedzserek szükséges biztonsági frissítéseket javasolnak és hajtanak végre.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 47.4%-a jelölte

**Holland-kód:** CIR — R 55 · I 76 · A 6 · S 14 · E 28 · C 84

**HEXACO differenciál cél-profil:** O cél 67±19 (w=0.32) · A cél 38±22 (w=0.22) · X cél 42±25 (w=0.14) · E cél 43±26 (w=0.13)

**HEXACO abszolút szint:** H 54 · E 41 · X 50 · A 48 · C 64 · O 67

### Máshová nem sorolható adatbázis- és hálózati 2159 Egyéb adatbázis- és hálózati elemző, üzemeltető foglalkozásúak

`15-1212.00` · **ISCO-08 2529** Máshová nem sorolható adatbázis- és hálózati 2159 Egyéb adatbázis- és hálózati elemző, üzemeltető foglalkozásúak · **FEOR-08:** — · ESCO `2529.6` · EN: Information Security Analysts · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* IKT biztonságtechnikai tanácsadó, IT biztonságtechnikai tanácsadó, IKT biztonságtechnikai tanácsadók, IKT biztonsági menedzser, IT biztonsági koordinátor, IKT biztonsági menedzserek

Az IKT biztonsági tanácsadók az adatokhoz és a programokhoz való hozzáférés ellenőrzésére irányuló megoldásokat javasolnak és hajtanak végre. Elősegítik a biztonságos információcserét.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 52.6%-a jelölte

**Holland-kód:** CIR — R 43 · I 73 · A 6 · S 18 · E 31 · C 85

**HEXACO differenciál cél-profil:** O cél 65±20 (w=0.39) · A cél 42±25 (w=0.21) · X cél 44±26 (w=0.16) · C cél 55±27 (w=0.12)

**HEXACO abszolút szint:** H 55 · E 44 · X 52 · A 51 · C 64 · O 66

### jogász

`23-1011.00` · **ISCO-08 2611** Ügyvédek, ügyészek, jogszabály-szövegezők · **FEOR-08:** 2612 Ügyész; 2615 Ügyvéd · ESCO `2611.1` · EN: Lawyers

*Piaci megnevezések (ESCO):* közbeszerzési szakjogász, civilisztikai szakjogász

Az ügyvédek jogi tanácsot adnak az ügyfeleknek, és a nevükben eljárnak a jogi eljárásokban és a jogszabályoknak megfelelően.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 77.2%-a jelölte

**Holland-kód:** ECI — R 2 · I 56 · A 23 · S 41 · E 75 · C 60

**HEXACO differenciál cél-profil:** A cél 38±22 (w=0.29) · H cél 42±25 (w=0.20) · X cél 58±25 (w=0.20) · O cél 57±26 (w=0.17)

**HEXACO abszolút szint:** H 53 · E 41 · X 62 · A 52 · C 62 · O 61

### igazságügyi orvosszakértő

`11-9199.01` · **ISCO-08 2619** Máshová nem sorolható jogi foglalkozásúak · **FEOR-08:** 2611 Jogász, jogtanácsos; 2614 Közjegyző; 2619 Egyéb jogi foglalkozású; 2910 Egyéb magasan képzett ügyintéző · ESCO `2619.12` · EN: Regulatory Affairs Managers

*Piaci megnevezések (ESCO):* patológus, kórboncnok

A halottkémek felügyelik az elhunyt személyek vizsgálatát annak érdekében, hogy fény derüljön a rendkívüli körülmények között bekövetkezett halál okára.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 73.9%-a jelölte

**Holland-kód:** ECI — R 16 · I 33 · A 6 · S 28 · E 92 · C 78

**HEXACO differenciál cél-profil:** A cél 43±25 (w=0.39) · X cél 53±28 (w=0.19) · C cél 52±28 (w=0.14) · O cél 52±29 (w=0.11)

**HEXACO abszolút szint:** H 61 · E 44 · X 60 · A 54 · C 65 · O 58

### igazságügyi orvosszakértő

`13-1041.07` · **ISCO-08 2619** Máshová nem sorolható jogi foglalkozásúak · **FEOR-08:** 2611 Jogász, jogtanácsos; 2614 Közjegyző; 2619 Egyéb jogi foglalkozású; 2910 Egyéb magasan képzett ügyintéző · ESCO `2619.12` · EN: Regulatory Affairs Specialists

*Piaci megnevezések (ESCO):* patológus, kórboncnok

A halottkémek felügyelik az elhunyt személyek vizsgálatát annak érdekében, hogy fény derüljön a rendkívüli körülmények között bekövetkezett halál okára.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 80.0%-a jelölte

**Holland-kód:** CEI — R 7 · I 39 · A 0 · S 25 · E 58 · C 89

**HEXACO differenciál cél-profil:** H cél 55±27 (w=0.25) · C cél 54±27 (w=0.23) · A cél 46±27 (w=0.21) · E cél 54±28 (w=0.19)

**HEXACO abszolút szint:** H 56 · E 50 · X 51 · A 50 · C 59 · O 52

### Könyvtárosok és hasonló információs foglalkozásúak

`25-4022.00` · **ISCO-08 2622** Könyvtárosok és hasonló információs foglalkozásúak · **FEOR-08:** 2711 Könyvtáros, informatikus könyvtáros · ESCO `2622.2` · EN: Librarians and Media Collections Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* könyvtáros, iskolai könyvtáros, zenei könyvtáros, információmenedzser, adatmenedzser, információ- és tudásmenedzser

A könyvtárosok kezelik a könyvtárakat és kapcsolódó könyvtári szolgáltatásokat végeznek. Információforrásokat kezelnek, gyűjtenek és fejlesztenek. Az információkat elérhetővé, hozzáférhetővé és fellelhetővé teszik bármilyen felhasználó számára.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 64.7%-a jelölte

**Holland-kód:** CSI — R 22 · I 44 · A 28 · S 51 · E 29 · C 80

**HEXACO differenciál cél-profil:** C cél 39±23 (w=0.28) · E cél 59±24 (w=0.22) · O cél 58±25 (w=0.19) · X cél 57±25 (w=0.17)

**HEXACO abszolút szint:** H 53 · E 55 · X 56 · A 55 · C 41 · O 57

### Közgazdászok

`19-3011.00` · **ISCO-08 2631** Közgazdászok · **FEOR-08:** 2624 Elemző közgazdász; 2629 Egyéb társadalomtudományi foglalkozású; 2910 Egyéb magasan képzett ügyintéző · ESCO `2631` · EN: Economists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* közgazdász, ökonofizikus, közgazdász statisztikus

_(HU leírás nincs; EN:)_ Conduct research, prepare reports, or formulate plans to address economic problems related to the production and distribution of goods and services or monetary and fiscal policy. May collect and process economic and statistical data using sampling techniques and econometric methods.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 50.0%-a jelölte

**Holland-kód:** ICE — R 6 · I 100 · A 24 · S 23 · E 49 · C 59

**HEXACO differenciál cél-profil:** O cél 72±15 (w=0.49) · A cél 38±22 (w=0.25) · H cél 40±23 (w=0.22)

**HEXACO abszolút szint:** H 46 · E 48 · X 52 · A 46 · C 52 · O 68

### pszichológus

`19-3033.00` · **ISCO-08 2634** Pszichológusok · **FEOR-08:** 2628 Pszichológus · ESCO `2634.2.1` · EN: Clinical and Counseling Psychologists

*Piaci megnevezések (ESCO):* pszichológiai kutató, tanácsadó pszichológus

A pszichológusok az emberek viselkedését és a bennük zajló mentális folyamatokat tanulmányozzák.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 48.0%-a jelölte

**Holland-kód:** SIC — R 1 · I 76 · A 34 · S 93 · E 28 · C 42

**HEXACO differenciál cél-profil:** H cél 63±22 (w=0.27) · C cél 38±22 (w=0.26) · A cél 58±25 (w=0.16) · X cél 44±26 (w=0.12)

**HEXACO abszolút szint:** H 74 · E 41 · X 60 · A 70 · C 58 · O 63

### pszichológus

`19-3034.00` · **ISCO-08 2634** Pszichológusok · **FEOR-08:** 2628 Pszichológus · ESCO `2634.2` · EN: School Psychologists

*Piaci megnevezések (ESCO):* pszichológiai kutató, tanácsadó pszichológus

A pszichológusok az emberek viselkedését és a bennük zajló mentális folyamatokat tanulmányozzák.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak utáni szakirányú képzés · a válaszadók 53.0%-a jelölte

**Holland-kód:** SIC — R 0 · I 67 · A 38 · S 96 · E 30 · C 50

**HEXACO differenciál cél-profil:** C cél 39±23 (w=0.35) · A cél 58±24 (w=0.27) · H cél 57±26 (w=0.21) · E cél 54±27 (w=0.14)

**HEXACO abszolút szint:** H 70 · E 41 · X 63 · A 70 · C 59 · O 61

### Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek

`21-1013.00` · **ISCO-08 2635** Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek · **FEOR-08:** 2311 Szociálpolitikus; 2312 Szociális munkás és tanácsadó · ESCO `2635.1.4` · EN: Marriage and Family Therapists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szociális tanácsadó, pszichoterapeuta, párkapcsolati tanácsadó, szociális munkás, kulturális mediátor, kulturális közvetítő

A szociális tanácsadók támogatást és iránymutatást nyújtanak az egyéneknek a szociális munka terepén, hogy segítsék őket a magánéletükben felmerülő konkrét problémák megoldásában.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 79.0%-a jelölte

**Holland-kód:** SIA — R 8 · I 72 · A 43 · S 87 · E 13 · C 32

**HEXACO differenciál cél-profil:** H cél 69±17 (w=0.31) · C cél 33±19 (w=0.27) · A cél 64±21 (w=0.22)

**HEXACO abszolút szint:** H 76 · E 43 · X 58 · A 70 · C 50 · O 60

### Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek

`21-1022.00` · **ISCO-08 2635** Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek · **FEOR-08:** 2311 Szociálpolitikus; 2312 Szociális munkás és tanácsadó · ESCO `2635.3.14` · EN: Healthcare Social Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szociális munkás, kulturális mediátor, kulturális közvetítő

A szociális munkások gyakorlatalapú szakemberek, akik előmozdítják a társadalmi változást és fejlődést, a társadalmi kohéziót, valamint az emberek fokozott szerepvállalását és felszabadulását.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 70.4%-a jelölte

**Holland-kód:** SIC — R 16 · I 54 · A 22 · S 99 · E 26 · C 34

**HEXACO differenciál cél-profil:** C cél 36±21 (w=0.33) · A cél 62±22 (w=0.27) · H cél 60±24 (w=0.22)

**HEXACO abszolút szint:** H 72 · E 40 · X 65 · A 72 · C 56 · O 59

### szociális munkás

`21-1014.00` · **ISCO-08 2635** Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek · **FEOR-08:** 2311 Szociálpolitikus; 2312 Szociális munkás és tanácsadó · ESCO `2635.3.17` · EN: Mental Health Counselors

*Piaci megnevezések (ESCO):* kulturális mediátor, kulturális közvetítő, szociális tanácsadó, pszichoterapeuta, párkapcsolati tanácsadó

A szociális munkások gyakorlatalapú szakemberek, akik előmozdítják a társadalmi változást és fejlődést, a társadalmi kohéziót, valamint az emberek fokozott szerepvállalását és felszabadulását.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 89.3%-a jelölte

**Holland-kód:** SIC — R 5 · I 57 · A 34 · S 96 · E 33 · C 40

**HEXACO differenciál cél-profil:** C cél 34±20 (w=0.35) · A cél 63±21 (w=0.30) · H cél 62±22 (w=0.26)

**HEXACO abszolút szint:** H 73 · E 39 · X 60 · A 72 · C 54 · O 60

### szociális munkás

`21-1023.00` · **ISCO-08 2635** Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek · **FEOR-08:** 2311 Szociálpolitikus; 2312 Szociális munkás és tanácsadó · ESCO `2635.3.17` · EN: Mental Health and Substance Abuse Social Workers

*Piaci megnevezések (ESCO):* kulturális mediátor, kulturális közvetítő, szociális tanácsadó, pszichoterapeuta, párkapcsolati tanácsadó

A szociális munkások gyakorlatalapú szakemberek, akik előmozdítják a társadalmi változást és fejlődést, a társadalmi kohéziót, valamint az emberek fokozott szerepvállalását és felszabadulását.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 77.2%-a jelölte

**Holland-kód:** SIC — R 12 · I 51 · A 30 · S 100 · E 24 · C 35

**HEXACO differenciál cél-profil:** C cél 34±19 (w=0.39) · A cél 61±22 (w=0.27) · H cél 60±24 (w=0.23)

**HEXACO abszolút szint:** H 70 · E 40 · X 64 · A 70 · C 52 · O 58

### Írók és hasonló szerzők

`27-3043.00` · **ISCO-08 2641** Írók és hasonló szerzők · **FEOR-08:** 2715 Könyv- és lapkiadó szerkesztője; 2721 Író (újságíró nélkül) · ESCO `2641` · EN: Writers and Authors · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* író, tankönyvíró, kreatív író, könyvszerkesztő, kéziratszerkesztő, kiadói szerkesztő

_(HU leírás nincs; EN:)_ Originate and prepare written material, such as scripts, stories, advertisements, and other material.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 47.0%-a jelölte

**Holland-kód:** AEC — R 0 · I 38 · A 95 · S 31 · E 62 · C 39

**HEXACO differenciál cél-profil:** O cél 73±15 (w=0.36) · H cél 33±19 (w=0.27) · X cél 60±24 (w=0.15) · C cél 43±26 (w=0.11)

**HEXACO abszolút szint:** H 38 · E 48 · X 56 · A 48 · C 39 · O 66

### író

`27-3042.00` · **ISCO-08 2641** Írók és hasonló szerzők · **FEOR-08:** 2715 Könyv- és lapkiadó szerkesztője; 2721 Író (újságíró nélkül) · ESCO `2641.4` · EN: Technical Writers

*Piaci megnevezések (ESCO):* tankönyvíró, kreatív író, könyvszerkesztő, kéziratszerkesztő, kiadói szerkesztő

Az író a könyvek tartalmát fejlesztik. Regényeket, verseket, novellákat, képregényeket és egyéb irodalmi műveket írnak. Az írás ilyen formái lehetnek fiktívek vagy nem fiktívek.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 35.2%-a jelölte

**Holland-kód:** CAI — R 30 · I 45 · A 54 · S 17 · E 16 · C 72

**HEXACO differenciál cél-profil:** O cél 64±21 (w=0.44) · X cél 43±26 (w=0.21) · E cél 54±27 (w=0.12) · H cél 47±28 (w=0.10)

**HEXACO abszolút szint:** H 46 · E 55 · X 43 · A 45 · C 48 · O 58

### Újságírók

`27-3023.00` · **ISCO-08 2642** Újságírók · **FEOR-08:** 2715 Könyv- és lapkiadó szerkesztője; 2716 Újságíró, rádióműsor-, televízióműsor-szerkesztő · ESCO `2642.1` · EN: News Analysts, Reporters, and Journalists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* újságíró, riporter, ; tényfeltáró újságíró

Az újságírók kutatásokat végeznek, ellenőrzik a sztorikat és megírja a cikkeket az újságokba, magazinokba, televíziós és egyéb médiába. Ezek a cikkek politikai, gazdasági, kulturális, társadalmi és sporteseményekről számolnak be.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** AIE — R 8 · I 53 · A 68 · S 30 · E 49 · C 44

**HEXACO differenciál cél-profil:** O cél 65±20 (w=0.29) · X cél 60±23 (w=0.20) · H cél 42±24 (w=0.16) · E cél 42±25 (w=0.15)

**HEXACO abszolút szint:** H 48 · E 41 · X 61 · A 52 · C 48 · O 65

### újságíró

`27-3041.00` · **ISCO-08 2642** Újságírók · **FEOR-08:** 2715 Könyv- és lapkiadó szerkesztője; 2716 Újságíró, rádióműsor-, televízióműsor-szerkesztő · ESCO `2642.1.12` · EN: Editors

*Piaci megnevezések (ESCO):* riporter, ; tényfeltáró újságíró

Az újságírók kutatásokat végeznek, ellenőrzik a sztorikat és megírja a cikkeket az újságokba, magazinokba, televíziós és egyéb médiába. Ezek a cikkek politikai, gazdasági, kulturális, társadalmi és sporteseményekről számolnak be.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 80.4%-a jelölte

**Holland-kód:** ACE — R 0 · I 32 · A 73 · S 26 · E 52 · C 61

**HEXACO differenciál cél-profil:** H cél 39±23 (w=0.30) · O cél 60±24 (w=0.27) · X cél 57±25 (w=0.20) · A cél 44±26 (w=0.15)

**HEXACO abszolút szint:** H 49 · E 45 · X 60 · A 53 · C 57 · O 62

### Fordítók, tolmácsok és egyéb nyelvészek

`27-3091.00` · **ISCO-08 2643** Fordítók, tolmácsok és egyéb nyelvészek · **FEOR-08:** 2627 Nyelvész, fordító, tolmács; 3514 Jelnyelvi tolmács · ESCO `2643` · EN: Interpreters and Translators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* tolmács, orvosi tolmács, konszekutív tolmács, fordító, korrektor, videojáték-fordító

_(HU leírás nincs; EN:)_ Interpret oral or sign language, or translate written text from one language into another.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 54.7%-a jelölte

**Holland-kód:** CAS — R 15 · I 36 · A 55 · S 41 · E 15 · C 63

**HEXACO differenciál cél-profil:** H cél 65±20 (w=0.35) · X cél 37±22 (w=0.30) · O cél 57±26 (w=0.16)

**HEXACO abszolút szint:** H 64 · E 50 · X 45 · A 54 · C 53 · O 57

### Zenészek, énekesek és zeneszerzők

`27-2042.00` · **ISCO-08 2652** Zenészek, énekesek és zeneszerzők · **FEOR-08:** 2724 Zeneszerző, zenész, énekes · ESCO `2652` · EN: Musicians and Singers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* zenész, hangversenymester, kürtművész, zeneszerző, számítógépes zeneszerző, hangmester

_(HU leírás nincs; EN:)_ Play one or more musical instruments or sing. May perform on stage, for broadcasting, or for sound or video recording.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 29.1%-a jelölte

**Holland-kód:** AES — R 31 · I 9 · A 94 · S 40 · E 40 · C 20

**HEXACO differenciál cél-profil:** H cél 28±16 (w=0.31) · X cél 65±20 (w=0.22) · E cél 36±21 (w=0.20) · O cél 62±22 (w=0.17)

**HEXACO abszolút szint:** H 36 · E 40 · X 60 · A 52 · C 40 · O 60

### Film, színház- és hasonló rendezők, producerek

`27-4032.00` · **ISCO-08 2654** Film, színház- és hasonló rendezők, producerek · **FEOR-08:** 2725 Rendező, operatőr · ESCO `2654.5` · EN: Film and Video Editors · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* utómunka-vezető, utómunka-felügyelő, utómunka-koordinátor, rádióproducer, rádiós szerkesztő, rádiós producer

_(HU leírás nincs; EN:)_ Edit moving images on film, video, or other media. May work with a producer or director to organize images for final production. May edit or synchronize soundtracks with images.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 65.1%-a jelölte

**Holland-kód:** ACR — R 36 · I 15 · A 77 · S 16 · E 35 · C 46

**HEXACO differenciál cél-profil:** O cél 67±19 (w=0.41) · H cél 38±22 (w=0.30) · E cél 45±27 (w=0.12)

**HEXACO abszolút szint:** H 42 · E 47 · X 48 · A 51 · C 50 · O 63

### rádióproducer

`27-2012.00` · **ISCO-08 2654** Film, színház- és hasonló rendezők, producerek · **FEOR-08:** 2725 Rendező, operatőr · ESCO `2654.3` · EN: Producers and Directors

*Piaci megnevezések (ESCO):* rádiós szerkesztő, rádiós producer, vágó, filmvágó, televíziós vágó, utómunka-vezető

A rádióproducerek felelősek a rádióműsorok elkészítésének megszervezéséért. A rádióműsorok olyan vetületeit felügyelik, mint a tartalomszerkesztés, a hanganyag előállítása, az erőforrás-tervezés és a személyzet felügyelete.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 56.7%-a jelölte

**Holland-kód:** AEC — R 19 · I 21 · A 86 · S 35 · E 80 · C 43

**HEXACO differenciál cél-profil:** H cél 24±13 (w=0.31) · X cél 68±18 (w=0.22) · O cél 66±20 (w=0.19) · E cél 40±24 (w=0.11)

**HEXACO abszolút szint:** H 40 · E 37 · X 69 · A 62 · C 49 · O 68


## 3 — Egyéb felsőfokú vagy középfokú képzettséget igénylő foglalkozások

### Kémia- és fizika tudományok technikusai

`17-3028.00` · **ISCO-08 3111** Kémia- és fizika tudományok technikusai · **FEOR-08:** 3139 Egyéb, máshova nem sorolható technikus · ESCO `3111.9` · EN: Calibration Technologists and Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* metrológiai technikus, metrológustechnikus

A metrológiai technikusok gyakorlati ismereteiket alkalmazzák a mérőműszerek, a vizsgálóberendezések kalibrálására és teljesítményük elemzésére. Biztosítják, hogy az értékelt berendezések megfelelnek a teljesítmény és a pontosság követelményeinek.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: —

**Holland-kód:** RCI — R 88 · I 52 · A 2 · S 9 · E 0 · C 76

**HEXACO differenciál cél-profil:** X cél 38±22 (w=0.29) · O cél 60±24 (w=0.23) · C cél 59±24 (w=0.22) · A cél 43±26 (w=0.16)

**HEXACO abszolút szint:** H 45 · E 54 · X 40 · A 43 · C 57 · O 55

### Kémia- és fizika tudományok technikusai

`19-4013.00` · **ISCO-08 3111** Kémia- és fizika tudományok technikusai · **FEOR-08:** 3139 Egyéb, máshova nem sorolható technikus · ESCO `3111` · EN: Food Science Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* élelmiszeranalitikus, élelmiszeranalitikusok, élelmiszeranalitikus  vegyész

_(HU leírás nincs; EN:)_ Work with food scientists or technologists to perform standardized qualitative and quantitative tests to determine physical or chemical properties of food or beverage products.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 32.3%-a jelölte

**Holland-kód:** RCI — R 76 · I 58 · A 6 · S 12 · E 16 · C 67

**HEXACO differenciál cél-profil:** H cél 56±26 (w=0.26) · X cél 44±26 (w=0.24) · E cél 54±27 (w=0.19) · C cél 54±27 (w=0.17)

**HEXACO abszolút szint:** H 50 · E 56 · X 43 · A 44 · C 50 · O 47

### Kémia- és fizika tudományok technikusai

`19-4031.00` · **ISCO-08 3111** Kémia- és fizika tudományok technikusai · **FEOR-08:** 3139 Egyéb, máshova nem sorolható technikus · ESCO `3111` · EN: Chemical Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* vegyésztechnikus, radiokémiai technikus, vegyészeti laboratóriumi technikus, bőrfeldolgozó-ipari laboratóriumi technikus, bőripari laboratóriumi technikus, bőripari vegyésztechnikus

_(HU leírás nincs; EN:)_ Conduct chemical and physical laboratory tests to assist scientists in making qualitative and quantitative analyses of solids, liquids, and gaseous materials for research and development of new products or processes, quality control, maintenance of environmental standards, and other work involving experimental, theoretical, or practical application of chemistry and related sciences.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 43.7%-a jelölte

**Holland-kód:** IRC — R 74 · I 80 · A 8 · S 11 · E 2 · C 71

**HEXACO differenciál cél-profil:** X cél 40±24 (w=0.32) · O cél 57±25 (w=0.24) · C cél 57±26 (w=0.22) · A cél 46±28 (w=0.11)

**HEXACO abszolút szint:** H 50 · E 53 · X 43 · A 47 · C 56 · O 54

### környezetvédelmi technikus

`19-4042.00` · **ISCO-08 3111** Kémia- és fizika tudományok technikusai · **FEOR-08:** 3139 Egyéb, máshova nem sorolható technikus · ESCO `3111.2` · EN: Environmental Science and Protection Technicians, Including Health

*Piaci megnevezések (ESCO):* települési környezetvédelmi technikus, környezetvédelmi emissziómérő technikus

A környezetvédelmi technikusok kivizsgálják a szennyezés forrásait, valamint segítik a szennyezés megelőzésére és a környezetvédelemre vonatkozó tervek kidolgozását.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 68.2%-a jelölte

**Holland-kód:** RIC — R 80 · I 77 · A 4 · S 16 · E 6 · C 66

**HEXACO differenciál cél-profil:** X cél 41±24 (w=0.45) · O cél 57±26 (w=0.34) · H cél 52±29 (w=0.11)

**HEXACO abszolút szint:** H 54 · E 48 · X 46 · A 51 · C 55 · O 56

### építőtechnikus

`17-3022.00` · **ISCO-08 3112** Építésztechnikusok · **FEOR-08:** 3117 Építő- és építésztechnikus · ESCO `3112.1` · EN: Civil Engineering Technologists and Technicians

*Piaci megnevezések (ESCO):* mélyépítési technikus, építő- és építésztechnikus

Az építésztechnikusok segítenek az építési tervek megtervezésében és kivitelezésében, valamint a szervezési feladatok elvégzésében, például a tervezés és nyomon követés során, valamint az építési munkák megpályázásában és számlázásában.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 29.8%-a jelölte

**Holland-kód:** RIC — R 79 · I 73 · A 31 · S 9 · E 17 · C 71

**HEXACO differenciál cél-profil:** A cél 44±26 (w=0.27) · C cél 55±27 (w=0.22) · X cél 46±27 (w=0.19) · O cél 54±27 (w=0.18)

**HEXACO abszolút szint:** H 47 · E 54 · X 44 · A 42 · C 50 · O 50

### építőtechnikus

`17-3031.00` · **ISCO-08 3112** Építésztechnikusok · **FEOR-08:** 3117 Építő- és építésztechnikus · ESCO `3112.10` · EN: Surveying and Mapping Technicians

*Piaci megnevezések (ESCO):* mélyépítési technikus, építő- és építésztechnikus

Az építésztechnikusok segítenek az építési tervek megtervezésében és kivitelezésében, valamint a szervezési feladatok elvégzésében, például a tervezés és nyomon követés során, valamint az építési munkák megpályázásában és számlázásában.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: —

**Holland-kód:** RCI — R 82 · I 50 · A 15 · S 0 · E 0 · C 77

**HEXACO differenciál cél-profil:** O cél 57±26 (w=0.23) · X cél 44±26 (w=0.21) · C cél 56±26 (w=0.21) · A cél 44±26 (w=0.20)

**HEXACO abszolút szint:** H 41 · E 58 · X 39 · A 39 · C 47 · O 50

### építőtechnikus

`33-2021.00` · **ISCO-08 3112** Építésztechnikusok · **FEOR-08:** 3117 Építő- és építésztechnikus · ESCO `3112.1.6` · EN: Fire Inspectors and Investigators

*Piaci megnevezések (ESCO):* mélyépítési technikus, építő- és építésztechnikus

Az építésztechnikusok segítenek az építési tervek megtervezésében és kivitelezésében, valamint a szervezési feladatok elvégzésében, például a tervezés és nyomon követés során, valamint az építési munkák megpályázásában és számlázásában.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 27.5%-a jelölte

**Holland-kód:** RCI — R 75 · I 56 · A 0 · S 26 · E 39 · C 70

**HEXACO differenciál cél-profil:** H cél 54±28 (w=0.34) · E cél 48±29 (w=0.19) · O cél 48±29 (w=0.17) · C cél 52±29 (w=0.16)

**HEXACO abszolút szint:** H 59 · E 43 · X 55 · A 56 · C 61 · O 53

### építőtechnikus

`47-4011.00` · **ISCO-08 3112** Építésztechnikusok · **FEOR-08:** 3117 Építő- és építésztechnikus · ESCO `3112.1.2` · EN: Construction and Building Inspectors

*Piaci megnevezések (ESCO):* mélyépítési technikus, építő- és építésztechnikus, építőipari munkavédelmi felügyelő

Az építésztechnikusok segítenek az építési tervek megtervezésében és kivitelezésében, valamint a szervezési feladatok elvégzésében, például a tervezés és nyomon követés során, valamint az építési munkák megpályázásában és számlázásában.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 36.0%-a jelölte

**Holland-kód:** RCI — R 86 · I 52 · A 4 · S 8 · E 19 · C 74

**HEXACO differenciál cél-profil:** O cél 41±24 (w=0.26) · H cél 58±25 (w=0.24) · A cél 44±26 (w=0.18) · C cél 55±26 (w=0.16)

**HEXACO abszolút szint:** H 57 · E 50 · X 53 · A 47 · C 58 · O 45

### elektronikai technikus

`17-3023.00` · **ISCO-08 3114** Gyengeáramú villamosipari technikusok · **FEOR-08:** 3122 Villamosipari technikus (elektronikai technikus) · ESCO `3114.1` · EN: Electrical and Electronic Engineering Technologists and Technicians

*Piaci megnevezések (ESCO):* elektromechanikai műszerész, elektronikai műszerész

Az elektronikai technikusok szorosan együttműködnek az elektronikai mérnökökkel az elektronikai berendezések és eszközök fejlesztése terén. Az elektronikus technikusok felelősek az elektronikus eszközök megépítéséért, teszteléséért és karbantartásáért.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: —

**Holland-kód:** RIC — R 88 · I 70 · A 13 · S 13 · E 5 · C 67

**HEXACO differenciál cél-profil:** O cél 61±22 (w=0.32) · X cél 43±26 (w=0.19) · H cél 44±26 (w=0.17) · C cél 55±26 (w=0.16)

**HEXACO abszolút szint:** H 45 · E 52 · X 45 · A 46 · C 54 · O 58

### Gépésztechnikusok

`17-3024.00` · **ISCO-08 3115** Gépésztechnikusok · **FEOR-08:** 3116 Gépésztechnikus · ESCO `3115.1.11` · EN: Electro-Mechanical and Mechatronics Technologists and Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gépésztechnikus

A gépésztechnikusok műszaki támogatást nyújtanak a gépészmérnököknek a gépészeti berendezések előállítása és gyártása terén. Segítséget nyújtanak a tervek és a beállítások elkészítéséhez, valamint a vizsgálatok elvégzéséhez.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 31.7%-a jelölte

**Holland-kód:** RCI — R 100 · I 56 · A 6 · S 0 · E 0 · C 60

**HEXACO differenciál cél-profil:** O cél 61±23 (w=0.25) · X cél 41±24 (w=0.22) · C cél 58±25 (w=0.18) · A cél 44±26 (w=0.14)

**HEXACO abszolút szint:** H 42 · E 51 · X 40 · A 42 · C 53 · O 55

### gépésztechnikus

`17-3027.00` · **ISCO-08 3115** Gépésztechnikusok · **FEOR-08:** 3116 Gépésztechnikus · ESCO `3115.1` · EN: Mechanical Engineering Technologists and Technicians

A gépésztechnikusok műszaki támogatást nyújtanak a gépészmérnököknek a gépészeti berendezések előállítása és gyártása terén. Segítséget nyújtanak a tervek és a beállítások elkészítéséhez, valamint a vizsgálatok elvégzéséhez.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 36.5%-a jelölte

**Holland-kód:** RIC — R 88 · I 73 · A 20 · S 3 · E 1 · C 63

**HEXACO differenciál cél-profil:** O cél 64±20 (w=0.39) · A cél 44±26 (w=0.16) · X cél 44±26 (w=0.16) · H cél 45±27 (w=0.14)

**HEXACO abszolút szint:** H 46 · E 52 · X 46 · A 46 · C 53 · O 60

### gépésztechnikus

`17-3027.01` · **ISCO-08 3115** Gépésztechnikusok · **FEOR-08:** 3116 Gépésztechnikus · ESCO `3115.1.4` · EN: Automotive Engineering Technicians

A gépésztechnikusok műszaki támogatást nyújtanak a gépészmérnököknek a gépészeti berendezések előállítása és gyártása terén. Segítséget nyújtanak a tervek és a beállítások elkészítéséhez, valamint a vizsgálatok elvégzéséhez.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 37.0%-a jelölte

**Holland-kód:** RIC — R 100 · I 73 · A 7 · S 0 · E 4 · C 58

**HEXACO differenciál cél-profil:** O cél 65±20 (w=0.37) · X cél 42±24 (w=0.21) · A cél 43±26 (w=0.17) · C cél 55±27 (w=0.12)

**HEXACO abszolút szint:** H 44 · E 52 · X 42 · A 43 · C 52 · O 59

### műszaki rajzoló

`17-3011.00` · **ISCO-08 3118** Műszaki rajzolók · **FEOR-08:** 3136 Műszaki rajzoló, szerkesztő · ESCO `3118.3.2` · EN: Architectural and Civil Drafters

*Piaci megnevezések (ESCO):* CAD-kezelő

A műszaki rajzolók speciális szoftver vagy manuális technikák segítségével állítják elő és készítik el azokat a műszaki rajzokat, amelyek megmutatják, hogyan készül el, vagy hogyan működik egy adott dolog.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: —

**Holland-kód:** RCA — R 76 · I 54 · A 58 · S 9 · E 9 · C 65

**HEXACO differenciál cél-profil:** A cél 43±25 (w=0.25) · C cél 56±26 (w=0.20) · O cél 56±26 (w=0.20) · H cél 45±27 (w=0.17)

**HEXACO abszolút szint:** H 40 · E 56 · X 42 · A 40 · C 49 · O 50

### műszaki rajzoló

`17-3012.00` · **ISCO-08 3118** Műszaki rajzolók · **FEOR-08:** 3136 Műszaki rajzoló, szerkesztő · ESCO `3118.3.6` · EN: Electrical and Electronics Drafters

*Piaci megnevezések (ESCO):* CAD-kezelő

A műszaki rajzolók speciális szoftver vagy manuális technikák segítségével állítják elő és készítik el azokat a műszaki rajzokat, amelyek megmutatják, hogyan készül el, vagy hogyan működik egy adott dolog.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 40.1%-a jelölte

**Holland-kód:** RCI — R 77 · I 41 · A 34 · S 5 · E 15 · C 76

**HEXACO differenciál cél-profil:** X cél 42±25 (w=0.35) · C cél 56±26 (w=0.26) · E cél 53±28 (w=0.12)

**HEXACO abszolút szint:** H 41 · E 58 · X 38 · A 41 · C 47 · O 47

### műszaki rajzoló

`17-3013.00` · **ISCO-08 3118** Műszaki rajzolók · **FEOR-08:** 3136 Műszaki rajzoló, szerkesztő · ESCO `3118.3.11` · EN: Mechanical Drafters

*Piaci megnevezések (ESCO):* CAD-kezelő

A műszaki rajzolók speciális szoftver vagy manuális technikák segítségével állítják elő és készítik el azokat a műszaki rajzokat, amelyek megmutatják, hogyan készül el, vagy hogyan működik egy adott dolog.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 61.3%-a jelölte

**Holland-kód:** RCI — R 83 · I 46 · A 44 · S 4 · E 6 · C 64

**HEXACO differenciál cél-profil:** H cél 43±25 (w=0.23) · C cél 57±26 (w=0.21) · A cél 44±26 (w=0.17) · O cél 55±27 (w=0.16)

**HEXACO abszolút szint:** H 37 · E 59 · X 41 · A 39 · C 48 · O 49

### Máshová nem sorolható természettudományi és műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok

`17-3025.00` · **ISCO-08 3119** Máshová nem sorolható természettudományi és műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok · **FEOR-08:** 3113 Élelmiszer-ipari technikus; 3114 Fa- és könnyűipari technikus; 3133 Földmérő és térinformatikai technikus; 3135 Minőségbiztosítási technikus; 3139 Egyéb, máshova nem sorolható technikus; 3162 Energetikus; 3163 Munkavédelmi és üzembiztonsági foglalkozású; 3190 Egyéb műszaki foglalkozású · ESCO `3119` · EN: Environmental Engineering Technologists and Technicians · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Apply theory and principles of environmental engineering to modify, test, and operate equipment and devices used in the prevention, control, and remediation of environmental problems, including waste treatment and site remediation, under the direction of engineering staff or scientists.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 67.3%-a jelölte

**Holland-kód:** RIC — R 88 · I 82 · A 12 · S 8 · E 5 · C 63

**HEXACO differenciál cél-profil:** X cél 40±23 (w=0.39) · O cél 60±24 (w=0.36) · C cél 54±27 (w=0.15)

**HEXACO abszolút szint:** H 50 · E 51 · X 43 · A 48 · C 54 · O 56

### Máshová nem sorolható természettudományi és műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok

`19-4099.01` · **ISCO-08 3119** Máshová nem sorolható természettudományi és műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok · **FEOR-08:** 3113 Élelmiszer-ipari technikus; 3114 Fa- és könnyűipari technikus; 3133 Földmérő és térinformatikai technikus; 3135 Minőségbiztosítási technikus; 3139 Egyéb, máshova nem sorolható technikus; 3162 Energetikus; 3163 Munkavédelmi és üzembiztonsági foglalkozású; 3190 Egyéb műszaki foglalkozású · ESCO `3119.16.1` · EN: Quality Control Analysts · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* textilipari folyamatellenőr, textilipari minőségbiztosítási vezető, textilipari minőségellenőr

A textilipari folyamatellenőrök textilfeldolgozási műveleteket és műszaki feladatokat látnak el a textiltermékekkel kapcsolatos különféle tervezési, gyártási és minőség-ellenőrzési területeken, valamint a folyamatok költségellenőrzését végzik el.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 37.8%-a jelölte

**Holland-kód:** CIR — R 52 · I 65 · A 0 · S 4 · E 27 · C 83

**HEXACO differenciál cél-profil:** X cél 41±24 (w=0.28) · C cél 58±24 (w=0.26) · H cél 57±25 (w=0.21) · E cél 54±27 (w=0.14)

**HEXACO abszolút szint:** H 54 · E 54 · X 43 · A 46 · C 58 · O 49

### automatizálási technikus

`17-3024.01` · **ISCO-08 3119** Máshová nem sorolható természettudományi és műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok · **FEOR-08:** 3113 Élelmiszer-ipari technikus; 3114 Fa- és könnyűipari technikus; 3133 Földmérő és térinformatikai technikus; 3135 Minőségbiztosítási technikus; 3139 Egyéb, máshova nem sorolható technikus; 3162 Energetikus; 3163 Munkavédelmi és üzembiztonsági foglalkozású; 3190 Egyéb műszaki foglalkozású · ESCO `3119.2.1` · EN: Robotics Technicians

*Piaci megnevezések (ESCO):* automatikai technikus, automatizálási technikus (elektronikai szakirány)

Az automatizálási technikusok az automatizálási mérnökökkel működnek együtt a termelési folyamatok automatizálását szolgáló alkalmazások és rendszerek kifejlesztésében.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 45.5%-a jelölte

**Holland-kód:** RCI — R 99 · I 48 · A 0 · S 2 · E 6 · C 61

**HEXACO differenciál cél-profil:** O cél 62±22 (w=0.32) · H cél 42±25 (w=0.21) · X cél 44±26 (w=0.16) · C cél 55±27 (w=0.13)

**HEXACO abszolút szint:** H 42 · E 50 · X 44 · A 45 · C 52 · O 58

### ipari technikus

`17-3026.00` · **ISCO-08 3119** Máshová nem sorolható természettudományi és műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok · **FEOR-08:** 3113 Élelmiszer-ipari technikus; 3114 Fa- és könnyűipari technikus; 3133 Földmérő és térinformatikai technikus; 3135 Minőségbiztosítási technikus; 3139 Egyéb, máshova nem sorolható technikus; 3162 Energetikus; 3163 Munkavédelmi és üzembiztonsági foglalkozású; 3190 Egyéb műszaki foglalkozású · ESCO `3119.8` · EN: Industrial Engineering Technologists and Technicians

*Piaci megnevezések (ESCO):* szerszámtechnológus, gyártóüzemi technikus, fejlesztési technikus, termékfejlesztési technikus, termékfejlesztő technikus, minőségtechnikus

Az ipari technikusok segítséget nyújtanak az ipari mérnököknek a gyártó üzem hatékonyságának, biztonságának és termelékenységének javításában.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: megkezdett felsőfokú tanulmányok · a válaszadók 36.9%-a jelölte

**Holland-kód:** RCI — R 72 · I 69 · A 4 · S 7 · E 22 · C 70

**HEXACO differenciál cél-profil:** O cél 56±26 (w=0.26) · X cél 45±27 (w=0.20) · C cél 55±27 (w=0.20) · A cél 46±28 (w=0.16)

**HEXACO abszolút szint:** H 46 · E 55 · X 44 · A 44 · C 49 · O 52

### gyártási művezető

`51-1011.00` · **ISCO-08 3122** Feldolgozóipari irányítók · **FEOR-08:** 3212 Feldolgozóipari szakmai irányító, felügyelő · ESCO `3122.4` · EN: First-Line Supervisors of Production and Operating Workers

*Piaci megnevezések (ESCO):* gyártási vezető, termelési művezető, ipari összeszerelési művezető, összeszerelési művezető, összeszerelési műszakvezető

A gyártási művezetők koordinálják, megtervezik és irányítják a gyártási és termelési folyamatokat. Ők felelnek a termelési ütemtervek vagy megrendelések felülvizsgálatáért, valamint az ezeken a termelési területeken dolgozó alkalmazottakért.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 32.8%-a jelölte

**Holland-kód:** ECR — R 55 · I 10 · A 0 · S 31 · E 88 · C 68

**HEXACO differenciál cél-profil:** X cél 62±22 (w=0.48) · H cél 46±27 (w=0.18) · O cél 46±27 (w=0.17)

**HEXACO abszolút szint:** H 55 · E 46 · X 63 · A 56 · C 56 · O 52

### Építőipari irányítók

`47-1011.00` · **ISCO-08 3123** Építőipari irányítók · **FEOR-08:** 3213 Építőipari szakmai irányító, felügyelő · ESCO `3123.1` · EN: First-Line Supervisors of Construction Trades and Extraction Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* építésvezető, építőipari szakmai irányító, felügyelő, építőipari műszakvezető

Az építésvezetők az építési folyamat valamennyi szakaszában nyomon követik az eljárást. Koordinálják a különböző csoportokat, feladatokat osztanak ki, és megoldják a problémákat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 27.0%-a jelölte

**Holland-kód:** ECR — R 61 · I 15 · A 0 · S 32 · E 83 · C 66

**HEXACO differenciál cél-profil:** X cél 62±22 (w=0.40) · O cél 43±25 (w=0.23) · H cél 44±26 (w=0.20)

**HEXACO abszolút szint:** H 54 · E 43 · X 64 · A 58 · C 57 · O 50

### Építőipari irányítók

`49-1011.00` · **ISCO-08 3123** Építőipari irányítók · **FEOR-08:** 3213 Építőipari szakmai irányító, felügyelő · ESCO `3123.1.11` · EN: First-Line Supervisors of Mechanics, Installers, and Repairers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* építésvezető, építőipari szakmai irányító, felügyelő, építőipari műszakvezető

Az építésvezetők az építési folyamat valamennyi szakaszában nyomon követik az eljárást. Koordinálják a különböző csoportokat, feladatokat osztanak ki, és megoldják a problémákat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 54.1%-a jelölte

**Holland-kód:** ECR — R 52 · I 12 · A 0 · S 43 · E 83 · C 62

**HEXACO differenciál cél-profil:** X cél 60±24 (w=0.44) · O cél 45±26 (w=0.24) · H cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 55 · E 46 · X 62 · A 56 · C 56 · O 50

### Építőipari irányítók

`53-1042.00` · **ISCO-08 3123** Építőipari irányítók · **FEOR-08:** 3213 Építőipari szakmai irányító, felügyelő · ESCO `3123.1.8` · EN: First-Line Supervisors of Helpers, Laborers, and Material Movers, Hand · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* építésvezető, építőipari szakmai irányító, felügyelő, építőipari műszakvezető

Az építésvezetők az építési folyamat valamennyi szakaszában nyomon követik az eljárást. Koordinálják a különböző csoportokat, feladatokat osztanak ki, és megoldják a problémákat.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 35.2%-a jelölte

**Holland-kód:** ECS — R 40 · I 2 · A 2 · S 46 · E 86 · C 65

**HEXACO differenciál cél-profil:** X cél 65±20 (w=0.37) · O cél 40±24 (w=0.23) · A cél 56±26 (w=0.15) · C cél 44±26 (w=0.14)

**HEXACO abszolút szint:** H 54 · E 45 · X 64 · A 59 · C 51 · O 47

### Építőipari irányítók

`53-1043.00` · **ISCO-08 3123** Építőipari irányítók · **FEOR-08:** 3213 Építőipari szakmai irányító, felügyelő · ESCO `3123.1.20` · EN: First-Line Supervisors of Material-Moving Machine and Vehicle Operators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* építésvezető, építőipari szakmai irányító, felügyelő, építőipari műszakvezető

Az építésvezetők az építési folyamat valamennyi szakaszában nyomon követik az eljárást. Koordinálják a különböző csoportokat, feladatokat osztanak ki, és megoldják a problémákat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 29.9%-a jelölte

**Holland-kód:** ECR — R 63 · I 14 · A 0 · S 26 · E 70 · C 63

**HEXACO differenciál cél-profil:** X cél 62±22 (w=0.44) · O cél 41±24 (w=0.33)

**HEXACO abszolút szint:** H 54 · E 46 · X 62 · A 56 · C 54 · O 47

### Erőműkezelők

`51-8013.00` · **ISCO-08 3131** Erőműkezelők · **FEOR-08:** 3151 Energetikai (erőművi) berendezés vezérlője · ESCO `3131` · EN: Power Plant Operators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* erőműkezelő, generátorállomás-kezelő, biomasszaerőmű-kezelő

_(HU leírás nincs; EN:)_ Control, operate, or maintain machinery to generate electric power. Includes auxiliary equipment operators.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 59.8%-a jelölte

**Holland-kód:** RCI — R 97 · I 31 · A 0 · S 4 · E 16 · C 68

**HEXACO differenciál cél-profil:** O cél 38±22 (w=0.25) · C cél 61±22 (w=0.24) · E cél 41±24 (w=0.19) · X cél 42±24 (w=0.18)

**HEXACO abszolút szint:** H 44 · E 47 · X 41 · A 49 · C 56 · O 39

### víztisztító berendezés kezelője

`51-8031.00` · **ISCO-08 3132** Égetőüzemi és víztisztító berendezések kezelői · **FEOR-08:** 3152 Égető-, víz- és csatornaművi berendezés vezérlője · ESCO `3132.7` · EN: Water and Wastewater Treatment Plant and System Operators

*Piaci megnevezések (ESCO):* vízkezelő berendezés kezelője, víztisztító rendszer kezelője, szennyvíztelep-kezelő, alkalmazott szennyvíztisztító telepen, folyékonyhulladék-tisztító berendezés kezelője, alkalmazott folyékonyhulladék-kezelő létesítményben

A víztisztító berendezés kezelője a vizet az ivás, öntözés vagy egyéb használat biztonságosságának szavatolása érdekében kezeli.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 50.0%-a jelölte

**Holland-kód:** RCI — R 96 · I 26 · A 0 · S 10 · E 10 · C 60

**HEXACO differenciál cél-profil:** O cél 44±26 (w=0.29) · C cél 55±27 (w=0.27) · X cél 46±27 (w=0.22) · E cél 48±28 (w=0.12)

**HEXACO abszolút szint:** H 48 · E 50 · X 45 · A 47 · C 53 · O 44

### vegyipari feldolgozó berendezés kezelője

`51-8091.00` · **ISCO-08 3133** Vegyipari feldolgozó berendezések kezelői · **FEOR-08:** 3153 Vegyipari alapanyag-feldolgozó berendezés vezérlője · ESCO `3133.1.3` · EN: Chemical Plant and System Operators

*Piaci megnevezések (ESCO):* vegyipari folyamatoperátor

A vegyipari feldolgozó berendezések kezelője a vegyipari termelési folyamatot ellenőrzi. Gépeket és rendszereket üzemeltet, nyomon követi a berendezések és az ellenőrzése alatt álló műszerek működését, és karbantartja azokat.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 61.5%-a jelölte

**Holland-kód:** RCI — R 87 · I 36 · A 0 · S 4 · E 10 · C 69

**HEXACO differenciál cél-profil:** X cél 40±23 (w=0.26) · C cél 60±23 (w=0.26) · E cél 42±24 (w=0.21) · O cél 43±25 (w=0.18)

**HEXACO abszolút szint:** H 50 · E 46 · X 42 · A 49 · C 58 · O 43

### Fémfeldolgozási folyamatirányító rendszerek kezelői

`51-4191.00` · **ISCO-08 3135** Fémfeldolgozási folyamatirányító rendszerek kezelői · **FEOR-08:** 3155 Fémgyártási berendezés vezérlője · ESCO `3135.1` · EN: Heat Treating Equipment Setters, Operators, and Tenders, Metal and Plastic · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* kohókezelő, kohászati technikus, kohász

A kohókezelő figyelemmel kíséri a fémgyártás formákba öntés előtti folyamatát.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 69.8%-a jelölte

**Holland-kód:** RCI — R 97 · I 20 · A 0 · S 10 · E 0 · C 51

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.30) · O cél 44±26 (w=0.24) · X cél 45±27 (w=0.19) · A cél 45±27 (w=0.19)

**HEXACO abszolút szint:** H 36 · E 58 · X 36 · A 35 · C 43 · O 36

### biotechnikai technikus

`19-4021.00` · **ISCO-08 3141** Élettani tudományok technikusai (kivéve az orvostudományt) · **FEOR-08:** — · ESCO `3141.1` · EN: Biological Technicians

*Piaci megnevezések (ESCO):* biotechnológus technikus, biotechnológiai technikus, laboratóriumi technikus, kutatólaboratóriumi technikus, laboratóriumi szakasszisztens

A biotechnikai technikus a tudósok munkáját támogató technológiai feladatokat lát el. Olyan laboratóriumi környezetben dolgozik, ahol munkájával a tudósokat támogatja a biotechnológia különböző formáinak kutatásában, fejlesztésében és tesztelésében.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 48.8%-a jelölte

**Holland-kód:** CRI — R 77 · I 73 · A 3 · S 16 · E 5 · C 77

**HEXACO differenciál cél-profil:** X cél 38±22 (w=0.40) · O cél 60±23 (w=0.34) · C cél 55±27 (w=0.16)

**HEXACO abszolút szint:** H 49 · E 53 · X 41 · A 49 · C 53 · O 56

### mezőgazdasági technikus

`19-4012.00` · **ISCO-08 3142** Mezőgazdasági technikusok technikusok · **FEOR-08:** 3131 Mezőgazdasági technikus; 3342 Növényorvosi (növényvédelmi) asszisztens 4. · ESCO `3142.1` · EN: Agricultural Technicians

*Piaci megnevezések (ESCO):* akvakultúra-technikus, kertésztechnikus

A mezőgazdasági technikus a mezőgazdasággal és a víziállatokkal kapcsolatos adatokat gyűjt, valamint kísérleteket és vizsgálatokat végez.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 41.3%-a jelölte

**Holland-kód:** RIC — R 97 · I 60 · A 0 · S 8 · E 16 · C 54

**HEXACO differenciál cél-profil:** O cél 56±26 (w=0.38) · A cél 46±27 (w=0.25) · C cél 52±28 (w=0.15) · H cél 52±29 (w=0.10)

**HEXACO abszolút szint:** H 49 · E 52 · X 47 · A 45 · C 47 · O 53

### Légijármű-vezetők és hasonló foglalkozásúak

`53-2011.00` · **ISCO-08 3153** Légijármű-vezetők és hasonló foglalkozásúak · **FEOR-08:** 3172 Légijármű-vezető, hajózómérnök · ESCO `3153.2.2.1` · EN: Airline Pilots, Copilots, and Flight Engineers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* légijármű-vezető, repülőgép-vezető, pilóta, űrhajós, űrsikló-parancsnok, asztronauta

A légijármű-vezető légi járműveket irányít és navigál. Üzemelteti a légi járművek mechanikai és elektromos rendszereit, valamint utasokat, postai küldeményeket és árut szállít.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 61.0%-a jelölte

**Holland-kód:** RCE — R 62 · I 36 · A 7 · S 25 · E 47 · C 62

**HEXACO differenciál cél-profil:** O cél 36±21 (w=0.29) · E cél 39±22 (w=0.23) · H cél 41±24 (w=0.19) · C cél 56±26 (w=0.13)

**HEXACO abszolút szint:** H 52 · E 37 · X 59 · A 59 · C 66 · O 45

### Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője

`29-2032.00` · **ISCO-08 3211** Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője · **FEOR-08:** 3323 Orvosi képalkotó diagnosztikai és terápiás · ESCO `3211.1` · EN: Diagnostic Medical Sonographers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* klinikai perfúziós asszisztens, műtéti szakasszisztens, műtő asszisztens

A klinikai perfúziós asszisztens feladata a szív-tüdő készülék működtetése a sebészeti beavatkozások során a légzés és a vérkeringés biztosítása érdekében.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 47.1%-a jelölte

**Holland-kód:** RCI — R 81 · I 62 · A 5 · S 52 · E 8 · C 68

**HEXACO differenciál cél-profil:** X cél 44±26 (w=0.21) · A cél 56±26 (w=0.20) · H cél 56±26 (w=0.20) · E cél 54±27 (w=0.17)

**HEXACO abszolút szint:** H 59 · E 49 · X 51 · A 59 · C 55 · O 52

### Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője

`29-2034.00` · **ISCO-08 3211** Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője · **FEOR-08:** 3323 Orvosi képalkotó diagnosztikai és terápiás · ESCO `3211.1` · EN: Radiologic Technologists and Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* klinikai perfúziós asszisztens, műtéti szakasszisztens, műtő asszisztens

A klinikai perfúziós asszisztens feladata a szív-tüdő készülék működtetése a sebészeti beavatkozások során a légzés és a vérkeringés biztosítása érdekében.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 72.8%-a jelölte

**Holland-kód:** RCI — R 82 · I 65 · A 0 · S 40 · E 0 · C 68

**HEXACO differenciál cél-profil:** A cél 59±24 (w=0.24) · O cél 42±25 (w=0.20) · H cél 56±26 (w=0.17) · X cél 44±26 (w=0.14)

**HEXACO abszolút szint:** H 59 · E 50 · X 51 · A 60 · C 53 · O 48

### Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője

`29-2035.00` · **ISCO-08 3211** Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője · **FEOR-08:** 3323 Orvosi képalkotó diagnosztikai és terápiás · ESCO `3211` · EN: Magnetic Resonance Imaging Technologists · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Operate Magnetic Resonance Imaging (MRI) scanners. Monitor patient safety and comfort, and view images of area being scanned to ensure quality of pictures. May administer gadolinium contrast dosage intravenously.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 65.2%-a jelölte

**Holland-kód:** RCI — R 74 · I 63 · A 0 · S 42 · E 4 · C 66

**HEXACO differenciál cél-profil:** A cél 58±25 (w=0.20) · X cél 43±25 (w=0.18) · E cél 57±25 (w=0.18) · H cél 57±26 (w=0.17)

**HEXACO abszolút szint:** H 59 · E 51 · X 50 · A 60 · C 54 · O 48

### Orvosi és patológiai labortechnikusok

`29-2012.00` · **ISCO-08 3212** Orvosi és patológiai labortechnikusok · **FEOR-08:** 3324 Orvosi laboratóriumi asszisztens · ESCO `3212` · EN: Medical and Clinical Laboratory Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* orvosi laboratóriumi asszisztens, orvosi laborasszisztens, klinikai laboratóriumi asszisztens, orvosbiológus, orvosbiológiai kutató, biomedikai mérnök

_(HU leírás nincs; EN:)_ Perform routine medical laboratory tests for the diagnosis, treatment, and prevention of disease. May work under the supervision of a medical technologist.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 45.9%-a jelölte

**Holland-kód:** RIC — R 84 · I 82 · A 0 · S 31 · E 0 · C 64

**HEXACO differenciál cél-profil:** O cél 41±24 (w=0.26) · X cél 42±24 (w=0.24) · H cél 57±25 (w=0.20) · C cél 57±26 (w=0.20)

**HEXACO abszolút szint:** H 53 · E 52 · X 43 · A 49 · C 56 · O 42

### orvosi laboratóriumi asszisztens

`29-2011.00` · **ISCO-08 3212** Orvosi és patológiai labortechnikusok · **FEOR-08:** 3324 Orvosi laboratóriumi asszisztens · ESCO `3212.2` · EN: Medical and Clinical Laboratory Technologists

*Piaci megnevezések (ESCO):* orvosi laborasszisztens, klinikai laboratóriumi asszisztens, orvosbiológus, orvosbiológiai kutató, biomedikai mérnök

Az orvosi laboratóriumi asszisztens az orvosbiológus felügyelete alatt dolgozik, és alapvető laboratóriumi eljárásokat végez el.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 52.1%-a jelölte

**Holland-kód:** IRC — R 80 · I 86 · A 2 · S 30 · E 8 · C 66

**HEXACO differenciál cél-profil:** X cél 44±26 (w=0.27) · C cél 55±27 (w=0.22) · A cél 45±27 (w=0.20) · E cél 53±28 (w=0.15)

**HEXACO abszolút szint:** H 53 · E 50 · X 48 · A 50 · C 59 · O 54

### gyógyszertári szakasszisztens

`29-2052.00` · **ISCO-08 3213** Gyógyszerésztechnikusok és -asszisztensek · **FEOR-08:** 3326 Gyógyszertári és gyógyszerellátási asszisztens · ESCO `3213.2` · EN: Pharmacy Technicians

*Piaci megnevezések (ESCO):* gyógyszerellátási szakasszisztens, gyógyszergazdálkodó szakasszisztens, gyógyszertári asszisztens, gyógyszerkiadó szakasszisztens

A gyógyszertári szakasszisztensek egy gyógyszerész felügyelete alatt ellenőrzik a beérkező árukat, a készleteket, megfelelően kezelik és tárolják a gyógyszereket.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 42.0%-a jelölte

**Holland-kód:** CRS — R 54 · I 33 · A 0 · S 39 · E 25 · C 100

**HEXACO differenciál cél-profil:** H cél 64±20 (w=0.30) · O cél 36±20 (w=0.30) · X cél 43±25 (w=0.15) · E cél 56±26 (w=0.13)

**HEXACO abszolút szint:** H 59 · E 54 · X 45 · A 52 · C 53 · O 39

### fogtechnikus

`51-9081.00` · **ISCO-08 3214** Gyógyászatisegédeszköz- és fogtechnikusok · **FEOR-08:** 3333 Fogtechnikus; 3334 Ortopédiai eszközkészítő · ESCO `3214.2` · EN: Dental Laboratory Technicians

*Piaci megnevezések (ESCO):* kórházi fogtechnikus, fogműves, hallásakusztikus, hallókészülék-technikus, ortopédiai eszközkészítő, protéziskészítő

A fogorvos előírásait és utasításait követve rendelésre készült eszközöket (hidak, koronák, műfogsorok és fogszabályzók) készít.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 51.7%-a jelölte

**Holland-kód:** RIC — R 94 · I 58 · A 9 · S 28 · E 0 · C 52

**HEXACO differenciál cél-profil:** C cél 62±22 (w=0.31) · A cél 41±24 (w=0.24) · X cél 42±25 (w=0.21) · E cél 55±27 (w=0.13)

**HEXACO abszolút szint:** H 41 · E 58 · X 39 · A 38 · C 53 · O 46

### Ápolók

`29-2061.00` · **ISCO-08 3221** Ápolók · **FEOR-08:** 3311 Ápoló, szakápoló · ESCO `3221` · EN: Licensed Practical and Licensed Vocational Nurses · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Care for ill, injured, or convalescing patients or persons with disabilities in hospitals, nursing homes, clinics, private homes, group homes, and similar institutions. May work under the supervision of a registered nurse.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: megkezdett felsőfokú tanulmányok · a válaszadók 38.2%-a jelölte

**Holland-kód:** SRC — R 60 · I 44 · A 1 · S 75 · E 19 · C 60

**HEXACO differenciál cél-profil:** O cél 40±23 (w=0.28) · A cél 60±23 (w=0.26) · H cél 57±25 (w=0.19) · C cél 44±26 (w=0.16)

**HEXACO abszolút szint:** H 65 · E 44 · X 59 · A 66 · C 59 · O 49

### állatorvosi szaksegéd

`29-2056.00` · **ISCO-08 3240** Állatorvosi technikusok és asszisztensek · **FEOR-08:** 3341 Állatorvosi asszisztens · ESCO `3240.2` · EN: Veterinary Technologists and Technicians

*Piaci megnevezések (ESCO):* állatorvosi szaksegédek, állatorvosi asszisztens

Az állatorvosi szaksegéd a nemzeti jogszabályoknak megfelelően szakmai és adminisztratív támogatást nyújt az állatorvosnak.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 41.2%-a jelölte

**Holland-kód:** RIC — R 95 · I 71 · A 0 · S 34 · E 0 · C 59

**HEXACO differenciál cél-profil:** A cél 58±25 (w=0.34) · X cél 44±26 (w=0.26) · O cél 46±28 (w=0.15) · H cél 54±28 (w=0.15)

**HEXACO abszolút szint:** H 60 · E 44 · X 53 · A 62 · C 57 · O 52

### dentálhigiénikus

`29-1292.00` · **ISCO-08 3251** Fogászati asszisztensek és terapeuták · **FEOR-08:** 3325 Fogászati asszisztens · ESCO `3251.2` · EN: Dental Hygienists

*Piaci megnevezések (ESCO):* foghigiénikus, szájhigiénikus, fogászati asszisztens, fogszabályozási asszisztens, fogorvosi asszisztens

A dentálhigiénikus feladata a fogorvos felügyelete alatt és az utasításait követve fogtisztítással és -polírozással, fogkőleszedéssel, profilaktikus fogászati anyagok fogsorra való felvitelével, adatgyűjtéssel, a betegek igényeire szabott átfogó szájhigiéniai és szájápolási tanácsadással foglalkozik a fogászok felügyelete alatt, a beteg utasításainak megfelelően.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 75.2%-a jelölte

**Holland-kód:** SRI — R 71 · I 59 · A 2 · S 72 · E 12 · C 55

**HEXACO differenciál cél-profil:** O cél 38±22 (w=0.28) · H cél 60±23 (w=0.24) · E cél 57±25 (w=0.18) · A cél 57±26 (w=0.16)

**HEXACO abszolút szint:** H 63 · E 50 · X 55 · A 60 · C 54 · O 46

### fogászati asszisztens

`31-9091.00` · **ISCO-08 3251** Fogászati asszisztensek és terapeuták · **FEOR-08:** 3325 Fogászati asszisztens · ESCO `3251.1` · EN: Dental Assistants

*Piaci megnevezések (ESCO):* fogszabályozási asszisztens, fogorvosi asszisztens, dentálhigiénikus, foghigiénikus, szájhigiénikus

A fogászati asszisztens a fogorvos felügyelete mellett és utasításait követve támogatja a fogorvost az általa nyújtott klinikai kezelések gyakorlati végrehajtásában és a nyomon követésben, valamint az adminisztratív feladatok ellátásában.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 46.0%-a jelölte

**Holland-kód:** CRS — R 58 · I 42 · A 0 · S 56 · E 6 · C 74

**HEXACO differenciál cél-profil:** O cél 36±21 (w=0.28) · H cél 61±22 (w=0.24) · A cél 60±24 (w=0.20) · E cél 56±26 (w=0.13)

**HEXACO abszolút szint:** H 60 · E 52 · X 51 · A 59 · C 51 · O 42

### Egészségügyi nyilvántartások és dokumentációk technikusai

`29-9021.00` · **ISCO-08 3252** Egészségügyi nyilvántartások és dokumentációk technikusai · **FEOR-08:** 3322 Egészségügyi dokumentátor · ESCO `3252` · EN: Health Information Technologists and Medical Registrars · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* egészségügyi dokumentációs vezető, betegnyilvántartási vezető, egészségügyi dokumentációs részleg vezetője, képtároló és képtovábbító rendszer kezelője, PACS-rendszerelemző, teleradiológiai adminisztrátor

_(HU leírás nincs; EN:)_ Apply knowledge of healthcare and information systems to assist in the design, development, and continued modification and analysis of computerized healthcare systems. Abstract, collect, and analyze treatment and followup information of patients.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: —

**Holland-kód:** CIS — R 26 · I 70 · A 3 · S 47 · E 20 · C 82

**HEXACO differenciál cél-profil:** O cél 59±24 (w=0.36) · X cél 46±27 (w=0.18) · E cél 54±27 (w=0.16) · H cél 54±28 (w=0.15)

**HEXACO abszolút szint:** H 58 · E 49 · X 52 · A 53 · C 56 · O 60

### egészségügyi dokumentátor

`29-2072.00` · **ISCO-08 3252** Egészségügyi nyilvántartások és dokumentációk technikusai · **FEOR-08:** 3322 Egészségügyi dokumentátor · ESCO `3252.1` · EN: Medical Records Specialists

*Piaci megnevezések (ESCO):* orvosírnok, kórházi adminisztrátor, képtároló és képtovábbító rendszer kezelője, PACS-rendszerelemző, teleradiológiai adminisztrátor

Az egészségügyi dokumentátor feladata a páciensek egészségügyi személyzet rendelkezésére álló adatainak szervezése, frissítése és archiválása. A betegek papíralapú nyilvántartásaiból az adatokat elektronikus sablonokban továbbítják.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: —

**Holland-kód:** CIS — R 31 · I 56 · A 0 · S 40 · E 15 · C 99

**HEXACO differenciál cél-profil:** H cél 64±21 (w=0.30) · X cél 37±21 (w=0.28) · O cél 43±25 (w=0.16)

**HEXACO abszolút szint:** H 54 · E 56 · X 38 · A 48 · C 51 · O 41

### közösségi egészségügyi dolgozó

`21-1094.00` · **ISCO-08 3253** Közösségi egészségügyi foglalkozásúak Közösségi egészségügyi foglalkozásúak · **FEOR-08:** 2225 Védőnő · ESCO `3253.1` · EN: Community Health Workers

*Piaci megnevezések (ESCO):* védőnő, családgondozó

A közösségi egészségügyi dolgozók egészségügyi témákkal kapcsolatban adnak tanácsot és tájékoztatást a közösség számára. Közreműködnek a terhesgondozásban és a szülés utáni ellátásban, táplálkozási tanácsot adnak és segítik a dohányzásról való leszokást.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 51.9%-a jelölte

**Holland-kód:** SEI — R 17 · I 42 · A 20 · S 93 · E 42 · C 40

**HEXACO differenciál cél-profil:** C cél 36±21 (w=0.24) · H cél 61±23 (w=0.19) · A cél 59±24 (w=0.16) · X cél 58±24 (w=0.15)

**HEXACO abszolút szint:** H 68 · E 47 · X 64 · A 66 · C 49 · O 52

### Látszerészek

`29-2081.00` · **ISCO-08 3254** Látszerészek · **FEOR-08:** 3335 Látszerész · ESCO `3254` · EN: Opticians, Dispensing · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* látszerész, látszerészasszisztens, optikus

_(HU leírás nincs; EN:)_ Design, measure, fit, and adapt lenses and frames for client according to written optical prescription or specification. Assist client with inserting, removing, and caring for contact lenses.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 45.8%-a jelölte

**Holland-kód:** CRE — R 56 · I 21 · A 7 · S 34 · E 39 · C 74

**HEXACO differenciál cél-profil:** O cél 41±24 (w=0.24) · E cél 59±24 (w=0.23) · C cél 44±26 (w=0.16) · H cél 56±26 (w=0.15)

**HEXACO abszolút szint:** H 55 · E 55 · X 54 · A 54 · C 47 · O 44

### állatgyógyász

`31-9011.00` · **ISCO-08 3255** Fizioterápiás technikusok és asszisztensek · **FEOR-08:** 3332 Fizioterápiás asszisztens, masszőr · ESCO `3255.1` · EN: Massage Therapists

*Piaci megnevezések (ESCO):* állatrehabilitációs terapeuta, állatorvos, masszázsterapeuta, gyógymasszőr, talpreflex-masszőr

Az állatgyógyász az állatorvosi diagnózist vagy beutalást követően terápiás kezelést nyújt.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 73.1%-a jelölte

**Holland-kód:** SRI — R 64 · I 46 · A 20 · S 79 · E 18 · C 28

**HEXACO differenciál cél-profil:** C cél 37±21 (w=0.28) · H cél 63±21 (w=0.28) · A cél 59±24 (w=0.19) · E cél 59±24 (w=0.19)

**HEXACO abszolút szint:** H 63 · E 52 · X 55 · A 60 · C 43 · O 51

### Orvosi asszisztensek

`29-2055.00` · **ISCO-08 3256** Orvosi asszisztensek · **FEOR-08:** 3321 Általános egészségügyi asszisztens · ESCO `3256.1` · EN: Surgical Technologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* orvosi rendelő asszisztense, szemészeti asszisztens, műtéti szakasszisztens

Az orvosi rendelő asszisztense a következő tevékenységekben segíti az orvos munkáját: támogatást nyújt az egyszerűbb orvosi beavatkozások, standardizált diagnosztikai programok és betegágy melletti diagnosztikák (POCT) elvégzéséhez, biztosítja a műtéti higiéniát, gondoskodik az orvostechnikai eszközök tisztításáról, fertőtlenítéséről, sterilizálásáról és karbantartásáról, valamint az orvos felügyelete alatt és irányítása mellett elvégzi a műtéthez szükséges adminisztratív és szervezési feladatokat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 40.6%-a jelölte

**Holland-kód:** RCS — R 88 · I 37 · A 0 · S 47 · E 10 · C 64

**HEXACO differenciál cél-profil:** O cél 31±17 (w=0.29) · A cél 66±19 (w=0.24) · X cél 38±22 (w=0.18) · H cél 61±23 (w=0.16)

**HEXACO abszolút szint:** H 60 · E 45 · X 44 · A 62 · C 58 · O 38

### Orvosi asszisztensek

`29-9093.00` · **ISCO-08 3256** Orvosi asszisztensek · **FEOR-08:** 3321 Általános egészségügyi asszisztens · ESCO `3256.1` · EN: Surgical Assistants · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* orvosi rendelő asszisztense, szemészeti asszisztens, műtéti szakasszisztens

Az orvosi rendelő asszisztense a következő tevékenységekben segíti az orvos munkáját: támogatást nyújt az egyszerűbb orvosi beavatkozások, standardizált diagnosztikai programok és betegágy melletti diagnosztikák (POCT) elvégzéséhez, biztosítja a műtéti higiéniát, gondoskodik az orvostechnikai eszközök tisztításáról, fertőtlenítéséről, sterilizálásáról és karbantartásáról, valamint az orvos felügyelete alatt és irányítása mellett elvégzi a műtéthez szükséges adminisztratív és szervezési feladatokat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 25.0%-a jelölte

**Holland-kód:** RCS — R 78 · I 41 · A 0 · S 47 · E 13 · C 57

**HEXACO differenciál cél-profil:** O cél 32±18 (w=0.28) · A cél 64±21 (w=0.22) · X cél 39±22 (w=0.18) · H cél 60±24 (w=0.15)

**HEXACO abszolút szint:** H 61 · E 43 · X 47 · A 63 · C 63 · O 41

### Orvosi asszisztensek

`31-9092.00` · **ISCO-08 3256** Orvosi asszisztensek · **FEOR-08:** 3321 Általános egészségügyi asszisztens · ESCO `3256` · EN: Medical Assistants · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* orvosi rendelő asszisztense, szemészeti asszisztens, műtéti szakasszisztens

_(HU leírás nincs; EN:)_ Perform administrative and certain clinical duties under the direction of a physician. Administrative duties may include scheduling appointments, maintaining medical records, billing, and coding information for insurance purposes.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 44.7%-a jelölte

**Holland-kód:** CSR — R 51 · I 47 · A 0 · S 63 · E 16 · C 79

**HEXACO differenciál cél-profil:** O cél 39±22 (w=0.24) · A cél 61±23 (w=0.23) · H cél 60±23 (w=0.22) · C cél 44±26 (w=0.12)

**HEXACO abszolút szint:** H 62 · E 49 · X 53 · A 62 · C 53 · O 45

### munkavédelmi felügyelő

`19-5012.00` · **ISCO-08 3257** Környezet- és foglalkozás-egészségügyi ellenőrök · **FEOR-08:** 3331 Környezet- és foglalkozás-egészségügyi kiegészítő foglalkozású · ESCO `3257.5` · EN: Occupational Health and Safety Technicians

*Piaci megnevezések (ESCO):* munkabiztonsági és munkaegészségügyi felügyelő, közlekedésbiztonsági ellenőr, közlekedésbiztonsági vezető

A munkavédelmi felügyelő a kormányzati és környezetvédelmi jogszabályoknak való megfelelés biztosítása érdekében munkahelyi ellenőrzéseket végez. Feladata továbbá a munkahelyi balesetek kivizsgálása.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 47.6%-a jelölte

**Holland-kód:** CRI — R 72 · I 65 · A 0 · S 31 · E 27 · C 76

**HEXACO differenciál cél-profil:** H cél 56±26 (w=0.41) · A cél 46±28 (w=0.26) · E cél 52±28 (w=0.18)

**HEXACO abszolút szint:** H 60 · E 47 · X 54 · A 54 · C 58 · O 54

### Mentőápolók

`29-2042.00` · **ISCO-08 3258** Mentőápolók · **FEOR-08:** 2226 Mentőtiszt · ESCO `3258.1` · EN: Emergency Medical Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* mentőautó-vezető, mentőgépkocsi-vezető, mentőautó-sofőr

A mentőautó-vezető orvosi vészhelyzetben vezeti a sürgősségi betegszállító járművet, orvosi felügyelet mellett támogatja a mentőápolók munkáját, gondoskodik a beteg biztonságos mozgatásáról, figyeli a beteg alapvető életfunkcióira utaló jelek változásait, jelentést tesz a mentőautó ügyeletes személyzetének és gondoskodik az orvosi eszközök tárolásáról, szállításáról és üzemképességéről.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: —

**Holland-kód:** SRI — R 74 · I 60 · A 0 · S 76 · E 9 · C 46

**HEXACO differenciál cél-profil:** A cél 65±20 (w=0.31) · O cél 39±23 (w=0.22) · E cél 40±24 (w=0.20) · C cél 44±26 (w=0.13)

**HEXACO abszolút szint:** H 64 · E 35 · X 61 · A 70 · C 58 · O 49

### mentőtiszt

`29-2043.00` · **ISCO-08 3258** Mentőápolók · **FEOR-08:** 2226 Mentőtiszt · ESCO `3258.2` · EN: Paramedics

*Piaci megnevezések (ESCO):* mentőápoló

A mentőtiszt feladata, hogy vészhelyzetben még az orvosi létesítményekbe történő szállítás előtt, illetve alatt sürgősségi ellátásban részesítse a betegeket, sérülteket és a kiszolgáltatott helyzetben lévőket.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: —

**Holland-kód:** SRI — R 70 · I 67 · A 0 · S 75 · E 15 · C 40

**HEXACO differenciál cél-profil:** A cél 67±19 (w=0.34) · E cél 38±22 (w=0.23) · C cél 40±24 (w=0.19) · H cél 43±25 (w=0.14)

**HEXACO abszolút szint:** H 56 · E 34 · X 59 · A 70 · C 56 · O 54

### Máshová nem sorolható egészségügyi foglalkozásúak

`29-1126.00` · **ISCO-08 3259** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 3339 Egyéb, humánegészségügyhöz kapcsolódó foglalkozású · ESCO `3259.7` · EN: Respiratory Therapists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* aneszteziológiai szakasszisztens, aneszteziológiai technikus

_(HU leírás nincs; EN:)_ Assess, treat, and care for patients with breathing disorders. Assume primary responsibility for all respiratory care modalities, including the supervision of respiratory therapy technicians.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 82.8%-a jelölte

**Holland-kód:** RSI — R 67 · I 62 · A 0 · S 65 · E 11 · C 49

**HEXACO differenciál cél-profil:** A cél 59±24 (w=0.40) · C cél 45±27 (w=0.22) · O cél 46±27 (w=0.19) · X cél 48±28 (w=0.11)

**HEXACO abszolút szint:** H 64 · E 41 · X 60 · A 67 · C 63 · O 56

### Máshová nem sorolható egészségügyi foglalkozásúak

`29-2031.00` · **ISCO-08 3259** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 3339 Egyéb, humánegészségügyhöz kapcsolódó foglalkozású · ESCO `3259` · EN: Cardiovascular Technologists and Technicians · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Conduct tests on pulmonary or cardiovascular systems of patients for diagnostic, therapeutic, or research purposes. May conduct or assist in electrocardiograms, cardiac catheterizations, pulmonary functions, lung capacity, and similar tests.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 62.9%-a jelölte

**Holland-kód:** RIC — R 77 · I 72 · A 0 · S 54 · E 5 · C 62

**HEXACO differenciál cél-profil:** A cél 63±21 (w=0.32) · O cél 38±22 (w=0.28) · H cél 56±26 (w=0.14) · X cél 45±27 (w=0.12)

**HEXACO abszolút szint:** H 59 · E 47 · X 52 · A 64 · C 55 · O 46

### Értékpapír-kereskedők és pénzügyi közvetítők

`41-3031.00` · **ISCO-08 3311** Értékpapír-kereskedők és pénzügyi közvetítők · **FEOR-08:** 3613 Tőzsde- és pénzügyi ügynök, bróker · ESCO `3311.2` · EN: Securities, Commodities, and Financial Services Sales Agents · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* pénzügyi bróker, jelzálog-tanácsadó, pénzügyi ügynök, tőzsde- és pénzügyi ügynök, tőzsdebróker, tőzsdeügynök

A pénzügyi bróker ügyfelei nevében pénzpiaci tevékenységeket végez. Figyelemmel kíséri az értékpapírok értékének alakulását, ellenőrzi ügyfeleinek pénzügyi dokumentációját, nyomon követi a piaci trendeket és feltételeket, valamint más jogszabályi előírásokat.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 55.3%-a jelölte

**Holland-kód:** ECS — R 4 · I 26 · A 5 · S 34 · E 85 · C 71

**HEXACO differenciál cél-profil:** H cél 35±20 (w=0.27) · X cél 64±21 (w=0.24) · E cél 38±22 (w=0.21) · A cél 41±24 (w=0.15)

**HEXACO abszolút szint:** H 48 · E 36 · X 66 · A 53 · C 59 · O 61

### Hitel- és kölcsönügyintézők

`43-4041.00` · **ISCO-08 3312** Hitel- és kölcsönügyintézők · **FEOR-08:** 3612 Pénzintézeti ügyintéző · ESCO `3312.2` · EN: Credit Authorizers, Checkers, and Clerks · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* hitelügyi tanácsadó, hitelezési tanácsadó, hitelszakértő, hitelkockázati elemző, lakossági hitelkockázati elemző, hitelkockázati referens

A hitelügyi tanácsadók útmutatást nyújtanak a hitelszolgáltatások iránt érdeklődő ügyfelek számára.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: —

**Holland-kód:** CES — R 0 · I 14 · A 0 · S 40 · E 58 · C 100

**HEXACO differenciál cél-profil:** H cél 60±24 (w=0.29) · E cél 57±25 (w=0.21) · O cél 45±26 (w=0.16) · A cél 45±27 (w=0.15)

**HEXACO abszolút szint:** H 53 · E 58 · X 45 · A 44 · C 49 · O 43

### Hitel- és kölcsönügyintézők

`43-4131.00` · **ISCO-08 3312** Hitel- és kölcsönügyintézők · **FEOR-08:** 3612 Pénzintézeti ügyintéző · ESCO `3312.5` · EN: Loan Interviewers and Clerks · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* hitelügyintéző, hitelezési tanácsadó, banki hitelügyintéző, hitelbíráló, hitelelbíráló, hitelengedélyező

A hitelügyintézők értékelik és hagyják jóvá a magánszemélyek és vállalkozások hitelkérelmét. Biztosítják a hitelszervezetek, a hitelfelvevők és az eladók közötti teljes tranzakciókat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 42.9%-a jelölte

**Holland-kód:** CES — R 0 · I 20 · A 0 · S 40 · E 60 · C 99

**HEXACO differenciál cél-profil:** O cél 36±21 (w=0.39) · H cél 62±22 (w=0.32) · E cél 56±26 (w=0.17)

**HEXACO abszolút szint:** H 55 · E 56 · X 48 · A 48 · C 52 · O 38

### hitelügyi tanácsadó

`13-2041.00` · **ISCO-08 3312** Hitel- és kölcsönügyintézők · **FEOR-08:** 3612 Pénzintézeti ügyintéző · ESCO `3312.2.1` · EN: Credit Analysts

*Piaci megnevezések (ESCO):* hitelezési tanácsadó, hitelszakértő, hitelkockázati elemző, lakossági hitelkockázati elemző, hitelkockázati referens, hitelezési vezető

A hitelügyi tanácsadók útmutatást nyújtanak a hitelszolgáltatások iránt érdeklődő ügyfelek számára.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 95.0%-a jelölte

**Holland-kód:** CEI — R 0 · I 46 · A 0 · S 24 · E 59 · C 98

**HEXACO differenciál cél-profil:** A cél 39±23 (w=0.30) · C cél 59±24 (w=0.24) · E cél 56±26 (w=0.15) · X cél 45±27 (w=0.14)

**HEXACO abszolút szint:** H 50 · E 54 · X 45 · A 43 · C 58 · O 52

### hitelügyi tanácsadó

`13-2071.00` · **ISCO-08 3312** Hitel- és kölcsönügyintézők · **FEOR-08:** 3612 Pénzintézeti ügyintéző · ESCO `3312.2` · EN: Credit Counselors

*Piaci megnevezések (ESCO):* hitelezési tanácsadó, hitelszakértő, hitelezési vezető, vezető hitelügyintéző, hitelezési menedzser, hitelügyintéző

A hitelügyi tanácsadók útmutatást nyújtanak a hitelszolgáltatások iránt érdeklődő ügyfelek számára.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 40.0%-a jelölte

**Holland-kód:** CSE — R 0 · I 28 · A 13 · S 65 · E 62 · C 72

**HEXACO differenciál cél-profil:** H cél 63±21 (w=0.37) · E cél 58±25 (w=0.22) · O cél 44±26 (w=0.17) · C cél 44±26 (w=0.16)

**HEXACO abszolút szint:** H 70 · E 47 · X 60 · A 61 · C 58 · O 53

### hitelügyintéző

`13-2072.00` · **ISCO-08 3312** Hitel- és kölcsönügyintézők · **FEOR-08:** 3612 Pénzintézeti ügyintéző · ESCO `3312.5` · EN: Loan Officers

*Piaci megnevezések (ESCO):* hitelezési tanácsadó, banki hitelügyintéző, hitelbíráló, hitelelbíráló, hitelengedélyező, bankszámla-ügyintéző

A hitelügyintézők értékelik és hagyják jóvá a magánszemélyek és vállalkozások hitelkérelmét. Biztosítják a hitelszervezetek, a hitelfelvevők és az eladók közötti teljes tranzakciókat.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 68.7%-a jelölte

**Holland-kód:** CES — R 7 · I 22 · A 0 · S 44 · E 66 · C 85

**HEXACO differenciál cél-profil:** X cél 58±25 (w=0.34) · E cél 55±26 (w=0.23) · A cél 46±27 (w=0.18) · O cél 46±28 (w=0.16)

**HEXACO abszolút szint:** H 57 · E 48 · X 61 · A 54 · C 58 · O 52

### Becsüsök és kárfelmérők

`13-1031.00` · **ISCO-08 3315** Becsüsök és kárfelmérők · **FEOR-08:** 3616 Értékbecslő, kárbecslő, kárszakértő · ESCO `3315.5` · EN: Claims Adjusters, Examiners, and Investigators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* biztosítási kárfelmérő, gépjármű-értékbecslő, gépjárműkárigény-ügyintéző, biztosítási kárügyintéző, utasbiztosítási szakértő, biztosítási nyomozó

A biztosítási kárfelmérők a biztosítótársaság politikájával összhangban kezelik és értékelik a biztosítási kárigényeket, kivizsgálják az eseteket, meghatározzák a felelősséget és az okozott kárt.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 55.8%-a jelölte

**Holland-kód:** CEI — R 4 · I 42 · A 0 · S 27 · E 63 · C 87

**HEXACO differenciál cél-profil:** O cél 47±28 (w=0.27) · H cél 53±28 (w=0.26) · C cél 52±28 (w=0.23) · A cél 48±28 (w=0.23)

**HEXACO abszolút szint:** H 56 · E 48 · X 53 · A 52 · C 57 · O 50

### adóügyi ingatlan-értékbecslő

`13-2023.00` · **ISCO-08 3315** Becsüsök és kárfelmérők · **FEOR-08:** 3616 Értékbecslő, kárbecslő, kárszakértő · ESCO `3315.8` · EN: Appraisers and Assessors of Real Estate

*Piaci megnevezések (ESCO):* lakóingatlan-értékbecslő, ingatlanszakértő, ingatlan-értékbecslő, ingósági szakértő, becsüs, bútor- és szőnyegbecsüs

Az adóügyi ingatlan-értékbecslők kutatást végeznek annak érdekében, hogy adózási szempontból becsüljék fel az ingatlan értékét. Pontos értékelési technikák alkalmazásával egyszerre több ingatlant is vizsgálnak.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 54.5%-a jelölte

**Holland-kód:** CEI — R 28 · I 31 · A 10 · S 27 · E 64 · C 80

**HEXACO differenciál cél-profil:** A cél 35±20 (w=0.43) · H cél 60±23 (w=0.30)

**HEXACO abszolút szint:** H 56 · E 52 · X 49 · A 40 · C 52 · O 51

### Biztosítási üzletkötők

`41-3021.00` · **ISCO-08 3321** Biztosítási üzletkötők · **FEOR-08:** 3621 Biztosítási ügynök, ügyintéző · ESCO `3321.1` · EN: Insurance Sales Agents · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* biztosítási ügynök, biztosításközvetítő, lakásbiztosítási ügynök

A biztosítási ügynökök népszerűsítik és adják el a különféle biztosítási kötvényeket – életbiztosítást, egészségbiztosítást, balesetbiztosítást és tűzbiztosítást – magánszemélyek és szervezetek számára, és tanácsokat adnak ezekkel kapcsolatban.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 39.5%-a jelölte

**Holland-kód:** ECS — R 0 · I 21 · A 2 · S 45 · E 82 · C 74

**HEXACO differenciál cél-profil:** X cél 67±19 (w=0.46) · H cél 38±22 (w=0.32)

**HEXACO abszolút szint:** H 48 · E 43 · X 67 · A 56 · C 57 · O 53

### biztosítási kockázatelbíráló

`13-2053.00` · **ISCO-08 3321** Biztosítási üzletkötők · **FEOR-08:** 3621 Biztosítási ügynök, ügyintéző · ESCO `3321.3` · EN: Insurance Underwriters

*Piaci megnevezések (ESCO):* biztosítási szerződéselbíráló, underwriter, biztosítási ügynök, biztosításközvetítő, lakásbiztosítási ügynök

A biztosítási kockázatelbírálók értékelik az üzleti kockázatokat és a felelősséggel kapcsolatos politikákat, és döntéseket hoznak kereskedelmi ingatlanokkal kapcsolatban.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 70.0%-a jelölte

**Holland-kód:** CEI — R 12 · I 44 · A 0 · S 31 · E 58 · C 86

**HEXACO differenciál cél-profil:** A cél 40±23 (w=0.34) · C cél 58±25 (w=0.28) · X cél 44±26 (w=0.21)

**HEXACO abszolút szint:** H 47 · E 54 · X 42 · A 41 · C 54 · O 49

### Kereskedelmi értékesítők

`41-3091.00` · **ISCO-08 3322** Kereskedelmi értékesítők · **FEOR-08:** 3622 Kereskedelmi ügyintéző · ESCO `3322.1` · EN: Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* értékesítési ügyintéző, kereskedelmi ügyintéző, értékesítési előadó

Az értékesítési ügyintézők képviselik a társaságot az értékesítésben, valamint információkat nyújtanak a termékekről és szolgáltatásokról vállalkozások és szervezetek számára.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: —

**Holland-kód:** ECS — R 1 · I 16 · A 8 · S 46 · E 96 · C 68

**HEXACO differenciál cél-profil:** H cél 27±15 (w=0.43) · X cél 71±16 (w=0.39) · E cél 44±26 (w=0.11)

**HEXACO abszolút szint:** H 38 · E 43 · X 67 · A 56 · C 49 · O 55

### Kereskedelmi értékesítők

`41-4012.00` · **ISCO-08 3322** Kereskedelmi értékesítők · **FEOR-08:** 3622 Kereskedelmi ügyintéző · ESCO `3322.1` · EN: Sales Representatives, Wholesale and Manufacturing, Except Technical and Scientific Products · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* értékesítési ügyintéző, kereskedelmi ügyintéző, értékesítési előadó

Az értékesítési ügyintézők képviselik a társaságot az értékesítésben, valamint információkat nyújtanak a termékekről és szolgáltatásokról vállalkozások és szervezetek számára.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 48.0%-a jelölte

**Holland-kód:** ECS — R 27 · I 21 · A 11 · S 28 · E 85 · C 65

**HEXACO differenciál cél-profil:** H cél 25±14 (w=0.41) · X cél 74±14 (w=0.40) · E cél 42±25 (w=0.14)

**HEXACO abszolút szint:** H 36 · E 42 · X 68 · A 55 · C 48 · O 54

### Felvásárlók

`13-1022.00` · **ISCO-08 3323** Felvásárlók · **FEOR-08:** 3623 Anyaggazdálkodó, felvásárló · ESCO `3323` · EN: Wholesale and Retail Buyers, Except Farm Products · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Buy merchandise or commodities, other than farm products, for resale to consumers at the wholesale or retail level, including both durable and nondurable goods. Analyze past buying trends, sales records, price, and quality of merchandise to determine value and yield.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 34.6%-a jelölte

**Holland-kód:** ECR — R 40 · I 15 · A 9 · S 24 · E 70 · C 70

**HEXACO differenciál cél-profil:** X cél 61±22 (w=0.34) · H cél 40±23 (w=0.30) · O cél 54±27 (w=0.13) · E cél 46±28 (w=0.11)

**HEXACO abszolút szint:** H 45 · E 46 · X 59 · A 50 · C 50 · O 55

### Felvásárlók

`13-1023.00` · **ISCO-08 3323** Felvásárlók · **FEOR-08:** 3623 Anyaggazdálkodó, felvásárló · ESCO `3323.2` · EN: Purchasing Agents, Except Wholesale, Retail, and Farm Products · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* anyaggazdálkodó, felvásárló, beszerző, felvásárló, díszletfelelős, kellékfelelős, díszletbeszerző

Az anyaggazdálkodó, felvásárló készleteket, anyagokat, szolgáltatásokat vagy árukat választ ki és vásárol fel. Közbeszerzési eljárásokat szervez és kiválasztja a beszállítókat.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 65.0%-a jelölte

**Holland-kód:** CER — R 42 · I 14 · A 3 · S 16 · E 68 · C 78

**HEXACO differenciál cél-profil:** X cél 58±25 (w=0.61) · A cél 46±28 (w=0.27) · O cél 52±29 (w=0.11)

**HEXACO abszolút szint:** H 53 · E 48 · X 57 · A 51 · C 54 · O 53

### Vámügyintézők és speditőrök

`13-1041.08` · **ISCO-08 3331** Vámügyintézők és speditőrök · **FEOR-08:** 3622 Kereskedelmi ügyintéző · ESCO `3331.1` · EN: Customs Brokers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* vám- és jövedéki ügyintéző, pénzügyőr, vámőr, szállítási, szállítmányozási nyilvántartó, szállítmányozási adminisztrátor, logisztikai ügyintéző

A vám- és jövedéki ügyintézők jóváhagyják vagy megtagadják a külkereskedelmi áruk vámhatáron történő áthaladását, és biztosítják a szállítmányokra vonatkozó jogszabályoknak való megfelelést.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 45.0%-a jelölte

**Holland-kód:** CER — R 23 · I 9 · A 0 · S 20 · E 67 · C 86

**HEXACO differenciál cél-profil:** H cél 57±26 (w=0.33) · A cél 46±27 (w=0.20) · C cél 53±28 (w=0.16) · O cél 47±28 (w=0.16)

**HEXACO abszolút szint:** H 57 · E 47 · X 52 · A 50 · C 57 · O 49

### Konferencia- és rendezvényszervezők

`13-1121.00` · **ISCO-08 3332** Konferencia- és rendezvényszervezők · **FEOR-08:** 3631 Konferencia- és rendezvényszervező · ESCO `3332` · EN: Meeting, Convention, and Event Planners · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* konferencia- és rendezvényszervező-asszisztens, rendezvénykoordinátor, rendezvényszervező-asszisztens, konferencia- és rendezvényszervező, rendezvényszervező, rendezvény- és konferenciaszervező

_(HU leírás nincs; EN:)_ Coordinate activities of staff, convention personnel, or clients to make arrangements for group meetings, events, or conventions.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 40.8%-a jelölte

**Holland-kód:** ECS — R 0 · I 9 · A 25 · S 59 · E 100 · C 66

**HEXACO differenciál cél-profil:** H cél 37±21 (w=0.30) · X cél 61±23 (w=0.26) · A cél 57±25 (w=0.17) · E cél 45±27 (w=0.11)

**HEXACO abszolút szint:** H 51 · E 40 · X 66 · A 63 · C 60 · O 54

### ingatlanmenedzser

`11-9141.00` · **ISCO-08 3334** Ingatlanügynökök és -kezelők · **FEOR-08:** 3633 Ingatlanügynök, ingatlanforgalmazási ügyintéző · ESCO `3334.5` · EN: Property, Real Estate, and Community Association Managers

*Piaci megnevezések (ESCO):* ingatlankezelési koordinátor, ingatlanfejlesztési menedzser, ingatlankezelő, ingatlan-bérbeadási ügyintéző, ingatlan-bérbeadási munkatárs, ingatlanértékesítési szakértő

Az ingatlanmenedzserek kezelik és felügyelik a kereskedelmi vagy lakóingatlanok, például magánlakások, irodaépületek és kiskereskedelmi üzletek működésének különböző aspektusait.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 55.0%-a jelölte

**Holland-kód:** ECS — R 38 · I 18 · A 12 · S 42 · E 94 · C 71

**HEXACO differenciál cél-profil:** X cél 64±20 (w=0.50) · H cél 45±26 (w=0.18) · O cél 46±27 (w=0.14)

**HEXACO abszolút szint:** H 53 · E 44 · X 64 · A 55 · C 55 · O 51

### ingatlanügynök

`41-9021.00` · **ISCO-08 3334** Ingatlanügynökök és -kezelők · **FEOR-08:** 3633 Ingatlanügynök, ingatlanforgalmazási ügyintéző · ESCO `3334.3` · EN: Real Estate Brokers

*Piaci megnevezések (ESCO):* ingatlan-ügyintéző, ingatlanszakértő, ingatlanmenedzser, ingatlankezelési koordinátor, ingatlanfejlesztési menedzser, ingatlankezelő

Az ingatlanügynökök ügyfeleik megbízásából foglalkoznak lakóingatlanok, kereskedelmi ingatlanok vagy földterületek értékesítésével vagy bérbeadásával.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 36.7%-a jelölte

**Holland-kód:** ECS — R 28 · I 9 · A 0 · S 32 · E 91 · C 79

**HEXACO differenciál cél-profil:** X cél 69±17 (w=0.48) · H cél 35±20 (w=0.38)

**HEXACO abszolút szint:** H 47 · E 42 · X 69 · A 57 · C 56 · O 55

### ingatlanügynök

`41-9022.00` · **ISCO-08 3334** Ingatlanügynökök és -kezelők · **FEOR-08:** 3633 Ingatlanügynök, ingatlanforgalmazási ügyintéző · ESCO `3334.3` · EN: Real Estate Sales Agents

*Piaci megnevezések (ESCO):* ingatlan-ügyintéző, ingatlanszakértő

Az ingatlanügynökök ügyfeleik megbízásából foglalkoznak lakóingatlanok, kereskedelmi ingatlanok vagy földterületek értékesítésével vagy bérbeadásával.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 42.9%-a jelölte

**Holland-kód:** ECS — R 19 · I 8 · A 15 · S 42 · E 91 · C 66

**HEXACO differenciál cél-profil:** X cél 67±19 (w=0.43) · H cél 38±22 (w=0.31) · E cél 45±27 (w=0.12)

**HEXACO abszolút szint:** H 47 · E 42 · X 67 · A 57 · C 54 · O 53

### hirdetésszervező

`41-3011.00` · **ISCO-08 3339** Máshová nem sorolható üzleti szolgáltatásokat nyújtók · **FEOR-08:** 3639 Egyéb, máshova nem sorolható üzleti jellegű szolgáltatás ügyintézője; 3910 Egyéb ügyintéző · ESCO `3339.1` · EN: Advertising Sales Agents

*Piaci megnevezések (ESCO):* hirdetésértékesítő, reklámhely-értékesítő

A hirdetésszervezők reklámfelületet és reklámidőt adnak el vállalkozásoknak és magánszemélyeknek. Potenciális ügyfelek számára értékesítési bemutatókat tartanak és kapcsolatot tartanak velük az értékesítést követően.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 51.9%-a jelölte

**Holland-kód:** ECA — R 3 · I 9 · A 44 · S 33 · E 94 · C 56

**HEXACO differenciál cél-profil:** H cél 24±12 (w=0.40) · X cél 73±15 (w=0.34) · E cél 40±23 (w=0.15)

**HEXACO abszolút szint:** H 34 · E 40 · X 68 · A 55 · C 47 · O 56

### Irodavezetők

`43-1011.00` · **ISCO-08 3341** Irodavezetők · **FEOR-08:** 3161 Munka- és termelésszervező; 3221 Irodai szakmai irányító, felügyelő · ESCO `3341` · EN: First-Line Supervisors of Office and Administrative Support Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* piackutatási vezető, piackutató menedzser, call center minőségbiztosító, ügyfélkapcsolati minőségbiztosítási auditor, ügyfélszolgálati minőségbiztosítási koordinátor, call center szupervizor

_(HU leírás nincs; EN:)_ Directly supervise and coordinate the activities of clerical and administrative support workers.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 45.2%-a jelölte

**Holland-kód:** ECS — R 10 · I 6 · A 0 · S 56 · E 98 · C 78

**HEXACO differenciál cél-profil:** X cél 62±22 (w=0.39) · O cél 43±26 (w=0.22) · C cél 44±26 (w=0.18) · A cél 54±27 (w=0.15)

**HEXACO abszolút szint:** H 58 · E 46 · X 64 · A 60 · C 53 · O 50

### Jogi titkárok

`43-4031.00` · **ISCO-08 3342** Jogi titkárok · **FEOR-08:** 3642 Jogi asszisztens · ESCO `3342` · EN: Court, Municipal, and License Clerks · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Perform clerical duties for courts of law, municipalities, or governmental licensing agencies and bureaus.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 50.0%-a jelölte

**Holland-kód:** CES — R 16 · I 15 · A 2 · S 42 · E 54 · C 86

**HEXACO differenciál cél-profil:** H cél 66±20 (w=0.38) · O cél 37±21 (w=0.32) · A cél 54±27 (w=0.10) · X cél 46±27 (w=0.10)

**HEXACO abszolút szint:** H 57 · E 54 · X 45 · A 50 · C 49 · O 38

### jogi titkár

`43-6012.00` · **ISCO-08 3342** Jogi titkárok · **FEOR-08:** 3642 Jogi asszisztens · ESCO `3342.2` · EN: Legal Secretaries and Administrative Assistants

*Piaci megnevezések (ESCO):* jogi titkárnő, jogi asszisztens

A jogi titkárok napi adminisztratív tevékenységeket végeznek cégeknél, közjegyzői hivatalokban és vállalkozásoknál. Például leveleket írnak, telefonhívásokra válaszolnak és gépelnek/adatokat visznek be.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 48.1%-a jelölte

**Holland-kód:** CES — R 7 · I 32 · A 9 · S 36 · E 57 · C 95

**HEXACO differenciál cél-profil:** H cél 64±20 (w=0.30) · O cél 38±22 (w=0.25) · X cél 43±25 (w=0.15) · A cél 55±26 (w=0.11)

**HEXACO abszolút szint:** H 58 · E 54 · X 44 · A 52 · C 53 · O 40

### Igazgatási és ügyvezetési titkárok

`43-3061.00` · **ISCO-08 3343** Igazgatási és ügyvezetési titkárok · **FEOR-08:** 3641 Személyi asszisztens; 3649 Egyéb igazgatási és jogi asszisztens · ESCO `3343.1.5` · EN: Procurement Clerks · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* igazgatási asszisztens, adminisztratív asszisztens, titkárnő

Az igazgatási asszisztensek igazgatási és adminisztratív támogatást nyújtanak a vezetők számára.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 48.2%-a jelölte

**Holland-kód:** CER — R 36 · I 12 · A 0 · S 10 · E 52 · C 100

**HEXACO differenciál cél-profil:** H cél 60±23 (w=0.42) · O cél 45±26 (w=0.22) · A cél 46±27 (w=0.16) · E cél 54±28 (w=0.15)

**HEXACO abszolút szint:** H 52 · E 57 · X 45 · A 42 · C 46 · O 42

### Igazgatási és ügyvezetési titkárok

`43-6011.00` · **ISCO-08 3343** Igazgatási és ügyvezetési titkárok · **FEOR-08:** 3641 Személyi asszisztens; 3649 Egyéb igazgatási és jogi asszisztens · ESCO `3343` · EN: Executive Secretaries and Executive Administrative Assistants · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* igazgatási asszisztens, adminisztratív asszisztens, titkárnő, igazgatói asszisztens, személyi asszisztens, idegen nyelvi asszisztens

_(HU leírás nincs; EN:)_ Provide high-level administrative support by conducting research, preparing statistical reports, and handling information requests, as well as performing routine administrative functions such as preparing correspondence, receiving visitors, arranging conference calls, and scheduling meetings.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 33.8%-a jelölte

**Holland-kód:** CES — R 5 · I 16 · A 6 · S 49 · E 75 · C 90

**HEXACO differenciál cél-profil:** O cél 43±25 (w=0.34) · A cél 56±26 (w=0.31) · X cél 54±28 (w=0.17)

**HEXACO abszolút szint:** H 55 · E 48 · X 55 · A 57 · C 52 · O 46

### csontkovács asszisztens

`43-6013.00` · **ISCO-08 3344** Orvosírnokok · **FEOR-08:** 3322 Egészségügyi dokumentátor · ESCO `3344.1` · EN: Medical Secretaries and Administrative Assistants

*Piaci megnevezések (ESCO):* fizikoterápiás asszisztens, masszőr, manuálterápiás asszisztens, orvosipraxis-menedzser

A csontkovács asszisztensek csontkovács vagy szakosodott csontkovács kizárólagos irányítása és felügyelete alatt rutin- és adminisztratív feladatokat látnak el, hogy támogassák a betegellátást.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 47.6%-a jelölte

**Holland-kód:** CSE — R 22 · I 34 · A 0 · S 52 · E 36 · C 94

**HEXACO differenciál cél-profil:** H cél 60±23 (w=0.23) · O cél 40±23 (w=0.23) · A cél 59±24 (w=0.21) · X cél 44±26 (w=0.13)

**HEXACO abszolút szint:** H 58 · E 52 · X 48 · A 56 · C 50 · O 43

### Adóhatósági ügyintézők

`13-2081.00` · **ISCO-08 3352** Adóhatósági ügyintézők · **FEOR-08:** 3652 Adó- és illetékhivatali ügyintéző · ESCO `3352.2` · EN: Tax Examiners and Collectors, and Revenue Agents · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* adópolitikai tanácsadó, adószakértő, adótanácsadó, adóellenőr, adóügyi adminisztrátor, adóigazgatási előadó

Az adópolitikai tanácsadók az adók kiszámításáért, valamint a magánszemélyek és szervezetek időben történő adófizetésért felelnek.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 33.6%-a jelölte

**Holland-kód:** CES — R 4 · I 24 · A 0 · S 36 · E 56 · C 98

**HEXACO differenciál cél-profil:** O cél 40±23 (w=0.28) · H cél 60±24 (w=0.25) · C cél 56±26 (w=0.17) · E cél 55±27 (w=0.13)

**HEXACO abszolút szint:** H 56 · E 54 · X 48 · A 47 · C 56 · O 42

### engedélyezési ügyintéző

`13-1041.00` · **ISCO-08 3354** Hatósági engedélyezési ügyintézők · **FEOR-08:** 3654 Hatósági engedélyek kiadásával foglalkozó ügyintéző 5. · ESCO `3354.2` · EN: Compliance Officers

*Piaci megnevezések (ESCO):* földtulajdon nyilvántartó, építési engedélyek kiadásával foglalkozó ügyintéző

Az engedélyezési ügyintézők engedélykérelmeket dolgoznak fel, valamint az engedélyezésre irányadó jogszabályokkal kapcsolatos tanácsadást nyújtanak.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** CEI — R 25 · I 34 · A 0 · S 33 · E 51 · C 89

**HEXACO differenciál cél-profil:** H cél 67±19 (w=0.47) · O cél 40±23 (w=0.28) · E cél 54±27 (w=0.12)

**HEXACO abszolút szint:** H 61 · E 53 · X 49 · A 48 · C 52 · O 42

### bűnügyi nyomozó

`33-3021.00` · **ISCO-08 3355** Rendőrfelügyelők és nyomozók · **FEOR-08:** 3655 Nyomozó · ESCO `3355.1` · EN: Detectives and Criminal Investigators

*Piaci megnevezések (ESCO):* rendőr, rendőrnő, rendőrségi nyomozó, rendőrfelügyelő, rendőrkapitány, rendőr-főfelügyelő

A bűnügyi nyomozók megvizsgálják a bűncselekmények helyszíneit, illetve megvizsgálják és feldolgozzák az ott talált bizonyítékokat. A szabályoknak és előírásoknak megfelelően kezelik és óvják a bizonyítékokat, és elkülönítik a helyszínt a külső behatásoktól.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 32.5%-a jelölte

**Holland-kód:** ICR — R 53 · I 65 · A 3 · S 29 · E 51 · C 64

**HEXACO differenciál cél-profil:** H cél 37±22 (w=0.34) · E cél 39±23 (w=0.30) · O cél 55±27 (w=0.14)

**HEXACO abszolút szint:** H 52 · E 35 · X 59 · A 57 · C 66 · O 60

### Máshová nem sorolható közhivatali ügyintézők

`53-6051.07` · **ISCO-08 3359** Máshová nem sorolható közhivatali ügyintézők · **FEOR-08:** 3659 Egyéb hatósági ügyintéző; 3910 Egyéb ügyintéző · ESCO `3359` · EN: Transportation Vehicle, Equipment and Systems Inspectors, Except Aviation · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Inspect and monitor transportation equipment, vehicles, or systems to ensure compliance with regulations and safety standards.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 57.8%-a jelölte

**Holland-kód:** RCI — R 100 · I 45 · A 0 · S 0 · E 6 · C 69

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.24) · O cél 41±24 (w=0.23) · H cél 57±25 (w=0.19) · A cél 43±25 (w=0.19)

**HEXACO abszolút szint:** H 46 · E 55 · X 40 · A 39 · C 51 · O 39

### teheráru-felügyelő

`53-6051.00` · **ISCO-08 3359** Máshová nem sorolható közhivatali ügyintézők · **FEOR-08:** 3659 Egyéb hatósági ügyintéző; 3910 Egyéb ügyintéző · ESCO `3359.5` · EN: Transportation Inspectors

*Piaci megnevezések (ESCO):* teheráru-ellenőr, hajórakomány-ellenőr

A teheráru-felügyelők eldöntik, hogy az áru biztonságos-e és megfelelő okmányok kíséretében érkezik-e. Megvizsgálják, kezelik és dokumentálják az áruszállítmányokat, eközben ellenőrzik, hogy azok tartalma megfelel-e a helyi, nemzeti és nemzetközi előírásoknak.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** CRI — R 78 · I 32 · A 0 · S 9 · E 27 · C 86

**HEXACO differenciál cél-profil:** O cél 38±22 (w=0.42) · H cél 56±26 (w=0.20) · C cél 56±26 (w=0.20)

**HEXACO abszolút szint:** H 52 · E 51 · X 50 · A 47 · C 55 · O 40

### jogi asszisztens

`23-2011.00` · **ISCO-08 3411** Jogi és hasonló foglalkozásúak · **FEOR-08:** 3649 Egyéb igazgatási és jogi asszisztens; 3910 Egyéb ügyintéző · ESCO `3411.7` · EN: Paralegals and Legal Assistants

*Piaci megnevezések (ESCO):* ingatlan-ügyintéző, ingatlanjogász, ingatlanátruházási ügyintéző

A jogi asszisztensek a bíróság elé terjesztett ügyek kutatása és előkészítése során szoros együttműködést folytatnak az ügyvédekkel és a jogi képviselőkkel. Segítséget nyújtanak a bírósági ügyek papíralapú adminisztrációja és a bírósági ügyek intézése során.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 36.9%-a jelölte

**Holland-kód:** CIE — R 12 · I 67 · A 21 · S 35 · E 49 · C 71

**HEXACO differenciál cél-profil:** X cél 43±25 (w=0.32) · E cél 55±27 (w=0.20) · H cél 55±27 (w=0.20) · C cél 54±27 (w=0.19)

**HEXACO abszolút szint:** H 55 · E 51 · X 47 · A 52 · C 57 · O 53

### Szociális foglalkozásúak

`21-1021.00` · **ISCO-08 3412** Szociális foglalkozásúak · **FEOR-08:** 3511 Szociális segítő; 3513 Szociális gondozó, szakgondozó; 3515 Ifjúságsegítő · ESCO `3412.4.3` · EN: Child, Family, and School Social Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szociális gondozó, házi gondozó, szociális munkás

A szociális gondozók gondozási szolgáltatásokkal támogatják és segítik az embereket. Segítenek az embereknek abban, hogy teljes értékű és értékes életet élhessenek a közösségben.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 68.7%-a jelölte

**Holland-kód:** SCI — R 12 · I 39 · A 32 · S 98 · E 32 · C 43

**HEXACO differenciál cél-profil:** C cél 36±20 (w=0.29) · A cél 64±21 (w=0.28) · H cél 64±21 (w=0.28) · O cél 45±27 (w=0.10)

**HEXACO abszolút szint:** H 73 · E 41 · X 63 · A 71 · C 54 · O 56

### Szociális foglalkozásúak

`25-3021.00` · **ISCO-08 3412** Szociális foglalkozásúak · **FEOR-08:** 3511 Szociális segítő; 3513 Szociális gondozó, szakgondozó; 3515 Ifjúságsegítő · ESCO `3412.3` · EN: Self-Enrichment Teachers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* életvezetési tanácsadó, életvezetési coach, mentor

Az életvezetési tanácsadók az ügyfeleik személyes fejlődésére vonatkozó, egyértelmű célok kitűzésében, valamint céljaik és személyes jövőképük megvalósításában segítik ügyfeleiket.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: mesterszak (MA/MSc) · a válaszadók 34.7%-a jelölte

**Holland-kód:** SAE — R 25 · I 33 · A 53 · S 100 · E 37 · C 35

**HEXACO differenciál cél-profil:** C cél 35±20 (w=0.32) · X cél 62±22 (w=0.25) · A cél 58±25 (w=0.15) · E cél 57±26 (w=0.14)

**HEXACO abszolút szint:** H 58 · E 50 · X 63 · A 60 · C 41 · O 58

### Szociális foglalkozásúak

`29-2053.00` · **ISCO-08 3412** Szociális foglalkozásúak · **FEOR-08:** 3511 Szociális segítő; 3513 Szociális gondozó, szakgondozó; 3515 Ifjúságsegítő · ESCO `3412.4.8` · EN: Psychiatric Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szociális gondozó, házi gondozó, szociális munkás

A szociális gondozók gondozási szolgáltatásokkal támogatják és segítik az embereket. Segítenek az embereknek abban, hogy teljes értékű és értékes életet élhessenek a közösségben.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: megkezdett felsőfokú tanulmányok · a válaszadók 40.1%-a jelölte

**Holland-kód:** SIC — R 38 · I 60 · A 19 · S 99 · E 8 · C 41

**HEXACO differenciál cél-profil:** A cél 65±20 (w=0.30) · C cél 37±21 (w=0.27) · H cél 60±23 (w=0.20) · O cél 41±24 (w=0.18)

**HEXACO abszolút szint:** H 67 · E 41 · X 59 · A 69 · C 52 · O 50

### Szociális foglalkozásúak

`31-1122.00` · **ISCO-08 3412** Szociális foglalkozásúak · **FEOR-08:** 3511 Szociális segítő; 3513 Szociális gondozó, szakgondozó; 3515 Ifjúságsegítő · ESCO `3412.4.2` · EN: Personal Care Aides · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szociális gondozó, házi gondozó, szociális munkás

A szociális gondozók gondozási szolgáltatásokkal támogatják és segítik az embereket. Segítenek az embereknek abban, hogy teljes értékű és értékes életet élhessenek a közösségben.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 47.8%-a jelölte

**Holland-kód:** SCR — R 42 · I 13 · A 13 · S 86 · E 26 · C 49

**HEXACO differenciál cél-profil:** O cél 32±18 (w=0.25) · H cél 68±18 (w=0.25) · A cél 65±20 (w=0.20) · E cél 58±24 (w=0.12)

**HEXACO abszolút szint:** H 67 · E 50 · X 52 · A 64 · C 49 · O 40

### szociális asszisztens

`21-1093.00` · **ISCO-08 3412** Szociális foglalkozásúak · **FEOR-08:** 3511 Szociális segítő; 3513 Szociális gondozó, szakgondozó; 3515 Ifjúságsegítő · ESCO `3412.5` · EN: Social and Human Service Assistants

*Piaci megnevezések (ESCO):* szociálismunkás-asszisztens, szociális segítő

A szociális asszisztensek olyan gyakorlati szakemberek, akik előmozdítják a társadalmi változást és fejlődést, a társadalmi kohéziót, valamint az emberek felelősségvállalását és felszabadulását.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 39.4%-a jelölte

**Holland-kód:** SCE — R 5 · I 30 · A 16 · S 85 · E 44 · C 60

**HEXACO differenciál cél-profil:** C cél 36±21 (w=0.26) · H cél 63±21 (w=0.25) · A cél 62±22 (w=0.22) · O cél 43±26 (w=0.13)

**HEXACO abszolút szint:** H 68 · E 47 · X 58 · A 65 · C 48 · O 51

### Sportedzők, -oktatók és -tisztségviselők

`27-2022.00` · **ISCO-08 3422** Sportedzők, -oktatók és -tisztségviselők · **FEOR-08:** 2717 Szakképzett edző, sportszervező, -irányító · ESCO `3422` · EN: Coaches and Scouts · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* sportszervező, sportbíró, versenybíró, sportedző, edző, sportoktató

_(HU leírás nincs; EN:)_ Instruct or coach groups or individuals in the fundamentals of sports for the primary purpose of competition. Demonstrate techniques and methods of participation.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 48.9%-a jelölte

**Holland-kód:** SER — R 54 · I 19 · A 24 · S 72 · E 69 · C 41

**HEXACO differenciál cél-profil:** X cél 70±17 (w=0.46) · C cél 42±25 (w=0.18) · E cél 44±26 (w=0.13) · H cél 45±26 (w=0.12)

**HEXACO abszolút szint:** H 56 · E 39 · X 70 · A 61 · C 49 · O 56

### Sportedzők, -oktatók és -tisztségviselők

`39-9031.00` · **ISCO-08 3422** Sportedzők, -oktatók és -tisztségviselők · **FEOR-08:** 2717 Szakképzett edző, sportszervező, -irányító · ESCO `3422.4` · EN: Exercise Trainers and Group Fitness Instructors · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* sportedző, edző

A sportedzők szabadidős környezetben oktatják meg nem határozott és meghatározott életkorú résztvevőknek azt a sportágat, amelyre szakosodtak.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 38.1%-a jelölte

**Holland-kód:** SRE — R 70 · I 28 · A 23 · S 77 · E 42 · C 33

**HEXACO differenciál cél-profil:** X cél 66±19 (w=0.40) · C cél 38±22 (w=0.29) · A cél 58±25 (w=0.19) · O cél 46±27 (w=0.11)

**HEXACO abszolút szint:** H 56 · E 45 · X 66 · A 61 · C 44 · O 52

### Fitneszoktatók és szabadidős programok vezetői

`39-1014.00` · **ISCO-08 3423** Fitneszoktatók és szabadidős programok vezetői · **FEOR-08:** 3722 Fitnesz- és rekreációs program irányítója · ESCO `3423.1` · EN: First-Line Supervisors of Entertainment and Recreation Workers, Except Gambling Services · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szabadidő-szervező, sportanimátor, animátor

A szabadidő-szervezők szabadidős szolgáltatásokat nyújtanak üdülő felnőttek és gyermekek számára. Különböző tevékenységeket például sportversenyeket, kerékpáros körtúrákat, bemutatókat és múzeumlátogatásokat szerveznek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: —

**Holland-kód:** ECS — R 32 · I 0 · A 13 · S 57 · E 100 · C 62

**HEXACO differenciál cél-profil:** X cél 67±19 (w=0.39) · C cél 40±24 (w=0.22) · A cél 56±26 (w=0.14) · O cél 45±27 (w=0.12)

**HEXACO abszolút szint:** H 55 · E 46 · X 67 · A 61 · C 48 · O 51

### Fitneszoktatók és szabadidős programok vezetői

`39-9032.00` · **ISCO-08 3423** Fitneszoktatók és szabadidős programok vezetői · **FEOR-08:** 3722 Fitnesz- és rekreációs program irányítója · ESCO `3423` · EN: Recreation Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szabadidő-szervező, sportanimátor, animátor

_(HU leírás nincs; EN:)_ Conduct recreation activities with groups in public, private, or volunteer agencies or recreation facilities.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 62.0%-a jelölte

**Holland-kód:** SER — R 46 · I 16 · A 34 · S 65 · E 58 · C 41

**HEXACO differenciál cél-profil:** C cél 37±21 (w=0.27) · X cél 62±22 (w=0.25) · A cél 58±25 (w=0.15) · H cél 57±25 (w=0.15)

**HEXACO abszolút szint:** H 59 · E 51 · X 62 · A 58 · C 41 · O 50

### fényképész

`27-4021.00` · **ISCO-08 3431** Fényképészek · **FEOR-08:** 3713 Fényképész · ESCO `3431.1` · EN: Photographers

*Piaci megnevezések (ESCO):* alkalmazott fotográfus, esküvői fotós, fotóriporter, televíziós fényképész, sajtófotós

A fényképészek digitális vagy hagyományos fényképezőgépekkel és berendezésekkel készítenek képeket. A fényképészek a kész képek és nyomatok elkészítéséhez negatívokat hívnak elő, vagy számítógépes szoftvereket használnak.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: megkezdett felsőfokú tanulmányok · a válaszadók 27.3%-a jelölte

**Holland-kód:** RAC — R 76 · I 20 · A 71 · S 16 · E 21 · C 39

**HEXACO differenciál cél-profil:** O cél 64±21 (w=0.38) · H cél 44±26 (w=0.18) · A cél 45±27 (w=0.14) · E cél 45±27 (w=0.13)

**HEXACO abszolút szint:** H 45 · E 48 · X 51 · A 46 · C 44 · O 60

### dekoratőr

`27-1025.00` · **ISCO-08 3432** Épületbelső-tervezők és -dekoratőrök · **FEOR-08:** 3714 Díszletező, díszítő; 3716 Lakberendező, dekoratőr · ESCO `3432.1` · EN: Interior Designers

*Piaci megnevezések (ESCO):* kirakattervező, díszítő, bolti látványtervező, bolti arculattervező

A dekoratőrök belső tereket terveznek vagy újítanak fel, többek között szerkezeti átalakításokat végeznek, alkatrészeket és szerelvényeket, világítási és színrendszereket, a berendezési tárgyakat terveznek vagy újítanak fel.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 84.0%-a jelölte

**Holland-kód:** ARC — R 52 · I 34 · A 76 · S 28 · E 45 · C 47

**HEXACO differenciál cél-profil:** O cél 60±23 (w=0.31) · H cél 42±25 (w=0.23) · X cél 56±26 (w=0.19) · C cél 44±26 (w=0.18)

**HEXACO abszolút szint:** H 50 · E 48 · X 58 · A 55 · C 50 · O 61

### Épületbelső-tervezők és -dekoratőrök

`27-1026.00` · **ISCO-08 3432** Épületbelső-tervezők és -dekoratőrök · **FEOR-08:** 3714 Díszletező, díszítő; 3716 Lakberendező, dekoratőr · ESCO `3432.1` · EN: Merchandise Displayers and Window Trimmers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* dekoratőr, kirakattervező, díszítő, árufeltöltő, polcfeltöltő, árurendező

A dekoratőrök belső tereket terveznek vagy újítanak fel, többek között szerkezeti átalakításokat végeznek, alkatrészeket és szerelvényeket, világítási és színrendszereket, a berendezési tárgyakat terveznek vagy újítanak fel.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 39.5%-a jelölte

**Holland-kód:** ARE — R 58 · I 8 · A 62 · S 20 · E 55 · C 35

**HEXACO differenciál cél-profil:** H cél 34±19 (w=0.34) · O cél 62±22 (w=0.24) · X cél 59±24 (w=0.18) · C cél 44±26 (w=0.11)

**HEXACO abszolút szint:** H 36 · E 51 · X 53 · A 49 · C 40 · O 57

### séf

`35-1011.00` · **ISCO-08 3434** Konyhafőnökök · **FEOR-08:** 3222 Konyhafőnök, séf · ESCO `3434.1.1` · EN: Chefs and Head Cooks

*Piaci megnevezések (ESCO):* helyettes séf, séfek

A séfek egyedülálló gasztronómiai élmény nyújtásához szükséges kreatív és innovatív adottságokkal rendelkező konyhaművészeti szakemberek.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 54.2%-a jelölte

**Holland-kód:** ERC — R 64 · I 11 · A 29 · S 32 · E 69 · C 56

**HEXACO differenciál cél-profil:** H cél 36±21 (w=0.35) · X cél 62±22 (w=0.31) · E cél 44±26 (w=0.15) · O cél 54±27 (w=0.10)

**HEXACO abszolút szint:** H 49 · E 40 · X 64 · A 57 · C 56 · O 58

### Információs és kommunikációs technológiák felhasználói támogatását biztosító technikusok támogató technikus

`15-1232.00` · **ISCO-08 3512** Információs és kommunikációs technológiák felhasználói támogatását biztosító technikusok támogató technikus · **FEOR-08:** 3142 Informatikai és kommunikációs rendszerek felhasználóit · ESCO `3512` · EN: Computer User Support Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* infokommunikációs ügyfélszolgálati munkatárs, IT ügyfélszolgálati munkatárs, IKT ügyfélszolgálati munkatárs, infokommunikációs ügyfélszolgálati menedzser, IKT ügyfélszolgálati menedzser, IT ügyfélszolgálati menedzser

_(HU leírás nincs; EN:)_ Provide technical assistance to computer users. Answer questions or resolve computer problems for clients in person, via telephone, or electronically.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 47.3%-a jelölte

**Holland-kód:** CRI — R 52 · I 46 · A 0 · S 38 · E 23 · C 84

**HEXACO differenciál cél-profil:** O cél 55±27 (w=0.29) · A cél 55±27 (w=0.28) · C cél 46±27 (w=0.25)

**HEXACO abszolút szint:** H 54 · E 47 · X 52 · A 56 · C 50 · O 56

### Webtechnikusok

`15-1299.01` · **ISCO-08 3514** Webtechnikusok · **FEOR-08:** 3144 Webrendszer- (hálózati) technikus · ESCO `3514` · EN: Web Administrators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* internetes rendszergazda, webmaster, weboldal adminisztrátor

_(HU leírás nincs; EN:)_ Manage web environment design, deployment, development and maintenance activities. Perform testing and quality assurance of web sites and web applications.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 55.0%-a jelölte

**Holland-kód:** CIE — R 24 · I 57 · A 24 · S 21 · E 46 · C 76

**HEXACO differenciál cél-profil:** O cél 64±20 (w=0.35) · A cél 42±25 (w=0.20) · H cél 42±25 (w=0.18) · X cél 46±27 (w=0.10)

**HEXACO abszolút szint:** H 47 · E 47 · X 48 · A 46 · C 55 · O 61

### Műsorszórási és audiovizuális technikusok

`27-4014.00` · **ISCO-08 3521** Műsorszórási és audiovizuális technikusok · **FEOR-08:** 3145 Műsorszóró és audiovizuális technikus · ESCO `3521.1` · EN: Sound Engineering Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* audiovizuális technikus, hangtechnikus, műsorszóró és audiovizuális technikus

Az audiovizuális technikusok rádió- és televízióműsorokhoz, élő eseményeken és távközlési jelekhez kép- és hangrögzítésre és -szerkesztésre szolgáló berendezéseket állítanak be, működtetnek és tartanak karban.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 32.0%-a jelölte

**Holland-kód:** RAC — R 69 · I 28 · A 58 · S 12 · E 19 · C 54

**HEXACO differenciál cél-profil:** H cél 36±21 (w=0.35) · O cél 61±22 (w=0.29) · E cél 44±26 (w=0.15)

**HEXACO abszolút szint:** H 40 · E 47 · X 47 · A 50 · C 51 · O 58

### Műsorszórási és audiovizuális technikusok

`27-4031.00` · **ISCO-08 3521** Műsorszórási és audiovizuális technikusok · **FEOR-08:** 3145 Műsorszóró és audiovizuális technikus · ESCO `3521.1.2` · EN: Camera Operators, Television, Video, and Film · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* audiovizuális technikus, hangtechnikus, műsorszóró és audiovizuális technikus

Az audiovizuális technikusok rádió- és televízióműsorokhoz, élő eseményeken és távközlési jelekhez kép- és hangrögzítésre és -szerkesztésre szolgáló berendezéseket állítanak be, működtetnek és tartanak karban.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 60.7%-a jelölte

**Holland-kód:** ARC — R 65 · I 17 · A 67 · S 13 · E 21 · C 44

**HEXACO differenciál cél-profil:** H cél 33±19 (w=0.36) · O cél 61±22 (w=0.24) · E cél 40±24 (w=0.20) · A cél 56±26 (w=0.12)

**HEXACO abszolút szint:** H 35 · E 46 · X 48 · A 50 · C 43 · O 56

### audiovizuális technikus

`27-4011.00` · **ISCO-08 3521** Műsorszórási és audiovizuális technikusok · **FEOR-08:** 3145 Műsorszóró és audiovizuális technikus · ESCO `3521.1.11` · EN: Audio and Video Technicians

*Piaci megnevezések (ESCO):* hangtechnikus, műsorszóró és audiovizuális technikus

Az audiovizuális technikusok rádió- és televízióműsorokhoz, élő eseményeken és távközlési jelekhez kép- és hangrögzítésre és -szerkesztésre szolgáló berendezéseket állítanak be, működtetnek és tartanak karban.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 42.7%-a jelölte

**Holland-kód:** RCA — R 70 · I 29 · A 37 · S 16 · E 14 · C 60

**HEXACO differenciál cél-profil:** H cél 39±23 (w=0.36) · E cél 42±25 (w=0.27) · O cél 57±26 (w=0.22)

**HEXACO abszolút szint:** H 42 · E 45 · X 51 · A 49 · C 48 · O 54


## 4 — Irodai és ügyviteli (adminisztratív) jellegű foglalkozások

### Általános irodai foglalkozásúak

`43-9061.00` · **ISCO-08 4110** Általános irodai foglalkozásúak · **FEOR-08:** 4112 Általános irodai adminisztrátor · ESCO `4110` · EN: Office Clerks, General · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* irodai ügyintéző, irodai asszisztens, iratkezelő, irattáros

_(HU leírás nincs; EN:)_ Perform duties too varied and diverse to be classified in any specific office clerical occupation, requiring knowledge of office systems and procedures.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 40.6%-a jelölte

**Holland-kód:** CES — R 32 · I 14 · A 0 · S 34 · E 37 · C 97

**HEXACO differenciál cél-profil:** H cél 60±23 (w=0.29) · O cél 41±24 (w=0.25) · A cél 58±25 (w=0.23) · E cél 55±27 (w=0.14)

**HEXACO abszolút szint:** H 50 · E 58 · X 44 · A 49 · C 39 · O 39

### Titkárok (általános)

`43-6014.00` · **ISCO-08 4120** Titkárok (általános) · **FEOR-08:** 4111 Titkár(nő) · ESCO `4120.1` · EN: Secretaries and Administrative Assistants, Except Legal, Medical, and Executive · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* titkár/titkárnő, személyi asszisztens, önkormányzati ügyintéző

A titkárok/titkárnők a szervezet zavartalan működésének elősegítése érdekében különféle adminisztratív feladatokat látnak el.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 49.9%-a jelölte

**Holland-kód:** CES — R 16 · I 6 · A 0 · S 44 · E 53 · C 99

**HEXACO differenciál cél-profil:** O cél 39±22 (w=0.27) · A cél 61±23 (w=0.26) · H cél 59±24 (w=0.21) · E cél 56±26 (w=0.15)

**HEXACO abszolút szint:** H 53 · E 56 · X 48 · A 54 · C 44 · O 40

### adatrögzítő

`43-9021.00` · **ISCO-08 4132** Adatrögzítők · **FEOR-08:** 4114 Adatrögzítő, kódoló · ESCO `4132.1` · EN: Data Entry Keyers

*Piaci megnevezések (ESCO):* adat steward, adatbeviteli felelős

Az adatrögzítők számítógépes rendszereken tárolt információkat frissítenek, tartanak karban és keresnek vissza.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 58.7%-a jelölte

**Holland-kód:** CRI — R 34 · I 22 · A 0 · S 3 · E 11 · C 100

**HEXACO differenciál cél-profil:** O cél 39±22 (w=0.23) · C cél 61±23 (w=0.21) · X cél 43±25 (w=0.15) · H cél 57±25 (w=0.15)

**HEXACO abszolút szint:** H 38 · E 66 · X 32 · A 32 · C 42 · O 31

### Bankpénztárosok és hasonló foglalkozásúak

`43-5051.00` · **ISCO-08 4211** Bankpénztárosok és hasonló foglalkozásúak · **FEOR-08:** 4211 Banki pénztáros; 4227 Postai ügyfélkapcsolati foglalkozású · ESCO `4211.2` · EN: Postal Service Clerks · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* postai ügyfélkapcsolati foglalkozású, postai szolgáltató (kézbesítő, válogató), hírközlési, postai tevékenységet folytató részegység vezetője

A postai ügyfélkapcsolati foglalkozásúak postahivatalban értékesítenek termékeket és szolgáltatásokat. Segítséget nyújtanak az ügyfeleknek a küldemények átvétele és elküldése során.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 67.6%-a jelölte

**Holland-kód:** CRE — R 37 · I 0 · A 0 · S 26 · E 28 · C 92

**HEXACO differenciál cél-profil:** O cél 33±19 (w=0.40) · H cél 64±21 (w=0.33) · A cél 55±27 (w=0.12)

**HEXACO abszolút szint:** H 52 · E 57 · X 43 · A 47 · C 43 · O 33

### pénzintézeti ügyintéző

`43-3071.00` · **ISCO-08 4211** Bankpénztárosok és hasonló foglalkozásúak · **FEOR-08:** 4211 Banki pénztáros; 4227 Postai ügyfélkapcsolati foglalkozású · ESCO `4211.1` · EN: Tellers

*Piaci megnevezések (ESCO):* pénzintézeti értékesítési ügyintéző, pénzintézeti értékesítési asszisztens, postai ügyfélkapcsolati foglalkozású, postai szolgáltató (kézbesítő, válogató), hírközlési, postai tevékenységet folytató részegység vezetője

A pénzintézeti ügyintézők a leggyakrabban banki ügyfelekkel foglalkoznak. Banki termékek és szolgáltatások értékesítését ösztönzik, tájékoztatást nyújtanak az ügyfelek lakossági számláiról és a kapcsolódó átutalásokról, betétekről, megtakarításokról stb.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 73.0%-a jelölte

**Holland-kód:** CES — R 21 · I 7 · A 0 · S 24 · E 53 · C 98

**HEXACO differenciál cél-profil:** O cél 29±16 (w=0.44) · H cél 68±18 (w=0.37) · E cél 55±27 (w=0.10)

**HEXACO abszolút szint:** H 61 · E 54 · X 49 · A 52 · C 52 · O 35

### Adósságbehajtók és hasonló foglalkozásúak

`43-3011.00` · **ISCO-08 4214** Adósságbehajtók és hasonló foglalkozásúak · **FEOR-08:** 3656 Végrehajtó, adósságbehajtó · ESCO `4214.1` · EN: Bill and Account Collectors · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* végrehajtó, adósságbehajtó, követeléskezelő, adósságbehajtó, biztosítási követeléskezelő

Az adósságbehajtók a szervezetnek vagy harmadik feleknek fizetendő tartozást szedik be, elsősorban azokban az esetekben, ha a tartozás lejárt.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 48.1%-a jelölte

**Holland-kód:** CES — R 18 · I 0 · A 0 · S 38 · E 56 · C 100

**HEXACO differenciál cél-profil:** O cél 38±22 (w=0.26) · X cél 58±24 (w=0.18) · E cél 42±25 (w=0.18) · C cél 58±25 (w=0.17)

**HEXACO abszolút szint:** H 41 · E 46 · X 53 · A 46 · C 52 · O 39

### Utazási irodai ügyintézők

`43-4181.00` · **ISCO-08 4221** Utazási irodai ügyintézők · **FEOR-08:** 4221 Utazásszervező, tanácsadó · ESCO `4221.3` · EN: Reservation and Transportation Ticket Agents and Travel Clerks · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* idegenforgalmi tájékoztató munkatárs, ügyfél-tájékoztató, utastájékoztató

Az idegenforgalmi tájékoztató munkatársak tájékoztatást és tanácsadást nyújtanak az utazóknak a helyi látványosságokról, eseményekről, utazásokról és szálláslehetőségekről.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 75.2%-a jelölte

**Holland-kód:** CSE — R 19 · I 0 · A 5 · S 56 · E 51 · C 76

**HEXACO differenciál cél-profil:** A cél 65±20 (w=0.34) · O cél 38±22 (w=0.28) · C cél 43±25 (w=0.17) · H cél 55±26 (w=0.12)

**HEXACO abszolút szint:** H 54 · E 49 · X 52 · A 60 · C 45 · O 41

### utazási tanácsadó

`39-7012.00` · **ISCO-08 4221** Utazási irodai ügyintézők · **FEOR-08:** 4221 Utazásszervező, tanácsadó · ESCO `4221.7` · EN: Travel Guides

*Piaci megnevezések (ESCO):* utazás tanácsadó, utazási ügyintéző, utazási irodai ügyintéző, utazási ügyintézők, utazásszervező tanácsadó, csoportvezető

Az utazási tanácsadók személyre szabott tájékoztatást és konzultációt nyújtanak utazási ajánlatokkal kapcsolatban, foglalásokat intéznek, valamint utazási szolgáltatásokat értékesítenek más, kapcsolódó szolgáltatásokkal együtt.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 45.8%-a jelölte

**Holland-kód:** SEC — R 24 · I 22 · A 24 · S 64 · E 60 · C 55

**HEXACO differenciál cél-profil:** A cél 61±22 (w=0.26) · X cél 60±23 (w=0.24) · C cél 41±24 (w=0.22) · H cél 44±26 (w=0.15)

**HEXACO abszolút szint:** H 56 · E 40 · X 66 · A 66 · C 53 · O 56

### utazási tanácsadó

`41-3041.00` · **ISCO-08 4221** Utazási irodai ügyintézők · **FEOR-08:** 4221 Utazásszervező, tanácsadó · ESCO `4221.7` · EN: Travel Agents

*Piaci megnevezések (ESCO):* utazás tanácsadó, utazási ügyintéző, idegenforgalmi tájékoztató munkatárs, ügyfél-tájékoztató, utastájékoztató

Az utazási tanácsadók személyre szabott tájékoztatást és konzultációt nyújtanak utazási ajánlatokkal kapcsolatban, foglalásokat intéznek, valamint utazási szolgáltatásokat értékesítenek más, kapcsolódó szolgáltatásokkal együtt.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 37.2%-a jelölte

**Holland-kód:** ECS — R 2 · I 8 · A 15 · S 55 · E 80 · C 80

**HEXACO differenciál cél-profil:** X cél 60±24 (w=0.35) · C cél 42±25 (w=0.28) · A cél 56±26 (w=0.22) · O cél 47±28 (w=0.11)

**HEXACO abszolút szint:** H 52 · E 49 · X 59 · A 56 · C 46 · O 50

### Telefonközpont-kezelők

`43-5031.00` · **ISCO-08 4223** Telefonközpont-kezelők · **FEOR-08:** 4225 Ügyfélszolgálati központ tájékoztatója · ESCO `4223.1` · EN: Public Safety Telecommunicators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* telefonközpont-kezelő

A telefonközpont-kezelők a kapcsolótáblák és konzolok segítségével létesítenek telefonkapcsolatot. Ezenkívül választ adnak az ügyfelek érdeklődésére, és intézkednek problémák bejelentésekor.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 63.4%-a jelölte

**Holland-kód:** CRS — R 56 · I 32 · A 0 · S 44 · E 32 · C 75

**HEXACO differenciál cél-profil:** O cél 36±20 (w=0.32) · A cél 60±24 (w=0.21) · H cél 58±25 (w=0.17) · E cél 43±25 (w=0.15)

**HEXACO abszolút szint:** H 62 · E 40 · X 53 · A 63 · C 59 · O 44

### Ügyfélszolgálati ügyintézők

`43-4151.00` · **ISCO-08 4225** Ügyfélszolgálati ügyintézők · **FEOR-08:** 4224 Ügyfél- (vevő)tájékoztató · ESCO `4225` · EN: Order Clerks · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Receive and process incoming orders for materials, merchandise, classified ads, or services such as repairs, installations, or rental of facilities. Generally receives orders via mail, phone, fax, or other electronic means.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 63.0%-a jelölte

**Holland-kód:** CER — R 26 · I 0 · A 0 · S 25 · E 59 · C 100

**HEXACO differenciál cél-profil:** H cél 61±23 (w=0.31) · O cél 40±23 (w=0.28) · E cél 55±26 (w=0.14) · A cél 55±27 (w=0.14)

**HEXACO abszolút szint:** H 52 · E 57 · X 46 · A 48 · C 41 · O 39

### ügyfélkapcsolati munkatárs

`43-4051.00` · **ISCO-08 4225** Ügyfélszolgálati ügyintézők · **FEOR-08:** 4224 Ügyfél- (vevő)tájékoztató · ESCO `4225.1` · EN: Customer Service Representatives

*Piaci megnevezések (ESCO):* panaszfelvevő, panaszkezelő

Az ügyfélkapcsolati munkatársak panaszkezeléssel foglalkoznak, továbbá felelnek azért, hogy fennmaradjon az általános cégérték a szervezet és az ügyfelei között.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 54.8%-a jelölte

**Holland-kód:** CES — R 16 · I 10 · A 0 · S 46 · E 68 · C 89

**HEXACO differenciál cél-profil:** A cél 68±18 (w=0.32) · O cél 33±19 (w=0.30) · H cél 62±22 (w=0.21) · C cél 41±24 (w=0.16)

**HEXACO abszolút szint:** H 59 · E 48 · X 52 · A 62 · C 43 · O 38

### éjszakai recepciós

`43-4171.00` · **ISCO-08 4226** Recepciósok (általános) · **FEOR-08:** 4222 Recepciós · ESCO `4226.1` · EN: Receptionists and Information Clerks

*Piaci megnevezések (ESCO):* éjszakai őr, recepciós

Az éjszakai recepciósok a vendéglátó egységekben felügyelik az éjszakai ügyfélszolgálatot, és az ügyfélszolgálattól a könyvelésig különféle tevékenységeket végeznek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 49.5%-a jelölte

**Holland-kód:** CES — R 16 · I 13 · A 2 · S 43 · E 54 · C 88

**HEXACO differenciál cél-profil:** A cél 67±19 (w=0.26) · H cél 64±20 (w=0.22) · O cél 36±21 (w=0.21) · C cél 37±21 (w=0.20)

**HEXACO abszolút szint:** H 59 · E 52 · X 53 · A 60 · C 38 · O 39

### Összeírók és piackutatási kérdezők

`43-4111.00` · **ISCO-08 4227** Összeírók és piackutatási kérdezők · **FEOR-08:** 4226 Lakossági kérdező, összeíró · ESCO `4227.1` · EN: Interviewers, Except Eligibility and Loan · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* piackutatási kérdező, közvéleménykutató (kérdező), kérdező, lakossági kérdező, összeíró, telefonos kérdező

A piackutatási kérdezők arra törekednek, hogy információkat gyűjtsenek a vásárlók kereskedelmi termékekkel vagy szolgáltatásokkal kapcsolatos észrevételeiről, véleményéről és preferenciáiról.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 42.4%-a jelölte

**Holland-kód:** CSE — R 0 · I 15 · A 6 · S 52 · E 44 · C 84

**HEXACO differenciál cél-profil:** O cél 38±22 (w=0.23) · H cél 61±23 (w=0.20) · A cél 59±24 (w=0.18) · C cél 41±24 (w=0.17)

**HEXACO abszolút szint:** H 55 · E 54 · X 53 · A 54 · C 40 · O 39

### Máshová nem sorolható, ügyfél-tájékoztatási foglalkozásúak

`43-4081.00` · **ISCO-08 4229** Máshová nem sorolható, ügyfél-tájékoztatási foglalkozásúak · **FEOR-08:** 4229 Egyéb ügyfélkapcsolati foglalkozású · ESCO `4229.2` · EN: Hotel, Motel, and Resort Desk Clerks · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Accommodate hotel, motel, and resort patrons by registering and assigning rooms to guests, issuing room keys or cards, transmitting and receiving messages, keeping records of occupied rooms and guests' accounts, making and confirming reservations, and presenting statements to and collecting payments from departing guests.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 75.0%-a jelölte

**Holland-kód:** CSE — R 27 · I 0 · A 6 · S 58 · E 47 · C 79

**HEXACO differenciál cél-profil:** A cél 64±21 (w=0.25) · O cél 37±21 (w=0.24) · C cél 39±22 (w=0.20) · H cél 59±24 (w=0.16)

**HEXACO abszolút szint:** H 58 · E 46 · X 55 · A 60 · C 43 · O 41

### Számviteli és könyvelési nyilvántartók

`43-3031.00` · **ISCO-08 4311** Számviteli és könyvelési nyilvántartók · **FEOR-08:** 4121 Könyvelő (analitikus) · ESCO `4311` · EN: Bookkeeping, Accounting, and Auditing Clerks · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* számlázási ügyintéző, számlakezelő munkatárs, számlázási munkatárs

_(HU leírás nincs; EN:)_ Compute, classify, and record numerical data to keep financial records complete. Perform any combination of routine calculating, posting, and verifying duties to obtain primary financial data for use in maintaining accounting records.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 40.9%-a jelölte

**Holland-kód:** CEI — R 10 · I 20 · A 0 · S 8 · E 31 · C 100

**HEXACO differenciál cél-profil:** H cél 64±20 (w=0.23) · C cél 61±22 (w=0.18) · O cél 39±22 (w=0.18) · A cél 41±24 (w=0.14)

**HEXACO abszolút szint:** H 49 · E 62 · X 36 · A 35 · C 50 · O 35

### számlázási ügyintéző

`43-3021.00` · **ISCO-08 4311** Számviteli és könyvelési nyilvántartók · **FEOR-08:** 4121 Könyvelő (analitikus) · ESCO `4311.1` · EN: Billing and Posting Clerks

*Piaci megnevezések (ESCO):* számlakezelő munkatárs, számlázási munkatárs

A számlázási ügyintézők számlákat és jóváírási értesítéseket készítenek, azokat minden szükséges módon átadják az ügyfeleknek, valamint frissítik az ügyfelek aktáit.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: megkezdett felsőfokú tanulmányok · a válaszadók 51.5%-a jelölte

**Holland-kód:** CRE — R 30 · I 10 · A 0 · S 8 · E 29 · C 100

**HEXACO differenciál cél-profil:** H cél 64±20 (w=0.28) · O cél 39±23 (w=0.22) · C cél 57±25 (w=0.14) · E cél 57±26 (w=0.13)

**HEXACO abszolút szint:** H 48 · E 63 · X 36 · A 37 · C 45 · O 34

### befektetési és vagyonkezelési ügyintéző

`43-4011.00` · **ISCO-08 4312** Statisztikai, pénzügyi és biztosítási nyilvántartók · **FEOR-08:** 4123 Pénzügyi, statisztikai, biztosítási adminisztrátor · ESCO `4312.5` · EN: Brokerage Clerks

*Piaci megnevezések (ESCO):* befektetési ügyintéző, háttérirodai munkatárs, back office ügyintéző, back office munkatárs

A befektetési és vagyonkezelési ügyintézők befektetések –például részvények, kötvények vagy más értékpapírok – adminisztrációjához nyújtanak segítséget, és általános ügyviteli feladatokat látnak el a pénzügyi társaságok befektetési ágazatában.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 38.2%-a jelölte

**Holland-kód:** CES — R 18 · I 4 · A 0 · S 22 · E 58 · C 99

**HEXACO differenciál cél-profil:** H cél 62±22 (w=0.35) · O cél 40±23 (w=0.29) · E cél 54±27 (w=0.12) · C cél 54±28 (w=0.11)

**HEXACO abszolút szint:** H 51 · E 58 · X 43 · A 44 · C 46 · O 38

### biztosítási ügynök, ügyintéző

`43-9041.00` · **ISCO-08 4312** Statisztikai, pénzügyi és biztosítási nyilvántartók · **FEOR-08:** 4123 Pénzügyi, statisztikai, biztosítási adminisztrátor · ESCO `4312.4` · EN: Insurance Claims and Policy Processing Clerks

*Piaci megnevezések (ESCO):* biztosítási értékesítési tanácsadó, biztosítási konzultáns

A biztosítási ügynökök általános ügyviteli és adminisztratív feladatokat látnak el biztosítóknál, más szolgáltató intézményeknél, önálló vállalkozóként tevékenykedő biztosítási ügynökök vagy biztosításközvetítők, illetve kormányzati intézmények számára.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 54.9%-a jelölte

**Holland-kód:** CES — R 4 · I 24 · A 0 · S 26 · E 48 · C 100

**HEXACO differenciál cél-profil:** H cél 66±19 (w=0.33) · O cél 37±21 (w=0.27) · X cél 42±25 (w=0.16) · E cél 56±26 (w=0.13)

**HEXACO abszolút szint:** H 54 · E 58 · X 40 · A 46 · C 47 · O 36

### bérelszámoló

`43-3051.00` · **ISCO-08 4313** Bérszámfejtők · **FEOR-08:** 4122 Bérelszámoló · ESCO `4313.1` · EN: Payroll and Timekeeping Clerks

*Piaci megnevezések (ESCO):* bérügyi előadó, bérügyi ügyintéző

A bérelszámolók kezelik a munkavállalók munkaidő-kimutatását és fizetési ívét. Meggyőződnek az információk helyességéről. A bérelszámolók ellenőrzik a túlórát, a betegszabadságot és a szabadságot.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 31.8%-a jelölte

**Holland-kód:** CES — R 14 · I 1 · A 0 · S 15 · E 39 · C 100

**HEXACO differenciál cél-profil:** H cél 66±20 (w=0.27) · O cél 37±22 (w=0.22) · X cél 41±24 (w=0.15) · E cél 58±24 (w=0.15)

**HEXACO abszolút szint:** H 52 · E 62 · X 37 · A 40 · C 50 · O 35

### Készletnyilvántartók

`43-5071.00` · **ISCO-08 4321** Készletnyilvántartók · **FEOR-08:** 4131 Készlet- és anyagnyilvántartó · ESCO `4321.1` · EN: Shipping, Receiving, and Inventory Clerks · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* raktárgazdálkodó, raktározási szakember, leltározó

A raktárgazdálkodók a raktárakba, a nagykereskedőkhöz és az egyéni fogyasztókhoz szállítás céljából nyilvántartást vezetnek a raktárakban tárolt termékekről.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 74.9%-a jelölte

**Holland-kód:** CRE — R 50 · I 4 · A 0 · S 6 · E 35 · C 100

**HEXACO differenciál cél-profil:** H cél 60±23 (w=0.33) · O cél 40±24 (w=0.31) · C cél 54±27 (w=0.14) · X cél 46±27 (w=0.14)

**HEXACO abszolút szint:** H 46 · E 59 · X 39 · A 40 · C 43 · O 36

### Készletnyilvántartók

`43-5111.00` · **ISCO-08 4321** Készletnyilvántartók · **FEOR-08:** 4131 Készlet- és anyagnyilvántartó · ESCO `4321.1.3` · EN: Weighers, Measurers, Checkers, and Samplers, Recordkeeping · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* raktárgazdálkodó, raktározási szakember, leltározó

A raktárgazdálkodók a raktárakba, a nagykereskedőkhöz és az egyéni fogyasztókhoz szállítás céljából nyilvántartást vezetnek a raktárakban tárolt termékekről.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 50.0%-a jelölte

**Holland-kód:** CRI — R 72 · I 23 · A 0 · S 0 · E 13 · C 90

**HEXACO differenciál cél-profil:** H cél 61±22 (w=0.26) · O cél 40±23 (w=0.23) · E cél 56±26 (w=0.14) · C cél 56±26 (w=0.13)

**HEXACO abszolút szint:** H 43 · E 65 · X 34 · A 33 · C 40 · O 32

### Termelési nyilvántartók

`43-5061.00` · **ISCO-08 4322** Termelési nyilvántartók · **FEOR-08:** 3161 Munka- és termelésszervező · ESCO `4322` · EN: Production, Planning, and Expediting Clerks · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gyártósori gyártáskoordinátor, gyártáskoordinátor, termelési koordinátor

_(HU leírás nincs; EN:)_ Coordinate and expedite the flow of work and materials within or between departments of an establishment according to production schedule.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 36.8%-a jelölte

**Holland-kód:** CER — R 35 · I 3 · A 2 · S 18 · E 65 · C 82

**HEXACO differenciál cél-profil:** O cél 43±25 (w=0.31) · X cél 55±27 (w=0.22) · A cél 54±27 (w=0.19) · C cél 53±28 (w=0.11)

**HEXACO abszolút szint:** H 47 · E 52 · X 52 · A 51 · C 51 · O 44

### Szállítmányozási nyilvántartók

`43-5011.00` · **ISCO-08 4323** Szállítmányozási nyilvántartók · **FEOR-08:** 3161 Munka- és termelésszervező; 4132 Szállítási, szállítmányozási nyilvántartó · ESCO `4323.6` · EN: Cargo and Freight Agents · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* árufuvarozói ügyintéző, logisztikai ügyintéző, útitervkészító, légi szállítmányozási nyilvántartó, légi teherfuvarozási logisztikai szakember

Az árufuvarozói ügyintézők megbízható üzeneteket fogadnak és továbbítanak, nyomon követik a járműveket és berendezéseket, valamint más fontos információkat rögzítenek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: alapszak (BA/BSc) · a válaszadók 30.8%-a jelölte

**Holland-kód:** CER — R 36 · I 9 · A 0 · S 19 · E 64 · C 89

**HEXACO differenciál cél-profil:** O cél 45±27 (w=0.30) · X cél 54±28 (w=0.24) · E cél 46±28 (w=0.23) · A cél 52±28 (w=0.15)

**HEXACO abszolút szint:** H 49 · E 50 · X 50 · A 49 · C 48 · O 44

### Szállítmányozási nyilvántartók

`43-5011.01` · **ISCO-08 4323** Szállítmányozási nyilvántartók · **FEOR-08:** 3161 Munka- és termelésszervező; 4132 Szállítási, szállítmányozási nyilvántartó · ESCO `4323.6` · EN: Freight Forwarders · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* árufuvarozói ügyintéző, logisztikai ügyintéző, útitervkészító, vasúti árufuvarozási ügyintéző, közlekedésüzemvitel-ellátó

Az árufuvarozói ügyintézők megbízható üzeneteket fogadnak és továbbítanak, nyomon követik a járműveket és berendezéseket, valamint más fontos információkat rögzítenek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: alapszak (BA/BSc) · a válaszadók 43.7%-a jelölte

**Holland-kód:** CER — R 42 · I 26 · A 0 · S 14 · E 49 · C 77

**HEXACO differenciál cél-profil:** H cél 46±27 (w=0.28) · E cél 46±28 (w=0.24) · X cél 53±28 (w=0.19) · C cél 52±29 (w=0.13)

**HEXACO abszolút szint:** H 50 · E 46 · X 54 · A 52 · C 56 · O 53

### Szállítmányozási nyilvántartók

`43-5032.00` · **ISCO-08 4323** Szállítmányozási nyilvántartók · **FEOR-08:** 3161 Munka- és termelésszervező; 4132 Szállítási, szállítmányozási nyilvántartó · ESCO `4323.2` · EN: Dispatchers, Except Police, Fire, and Ambulance · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* repülésüzemi tiszt, légiforgalmi irányító, légiforgalmi felügyelő, hajóforgalmi irányító, víziforgalmi irányító, víziközlekedési irányító

A repülésüzemi tisztek kormányzati és társasági szabályok szerint engedélyezik, szabályozzák és ellenőrzik a kereskedelmi légitársaságok járatait.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 47.4%-a jelölte

**Holland-kód:** CRE — R 71 · I 7 · A 0 · S 28 · E 32 · C 73

**HEXACO differenciál cél-profil:** O cél 41±24 (w=0.26) · A cél 59±24 (w=0.26) · E cél 43±25 (w=0.20) · X cél 54±27 (w=0.12)

**HEXACO abszolút szint:** H 49 · E 45 · X 54 · A 56 · C 49 · O 43

### Postai kézbesítők és válogatók

`43-5052.00` · **ISCO-08 4412** Postai kézbesítők és válogatók · **FEOR-08:** 3161 Munka- és termelésszervező; 4135 Postai szolgáltató (kézbesítő, válogató) · ESCO `4412.1` · EN: Postal Service Mail Carriers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* postai válogató, válogató, csomagválogató, postai kézbesítő, kézbesítő, postás

A postai válogatók leveleket kezelnek, válogatnak, tartanak nyilván, illetve postahivatalok vagy kapcsolódó szervezetek levélpostai szolgáltatásait intézik. Nyilvántartást vezetnek a létesítménybe beérkező és az onnan kimenő csomagokról és levelekről.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 78.2%-a jelölte

**Holland-kód:** CRE — R 43 · I 0 · A 0 · S 28 · E 32 · C 88

**HEXACO differenciál cél-profil:** O cél 35±20 (w=0.39) · H cél 64±21 (w=0.35)

**HEXACO abszolút szint:** H 54 · E 54 · X 44 · A 48 · C 46 · O 35

### Postai kézbesítők és válogatók

`43-5053.00` · **ISCO-08 4412** Postai kézbesítők és válogatók · **FEOR-08:** 3161 Munka- és termelésszervező; 4135 Postai szolgáltató (kézbesítő, válogató) · ESCO `4412.1` · EN: Postal Service Mail Sorters, Processors, and Processing Machine Operators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* postai válogató, válogató, csomagválogató

A postai válogatók leveleket kezelnek, válogatnak, tartanak nyilván, illetve postahivatalok vagy kapcsolódó szervezetek levélpostai szolgáltatásait intézik. Nyilvántartást vezetnek a létesítménybe beérkező és az onnan kimenő csomagokról és levelekről.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 81.4%-a jelölte

**Holland-kód:** CRS — R 60 · I 9 · A 0 · S 14 · E 11 · C 82

**HEXACO differenciál cél-profil:** X cél 43±25 (w=0.26) · O cél 43±25 (w=0.26) · C cél 56±26 (w=0.23) · H cél 54±28 (w=0.13)

**HEXACO abszolút szint:** H 37 · E 60 · X 33 · A 37 · C 39 · O 35

### postai válogató

`43-9051.00` · **ISCO-08 4412** Postai kézbesítők és válogatók · **FEOR-08:** 3161 Munka- és termelésszervező; 4135 Postai szolgáltató (kézbesítő, válogató) · ESCO `4412.1` · EN: Mail Clerks and Mail Machine Operators, Except Postal Service

*Piaci megnevezések (ESCO):* válogató, csomagválogató, postai kézbesítő, kézbesítő, postás

A postai válogatók leveleket kezelnek, válogatnak, tartanak nyilván, illetve postahivatalok vagy kapcsolódó szervezetek levélpostai szolgáltatásait intézik. Nyilvántartást vezetnek a létesítménybe beérkező és az onnan kimenő csomagokról és levelekről.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 48.4%-a jelölte

**Holland-kód:** CRE — R 50 · I 0 · A 0 · S 17 · E 19 · C 91

**HEXACO differenciál cél-profil:** H cél 59±24 (w=0.34) · O cél 43±25 (w=0.29) · X cél 46±28 (w=0.15) · E cél 52±28 (w=0.10)

**HEXACO abszolút szint:** H 40 · E 63 · X 34 · A 35 · C 34 · O 34

### irattáros

`43-4071.00` · **ISCO-08 4415** Iktatók, fénymásolók · **FEOR-08:** 4136 Iratkezelő, irattáros · ESCO `4415.1` · EN: File Clerks

*Piaci megnevezések (ESCO):* iratkezelő

Az irattárosok a vállalati nyilvántartások vezetéséért, valamint formanyomtatványok és információk kezeléséért felelnek. Szükség esetén dokumentumokat rendszereznek és keresnek vissza, és gondoskodnak a rendszer hatékony működéséről.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 38.4%-a jelölte

**Holland-kód:** CRS — R 24 · I 5 · A 0 · S 18 · E 13 · C 100

**HEXACO differenciál cél-profil:** H cél 64±21 (w=0.36) · E cél 58±25 (w=0.21) · O cél 42±25 (w=0.21) · X cél 45±27 (w=0.13)

**HEXACO abszolút szint:** H 45 · E 66 · X 35 · A 37 · C 37 · O 34

### személyzeti asszisztens

`43-4161.00` · **ISCO-08 4416** Személyzeti nyilvántartási foglalkozásúak · **FEOR-08:** 4134 Humánpolitikai adminisztrátor · ESCO `4416.1` · EN: Human Resources Assistants, Except Payroll and Timekeeping

*Piaci megnevezések (ESCO):* HR-asszisztens, emberi kapcsolatok asszisztens

A személyzeti asszisztensek a személyzeti vezetők által végzett folyamatok és törekvések során nyújtanak támogatást.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 33.8%-a jelölte

**Holland-kód:** CES — R 7 · I 6 · A 0 · S 37 · E 48 · C 100

**HEXACO differenciál cél-profil:** H cél 69±17 (w=0.34) · O cél 39±23 (w=0.20) · E cél 59±24 (w=0.17) · A cél 57±25 (w=0.13)

**HEXACO abszolút szint:** H 60 · E 58 · X 46 · A 52 · C 44 · O 40


## 5 — Kereskedelmi és szolgáltatási foglalkozások

### utaskísérő

`53-2031.00` · **ISCO-08 5111** Utaskísérők és stewardok · **FEOR-08:** 5232 Utaskísérő (repülőn, hajón) · ESCO `5111.2.1` · EN: Flight Attendants

*Piaci megnevezések (ESCO):* hostess, légiutas-kísérő

Az utaskísérők valamennyi szárazföldi, tengeri és légi járaton étel- és italfelszolgálási tevékenységeket végeznek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 70.3%-a jelölte

**Holland-kód:** CSR — R 51 · I 17 · A 4 · S 53 · E 44 · C 57

**HEXACO differenciál cél-profil:** O cél 32±18 (w=0.33) · A cél 66±19 (w=0.29) · C cél 43±25 (w=0.13) · E cél 43±26 (w=0.12)

**HEXACO abszolút szint:** H 62 · E 38 · X 61 · A 69 · C 58 · O 43

### Idegenvezetők

`35-9031.00` · **ISCO-08 5113** Idegenvezetők · **FEOR-08:** 5233 Idegenvezető · ESCO `5113.1` · EN: Hosts and Hostesses, Restaurant, Lounge, and Coffee Shop · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* idegenvezető, utaskísérő

Az idegenvezetők bármilyen művészeti létesítményben, társasutazáson vagy városnéző körúton, vagy idegenforgalmi jelentőségű helyszíneken – például múzeumokban, emlékműveknél vagy közterületeken – segítenek egyéneket vagy csoportokat.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 42.0%-a jelölte

**Holland-kód:** SEC — R 36 · I 0 · A 12 · S 71 · E 57 · C 52

**HEXACO differenciál cél-profil:** A cél 68±18 (w=0.26) · O cél 35±20 (w=0.22) · C cél 35±20 (w=0.21) · X cél 62±22 (w=0.17)

**HEXACO abszolút szint:** H 54 · E 51 · X 56 · A 59 · C 33 · O 37

### Idegenvezetők

`39-7011.00` · **ISCO-08 5113** Idegenvezetők · **FEOR-08:** 5233 Idegenvezető · ESCO `5113.1` · EN: Tour Guides and Escorts · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* idegenvezető, utaskísérő

Az idegenvezetők bármilyen művészeti létesítményben, társasutazáson vagy városnéző körúton, vagy idegenforgalmi jelentőségű helyszíneken – például múzeumokban, emlékműveknél vagy közterületeken – segítenek egyéneket vagy csoportokat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 31.0%-a jelölte

**Holland-kód:** SEA — R 39 · I 23 · A 41 · S 72 · E 44 · C 31

**HEXACO differenciál cél-profil:** C cél 32±18 (w=0.39) · X cél 63±21 (w=0.28) · A cél 61±23 (w=0.23)

**HEXACO abszolút szint:** H 55 · E 48 · X 62 · A 60 · C 37 · O 54

### szakács

`35-2014.00` · **ISCO-08 5120** Szakácsok · **FEOR-08:** 5131 Vendéglős; 5134 Szakács · ESCO `5120.1` · EN: Cooks, Restaurant

*Piaci megnevezések (ESCO):* főszakács, szakácsnő

A szakácsok olyan gasztronómiai szakemberek, akik képesek – általában háztartási és intézményi környezetben – élelmiszert készíteni és bemutatni.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 47.3%-a jelölte

**Holland-kód:** RCE — R 77 · I 9 · A 28 · S 31 · E 45 · C 47

**HEXACO differenciál cél-profil:** E cél 44±26 (w=0.30) · H cél 45±26 (w=0.26) · A cél 54±27 (w=0.22)

**HEXACO abszolút szint:** H 44 · E 48 · X 46 · A 50 · C 46 · O 48

### Felszolgálók

`35-3031.00` · **ISCO-08 5131** Felszolgálók · **FEOR-08:** 5132 Pincér · ESCO `5131` · EN: Waiters and Waitresses · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* pincér/pincérnő, főpincér, pincérek

_(HU leírás nincs; EN:)_ Take orders and serve food and beverages to patrons at tables in dining establishment.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 57.6%-a jelölte

**Holland-kód:** CSR — R 52 · I 0 · A 14 · S 62 · E 51 · C 66

**HEXACO differenciál cél-profil:** A cél 65±20 (w=0.27) · O cél 38±22 (w=0.22) · C cél 38±22 (w=0.21) · X cél 58±25 (w=0.14)

**HEXACO abszolút szint:** H 56 · E 47 · X 56 · A 60 · C 38 · O 41

### mixer bárpultos

`35-3011.00` · **ISCO-08 5132** Pultosok · **FEOR-08:** 5133 Pultos · ESCO `5132.1` · EN: Bartenders

*Piaci megnevezések (ESCO):* bárpultosok, csapos

A mixer bárpultosok az ügyfelek által rendelt alkoholtartalmú vagy alkoholmentes italokat szolgálnak fel bárok fogyasztási területén.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 43.0%-a jelölte

**Holland-kód:** RCE — R 61 · I 0 · A 22 · S 46 · E 48 · C 59

**HEXACO differenciál cél-profil:** C cél 36±20 (w=0.32) · X cél 60±23 (w=0.23) · A cél 58±24 (w=0.19) · E cél 44±26 (w=0.13)

**HEXACO abszolút szint:** H 53 · E 44 · X 59 · A 58 · C 40 · O 48

### mixer bárpultos

`35-3023.01` · **ISCO-08 5132** Pultosok · **FEOR-08:** 5133 Pultos · ESCO `5132.1.1` · EN: Baristas

*Piaci megnevezések (ESCO):* bárpultosok, csapos

A mixer bárpultosok az ügyfelek által rendelt alkoholtartalmú vagy alkoholmentes italokat szolgálnak fel bárok fogyasztási területén.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 57.1%-a jelölte

**Holland-kód:** RSC — R 76 · I 1 · A 27 · S 45 · E 37 · C 45

**HEXACO differenciál cél-profil:** A cél 63±22 (w=0.28) · C cél 39±23 (w=0.24) · O cél 41±24 (w=0.19) · H cél 58±25 (w=0.18)

**HEXACO abszolút szint:** H 53 · E 52 · X 51 · A 55 · C 35 · O 41

### fodrász

`39-5011.00` · **ISCO-08 5141** Fodrászok · **FEOR-08:** 5211 Fodrász · ESCO `5141.1.1` · EN: Barbers

*Piaci megnevezések (ESCO):* fodrásznő, kozmetikus

A fodrászok szépségápolási szolgáltatásokat nyújtanak, például az ügyfelek haját vágják, színezik, szőkítik, dauerolják és formázzák. Személyre szabott szolgáltatások nyújtása érdekében megkérdezik ügyfeleiket, hogy milyen frizurát szeretnének.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 28.7%-a jelölte

**Holland-kód:** RCS — R 73 · I 0 · A 28 · S 43 · E 42 · C 48

**HEXACO differenciál cél-profil:** C cél 38±22 (w=0.28) · X cél 59±24 (w=0.21) · E cél 56±26 (w=0.15) · A cél 56±26 (w=0.14)

**HEXACO abszolút szint:** H 52 · E 56 · X 55 · A 52 · C 37 · O 46

### fodrász

`39-5012.00` · **ISCO-08 5141** Fodrászok · **FEOR-08:** 5211 Fodrász · ESCO `5141.1` · EN: Hairdressers, Hairstylists, and Cosmetologists

*Piaci megnevezések (ESCO):* fodrásznő, kozmetikus

A fodrászok szépségápolási szolgáltatásokat nyújtanak, például az ügyfelek haját vágják, színezik, szőkítik, dauerolják és formázzák. Személyre szabott szolgáltatások nyújtása érdekében megkérdezik ügyfeleiket, hogy milyen frizurát szeretnének.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 79.0%-a jelölte

**Holland-kód:** RCS — R 73 · I 9 · A 37 · S 45 · E 38 · C 49

**HEXACO differenciál cél-profil:** C cél 38±22 (w=0.35) · X cél 59±24 (w=0.26) · A cél 57±26 (w=0.19) · E cél 55±27 (w=0.13)

**HEXACO abszolút szint:** H 51 · E 52 · X 58 · A 56 · C 41 · O 52

### Kozmetikusok és hasonló foglalkozásúak

`39-5094.00` · **ISCO-08 5142** Kozmetikusok és hasonló foglalkozásúak · **FEOR-08:** 5212 Kozmetikus; 5213 Manikűrös, pedikűrös · ESCO `5142.1` · EN: Skincare Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* kozmetikus, sminkes, elektrokozmetikus, szőreltávolító szakember, szőreltávolító technikus, elektrolízises szőreltávolító technikus

A kozmetikusok bőrápoló kezeléseket biztosítanak.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 39.1%-a jelölte

**Holland-kód:** RSC — R 75 · I 17 · A 32 · S 53 · E 35 · C 40

**HEXACO differenciál cél-profil:** C cél 38±22 (w=0.31) · H cél 58±24 (w=0.23) · E cél 57±25 (w=0.18) · O cél 46±28 (w=0.10)

**HEXACO abszolút szint:** H 59 · E 52 · X 55 · A 55 · C 44 · O 49

### manikűrös

`39-5092.00` · **ISCO-08 5142** Kozmetikusok és hasonló foglalkozásúak · **FEOR-08:** 5212 Kozmetikus; 5213 Manikűrös, pedikűrös · ESCO `5142.6` · EN: Manicurists and Pedicurists

*Piaci megnevezések (ESCO):* műkörömépítő, recepciós szalonban, pedikűrös, kéz- és lábápoló, szalonalkalmazott, kozmetikus

A manikűrösök a kéz körmeit ápolják. Megtisztítják, levágják és formázzák a körmöket, eltávolítják a körömre ránőtt bőrt, és felviszik a körömlakkot. A manikűrösök műkörmöket és egyéb díszítő elemeket is alkalmaznak a körmökön.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 49.2%-a jelölte

**Holland-kód:** RCS — R 77 · I 5 · A 22 · S 34 · E 22 · C 44

**HEXACO differenciál cél-profil:** O cél 39±23 (w=0.25) · A cél 60±24 (w=0.22) · C cél 42±25 (w=0.18) · E cél 57±25 (w=0.17)

**HEXACO abszolút szint:** H 48 · E 58 · X 49 · A 52 · C 37 · O 40

### takarítószolgálat-vezető

`37-1011.00` · **ISCO-08 5151** Takarítási és házvezetői munka irányítói szállodákban és egyéb intézményekben · **FEOR-08:** 5241 Vezető takarító · ESCO `5151.2` · EN: First-Line Supervisors of Housekeeping and Janitorial Workers

*Piaci megnevezések (ESCO):* takarító szolgálatvezetők, vezető takarító, komornyik/komorna, lakáj, komornyik

A takarítószolgálat-vezetők a vendéglátóipari létesítmények takarítási és házvezetési tevékenységeinek napi szintű felügyeletéért és koordinálásáért felelnek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 43.3%-a jelölte

**Holland-kód:** ECR — R 52 · I 6 · A 0 · S 44 · E 78 · C 72

**HEXACO differenciál cél-profil:** X cél 62±22 (w=0.35) · O cél 39±23 (w=0.31) · C cél 46±27 (w=0.13)

**HEXACO abszolút szint:** H 56 · E 49 · X 61 · A 54 · C 49 · O 44

### állatgondozó idomár

`39-2021.00` · **ISCO-08 5164** Hobbiállat-gondozók és -kozmetikusok · **FEOR-08:** 5292 Hobbiállat-gondozó, -kozmetikus · ESCO `5164.2` · EN: Animal Caretakers

*Piaci megnevezések (ESCO):* állatgondozó, állatmenhelyi dolgozó, kutyazkozmetikus, állatmenhelyi segítő, cirkuszi állatgondozó, állatgondozók

Az állatgondozó idomárok feladata, hogy nemzeti jogszabályoknak megfelelően gondoskodjanak a munkát végző állatokról és folytassák a kiképzésüket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 63.5%-a jelölte

**Holland-kód:** RSC — R 86 · I 29 · A 10 · S 46 · E 9 · C 38

**HEXACO differenciál cél-profil:** H cél 65±20 (w=0.44) · O cél 42±24 (w=0.25) · C cél 46±28 (w=0.10) · A cél 53±28 (w=0.10)

**HEXACO abszolút szint:** H 59 · E 52 · X 49 · A 52 · C 45 · O 43

### Beosztott eladók

`41-2022.00` · **ISCO-08 5223** Beosztott eladók · **FEOR-08:** 5113 Bolti eladó; 5114 Kölcsönző · ESCO `5223.2` · EN: Parts Salespersons · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* járműalkatrész-eladó, értékesítési asszisztens, értékesítési asszisztens gyakornok, eladó, szaküzleti eladó

A járműalkatrész-eladók járműalkatrészeket értékesítenek, megrendelik az alkatrészeket, és azonosítják a pótalkatrészeket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 46.9%-a jelölte

**Holland-kód:** RCE — R 77 · I 10 · A 0 · S 16 · E 47 · C 69

**HEXACO differenciál cél-profil:** X cél 60±23 (w=0.37) · H cél 46±27 (w=0.15) · O cél 46±27 (w=0.15) · E cél 54±28 (w=0.14)

**HEXACO abszolút szint:** H 44 · E 54 · X 55 · A 50 · C 44 · O 46

### Beosztott eladók

`41-2031.00` · **ISCO-08 5223** Beosztott eladók · **FEOR-08:** 5113 Bolti eladó; 5114 Kölcsönző · ESCO `5223.4` · EN: Retail Salespersons · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* értékesítési asszisztens, értékesítési asszisztens gyakornok, eladó, bolti eladó, szaküzleti eladó

Az értékesítési asszisztensek az ügyfelekkel való közvetlen kapcsolattartók. Általános tanácsokkal látják el az ügyfeleket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 63.5%-a jelölte

**Holland-kód:** ECR — R 37 · I 0 · A 16 · S 33 · E 86 · C 70

**HEXACO differenciál cél-profil:** X cél 67±18 (w=0.39) · H cél 41±24 (w=0.20) · A cél 57±26 (w=0.15) · O cél 44±26 (w=0.14)

**HEXACO abszolút szint:** H 43 · E 50 · X 61 · A 55 · C 41 · O 46

### pénztáros

`41-2011.00` · **ISCO-08 5230** Pénztárosok és jegyárusítók · **FEOR-08:** 5117 Bolti pénztáros, jegypénztáros · ESCO `5230.1` · EN: Cashiers

*Piaci megnevezések (ESCO):* pénztárosnő, főpénztáros, totó-lottóértékesítő, lottóárus, jegypénztáros, mozijegypénztáros

A pénztárosok működtetik a pénztárgépet, átveszik a vevőktől a kifizetett összegeket, nyugtákat állítanak ki, és átadják a visszajáró aprópénzt.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 44.3%-a jelölte

**Holland-kód:** CER — R 32 · I 0 · A 0 · S 26 · E 44 · C 87

**HEXACO differenciál cél-profil:** H cél 67±19 (w=0.28) · O cél 34±19 (w=0.27) · A cél 61±23 (w=0.18) · C cél 41±24 (w=0.15)

**HEXACO abszolút szint:** H 56 · E 57 · X 47 · A 52 · C 36 · O 34

### Telefonos/multimédiás értékesítő ügynökök

`41-9041.00` · **ISCO-08 5244** Telefonos/multimédiás értékesítő ügynökök · **FEOR-08:** 5123 Telefonos (multimédiás) értékesítési ügynök · ESCO `5244.1` · EN: Telemarketers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* call center operátor, telefonközpont-kezelő, híváskoordinátor

A call center operátorok a vállalkozások számára intézik a beérkező vagy kimenő ügyfélhívásokat. Meglévő és leendő ügyfeleket hívnak fel áruk és szolgáltatások népszerűsítése érdekében.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 39.5%-a jelölte

**Holland-kód:** ECS — R 14 · I 2 · A 4 · S 44 · E 73 · C 68

**HEXACO differenciál cél-profil:** H cél 30±16 (w=0.27) · X cél 68±18 (w=0.24) · E cél 34±19 (w=0.21) · O cél 36±21 (w=0.18)

**HEXACO abszolút szint:** H 28 · E 44 · X 56 · A 47 · C 37 · O 35

### Benzinkutasok

`53-6031.00` · **ISCO-08 5245** Benzinkutasok · **FEOR-08:** 5121 Üzemanyagtöltő állomás kezelője · ESCO `5245` · EN: Automotive and Watercraft Service Attendants · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Service automobiles, buses, trucks, boats, and other automotive or marine vehicles with fuel, lubricants, and accessories. Collect payment for services and supplies.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 58.6%-a jelölte

**Holland-kód:** RCE — R 90 · I 5 · A 0 · S 16 · E 19 · C 56

**HEXACO differenciál cél-profil:** O cél 39±23 (w=0.33) · H cél 60±23 (w=0.32) · E cél 54±27 (w=0.13) · A cél 54±27 (w=0.13)

**HEXACO abszolút szint:** H 48 · E 60 · X 42 · A 44 · C 36 · O 36

### Máshová nem sorolható értékesítési foglalkozásúak

`41-2021.00` · **ISCO-08 5249** Máshová nem sorolható értékesítési foglalkozásúak · **FEOR-08:** 5129 Egyéb, máshova nem sorolható kereskedelmi foglalkozású · ESCO `5249.2` · EN: Counter and Rental Clerks · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* kölcsönzői munkatárs, multimédiás szolgáltató, járműkölcsönző, járműkölcsönzői munkatárs

A kölcsönzői munkatársak feladata a berendezések bérbeadása és a kölcsönzési időszakok meghatározása. Ügyleteket, biztosításokat és kifizetéseket dokumentálnak.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 55.9%-a jelölte

**Holland-kód:** CES — R 36 · I 0 · A 4 · S 38 · E 48 · C 82

**HEXACO differenciál cél-profil:** O cél 37±21 (w=0.25) · C cél 40±23 (w=0.19) · H cél 60±23 (w=0.18) · A cél 60±24 (w=0.18)

**HEXACO abszolút szint:** H 52 · E 54 · X 52 · A 52 · C 35 · O 37

### Gyermekgondozók

`39-9011.00` · **ISCO-08 5311** Gyermekgondozók · **FEOR-08:** 3512 Hivatásos nevelőszülő, főállású anya; 5221 Gyermekfelügyelő, dajka · ESCO `5311.1` · EN: Childcare Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gyermekfelügyelő, gyermekgondozó

A gyermekfelügyelők ellátást nyújtanak a gyermekeknek, ha a szülők vagy a családtagok igénylik. Gondoskodnak a gyermekek alapvető szükségleteiről, és segítik, valamint felügyelik őket játék közben.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 38.5%-a jelölte

**Holland-kód:** SAC — R 35 · I 8 · A 43 · S 86 · E 29 · C 41

**HEXACO differenciál cél-profil:** A cél 64±20 (w=0.24) · H cél 63±21 (w=0.22) · C cél 37±22 (w=0.21) · O cél 37±22 (w=0.21)

**HEXACO abszolút szint:** H 67 · E 48 · X 57 · A 66 · C 49 · O 46

### Gyermekgondozók

`39-9011.01` · **ISCO-08 5311** Gyermekgondozók · **FEOR-08:** 3512 Hivatásos nevelőszülő, főállású anya; 5221 Gyermekfelügyelő, dajka · ESCO `5311.1` · EN: Nannies · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gyermekfelügyelő, gyermekgondozó

A gyermekfelügyelők ellátást nyújtanak a gyermekeknek, ha a szülők vagy a családtagok igénylik. Gondoskodnak a gyermekek alapvető szükségleteiről, és segítik, valamint felügyelik őket játék közben.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 60.0%-a jelölte

**Holland-kód:** SAC — R 32 · I 20 · A 42 · S 88 · E 28 · C 39

**HEXACO differenciál cél-profil:** O cél 37±21 (w=0.25) · A cél 63±22 (w=0.24) · H cél 62±22 (w=0.23) · C cél 39±23 (w=0.21)

**HEXACO abszolút szint:** H 68 · E 43 · X 60 · A 66 · C 53 · O 47

### kísérő iskolabuszon

`33-9094.00` · **ISCO-08 5311** Gyermekgondozók · **FEOR-08:** 3512 Hivatásos nevelőszülő, főállású anya; 5221 Gyermekfelügyelő, dajka · ESCO `5311.2` · EN: School Bus Monitors

A kísérők az iskolabuszon felügyelik a diákbuszokkal kapcsolatos tevékenységeket annak érdekében, hogy gondoskodjanak a diákok biztonságáról és jó magaviseletéről.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: —

**Holland-kód:** SCR — R 40 · I 8 · A 12 · S 71 · E 16 · C 63

**HEXACO differenciál cél-profil:** O cél 26±14 (w=0.35) · H cél 64±20 (w=0.22) · A cél 62±22 (w=0.18) · C cél 41±24 (w=0.14)

**HEXACO abszolút szint:** H 64 · E 48 · X 57 · A 61 · C 47 · O 35

### gyógypedagógiai asszisztens

`25-9043.00` · **ISCO-08 5312** Iskolai kisegítők · **FEOR-08:** 3410 Oktatási asszisztens · ESCO `5312.4` · EN: Teaching Assistants, Special Education

A gyógypedagógiai asszisztensek segítik agyógypedagógusokat a tantermi teendőik ellátásában.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 39.2%-a jelölte

**Holland-kód:** SCA — R 16 · I 38 · A 39 · S 100 · E 19 · C 43

**HEXACO differenciál cél-profil:** A cél 64±21 (w=0.31) · C cél 39±23 (w=0.25) · H cél 59±24 (w=0.20) · O cél 44±26 (w=0.13)

**HEXACO abszolút szint:** H 64 · E 45 · X 57 · A 66 · C 50 · O 51

### középiskolai oktatási asszisztens

`25-9042.00` · **ISCO-08 5312** Iskolai kisegítők · **FEOR-08:** 3410 Oktatási asszisztens · ESCO `5312.3` · EN: Teaching Assistants, Preschool, Elementary, Middle, and Secondary School, Except Special Education

*Piaci megnevezések (ESCO):* középiskolai tanársegéd, középiskolai pedagógiai asszisztens, általános iskolai oktatási asszisztens, oktatási asszisztens, pedagógiai asszisztens, óvodapedagógus-asszisztens

A középiskolai oktatási asszisztensek sokféle módon nyújtanak támogatást a középiskolai tanárok számára, például oktatási és gyakorlati segítségformájában.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 27.1%-a jelölte

**Holland-kód:** SCE — R 26 · I 22 · A 30 · S 92 · E 33 · C 54

**HEXACO differenciál cél-profil:** C cél 38±22 (w=0.30) · A cél 62±22 (w=0.29) · H cél 57±25 (w=0.18) · O cél 45±26 (w=0.13)

**HEXACO abszolút szint:** H 61 · E 47 · X 57 · A 63 · C 46 · O 50

### ápolási asszisztens

`31-1131.00` · **ISCO-08 5321** Kisegítő gondozó személyzet · **FEOR-08:** 5222 Segédápoló, műtőssegéd · ESCO `5321.1` · EN: Nursing Assistants

*Piaci megnevezések (ESCO):* gerontológiai gondozó

Az ápolási asszisztensek az ápolók munkáját segítik, és részt vesznek az életkortól független gondozásban, ápolásban és ellátásban, emellett különféle akut kórházi kezeléseknél és az alapszintű egészségügyi ellátásban nyújtanak segítséget.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 38.7%-a jelölte

**Holland-kód:** SRC — R 60 · I 29 · A 0 · S 78 · E 13 · C 54

**HEXACO differenciál cél-profil:** O cél 32±18 (w=0.25) · H cél 68±18 (w=0.24) · A cél 66±19 (w=0.22) · C cél 42±24 (w=0.11)

**HEXACO abszolút szint:** H 68 · E 50 · X 52 · A 66 · C 50 · O 40

### házi gondozó

`31-1121.00` · **ISCO-08 5322** Otthoni személygondozási foglalkozásúak · **FEOR-08:** 5223 Házi gondozó · ESCO `5322.1` · EN: Home Health Aides

*Piaci megnevezések (ESCO):* házi ápoló, házi szociális gondozó

A házi gondozók napi szintű személyes és ápolási segítséget nyújtanak mindazok számára, akik betegség, öregség vagy rokkantság miatt nem tudják ellátni magukat, és az illető önállóságának fokozására törekednek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 62.6%-a jelölte

**Holland-kód:** SRC — R 54 · I 36 · A 8 · S 89 · E 13 · C 42

**HEXACO differenciál cél-profil:** H cél 66±19 (w=0.25) · O cél 35±20 (w=0.23) · A cél 65±20 (w=0.23) · C cél 41±24 (w=0.14)

**HEXACO abszolút szint:** H 69 · E 47 · X 54 · A 67 · C 52 · O 44

### vérvételi asszisztens

`31-9097.00` · **ISCO-08 5329** Máshová nem sorolható személygondozási foglalkozásúak (egészségügyben) · **FEOR-08:** 5229 Egyéb személygondozási foglalkozású · ESCO `5329.2` · EN: Phlebotomists

*Piaci megnevezések (ESCO):* vérvétel végzője, fertőtlenítő sterilező, eszközfertőtlenítő technikus

A vérvételi asszisztensek a betegbiztonsági szabályokat betartva laboratóriumi vizsgálatok céljából vérmintákat vesznek a betegektől. A mintákat a szigorú orvosi utasításokat követve szállítják át a vizsgálatot végző laboratóriumba.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 45.5%-a jelölte

**Holland-kód:** RCI — R 74 · I 62 · A 0 · S 43 · E 7 · C 74

**HEXACO differenciál cél-profil:** O cél 31±18 (w=0.36) · H cél 64±21 (w=0.27) · A cél 58±24 (w=0.17) · X cél 44±26 (w=0.13)

**HEXACO abszolút szint:** H 60 · E 50 · X 47 · A 56 · C 52 · O 37

### tűzoltó

`33-2011.00` · **ISCO-08 5411** Tűzoltók · **FEOR-08:** 5252 Tűzoltó · ESCO `5411.1` · EN: Firefighters

*Piaci megnevezések (ESCO):* tűzoltósági referens, tűzoltó technikus

Tűz vagy más vészhelyzet esetén a tűzoltók feladata a katasztrófa elhárítása. A tűzoltók felügyelik a veszélyes helyszínek evakuálását, elvégik az áldozatok mentését, és gondoskodnak róla, hogy megfelelő, szakszerű ellátásban részesüljenek.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 35.9%-a jelölte

**Holland-kód:** RCS — R 92 · I 32 · A 5 · S 40 · E 34 · C 41

**HEXACO differenciál cél-profil:** A cél 68±18 (w=0.32) · E cél 36±21 (w=0.24) · O cél 39±22 (w=0.20) · X cél 56±26 (w=0.11)

**HEXACO abszolút szint:** H 64 · E 32 · X 63 · A 72 · C 59 · O 50

### rendőr

`33-3051.00` · **ISCO-08 5412** Rendőrök · **FEOR-08:** 5251 Rendőr · ESCO `5412.1` · EN: Police and Sheriff's Patrol Officers

*Piaci megnevezések (ESCO):* baleseti vizsgáló, nyomozókutya-vezető

A rendőrök nyomozati módszereket alkalmaznak a bűncselekmények megelőzésére, a bűnözők üldözésére és elfogására, valamint a lakosság erőszakos cselekményekkel és bűncselekményekkel szembeni védelmére.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 40.4%-a jelölte

**Holland-kód:** RCE — R 73 · I 29 · A 1 · S 41 · E 51 · C 56

**HEXACO differenciál cél-profil:** O cél 35±20 (w=0.33) · E cél 39±22 (w=0.24) · H cél 57±26 (w=0.14) · X cél 56±26 (w=0.14)

**HEXACO abszolút szint:** H 64 · E 35 · X 62 · A 63 · C 61 · O 45

### Biztonsági őrök

`13-1199.07` · **ISCO-08 5414** Biztonsági őrök · **FEOR-08:** 5254 Vagyonőr, testőr; 9231 Portás, telepőr, egyszerű őr · ESCO `5414.1.8` · EN: Security Management Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* biztonsági őr, parkőr, őr

A biztonsági őrök megfigyelik és felderítik a szabálytalanságokat, és védik az embereket, az épületeket és tárgyi eszközöket.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 65.0%-a jelölte

**Holland-kód:** CIR — R 48 · I 68 · A 11 · S 16 · E 46 · C 78

**HEXACO differenciál cél-profil:** A cél 39±23 (w=0.31) · O cél 56±26 (w=0.19) · H cél 44±26 (w=0.18) · C cél 54±27 (w=0.13)

**HEXACO abszolút szint:** H 52 · E 42 · X 58 · A 50 · C 64 · O 60

### Biztonsági őrök

`33-1091.00` · **ISCO-08 5414** Biztonsági őrök · **FEOR-08:** 5254 Vagyonőr, testőr; 9231 Portás, telepőr, egyszerű őr · ESCO `5414.1.9` · EN: First-Line Supervisors of Security Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* biztonsági őr, parkőr, őr

A biztonsági őrök megfigyelik és felderítik a szabálytalanságokat, és védik az embereket, az épületeket és tárgyi eszközöket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 29.8%-a jelölte

**Holland-kód:** ECR — R 56 · I 14 · A 0 · S 43 · E 82 · C 68

**HEXACO differenciál cél-profil:** O cél 38±22 (w=0.42) · X cél 59±24 (w=0.29) · A cél 53±28 (w=0.11)

**HEXACO abszolút szint:** H 58 · E 43 · X 62 · A 59 · C 59 · O 46

### biztonsági őr

`33-9032.00` · **ISCO-08 5414** Biztonsági őrök · **FEOR-08:** 5254 Vagyonőr, testőr; 9231 Portás, telepőr, egyszerű őr · ESCO `5414.1` · EN: Security Guards

*Piaci megnevezések (ESCO):* parkőr, őr

A biztonsági őrök megfigyelik és felderítik a szabálytalanságokat, és védik az embereket, az épületeket és tárgyi eszközöket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 79.3%-a jelölte

**Holland-kód:** RCE — R 90 · I 22 · A 0 · S 27 · E 31 · C 63

**HEXACO differenciál cél-profil:** O cél 34±19 (w=0.49) · H cél 57±26 (w=0.21) · E cél 46±27 (w=0.13) · C cél 54±27 (w=0.13)

**HEXACO abszolút szint:** H 52 · E 47 · X 49 · A 50 · C 54 · O 37


## 6 — Mezőgazdasági és erdőgazdálkodási foglalkozások

### Kertészek, kertészeti és faiskolai kertészek

`37-1012.00` · **ISCO-08 6113** Kertészek, kertészeti és faiskolai kertészek · **FEOR-08:** 6113 Zöldségtermesztő; 6115 Dísznövény-, virág- és faiskolai kertész, csemetenevelő · ESCO `6113.1` · EN: First-Line Supervisors of Landscaping, Lawn Service, and Groundskeeping Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* kertész-gondnok, szállodai gondnok, pályamester, kertészeti termeléssel foglalkozó egység vezetője, kertészeti termeléssel foglalkozó egység vezetői, kertészeti termesztés vezetője

A kertész-gondnokok tájrendezési- és gyepgondozási szolgáltatásokat nyújtanak magánháztartások, kereskedelmi és állami létesítmények, iskolák, szállodák, botanikus kertek, golfpályák, parkok és sportpályák gondozása érdekében.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 32.3%-a jelölte

**Holland-kód:** ECR — R 59 · I 13 · A 0 · S 34 · E 85 · C 71

**HEXACO differenciál cél-profil:** X cél 65±20 (w=0.50) · O cél 44±26 (w=0.18) · H cél 46±27 (w=0.15) · C cél 47±28 (w=0.10)

**HEXACO abszolút szint:** H 51 · E 48 · X 63 · A 54 · C 50 · O 49

### Kertészek, kertészeti és faiskolai kertészek

`37-3011.00` · **ISCO-08 6113** Kertészek, kertészeti és faiskolai kertészek · **FEOR-08:** 6113 Zöldségtermesztő; 6115 Dísznövény-, virág- és faiskolai kertész, csemetenevelő · ESCO `6113.1` · EN: Landscaping and Groundskeeping Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* kertész-gondnok, szállodai gondnok, pályamester, kertész, erdeitermés-gyűjtő, kertészeti kisegítő

A kertész-gondnokok tájrendezési- és gyepgondozási szolgáltatásokat nyújtanak magánháztartások, kereskedelmi és állami létesítmények, iskolák, szállodák, botanikus kertek, golfpályák, parkok és sportpályák gondozása érdekében.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 39.1%-a jelölte

**Holland-kód:** RCA — R 100 · I 10 · A 15 · S 8 · E 14 · C 39

**HEXACO differenciál cél-profil:** C cél 54±27 (w=0.45) · O cél 46±28 (w=0.38)

**HEXACO abszolút szint:** H 36 · E 60 · X 38 · A 38 · C 35 · O 38

### Kertészek, kertészeti és faiskolai kertészek

`45-2092.00` · **ISCO-08 6113** Kertészek, kertészeti és faiskolai kertészek · **FEOR-08:** 6113 Zöldségtermesztő; 6115 Dísznövény-, virág- és faiskolai kertész, csemetenevelő · ESCO `6113.2` · EN: Farmworkers and Laborers, Crop, Nursery, and Greenhouse · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* kertészeti termeléssel foglalkozó egység vezetője, kertészeti termeléssel foglalkozó egység vezetői, kertészeti termesztés vezetője, kertészeti termelési csoportvezető, kertészeti termelési csoportvezetők, kertészeti termelés csoportvezetője

A kertészeti termeléssel foglalkozó egységek vezetői megtervezik a termelési folyamatokat, irányítják a vállalkozást és részt vesznek a termelésben.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 39.0%-a jelölte

**Holland-kód:** RCE — R 100 · I 22 · A 5 · S 14 · E 23 · C 39

**HEXACO differenciál cél-profil:** O cél 44±26 (w=0.25) · H cél 56±26 (w=0.24) · C cél 55±27 (w=0.21) · E cél 47±28 (w=0.14)

**HEXACO abszolút szint:** H 44 · E 55 · X 40 · A 40 · C 40 · O 39


## 7 — Ipari és építőipari foglalkozások

### Falazókőművesek és hasonló foglalkozásúak

`47-2021.00` · **ISCO-08 7112** Falazókőművesek és hasonló foglalkozásúak · **FEOR-08:** 7511 Kőműves; 7537 Kályha- és kandallóépítő · ESCO `7112.1` · EN: Brickmasons and Blockmasons · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* épületfalazó kőműves, falazó kőműves, kőműves

Az épületfalazó kőművesek a téglafalakat és az építményeket úgy állítják össze, hogy a téglákat egy adott mintázatban rendezik el, és kötőanyaggal, például cementtel ragasztják össze.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 70.4%-a jelölte

**Holland-kód:** RCI — R 99 · I 17 · A 11 · S 2 · E 4 · C 47

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.32) · O cél 42±24 (w=0.30) · X cél 45±27 (w=0.18) · A cél 47±28 (w=0.11)

**HEXACO abszolút szint:** H 37 · E 58 · X 36 · A 36 · C 43 · O 36

### épületszobrász

`47-2022.00` · **ISCO-08 7113** Kőfaragók, -vágók és -törők · **FEOR-08:** 7536 Kőfaragó, műköves · ESCO `7113.1` · EN: Stonemasons

*Piaci megnevezések (ESCO):* sírkőkészítő, emlékműkészítő

Az épületszobrászok építkezési célokra felhasznált köveket faragják ki kézzel és illesztik azt össze. Bár a CNC-vel működtetett faragás a legelterjedtebb módszer, a kézműves díszkő faragása napjainkban is kézzel történik.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 57.9%-a jelölte

**Holland-kód:** RCA — R 100 · I 19 · A 32 · S 14 · E 5 · C 33

**HEXACO differenciál cél-profil:** C cél 63±22 (w=0.38) · O cél 42±25 (w=0.23) · A cél 44±26 (w=0.17) · X cél 45±27 (w=0.14)

**HEXACO abszolút szint:** H 36 · E 59 · X 36 · A 35 · C 46 · O 36

### betonozó

`47-2051.00` · **ISCO-08 7114** Betonozók, vasbetonszerelők és hasonló foglalkozásúak 7515 Építményszerkezet-szerelő · **FEOR-08:** — · ESCO `7114.1` · EN: Cement Masons and Concrete Finishers

*Piaci megnevezések (ESCO):* beton-összeillesztő kőműves, terrazzo-készítő, hidegburkoló, műkövező

A betonozók például cementből és betonból készült kötőanyagokkal dolgoznak. A betont eltávolítható formába öntik.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 51.7%-a jelölte

**Holland-kód:** RCI — R 100 · I 22 · A 11 · S 0 · E 0 · C 38

**HEXACO differenciál cél-profil:** O cél 41±24 (w=0.30) · C cél 58±25 (w=0.28) · E cél 45±27 (w=0.17) · H cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 36 · E 55 · X 39 · A 38 · C 43 · O 36

### ács

`47-2031.00` · **ISCO-08 7115** Ácsok és asztalosok · **FEOR-08:** 7513 Ács; 7514 Épületasztalos · ESCO `7115.1` · EN: Carpenters

*Piaci megnevezések (ESCO):* asztalos, ajtóbeépítő, épületasztalos, nyílászáró-beépítő, lépcsőszerelő, építményszerkezet-szerelő

Az ácsok feldarabolják, formára vágják és összeszerelik az épületek és egyéb építmények építésére szolgáló faelemeket. Műanyagot és fémet is felhasználnak építményeikhez.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 52.4%-a jelölte

**Holland-kód:** RCA — R 96 · I 15 · A 20 · S 15 · E 13 · C 41

**HEXACO differenciál cél-profil:** C cél 56±26 (w=0.32) · A cél 44±26 (w=0.30) · E cél 47±28 (w=0.15) · H cél 47±28 (w=0.14)

**HEXACO abszolút szint:** H 42 · E 53 · X 44 · A 40 · C 48 · O 45

### tetőfedő

`47-2181.00` · **ISCO-08 7121** Tetőfedők · **FEOR-08:** 7532 Tetőfedő · ESCO `7121.1` · EN: Roofers

*Piaci megnevezések (ESCO):* tetőkátrányozó, hullámlemeztető-fedő

A tetőfedők cseréppel fedik be a tetőszerkezeteket. Lapos vagy ferde súlytartó tetőelemeket építenek be, amelyeket időjárásálló réteggel fednek le.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 48.9%-a jelölte

**Holland-kód:** RCE — R 100 · I 5 · A 4 · S 8 · E 10 · C 42

**HEXACO differenciál cél-profil:** O cél 40±23 (w=0.29) · C cél 59±24 (w=0.26) · E cél 44±26 (w=0.18) · A cél 45±27 (w=0.14)

**HEXACO abszolút szint:** H 37 · E 53 · X 41 · A 38 · C 45 · O 36

### Burkolók

`47-2044.00` · **ISCO-08 7122** Burkolók · **FEOR-08:** 7534 Burkoló · ESCO `7122` · EN: Tile and Stone Setters · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* hidegburkoló, járólapozó, hidegfal- és padlóburkoló, fapadló- és parkettarakó, melegburkoló, fapadlórakó

_(HU leírás nincs; EN:)_ Apply hard tile, stone, and comparable materials to walls, floors, ceilings, countertops, and roof decks.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 48.0%-a jelölte

**Holland-kód:** RCA — R 100 · I 8 · A 26 · S 6 · E 0 · C 44

**HEXACO differenciál cél-profil:** C cél 61±23 (w=0.39) · O cél 44±26 (w=0.20) · X cél 46±28 (w=0.14) · A cél 46±28 (w=0.14)

**HEXACO abszolút szint:** H 34 · E 60 · X 36 · A 36 · C 43 · O 37

### födémpanel-elhelyező

`47-2081.00` · **ISCO-08 7123** Stukkó készítők (épületszobrászok) · **FEOR-08:** 7512 Gipszkartonozó, stukkózó · ESCO `7123.1` · EN: Drywall and Ceiling Tile Installers

*Piaci megnevezések (ESCO):* gipszkarton- és álmennyezet-szerelő, építményszerkezet-szerelő, vakoló kőműves, vakoló, vakoló munkás

A födémpanel-elhelyezők épületmennyezeteket építenek be.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 41.9%-a jelölte

**Holland-kód:** RCA — R 100 · I 16 · A 22 · S 3 · E 0 · C 36

**HEXACO differenciál cél-profil:** C cél 57±25 (w=0.31) · O cél 44±26 (w=0.25) · A cél 47±28 (w=0.14) · X cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 33 · E 60 · X 35 · A 34 · C 38 · O 35

### Üvegesek

`47-2121.00` · **ISCO-08 7125** Üvegesek · **FEOR-08:** 7538 Üvegező · ESCO `7125` · EN: Glaziers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* autóüvegező, szélvédő-javító, autóüveges, épületüvegező, tetőszerkezet-üvegező, üvegburkolat-készítő

_(HU leírás nincs; EN:)_ Install glass in windows, skylights, store fronts, and display cases, or on surfaces, such as building fronts, interior walls, ceilings, and tabletops.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 44.2%-a jelölte

**Holland-kód:** RCA — R 89 · I 18 · A 22 · S 11 · E 11 · C 43

**HEXACO differenciál cél-profil:** O cél 44±26 (w=0.27) · C cél 56±26 (w=0.25) · E cél 45±27 (w=0.21) · X cél 46±28 (w=0.15)

**HEXACO abszolút szint:** H 37 · E 55 · X 39 · A 40 · C 43 · O 38

### víz- és gázvezeték-szerelő

`47-2152.00` · **ISCO-08 7126** Víz-, gáz- és csővezeték-szerelők · **FEOR-08:** 7521 Vezeték- és csőhálózat-szerelő (víz, gáz, fűtés) · ESCO `7126.8` · EN: Plumbers, Pipefitters, and Steamfitters

*Piaci megnevezések (ESCO):* vízvezeték-szerelő, tűzvédelmi eszköz- és rendszerszerelő, tűzvédelmieszköz-szerelő

A víz- és gázvezeték-szerelők a víz-, gáz- és szennyvízelvezető rendszerek karbantartását és üzembe helyezését végzik. Rendszeresen átvizsgálják a csöveket és tartozékokat, amelyeket szükség szerint megjavítanak.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 43.3%-a jelölte

**Holland-kód:** RCI — R 100 · I 20 · A 0 · S 3 · E 0 · C 45

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.35) · O cél 45±27 (w=0.22) · A cél 45±27 (w=0.21) · E cél 48±28 (w=0.11)

**HEXACO abszolút szint:** H 43 · E 53 · X 44 · A 42 · C 50 · O 43

### Légkondicionáló- és hűtőberendezés-szerelők

`49-9021.00` · **ISCO-08 7127** Légkondicionáló- és hűtőberendezés-szerelők · **FEOR-08:** 7522 Szellőző-, hűtő- és klimatizálóberendezés-szerelő · ESCO `7127` · EN: Heating, Air Conditioning, and Refrigeration Mechanics and Installers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szellőző-, hűtő- és klimatizálóberendezés-szerelő, szellőzőberendezés-szerelő, klímaműszerész

_(HU leírás nincs; EN:)_ Install or repair heating, central air conditioning, HVAC, or refrigeration systems, including oil burners, hot-air furnaces, and heating stoves.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 68.1%-a jelölte

**Holland-kód:** RCI — R 99 · I 30 · A 1 · S 8 · E 3 · C 55

**HEXACO differenciál cél-profil:** C cél 57±26 (w=0.36) · O cél 45±27 (w=0.28) · X cél 48±28 (w=0.14) · E cél 48±29 (w=0.11)

**HEXACO abszolút szint:** H 47 · E 51 · X 45 · A 46 · C 53 · O 44

### Festők és hasonló foglalkozásúak

`47-2082.00` · **ISCO-08 7131** Festők és hasonló foglalkozásúak · **FEOR-08:** 7535 Festő és mázoló · ESCO `7131` · EN: Tapers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Seal joints between plasterboard or other wallboard to prepare wall surface for painting or papering.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 45.7%-a jelölte

**Holland-kód:** RCA — R 92 · I 11 · A 12 · S 8 · E 1 · C 41

**HEXACO differenciál cél-profil:** O cél 40±24 (w=0.36) · C cél 59±24 (w=0.32) · A cél 45±27 (w=0.19)

**HEXACO abszolút szint:** H 30 · E 65 · X 32 · A 29 · C 35 · O 30

### Festők és hasonló foglalkozásúak

`51-9123.00` · **ISCO-08 7131** Festők és hasonló foglalkozásúak · **FEOR-08:** 7535 Festő és mázoló · ESCO `7131` · EN: Painting, Coating, and Decorating Workers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Paint, coat, or decorate articles, such as furniture, glass, plateware, pottery, jewelry, toys, books, or leather.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 59.0%-a jelölte

**Holland-kód:** RAC — R 99 · I 6 · A 40 · S 10 · E 0 · C 40

**HEXACO differenciál cél-profil:** A cél 43±26 (w=0.34) · C cél 55±27 (w=0.23) · H cél 47±28 (w=0.15) · X cél 48±28 (w=0.11)

**HEXACO abszolút szint:** H 32 · E 62 · X 36 · A 32 · C 35 · O 41

### festő és mázoló

`47-2141.00` · **ISCO-08 7131** Festők és hasonló foglalkozásúak · **FEOR-08:** 7535 Festő és mázoló · ESCO `7131.1` · EN: Painters, Construction and Maintenance

*Piaci megnevezések (ESCO):* építőipari festő, szobafestő, tapétázó, falkárpitozó

A festő és mázolók az épületek és más szerkezetek belsejét és külsejét festik. Használhatnak szabványos latex alapú festékeket vagy speciális festékeket a dekoratív hatás vagy védőtulajdonságok eléréséhez.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 48.7%-a jelölte

**Holland-kód:** RCA — R 100 · I 8 · A 25 · S 4 · E 0 · C 42

**HEXACO differenciál cél-profil:** C cél 55±26 (w=0.31) · O cél 47±28 (w=0.19) · X cél 48±28 (w=0.14) · E cél 48±28 (w=0.13)

**HEXACO abszolút szint:** H 36 · E 58 · X 38 · A 38 · C 39 · O 39

### Felületkezelők, fényezők

`51-9124.00` · **ISCO-08 7132** Felületkezelők, fényezők · **FEOR-08:** 7327 Festékszóró, fényező · ESCO `7132.2` · EN: Coating, Painting, and Spraying Machine Setters, Operators, and Tenders · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* korrózióvédelmi festő, fémfestő, fémmázoló, fémsavazó, festékszóró, fényező, felületlakkozó, polírozó

A korrózióvédelmi festők a korrózió elleni védelem érdekében vegyszereket és festéket visznek fel az anyagok felületére. Kiszámítják a felületvédelemhez szükséges anyagok mennyiségét.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 62.7%-a jelölte

**Holland-kód:** RCA — R 100 · I 8 · A 18 · S 4 · E 1 · C 44

**HEXACO differenciál cél-profil:** C cél 56±26 (w=0.31) · X cél 46±27 (w=0.20) · A cél 46±28 (w=0.17) · O cél 47±28 (w=0.15)

**HEXACO abszolút szint:** H 35 · E 59 · X 36 · A 35 · C 39 · O 38

### Épületszerkezet-tisztítók

`47-4041.00` · **ISCO-08 7133** Épületszerkezet-tisztítók · **FEOR-08:** 7915 Kéményseprő, épületszerkezet-tisztító · ESCO `7133.1` · EN: Hazardous Materials Removal Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* azbesztmentesítő, azbesztmentesítő szakember, azbesztmentesítő munkás, környezetvédelmi munkás

Az azbesztmentesítők a veszélyes anyagok kezelésére vonatkozó egészség- és biztonságvédelmi előírásoknak megfelelően eltávolítják az azbesztet az épületekből és egyéb építményekből.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 26.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 26 · A 0 · S 8 · E 3 · C 56

**HEXACO differenciál cél-profil:** X cél 37±21 (w=0.25) · O cél 40±23 (w=0.20) · E cél 40±24 (w=0.19) · C cél 59±24 (w=0.18)

**HEXACO abszolút szint:** H 50 · E 46 · X 38 · A 48 · C 55 · O 39

### Fém öntőminta- és magkészítők

`51-4072.00` · **ISCO-08 7211** Fém öntőminta- és magkészítők · **FEOR-08:** 7310 Fémöntőminta-készítő · ESCO `7211.1.1` · EN: Molding, Coremaking, and Casting Machine Setters, Operators, and Tenders, Metal and Plastic · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* öntő, folyamatos öntő, kokilla- és nyomásos öntő

Az öntők öntödei kézi vezérlésű berendezések működtetésével öntvényeket, például csöveket, üreges profilokat és egyéb kohászati termékeket készítenek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 57.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 21 · A 6 · S 1 · E 1 · C 55

**HEXACO differenciál cél-profil:** C cél 58±24 (w=0.30) · O cél 42±25 (w=0.26) · X cél 45±27 (w=0.18)

**HEXACO abszolút szint:** H 35 · E 58 · X 35 · A 36 · C 42 · O 35

### Hegesztők és lángvágók

`51-4121.00` · **ISCO-08 7212** Hegesztők és lángvágók · **FEOR-08:** 7325 Hegesztő, lángvágó · ESCO `7212.2` · EN: Welders, Cutters, Solderers, and Brazers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* lágyforrasztó, hegesztő, lángvágó, elektromosív-hegesztő, hegesztő, repülőgép-hegesztő, keményforrasztó

A lágyforrasztók különféle berendezéseket és gépeket, például gázfáklyákat, forrasztópákákat, hegesztőgépeket vagy elektromos-ultrahangos berendezéseket működtetnek, hogy két vagy több (általában fém) munkadarabot olvasztással és fém töltőanyag létrehozásával összeforrasszanak az illesztések között; a fém töltőanyag olvadáspontja alacsonyabb, mint a szomszédos fémé.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 53.5%-a jelölte

**Holland-kód:** RCI — R 100 · I 18 · A 7 · S 1 · E 9 · C 44

**HEXACO differenciál cél-profil:** C cél 60±24 (w=0.31) · A cél 44±26 (w=0.21) · X cél 45±27 (w=0.17) · H cél 46±28 (w=0.12)

**HEXACO abszolút szint:** H 36 · E 56 · X 37 · A 36 · C 46 · O 40

### lemezlakatos

`47-2211.00` · **ISCO-08 7213** Fémlemez-megmunkálók · **FEOR-08:** 7533 Épület-, építménybádogos · ESCO `7213.4` · EN: Sheet Metal Workers

*Piaci megnevezések (ESCO):* vas- és fémszerkezeti lakatos, épületszerkezet-lakatos, kazánkészítő, kazánkovács, rézműves

Az építőipari lemezlakatosok fémlemez használatával tetőt, fűtőcsöveket, szellőzőcsöveket és légkondicionálócsöveket, valamint ereszcsatornákat és egyéb fémszerkezeteket készítenek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 49.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 18 · A 9 · S 0 · E 0 · C 43

**HEXACO differenciál cél-profil:** C cél 56±26 (w=0.34) · H cél 45±27 (w=0.26) · A cél 46±28 (w=0.21) · E cél 48±28 (w=0.13)

**HEXACO abszolút szint:** H 40 · E 54 · X 43 · A 41 · C 45 · O 44

### Fémszerkezet-készítők és -összeállítók

`51-2041.00` · **ISCO-08 7214** Fémszerkezet-készítők és -összeállítók · **FEOR-08:** 7321 Lakatos · ESCO `7214.3` · EN: Structural Metal Fabricators and Fitters · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* vas- és fémszerkezeti lakatos, vasszerkezeti lakatos

A vas- és fémszerkezeti lakatosok vaselemeket építenek be különféle felépítményekbe. Acélszerkezeteket készítenek épületekhez, hidakhoz és egyéb építési projektekhez, emellett fémrudak vagy betonacél rudak rögzítésével vasbetont készítenek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 76.7%-a jelölte

**Holland-kód:** RCI — R 100 · I 27 · A 12 · S 0 · E 2 · C 48

**HEXACO differenciál cél-profil:** C cél 60±23 (w=0.35) · X cél 44±26 (w=0.20) · O cél 45±27 (w=0.18) · A cél 45±27 (w=0.17)

**HEXACO abszolút szint:** H 36 · E 58 · X 36 · A 36 · C 46 · O 39

### Állványozók, rakományrögzítők és tartószerkezetek szerelői

`49-9044.00` · **ISCO-08 7215** Állványozók, rakományrögzítők és tartószerkezetek szerelői · **FEOR-08:** 7328 Fém- és egyéb tartószerkezet-szerelő · ESCO `7215.2` · EN: Millwrights · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* darukötöző, darukezelő, daruzó

A darukötözők nehéz tárgyak emelésére szakosodtak, amit gyakran daru vagy árbócdaru segítségével végeznek. Darukezelőkkel együtt dolgozva rögzítik és leválasztják a daruról a rakományt.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 45.5%-a jelölte

**Holland-kód:** RCI — R 100 · I 28 · A 10 · S 0 · E 2 · C 44

**HEXACO differenciál cél-profil:** C cél 60±24 (w=0.35) · H cél 44±26 (w=0.24) · A cél 46±27 (w=0.17) · O cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 39 · E 54 · X 43 · A 41 · C 51 · O 43

### Kovácsok

`51-4022.00` · **ISCO-08 7221** Kovácsok · **FEOR-08:** 7326 Kovács 8. · ESCO `7221.2` · EN: Forging Machine Setters, Operators, and Tenders, Metal and Plastic · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* süllyesztékes kovácsoló gép kezelője, kovácsológép-kezelő, gépi kovács, hidraulikus kovácssajtó kezelője, hengerlőkovács, kovácssajtó kezelője

A süllyesztékes kovácsoló gép kezelői fémmegmunkáló gépeket és berendezéseket, valamint speciálisan kialakított süllyesztékeket használnak vasfémek és nemvasfémek kívánt formára történő alakítására.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 82.3%-a jelölte

**Holland-kód:** RCI — R 96 · I 27 · A 0 · S 0 · E 3 · C 56

**HEXACO differenciál cél-profil:** C cél 60±23 (w=0.31) · X cél 44±26 (w=0.19) · O cél 44±26 (w=0.19) · A cél 46±27 (w=0.13)

**HEXACO abszolút szint:** H 36 · E 57 · X 36 · A 36 · C 45 · O 37

### lakatos és zárszerelő

`49-9094.00` · **ISCO-08 7222** Szerszámkészítők és hasonló foglalkozásúak · **FEOR-08:** 7321 Lakatos; 7322 Szerszámkészítő · ESCO `7222.3` · EN: Locksmiths and Safe Repairers

*Piaci megnevezések (ESCO):* zárszerelő, kulcskészítő, szerszámkészítő, fémipari eszközgyártó, szerszámmegmunkáló

A lakatos és zárszerelők speciális szerszámok segítségével mechanikus és elektronikus zárrendszereket építenek be és javítanak. Kulcsot másolnak vásárlóik számára, és váratlan meghibásodás esetén zárakat törnek fel.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 61.5%-a jelölte

**Holland-kód:** RCI — R 85 · I 18 · A 0 · S 10 · E 7 · C 67

**HEXACO differenciál cél-profil:** H cél 61±23 (w=0.28) · A cél 42±24 (w=0.22) · C cél 58±25 (w=0.20) · X cél 44±26 (w=0.16)

**HEXACO abszolút szint:** H 52 · E 56 · X 41 · A 40 · C 52 · O 45

### szerszámkészítő

`51-4111.00` · **ISCO-08 7222** Szerszámkészítők és hasonló foglalkozásúak · **FEOR-08:** 7321 Lakatos; 7322 Szerszámkészítő · ESCO `7222.5` · EN: Tool and Die Makers

*Piaci megnevezések (ESCO):* fémipari eszközgyártó, szerszámmegmunkáló, öntőminta-készítő, mintakészítő, kokillakészítő

A szerszámkészítők olyan különféle berendezéseket és gépeket működtetnek, amelyek a gyártás számos területén felhasználandó fémszerszámok és öntőformák készítésére szolgálnak, a gyártási folyamat minden szakaszát érintve.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 40.9%-a jelölte

**Holland-kód:** RCI — R 99 · I 33 · A 15 · S 0 · E 0 · C 53

**HEXACO differenciál cél-profil:** C cél 64±21 (w=0.30) · A cél 38±22 (w=0.24) · H cél 42±25 (w=0.17) · X cél 43±25 (w=0.15)

**HEXACO abszolút szint:** H 38 · E 57 · X 39 · A 37 · C 56 · O 49

### CNC-gépkezelő

`51-4034.00` · **ISCO-08 7223** Fémmegmunkálógép-beállítók és -üzemeltetők · **FEOR-08:** 7323 Forgácsoló · ESCO `7223.4.4` · EN: Lathe and Turning Machine Tool Setters, Operators, and Tenders, Metal and Plastic

*Piaci megnevezések (ESCO):* CNC-esztergályos, CNC-programozó, gyalus, forgácsoló, gépi forgácsoló, csavareszterga-kezelő

A CNC-gépkezelők termékrendelések végrehajtása érdekében üzembe helyezik, karbantartják és vezérlik a számítógépvezérlésű gépeket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 31.6%-a jelölte

**Holland-kód:** RCI — R 100 · I 19 · A 0 · S 0 · E 0 · C 56

**HEXACO differenciál cél-profil:** C cél 61±23 (w=0.35) · X cél 44±26 (w=0.22) · A cél 45±26 (w=0.17) · O cél 46±28 (w=0.12)

**HEXACO abszolút szint:** H 34 · E 59 · X 35 · A 35 · C 45 · O 39

### Fémmegmunkálógép-beállítók és -üzemeltetők

`51-4031.00` · **ISCO-08 7223** Fémmegmunkálógép-beállítók és -üzemeltetők · **FEOR-08:** 7323 Forgácsoló · ESCO `7223` · EN: Cutting, Punching, and Press Machine Setters, Operators, and Tenders, Metal and Plastic · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* CNC-gépkezelő, CNC-esztergályos, CNC-programozó, lemezkivágó gép kezelője, forgácsoló, gép forgácsoló

_(HU leírás nincs; EN:)_ Set up, operate, or tend machines to saw, cut, shear, slit, punch, crimp, notch, bend, or straighten metal or plastic material.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 63.4%-a jelölte

**Holland-kód:** RCI — R 98 · I 20 · A 1 · S 0 · E 0 · C 55

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.31) · O cél 42±25 (w=0.26) · X cél 44±26 (w=0.19) · A cél 45±27 (w=0.17)

**HEXACO abszolút szint:** H 34 · E 60 · X 34 · A 34 · C 41 · O 34

### Fémmegmunkálógép-beállítók és -üzemeltetők

`51-4032.00` · **ISCO-08 7223** Fémmegmunkálógép-beállítók és -üzemeltetők · **FEOR-08:** 7323 Forgácsoló · ESCO `7223` · EN: Drilling and Boring Machine Tool Setters, Operators, and Tenders, Metal and Plastic · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* furatbővítő gép kezelője, fúrógépkezelő, gépi forgácsoló, fúrós, CNC-gépkezelő, lemezkivágó gép kezelője

_(HU leírás nincs; EN:)_ Set up, operate, or tend drilling machines to drill, bore, ream, mill, or countersink metal or plastic work pieces.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 56.9%-a jelölte

**Holland-kód:** RCI — R 100 · I 29 · A 0 · S 0 · E 0 · C 54

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.34) · A cél 44±26 (w=0.22) · X cél 45±27 (w=0.17) · O cél 46±27 (w=0.16)

**HEXACO abszolút szint:** H 35 · E 60 · X 36 · A 34 · C 43 · O 38

### Fémmegmunkálógép-beállítók és -üzemeltetők

`51-4081.00` · **ISCO-08 7223** Fémmegmunkálógép-beállítók és -üzemeltetők · **FEOR-08:** 7323 Forgácsoló · ESCO `7223` · EN: Multiple Machine Tool Setters, Operators, and Tenders, Metal and Plastic · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* lemezkivágó gép kezelője, forgácsoló, gép forgácsoló, csavareszterga-kezelő, egyengetőgép kezelője, kovácsprés kezelője

_(HU leírás nincs; EN:)_ Set up, operate, or tend more than one type of cutting or forming machine tool or robot.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 81.7%-a jelölte

**Holland-kód:** RCI — R 100 · I 21 · A 0 · S 1 · E 0 · C 60

**HEXACO differenciál cél-profil:** C cél 60±24 (w=0.36) · H cél 44±26 (w=0.20) · X cél 45±27 (w=0.17) · A cél 47±28 (w=0.11)

**HEXACO abszolút szint:** H 36 · E 56 · X 38 · A 39 · C 48 · O 42

### Fémmegmunkálógép-beállítók és -üzemeltetők

`51-9161.00` · **ISCO-08 7223** Fémmegmunkálógép-beállítók és -üzemeltetők · **FEOR-08:** 7323 Forgácsoló · ESCO `7223.4` · EN: Computer Numerically Controlled Tool Operators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* CNC-gépkezelő, CNC-esztergályos, CNC-programozó, gyalus, forgácsoló, gépi forgácsoló

A CNC-gépkezelők termékrendelések végrehajtása érdekében üzembe helyezik, karbantartják és vezérlik a számítógépvezérlésű gépeket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 48.2%-a jelölte

**Holland-kód:** RCI — R 91 · I 31 · A 3 · S 0 · E 6 · C 73

**HEXACO differenciál cél-profil:** C cél 57±25 (w=0.30) · A cél 45±27 (w=0.21) · H cél 45±27 (w=0.20) · X cél 46±27 (w=0.17)

**HEXACO abszolút szint:** H 36 · E 56 · X 38 · A 37 · C 44 · O 43

### menethengerlő gép kezelője

`51-4023.00` · **ISCO-08 7223** Fémmegmunkálógép-beállítók és -üzemeltetők · **FEOR-08:** 7323 Forgácsoló · ESCO `7223.24` · EN: Rolling Machine Setters, Operators, and Tenders, Metal and Plastic

*Piaci megnevezések (ESCO):* brikettáló gép kezelője, brikettálógép-kezelő, egyengetőgép kezelője, kovácsprés kezelője, zömítőprés kezelője

A menethengerlő gép kezelői üzembe helyezik és kezelik a menethengerlő gépeket, amelyek fém munkadarabok külső és belső meneteit alakítják ki olyan módon, hogy a menethengerlő formát a fémlemezrudakhoz préselik, az eredeti munkadarabénál nagyobb átmérőt létrehozva.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 74.2%-a jelölte

**Holland-kód:** RCI — R 96 · I 11 · A 0 · S 0 · E 0 · C 49

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.34) · O cél 43±25 (w=0.26) · H cél 45±27 (w=0.18) · A cél 47±28 (w=0.11)

**HEXACO abszolút szint:** H 35 · E 59 · X 39 · A 37 · C 45 · O 37

### sebességváltó-szerelő

`51-4041.00` · **ISCO-08 7223** Fémmegmunkálógép-beállítók és -üzemeltetők · **FEOR-08:** 7323 Forgácsoló · ESCO `7223.8` · EN: Machinists

*Piaci megnevezések (ESCO):* mechatronikai szerelő, autóvillamossági szerelő, gyalus, forgácsoló, gépi forgácsoló, csavareszterga-kezelő

A sebességváltó-szerelők precíziós alkatrészeket készítenek sebességváltókhoz és egyéb meghajtóelemekhez. Különféle szerszámgépekkel dolgoznak.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 35.9%-a jelölte

**Holland-kód:** RCI — R 100 · I 45 · A 16 · S 3 · E 4 · C 57

**HEXACO differenciál cél-profil:** C cél 62±22 (w=0.38) · A cél 42±24 (w=0.25) · X cél 43±25 (w=0.21) · H cél 46±27 (w=0.13)

**HEXACO abszolút szint:** H 40 · E 55 · X 40 · A 39 · C 55 · O 46

### Fémcsiszolók, köszörűsök és szerszámköszörűsök

`51-4033.00` · **ISCO-08 7224** Fémcsiszolók, köszörűsök és szerszámköszörűsök · **FEOR-08:** 7324 Fémcsiszoló, köszörűs, szerszámköszörűs · ESCO `7224.1` · EN: Grinding, Lapping, Polishing, and Buffing Machine Tool Setters, Operators, and Tenders, Metal and Plastic · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* fémcsiszoló, fémfelület-kezelő, szerszámköszörűs, köszörűs, köszörűgép-beállító és kezelő

A fémcsiszolók fémmegmunkáló berendezéseket és gépeket használnak a majdnem kész fémdarabok csiszolására annak érdekében, hogy simábbá és tetszetősebbé tegyék őket, valamint hogy eltávolítsák az oxidálódott részeket, megtisztítva a fémet a többi megmunkálási folyamat után.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 80.1%-a jelölte

**Holland-kód:** RCI — R 100 · I 19 · A 3 · S 0 · E 0 · C 48

**HEXACO differenciál cél-profil:** C cél 60±23 (w=0.34) · A cél 42±24 (w=0.28) · O cél 44±26 (w=0.21) · X cél 46±27 (w=0.14)

**HEXACO abszolút szint:** H 36 · E 60 · X 36 · A 32 · C 43 · O 36

### Gépjárműszerelők és -karbantartók

`49-3021.00` · **ISCO-08 7231** Gépjárműszerelők és -karbantartók · **FEOR-08:** 7331 Gépjármű- és motorkarbantartó, -javító · ESCO `7231.10` · EN: Automotive Body and Related Repairers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gépjármű-karbantartó és -javító, autóbusz-szerelő, kamionszerelő, karosszérialakatos, autókarosszéria-lakatos, járműfelújító technikus

A gépjármű-karbantartó és -javítók ellenőrzik, tesztelik és karbantartják a járműveket és a motorkerékpárokat, emellett elvégzik a motorbeállításokat és a gumiabroncsok cseréjét.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 42.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 10 · A 7 · S 1 · E 8 · C 39

**HEXACO differenciál cél-profil:** C cél 57±25 (w=0.30) · X cél 45±27 (w=0.22) · A cél 45±27 (w=0.21) · E cél 46±28 (w=0.16)

**HEXACO abszolút szint:** H 41 · E 54 · X 39 · A 38 · C 45 · O 42

### Gépjárműszerelők és -karbantartók

`49-3093.00` · **ISCO-08 7231** Gépjárműszerelők és -karbantartók · **FEOR-08:** 7331 Gépjármű- és motorkarbantartó, -javító · ESCO `7231` · EN: Tire Repairers and Changers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gumijavító és centírozó

_(HU leírás nincs; EN:)_ Repair and replace tires.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 41.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 13 · A 0 · S 13 · E 10 · C 40

**HEXACO differenciál cél-profil:** O cél 42±25 (w=0.34) · C cél 55±27 (w=0.21) · H cél 53±28 (w=0.15) · X cél 47±28 (w=0.13)

**HEXACO abszolút szint:** H 38 · E 59 · X 36 · A 36 · C 37 · O 35

### dízelmotor-szerelő

`49-3031.00` · **ISCO-08 7231** Gépjárműszerelők és -karbantartók · **FEOR-08:** 7331 Gépjármű- és motorkarbantartó, -javító · ESCO `7231.3` · EN: Bus and Truck Mechanics and Diesel Engine Specialists

*Piaci megnevezések (ESCO):* gépjárműipari féktechnikus, gépjármű-karbantartó és -javító, autóbusz-szerelő, kamionszerelő, járműfelújító technikus, autótechnikus

A dízelmotor-szerelők a dízelmotorok javításával és karbantartásával foglalkoznak.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 39.5%-a jelölte

**Holland-kód:** RCI — R 100 · I 38 · A 0 · S 9 · E 5 · C 46

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.27) · A cél 43±25 (w=0.23) · X cél 44±26 (w=0.20) · H cél 46±28 (w=0.12)

**HEXACO abszolút szint:** H 41 · E 53 · X 40 · A 40 · C 50 · O 48

### gépjárműipari féktechnikus

`49-3023.00` · **ISCO-08 7231** Gépjárműszerelők és -karbantartók · **FEOR-08:** 7331 Gépjármű- és motorkarbantartó, -javító · ESCO `7231.1` · EN: Automotive Service Technicians and Mechanics

*Piaci megnevezések (ESCO):* gépjármű-karbantartó és -javító, autóbusz-szerelő, kamionszerelő, járműfelújító technikus, autótechnikus, autószerelő

A gépjárműipari féktechnikusok ellenőrzik, szervizelik, diagnosztizálják és megjavítják a fék-, kormány- és felfüggesztési rendszereket, valamint a kerekeket és az abroncsokat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 50.2%-a jelölte

**Holland-kód:** RCI — R 100 · I 43 · A 0 · S 8 · E 10 · C 55

**HEXACO differenciál cél-profil:** X cél 41±24 (w=0.38) · O cél 56±26 (w=0.22) · A cél 46±27 (w=0.16) · C cél 54±27 (w=0.16)

**HEXACO abszolút szint:** H 46 · E 52 · X 41 · A 43 · C 49 · O 51

### légi közlekedési karbantartó technikus

`49-3011.00` · **ISCO-08 7232** Légijármű szerelők és -karbantartók · **FEOR-08:** 7332 Repülőgépmotor-karbantartó, -javító · ESCO `7232.5` · EN: Aircraft Mechanics and Service Technicians

*Piaci megnevezések (ESCO):* repülőgép-szerelő, repülőgépmotor-karbantartó, javító, gázturbináshajtómű-technikus, gázturbinás sugárhajtómű technikus, repülőgépmotor-szerelő, repülőgépmotor-karbantartó

A légi közlekedési karbantartó technikusok megelőző karbantartást végeznek a légi járműveken, a légi járművek alkatrészein, a hajtóműveken és a részegységeken, például a repülőgépvázakon, valamint a hidraulikus és pneumatikus rendszereken.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 66.2%-a jelölte

**Holland-kód:** RCI — R 95 · I 47 · A 0 · S 5 · E 14 · C 62

**HEXACO differenciál cél-profil:** X cél 40±23 (w=0.30) · C cél 59±24 (w=0.28) · E cél 46±27 (w=0.13) · A cél 46±27 (w=0.12)

**HEXACO abszolút szint:** H 51 · E 47 · X 43 · A 46 · C 59 · O 48

### Mezőgazdasági és iparigép szerelők és -karbantartók

`49-9043.00` · **ISCO-08 7233** Mezőgazdasági és iparigép szerelők és -karbantartók · **FEOR-08:** 7333 Mezőgazdasági és ipari gép (motor) karbantartója, javítója; 7334 Mechanikaigép-karbantartó, -javító (műszerész) · ESCO `7233.15` · EN: Maintenance Workers, Machinery · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* építőipari gépszerelő, építőipari gépjavító, ipari gép karbantartója, javítója, textil- és ruhaiparigép-szerelő, textiliparigép-szerelő, ruhaiparigép-szerelő

Az építőipari gépszerelők ellenőrzik, karbantartják és szervizelik az építőiparban, erdőgazdálkodásban és a földmunkák során használt nehéz tehergépjárműveket, például buldózereket, kotrókat és kombájnokat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 54.1%-a jelölte

**Holland-kód:** RCI — R 100 · I 17 · A 0 · S 0 · E 3 · C 54

**HEXACO differenciál cél-profil:** C cél 58±24 (w=0.35) · X cél 45±27 (w=0.20) · O cél 46±27 (w=0.17) · H cél 47±28 (w=0.14)

**HEXACO abszolút szint:** H 38 · E 56 · X 38 · A 40 · C 46 · O 40

### ipari gép karbantartója, javítója

`49-9041.00` · **ISCO-08 7233** Mezőgazdasági és iparigép szerelők és -karbantartók · **FEOR-08:** 7333 Mezőgazdasági és ipari gép (motor) karbantartója, javítója; 7334 Mechanikaigép-karbantartó, -javító (műszerész) · ESCO `7233.7` · EN: Industrial Machinery Mechanics

*Piaci megnevezések (ESCO):* öntödei gépésztechnikus, öntödei gépszerelő, öntödei géplakatos, textil- és ruhaiparigép-szerelő, textiliparigép-szerelő, ruhaiparigép-szerelő

Az ipari gép karbantartója, javítója új és használatban lévő gépekkel foglalkozik.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 47.2%-a jelölte

**Holland-kód:** RCI — R 100 · I 34 · A 0 · S 0 · E 3 · C 56

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.34) · A cél 43±25 (w=0.26) · X cél 45±26 (w=0.20)

**HEXACO abszolút szint:** H 43 · E 52 · X 42 · A 41 · C 53 · O 47

### öntödei gépésztechnikus

`49-3042.00` · **ISCO-08 7233** Mezőgazdasági és iparigép szerelők és -karbantartók · **FEOR-08:** 7333 Mezőgazdasági és ipari gép (motor) karbantartója, javítója; 7334 Mechanikaigép-karbantartó, -javító (műszerész) · ESCO `7233.11` · EN: Mobile Heavy Equipment Mechanics, Except Engines

*Piaci megnevezések (ESCO):* öntödei gépszerelő, öntödei géplakatos, textil- és ruhaiparigép-szerelő, textiliparigép-szerelő, ruhaiparigép-szerelő, építőipari gépszerelő

Az öntödei gépésztechnikusok műanyagok és más anyagok öntésében és formázásában vesznek részt. Kalibrálják a berendezéseket, elvégzik a karbantartási tevékenységeket, megvizsgálják a késztermékeket, és kijavítják a hibákat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 54.6%-a jelölte

**Holland-kód:** RCI — R 100 · I 42 · A 0 · S 0 · E 0 · C 56

**HEXACO differenciál cél-profil:** A cél 40±23 (w=0.30) · C cél 59±24 (w=0.27) · X cél 44±26 (w=0.17) · O cél 54±27 (w=0.12)

**HEXACO abszolút szint:** H 44 · E 52 · X 42 · A 39 · C 53 · O 50

### Precíziósműszer-gyártók és -javítók

`49-9062.00` · **ISCO-08 7311** Precíziósműszer-gyártók és -javítók · **FEOR-08:** 7420 Finommechanikai műszerész · ESCO `7311.3` · EN: Medical Equipment Repairers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* optikai műszerész, orvosi műszerész

Az optikai műszerészek optikai műszereket, például mikroszkópokat, távcsöveket, kameraoptikákat és iránytűket javítanak. Tesztelik a műszereket, hogy megfelelően működjenek.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 39.3%-a jelölte

**Holland-kód:** RCI — R 100 · I 60 · A 0 · S 16 · E 0 · C 63

**HEXACO differenciál cél-profil:** X cél 40±23 (w=0.32) · O cél 58±25 (w=0.24) · A cél 45±27 (w=0.16) · C cél 55±27 (w=0.15)

**HEXACO abszolút szint:** H 53 · E 50 · X 45 · A 48 · C 57 · O 56

### Fazekasok és hasonló kézművesek

`51-9195.00` · **ISCO-08 7314** Fazekasok és hasonló kézművesek · **FEOR-08:** 7413 Keramikus · ESCO `7314.1` · EN: Molders, Shapers, and Casters, Except Metal and Plastic · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* téglakészítő, cserép-és téglavető, téglaöntő, keramikus, kerámiaformázó, korongozó/mfn

A téglakészítők egyedi téglákat, csöveket és egyéb hőálló termékeket készítenek kézi öntőszerszámok segítségével. Az előírásoknak megfelelően formákat készítenek, megtisztítják és kiolajozzák őket, majd beleteszik és eltávolítják a masszát az öntőformából.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: —

**Holland-kód:** RCI — R 94 · I 21 · A 19 · S 0 · E 0 · C 55

**HEXACO differenciál cél-profil:** A cél 44±26 (w=0.32) · C cél 56±26 (w=0.30) · O cél 47±28 (w=0.18)

**HEXACO abszolút szint:** H 33 · E 64 · X 34 · A 31 · C 34 · O 36

### flexonyomdagép-kezelő

`51-5112.00` · **ISCO-08 7322** Nyomdászok · **FEOR-08:** 7232 Nyomdász, nyomdai gépmester · ESCO `7322.2` · EN: Printing Press Operators

*Piaci megnevezések (ESCO):* nyomdász, flexográfus, mélynyomógép-kezelő, flexonyomógép-kezelő, nyomógép-kezelő, dombornyomógép-kezelő

A flexonyomdagép-kezelők flexográfiai lemezeket használnak, amellyel szinte bármilyen anyagra lehet nyomtatni. A dombornyomatra tintát öntenek, és rányomják az anyagra.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 73.2%-a jelölte

**Holland-kód:** CRE — R 63 · I 3 · A 12 · S 12 · E 13 · C 74

**HEXACO differenciál cél-profil:** C cél 60±23 (w=0.32) · H cél 44±26 (w=0.19) · O cél 44±26 (w=0.17) · X cél 45±27 (w=0.16)

**HEXACO abszolút szint:** H 34 · E 58 · X 36 · A 37 · C 46 · O 38

### villanyszerelő

`47-2111.00` · **ISCO-08 7411** Építőipari villanyszerelők és hasonló foglalkozásúak · **FEOR-08:** 7524 Épületvillamossági szerelő, villanyszerelő · ESCO `7411.1` · EN: Electricians

*Piaci megnevezések (ESCO):* villamosmérnök

A villanyszerelők elektromos áramköröket és huzalozási rendszereket szerelnek fel és javítanak. Emellett telepítik és karbantartják az elektromos berendezéseket és gépeket.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 61.7%-a jelölte

**Holland-kód:** RCI — R 100 · I 28 · A 4 · S 5 · E 14 · C 52

**HEXACO differenciál cél-profil:** C cél 57±26 (w=0.37) · A cél 46±27 (w=0.24) · O cél 47±28 (w=0.17) · H cél 48±29 (w=0.12)

**HEXACO abszolút szint:** H 46 · E 51 · X 48 · A 45 · C 55 · O 47

### Építőipari villanyszerelők és hasonló foglalkozásúak

`47-2231.00` · **ISCO-08 7411** Építőipari villanyszerelők és hasonló foglalkozásúak · **FEOR-08:** 7524 Épületvillamossági szerelő, villanyszerelő · ESCO `7411.1.4` · EN: Solar Photovoltaic Installers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* villanyszerelő, villamosmérnök

A villanyszerelők elektromos áramköröket és huzalozási rendszereket szerelnek fel és javítanak. Emellett telepítik és karbantartják az elektromos berendezéseket és gépeket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 36.9%-a jelölte

**Holland-kód:** RCI — R 100 · I 28 · A 6 · S 3 · E 12 · C 51

**HEXACO differenciál cél-profil:** C cél 55±26 (w=0.30) · E cél 46±27 (w=0.23) · X cél 47±28 (w=0.20) · H cél 47±28 (w=0.15)

**HEXACO abszolút szint:** H 46 · E 50 · X 45 · A 46 · C 52 · O 48

### Elektroműszerészek és szerelők

`47-4021.00` · **ISCO-08 7412** Elektroműszerészek és szerelők · **FEOR-08:** 7341 Villamos gépek és készülékek műszerésze, javítója; 7523 Felvonószerelő · ESCO `7412.7` · EN: Elevator and Escalator Installers and Repairers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* hajóvillamossági szerelő, villanyszerelő

A hajóvillamossági szerelők a hajók elektromos és elektronikus rendszereit, például a légkondicionáló rendszereket, lámpákat, rádiókat, fűtőrendszereket, akkumulátorokat, elektromos vezetékeket és generátorokat helyezik üzembe, tartják karban és javítják.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 47.5%-a jelölte

**Holland-kód:** RCI — R 100 · I 24 · A 0 · S 6 · E 4 · C 49

**HEXACO differenciál cél-profil:** C cél 60±24 (w=0.32) · X cél 44±26 (w=0.19) · A cél 44±26 (w=0.19) · E cél 45±27 (w=0.16)

**HEXACO abszolút szint:** H 46 · E 50 · X 42 · A 42 · C 55 · O 44

### Elektroműszerészek és szerelők

`49-2092.00` · **ISCO-08 7412** Elektroműszerészek és szerelők · **FEOR-08:** 7341 Villamos gépek és készülékek műszerésze, javítója; 7523 Felvonószerelő · ESCO `7412.10` · EN: Electric Motor, Power Tool, and Related Repairers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* vidámparki karbantartó, kalandparki karbantartó, hullámvasút-karbantartó, gépjármű-akkumulátor szerelő, motorkerékpár-akkumulátor szerelő, tehergépjármű-akkumulátor szerelő

A vidámparki karbantartók a vidámpark látnivalóinak karbantartását és javítását végzik. Erős műszaki ismeretekkel és szaktudással kell rendelkezniük a vidámpark karbantartandó berendezéseiről.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 39.2%-a jelölte

**Holland-kód:** RCI — R 100 · I 29 · A 0 · S 3 · E 0 · C 54

**HEXACO differenciál cél-profil:** C cél 56±26 (w=0.36) · A cél 44±26 (w=0.33) · X cél 45±27 (w=0.27)

**HEXACO abszolút szint:** H 41 · E 56 · X 39 · A 38 · C 46 · O 44

### Elektroműszerészek és szerelők

`49-9012.00` · **ISCO-08 7412** Elektroműszerészek és szerelők · **FEOR-08:** 7341 Villamos gépek és készülékek műszerésze, javítója; 7523 Felvonószerelő · ESCO `7412` · EN: Control and Valve Installers and Repairers, Except Mechanical Door · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Install, repair, and maintain mechanical regulating and controlling devices, such as electric meters, gas regulators, thermostats, safety and flow valves, and other mechanical governors.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 47.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 31 · A 0 · S 3 · E 0 · C 58

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.25) · A cél 42±25 (w=0.24) · X cél 43±25 (w=0.24) · H cél 54±27 (w=0.14)

**HEXACO abszolút szint:** H 43 · E 57 · X 37 · A 37 · C 47 · O 41

### Elektroműszerészek és szerelők

`49-9031.00` · **ISCO-08 7412** Elektroműszerészek és szerelők · **FEOR-08:** 7341 Villamos gépek és készülékek műszerésze, javítója; 7523 Felvonószerelő · ESCO `7412.6` · EN: Home Appliance Repairers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* felvonó-karbantartó szerelő, felvonószerelő, felvonó- és szállítóberendezés-kezelő, vidámparki karbantartó, kalandparki karbantartó, hullámvasút-karbantartó

A felvonó-karbantartó szerelők lifteket szerelnek be a liftaknákba. Telepítik a tartóelemet, üzembe helyezik az emelőszivattyút vagy motort, a dugattyúkat, a kábeleket és a mechanizmust.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 69.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 22 · A 3 · S 10 · E 6 · C 64

**HEXACO differenciál cél-profil:** H cél 56±26 (w=0.28) · E cél 54±28 (w=0.19) · O cél 47±28 (w=0.15) · A cél 47±28 (w=0.14)

**HEXACO abszolút szint:** H 52 · E 54 · X 47 · A 46 · C 50 · O 46

### Elektromosvezeték szerelők és javítók

`49-9051.00` · **ISCO-08 7413** Elektromosvezeték szerelők és javítók · **FEOR-08:** 7343 Elektromoshálózat-szerelő, -javító · ESCO `7413` · EN: Electrical Power-Line Installers and Repairers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* villamoshálózati távvezeték- és kábelszerelő, villamossági szerelő, villamostávvezeték-építő, -üzemeltető

_(HU leírás nincs; EN:)_ Install or repair cables or wires used in electrical power or distribution systems. May erect poles and light or heavy duty transmission towers.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 50.3%-a jelölte

**Holland-kód:** RCI — R 100 · I 28 · A 0 · S 5 · E 13 · C 47

**HEXACO differenciál cél-profil:** E cél 37±21 (w=0.28) · O cél 38±22 (w=0.26) · C cél 59±24 (w=0.19)

**HEXACO abszolút szint:** H 44 · E 43 · X 45 · A 50 · C 56 · O 40

### Elektronikai műszerészek és karbantartók

`49-2094.00` · **ISCO-08 7421** Elektronikai műszerészek és karbantartók · **FEOR-08:** 7341 Villamos gépek és készülékek műszerésze, javítója · ESCO `7421.4` · EN: Electrical and Electronics Repairers, Commercial and Industrial Equipment · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* hajóelektronikai technikus, villanyszerelő, jármű-elektronikai technikus, vasúti jármű-elektronikai technikus, szórakoztatóelektronikai szerelő, TV-szerelő

A hajóelektronikai technikusok elektronikus rendszerek és berendezések kiépítését, telepítését és javítását végzik hajókon. Az elektromos alkatrészeket és vezetékeket a tervrajzok és az összeszerelési rajzok szerint szerelik össze.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 45.7%-a jelölte

**Holland-kód:** RCI — R 100 · I 47 · A 0 · S 0 · E 7 · C 71

**HEXACO differenciál cél-profil:** X cél 41±24 (w=0.27) · O cél 58±25 (w=0.23) · C cél 55±26 (w=0.16) · H cél 45±27 (w=0.15)

**HEXACO abszolút szint:** H 44 · E 51 · X 43 · A 45 · C 54 · O 54

### Információs és kommunikációs technológiai berendezések szerelői műszerésze, javítója

`49-2011.00` · **ISCO-08 7422** Információs és kommunikációs technológiai berendezések szerelői műszerésze, javítója · **FEOR-08:** 7342 Informatikai és telekommunikációs berendezések · ESCO `7422.2` · EN: Computer, Automated Teller, and Office Machine Repairers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* számítógép-szerelő, -karbantartó, személyiszámítógép-szerelő, számítógépalkatrész-összeszerelő, mobileszköz-technikus, mobileszköz-javító, mobileszközök technikusa

A számítógép-szerelő és -karbantartók számítógépes hardvereket és perifériás alkatrészeket telepítenek, vizsgálnak, tesztelnek és javítanak. Ellenőrizik a számítógépek működőképességét, azonosítják a problémákat, és kicserélik a sérült alkatrészeket.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 33.0%-a jelölte

**Holland-kód:** RCI — R 80 · I 28 · A 0 · S 12 · E 13 · C 75

**HEXACO differenciál cél-profil:** A cél 44±26 (w=0.27) · C cél 56±26 (w=0.26) · E cél 56±26 (w=0.25) · X cél 46±28 (w=0.16)

**HEXACO abszolút szint:** H 46 · E 57 · X 44 · A 42 · C 50 · O 47

### Információs és kommunikációs technológiai berendezések szerelői műszerésze, javítója

`49-9052.00` · **ISCO-08 7422** Információs és kommunikációs technológiai berendezések szerelői műszerésze, javítója · **FEOR-08:** 7342 Informatikai és telekommunikációs berendezések · ESCO `7422.7` · EN: Telecommunications Line Installers and Repairers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* távközlési technikus, telekommunikációs technikus, telekommunikációs berendezések műszerésze, távközlési berendezések műszerésze, telekommunikációs berendezések javítója, kommunikációs infrastruktúra karbantartó

A távközlési technikusok telepítik, tesztelik, karbantartják és szervizelik a távközlési rendszereket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 59.6%-a jelölte

**Holland-kód:** RCI — R 91 · I 25 · A 0 · S 10 · E 17 · C 53

**HEXACO differenciál cél-profil:** C cél 56±26 (w=0.28) · E cél 45±26 (w=0.26) · X cél 47±28 (w=0.16) · H cél 47±28 (w=0.14)

**HEXACO abszolút szint:** H 42 · E 51 · X 42 · A 44 · C 47 · O 43

### riasztóberendezés-szerelő

`49-2098.00` · **ISCO-08 7422** Információs és kommunikációs technológiai berendezések szerelői műszerésze, javítója · **FEOR-08:** 7342 Informatikai és telekommunikációs berendezések · ESCO `7422.5` · EN: Security and Fire Alarm Systems Installers

*Piaci megnevezések (ESCO):* riasztórendszer-telepítő

A riasztóberendezés-szerelők riasztórendszereket telepítenek és tartanak karban az olyan veszélyek elleni védelem érdekében, mint például a tűz és a betörés.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 48.6%-a jelölte

**Holland-kód:** RCI — R 94 · I 39 · A 0 · S 6 · E 10 · C 66

**HEXACO differenciál cél-profil:** C cél 56±26 (w=0.24) · H cél 55±27 (w=0.22) · A cél 45±27 (w=0.22) · O cél 46±27 (w=0.18)

**HEXACO abszolút szint:** H 50 · E 53 · X 46 · A 44 · C 53 · O 45

### telekommunikációs berendezések műszerésze

`49-2022.00` · **ISCO-08 7422** Információs és kommunikációs technológiai berendezések szerelői műszerésze, javítója · **FEOR-08:** 7342 Informatikai és telekommunikációs berendezések · ESCO `7422.6` · EN: Telecommunications Equipment Installers and Repairers, Except Line Installers

*Piaci megnevezések (ESCO):* távközlési berendezések műszerésze, telekommunikációs berendezések javítója, távközlési technikus, telekommunikációs technikus, kommunikációs infrastruktúra karbantartó, kommunikációs rendszerek karbantartója

A telekommunikációs berendezések műszerészei a mobil vagy helyhez kötött rádiósugárzási, műsorszórási és vevőberendezéseket, valamint kétirányú rádiótávközlési rendszereket (cellás távközlési szolgáltatások, mobil szélessáv, hajó-szárazföld, légi jármű és föld közötti kommunikáció, szolgálati rádióberendezések és sürgősségi járművek) tartják karban, telepítik vagy javítják.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 43.1%-a jelölte

**Holland-kód:** RCI — R 90 · I 24 · A 0 · S 14 · E 10 · C 64

**HEXACO differenciál cél-profil:** X cél 47±28 (w=0.31) · C cél 53±28 (w=0.27) · H cél 48±28 (w=0.21) · A cél 52±29 (w=0.17)

**HEXACO abszolút szint:** H 48 · E 51 · X 47 · A 50 · C 52 · O 49

### halszeletelő

`51-3022.00` · **ISCO-08 7511** Hús, hal és hasonló élelmiszerek feldolgozói · **FEOR-08:** 7111 Húsfeldolgozó · ESCO `7511.3` · EN: Meat, Poultry, and Fish Cutters and Trimmers

*Piaci megnevezések (ESCO):* halszeletelők, halelőkészítő, hússzeletelő, húsfeldolgozók, húsfeldolgozó, húselőkészítő

A halszeletelők levágják a halak fejét, és a halak testéből eltávolítják a szerveket, fogyasztásra előkészített halak és tengeri eredetű élelmiszerek előállítása céljából.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 62.4%-a jelölte

**Holland-kód:** RCI — R 100 · I 13 · A 0 · S 6 · E 7 · C 49

**HEXACO differenciál cél-profil:** O cél 43±25 (w=0.27) · C cél 56±26 (w=0.22) · X cél 44±26 (w=0.22) · A cél 45±27 (w=0.17)

**HEXACO abszolút szint:** H 33 · E 62 · X 32 · A 31 · C 35 · O 32

### hússzeletelő

`51-3021.00` · **ISCO-08 7511** Hús, hal és hasonló élelmiszerek feldolgozói · **FEOR-08:** 7111 Húsfeldolgozó · ESCO `7511.4` · EN: Butchers and Meat Cutters

*Piaci megnevezések (ESCO):* húsfeldolgozók, húsfeldolgozó, hentes, hentesek, hentes és mészáros, húselőkészítő

A hússzeletelők levágott állatokat darabolnak fel nagyobb és kisebb darabokra további feldolgozás céljából. Az előfeldolgozott hasított testekből a csontokat kézzel vagy géppel távolítják el.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 69.9%-a jelölte

**Holland-kód:** RCE — R 88 · I 7 · A 13 · S 15 · E 30 · C 49

**HEXACO differenciál cél-profil:** H cél 56±26 (w=0.33) · O cél 44±26 (w=0.28) · A cél 46±27 (w=0.21)

**HEXACO abszolút szint:** H 45 · E 57 · X 43 · A 39 · C 39 · O 40

### mészáros

`51-3023.00` · **ISCO-08 7511** Hús, hal és hasonló élelmiszerek feldolgozói · **FEOR-08:** 7111 Húsfeldolgozó · ESCO `7511.6` · EN: Slaughterers and Meat Packers

*Piaci megnevezések (ESCO):* hentes és mészáros, húsfeldolgozó, hússzeletelő, húsfeldolgozók, húselőkészítő, hentes

Állatokat vágnak le, és előkészítik a levágott állatokat további feldolgozás és forgalmazás céljából.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 60.8%-a jelölte

**Holland-kód:** RCI — R 94 · I 21 · A 5 · S 11 · E 19 · C 42

**HEXACO differenciál cél-profil:** O cél 43±25 (w=0.27) · E cél 45±26 (w=0.21) · X cél 45±27 (w=0.19) · C cél 55±27 (w=0.19)

**HEXACO abszolút szint:** H 34 · E 58 · X 33 · A 34 · C 33 · O 33

### pék édesiparitermék-gyártó

`51-3011.00` · **ISCO-08 7512** Pékek, cukrászok, édességgyártók · **FEOR-08:** 5135 Cukrász; 7114 Pék, édesiparitermék-gyártó · ESCO `7512.1` · EN: Bakers

*Piaci megnevezések (ESCO):* édesiparitermék-gyártó, sütőipari termék készítő, csokoládétermék-gyártó, csokoládétermék gyártója, csokoládétermék gyártói, cukrász

A pékek kenyerek, cukrászsütemények és egyéb sütőipari termékek széles választékát készítik.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 57.5%-a jelölte

**Holland-kód:** RCA — R 88 · I 11 · A 23 · S 12 · E 18 · C 53

**HEXACO differenciál cél-profil:** C cél 57±25 (w=0.35) · X cél 46±27 (w=0.21) · H cél 46±28 (w=0.18) · A cél 47±28 (w=0.15)

**HEXACO abszolút szint:** H 38 · E 57 · X 40 · A 40 · C 45 · O 43

### Műbútorasztalosok és hasonló foglalkozásúak

`51-7011.00` · **ISCO-08 7522** Műbútorasztalosok és hasonló foglalkozásúak · **FEOR-08:** 7223 Bútorasztalos; 7225 Kádár, bognár · ESCO `7522.1` · EN: Cabinetmakers and Bench Carpenters · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* műbútorasztalos, bútorkárpitos, bútorfestő, bútorasztalos, asztalos, bútorlapszabász

A műbútorasztalosok antik bútorokról készítenek másolatokat. Az eredeti bútor specifikációinak megfelelően elkészítik a rajzokat és a sablonokat, méretre vágják és összeszerelik a bútor darabjait, és véglegesítik a kész darabot.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 62.0%-a jelölte

**Holland-kód:** RCA — R 100 · I 18 · A 25 · S 2 · E 4 · C 40

**HEXACO differenciál cél-profil:** C cél 61±22 (w=0.30) · A cél 39±23 (w=0.29) · X cél 44±26 (w=0.15) · E cél 54±27 (w=0.12)

**HEXACO abszolút szint:** H 36 · E 61 · X 36 · A 33 · C 46 · O 44

### Famegmunkáló gépek beállítói és üzemeltetői

`51-7042.00` · **ISCO-08 7523** Famegmunkáló gépek beállítói és üzemeltetői · **FEOR-08:** 7222 Faesztergályos · ESCO `7523` · EN: Woodworking Machine Setters, Operators, and Tenders, Except Sawing · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szögelő, raklapszögelő, szögbelövő, fafúrós, fúrós, bútoripari gép kezelője

_(HU leírás nincs; EN:)_ Set up, operate, or tend woodworking machines, such as drill presses, lathes, shapers, routers, sanders, planers, and wood nailing machines. May operate computer numerically controlled (CNC) equipment.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 73.1%-a jelölte

**Holland-kód:** RCI — R 100 · I 23 · A 2 · S 3 · E 0 · C 52

**HEXACO differenciál cél-profil:** C cél 58±24 (w=0.34) · O cél 45±26 (w=0.21) · X cél 46±27 (w=0.18) · H cél 47±28 (w=0.13)

**HEXACO abszolút szint:** H 34 · E 60 · X 36 · A 36 · C 42 · O 37

### Szabók, szűcsök és kalaposok

`51-6052.00` · **ISCO-08 7531** Szabók, szűcsök és kalaposok · **FEOR-08:** 7212 Szabó, varró; 7213 Kalapos, kesztyűs · ESCO `7531.2` · EN: Tailors, Dressmakers, and Custom Sewers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* női szabó, átalakító szabó, szabó, varró, férfi szabó, kalapos, kalapbélés és -kellékszabó

A női szabók textilből, könnyű bőrből, szőrméből és más anyagokból készült női és gyermekruhákat terveznek, készítenek, szabnak, módosítanak vagy javítanak. Méret után készült ruhákat állítanak elő, az ügyfél vagy a ruhagyártó előírásai szerint.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 57.7%-a jelölte

**Holland-kód:** RAC — R 81 · I 3 · A 49 · S 16 · E 24 · C 36

**HEXACO differenciál cél-profil:** E cél 56±26 (w=0.36) · A cél 44±26 (w=0.34) · C cél 53±28 (w=0.17)

**HEXACO abszolút szint:** H 44 · E 60 · X 44 · A 40 · C 45 · O 46

### kárpitos

`51-6093.00` · **ISCO-08 7534** Kárpitosok és hasonló foglalkozásúak · **FEOR-08:** 7224 Kárpitos · ESCO `7534.3` · EN: Upholsterers

*Piaci megnevezések (ESCO):* repülőgépbelső-karbantartó, szórakoztató-elektronikai műszerész, matrackészítő, matractömő

A kárpitosok tárgyakat készítenek, például bútorokat, paneleket, ortopédiai eszközöket, kárpitos vagy puha borítású tartozékokat vagy járműrészeket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 56.2%-a jelölte

**Holland-kód:** RAC — R 97 · I 14 · A 32 · S 6 · E 0 · C 32

**HEXACO differenciál cél-profil:** A cél 41±24 (w=0.34) · C cél 57±26 (w=0.27) · O cél 53±28 (w=0.11) · X cél 47±28 (w=0.10)

**HEXACO abszolút szint:** H 34 · E 62 · X 36 · A 32 · C 38 · O 42

### Termékosztályozók és -vizsgálók (kivéve az élelmiszereket) élelmiszereket) foglalkozású

`51-9061.00` · **ISCO-08 7543** Termékosztályozók és -vizsgálók (kivéve az élelmiszereket) élelmiszereket) foglalkozású · **FEOR-08:** 3135 Minőségbiztosítási technikus; 7919 Egyéb, máshova nem sorolható ipari és építőipari · ESCO `7543.10` · EN: Inspectors, Testers, Sorters, Samplers, and Weighers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* termékminőség-ellenőr, minőségbiztosítási munkatárs, ellenőrzési és minőségbiztosítási munkatárs, termék-összeszerelési felügyelő, termék-összeállítási ellenőr, összeszerelő gyártósor felügyelő

A termékminőség-ellenőrök ellenőrzik a termékeket annak érdekében, hogy ellenőrizzék egy adott szabványnak vagy referencia iránymutatásnak való megfelelés értékelése céljából.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 69.8%-a jelölte

**Holland-kód:** RCI — R 79 · I 40 · A 0 · S 0 · E 6 · C 73

**HEXACO differenciál cél-profil:** O cél 38±22 (w=0.24) · C cél 60±23 (w=0.21) · H cél 60±24 (w=0.20) · X cél 43±25 (w=0.14)

**HEXACO abszolút szint:** H 47 · E 60 · X 37 · A 38 · C 50 · O 36

### roncsolásmentes anyagvizsgáló

`17-3029.01` · **ISCO-08 7543** Termékosztályozók és -vizsgálók (kivéve az élelmiszereket) élelmiszereket) foglalkozású · **FEOR-08:** 3135 Minőségbiztosítási technikus; 7919 Egyéb, máshova nem sorolható ipari és építőipari · ESCO `7543.5` · EN: Non-Destructive Testing Specialists

*Piaci megnevezések (ESCO):* roncsolásmentes vizsgálat szakértő, AOI-programozó, NYÁK-inspektor, nyomtatottáramkör-inspektor, vezérlőpanel-tesztelő, panelszerelő művezető

A roncsolásmentes anyagvizsgálók a járművek, hajók, egyéb gyártott tárgyak és szerkezeti szerkezetek vizsgálatát végzik anélkül, hogy azokat megrongálnák.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 68.2%-a jelölte

**Holland-kód:** RIC — R 90 · I 66 · A 6 · S 7 · E 0 · C 59

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.28) · X cél 42±24 (w=0.26) · A cél 43±25 (w=0.22) · H cél 54±27 (w=0.14)

**HEXACO abszolút szint:** H 51 · E 50 · X 43 · A 43 · C 57 · O 49

### féreg-, rovar- és kártevőirtó szakember

`37-2021.00` · **ISCO-08 7544** Kártevőirtók · **FEOR-08:** 7914 Kártevőirtó, gyomirtó · ESCO `7544.1` · EN: Pest Control Workers

*Piaci megnevezések (ESCO):* fertőtlenítéssel foglalkozó személy, rovar és kártevőirtó szakember

A féreg-, rovar- és kártevőirtó szakemberek azonosítják, megszüntetik és visszaszorítják a kártevőket specifikus kémiai oldatok alkalmazásával, csapdák és egyéb, a kártevők, például patkányok, egerek és csótányok irtására szolgáló felszerelések felállításával.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 90.2%-a jelölte

**Holland-kód:** RCI — R 98 · I 32 · A 0 · S 11 · E 20 · C 53

**HEXACO differenciál cél-profil:** C cél 55±27 (w=0.28) · A cél 46±27 (w=0.22) · O cél 46±28 (w=0.20) · X cél 47±28 (w=0.15)

**HEXACO abszolút szint:** H 43 · E 56 · X 43 · A 41 · C 45 · O 42


## 8 — Gépkezelők, összeszerelők, járművezetők

### Szilárdásványfeldolgozó-gépek kezelői

`51-9021.00` · **ISCO-08 8112** Szilárdásványfeldolgozó-gépek kezelői · **FEOR-08:** 8311 Szilárdásvány-kitermelő gép kezelője (szén, kő) · ESCO `8112.1` · EN: Crushing, Grinding, and Polishing Machine Setters, Operators, and Tenders · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* ásványőrlőgép-kezelő, ásvány-előkészítő

Az ásványőrlőgép-kezelők működtetik és nyomon követik az anyagok és ásványok összezúzását végző őrlő- és egyéb gépeket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 61.7%-a jelölte

**Holland-kód:** RCI — R 97 · I 19 · A 0 · S 0 · E 7 · C 60

**HEXACO differenciál cél-profil:** O cél 42±25 (w=0.29) · C cél 58±25 (w=0.28) · A cél 45±27 (w=0.17) · X cél 45±27 (w=0.17)

**HEXACO abszolút szint:** H 34 · E 60 · X 34 · A 33 · C 39 · O 34

### Fémfeldolgozó berendezések kezelői

`51-4035.00` · **ISCO-08 8121** Fémfeldolgozó berendezések kezelői · **FEOR-08:** 8151 Fémfeldolgozó gép kezelője · ESCO `8121` · EN: Milling and Planing Machine Setters, Operators, and Tenders, Metal and Plastic · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Set up, operate, or tend milling or planing machines to mill, plane, shape, groove, or profile metal or plastic work pieces.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 47.3%-a jelölte

**Holland-kód:** RCI — R 100 · I 24 · A 3 · S 0 · E 0 · C 56

**HEXACO differenciál cél-profil:** C cél 60±23 (w=0.34) · X cél 44±26 (w=0.21) · A cél 44±26 (w=0.21) · O cél 46±27 (w=0.14)

**HEXACO abszolút szint:** H 34 · E 60 · X 34 · A 33 · C 43 · O 38

### fémhúzógép-kezelő

`51-4021.00` · **ISCO-08 8121** Fémfeldolgozó berendezések kezelői · **FEOR-08:** 8151 Fémfeldolgozó gép kezelője · ESCO `8121.4` · EN: Extruding and Drawing Machine Setters, Operators, and Tenders, Metal and Plastic

*Piaci megnevezések (ESCO):* sajtológép-kezelő

Fémhúzógép-kezelők vasfém- és nemvas fémtermékeket gyártó gépeket állítanak be és működtetnek, amelyeket huzalok, rudak, csövek, üreges profilok és csövek egyedi formára alakítására terveztek, amelyet keresztmetszetük csökkentésével és a munkaanyagok egy sor, egyre kisebb méretű szerszámon keresztül húzásával érik el.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 84.7%-a jelölte

**Holland-kód:** RCI — R 95 · I 20 · A 7 · S 1 · E 0 · C 55

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.29) · X cél 44±26 (w=0.24) · A cél 46±28 (w=0.13) · O cél 46±28 (w=0.13)

**HEXACO abszolút szint:** H 34 · E 58 · X 34 · A 35 · C 41 · O 38

### Fémmegmunkáló, fémbevonó és felületkezelő gépek kezelői

`51-4193.00` · **ISCO-08 8122** Fémmegmunkáló, fémbevonó és felületkezelő gépek kezelői · **FEOR-08:** 8152 Fémmegmunkáló, felületkezelő gép kezelője · ESCO `8122` · EN: Plating Machine Setters, Operators, and Tenders, Metal and Plastic · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* eloxálógép-kezelő, rétegfelhordógép-kezelő, rétegfelhordó berendezés kezelője, galvanizálógép-kezelő, kromatizálókád-kezelő, merítőtartály-kezelő

_(HU leírás nincs; EN:)_ Set up, operate, or tend plating machines to coat metal or plastic products with chromium, zinc, copper, cadmium, nickel, or other metal to protect or decorate surfaces. Typically, the product being coated is immersed in molten metal or an electrolytic solution.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 49.2%-a jelölte

**Holland-kód:** RCI — R 100 · I 20 · A 7 · S 0 · E 0 · C 52

**HEXACO differenciál cél-profil:** C cél 58±24 (w=0.30) · O cél 43±25 (w=0.24) · A cél 44±26 (w=0.22) · X cél 45±27 (w=0.16)

**HEXACO abszolút szint:** H 35 · E 60 · X 35 · A 33 · C 41 · O 35

### Vegyipari termékeket gyártó berendezések és gépek kezelői kezelői kezelői kezelői

`51-9011.00` · **ISCO-08 8131** Vegyipari termékeket gyártó berendezések és gépek kezelői kezelői kezelői kezelői · **FEOR-08:** 8131 Kőolaj- és földgázfeldolgozó gép kezelője; 8132 Vegyi alapanyagot és terméket gyártó gép kezelője; 8133 Gyógyszergyártó gép kezelője; 8134 Műtrágya- és növényvédőszer-gyártó gép kezelője · ESCO `8131.2` · EN: Chemical Equipment Operators and Tenders · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* vegyianyag-keverő kezelője, gravitációs szeparátor kezelője, fajsúlyszeparátor-kezelő, gravitációsszeparátor-kezelő, szappanporlasztó-kezelő, granulálógép-kezelő

A vegyianyag-keverő kezelői keverőtartályokat és keverőket működtetnek és tartanak karban abból a célból, hogy a nyersanyagokból vegyipari termékeket fejlesszenek, biztosítva, hogy a végtermék megfeleljen a tételek specifikációinak.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 48.8%-a jelölte

**Holland-kód:** RCI — R 93 · I 36 · A 0 · S 2 · E 4 · C 59

**HEXACO differenciál cél-profil:** X cél 40±23 (w=0.28) · C cél 60±23 (w=0.28) · E cél 43±25 (w=0.20) · O cél 43±26 (w=0.19)

**HEXACO abszolút szint:** H 44 · E 49 · X 38 · A 45 · C 54 · O 41

### Vegyipari termékeket gyártó berendezések és gépek kezelői kezelői kezelői kezelői

`51-9023.00` · **ISCO-08 8131** Vegyipari termékeket gyártó berendezések és gépek kezelői kezelői kezelői kezelői · **FEOR-08:** 8131 Kőolaj- és földgázfeldolgozó gép kezelője; 8132 Vegyi alapanyagot és terméket gyártó gép kezelője; 8133 Gyógyszergyártó gép kezelője; 8134 Műtrágya- és növényvédőszer-gyártó gép kezelője · ESCO `8131.16` · EN: Mixing and Blending Machine Setters, Operators, and Tenders · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* illatszerkészítő gép kezelője, nitroglicerin-semlegesítő, vegyianyag-keverő kezelője

Az illatszerkészítő gépek kezelői a parfümök gyártásához használt gépeket szolgálják ki gépek és szerszámok beállításával, a berendezések takarítását és karbantartását végzik a gyártási menetrendhez igazodva.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 80.3%-a jelölte

**Holland-kód:** RCI — R 93 · I 16 · A 2 · S 2 · E 3 · C 54

**HEXACO differenciál cél-profil:** O cél 40±23 (w=0.34) · C cél 60±23 (w=0.32) · X cél 43±26 (w=0.22)

**HEXACO abszolút szint:** H 37 · E 60 · X 34 · A 36 · C 44 · O 33

### Vegyipari termékeket gyártó berendezések és gépek kezelői kezelői kezelői kezelői

`51-9041.00` · **ISCO-08 8131** Vegyipari termékeket gyártó berendezések és gépek kezelői kezelői kezelői kezelői · **FEOR-08:** 8131 Kőolaj- és földgázfeldolgozó gép kezelője; 8132 Vegyi alapanyagot és terméket gyártó gép kezelője; 8133 Gyógyszergyártó gép kezelője; 8134 Műtrágya- és növényvédőszer-gyártó gép kezelője · ESCO `8131.18` · EN: Extruding, Forming, Pressing, and Compacting Machine Setters, Operators, and Tenders · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szappanpréskezelő

A szappanpréskezelők szabályozzák az őrölt szappant tömörítő gépet, amely sajátos formájú és méretű szappanrudakra gyárt, biztosítva, hogy a termékek megfeleljenek az előírásoknak és a minőségi követelményeknek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 78.2%-a jelölte

**Holland-kód:** RCI — R 92 · I 20 · A 5 · S 1 · E 4 · C 55

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.31) · O cél 44±26 (w=0.26) · X cél 46±27 (w=0.18) · H cél 47±28 (w=0.11)

**HEXACO abszolút szint:** H 33 · E 60 · X 35 · A 36 · C 40 · O 36

### Gumiterméket gyártó gépek kezelői

`51-9197.00` · **ISCO-08 8141** Gumiterméket gyártó gépek kezelői · **FEOR-08:** 8136 Gumitermékgyártó gép kezelője · ESCO `8141.1.1` · EN: Tire Builders · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gumitermékgyártó gép kezelője

A gumitermékgyártó gépek kezelői olyan gépeket üzemeltetnek, amelyek természetes és szintetikus gumiból készült gumitermékeket dagasztanak, elegyítenek, kalandereznek, öntvényeznek, extrudálnak és regenerálnak.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 66.5%-a jelölte

**Holland-kód:** RCI — R 100 · I 21 · A 0 · S 2 · E 0 · C 46

**HEXACO differenciál cél-profil:** A cél 44±26 (w=0.29) · C cél 56±26 (w=0.29) · O cél 45±27 (w=0.25) · X cél 48±28 (w=0.12)

**HEXACO abszolút szint:** H 32 · E 63 · X 34 · A 31 · C 34 · O 34

### kötőgépkezelő

`51-6063.00` · **ISCO-08 8152** Szövő- és kötőgépkezelők · **FEOR-08:** 8121 Textilipari gép kezelője és gyártósor mellett dolgozó · ESCO `8152.1` · EN: Textile Knitting and Weaving Machine Setters, Operators, and Tenders

*Piaci megnevezések (ESCO):* szövőgépkezelő

A kötőgépkezelők kötőgépeket állítanak be, működtetnek és felügyelnek. Speciális gépekkel, technikákkal és anyagokkal dolgoznak a fonalak kötött termékekké (például ruházati cikkek, szőnyegek vagy kötelek) történő feldolgozására.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 94.7%-a jelölte

**Holland-kód:** RCI — R 99 · I 14 · A 9 · S 0 · E 6 · C 55

**HEXACO differenciál cél-profil:** C cél 56±26 (w=0.31) · O cél 44±26 (w=0.30) · X cél 46±27 (w=0.20) · A cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 34 · E 61 · X 35 · A 35 · C 38 · O 35

### varrógépkezelő

`51-6031.00` · **ISCO-08 8153** Varrógépkezelők · **FEOR-08:** 8122 Ruházati gép kezelője és gyártósor mellett dolgozó · ESCO `8153.1` · EN: Sewing Machine Operators

*Piaci megnevezések (ESCO):* gépi varró

A varrógépkezelők a ruházati termékek ipari gyártási láncába tartozó specifikus varrógépeket szolgálnak ki. Műveleteket végeznek, ruházati cikkek illesztéséhez, összeszereléséhez, megerősítéséhez, javításához, valamint módosításához kapcsolódóan.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 52.9%-a jelölte

**Holland-kód:** RCA — R 96 · I 6 · A 12 · S 3 · E 2 · C 50

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.30) · O cél 42±25 (w=0.27) · X cél 46±27 (w=0.14) · A cél 46±27 (w=0.13)

**HEXACO abszolút szint:** H 32 · E 64 · X 33 · A 33 · C 39 · O 33

### automata cipőalkatrészvágó gép kezelője

`51-6062.00` · **ISCO-08 8156** Cipőgyártó és hasonló gépek kezelői · **FEOR-08:** 8124 Cipőgyártó gép kezelője és gyártósor mellett dolgozó · ESCO `8156.1` · EN: Textile Cutting Machine Setters, Operators, and Tenders

*Piaci megnevezések (ESCO):* cipőgyártó gép kezelője

Az automata cipőalkatrészvágó gépek kezelői a számítógépről a daraboló gépbe küldik a fájlokat, a szétvágandó anyagot beállítják, a nesting számára digitalizálják és kiválasztják az anyagfelület hibáit, kivéve, ha a gép ezt automatikusan elvégzi.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 67.7%-a jelölte

**Holland-kód:** RCE — R 89 · I 9 · A 8 · S 4 · E 9 · C 58

**HEXACO differenciál cél-profil:** O cél 42±25 (w=0.37) · C cél 57±25 (w=0.31) · A cél 47±28 (w=0.15) · X cél 47±28 (w=0.14)

**HEXACO abszolút szint:** H 35 · E 61 · X 35 · A 34 · C 38 · O 34

### mosodai gépkezelő

`51-6011.00` · **ISCO-08 8157** Mosodai gépek kezelői · **FEOR-08:** 8327 Mosodai gép kezelője · ESCO `8157.1` · EN: Laundry and Dry-Cleaning Workers

*Piaci megnevezések (ESCO):* mosodai munkás, mosodai ellenőr, mosoda-felügyelő

A mosodai gépkezelők olyan gépeket üzemeltetnek és felügyelnek, amelyek vegyi anyagokat használnak olyan termékek mosására vagy vegytisztítására, mint a szövet- és bőrruházat, ágyneműk, drapériák vagy szőnyegek, gondoskodva arról, hogy ezeknek az áruknak a színe és textúrája megmaradjon.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 65.2%-a jelölte

**Holland-kód:** RCE — R 90 · I 0 · A 3 · S 6 · E 9 · C 54

**HEXACO differenciál cél-profil:** O cél 45±27 (w=0.24) · C cél 54±28 (w=0.18) · X cél 47±28 (w=0.17) · H cél 53±28 (w=0.14)

**HEXACO abszolút szint:** H 33 · E 65 · X 32 · A 32 · C 32 · O 34

### Élelmiszert és hasonló terméket gyártó gépek kezelői

`51-3091.00` · **ISCO-08 8160** Élelmiszert és hasonló terméket gyártó gépek kezelői · **FEOR-08:** 7115 Borász és egyéb szeszesital-gyártó, szikvízkészítő; 8111 Élelmiszer-, italgyártó gép kezelője · ESCO `8160` · EN: Food and Tobacco Roasting, Baking, and Drying Machine Operators and Tenders · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* malátapörkölő kezelője, malátapörkölő kezelői, malátapörkölő, kávépörkölő, kávépörkölő mester, pörkölő mester

_(HU leírás nincs; EN:)_ Operate or tend food or tobacco roasting, baking, or drying equipment, including hearth ovens, kiln driers, roasters, char kilns, and vacuum drying equipment.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 60.8%-a jelölte

**Holland-kód:** RCE — R 98 · I 10 · A 2 · S 4 · E 14 · C 53

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.29) · O cél 42±25 (w=0.28) · X cél 46±27 (w=0.17) · A cél 46±28 (w=0.13)

**HEXACO abszolút szint:** H 34 · E 60 · X 34 · A 34 · C 40 · O 34

### Élelmiszert és hasonló terméket gyártó gépek kezelői

`51-3092.00` · **ISCO-08 8160** Élelmiszert és hasonló terméket gyártó gépek kezelői · **FEOR-08:** 7115 Borász és egyéb szeszesital-gyártó, szikvízkészítő; 8111 Élelmiszer-, italgyártó gép kezelője · ESCO `8160.34` · EN: Food Batchmakers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* élelmiszergyártó gép kezelője, élelmiszergyártó gép kezelői, élelmiszergyártó gépek kezelője, édesség automata kezelője, édesség automata kezelői, bonbonkészítő

Az élelmiszergyártó gépek kezelői az élelmiszer-termelési folyamat különböző szakaszaiban egy vagy több feladatot szolgálnak ki és látnak el.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 37.8%-a jelölte

**Holland-kód:** RCE — R 85 · I 18 · A 15 · S 8 · E 27 · C 61

**HEXACO differenciál cél-profil:** O cél 44±26 (w=0.33) · C cél 56±26 (w=0.33) · X cél 47±28 (w=0.14)

**HEXACO abszolút szint:** H 40 · E 56 · X 40 · A 41 · C 46 · O 39

### Élelmiszert és hasonló terméket gyártó gépek kezelői

`51-9012.00` · **ISCO-08 8160** Élelmiszert és hasonló terméket gyártó gépek kezelői · **FEOR-08:** 7115 Borász és egyéb szeszesital-gyártó, szikvízkészítő; 8111 Élelmiszer-, italgyártó gép kezelője · ESCO `8160.39` · EN: Separating, Filtering, Clarifying, Precipitating, and Still Machine Setters, Operators, and Tenders · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* hidrogénező reaktorkezelő, hidrogénező reaktor kezelője, hidrogénező reaktor kezelői, finomító berendezés vezérlője, finomító berendezés kezelője, finomító gép kezelője

A hidrogénező reaktorkezelők berendezéseket vezérelnek a margarin és zsiradéktermékek gyártásához használt bázisolajok feldolgozásához.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 90.8%-a jelölte

**Holland-kód:** RCI — R 88 · I 22 · A 0 · S 2 · E 2 · C 58

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.30) · O cél 43±25 (w=0.28) · X cél 43±25 (w=0.27)

**HEXACO abszolút szint:** H 39 · E 59 · X 35 · A 38 · C 44 · O 36

### élelmiszergyártó gép kezelője

`51-3093.00` · **ISCO-08 8160** Élelmiszert és hasonló terméket gyártó gépek kezelői · **FEOR-08:** 7115 Borász és egyéb szeszesital-gyártó, szikvízkészítő; 8111 Élelmiszer-, italgyártó gép kezelője · ESCO `8160.34` · EN: Food Cooking Machine Operators and Tenders

*Piaci megnevezések (ESCO):* élelmiszergyártó gép kezelői, élelmiszergyártó gépek kezelője, készételhűtő gépkezelő, sütőipari gépkezelő, sütő kezelője, sütőipari gép kezelője

Az élelmiszergyártó gépek kezelői az élelmiszer-termelési folyamat különböző szakaszaiban egy vagy több feladatot szolgálnak ki és látnak el.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 85.9%-a jelölte

**Holland-kód:** RCI — R 97 · I 16 · A 2 · S 6 · E 11 · C 61

**HEXACO differenciál cél-profil:** O cél 42±24 (w=0.33) · C cél 56±26 (w=0.26) · X cél 44±26 (w=0.25) · E cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 34 · E 59 · X 33 · A 36 · C 38 · O 34

### Fafeldolgozó berendezések kezelői

`51-7041.00` · **ISCO-08 8172** Fafeldolgozó berendezések kezelői · **FEOR-08:** 8125 Fafeldolgozó gép kezelője és gyártósor mellett dolgozó · ESCO `8172.5.5` · EN: Sawing Machine Setters, Operators, and Tenders, Wood · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* fűrészüzemi gépkezelő, ácsfűrészkezelő

A fűrészüzemi gépkezelők olyan automatizált fűrészmalom berendezéseket kezel, amely a faanyagot nyers fűrészáruvá darabolja. Különböző fűrészgépeket is kezelnek, amelyek a fűrészáru további, különböző formákra és méretekre feldolgozását végzik.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 59.2%-a jelölte

**Holland-kód:** RCI — R 100 · I 23 · A 0 · S 3 · E 0 · C 48

**HEXACO differenciál cél-profil:** O cél 42±24 (w=0.27) · C cél 58±25 (w=0.26) · A cél 44±26 (w=0.18) · X cél 46±28 (w=0.12)

**HEXACO abszolút szint:** H 34 · E 59 · X 35 · A 33 · C 40 · O 34

### kazángépkezelő

`51-8021.00` · **ISCO-08 8182** Gőzgép- és kazánkezelők · **FEOR-08:** 8323 Kazángépkezelő · ESCO `8182.1` · EN: Stationary Engineers and Boiler Operators

*Piaci megnevezések (ESCO):* gőzerőmű-kezelő, gőzerőmű-operátor

A kazángépkezelők olyan fűtőrendszereket működtetnek, mint az alacsonynyomású kazánok, a nagynyomású kazánok és a villamos kazánok.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 47.1%-a jelölte

**Holland-kód:** RCI — R 100 · I 36 · A 0 · S 2 · E 4 · C 57

**HEXACO differenciál cél-profil:** C cél 61±23 (w=0.32) · O cél 43±25 (w=0.21) · X cél 45±26 (w=0.16) · E cél 45±27 (w=0.14)

**HEXACO abszolút szint:** H 43 · E 51 · X 41 · A 42 · C 54 · O 41

### csomagoló- és töltőgép kezelője

`51-9111.00` · **ISCO-08 8183** Csomagoló, palackozó és címkéző gépek kezelői · **FEOR-08:** 8325 Csomagoló-, palackozó- és címkézőgép kezelője · ESCO `8183.7` · EN: Packaging and Filling Machine Operators and Tenders

*Piaci megnevezések (ESCO):* csomagoló-  töltőgép kezelője, csomagológép és töltőgép kezelője, fóliahegesztő gép kezelője, konzervipari és palackozó operátor, konzervipari és palackozó munkatárs, konzervipari és palackozó szalag mellett dolgozó

A csomagoló- és töltőgép kezelői olyan gépeket szolgálnak ki, amelyek élelmiszeripari termékeket készítenek és különféle csomagolásokba, például üvegbe, kartonba, konzervdobozokba és egyebekbe csomagolják.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 79.7%-a jelölte

**Holland-kód:** RCE — R 94 · I 6 · A 0 · S 0 · E 14 · C 65

**HEXACO differenciál cél-profil:** O cél 42±25 (w=0.34) · C cél 57±26 (w=0.29) · X cél 45±27 (w=0.21)

**HEXACO abszolút szint:** H 34 · E 61 · X 33 · A 34 · C 37 · O 33

### Máshová nem sorolható helyhez kötött berendezések és 8190 Egyéb, máshova nem sorolható feldolgozóipari gép gépek kezelői kezelője gépek kezelői gépek kezelői gépek kezelői gépek kezelői gépek kezelői kezelője

`51-9032.00` · **ISCO-08 8189** Máshová nem sorolható helyhez kötött berendezések és 8190 Egyéb, máshova nem sorolható feldolgozóipari gép gépek kezelői kezelője gépek kezelői gépek kezelői gépek kezelői gépek kezelői gépek kezelői kezelője · **FEOR-08:** — · ESCO `8189.2` · EN: Cutting and Slicing Machine Setters, Operators, and Tenders · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* áttekercselő-daraboló gép kezelője

Az áttekercselő-daraboló gépek kezelői gépeket állítanak be, működtetnek vagy szolgálnak ki fémből, papírból vagy más anyagokból készült lapok meghatározott méretűre vágására, hasítására, hajlítására vagy kiegyenesítésére.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 55.4%-a jelölte

**Holland-kód:** RCI — R 95 · I 10 · A 0 · S 0 · E 3 · C 58

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.29) · O cél 43±25 (w=0.27) · X cél 45±27 (w=0.19) · A cél 46±27 (w=0.15)

**HEXACO abszolút szint:** H 33 · E 63 · X 33 · A 33 · C 39 · O 34

### Máshová nem sorolható helyhez kötött berendezések és 8190 Egyéb, máshova nem sorolható feldolgozóipari gép gépek kezelői kezelője gépek kezelői gépek kezelői gépek kezelői gépek kezelői gépek kezelői kezelője

`51-9051.00` · **ISCO-08 8189** Máshová nem sorolható helyhez kötött berendezések és 8190 Egyéb, máshova nem sorolható feldolgozóipari gép gépek kezelői kezelője gépek kezelői gépek kezelői gépek kezelői gépek kezelői gépek kezelői kezelője · **FEOR-08:** — · ESCO `8189` · EN: Furnace, Kiln, Oven, Drier, and Kettle Operators and Tenders · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Operate or tend heating equipment other than basic metal, plastic, or food processing equipment. Includes activities such as annealing glass, drying lumber, curing rubber, removing moisture from materials, or boiling soap.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 55.9%-a jelölte

**Holland-kód:** RCI — R 97 · I 18 · A 0 · S 5 · E 4 · C 56

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.34) · X cél 42±25 (w=0.29) · O cél 43±25 (w=0.27)

**HEXACO abszolút szint:** H 37 · E 59 · X 34 · A 37 · C 44 · O 36

### Máshová nem sorolható helyhez kötött berendezések és 8190 Egyéb, máshova nem sorolható feldolgozóipari gép gépek kezelői kezelője gépek kezelői gépek kezelői gépek kezelői gépek kezelői gépek kezelői kezelője

`53-7011.00` · **ISCO-08 8189** Máshová nem sorolható helyhez kötött berendezések és 8190 Egyéb, máshova nem sorolható feldolgozóipari gép gépek kezelői kezelője gépek kezelői gépek kezelői gépek kezelői gépek kezelői gépek kezelői kezelője · **FEOR-08:** — · ESCO `8189` · EN: Conveyor Operators and Tenders · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Control or tend conveyors or conveyor systems that move materials or products to and from stockpiles, processing stations, departments, or vehicles. May control speed and routing of materials or products.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 70.0%-a jelölte

**Holland-kód:** RCE — R 86 · I 6 · A 0 · S 4 · E 26 · C 66

**HEXACO differenciál cél-profil:** O cél 44±26 (w=0.28) · E cél 46±28 (w=0.18) · A cél 47±28 (w=0.17) · X cél 47±28 (w=0.14)

**HEXACO abszolút szint:** H 35 · E 59 · X 35 · A 33 · C 34 · O 35

### Máshová nem sorolható helyhez kötött berendezések és 8190 Egyéb, máshova nem sorolható feldolgozóipari gép gépek kezelői kezelője gépek kezelői gépek kezelői gépek kezelői gépek kezelői gépek kezelői kezelője

`53-7063.00` · **ISCO-08 8189** Máshová nem sorolható helyhez kötött berendezések és 8190 Egyéb, máshova nem sorolható feldolgozóipari gép gépek kezelői kezelője gépek kezelői gépek kezelői gépek kezelői gépek kezelői gépek kezelői kezelője · **FEOR-08:** — · ESCO `8189` · EN: Machine Feeders and Offbearers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Feed materials into or remove materials from machines or equipment that is automatic or tended by other workers.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 73.0%-a jelölte

**Holland-kód:** RCI — R 99 · I 18 · A 0 · S 0 · E 0 · C 58

**HEXACO differenciál cél-profil:** O cél 43±25 (w=0.30) · C cél 55±27 (w=0.20) · X cél 46±27 (w=0.20) · H cél 53±28 (w=0.14)

**HEXACO abszolút szint:** H 34 · E 64 · X 32 · A 32 · C 32 · O 32

### hajómotor-összeszerelő

`51-2031.00` · **ISCO-08 8211** Mechanikai gépek összeszerelői · **FEOR-08:** 8211 Mechanikaigép-összeszerelő · ESCO `8211.7` · EN: Engine and Other Machine Assemblers

*Piaci megnevezések (ESCO):* légijármű-összeszerelő, gépjármű-összeszerelő, iparigép-összeszerelő, vasútijármű-összeszerelő

A hajómotor-összeszerelők előre gyártott alkatrészeket építenek és telepítenek motorok gyártásához mindenféle hajótípushoz, mint például elektromos motorok, atomreaktorok, gázturbinamotorok, külső motorok, kétütemű vagy négyütemű dízelmotorok, és néhány esetben a tengeri gőzmotorok.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 64.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 28 · A 4 · S 0 · E 1 · C 56

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.36) · X cél 44±26 (w=0.25) · A cél 46±27 (w=0.17) · O cél 46±27 (w=0.17)

**HEXACO abszolút szint:** H 38 · E 58 · X 36 · A 37 · C 45 · O 39

### motorkerékpár-összeszerelő

`51-2092.00` · **ISCO-08 8211** Mechanikai gépek összeszerelői · **FEOR-08:** 8211 Mechanikaigép-összeszerelő · ESCO `8211.4` · EN: Team Assemblers

*Piaci megnevezések (ESCO):* iparigép-összeszerelő, gépjármű-összeszerelő, vasútijármű-összeszerelő, hajómotor-összeszerelő

A motorkerékpár-összeszerelők motorkerékpárok részeit és alkatrészeit szerelik össze, például vázak, kerekek, motorok stb. esetében. Ehhez kézi szerszámokat, gépi meghajtású eszközöket és egyéb felszereléseket, például CNC-gépeket vagy robotokat használnak.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 81.5%-a jelölte

**Holland-kód:** RCE — R 73 · I 7 · A 10 · S 24 · E 49 · C 60

**HEXACO differenciál cél-profil:** O cél 40±23 (w=0.31) · A cél 58±24 (w=0.25) · X cél 55±27 (w=0.15) · C cél 46±28 (w=0.12)

**HEXACO abszolút szint:** H 50 · E 54 · X 51 · A 52 · C 43 · O 40

### Erős- és gyengeáramú berendezések összeszerelői

`51-2022.00` · **ISCO-08 8212** Erős- és gyengeáramú berendezések összeszerelői · **FEOR-08:** 8212 Villamosberendezés-összeszerelő · ESCO `8212` · EN: Electrical and Electronic Equipment Assemblers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* villamosberendezés-összeszerelő, elektronikai berendezés összeszerelője, elektronikaiberendezés-összeszerelő, elektronikus berendezések összeszerelője, elektronikusberendezés-összeszerelő

_(HU leírás nincs; EN:)_ Assemble or modify electrical or electronic equipment, such as computers, test equipment telemetering systems, electric motors, and batteries.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 54.7%-a jelölte

**Holland-kód:** RCI — R 100 · I 38 · A 12 · S 4 · E 0 · C 49

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.33) · X cél 44±26 (w=0.27) · O cél 47±28 (w=0.14) · H cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 37 · E 59 · X 37 · A 38 · C 45 · O 40

### elektronikus berendezések összeszerelője

`51-2023.00` · **ISCO-08 8212** Erős- és gyengeáramú berendezések összeszerelői · **FEOR-08:** 8212 Villamosberendezés-összeszerelő · ESCO `8212.3.2` · EN: Electromechanical Equipment Assemblers

*Piaci megnevezések (ESCO):* elektronikusberendezés-összeszerelő, villamosberendezés-összeszerelő, elektronikai berendezés összeszerelője, elektronikaiberendezés-összeszerelő

Az elektronikus berendezések összeszerelői felelősek az elektronikus berendezések és rendszerek összeszereléséért. Az elektromos alkatrészeket és vezetékeket tervrajzok és összeállítási rajzok szerint szerelik össze.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 52.7%-a jelölte

**Holland-kód:** RCI — R 100 · I 39 · A 7 · S 1 · E 0 · C 66

**HEXACO differenciál cél-profil:** C cél 60±24 (w=0.37) · X cél 43±25 (w=0.28) · O cél 44±26 (w=0.23)

**HEXACO abszolút szint:** H 38 · E 60 · X 35 · A 38 · C 45 · O 38

### hullámforrasztógép-kezelő

`51-4122.00` · **ISCO-08 8212** Erős- és gyengeáramú berendezések összeszerelői · **FEOR-08:** 8212 Villamosberendezés-összeszerelő · ESCO `8212.5` · EN: Welding, Soldering, and Brazing Machine Setters, Operators, and Tenders

*Piaci megnevezések (ESCO):* hullámforrasztó

A hullámforrasztógép-kezelők gépeket állítanak be és működtetnek elektronikus alkatrészek nyomtatott áramköri lapokra forrasztására. Áttekintik a tervrajzokat és az elrendezési terveket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 35.8%-a jelölte

**Holland-kód:** RCI — R 100 · I 17 · A 5 · S 2 · E 8 · C 48

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.33) · A cél 44±26 (w=0.24) · X cél 45±27 (w=0.20) · O cél 47±28 (w=0.11)

**HEXACO abszolút szint:** H 37 · E 58 · X 37 · A 36 · C 44 · O 41

### Mozdonyvezetők

`53-4041.00` · **ISCO-08 8311** Mozdonyvezetők · **FEOR-08:** 8411 Mozdonyvezető; 8414 Metróvezető · ESCO `8311.1` · EN: Subway and Streetcar Operators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* mozdonyvezető

A mozdonyvezetők személyszállítási vagy árufuvarozási szolgáltatásokat nyújtó vonatokat üzemeltetnek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 86.5%-a jelölte

**Holland-kód:** RCS — R 82 · I 6 · A 0 · S 30 · E 21 · C 54

**HEXACO differenciál cél-profil:** O cél 31±17 (w=0.45) · E cél 42±24 (w=0.19) · H cél 55±27 (w=0.11) · A cél 55±27 (w=0.11)

**HEXACO abszolút szint:** H 49 · E 47 · X 45 · A 49 · C 50 · O 33

### Személy- és tehergépkocsi-vezetők, taxisofőrök

`53-3031.00` · **ISCO-08 8322** Személy- és tehergépkocsi-vezetők, taxisofőrök · **FEOR-08:** 8416 Személygépkocsi-vezető · ESCO `8322.2` · EN: Driver/Sales Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* futár, kézbesítő, biciklis futár

A futárok motorkerékpárt, személygépkocsit vagy kisteherautót vezetve árukat és csomagokat szállítanak meghatározott helyekre.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 64.0%-a jelölte

**Holland-kód:** RCE — R 72 · I 0 · A 0 · S 24 · E 44 · C 61

**HEXACO differenciál cél-profil:** O cél 39±22 (w=0.47) · X cél 58±25 (w=0.34) · H cél 52±28 (w=0.10)

**HEXACO abszolút szint:** H 49 · E 51 · X 54 · A 48 · C 46 · O 40

### Személy- és tehergépkocsi-vezetők, taxisofőrök

`53-3033.00` · **ISCO-08 8322** Személy- és tehergépkocsi-vezetők, taxisofőrök · **FEOR-08:** 8416 Személygépkocsi-vezető · ESCO `8322.7` · EN: Light Truck Drivers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* taxis, mikrobuszvezető, páncélozott gépjármű vezetője, biztonsági őr, páncélautó-vezető, futár

A taxisok engedéllyel rendelkező magán utasszállító járműveket üzemeltetnek, törődnek az ügyfelekkel, viteldíjakat számítanak fel és elvégzik a járművek szervizelését.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 74.0%-a jelölte

**Holland-kód:** RCE — R 98 · I 9 · A 0 · S 6 · E 18 · C 57

**HEXACO differenciál cél-profil:** O cél 37±21 (w=0.47) · H cél 58±25 (w=0.28) · C cél 54±28 (w=0.13)

**HEXACO abszolút szint:** H 47 · E 55 · X 42 · A 42 · C 44 · O 35

### személyzeti parkoltató

`53-6021.00` · **ISCO-08 8322** Személy- és tehergépkocsi-vezetők, taxisofőrök · **FEOR-08:** 8416 Személygépkocsi-vezető · ESCO `8322.4` · EN: Parking Attendants

*Piaci megnevezések (ESCO):* londíner, parkoltató

A személyzeti parkoltatók az ügyfelek számára nyújtanak segítséget, járműveik meghatározott parkolóhelyre szállításával. Segítséget nyújthatnak az ügyfelek poggyászának kezelésében is, és tájékoztatást nyújtanak a parkolási díjakról.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 60.8%-a jelölte

**Holland-kód:** RCE — R 77 · I 0 · A 2 · S 34 · E 35 · C 68

**HEXACO differenciál cél-profil:** H cél 64±21 (w=0.28) · O cél 36±21 (w=0.28) · A cél 60±24 (w=0.19) · C cél 41±24 (w=0.17)

**HEXACO abszolút szint:** H 50 · E 57 · X 45 · A 48 · C 31 · O 33

### taxis

`53-3054.00` · **ISCO-08 8322** Személy- és tehergépkocsi-vezetők, taxisofőrök · **FEOR-08:** 8416 Személygépkocsi-vezető · ESCO `8322.7` · EN: Taxi Drivers

*Piaci megnevezések (ESCO):* mikrobuszvezető, halottaskocsi-vezető, páncélozott gépjármű vezetője, biztonsági őr, páncélautó-vezető, betegszállító autó vezetője

A taxisok engedéllyel rendelkező magán utasszállító járműveket üzemeltetnek, törődnek az ügyfelekkel, viteldíjakat számítanak fel és elvégzik a járművek szervizelését.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: —

**Holland-kód:** RCS — R 79 · I 2 · A 0 · S 30 · E 25 · C 63

**HEXACO differenciál cél-profil:** O cél 40±24 (w=0.28) · A cél 59±24 (w=0.26) · E cél 43±25 (w=0.20) · H cél 56±26 (w=0.16)

**HEXACO abszolút szint:** H 48 · E 49 · X 45 · A 51 · C 40 · O 39

### autóbuszvezető

`53-3051.00` · **ISCO-08 8331** Autóbusz- és villamosvezetők · **FEOR-08:** 8413 Villamosvezető; 8415 Trolibuszvezető; 8418 Autóbuszvezető · ESCO `8331.1` · EN: Bus Drivers, School

*Piaci megnevezések (ESCO):* buszsofőr, buszvezető, villamosvezető, metróvezető

Az autóbuszvezetők buszokat és távolsági buszokat üzemeltetnek, viteldíjakat szednek és felelnek az utasokért.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 59.3%-a jelölte

**Holland-kód:** RCS — R 75 · I 10 · A 4 · S 58 · E 20 · C 62

**HEXACO differenciál cél-profil:** O cél 28±15 (w=0.42) · H cél 64±21 (w=0.26) · A cél 60±24 (w=0.18)

**HEXACO abszolút szint:** H 59 · E 51 · X 48 · A 56 · C 50 · O 34

### autóbuszvezető

`53-3052.00` · **ISCO-08 8331** Autóbusz- és villamosvezetők · **FEOR-08:** 8413 Villamosvezető; 8415 Trolibuszvezető; 8418 Autóbuszvezető · ESCO `8331.1` · EN: Bus Drivers, Transit and Intercity

*Piaci megnevezések (ESCO):* buszsofőr, buszvezető, villamosvezető, metróvezető

Az autóbuszvezetők buszokat és távolsági buszokat üzemeltetnek, viteldíjakat szednek és felelnek az utasokért.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 83.8%-a jelölte

**Holland-kód:** RCS — R 82 · I 0 · A 0 · S 43 · E 30 · C 62

**HEXACO differenciál cél-profil:** O cél 30±17 (w=0.43) · A cél 62±22 (w=0.26) · H cél 59±24 (w=0.19)

**HEXACO abszolút szint:** H 55 · E 49 · X 48 · A 57 · C 49 · O 35

### Kamion- és teherautósofőrök

`53-3032.00` · **ISCO-08 8332** Kamion- és teherautósofőrök · **FEOR-08:** 8417 Tehergépkocsi-vezető, kamionsofőr; 8423 Köztisztasági, településtisztasági gép kezelője · ESCO `8332` · EN: Heavy and Tractor-Trailer Truck Drivers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* tehergépkocsi-vezető, kamionsofőr, kamionsofőr, tehergépkocsi-vezető, veszélyes árut szállító jármű vezetője, robbanásveszélyes árut szállító jármű vezetője, nemzetközi tartályos adr-es gépkocsivezető

_(HU leírás nincs; EN:)_ Drive a tractor-trailer combination or a truck with a capacity of at least 26,001 pounds Gross Vehicle Weight (GVW). May be required to unload truck. Requires commercial drivers' license.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 54.3%-a jelölte

**Holland-kód:** RCI — R 100 · I 15 · A 0 · S 6 · E 5 · C 52

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.26) · O cél 42±24 (w=0.24) · E cél 42±25 (w=0.23) · X cél 45±26 (w=0.15)

**HEXACO abszolút szint:** H 45 · E 49 · X 41 · A 43 · C 52 · O 39

### Kamion- és teherautósofőrök

`53-7051.00` · **ISCO-08 8332** Kamion- és teherautósofőrök · **FEOR-08:** 8417 Tehergépkocsi-vezető, kamionsofőr; 8423 Köztisztasági, településtisztasági gép kezelője · ESCO `8332.7` · EN: Industrial Truck and Tractor Operators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* költöztető tehergépkocsi vezetője, kamionsofőr, tehergépkocsi-vezető, tehergépkocsi-vezető, kamionsofőr

A költöztető tehergépkocsik vezetői tehergépjárműveket vagy teherautókat üzemeltetnek áruk, tárgyak, gépek és egyebek áttelepítésére és szállítására.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 73.4%-a jelölte

**Holland-kód:** RCI — R 100 · I 13 · A 0 · S 2 · E 4 · C 45

**HEXACO differenciál cél-profil:** O cél 42±25 (w=0.36) · C cél 55±27 (w=0.21) · X cél 46±27 (w=0.17) · E cél 47±28 (w=0.14)

**HEXACO abszolút szint:** H 37 · E 58 · X 36 · A 37 · C 38 · O 34

### Földmozgató és hasonló gépek kezelői

`47-2071.00` · **ISCO-08 8342** Földmozgató és hasonló gépek kezelői · **FEOR-08:** 8422 Földmunkagép és hasonló könnyű- és nehézgép kezelője · ESCO `8342.1` · EN: Paving, Surfacing, and Tamping Equipment Operators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* buldózerkezelő, munkagépkezelő, markológép-kezelő, exkavátorkezelő, markológép kezelője, földgyalukezelő

A buldózerkezelők nehézgépjárműveket üzemeltetnek a föld, a törmelék és egyéb anyagok talajon történő mozgatásához.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 41.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 12 · A 0 · S 0 · E 0 · C 45

**HEXACO differenciál cél-profil:** O cél 42±25 (w=0.40) · E cél 45±26 (w=0.28) · C cél 54±27 (w=0.23)

**HEXACO abszolút szint:** H 37 · E 56 · X 38 · A 38 · C 37 · O 35

### Földmozgató és hasonló gépek kezelői

`47-2073.00` · **ISCO-08 8342** Földmozgató és hasonló gépek kezelői · **FEOR-08:** 8422 Földmunkagép és hasonló könnyű- és nehézgép kezelője · ESCO `8342.1` · EN: Operating Engineers and Other Construction Equipment Operators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* buldózerkezelő, munkagépkezelő, markológép-kezelő, exkavátorkezelő, markológép kezelője, földgyalukezelő

A buldózerkezelők nehézgépjárműveket üzemeltetnek a föld, a törmelék és egyéb anyagok talajon történő mozgatásához.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 81.7%-a jelölte

**Holland-kód:** RCI — R 100 · I 32 · A 0 · S 2 · E 4 · C 48

**HEXACO differenciál cél-profil:** E cél 41±24 (w=0.31) · O cél 42±24 (w=0.30) · C cél 57±25 (w=0.25)

**HEXACO abszolút szint:** H 42 · E 49 · X 43 · A 44 · C 47 · O 40

### Földmozgató és hasonló gépek kezelői

`47-4091.00` · **ISCO-08 8342** Földmozgató és hasonló gépek kezelői · **FEOR-08:** 8422 Földmunkagép és hasonló könnyű- és nehézgép kezelője · ESCO `8342.6` · EN: Segmental Pavers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* útépítő, aszfaltozó, munkagépkezelő

Az útépítők útépítést végeznek földmunkák segítségével, utak alépítményei és burkolati részén dolgozva. Az összetömörített talajt egy vagy több réteggel fedik le.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 58.9%-a jelölte

**Holland-kód:** RCA — R 99 · I 10 · A 16 · S 5 · E 4 · C 40

**HEXACO differenciál cél-profil:** C cél 56±26 (w=0.36) · O cél 44±26 (w=0.31) · A cél 47±28 (w=0.17) · X cél 48±29 (w=0.10)

**HEXACO abszolút szint:** H 37 · E 60 · X 38 · A 37 · C 40 · O 37

### toronydaru-kezelő

`53-7021.00` · **ISCO-08 8343** Daruk, emelők és hasonló gépek kezelői · **FEOR-08:** 8424 Daru, felvonó és hasonló anyagmozgató gép kezelője · ESCO `8343.5` · EN: Crane and Tower Operators

*Piaci megnevezések (ESCO):* építődaru-kezelő, konténerdaru kezelője, darukormányos, darukezelő, mobildaru-kezelő, autódarus

A toronydaru-kezelők toronydaruval, egy magas függőleges szerkezetre szerelt vízszintes karral, a szükséges motorokkal és a karra csatlakoztatott emelőkampóval dolgoznak.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 60.6%-a jelölte

**Holland-kód:** RCI — R 100 · I 20 · A 0 · S 3 · E 5 · C 49

**HEXACO differenciál cél-profil:** O cél 36±21 (w=0.38) · C cél 59±24 (w=0.24) · E cél 45±27 (w=0.14) · X cél 45±27 (w=0.13)

**HEXACO abszolút szint:** H 41 · E 54 · X 38 · A 40 · C 48 · O 33


## 9 — Szakképzettséget nem igénylő (egyszerű) foglalkozások

### Háztartási takarítók és kisegítők

`37-2012.00` · **ISCO-08 9111** Háztartási takarítók és kisegítők · **FEOR-08:** 9111 Háztartási takarító és kisegítő · ESCO `9111.1` · EN: Maids and Housekeeping Cleaners · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* háztartási takarító, szobalány, háztartási takarító és kisegítő

A háztartási takarítók minden szükséges takarítási tevékenységet elvégeznek az ügyfelek lakásainak kitakarítása érdekében.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 44.6%-a jelölte

**Holland-kód:** RCS — R 85 · I 0 · A 6 · S 25 · E 8 · C 60

**HEXACO differenciál cél-profil:** H cél 63±21 (w=0.42) · O cél 40±24 (w=0.30) · E cél 55±27 (w=0.15)

**HEXACO abszolút szint:** H 46 · E 63 · X 37 · A 38 · C 32 · O 33

### Irodai, szállodai és egyéb intézményi takarítók és kisegítők

`37-2011.00` · **ISCO-08 9112** Irodai, szállodai és egyéb intézményi takarítók és kisegítők · **FEOR-08:** 9112 Intézményi takarító és kisegítő · ESCO `9112.2` · EN: Janitors and Cleaners, Except Maids and Housekeeping Cleaners · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* épülettakarító, intézményi takarító és kisegítő, kórházi takarító, vonattakarító, vasútikocsi-takarító, illemhelykezelő

Az épülettakarítók különböző típusú épületek, például irodák, kórházak és közintézmények tisztaságát biztosítják és általános működését tartják karban. Takarítási feladatokat látnak el, mint pl.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 62.4%-a jelölte

**Holland-kód:** RCS — R 96 · I 2 · A 0 · S 18 · E 11 · C 60

**HEXACO differenciál cél-profil:** H cél 59±24 (w=0.38) · O cél 42±25 (w=0.31) · X cél 47±28 (w=0.11) · C cél 53±28 (w=0.11)

**HEXACO abszolút szint:** H 41 · E 62 · X 35 · A 36 · C 33 · O 34

### járműtakarító

`53-7061.00` · **ISCO-08 9122** Járműtakarítók · **FEOR-08:** 9114 Járműtakarító · ESCO `9122.1` · EN: Cleaners of Vehicles and Equipment

*Piaci megnevezések (ESCO):* takarító, autómosó

A járműtakarítók a járművek külső és belső részeinek felületeit tisztítják és polírozzák.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 54.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 2 · A 0 · S 1 · E 0 · C 51

**HEXACO differenciál cél-profil:** O cél 44±26 (w=0.32) · H cél 54±27 (w=0.20) · C cél 53±28 (w=0.17) · A cél 47±28 (w=0.13)

**HEXACO abszolút szint:** H 35 · E 65 · X 34 · A 32 · C 30 · O 33

### Mélyépítő segédmunkások

`47-2061.00` · **ISCO-08 9312** Mélyépítő segédmunkások · **FEOR-08:** 9321 Kubikos · ESCO `9312.1.6` · EN: Construction Laborers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* mélyépítő technikus

A mélyépítő technikusok feladatokat látnak el a mélyépítési projektek építési területeinek megtisztításával és előkészítésével kapcsolatban. Ide tartozik az utak, vasutak és gátak építésére és karbantartására irányuló munka is.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 34.9%-a jelölte

**Holland-kód:** RCI — R 100 · I 28 · A 6 · S 4 · E 6 · C 44

**HEXACO differenciál cél-profil:** O cél 42±25 (w=0.32) · E cél 44±26 (w=0.25) · C cél 55±27 (w=0.20) · X cél 47±28 (w=0.11)

**HEXACO abszolút szint:** H 40 · E 53 · X 40 · A 42 · C 40 · O 37

### Mélyépítő segédmunkások

`47-4051.00` · **ISCO-08 9312** Mélyépítő segédmunkások · **FEOR-08:** 9321 Kubikos · ESCO `9312.1.3` · EN: Highway Maintenance Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* mélyépítő technikus

A mélyépítő technikusok feladatokat látnak el a mélyépítési projektek építési területeinek megtisztításával és előkészítésével kapcsolatban. Ide tartozik az utak, vasutak és gátak építésére és karbantartására irányuló munka is.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 88.3%-a jelölte

**Holland-kód:** RCS — R 100 · I 12 · A 1 · S 13 · E 8 · C 42

**HEXACO differenciál cél-profil:** O cél 39±23 (w=0.30) · C cél 57±25 (w=0.19) · A cél 56±26 (w=0.17) · E cél 44±26 (w=0.16)

**HEXACO abszolút szint:** H 37 · E 54 · X 39 · A 44 · C 43 · O 35

### kézi csomagoló

`53-7064.00` · **ISCO-08 9321** Kézi csomagolók · **FEOR-08:** 9225 Kézi csomagoló · ESCO `9321.2` · EN: Packers and Packagers, Hand

*Piaci megnevezések (ESCO):* ruhaipari végkikészítő, endliző, textilipari eldolgozó

A kézi csomagolók kézzel gyűjtik, csomagolják és címkézik az árukat és az anyagokat. Biztosítják, hogy minden árut és anyagot a használati utasításoknak és követelményeknek megfelelően csomagolnak.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 53.8%-a jelölte

**Holland-kód:** RCE — R 76 · I 6 · A 8 · S 6 · E 21 · C 74

**HEXACO differenciál cél-profil:** O cél 43±25 (w=0.30) · C cél 55±27 (w=0.20) · X cél 47±28 (w=0.14) · A cél 47±28 (w=0.14)

**HEXACO abszolút szint:** H 34 · E 65 · X 33 · A 32 · C 33 · O 32

### Rakodómunkások

`53-7062.00` · **ISCO-08 9333** Rakodómunkások · **FEOR-08:** 9223 Rakodómunkás · ESCO `9333.4` · EN: Laborers and Freight, Stock, and Material Movers, Hand · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* költöztető, irodaköltöztető, szállító-költöztető, anyagmozgató, raktári munkás, kézi rakodó

A költöztetők felelősek olyan áruk és tárgyak fizikai kezeléséért, amelyeket egyik helyről a másikra kell áthelyezni vagy átszállítani.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 88.9%-a jelölte

**Holland-kód:** RCE — R 84 · I 2 · A 0 · S 8 · E 17 · C 66

**HEXACO differenciál cél-profil:** O cél 43±26 (w=0.38) · H cél 55±27 (w=0.26) · C cél 53±28 (w=0.15) · X cél 48±28 (w=0.13)

**HEXACO abszolút szint:** H 38 · E 61 · X 36 · A 36 · C 32 · O 34

### Rakodómunkások

`53-7065.00` · **ISCO-08 9333** Rakodómunkások · **FEOR-08:** 9223 Rakodómunkás · ESCO `9333.8.1` · EN: Stockers and Order Fillers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* raktáros, raktári munkás, raktári csomagoló

A raktárosok raktárban lévő anyagok pontos kezelését, csomagolását és tárolását végzik. Árukat fogadnak, címkével látják el őket, ellenőrzik a minőséget, tárolják az árukat, és dokumentálják az esetleges károkat.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 56.6%-a jelölte

**Holland-kód:** CRE — R 63 · I 0 · A 0 · S 15 · E 38 · C 88

**HEXACO differenciál cél-profil:** O cél 39±23 (w=0.42) · H cél 57±26 (w=0.27) · A cél 54±28 (w=0.15)

**HEXACO abszolút szint:** H 44 · E 59 · X 42 · A 43 · C 37 · O 35

### Gyorsételek készítői

`35-2011.00` · **ISCO-08 9411** Gyorsételek készítői · **FEOR-08:** 9235 Gyorséttermi eladó · ESCO `9411` · EN: Cooks, Fast Food · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gyorskiszolgáló éttermi személyzet, gyorséttermi személyzet, gyorskiszolgáló étterem személyzetének tagja

_(HU leírás nincs; EN:)_ Prepare and cook food in a fast food restaurant with a limited menu. Duties of these cooks are limited to preparation of a few basic items and normally involve operating large-volume single-purpose cooking equipment.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 58.0%-a jelölte

**Holland-kód:** RCE — R 89 · I 6 · A 14 · S 24 · E 39 · C 55

**HEXACO differenciál cél-profil:** O cél 39±23 (w=0.39) · A cél 58±25 (w=0.27) · E cél 43±26 (w=0.24)

**HEXACO abszolút szint:** H 37 · E 55 · X 38 · A 42 · C 32 · O 32

### Gyorsételek készítői

`35-3023.00` · **ISCO-08 9411** Gyorsételek készítői · **FEOR-08:** 9235 Gyorséttermi eladó · ESCO `9411` · EN: Fast Food and Counter Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gyorskiszolgáló éttermi személyzet, gyorséttermi személyzet, gyorskiszolgáló étterem személyzetének tagja

_(HU leírás nincs; EN:)_ Perform duties such as taking orders and serving food and beverages. Serve customers at counter or from a steam table. May take payment. May prepare food and beverages.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 56.3%-a jelölte

**Holland-kód:** CRS — R 64 · I 0 · A 8 · S 41 · E 41 · C 66

**HEXACO differenciál cél-profil:** O cél 36±20 (w=0.29) · A cél 63±21 (w=0.26) · H cél 60±23 (w=0.20) · C cél 42±24 (w=0.17)

**HEXACO abszolút szint:** H 48 · E 56 · X 46 · A 50 · C 30 · O 34

### Konyhai kisegítők

`35-2021.00` · **ISCO-08 9412** Konyhai kisegítők · **FEOR-08:** 9236 Konyhai kisegítő · ESCO `9412.1` · EN: Food Preparation Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* konyhai kisegítő, konyhai dolgozó, étkezdei kisegítő

A konyhai kisegítők segítséget nyújtanak az ételek elkészítéséhez és a konyha takarításában.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 69.5%-a jelölte

**Holland-kód:** RCS — R 90 · I 6 · A 15 · S 28 · E 20 · C 53

**HEXACO differenciál cél-profil:** O cél 40±24 (w=0.36) · H cél 56±26 (w=0.21) · A cél 54±27 (w=0.17) · X cél 46±28 (w=0.14)

**HEXACO abszolút szint:** H 41 · E 58 · X 37 · A 40 · C 36 · O 34

### Konyhai kisegítők

`35-9021.00` · **ISCO-08 9412** Konyhai kisegítők · **FEOR-08:** 9236 Konyhai kisegítő · ESCO `9412.2` · EN: Dishwashers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* ételkiosztó tálaló konyhai kisegítő, konyhai dolgozó, konyhai kisegítő

Az ételkiosztó tálaló konyhai kisegítők a konyhai területeket tisztítják, beleértve az edények, serpenyők, főzőeszközök, evőeszközök és tányérok mosogatását.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 55.9%-a jelölte

**Holland-kód:** RCS — R 100 · I 0 · A 0 · S 14 · E 7 · C 58

**HEXACO differenciál cél-profil:** O cél 43±25 (w=0.33) · A cél 54±28 (w=0.17) · H cél 53±28 (w=0.16) · X cél 47±28 (w=0.14)

**HEXACO abszolút szint:** H 35 · E 61 · X 33 · A 36 · C 29 · O 32

### hulladékgyűjtő

`53-7081.00` · **ISCO-08 9611** Hulladékgyűjtők · **FEOR-08:** 9211 Szemétgyűjtő, utcaseprő · ESCO `9611.1` · EN: Refuse and Recyclable Material Collectors

*Piaci megnevezések (ESCO):* szemétgyűjtő, hulladékgyűjtő és szelektív-hulladékgyűjtő

A hulladékgyűjtők eltávolítják a hulladékot az otthonokból és más létesítményekből, és szemétgyűjtő tehergépkocsiba rakják, hogy azt a hulladékkezelő és -ártalmatlanító létesítménybe szállítsák.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 81.5%-a jelölte

**Holland-kód:** RCI — R 100 · I 14 · A 0 · S 5 · E 6 · C 59

**HEXACO differenciál cél-profil:** O cél 43±25 (w=0.34) · H cél 54±27 (w=0.20) · E cél 46±28 (w=0.17) · X cél 47±28 (w=0.15)

**HEXACO abszolút szint:** H 38 · E 58 · X 36 · A 37 · C 34 · O 35

### Kézbesítők, csomagkihordók és hordárok

`43-5021.00` · **ISCO-08 9621** Kézbesítők, csomagkihordók és hordárok · **FEOR-08:** 9233 Hivatalsegéd, kézbesítő; 9234 Hordár, csomagkihordó · ESCO `9621` · EN: Couriers and Messengers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Pick up and deliver messages, documents, packages, and other items between offices or departments within an establishment or directly to other business concerns, traveling by foot, bicycle, motorcycle, automobile, or public conveyance.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 74.3%-a jelölte

**Holland-kód:** CRS — R 58 · I 1 · A 0 · S 33 · E 31 · C 68

**HEXACO differenciál cél-profil:** O cél 38±22 (w=0.45) · H cél 60±23 (w=0.40) · A cél 53±28 (w=0.11)

**HEXACO abszolút szint:** H 49 · E 55 · X 44 · A 44 · C 41 · O 36

### Alkalmi munkások

`49-9071.00` · **ISCO-08 9622** Alkalmi munkások · **FEOR-08:** — · ESCO `9622.1` · EN: Maintenance and Repair Workers, General · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* karbantartó, szerelő, épületkarbantartó technikus

A karbantartók különböző karbantartási és javítási tevékenységeket végeznek épületek, területek és egyéb létesítmények részére.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 63.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 26 · A 3 · S 12 · E 9 · C 53

**HEXACO differenciál cél-profil:** C cél 56±26 (w=0.23) · H cél 45±26 (w=0.23) · O cél 55±27 (w=0.21) · X cél 47±28 (w=0.13)

**HEXACO abszolút szint:** H 43 · E 51 · X 45 · A 46 · C 51 · O 51

### Máshová nem sorolható képesítést nem igénylő foglalkozásúaki foglalkozásúaki és szállítási foglalkozású

`39-3031.00` · **ISCO-08 9629** Máshová nem sorolható képesítést nem igénylő foglalkozásúaki foglalkozásúaki és szállítási foglalkozású · **FEOR-08:** 9237 Háztartási alkalmazott; 9239 Egyéb, máshova nem sorolható egyszerű szolgáltatási · ESCO `9629.7` · EN: Ushers, Lobby Attendants, and Ticket Takers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* jegyszedő, hivatalsegéd, színházi ültető, szórakoztatóparki és rekreációs munkatárs, attrakcióműködtető, vidámparki alkalmazott

A jegyszedők a látogatókat segítik olyan nagyméretű épületekben, mint pl. színház, stadion vagy koncertterem. Ellenőrzik a látogatók jegyeit az engedélyezett hozzáférések szempontjából, megmutatják a helyeikre vezető utat, és válaszolnak a kérdésekre.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 61.4%-a jelölte

**Holland-kód:** CSE — R 37 · I 0 · A 7 · S 62 · E 53 · C 62

**HEXACO differenciál cél-profil:** A cél 66±19 (w=0.24) · C cél 35±20 (w=0.23) · O cél 37±21 (w=0.20) · H cél 63±22 (w=0.19)

**HEXACO abszolút szint:** H 55 · E 55 · X 52 · A 56 · C 30 · O 37

### szórakoztatóparki és rekreációs munkatárs

`39-3091.00` · **ISCO-08 9629** Máshová nem sorolható képesítést nem igénylő foglalkozásúaki foglalkozásúaki és szállítási foglalkozású · **FEOR-08:** 9237 Háztartási alkalmazott; 9239 Egyéb, máshova nem sorolható egyszerű szolgáltatási · ESCO `9629.2` · EN: Amusement and Recreation Attendants

*Piaci megnevezések (ESCO):* attrakcióműködtető, vidámparki alkalmazott, attrakciófelelős, jegyszedő, hivatalsegéd, színházi ültető

A szórakoztatóparki és rekreációs munkatársak különféle feladatokat látnak el a szórakozóparkokban vagy rekreációs létesítményekben.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 64.2%-a jelölte

**Holland-kód:** CSR — R 54 · I 0 · A 11 · S 56 · E 47 · C 62

**HEXACO differenciál cél-profil:** O cél 35±20 (w=0.31) · H cél 61±23 (w=0.22) · C cél 42±24 (w=0.17) · A cél 57±25 (w=0.15)

**HEXACO abszolút szint:** H 49 · E 56 · X 47 · A 47 · C 32 · O 32


---

# II. rész — niche (T3, 375 tétel)

Létezik Magyarországon, de nagyon szűk szegmens. Az adat megvan, a termék listájába első körben nem kerül be — te dönthetsz róla az Excelben.

## 1 — Vezetők, felsővezetők

### Máshová nem sorolható üzleti és igazgatási vezetők

`11-9199.08` · **ISCO-08 1219** Máshová nem sorolható üzleti és igazgatási vezetők · **FEOR-08:** 1419 Egyéb gazdasági tevékenységet segítő egység vezetője · ESCO `1219.1.2` · EN: Loss Prevention Managers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* üzleti szolgáltatási vezető, aktuáriusi tanácsadó szolgálat vezetője, reklámügynökség vezetője

Az üzleti szolgáltatások vezetői felelősek a vállalkozásoknak nyújtott szakmai szolgáltatásokért. Megszervezik az ügyfél igényeire szabott szolgáltatásokat, és kapcsolatot tartanak az ügyfelekkel, hogy megállapodjanak a két fél szerződéses kötelezettségeiről.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 54.5%-a jelölte

**Holland-kód:** CEI — R 40 · I 44 · A 0 · S 31 · E 77 · C 81

**HEXACO differenciál cél-profil:** H cél 41±24 (w=0.22) · A cél 41±24 (w=0.21) · C cél 58±25 (w=0.20) · X cél 57±25 (w=0.18)

**HEXACO abszolút szint:** H 49 · E 42 · X 59 · A 50 · C 65 · O 52

### Mezőgazdasági és erdőgazdálkodási termelési vezetők 1311 Mezőgazdasági, erdészeti, halászati és vadászati

`11-9013.00` · **ISCO-08 1311** Mezőgazdasági és erdőgazdálkodási termelési vezetők 1311 Mezőgazdasági, erdészeti, halászati és vadászati · **FEOR-08:** — · ESCO `1311` · EN: Farmers, Ranchers, and Other Agricultural Managers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Plan, direct, or coordinate the management or operation of farms, ranches, greenhouses, aquacultural operations, nurseries, timber tracts, or other agricultural establishments.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** ERC — R 69 · I 29 · A 1 · S 27 · E 75 · C 59

**HEXACO differenciál cél-profil:** A cél 38±22 (w=0.26) · X cél 62±22 (w=0.26) · H cél 42±24 (w=0.18) · E cél 43±25 (w=0.15)

**HEXACO abszolút szint:** H 49 · E 43 · X 60 · A 46 · C 55 · O 55

### Gyermekgondozási szolgáltatások vezetői

`11-9031.00` · **ISCO-08 1341** Gyermekgondozási szolgáltatások vezetői · **FEOR-08:** 1325 Gyermekgondozási tevékenységet folytató egység vezetője · ESCO `1341.1` · EN: Education and Childcare Administrators, Preschool and Daycare · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gyermekgondozási koordinátor, szünidei tevékenységek koordinátora, napközis koordinátor, gyermeknapközi vezetője, óvodavezető, óvoda vezetője

A gyermekgondozással foglalkozó koordinátorok a gyermekgondozási szolgáltatásokat, tevékenységeket és rendezvényeket szervezik az iskolaidő után és az iskolaidő alatt.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 31.9%-a jelölte

**Holland-kód:** SEC — R 3 · I 32 · A 30 · S 91 · E 64 · C 59

**HEXACO differenciál cél-profil:** C cél 39±23 (w=0.27) · X cél 59±24 (w=0.24) · A cél 56±26 (w=0.16) · O cél 45±26 (w=0.14)

**HEXACO abszolút szint:** H 66 · E 42 · X 68 · A 66 · C 56 · O 55

### Oktatási vezetők

`11-9033.00` · **ISCO-08 1345** Oktatási vezetők · **FEOR-08:** 1328 Oktatási-nevelési tevékenységet folytató egység vezetője · ESCO `1345.1.3` · EN: Education Administrators, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* iskolaigazgató, iskolavezető, oktatási igazgató

Az iskolaigazgatók irányítják az oktatási intézmények napi tevékenységeit. Döntéseket hoznak a felvételi eljárással kapcsolatban, felelnek a tantervi normák betartásáért, amelyek megkönnyítik a tanulók számára a tudományos fejlődést.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 47.9%-a jelölte

**Holland-kód:** SEC — R 0 · I 47 · A 30 · S 77 · E 72 · C 65

**HEXACO differenciál cél-profil:** X cél 64±21 (w=0.36) · C cél 41±24 (w=0.24) · H cél 44±26 (w=0.15) · O cél 55±27 (w=0.12)

**HEXACO abszolút szint:** H 58 · E 43 · X 69 · A 62 · C 55 · O 62

### Máshová nem sorolható szakmai szolgáltatások vezetői 1329 Egyéb szolgáltatást nyújtó egység vezetője

`11-9131.00` · **ISCO-08 1349** Máshová nem sorolható szakmai szolgáltatások vezetői 1329 Egyéb szolgáltatást nyújtó egység vezetője · **FEOR-08:** — · ESCO `1349` · EN: Postmasters and Mail Superintendents · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Plan, direct, or coordinate operational, administrative, management, and support services of a U.S. post office; or coordinate activities of workers engaged in postal and related work in assigned post office.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 62.1%-a jelölte

**Holland-kód:** ECS — R 19 · I 5 · A 3 · S 39 · E 83 · C 78

**HEXACO differenciál cél-profil:** X cél 64±21 (w=0.39) · O cél 38±22 (w=0.35) · E cél 55±26 (w=0.15)

**HEXACO abszolút szint:** H 56 · E 50 · X 62 · A 54 · C 54 · O 44

### Máshová nem sorolható szakmai szolgáltatások vezetői 1329 Egyéb szolgáltatást nyújtó egység vezetője

`33-1011.00` · **ISCO-08 1349** Máshová nem sorolható szakmai szolgáltatások vezetői 1329 Egyéb szolgáltatást nyújtó egység vezetője · **FEOR-08:** — · ESCO `1349.9` · EN: First-Line Supervisors of Correctional Officers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* kereskedelmi galéria vezetője, művészeti galéria vezetője, galériai programvezető

A kereskedelmi galériák vezetői biztosítják a galéria kereskedelmi és művészeti sikerét.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 59.0%-a jelölte

**Holland-kód:** ECS — R 43 · I 13 · A 0 · S 59 · E 89 · C 68

**HEXACO differenciál cél-profil:** O cél 35±20 (w=0.37) · E cél 38±22 (w=0.29) · X cél 57±25 (w=0.18)

**HEXACO abszolút szint:** H 57 · E 37 · X 59 · A 54 · C 59 · O 43

### rekreációs központ vezetője

`11-9071.00` · **ISCO-08 1431** Sport-, rekreációs és kulturális központok vezetői · **FEOR-08:** 1335 Kulturális tevékenységet folytató egység vezetője; 1336 Sport- és rekreációs tevékenységet folytató egység vezetője · ESCO `1431.2.3` · EN: Gambling Managers

*Piaci megnevezések (ESCO):* üdülőközpont vezetője, vidámpark vezetője

A rekreációs központok vezetői irányítják a szabadidős szolgáltatásokat nyújtó létesítmények, például a kertek, a fürdők, az állatkertek, a szerencsejáték- és lottólétesítmények üzemeltetését.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 56.5%-a jelölte

**Holland-kód:** ECS — R 30 · I 6 · A 2 · S 31 · E 96 · C 74

**HEXACO differenciál cél-profil:** X cél 65±20 (w=0.34) · H cél 40±23 (w=0.23) · E cél 43±25 (w=0.16) · O cél 44±26 (w=0.14)

**HEXACO abszolút szint:** H 48 · E 41 · X 64 · A 56 · C 53 · O 49

### rekreációs központ vezetője

`11-9072.00` · **ISCO-08 1431** Sport-, rekreációs és kulturális központok vezetői · **FEOR-08:** 1335 Kulturális tevékenységet folytató egység vezetője; 1336 Sport- és rekreációs tevékenységet folytató egység vezetője · ESCO `1431.2.3` · EN: Entertainment and Recreation Managers, Except Gambling

*Piaci megnevezések (ESCO):* üdülőközpont vezetője, vidámpark vezetője, kulturális létesítmény vezetője, sportlétesítmény vezetője, uszodaigazgató, fitneszklub vezetője

A rekreációs központok vezetői irányítják a szabadidős szolgáltatásokat nyújtó létesítmények, például a kertek, a fürdők, az állatkertek, a szerencsejáték- és lottólétesítmények üzemeltetését.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 52.1%-a jelölte

**Holland-kód:** ECS — R 39 · I 16 · A 16 · S 49 · E 88 · C 67

**HEXACO differenciál cél-profil:** X cél 65±20 (w=0.32) · H cél 40±24 (w=0.20) · C cél 41±24 (w=0.18) · A cél 56±26 (w=0.13)

**HEXACO abszolút szint:** H 52 · E 40 · X 67 · A 61 · C 50 · O 53

### rekreációs központ vezetője

`11-9179.02` · **ISCO-08 1431** Sport-, rekreációs és kulturális központok vezetői · **FEOR-08:** 1335 Kulturális tevékenységet folytató egység vezetője; 1336 Sport- és rekreációs tevékenységet folytató egység vezetője · ESCO `1431.2.5` · EN: Spa Managers

*Piaci megnevezések (ESCO):* üdülőközpont vezetője, vidámpark vezetője, sportlétesítmény vezetője, uszodaigazgató, fitneszklub vezetője

A rekreációs központok vezetői irányítják a szabadidős szolgáltatásokat nyújtó létesítmények, például a kertek, a fürdők, az állatkertek, a szerencsejáték- és lottólétesítmények üzemeltetését.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 33.7%-a jelölte

**Holland-kód:** ECS — R 25 · I 5 · A 14 · S 53 · E 100 · C 65

**HEXACO differenciál cél-profil:** X cél 65±20 (w=0.41) · C cél 43±25 (w=0.20) · O cél 45±27 (w=0.14) · A cél 55±27 (w=0.13)

**HEXACO abszolút szint:** H 57 · E 45 · X 66 · A 60 · C 52 · O 52


## 2 — Felsőfokú képzettséget igénylő foglalkozások

### csillagász

`19-2011.00` · **ISCO-08 2111** Fizikusok és csillagászok · **FEOR-08:** 2161 Fizikus; 2162 Csillagász · ESCO `2111.1` · EN: Astronomers

*Piaci megnevezések (ESCO):* asztronómus, csillagászati kutató, kozmológus, elméleti fizikus

A csillagászok kutatják az égitestek és a csillagközi anyagok képződését, szerkezetét, tulajdonságait és fejlődését. A földi berendezéseket és a világűrbe telepített eszközöket az űrre vonatkozó adatok gyűjtésére használják kutatási célokra.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 65.2%-a jelölte

**Holland-kód:** IRC — R 68 · I 100 · A 38 · S 28 · E 14 · C 51

**HEXACO differenciál cél-profil:** O cél 73±15 (w=0.50) · A cél 40±23 (w=0.22) · H cél 44±26 (w=0.12)

**HEXACO abszolút szint:** H 54 · E 48 · X 57 · A 50 · C 53 · O 71

### fizikus

`19-2012.00` · **ISCO-08 2111** Fizikusok és csillagászok · **FEOR-08:** 2161 Fizikus; 2162 Csillagász · ESCO `2111.3` · EN: Physicists

*Piaci megnevezések (ESCO):* elméleti fizikus, üzemfizikus

A fizikusok olyan tudósok, akik fizikai jelenségeket tanulmányoznak. Kutatásaikat a szakosodástól függően összpontosítják, amelyek az atomi fizikától az univerzumban bekövetkező jelenségek vizsgálatáig terjedhetnek.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 49.0%-a jelölte

**Holland-kód:** IRC — R 66 · I 100 · A 29 · S 19 · E 13 · C 63

**HEXACO differenciál cél-profil:** O cél 78±12 (w=0.50) · A cél 33±18 (w=0.31)

**HEXACO abszolút szint:** H 49 · E 51 · X 49 · A 41 · C 52 · O 71

### Meteorológusok

`19-2021.00` · **ISCO-08 2112** Meteorológusok · **FEOR-08:** 2163 Meteorológus · ESCO `2112.1` · EN: Atmospheric and Space Scientists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* meteorológus, tengeri meteorológus, meteorológiai kutató

A meteorológusok tanulmányozzák az éghajlati folyamatokat, mérik és előre jelzik az időjárási mintázatokat, és tanácsadási szolgáltatásokat nyújtanak az időjárási információk különféle felhasználói számára.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 60.0%-a jelölte

**Holland-kód:** IRC — R 63 · I 88 · A 29 · S 25 · E 28 · C 58

**HEXACO differenciál cél-profil:** O cél 70±17 (w=0.44) · A cél 42±25 (w=0.18) · H cél 44±26 (w=0.14) · X cél 44±26 (w=0.12)

**HEXACO abszolút szint:** H 49 · E 45 · X 49 · A 47 · C 55 · O 66

### Geológusok és geofizikusok

`19-2042.00` · **ISCO-08 2114** Geológusok és geofizikusok · **FEOR-08:** 2165 Geológus · ESCO `2114.1` · EN: Geoscientists, Except Hydrologists and Geographers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* geológus, terepi felvételező geológus, negyedkorral foglalkozó geológus, geofizikus, földtudományi mérnök, geomérnök

A geológusok a Földet alkotó anyagokat kutatják. Észrevételeik a kutatás céljától függenek.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 43.8%-a jelölte

**Holland-kód:** IRC — R 76 · I 100 · A 29 · S 21 · E 11 · C 53

**HEXACO differenciál cél-profil:** O cél 73±14 (w=0.51) · A cél 35±20 (w=0.32) · H cél 45±27 (w=0.10)

**HEXACO abszolút szint:** H 49 · E 48 · X 50 · A 42 · C 52 · O 68

### geológus

`19-2043.00` · **ISCO-08 2114** Geológusok és geofizikusok · **FEOR-08:** 2165 Geológus · ESCO `2114.1.5` · EN: Hydrologists

*Piaci megnevezések (ESCO):* terepi felvételező geológus, negyedkorral foglalkozó geológus

A geológusok a Földet alkotó anyagokat kutatják. Észrevételeik a kutatás céljától függenek.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 52.2%-a jelölte

**Holland-kód:** IRC — R 81 · I 90 · A 10 · S 19 · E 22 · C 55

**HEXACO differenciál cél-profil:** O cél 69±17 (w=0.50) · A cél 41±24 (w=0.23) · E cél 54±27 (w=0.10)

**HEXACO abszolút szint:** H 51 · E 51 · X 50 · A 47 · C 54 · O 66

### Matematikusok, biztosításmatematikusok (aktuáriusok) és statisztikusok és statisztikusok

`15-2011.00` · **ISCO-08 2120** Matematikusok, biztosításmatematikusok (aktuáriusok) és statisztikusok és statisztikusok · **FEOR-08:** 2166 Matematikus; 2625 Statisztikus · ESCO `2120` · EN: Actuaries · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* aktuárius, biztosításmatematikus, biztosításmatematikai tanácsadó

_(HU leírás nincs; EN:)_ Analyze statistical data, such as mortality, accident, sickness, disability, and retirement rates and construct probability tables to forecast risk and liability for payment of future benefits.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 78.6%-a jelölte

**Holland-kód:** CIE — R 13 · I 58 · A 2 · S 25 · E 39 · C 88

**HEXACO differenciál cél-profil:** A cél 35±20 (w=0.36) · O cél 61±23 (w=0.26) · C cél 56±26 (w=0.14) · E cél 55±26 (w=0.13)

**HEXACO abszolút szint:** H 53 · E 53 · X 48 · A 42 · C 59 · O 60

### Matematikusok, biztosításmatematikusok (aktuáriusok) és statisztikusok és statisztikusok

`15-2041.01` · **ISCO-08 2120** Matematikusok, biztosításmatematikusok (aktuáriusok) és statisztikusok és statisztikusok · **FEOR-08:** 2166 Matematikus; 2625 Statisztikus · ESCO `2120.6` · EN: Biostatisticians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* statisztikus, bűnügyi statisztikus, energetikai statisztikus

A statisztikusok különböző területekről származó kvantitatív információkat, adatokat gyűjtenek, csoportosítanak, és – ami a legfontosabb – elemeznek.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 58.3%-a jelölte

**Holland-kód:** ICS — R 24 · I 100 · A 30 · S 35 · E 16 · C 57

**HEXACO differenciál cél-profil:** O cél 72±16 (w=0.43) · A cél 36±21 (w=0.27) · X cél 44±26 (w=0.12) · H cél 44±26 (w=0.11)

**HEXACO abszolút szint:** H 50 · E 48 · X 49 · A 44 · C 58 · O 68

### Matematikusok, biztosításmatematikusok (aktuáriusok) és statisztikusok és statisztikusok

`19-3022.00` · **ISCO-08 2120** Matematikusok, biztosításmatematikusok (aktuáriusok) és statisztikusok és statisztikusok · **FEOR-08:** 2166 Matematikus; 2625 Statisztikus · ESCO `2120.2` · EN: Survey Researchers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* demográfus, népességszociológus, népességstatisztikus

A demográfusok a népességhez kapcsolódó különböző paraméterekkel foglalkoznak.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: alapszak (BA/BSc) · a válaszadók 50.0%-a jelölte

**Holland-kód:** ICE — R 11 · I 85 · A 22 · S 22 · E 34 · C 71

**HEXACO differenciál cél-profil:** O cél 64±21 (w=0.43) · E cél 56±26 (w=0.20) · C cél 46±28 (w=0.12) · H cél 47±28 (w=0.10)

**HEXACO abszolút szint:** H 52 · E 52 · X 54 · A 51 · C 51 · O 62

### matematikus

`15-2021.00` · **ISCO-08 2120** Matematikusok, biztosításmatematikusok (aktuáriusok) és statisztikusok és statisztikusok · **FEOR-08:** 2166 Matematikus; 2625 Statisztikus · ESCO `2120.5` · EN: Mathematicians

*Piaci megnevezések (ESCO):* alkalmazott matematikus, geomatematikus, statisztikus, bűnügyi statisztikus, energetikai statisztikus

A matematikusok a meglévő matematikai elméleteket tanulmányozzák és elmélyítik annak érdekében, hogy bővítsék az ismereteket és új paradigmákat találjanak e területen.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 45.0%-a jelölte

**Holland-kód:** ICA — R 37 · I 100 · A 37 · S 16 · E 2 · C 67

**HEXACO differenciál cél-profil:** O cél 79±12 (w=0.40) · A cél 32±18 (w=0.25) · H cél 42±24 (w=0.12) · X cél 42±24 (w=0.12)

**HEXACO abszolút szint:** H 45 · E 52 · X 44 · A 39 · C 54 · O 71

### Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak

`19-1013.00` · **ISCO-08 2131** Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak · **FEOR-08:** 2167 Biológus, botanikus, zoológus és rokon foglalkozású; 2169 Egyéb természettudományi foglalkozású · ESCO `2131.4.5` · EN: Soil and Plant Scientists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* biológus, halbiológus, gombaszakértő

A biológusok az élő szervezeteket és a tágabb értelemben életet tanulmányozzák a környezettel együtt. A kutatás révén arra törekednek, hogy elmagyarázzák a szervezetek funkcionális mechanizmusait, kölcsönhatásait és fejlődését.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 28.6%-a jelölte

**Holland-kód:** IRC — R 90 · I 95 · A 18 · S 11 · E 12 · C 40

**HEXACO differenciál cél-profil:** O cél 73±15 (w=0.52) · A cél 37±21 (w=0.30)

**HEXACO abszolút szint:** H 51 · E 51 · X 50 · A 42 · C 46 · O 68

### Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak

`29-9092.00` · **ISCO-08 2131** Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak · **FEOR-08:** 2167 Biológus, botanikus, zoológus és rokon foglalkozású; 2169 Egyéb természettudományi foglalkozású · ESCO `2131.6` · EN: Genetic Counselors · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* immunológus, immunológiai elemző, immunológiai kutató, farmakológus, biofarmakológus, farmakológiai kutató

Az immunológusok az élő szervezetek (pl. emberi test) immunrendszerét kutatják és azt, hogyan reagálnak a külső fertőzésekre vagy invazív kórokozókra (például vírusra, baktériumokra, parazitákra).

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 100.0%-a jelölte

**Holland-kód:** ISC — R 11 · I 81 · A 22 · S 74 · E 29 · C 48

**HEXACO differenciál cél-profil:** E cél 59±24 (w=0.22) · C cél 42±24 (w=0.20) · H cél 57±25 (w=0.18) · A cél 57±26 (w=0.16)

**HEXACO abszolút szint:** H 69 · E 46 · X 58 · A 68 · C 61 · O 62

### bioinformatikus

`19-1029.01` · **ISCO-08 2131** Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak · **FEOR-08:** 2167 Biológus, botanikus, zoológus és rokon foglalkozású; 2169 Egyéb természettudományi foglalkozású · ESCO `2131.3` · EN: Bioinformatics Scientists

*Piaci megnevezések (ESCO):* bioinformatikai mérnök, bioinformatikus mérnök, immunológus, immunológiai elemző, immunológiai kutató, biológus

A bioinformatikusok számítógépes programok segítségével elemzik a biológiai folyamatokat. Biológiai információkat tartalmazó adatbázisokat tartanak fenn, illetve építenek ki.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: alapszak (BA/BSc) · a válaszadók 33.6%-a jelölte

**Holland-kód:** ICR — R 47 · I 100 · A 25 · S 11 · E 4 · C 67

**HEXACO differenciál cél-profil:** O cél 76±13 (w=0.54) · A cél 40±23 (w=0.21) · H cél 43±26 (w=0.14)

**HEXACO abszolút szint:** H 50 · E 48 · X 50 · A 46 · C 53 · O 71

### biológus

`19-1023.00` · **ISCO-08 2131** Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak · **FEOR-08:** 2167 Biológus, botanikus, zoológus és rokon foglalkozású; 2169 Egyéb természettudományi foglalkozású · ESCO `2131.4` · EN: Zoologists and Wildlife Biologists

*Piaci megnevezések (ESCO):* halbiológus, gombaszakértő

A biológusok az élő szervezeteket és a tágabb értelemben életet tanulmányozzák a környezettel együtt. A kutatás révén arra törekednek, hogy elmagyarázzák a szervezetek funkcionális mechanizmusait, kölcsönhatásait és fejlődését.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 57.2%-a jelölte

**Holland-kód:** IRC — R 74 · I 100 · A 22 · S 26 · E 22 · C 45

**HEXACO differenciál cél-profil:** O cél 67±19 (w=0.58) · E cél 55±27 (w=0.17) · C cél 46±27 (w=0.16)

**HEXACO abszolút szint:** H 57 · E 49 · X 55 · A 54 · C 52 · O 67

### biológus

`19-1029.03` · **ISCO-08 2131** Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak · **FEOR-08:** 2167 Biológus, botanikus, zoológus és rokon foglalkozású; 2169 Egyéb természettudományi foglalkozású · ESCO `2131.4.8` · EN: Geneticists

*Piaci megnevezések (ESCO):* halbiológus, gombaszakértő, bioinformatikus, bioinformatikai mérnök, bioinformatikus mérnök, immunológus

A biológusok az élő szervezeteket és a tágabb értelemben életet tanulmányozzák a környezettel együtt. A kutatás révén arra törekednek, hogy elmagyarázzák a szervezetek funkcionális mechanizmusait, kölcsönhatásait és fejlődését.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 36.0%-a jelölte

**Holland-kód:** ICR — R 51 · I 100 · A 32 · S 32 · E 10 · C 63

**HEXACO differenciál cél-profil:** O cél 71±16 (w=0.51) · A cél 43±25 (w=0.18) · H cél 45±27 (w=0.12) · E cél 54±27 (w=0.10)

**HEXACO abszolút szint:** H 55 · E 47 · X 55 · A 52 · C 59 · O 71

### biológus

`19-1041.00` · **ISCO-08 2131** Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak · **FEOR-08:** 2167 Biológus, botanikus, zoológus és rokon foglalkozású; 2169 Egyéb természettudományi foglalkozású · ESCO `2131.4.7` · EN: Epidemiologists

*Piaci megnevezések (ESCO):* halbiológus, gombaszakértő, immunológus, immunológiai elemző, immunológiai kutató

A biológusok az élő szervezeteket és a tágabb értelemben életet tanulmányozzák a környezettel együtt. A kutatás révén arra törekednek, hogy elmagyarázzák a szervezetek funkcionális mechanizmusait, kölcsönhatásait és fejlődését.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 66.7%-a jelölte

**Holland-kód:** ISC — R 30 · I 100 · A 20 · S 52 · E 23 · C 44

**HEXACO differenciál cél-profil:** O cél 62±22 (w=0.44) · C cél 46±27 (w=0.16) · X cél 46±28 (w=0.14) · E cél 54±28 (w=0.14)

**HEXACO abszolút szint:** H 63 · E 44 · X 57 · A 61 · C 60 · O 66

### etológus

`19-1011.00` · **ISCO-08 2131** Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak · **FEOR-08:** 2167 Biológus, botanikus, zoológus és rokon foglalkozású; 2169 Egyéb természettudományi foglalkozású · ESCO `2131.1` · EN: Animal Scientists

*Piaci megnevezések (ESCO):* etológusok, állatviselkedés kutató, biológus, halbiológus, gombaszakértő

Az etológusok együttműködnek az állatokkal és az emberekkel az állatok bizonyos tényezőkkel szembeni viselkedésének tanulmányozása, megfigyelése, értékelése és megértése céljából, valamint az egyes állatok nem megfelelő vagy problematikus magatartásának megelőzése vagy kezelése megfelelő környezetben és irányítási rendszerek kialakítása révén, a nemzeti jogszabályokkal összhangban.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 43.5%-a jelölte

**Holland-kód:** IRC — R 71 · I 99 · A 16 · S 16 · E 23 · C 39

**HEXACO differenciál cél-profil:** O cél 70±17 (w=0.50) · A cél 38±22 (w=0.31) · E cél 55±27 (w=0.13)

**HEXACO abszolút szint:** H 51 · E 52 · X 51 · A 44 · C 51 · O 66

### Mezőgazdasági, erdészeti és halászati tanácsadók

`19-4012.01` · **ISCO-08 2132** Mezőgazdasági, erdészeti és halászati tanácsadók · **FEOR-08:** 2131 Mezőgazdasági mérnök; 2132 Erdő- és természetvédelmi mérnök; 2242 Növényorvos (növényvédelmi szakértő) · ESCO `2132.1` · EN: Precision Agriculture Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* mezőgazdasági kutató, mezőgazdasági szakértő, agrárszakértő, agronómus, ökológiai gazdálkodási tanácsadó, növénykultúra-tanácsadó

A mezőgazdasági kutatók a talajt, az állatokat és a növényeket kutatják és tanulmányozzák, amelynek célja a mezőgazdasági folyamatoknak, a mezőgazdasági termékek minőségének vagy a mezőgazdasági folyamatok környezetre gyakorolt hatásának a javítása.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 34.8%-a jelölte

**Holland-kód:** RIC — R 91 · I 73 · A 4 · S 6 · E 18 · C 66

**HEXACO differenciál cél-profil:** O cél 68±18 (w=0.45) · A cél 41±24 (w=0.22) · H cél 45±26 (w=0.13) · X cél 46±27 (w=0.10)

**HEXACO abszolút szint:** H 46 · E 52 · X 46 · A 44 · C 52 · O 63

### Környezetvédelmi foglalkozásúak

`33-3031.00` · **ISCO-08 2133** Környezetvédelmi foglalkozásúak · **FEOR-08:** 2168 Környezetfelmérő, -tanácsadó · ESCO `2133.3` · EN: Fish and Game Wardens · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* erdő- és természetvédelmi mérnök, természetvédelmi felügyelő, természetvédelmi területkezelő, zöldterület-kezelésért felelős munkatárs, parkfenntartó, zöldterület-kezelésért felelős munkatársak

Az erdő- és természetvédelmi mérnökök az erdők, parkok és egyéb természeti erőforrások minőségével foglalkoznak.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 79.3%-a jelölte

**Holland-kód:** RCI — R 90 · I 48 · A 0 · S 23 · E 34 · C 54

**HEXACO differenciál cél-profil:** H cél 56±26 (w=0.25) · E cél 44±26 (w=0.24) · O cél 44±26 (w=0.24) · X cél 54±27 (w=0.19)

**HEXACO abszolút szint:** H 61 · E 41 · X 58 · A 56 · C 56 · O 50

### erdő- és természetvédelmi mérnök

`19-1031.00` · **ISCO-08 2133** Környezetvédelmi foglalkozásúak · **FEOR-08:** 2168 Környezetfelmérő, -tanácsadó · ESCO `2133.3` · EN: Conservation Scientists

*Piaci megnevezések (ESCO):* természetvédelmi felügyelő, természetvédelmi területkezelő, talajkutató, talajvizsgáló technikus, talaj-mikrobiológus, környezetvédelmi kutató

Az erdő- és természetvédelmi mérnökök az erdők, parkok és egyéb természeti erőforrások minőségével foglalkoznak.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 69.6%-a jelölte

**Holland-kód:** IRC — R 69 · I 78 · A 16 · S 31 · E 36 · C 50

**HEXACO differenciál cél-profil:** O cél 60±23 (w=0.37) · C cél 45±27 (w=0.17) · H cél 54±27 (w=0.16) · E cél 54±27 (w=0.16)

**HEXACO abszolút szint:** H 60 · E 48 · X 56 · A 54 · C 53 · O 62

### Építőmérnökök

`17-2151.00` · **ISCO-08 2142** Építőmérnökök · **FEOR-08:** 2116 Építőmérnök · ESCO `2142.1.4` · EN: Mining and Geological Engineers, Including Mining Safety Engineers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Conduct subsurface surveys to identify the characteristics of potential land or mining development sites. May specify the ground support systems, processes, and equipment for safe, economical, and environmentally sound extraction or underground construction activities.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 79.0%-a jelölte

**Holland-kód:** RIC — R 85 · I 76 · A 9 · S 14 · E 29 · C 61

**HEXACO differenciál cél-profil:** O cél 60±23 (w=0.34) · H cél 43±25 (w=0.23) · A cél 43±26 (w=0.21) · E cél 46±28 (w=0.12)

**HEXACO abszolút szint:** H 52 · E 43 · X 55 · A 52 · C 61 · O 62

### gépészmérnök

`17-2011.00` · **ISCO-08 2144** Gépészmérnökök · **FEOR-08:** 2118 Gépészmérnök · ESCO `2144.1.1` · EN: Aerospace Engineers

*Piaci megnevezések (ESCO):* géptervező mérnök

A gépészmérnökök mechanikai termékeket és rendszereket kutatnak, terveznek és alakítanak ki, valamint felügyelik a rendszerek és termékek gyártását, üzemeltetését, alkalmazását, üzembe helyezését és javítását.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 59.0%-a jelölte

**Holland-kód:** IRC — R 78 · I 84 · A 22 · S 4 · E 25 · C 57

**HEXACO differenciál cél-profil:** O cél 67±19 (w=0.42) · A cél 40±23 (w=0.25) · H cél 43±25 (w=0.18)

**HEXACO abszolút szint:** H 50 · E 48 · X 52 · A 48 · C 60 · O 66

### gépészmérnök

`17-2021.00` · **ISCO-08 2144** Gépészmérnökök · **FEOR-08:** 2118 Gépészmérnök · ESCO `2144.1.2` · EN: Agricultural Engineers

*Piaci megnevezések (ESCO):* géptervező mérnök

A gépészmérnökök mechanikai termékeket és rendszereket kutatnak, terveznek és alakítanak ki, valamint felügyelik a rendszerek és termékek gyártását, üzemeltetését, alkalmazását, üzembe helyezését és javítását.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 75.0%-a jelölte

**Holland-kód:** RIC — R 94 · I 88 · A 20 · S 12 · E 22 · C 46

**HEXACO differenciál cél-profil:** O cél 64±21 (w=0.43) · A cél 45±27 (w=0.14) · H cél 46±27 (w=0.14) · E cél 54±28 (w=0.11)

**HEXACO abszolút szint:** H 52 · E 49 · X 56 · A 52 · C 54 · O 64

### kőolaj-kitermelő mérnök

`17-2171.00` · **ISCO-08 2146** Bánya- és kohómérnökök és hasonló foglalkozásúak · **FEOR-08:** 2111 Bányamérnök; 2112 Kohó- és anyagmérnök · ESCO `2146.10` · EN: Petroleum Engineers

*Piaci megnevezések (ESCO):* kőolaj-geológus, kőolaj- és gázfúró mérnök, olajfúró mérnök, kőolajipari vegyészmérnök

A kőolaj-kitermelő mérnökök a gáz- és olajmezőket értékelik. Módszereket dolgoznak ki és fejlesztenek ki az olaj és gáz földfelszínre hozására. Minimális költségek mellett maximalizálják a szénhidrogén-kitermelést, minimális hatást gyakorolva a környezetre.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 71.6%-a jelölte

**Holland-kód:** RIC — R 73 · I 72 · A 15 · S 13 · E 34 · C 55

**HEXACO differenciál cél-profil:** O cél 64±20 (w=0.32) · H cél 39±23 (w=0.25) · A cél 40±23 (w=0.23) · E cél 46±27 (w=0.10)

**HEXACO abszolút szint:** H 48 · E 43 · X 54 · A 48 · C 59 · O 64

### Máshová nem sorolható mérnökök

`17-2199.09` · **ISCO-08 2149** Máshová nem sorolható mérnökök · **FEOR-08:** 2113 Élelmiszer-ipari mérnök; 2114 Fa- és könnyűipari mérnök; 2137 Minőségbiztosítási mérnök; 2139 Egyéb, máshova nem sorolható mérnök · ESCO `2149.12.1` · EN: Nanosystems Engineers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* mennyiségi ellenőr, mennyiségellenőr, alkalmazásmérnök, alkalmazási mérnök, üzembe helyező mérnök, erősáramú üzembe helyező mérnök

A mennyiségi ellenőrök az építési és építkezési projektek költségeinek teljes körű áttekintését végzik, a projekt kezdetétől a teljesítésig. Céljuk a források hatékony felhasználása, szem előtt tartva a minőséget, a minőségi előírásokat és az ügyfelek igényeit.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 57.1%-a jelölte

**Holland-kód:** IRC — R 72 · I 85 · A 23 · S 8 · E 26 · C 51

**HEXACO differenciál cél-profil:** O cél 73±14 (w=0.46) · H cél 39±23 (w=0.22) · A cél 39±23 (w=0.21)

**HEXACO abszolút szint:** H 50 · E 47 · X 55 · A 49 · C 60 · O 72

### anyagmérnök

`17-2141.01` · **ISCO-08 2149** Máshová nem sorolható mérnökök · **FEOR-08:** 2113 Élelmiszer-ipari mérnök; 2114 Fa- és könnyűipari mérnök; 2137 Minőségbiztosítási mérnök; 2139 Egyéb, máshova nem sorolható mérnök · ESCO `2149.9.1` · EN: Fuel Cell Engineers

*Piaci megnevezések (ESCO):* kerámiaipari mérnök, építőipari anyagmérnök, alkalmazásmérnök, alkalmazási mérnök

Az anyagmérnökök új vagy továbbfejlesztett anyagokat kutatnak és alakítanak ki különböző alkalmazások számára.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 57.1%-a jelölte

**Holland-kód:** RIC — R 76 · I 73 · A 14 · S 7 · E 25 · C 51

**HEXACO differenciál cél-profil:** O cél 70±17 (w=0.45) · H cél 39±23 (w=0.25) · A cél 41±24 (w=0.20)

**HEXACO abszolút szint:** H 47 · E 48 · X 52 · A 48 · C 57 · O 68

### anyagmérnök

`17-2161.00` · **ISCO-08 2149** Máshová nem sorolható mérnökök · **FEOR-08:** 2113 Élelmiszer-ipari mérnök; 2114 Fa- és könnyűipari mérnök; 2137 Minőségbiztosítási mérnök; 2139 Egyéb, máshova nem sorolható mérnök · ESCO `2149.9.4` · EN: Nuclear Engineers

*Piaci megnevezések (ESCO):* kerámiaipari mérnök, építőipari anyagmérnök

Az anyagmérnökök új vagy továbbfejlesztett anyagokat kutatnak és alakítanak ki különböző alkalmazások számára.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 81.0%-a jelölte

**Holland-kód:** IRC — R 65 · I 91 · A 18 · S 15 · E 26 · C 58

**HEXACO differenciál cél-profil:** O cél 61±23 (w=0.32) · X cél 42±24 (w=0.24) · A cél 43±25 (w=0.20) · C cél 54±27 (w=0.13)

**HEXACO abszolút szint:** H 60 · E 41 · X 52 · A 54 · C 66 · O 64

### mennyiségi ellenőr

`17-2199.07` · **ISCO-08 2149** Máshová nem sorolható mérnökök · **FEOR-08:** 2113 Élelmiszer-ipari mérnök; 2114 Fa- és könnyűipari mérnök; 2137 Minőségbiztosítási mérnök; 2139 Egyéb, máshova nem sorolható mérnök · ESCO `2149.12.1` · EN: Photonics Engineers

*Piaci megnevezések (ESCO):* mennyiségellenőr

A mennyiségi ellenőrök az építési és építkezési projektek költségeinek teljes körű áttekintését végzik, a projekt kezdetétől a teljesítésig. Céljuk a források hatékony felhasználása, szem előtt tartva a minőséget, a minőségi előírásokat és az ügyfelek igényeit.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 52.4%-a jelölte

**Holland-kód:** RIC — R 82 · I 81 · A 30 · S 6 · E 12 · C 49

**HEXACO differenciál cél-profil:** O cél 72±15 (w=0.46) · A cél 39±23 (w=0.23) · H cél 41±24 (w=0.19)

**HEXACO abszolút szint:** H 46 · E 49 · X 49 · A 44 · C 54 · O 67

### optikai mérnök

`17-2111.02` · **ISCO-08 2149** Máshová nem sorolható mérnökök · **FEOR-08:** 2113 Élelmiszer-ipari mérnök; 2114 Fa- és könnyűipari mérnök; 2137 Minőségbiztosítási mérnök; 2139 Egyéb, máshova nem sorolható mérnök · ESCO `2149.10.1` · EN: Fire-Prevention and Protection Engineers

Az optikai mérnökök különböző, optikával kapcsolatos ipari alkalmazásokat terveznek és fejlesztenek ki.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 84.6%-a jelölte

**Holland-kód:** RIC — R 89 · I 70 · A 8 · S 31 · E 30 · C 58

**HEXACO differenciál cél-profil:** O cél 61±23 (w=0.47) · A cél 44±26 (w=0.24) · H cél 48±28 (w=0.10)

**HEXACO abszolút szint:** H 56 · E 46 · X 55 · A 53 · C 61 · O 63

### szabadalmi mérnök

`19-2032.00` · **ISCO-08 2149** Máshová nem sorolható mérnökök · **FEOR-08:** 2113 Élelmiszer-ipari mérnök; 2114 Fa- és könnyűipari mérnök; 2137 Minőségbiztosítási mérnök; 2139 Egyéb, máshova nem sorolható mérnök · ESCO `2149.11` · EN: Materials Scientists

A szabadalmi mérnökök tanácsokat adnak vállalkozásoknak a szellemi tulajdonjog különböző vonatkozásairól. Elemzik a találmányokat, és kutatják gazdasági potenciáljukat.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 61.9%-a jelölte

**Holland-kód:** IRC — R 80 · I 93 · A 20 · S 6 · E 14 · C 52

**HEXACO differenciál cél-profil:** O cél 74±14 (w=0.49) · A cél 37±21 (w=0.27) · H cél 44±26 (w=0.12)

**HEXACO abszolút szint:** H 49 · E 49 · X 50 · A 44 · C 53 · O 70

### üzembe helyező mérnök

`17-2031.00` · **ISCO-08 2149** Máshová nem sorolható mérnökök · **FEOR-08:** 2113 Élelmiszer-ipari mérnök; 2114 Fa- és könnyűipari mérnök; 2137 Minőségbiztosítási mérnök; 2139 Egyéb, máshova nem sorolható mérnök · ESCO `2149.5.1` · EN: Bioengineers and Biomedical Engineers

*Piaci megnevezések (ESCO):* erősáramú üzembe helyező mérnök, irányítástechnikai üzembe helyező mérnök, szabadalmi mérnök

Az üzembe helyező mérnökök felügyelik a projekt utolsó szakaszait, amikor rendszereket telepítenek és tesztelnek.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 43.5%-a jelölte

**Holland-kód:** IRC — R 74 · I 96 · A 18 · S 24 · E 14 · C 58

**HEXACO differenciál cél-profil:** O cél 69±17 (w=0.53) · H cél 45±26 (w=0.15) · X cél 46±27 (w=0.11)

**HEXACO abszolút szint:** H 54 · E 47 · X 54 · A 55 · C 57 · O 69

### Gyengeáramú villamosmérnökök

`17-2072.01` · **ISCO-08 2152** Gyengeáramú villamosmérnökök · **FEOR-08:** 2122 Villamosmérnök (elektronikai mérnök) · ESCO `2152.1` · EN: Radio Frequency Identification Device Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* elektronikai mérnök, elektronikus mérnök, repülőelektronikai mérnök

Az elektronikai mérnökök elektronikus rendszereket kutatnak, terveznek és fejlesztenek, mint például áramkörök, félvezető eszközök és elektromos berendezések, amelyek energia-forrásként villamos energiát használnak.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 74.8%-a jelölte

**Holland-kód:** CRI — R 68 · I 64 · A 7 · S 9 · E 9 · C 72

**HEXACO differenciál cél-profil:** O cél 69±17 (w=0.45) · A cél 39±23 (w=0.25) · H cél 42±25 (w=0.19)

**HEXACO abszolút szint:** H 46 · E 50 · X 48 · A 43 · C 52 · O 64

### elektronikai mérnök

`17-2199.06` · **ISCO-08 2152** Gyengeáramú villamosmérnökök · **FEOR-08:** 2122 Villamosmérnök (elektronikai mérnök) · ESCO `2152.1.10` · EN: Microsystems Engineers

*Piaci megnevezések (ESCO):* elektronikus mérnök, repülőelektronikai mérnök

Az elektronikai mérnökök elektronikus rendszereket kutatnak, terveznek és fejlesztenek, mint például áramkörök, félvezető eszközök és elektromos berendezések, amelyek energia-forrásként villamos energiát használnak.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 34.2%-a jelölte

**Holland-kód:** IRC — R 75 · I 86 · A 16 · S 9 · E 7 · C 65

**HEXACO differenciál cél-profil:** O cél 71±16 (w=0.42) · A cél 39±23 (w=0.22) · H cél 41±24 (w=0.19) · X cél 45±26 (w=0.10)

**HEXACO abszolút szint:** H 46 · E 49 · X 48 · A 44 · C 56 · O 67

### táj- és kertépítészmérnök

`17-1012.00` · **ISCO-08 2162** Tájépítészek · **FEOR-08:** 2133 Táj- és kertépítészmérnök · ESCO `2162.1` · EN: Landscape Architects

*Piaci megnevezések (ESCO):* tájépítő mérnök, tájtervező mérnök

A táj- és kertépítészmérnökök kertek és természetes terek építésének megtervezését és kialakítását végzik. Meghatározzák a tér jellemzőit és felosztását. A térérzetet esztétikai szempontok figyelembevételével ötvözve érik el a harmonikus kialakítást.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 85.0%-a jelölte

**Holland-kód:** RIA — R 74 · I 62 · A 61 · S 28 · E 44 · C 45

**HEXACO differenciál cél-profil:** O cél 64±21 (w=0.39) · H cél 43±25 (w=0.21) · X cél 55±26 (w=0.15) · C cél 45±27 (w=0.13)

**HEXACO abszolút szint:** H 51 · E 49 · X 57 · A 54 · C 50 · O 63

### településtervező mérnök

`19-3099.01` · **ISCO-08 2164** Várostervezők és közlekedési mérnökök · **FEOR-08:** 2134 Település- és közlekedéstervező mérnök · ESCO `2164.3` · EN: Transportation Planners

*Piaci megnevezések (ESCO):* településfejlesztő és -üzemeltető mérnök, településmérnök, közlekedéstervező mérnök, városi közlekedési szakmérnök, közlekedési mérnök

A településtervező mérnökök fejlesztési terveket dolgoznak ki a városok, városi területek, települések és régiók számára.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 55.0%-a jelölte

**Holland-kód:** ICR — R 43 · I 77 · A 17 · S 13 · E 36 · C 64

**HEXACO differenciál cél-profil:** O cél 63±21 (w=0.46) · E cél 57±25 (w=0.25) · H cél 45±27 (w=0.16) · C cél 47±28 (w=0.11)

**HEXACO abszolút szint:** H 52 · E 52 · X 54 · A 54 · C 52 · O 62

### földmérő

`17-1022.01` · **ISCO-08 2165** Térképészek és földmérők · **FEOR-08:** 2135 Földmérő és térinformatikus · ESCO `2165.4` · EN: Geodetic Surveyors

*Piaci megnevezések (ESCO):* térinformatikus, földmérnök, kataszteri földmérő mérnök, térképész

A földmérők speciális berendezések segítségével határozzák meg az építési területek felületén található pontok távolságát és elhelyezkedését.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 81.5%-a jelölte

**Holland-kód:** RIC — R 75 · I 73 · A 9 · S 12 · E 10 · C 72

**HEXACO differenciál cél-profil:** A cél 28±16 (w=0.46) · O cél 60±23 (w=0.22) · C cél 58±25 (w=0.16) · E cél 55±27 (w=0.11)

**HEXACO abszolút szint:** H 43 · E 58 · X 45 · A 32 · C 52 · O 54

### térinformatikai szakértő

`15-1299.02` · **ISCO-08 2165** Térképészek és földmérők · **FEOR-08:** 2135 Földmérő és térinformatikus · ESCO `2165.3` · EN: Geographic Information Systems Technologists and Technicians

*Piaci megnevezések (ESCO):* geoinformatikai szakértő, FIR operátor, kataszteri földmérő mérnök, térképész, földmérő, kartográfus

A térinformatikai szakértők speciális számítógépes rendszereket, mérnöki méréseket és geológiai koncepciókat használnak fel szárazföldi, földrajzi és térinformatikai adatok vizuális megjelenítéséhez.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: —

**Holland-kód:** CIR — R 54 · I 70 · A 22 · S 16 · E 16 · C 81

**HEXACO differenciál cél-profil:** O cél 66±19 (w=0.51) · X cél 45±27 (w=0.16) · A cél 45±27 (w=0.15) · H cél 47±28 (w=0.11)

**HEXACO abszolút szint:** H 47 · E 53 · X 46 · A 45 · C 48 · O 61

### térképész

`17-1021.00` · **ISCO-08 2165** Térképészek és földmérők · **FEOR-08:** 2135 Földmérő és térinformatikus · ESCO `2165.2` · EN: Cartographers and Photogrammetrists

*Piaci megnevezések (ESCO):* kartográfus, térképész földmérő mérnök, kataszteri földmérő mérnök, földmérő, térinformatikai szakértő, geoinformatikai szakértő

A térképészek a különböző tudományos információkat ötvözve készítenek térképeket a céltól függően (pl. topográfiai, városi vagy politikai térképek).

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 35.7%-a jelölte

**Holland-kód:** CIR — R 60 · I 70 · A 42 · S 13 · E 11 · C 72

**HEXACO differenciál cél-profil:** O cél 67±19 (w=0.35) · A cél 40±23 (w=0.21) · X cél 43±25 (w=0.15) · H cél 44±26 (w=0.13)

**HEXACO abszolút szint:** H 41 · E 56 · X 41 · A 39 · C 50 · O 59

### Tervezőgrafikusok és multimédiatervezők

`27-2012.04` · **ISCO-08 2166** Tervezőgrafikusok és multimédiatervezők · **FEOR-08:** 2136 Grafikus és multimédia-tervező · ESCO `2166` · EN: Talent Directors · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Audition and interview performers to select most appropriate talent for parts in stage, television, radio, or motion picture productions.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 42.3%-a jelölte

**Holland-kód:** EAS — R 4 · I 7 · A 78 · S 54 · E 82 · C 43

**HEXACO differenciál cél-profil:** X cél 67±19 (w=0.27) · H cél 37±21 (w=0.22) · C cél 38±22 (w=0.19) · A cél 60±24 (w=0.15)

**HEXACO abszolút szint:** H 44 · E 44 · X 64 · A 59 · C 40 · O 56

### művészeti vezető

`43-9031.00` · **ISCO-08 2166** Tervezőgrafikusok és multimédiatervezők · **FEOR-08:** 2136 Grafikus és multimédia-tervező · ESCO `2166.4` · EN: Desktop Publishers

*Piaci megnevezések (ESCO):* zenei igazgató, zenekar-igazgató, szerencsejáték-tervező, szerencsejáték-fejlesztő

A művészeti vezetők alakítják a koncepció kinézetét. Innovatív terveket dolgoznak ki, művészeti projekteket fejlesztenek ki és irányítják az összes kapcsolódó aspektus közötti együttműködést.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 44.3%-a jelölte

**Holland-kód:** CAR — R 40 · I 31 · A 54 · S 12 · E 12 · C 78

**HEXACO differenciál cél-profil:** H cél 42±25 (w=0.28) · X cél 44±26 (w=0.21) · O cél 56±26 (w=0.20) · C cél 55±26 (w=0.19)

**HEXACO abszolút szint:** H 32 · E 59 · X 36 · A 37 · C 41 · O 46

### speciáliseffekt-tervező

`15-1255.01` · **ISCO-08 2166** Tervezőgrafikusok és multimédiatervezők · **FEOR-08:** 2136 Grafikus és multimédia-tervező · ESCO `2166.12` · EN: Video Game Designers

*Piaci megnevezések (ESCO):* speciáliseffekt-tervező művész, digitáliseffekt-tervező művész, digitális művész, 3D díszlettervező, digitális média tervező, médiatervező

A speciáliseffekt-tervezők illúziós hatásokat készítenek a filmekhez, videókhoz és számítógépes játékokhoz. Számítógépes szoftvereket használnak.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 55.0%-a jelölte

**Holland-kód:** AIE — R 30 · I 52 · A 90 · S 22 · E 49 · C 48

**HEXACO differenciál cél-profil:** O cél 73±14 (w=0.33) · H cél 30±16 (w=0.28) · X cél 60±23 (w=0.15) · C cél 42±25 (w=0.11)

**HEXACO abszolút szint:** H 41 · E 44 · X 60 · A 55 · C 44 · O 70

### stoptrükkanimátor

`27-1014.00` · **ISCO-08 2166** Tervezőgrafikusok és multimédiatervezők · **FEOR-08:** 2136 Grafikus és multimédia-tervező · ESCO `2166.13` · EN: Special Effects Artists and Animators

*Piaci megnevezések (ESCO):* stoptrükk-bábanimátor, animációsfilm-készítő, számítógépes animátor, 3D animátor, kiadványszerkesztő, digitális grafikus

A stoptrükkanimátorok báb- vagy agyagmodellek alkalmazásával hozzák létre az animációkat.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 52.8%-a jelölte

**Holland-kód:** ARC — R 45 · I 30 · A 100 · S 20 · E 27 · C 36

**HEXACO differenciál cél-profil:** O cél 76±13 (w=0.40) · H cél 30±16 (w=0.32) · E cél 41±24 (w=0.15)

**HEXACO abszolút szint:** H 34 · E 47 · X 49 · A 45 · C 40 · O 67

### Szakorvosok

`29-1229.01` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Allergists and Immunologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 53.0%-a jelölte

**Holland-kód:** ISR — R 47 · I 99 · A 14 · S 72 · E 20 · C 44

**HEXACO differenciál cél-profil:** E cél 58±24 (w=0.27) · O cél 58±25 (w=0.24) · X cél 44±26 (w=0.20) · C cél 46±27 (w=0.13)

**HEXACO abszolút szint:** H 64 · E 47 · X 56 · A 63 · C 63 · O 64

### Szakorvosok

`29-1229.02` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212` · EN: Hospitalists · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Provide inpatient care predominantly in settings such as medical wards, acute care units, intensive care units, rehabilitation centers, or emergency rooms. Manage and coordinate patient care throughout treatment.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 48.0%-a jelölte

**Holland-kód:** SIC — R 42 · I 60 · A 11 · S 88 · E 36 · C 48

**HEXACO differenciál cél-profil:** C cél 44±26 (w=0.35) · A cél 55±27 (w=0.27) · O cél 47±28 (w=0.16)

**HEXACO abszolút szint:** H 67 · E 37 · X 65 · A 68 · C 66 · O 59

### Szakorvosok

`29-1229.05` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Preventive Medicine Physicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 73.7%-a jelölte

**Holland-kód:** ISC — R 40 · I 95 · A 15 · S 74 · E 23 · C 40

**HEXACO differenciál cél-profil:** C cél 42±25 (w=0.29) · O cél 58±25 (w=0.28) · E cél 55±27 (w=0.19) · X cél 54±27 (w=0.14)

**HEXACO abszolút szint:** H 65 · E 43 · X 65 · A 64 · C 61 · O 66

### Szakorvosok

`29-1229.06` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Sports Medicine Physicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 51.0%-a jelölte

**Holland-kód:** ISR — R 70 · I 73 · A 3 · S 71 · E 39 · C 42

**HEXACO differenciál cél-profil:** C cél 44±26 (w=0.36) · A cél 56±26 (w=0.31) · H cél 48±29 (w=0.12)

**HEXACO abszolút szint:** H 61 · E 41 · X 62 · A 65 · C 60 · O 60

### Szakorvosok

`29-1243.00` · **ISCO-08 2212** Szakorvosok · **FEOR-08:** 2212 Szakorvos · ESCO `2212.1` · EN: Pediatric Surgeons · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakorvos

A szakorvosok orvosi vagy sebészeti szakmájuktól függően betegségek megelőzését, diagnosztizálását és kezelését végzik.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: —

**Holland-kód:** ISR — R 66 · I 92 · A 9 · S 66 · E 24 · C 48

**HEXACO differenciál cél-profil:** E cél 43±26 (w=0.29) · H cél 44±26 (w=0.29) · O cél 55±27 (w=0.20) · A cél 53±28 (w=0.12)

**HEXACO abszolút szint:** H 62 · E 33 · X 64 · A 67 · C 69 · O 65

### Hagyományos és alternatív gyógyítók

`29-1291.00` · **ISCO-08 2230** Hagyományos és alternatív gyógyítók · **FEOR-08:** 2228 Alternatív gyógymódot alkalmazó · ESCO `2230.2.1` · EN: Acupuncturists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* alternatív gyógymódot alkalmazó terapeuta, természetgyógyász, alternatív terapeuta

_(HU leírás nincs; EN:)_ Diagnose, treat, and prevent disorders by stimulating specific acupuncture points within the body using acupuncture needles. May also use cups, nutritional supplements, therapeutic massage, acupressure, and other alternative health therapies.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 67.9%-a jelölte

**Holland-kód:** SIR — R 63 · I 75 · A 18 · S 78 · E 10 · C 34

**HEXACO differenciál cél-profil:** H cél 59±24 (w=0.27) · E cél 59±24 (w=0.26) · C cél 42±24 (w=0.24)

**HEXACO abszolút szint:** H 64 · E 50 · X 55 · A 59 · C 52 · O 57

### Hagyományos és alternatív gyógyítók

`29-1299.01` · **ISCO-08 2230** Hagyományos és alternatív gyógyítók · **FEOR-08:** 2228 Alternatív gyógymódot alkalmazó · ESCO `2230.1` · EN: Naturopathic Physicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* alternatív gyógymódot alkalmazó terapeuta, természetgyógyász, alternatív terapeuta

Az alternatív gyógymódot alkalmazó terapeuták egy sor kiegészítő és alternatív terápiát alkalmaznak, hogy egyidejűleg gyógyítsák a betegek szervezetét, gondolkodását és szellemiségét.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 96.0%-a jelölte

**Holland-kód:** ISR — R 59 · I 82 · A 14 · S 79 · E 16 · C 38

**HEXACO differenciál cél-profil:** C cél 40±24 (w=0.32) · O cél 58±25 (w=0.25) · E cél 56±26 (w=0.21) · A cél 54±27 (w=0.13)

**HEXACO abszolút szint:** H 64 · E 45 · X 61 · A 64 · C 57 · O 64

### Fogorvosok

`29-1022.00` · **ISCO-08 2261** Fogorvosok · **FEOR-08:** 2213 Fogorvos, fogszakorvos · ESCO `2261.1` · EN: Oral and Maxillofacial Surgeons · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* fogorvos, gyermekfogász, kórházi fogorvos, fogszakorvos, dentofaciális szakorvos, szájsebész

A fogorvosok megelőzik, diagnosztizálják és kezelik a fogakat, szájat, állkapcsot és kapcsolódó szöveteket érintő anomáliákat és betegségeket.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 72.2%-a jelölte

**Holland-kód:** IRS — R 79 · I 81 · A 3 · S 58 · E 20 · C 43

**HEXACO differenciál cél-profil:** H cél 40±23 (w=0.46) · O cél 55±27 (w=0.23) · E cél 46±27 (w=0.20)

**HEXACO abszolút szint:** H 54 · E 38 · X 59 · A 61 · C 66 · O 62

### Fogorvosok

`29-1023.00` · **ISCO-08 2261** Fogorvosok · **FEOR-08:** 2213 Fogorvos, fogszakorvos · ESCO `2261.1` · EN: Orthodontists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* fogorvos, gyermekfogász, kórházi fogorvos, fogszakorvos, dentofaciális szakorvos, szájsebész

A fogorvosok megelőzik, diagnosztizálják és kezelik a fogakat, szájat, állkapcsot és kapcsolódó szöveteket érintő anomáliákat és betegségeket.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 68.9%-a jelölte

**Holland-kód:** IRC — R 77 · I 79 · A 10 · S 50 · E 8 · C 60

**HEXACO differenciál cél-profil:** A cél 44±26 (w=0.35) · E cél 55±26 (w=0.29) · O cél 53±28 (w=0.19) · C cél 48±29 (w=0.10)

**HEXACO abszolút szint:** H 58 · E 47 · X 58 · A 54 · C 59 · O 58

### Környezet-, foglalkozás-egészségügyi és higiénés foglalkozásúak

`11-9161.00` · **ISCO-08 2263** Környezet-, foglalkozás-egészségügyi és higiénés foglalkozásúak · **FEOR-08:** 2221 Környezet- és foglalkozás-egészségügyi foglalkozású · ESCO `2263.1` · EN: Emergency Management Directors · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* vészhelyzeti koordinátor, katasztrófavédelmi koordinátor, veszélyhelyzeti koordinátor

A vészhelyzeti koordinátorok elemzik az olyan lehetséges kockázatokat, mint a katasztrófák és vészhelyzetek egy közösség vagy intézmény számára, és stratégiát dolgoznak ki az ezekre a kockázatokra való reagálásra.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 59.1%-a jelölte

**Holland-kód:** ECI — R 42 · I 58 · A 14 · S 50 · E 68 · C 62

**HEXACO differenciál cél-profil:** E cél 42±25 (w=0.22) · X cél 57±26 (w=0.20) · C cél 44±26 (w=0.17) · H cél 44±26 (w=0.16)

**HEXACO abszolút szint:** H 63 · E 32 · X 68 · A 69 · C 66 · O 64

### audiológus

`29-1181.00` · **ISCO-08 2266** Audiológusok és beszédterapeuták · **FEOR-08:** 2227 Hallás- és beszédterapeuta · ESCO `2266.1` · EN: Audiologists

*Piaci megnevezések (ESCO):* gyermekaudiológus, audiológiai szakasszisztens, beszéd- és nyelvterapeuta, beszédpatológus, beszédterapeuta

Az audiológusok értékelik, diagnosztizálják és kezelik a fertőző, genetikai, traumás vagy degeneratív betegségek által okozott audiológiai és vesztibuláris zavarokat (gyermekek vagy felnőttek esetében), például halláskárosodást, tinnituszt, szédülést, egyensúlyhiányt, hiperakuzist és hallásfeldolgozási nehézségeket által a fertőző, genetikai, traumás vagy degeneratív betegségek betegeket.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 95.5%-a jelölte

**Holland-kód:** ISR — R 50 · I 82 · A 20 · S 82 · E 14 · C 50

**HEXACO differenciál cél-profil:** E cél 60±23 (w=0.34) · C cél 43±25 (w=0.23) · A cél 55±26 (w=0.17) · H cél 54±27 (w=0.14)

**HEXACO abszolút szint:** H 64 · E 49 · X 58 · A 63 · C 57 · O 58

### ortoptikus

`29-1299.02` · **ISCO-08 2267** Optometristák · **FEOR-08:** 2222 Optometrista · ESCO `2267.2` · EN: Orthoptists

*Piaci megnevezések (ESCO):* ortoptikus szakorvos, optometrista, látszerész optometrista, szemvizsgáló optometrista

Az ortoptikusok a binokuláris látás rendellenességeinek diagnosztizálását és kezelését végzik. Vizsgálják, értékelik és kezelik a látásromlást, a szemtengelyferdülést, a tompalátást, továbbá a szemmozgás rendellenességeit.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztgraduális szakirányú továbbképzés · a válaszadók 78.6%-a jelölte

**Holland-kód:** IRS — R 65 · I 79 · A 15 · S 63 · E 8 · C 47

**HEXACO differenciál cél-profil:** E cél 57±25 (w=0.28) · C cél 45±27 (w=0.20) · X cél 46±27 (w=0.17) · O cél 54±28 (w=0.15)

**HEXACO abszolút szint:** H 60 · E 49 · X 54 · A 59 · C 55 · O 58

### Máshová nem sorolható egészségügyi foglalkozásúak

`29-9091.00` · **ISCO-08 2269** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 2229 Egyéb humán-egészségügyi (társ)foglalkozású · ESCO `2269.1` · EN: Athletic Trainers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* állat csontkovács, állat csontkovácsok, állat manuálterapeuta, kiropraktőr, muszkoszkeletális terapeuta, csontrakó-csontkovács

Az állatok csontkovácsai terápiás kezelést nyújtanak az állatorvosi diagnózist vagy beutalót követően. A nemzeti jogszabályoknak megfelelően végzik a testszövetek manipulálását az állati izomhúzódások és sérülések kezelési technikáinak alkalmazása során.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 54.3%-a jelölte

**Holland-kód:** SRI — R 77 · I 57 · A 2 · S 79 · E 21 · C 37

**HEXACO differenciál cél-profil:** C cél 42±25 (w=0.35) · A cél 57±25 (w=0.34) · O cél 47±28 (w=0.14) · X cél 53±28 (w=0.14)

**HEXACO abszolút szint:** H 62 · E 42 · X 61 · A 64 · C 56 · O 55

### munkaterápiás asszisztens

`31-2011.00` · **ISCO-08 2269** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 2229 Egyéb humán-egészségügyi (társ)foglalkozású · ESCO `2269.5` · EN: Occupational Therapy Assistants

*Piaci megnevezések (ESCO):* foglalkoztatásterápiás asszisztens, foglalkozásterápiás asszisztens

A munkaterápiás asszisztensek a foglalkozási terapeutákat nyújtanak támogatást azáltal, hogy az emberekkel és a közösségekkel együttműködve fokozzák azok képességét arra, hogy a kívánt, szükséges vagy elvárt szakmákban dolgozhassanak, illetve a foglalkozás vagy a környezet módosításával jobban támogassák foglalkoztatási szerepvállalásukat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 91.7%-a jelölte

**Holland-kód:** SCR — R 42 · I 41 · A 18 · S 85 · E 2 · C 54

**HEXACO differenciál cél-profil:** A cél 60±24 (w=0.25) · C cél 40±24 (w=0.25) · H cél 57±26 (w=0.18) · E cél 56±26 (w=0.16)

**HEXACO abszolút szint:** H 65 · E 47 · X 58 · A 65 · C 53 · O 53

### munkaterápiás asszisztens

`31-2012.00` · **ISCO-08 2269** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 2229 Egyéb humán-egészségügyi (társ)foglalkozású · ESCO `2269.5` · EN: Occupational Therapy Aides

*Piaci megnevezések (ESCO):* foglalkoztatásterápiás asszisztens, foglalkozásterápiás asszisztens

A munkaterápiás asszisztensek a foglalkozási terapeutákat nyújtanak támogatást azáltal, hogy az emberekkel és a közösségekkel együttműködve fokozzák azok képességét arra, hogy a kívánt, szükséges vagy elvárt szakmákban dolgozhassanak, illetve a foglalkozás vagy a környezet módosításával jobban támogassák foglalkoztatási szerepvállalásukat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 36.8%-a jelölte

**Holland-kód:** SRC — R 48 · I 26 · A 12 · S 83 · E 14 · C 45

**HEXACO differenciál cél-profil:** H cél 65±20 (w=0.24) · A cél 62±22 (w=0.20) · O cél 38±22 (w=0.18) · C cél 40±23 (w=0.16)

**HEXACO abszolút szint:** H 60 · E 55 · X 48 · A 58 · C 42 · O 41

### podológus

`29-1081.00` · **ISCO-08 2269** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 2229 Egyéb humán-egészségügyi (társ)foglalkozású · ESCO `2269.6` · EN: Podiatrists

*Piaci megnevezések (ESCO):* lábápoló, podiáter, állat csontkovács, állat csontkovácsok, állat manuálterapeuta, szakkiropraktőr

A podológusok a láb fiziológiáját és patológiáját szerkezeti és funkcionális szempontból vizsgáló lábspecialisták.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 52.9%-a jelölte

**Holland-kód:** IRS — R 72 · I 80 · A 12 · S 66 · E 19 · C 38

**HEXACO differenciál cél-profil:** E cél 58±25 (w=0.35) · A cél 45±27 (w=0.21) · O cél 54±27 (w=0.17) · H cél 53±28 (w=0.12)

**HEXACO abszolút szint:** H 60 · E 49 · X 56 · A 55 · C 57 · O 58

### radiográfus

`29-2033.00` · **ISCO-08 2269** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 2229 Egyéb humán-egészségügyi (társ)foglalkozású · ESCO `2269.8.2` · EN: Nuclear Medicine Technologists

*Piaci megnevezések (ESCO):* radioterapeuta, orvosi képalkotó diagnosztikai és terápiás berendezés kezelője, kineziológus

A radiográfusok számos technológia segítségével vizsgálják, kezelik és gondozzák a betegeket.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 62.6%-a jelölte

**Holland-kód:** RIC — R 83 · I 76 · A 0 · S 35 · E 5 · C 70

**HEXACO differenciál cél-profil:** X cél 41±24 (w=0.28) · A cél 58±25 (w=0.23) · H cél 56±26 (w=0.19) · O cél 45±27 (w=0.15)

**HEXACO abszolút szint:** H 60 · E 47 · X 50 · A 61 · C 59 · O 51

### rekreációs terapeuta

`29-1129.01` · **ISCO-08 2269** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 2229 Egyéb humán-egészségügyi (társ)foglalkozású · ESCO `2269.9.2` · EN: Art Therapists

*Piaci megnevezések (ESCO):* pszichomotoros terapeuta, foglalkoztató terapeuta, ergoterapeuta, rehabilitációs terapeuta, munkaterápiás asszisztens, foglalkoztatásterápiás asszisztens

A rekreációs terapeuták a viselkedési rendellenességekkel vagy betegségekkel rendelkező személyek számára nyújtanak kezelést.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 90.6%-a jelölte

**Holland-kód:** SAI — R 33 · I 44 · A 75 · S 77 · E 22 · C 31

**HEXACO differenciál cél-profil:** C cél 32±18 (w=0.33) · A cél 62±22 (w=0.22) · H cél 59±24 (w=0.16) · O cél 58±25 (w=0.15)

**HEXACO abszolút szint:** H 68 · E 45 · X 61 · A 69 · C 48 · O 65

### rekreációs terapeuta

`29-1129.02` · **ISCO-08 2269** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 2229 Egyéb humán-egészségügyi (társ)foglalkozású · ESCO `2269.9.4` · EN: Music Therapists

*Piaci megnevezések (ESCO):* pszichomotoros terapeuta, foglalkoztató terapeuta, ergoterapeuta, rehabilitációs terapeuta

A rekreációs terapeuták a viselkedési rendellenességekkel vagy betegségekkel rendelkező személyek számára nyújtanak kezelést.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 73.1%-a jelölte

**Holland-kód:** SAI — R 23 · I 53 · A 63 · S 70 · E 25 · C 36

**HEXACO differenciál cél-profil:** C cél 34±19 (w=0.34) · A cél 62±22 (w=0.24) · H cél 58±25 (w=0.16) · E cél 56±26 (w=0.13)

**HEXACO abszolút szint:** H 68 · E 45 · X 62 · A 69 · C 49 · O 64

### állat csontkovács

`29-1011.00` · **ISCO-08 2269** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 2229 Egyéb humán-egészségügyi (társ)foglalkozású · ESCO `2269.1` · EN: Chiropractors

*Piaci megnevezések (ESCO):* állat csontkovácsok, állat manuálterapeuta, szakkiropraktőr, kiropraktőr, manuálterapeuta, podológus

Az állatok csontkovácsai terápiás kezelést nyújtanak az állatorvosi diagnózist vagy beutalót követően. A nemzeti jogszabályoknak megfelelően végzik a testszövetek manipulálását az állati izomhúzódások és sérülések kezelési technikáinak alkalmazása során.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 82.1%-a jelölte

**Holland-kód:** SRI — R 76 · I 63 · A 6 · S 76 · E 19 · C 42

**HEXACO differenciál cél-profil:** E cél 57±25 (w=0.32) · C cél 43±25 (w=0.31) · H cél 54±27 (w=0.18) · O cél 52±28 (w=0.10)

**HEXACO abszolút szint:** H 62 · E 48 · X 58 · A 60 · C 55 · O 58

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`19-4061.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.41` · EN: Social Science Research Assistants · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 52.7%-a jelölte

**Holland-kód:** ICS — R 23 · I 85 · A 15 · S 28 · E 21 · C 82

**HEXACO differenciál cél-profil:** O cél 63±21 (w=0.40) · X cél 42±25 (w=0.23) · A cél 45±27 (w=0.14) · E cél 54±27 (w=0.13)

**HEXACO abszolút szint:** H 50 · E 54 · X 44 · A 46 · C 50 · O 59

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1011.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.7` · EN: Business Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 72.8%-a jelölte

**Holland-kód:** SIE — R 17 · I 64 · A 37 · S 90 · E 47 · C 46

**HEXACO differenciál cél-profil:** O cél 61±22 (w=0.30) · X cél 59±24 (w=0.25) · C cél 41±24 (w=0.24) · E cél 56±26 (w=0.15)

**HEXACO abszolút szint:** H 57 · E 48 · X 63 · A 57 · C 49 · O 64

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1021.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.11` · EN: Computer Science Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 47.4%-a jelölte

**Holland-kód:** SIC — R 35 · I 78 · A 39 · S 81 · E 21 · C 50

**HEXACO differenciál cél-profil:** O cél 66±19 (w=0.45) · C cél 42±25 (w=0.21) · E cél 57±26 (w=0.19)

**HEXACO abszolút szint:** H 56 · E 49 · X 57 · A 58 · C 50 · O 67

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1022.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.11` · EN: Mathematical Science Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 43.0%-a jelölte

**Holland-kód:** SIC — R 30 · I 81 · A 37 · S 86 · E 16 · C 56

**HEXACO differenciál cél-profil:** O cél 62±22 (w=0.35) · E cél 56±26 (w=0.17) · H cél 44±26 (w=0.16) · A cél 46±27 (w=0.11)

**HEXACO abszolút szint:** H 51 · E 50 · X 57 · A 53 · C 52 · O 62

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1031.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.3` · EN: Architecture Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 44.6%-a jelölte

**Holland-kód:** SIA — R 40 · I 69 · A 58 · S 96 · E 24 · C 37

**HEXACO differenciál cél-profil:** O cél 66±19 (w=0.37) · C cél 41±24 (w=0.21) · H cél 44±26 (w=0.14) · X cél 56±26 (w=0.14)

**HEXACO abszolút szint:** H 53 · E 48 · X 60 · A 56 · C 48 · O 67

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1032.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.16` · EN: Engineering Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 58.6%-a jelölte

**Holland-kód:** SIR — R 64 · I 73 · A 36 · S 80 · E 17 · C 41

**HEXACO differenciál cél-profil:** O cél 67±19 (w=0.42) · C cél 42±25 (w=0.19) · X cél 55±27 (w=0.12)

**HEXACO abszolút szint:** H 56 · E 47 · X 60 · A 55 · C 51 · O 68

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1041.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.13` · EN: Agricultural Sciences Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 55.3%-a jelölte

**Holland-kód:** SIR — R 50 · I 73 · A 32 · S 87 · E 27 · C 42

**HEXACO differenciál cél-profil:** O cél 64±20 (w=0.36) · C cél 40±23 (w=0.25) · X cél 56±26 (w=0.16) · E cél 55±27 (w=0.12)

**HEXACO abszolút szint:** H 55 · E 48 · X 61 · A 57 · C 49 · O 66

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1042.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.13` · EN: Biological Science Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 48.4%-a jelölte

**Holland-kód:** SIR — R 49 · I 81 · A 38 · S 88 · E 17 · C 44

**HEXACO differenciál cél-profil:** O cél 64±21 (w=0.35) · C cél 41±24 (w=0.23) · E cél 56±26 (w=0.16) · X cél 56±26 (w=0.15)

**HEXACO abszolút szint:** H 56 · E 48 · X 61 · A 57 · C 50 · O 66

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1043.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.13` · EN: Forestry and Conservation Science Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 62.7%-a jelölte

**Holland-kód:** SIR — R 50 · I 82 · A 36 · S 91 · E 24 · C 39

**HEXACO differenciál cél-profil:** O cél 66±19 (w=0.42) · C cél 41±24 (w=0.23) · E cél 58±25 (w=0.20) · X cél 54±27 (w=0.11)

**HEXACO abszolút szint:** H 55 · E 51 · X 58 · A 55 · C 47 · O 66

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1051.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.13` · EN: Atmospheric, Earth, Marine, and Space Sciences Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 46.5%-a jelölte

**Holland-kód:** SIR — R 50 · I 77 · A 36 · S 92 · E 23 · C 43

**HEXACO differenciál cél-profil:** O cél 66±20 (w=0.40) · C cél 41±24 (w=0.22) · E cél 56±26 (w=0.14) · X cél 55±27 (w=0.12)

**HEXACO abszolút szint:** H 54 · E 49 · X 59 · A 56 · C 48 · O 66

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1052.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.8` · EN: Chemistry Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 35.3%-a jelölte

**Holland-kód:** ISR — R 51 · I 80 · A 32 · S 78 · E 18 · C 46

**HEXACO differenciál cél-profil:** O cél 65±20 (w=0.29) · H cél 37±21 (w=0.26) · A cél 37±21 (w=0.25)

**HEXACO abszolút szint:** H 46 · E 49 · X 57 · A 47 · C 56 · O 64

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1053.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.13` · EN: Environmental Science Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 52.5%-a jelölte

**Holland-kód:** ISR — R 45 · I 89 · A 40 · S 88 · E 25 · C 40

**HEXACO differenciál cél-profil:** O cél 68±18 (w=0.41) · C cél 41±24 (w=0.21) · X cél 55±26 (w=0.12) · H cél 45±27 (w=0.11)

**HEXACO abszolút szint:** H 55 · E 47 · X 60 · A 56 · C 49 · O 68

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1054.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.33` · EN: Physics Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 53.8%-a jelölte

**Holland-kód:** SIR — R 46 · I 83 · A 38 · S 84 · E 22 · C 44

**HEXACO differenciál cél-profil:** O cél 66±20 (w=0.42) · C cél 43±25 (w=0.18) · H cél 44±26 (w=0.15) · X cél 54±27 (w=0.10)

**HEXACO abszolút szint:** H 52 · E 47 · X 58 · A 54 · C 50 · O 66

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1061.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.1` · EN: Anthropology and Archeology Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 68.2%-a jelölte

**Holland-kód:** SIA — R 41 · I 83 · A 43 · S 96 · E 24 · C 38

**HEXACO differenciál cél-profil:** O cél 68±18 (w=0.40) · C cél 41±24 (w=0.20) · E cél 57±25 (w=0.16) · X cél 56±26 (w=0.14)

**HEXACO abszolút szint:** H 57 · E 50 · X 60 · A 55 · C 48 · O 68

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1062.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310` · EN: Area, Ethnic, and Cultural Studies Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

_(HU leírás nincs; EN:)_ Teach courses pertaining to the culture and development of an area, an ethnic group, or any other group, such as Latin American studies, women's studies, or urban affairs. Includes both teachers primarily engaged in teaching and those who do a combination of teaching and research.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 60.5%-a jelölte

**Holland-kód:** SIA — R 34 · I 72 · A 47 · S 99 · E 33 · C 34

**HEXACO differenciál cél-profil:** O cél 66±20 (w=0.35) · C cél 38±22 (w=0.28) · E cél 58±24 (w=0.19) · X cél 56±26 (w=0.14)

**HEXACO abszolút szint:** H 60 · E 48 · X 63 · A 60 · C 49 · O 68

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1063.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.14` · EN: Economics Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 80.8%-a jelölte

**Holland-kód:** SIC — R 29 · I 76 · A 34 · S 87 · E 39 · C 48

**HEXACO differenciál cél-profil:** O cél 65±20 (w=0.35) · X cél 58±25 (w=0.18) · C cél 43±25 (w=0.16) · H cél 44±26 (w=0.13)

**HEXACO abszolút szint:** H 52 · E 48 · X 60 · A 52 · C 48 · O 65

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1064.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310` · EN: Geography Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

_(HU leírás nincs; EN:)_ Teach courses in geography. Includes both teachers primarily engaged in teaching and those who do a combination of teaching and research.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 80.3%-a jelölte

**Holland-kód:** SIA — R 37 · I 78 · A 45 · S 96 · E 27 · C 44

**HEXACO differenciál cél-profil:** O cél 66±20 (w=0.37) · C cél 41±24 (w=0.21) · X cél 56±26 (w=0.16) · E cél 56±26 (w=0.14)

**HEXACO abszolút szint:** H 54 · E 50 · X 59 · A 55 · C 47 · O 66

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1065.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310` · EN: Political Science Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

_(HU leírás nincs; EN:)_ Teach courses in political science, international affairs, and international relations. Includes both teachers primarily engaged in teaching and those who do a combination of teaching and research.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 96.5%-a jelölte

**Holland-kód:** SIA — R 16 · I 74 · A 45 · S 98 · E 38 · C 34

**HEXACO differenciál cél-profil:** O cél 66±19 (w=0.39) · C cél 39±23 (w=0.27) · X cél 57±26 (w=0.16) · E cél 56±26 (w=0.15)

**HEXACO abszolút szint:** H 59 · E 48 · X 61 · A 57 · C 47 · O 67

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1066.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.35` · EN: Psychology Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 54.6%-a jelölte

**Holland-kód:** SIA — R 19 · I 76 · A 48 · S 100 · E 22 · C 38

**HEXACO differenciál cél-profil:** O cél 64±21 (w=0.31) · C cél 38±22 (w=0.28) · E cél 59±24 (w=0.20) · X cél 57±25 (w=0.16)

**HEXACO abszolút szint:** H 61 · E 48 · X 63 · A 60 · C 48 · O 67

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1067.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.38` · EN: Sociology Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 76.7%-a jelölte

**Holland-kód:** SIA — R 26 · I 78 · A 43 · S 95 · E 26 · C 38

**HEXACO differenciál cél-profil:** O cél 64±20 (w=0.36) · C cél 38±22 (w=0.29) · E cél 56±26 (w=0.17) · X cél 56±26 (w=0.15)

**HEXACO abszolút szint:** H 59 · E 48 · X 61 · A 58 · C 47 · O 66

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1071.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1` · EN: Health Specialties Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 35.9%-a jelölte

**Holland-kód:** SIC — R 38 · I 74 · A 33 · S 100 · E 16 · C 42

**HEXACO differenciál cél-profil:** O cél 62±22 (w=0.32) · C cél 41±24 (w=0.24) · E cél 57±26 (w=0.18) · X cél 55±27 (w=0.14)

**HEXACO abszolút szint:** H 58 · E 47 · X 62 · A 60 · C 52 · O 66

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1072.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.28` · EN: Nursing Instructors and Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 50.1%-a jelölte

**Holland-kód:** SIA — R 32 · I 65 · A 38 · S 100 · E 19 · C 36

**HEXACO differenciál cél-profil:** C cél 41±24 (w=0.41) · X cél 55±26 (w=0.24) · E cél 54±27 (w=0.20) · A cél 53±28 (w=0.14)

**HEXACO abszolút szint:** H 64 · E 42 · X 66 · A 65 · C 59 · O 60

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1081.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310` · EN: Education Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

_(HU leírás nincs; EN:)_ Teach courses pertaining to education, such as counseling, curriculum, guidance, instruction, teacher education, and teaching English as a second language. Includes both teachers primarily engaged in teaching and those who do a combination of teaching and research.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 89.8%-a jelölte

**Holland-kód:** SIC — R 28 · I 63 · A 41 · S 100 · E 28 · C 44

**HEXACO differenciál cél-profil:** O cél 64±21 (w=0.38) · C cél 38±22 (w=0.34) · X cél 56±26 (w=0.16) · E cél 54±27 (w=0.11)

**HEXACO abszolút szint:** H 60 · E 45 · X 62 · A 60 · C 49 · O 67

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1082.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1` · EN: Library Science Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 65.2%-a jelölte

**Holland-kód:** SIC — R 32 · I 74 · A 38 · S 88 · E 19 · C 53

**HEXACO differenciál cél-profil:** O cél 62±22 (w=0.34) · E cél 60±24 (w=0.26) · C cél 41±24 (w=0.23) · X cél 55±27 (w=0.14)

**HEXACO abszolút szint:** H 57 · E 52 · X 58 · A 55 · C 47 · O 63

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1111.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1` · EN: Criminal Justice and Law Enforcement Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 38.9%-a jelölte

**Holland-kód:** SIC — R 23 · I 65 · A 39 · S 98 · E 40 · C 43

**HEXACO differenciál cél-profil:** C cél 41±24 (w=0.26) · O cél 59±24 (w=0.26) · X cél 57±26 (w=0.19) · E cél 56±26 (w=0.18)

**HEXACO abszolút szint:** H 59 · E 50 · X 60 · A 57 · C 48 · O 61

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1112.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.22` · EN: Law Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: osztatlan szakmai diploma (pl. orvos, jogász) · a válaszadók 46.2%-a jelölte

**Holland-kód:** SIC — R 24 · I 72 · A 40 · S 91 · E 42 · C 45

**HEXACO differenciál cél-profil:** O cél 61±23 (w=0.29) · X cél 58±24 (w=0.23) · C cél 42±25 (w=0.22) · E cél 55±27 (w=0.13)

**HEXACO abszolút szint:** H 56 · E 47 · X 62 · A 57 · C 51 · O 64

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1121.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.27` · EN: Art, Drama, and Music Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 50.7%-a jelölte

**Holland-kód:** SAI — R 34 · I 52 · A 79 · S 100 · E 19 · C 27

**HEXACO differenciál cél-profil:** O cél 65±20 (w=0.31) · C cél 36±21 (w=0.29) · X cél 60±23 (w=0.21)

**HEXACO abszolút szint:** H 55 · E 48 · X 63 · A 58 · C 42 · O 66

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1122.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.10` · EN: Communications Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 70.8%-a jelölte

**Holland-kód:** SIA — R 20 · I 60 · A 47 · S 99 · E 36 · C 43

**HEXACO differenciál cél-profil:** C cél 37±22 (w=0.31) · O cél 61±23 (w=0.27) · X cél 58±25 (w=0.20) · E cél 55±27 (w=0.13)

**HEXACO abszolút szint:** H 59 · E 47 · X 63 · A 60 · C 46 · O 64

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1123.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.26` · EN: English Language and Literature Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 58.4%-a jelölte

**Holland-kód:** SIA — R 21 · I 63 · A 53 · S 100 · E 24 · C 42

**HEXACO differenciál cél-profil:** O cél 63±22 (w=0.35) · C cél 39±23 (w=0.30) · E cél 56±26 (w=0.17) · X cél 56±26 (w=0.15)

**HEXACO abszolút szint:** H 58 · E 48 · X 60 · A 57 · C 47 · O 65

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1124.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.26` · EN: Foreign Language and Literature Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 73.4%-a jelölte

**Holland-kód:** SIA — R 18 · I 59 · A 51 · S 100 · E 25 · C 42

**HEXACO differenciál cél-profil:** O cél 61±22 (w=0.31) · C cél 40±23 (w=0.28) · X cél 57±26 (w=0.18) · E cél 54±27 (w=0.11)

**HEXACO abszolút szint:** H 57 · E 46 · X 62 · A 59 · C 49 · O 64

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1125.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.20` · EN: History Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 69.6%-a jelölte

**Holland-kód:** SIA — R 30 · I 74 · A 49 · S 99 · E 27 · C 41

**HEXACO differenciál cél-profil:** O cél 62±22 (w=0.35) · C cél 42±24 (w=0.24) · X cél 57±26 (w=0.19) · E cél 55±27 (w=0.13)

**HEXACO abszolút szint:** H 57 · E 49 · X 59 · A 54 · C 47 · O 63

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1126.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.32` · EN: Philosophy and Religion Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 73.8%-a jelölte

**Holland-kód:** SIA — R 24 · I 69 · A 46 · S 100 · E 30 · C 41

**HEXACO differenciál cél-profil:** O cél 68±18 (w=0.37) · C cél 38±22 (w=0.25) · E cél 60±24 (w=0.20) · H cél 56±26 (w=0.13)

**HEXACO abszolút szint:** H 62 · E 51 · X 58 · A 58 · C 46 · O 69

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1192.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1` · EN: Family and Consumer Sciences Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 48.0%-a jelölte

**Holland-kód:** SIA — R 32 · I 64 · A 41 · S 100 · E 30 · C 40

**HEXACO differenciál cél-profil:** C cél 39±23 (w=0.30) · E cél 57±25 (w=0.19) · O cél 57±25 (w=0.19) · X cél 55±27 (w=0.14)

**HEXACO abszolút szint:** H 60 · E 48 · X 61 · A 61 · C 48 · O 61

### Egyetemek és egyéb felsőoktatási intézmények oktatói

`25-1193.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310` · EN: Recreation and Fitness Studies Teachers, Postsecondary · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Teach courses pertaining to recreation, leisure, and fitness studies, including exercise physiology and facilities management. Includes both teachers primarily engaged in teaching and those who do a combination of teaching and research.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 74.2%-a jelölte

**Holland-kód:** SIC — R 36 · I 62 · A 39 · S 100 · E 26 · C 44

**HEXACO differenciál cél-profil:** X cél 62±22 (w=0.30) · C cél 39±23 (w=0.28) · O cél 59±24 (w=0.23) · E cél 54±27 (w=0.10)

**HEXACO abszolút szint:** H 54 · E 48 · X 63 · A 56 · C 45 · O 61

### gyakorlati szociálismunka-oktató

`25-1113.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.2` · EN: Social Work Teachers, Postsecondary

*Piaci megnevezések (ESCO):* szociális munka oktató, oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár

A szociális munkával foglalkozó gyakorlati oktatók a szociális munkát végzőket tanítják, felügyelik és értékelik a diplomájuk megszerzése előtt, alatt és után.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 60.7%-a jelölte

**Holland-kód:** SIA — R 20 · I 67 · A 48 · S 100 · E 31 · C 34

**HEXACO differenciál cél-profil:** C cél 36±21 (w=0.31) · X cél 60±24 (w=0.22) · O cél 57±25 (w=0.16) · E cél 57±25 (w=0.16)

**HEXACO abszolút szint:** H 64 · E 47 · X 65 · A 61 · C 48 · O 62

### oktató felsőoktatási intézményben

`25-9044.00` · **ISCO-08 2310** Egyetemek és egyéb felsőoktatási intézmények oktatói · **FEOR-08:** 2410 Egyetemi, főiskolai oktató, tanár · ESCO `2310.1.42` · EN: Teaching Assistants, Postsecondary

*Piaci megnevezések (ESCO):* egyetemi tanár, főiskolai tanár

A felsőoktatási intézményekben dolgozó oktatók professzorok, tanárok vagy előadók, akik középiskolai végzettséggel rendelkező tanulókat oktatnak saját szakterületükön, elsősorban tudományos értelemben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: alapszak (BA/BSc) · a válaszadók 57.3%-a jelölte

**Holland-kód:** SCI — R 19 · I 36 · A 17 · S 92 · E 30 · C 66

**HEXACO differenciál cél-profil:** C cél 38±22 (w=0.34) · A cél 57±26 (w=0.18) · H cél 55±26 (w=0.15) · E cél 55±27 (w=0.14)

**HEXACO abszolút szint:** H 61 · E 48 · X 58 · A 60 · C 46 · O 57

### Szakoktatók

`25-1194.00` · **ISCO-08 2320** Szakoktatók · **FEOR-08:** 2422 Középfokú nevelési-oktatási intézményi szakoktató, 2. gyakorlati oktató · ESCO `2320` · EN: Career/Technical Education Teachers, Postsecondary · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szakoktató, műszaki szakoktató

_(HU leírás nincs; EN:)_ Teach vocational courses intended to provide occupational training below the baccalaureate level in subjects such as construction, mechanics/repair, manufacturing, transportation, or cosmetology, primarily to students who have graduated from or left high school.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 42.3%-a jelölte

**Holland-kód:** SIR — R 46 · I 52 · A 36 · S 94 · E 18 · C 38

**HEXACO differenciál cél-profil:** C cél 43±25 (w=0.29) · X cél 56±26 (w=0.25) · A cél 55±27 (w=0.21) · E cél 54±28 (w=0.15)

**HEXACO abszolút szint:** H 57 · E 46 · X 61 · A 61 · C 53 · O 56

### Gyógypedagógusok

`25-2059.01` · **ISCO-08 2352** Gyógypedagógusok · **FEOR-08:** 2441 Gyógypedagógus; 2442 Konduktor · ESCO `2352.1.6` · EN: Adapted Physical Education Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gyógypedagógus, jelnyelvtanár, sajátos nevelési igényű tanulók oktatója

A gyógypedagógusok értelmi vagy testi fogyatékossággal élő gyermekekkel, fiatalokkal, illetve felnőttekkel dolgoznak és tanítják őket.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: alapszak (BA/BSc) · a válaszadók 38.1%-a jelölte

**Holland-kód:** SCR — R 52 · I 44 · A 24 · S 100 · E 15 · C 53

**HEXACO differenciál cél-profil:** C cél 38±22 (w=0.31) · A cél 61±22 (w=0.29) · H cél 55±26 (w=0.14)

**HEXACO abszolút szint:** H 66 · E 43 · X 63 · A 68 · C 53 · O 55

### gyógypedagógus

`25-2051.00` · **ISCO-08 2352** Gyógypedagógusok · **FEOR-08:** 2441 Gyógypedagógus; 2442 Konduktor · ESCO `2352.1` · EN: Special Education Teachers, Preschool

*Piaci megnevezések (ESCO):* jelnyelvtanár, sajátos nevelési igényű tanulók oktatója

A gyógypedagógusok értelmi vagy testi fogyatékossággal élő gyermekekkel, fiatalokkal, illetve felnőttekkel dolgoznak és tanítják őket.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: alapszak (BA/BSc) · a válaszadók 31.7%-a jelölte

**Holland-kód:** SAI — R 28 · I 42 · A 50 · S 100 · E 12 · C 36

**HEXACO differenciál cél-profil:** A cél 64±20 (w=0.36) · C cél 38±22 (w=0.30) · H cél 57±26 (w=0.17)

**HEXACO abszolút szint:** H 70 · E 41 · X 64 · A 73 · C 58 · O 58

### gyógypedagógus

`25-2055.00` · **ISCO-08 2352** Gyógypedagógusok · **FEOR-08:** 2441 Gyógypedagógus; 2442 Konduktor · ESCO `2352.1` · EN: Special Education Teachers, Kindergarten

*Piaci megnevezések (ESCO):* jelnyelvtanár, sajátos nevelési igényű tanulók oktatója

A gyógypedagógusok értelmi vagy testi fogyatékossággal élő gyermekekkel, fiatalokkal, illetve felnőttekkel dolgoznak és tanítják őket.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** SIC — R 26 · I 47 · A 44 · S 100 · E 12 · C 44

**HEXACO differenciál cél-profil:** A cél 62±22 (w=0.35) · C cél 39±22 (w=0.32) · H cél 56±26 (w=0.17)

**HEXACO abszolút szint:** H 70 · E 40 · X 64 · A 72 · C 57 · O 58

### Könyvelők és könyvvizsgálók

`13-2099.04` · **ISCO-08 2411** Könyvelők és könyvvizsgálók · **FEOR-08:** 2512 Adótanácsadó, adószakértő; 2513 Könyvvizsgáló, könyvelő, könyvszakértő; 2514 Kontroller · ESCO `2411.1.9` · EN: Fraud Examiners, Investigators and Analysts · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* könyvelő, mérlegképes könyvelő, főkönyvelő

A könyvelők felülvizsgálják és elemzik a pénzügyi kimutatásokat, költségvetéseket, pénzügyi jelentéseket és üzleti terveket a tévedésből vagy csalásból eredő szabálytalanságok ellenőrzése céljából, és pénzügyi tanácsadást nyújtanak ügyfeleiknek az olyan kérdésekben, mint a pénzügyi előrejelzés és a kockázatelemzés.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 75.0%-a jelölte

**Holland-kód:** CIE — R 17 · I 61 · A 4 · S 16 · E 60 · C 77

**HEXACO differenciál cél-profil:** A cél 40±23 (w=0.28) · O cél 58±24 (w=0.24) · H cél 42±25 (w=0.21) · C cél 56±26 (w=0.18)

**HEXACO abszolút szint:** H 52 · E 44 · X 56 · A 50 · C 64 · O 61

### könyvelő

`13-2061.00` · **ISCO-08 2411** Könyvelők és könyvvizsgálók · **FEOR-08:** 2512 Adótanácsadó, adószakértő; 2513 Könyvvizsgáló, könyvelő, könyvszakértő; 2514 Kontroller · ESCO `2411.1.9` · EN: Financial Examiners

*Piaci megnevezések (ESCO):* mérlegképes könyvelő, főkönyvelő

A könyvelők felülvizsgálják és elemzik a pénzügyi kimutatásokat, költségvetéseket, pénzügyi jelentéseket és üzleti terveket a tévedésből vagy csalásból eredő szabálytalanságok ellenőrzése céljából, és pénzügyi tanácsadást nyújtanak ügyfeleiknek az olyan kérdésekben, mint a pénzügyi előrejelzés és a kockázatelemzés.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 87.0%-a jelölte

**Holland-kód:** CEI — R 6 · I 43 · A 0 · S 25 · E 60 · C 90

**HEXACO differenciál cél-profil:** A cél 37±21 (w=0.43) · C cél 55±26 (w=0.18) · H cél 55±26 (w=0.17)

**HEXACO abszolút szint:** H 58 · E 48 · X 55 · A 47 · C 62 · O 55

### pénzügyi elemző

`13-2099.01` · **ISCO-08 2413** Pénzügyi elemzők · **FEOR-08:** 2511 Pénzügyi elemző és befektetési tanácsadó · ESCO `2413.1` · EN: Financial Quantitative Analysts

*Piaci megnevezések (ESCO):* pénzpiaci elemző

A pénzügyi elemzők gazdasági kutatást végeznek, és olyan pénzügyi vonatkozású témákban végeznek értékes elemzéseket, mint a jövedelmezőség, a likviditás, a fizetőképesség és a vagyonkezelés.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 60.0%-a jelölte

**Holland-kód:** ICE — R 10 · I 94 · A 14 · S 10 · E 41 · C 80

**HEXACO differenciál cél-profil:** O cél 70±16 (w=0.33) · X cél 38±22 (w=0.18) · H cél 39±22 (w=0.18) · A cél 41±24 (w=0.15)

**HEXACO abszolút szint:** H 43 · E 47 · X 44 · A 45 · C 58 · O 65

### informatikus

`15-1221.00` · **ISCO-08 2511** Rendszerelemzők · **FEOR-08:** 2141 Rendszerelemző (informatikai) · ESCO `2511.1` · EN: Computer and Information Research Scientists

*Piaci megnevezések (ESCO):* IT kutató, IKT-kutatók, beágyazott rendszer tervező, beágyazott rendszer tervezők, beágyazott rendszer fejlesztő, IKT rendszerelemző

Az informatikusok az IKT jelenségei alapvető szempontjainak alaposabb ismerete és megértése érdekében informatikával és informatikával kapcsolatos kutatásokat végeznek.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: alapszak (BA/BSc) · a válaszadók 36.2%-a jelölte

**Holland-kód:** ICR — R 46 · I 100 · A 32 · S 17 · E 25 · C 63

**HEXACO differenciál cél-profil:** O cél 76±13 (w=0.58) · H cél 41±24 (w=0.20) · A cél 41±24 (w=0.19)

**HEXACO abszolút szint:** H 50 · E 48 · X 53 · A 48 · C 54 · O 72

### szoftverelemző

`15-1299.07` · **ISCO-08 2512** Szoftverfejlesztők · **FEOR-08:** 2142 Szoftverfejlesztő · ESCO `2512.1` · EN: Blockchain Engineers

*Piaci megnevezések (ESCO):* programozó elemző, alkalmazáselemző, felhasználói felület fejlesztő, front end fejlesztők, front end fejlesztő, szoftverfejlesztő

A szoftverelemzők kiderítik a felhasználói igényeket és fontossági sorrendet állítanak fel ezek között, szoftverspecifikációkat állítanak össze és dokumentálnak, tesztelik az alkalmazásukat és a szoftverfejlesztés során felülvizsgálják azokat.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** CIR — R 40 · I 71 · A 18 · S 10 · E 40 · C 78

**HEXACO differenciál cél-profil:** O cél 73±15 (w=0.42) · X cél 39±22 (w=0.21) · A cél 40±23 (w=0.18)

**HEXACO abszolút szint:** H 52 · E 46 · X 45 · A 46 · C 59 · O 69

### Máshová alkalmazásfejlesztők, -elemzők

`13-1199.04` · **ISCO-08 2519** Máshová alkalmazásfejlesztők, -elemzők · **FEOR-08:** — · ESCO `2519.4` · EN: Business Continuity Planners · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* IKT minőségbiztosítási menedzser, IT minőségügyi menedzser, IT minőségbiztosítási menedzser

Az IKT minőségbiztosítási menedzserek a belső és külső normákkal és a szervezet kultúrájával összhangban minőségirányítási rendszerek révén IKT-minőségi megközelítést dolgoznak ki és működtetnek.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 47.8%-a jelölte

**Holland-kód:** ECI — R 17 · I 56 · A 11 · S 34 · E 70 · C 68

**HEXACO differenciál cél-profil:** H cél 40±23 (w=0.33) · O cél 59±24 (w=0.29) · E cél 44±26 (w=0.18)

**HEXACO abszolút szint:** H 53 · E 39 · X 59 · A 57 · C 65 · O 63

### Adatbázis-tervezők és -rendszergazdák

`15-1243.01` · **ISCO-08 2521** Adatbázis-tervezők és -rendszergazdák · **FEOR-08:** 2151 Adatbázis-tervező és -üzemeltető · ESCO `2521.5` · EN: Data Warehousing Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* adattárház-tervező, adatraktár-fejlesztő, adatraktár-tervező, adatbázis adminisztrátor, DBA, adatbázis-konfigurációval foglalkozó szakember

Az adattárház-tervezők feladata az adattárházrendszerek tervezése, összekapcsolása, konstrukciója, ütemezése és üzembe helyezése.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 78.3%-a jelölte

**Holland-kód:** CIE — R 32 · I 63 · A 10 · S 17 · E 34 · C 90

**HEXACO differenciál cél-profil:** O cél 67±19 (w=0.32) · A cél 37±21 (w=0.24) · X cél 42±24 (w=0.15) · C cél 58±24 (w=0.15)

**HEXACO abszolút szint:** H 46 · E 53 · X 43 · A 41 · C 57 · O 61

### Máshová nem sorolható adatbázis- és hálózati 2159 Egyéb adatbázis- és hálózati elemző, üzemeltető foglalkozásúak

`15-1299.04` · **ISCO-08 2529** Máshová nem sorolható adatbázis- és hálózati 2159 Egyéb adatbázis- és hálózati elemző, üzemeltető foglalkozásúak · **FEOR-08:** — · ESCO `2529.1` · EN: Penetration Testers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* IKT biztonsági igazgató, biztonsági igazgatók, biztonsági főigazgató, digitális kriminalisztika szakértő, digitális kriminalisztika szakértők, digitális kriminalisztikával foglalkozó szakértő

A vezető IKT biztonsági tisztviselők védik a céginformációkat és a munkavállalók adatait a jogosulatlan hozzáféréssel szemben.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** ICR — R 48 · I 70 · A 5 · S 16 · E 18 · C 70

**HEXACO differenciál cél-profil:** O cél 74±14 (w=0.35) · X cél 35±20 (w=0.21) · C cél 62±22 (w=0.18) · H cél 40±23 (w=0.15)

**HEXACO abszolút szint:** H 43 · E 49 · X 40 · A 46 · C 61 · O 68

### digitális kriminalisztika szakértő

`15-1299.06` · **ISCO-08 2529** Máshová nem sorolható adatbázis- és hálózati 2159 Egyéb adatbázis- és hálózati elemző, üzemeltető foglalkozásúak · **FEOR-08:** — · ESCO `2529.2` · EN: Digital Forensics Analysts

*Piaci megnevezések (ESCO):* digitális kriminalisztika szakértők, digitális kriminalisztikával foglalkozó szakértő, IKT katasztrófaelhárítás menedzser, katasztrófaelhárításért felelős menedzser, IKT katasztrófaelhárítási menedzserek, IKT biztonsági menedzser

A digitális kriminalisztikai szakértők visszanyerik és elemzik a számítógépekből és más típusú adattároló eszközökből származó információkat.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** ICR — R 37 · I 85 · A 12 · S 11 · E 28 · C 84

**HEXACO differenciál cél-profil:** O cél 66±19 (w=0.32) · X cél 36±21 (w=0.26) · A cél 41±24 (w=0.16) · C cél 58±24 (w=0.16)

**HEXACO abszolút szint:** H 54 · E 44 · X 44 · A 48 · C 63 · O 65

### Bírák

`23-1021.00` · **ISCO-08 2612** Bírák · **FEOR-08:** 2613 Bíró · ESCO `2612.1` · EN: Administrative Law Judges, Adjudicators, and Hearing Officers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* bíró, közigazgatási és munkaügyi bíró, törvényszéki bíró, békebíró, kis értékű ügyek bírája, vizsgálóbíró

A bírósági ügyekben, a meghallgatások, fellebbezések és bírósági eljárások ügyében a bírák járnak el, ezeket felülvizsgálják és szolgáltatnak igazságot.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 37.3%-a jelölte

**Holland-kód:** CEI — R 0 · I 50 · A 12 · S 34 · E 68 · C 75

**HEXACO differenciál cél-profil:** A cél 40±23 (w=0.39) · H cél 59±24 (w=0.35)

**HEXACO abszolút szint:** H 60 · E 48 · X 55 · A 49 · C 58 · O 51

### bíró

`23-1023.00` · **ISCO-08 2612** Bírák · **FEOR-08:** 2613 Bíró · ESCO `2612.1` · EN: Judges, Magistrate Judges, and Magistrates

*Piaci megnevezések (ESCO):* közigazgatási és munkaügyi bíró, törvényszéki bíró, békebíró, kis értékű ügyek bírája, vizsgálóbíró

A bírósági ügyekben, a meghallgatások, fellebbezések és bírósági eljárások ügyében a bírák járnak el, ezeket felülvizsgálják és szolgáltatnak igazságot.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 66.5%-a jelölte

**Holland-kód:** ECS — R 22 · I 47 · A 20 · S 49 · E 71 · C 52

**HEXACO differenciál cél-profil:** A cél 34±19 (w=0.57) · H cél 57±26 (w=0.23) · X cél 54±27 (w=0.14)

**HEXACO abszolút szint:** H 60 · E 45 · X 58 · A 46 · C 61 · O 54

### Máshová nem sorolható jogi foglalkozásúak

`23-1022.00` · **ISCO-08 2619** Máshová nem sorolható jogi foglalkozásúak · **FEOR-08:** 2611 Jogász, jogtanácsos; 2614 Közjegyző; 2619 Egyéb jogi foglalkozású; 2910 Egyéb magasan képzett ügyintéző · ESCO `2619.10` · EN: Arbitrators, Mediators, and Conciliators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szabályozási menedzser, szabályozási szakértő, compliance szakértő, választási megfigyelő

A szabályozásügyi menedzserek több ágazatban, például az egészségügyi, az energetikai és a banki ágazatban tevékenykednek, a szabályozási és jogi ügyekben felelősek.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: osztatlan szakmai diploma (pl. orvos, jogász) · a válaszadók 36.8%-a jelölte

**Holland-kód:** ECS — R 2 · I 44 · A 21 · S 54 · E 60 · C 56

**HEXACO differenciál cél-profil:** H cél 64±21 (w=0.29) · A cél 63±21 (w=0.28) · C cél 38±22 (w=0.27)

**HEXACO abszolút szint:** H 72 · E 43 · X 59 · A 69 · C 54 · O 56

### kiállítási adminisztrátor

`25-4012.00` · **ISCO-08 2621** Levél- és irattárosok, muzeológusok · **FEOR-08:** 2712 Levéltáros; 2713 Muzeológus, múzeumi gyűjteménygondnok · ESCO `2621.6` · EN: Curators

*Piaci megnevezések (ESCO):* adminisztrátor, levéltáros, ingatlan-nyilvántartó levéltáros, művészeti oktatási tisztviselő, művészeti mediátor, mediációs és oktatási tisztviselő

A kiállítási regisztrátorok szervezik, irányítják és dokumentálják a múzeumi tárgyak mozgását a raktárból, tárlókból és kiállításokból, illetve ezekre a helyekre vissza.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 44.0%-a jelölte

**Holland-kód:** CES — R 24 · I 40 · A 33 · S 47 · E 47 · C 73

**HEXACO differenciál cél-profil:** O cél 62±22 (w=0.33) · E cél 57±25 (w=0.21) · X cél 56±26 (w=0.17) · C cél 45±27 (w=0.13)

**HEXACO abszolút szint:** H 57 · E 49 · X 61 · A 55 · C 56 · O 64

### levéltáros

`25-4011.00` · **ISCO-08 2621** Levél- és irattárosok, muzeológusok · **FEOR-08:** 2712 Levéltáros; 2713 Muzeológus, múzeumi gyűjteménygondnok · ESCO `2621.1` · EN: Archivists

*Piaci megnevezések (ESCO):* ingatlan-nyilvántartó levéltáros, művészeti oktatási tisztviselő, művészeti mediátor, mediációs és oktatási tisztviselő, kulturális örökségvédelmi szakember, műemlékvédelmi szakember

A levéltárosok felmérik, összegyűjtik, megszervezik és megőrzik a nyilvántartásokat és az archívumokat, illetve biztosítják a hozzájuk való hozzáférést.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 83.9%-a jelölte

**Holland-kód:** CIS — R 31 · I 62 · A 32 · S 33 · E 14 · C 83

**HEXACO differenciál cél-profil:** E cél 64±20 (w=0.33) · O cél 61±23 (w=0.25) · A cél 42±25 (w=0.17) · H cél 57±25 (w=0.16)

**HEXACO abszolút szint:** H 57 · E 58 · X 50 · A 48 · C 55 · O 59

### Szociológusok, antropológusok, és hasonló foglalkozásúak foglalkozásúak foglalkozásúak

`19-4092.00` · **ISCO-08 2632** Szociológusok, antropológusok, és hasonló foglalkozásúak foglalkozásúak foglalkozásúak · **FEOR-08:** 2623 Néprajzkutató; 2626 Szociológus, demográfus; 2629 Egyéb társadalomtudományi foglalkozású · ESCO `2632.4` · EN: Forensic Science Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* kriminológus, kriminológiai szakértő, kriminológiai kutató, tanatológus, tanatológiai kutató

A kriminológusok olyan, embereket érintő társadalmi és pszichológiai körülményeket vizsgálnak, amelyek bűncselekmény elkövetésére sarkallhatják őket.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 36.3%-a jelölte

**Holland-kód:** IRC — R 70 · I 82 · A 13 · S 8 · E 10 · C 66

**HEXACO differenciál cél-profil:** X cél 38±22 (w=0.29) · H cél 58±24 (w=0.22) · O cél 57±25 (w=0.19) · E cél 46±27 (w=0.11)

**HEXACO abszolút szint:** H 61 · E 43 · X 47 · A 52 · C 61 · O 59

### antropológus

`19-3091.00` · **ISCO-08 2632** Szociológusok, antropológusok, és hasonló foglalkozásúak foglalkozásúak foglalkozásúak · **FEOR-08:** 2623 Néprajzkutató; 2626 Szociológus, demográfus; 2629 Egyéb társadalomtudományi foglalkozású · ESCO `2632.1` · EN: Anthropologists and Archeologists

*Piaci megnevezések (ESCO):* kulturális mediátor, kulturális közvetítő, régész, archeológus, tengeri régész

Az antropológusok az emberi életet vizsgálják minden tekintetben. Tanulmányozzák az idők során létezett különböző civilizációkat és azok szerveződési módját.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 40.0%-a jelölte

**Holland-kód:** IAR — R 50 · I 97 · A 54 · S 44 · E 10 · C 36

**HEXACO differenciál cél-profil:** O cél 71±16 (w=0.51) · C cél 40±24 (w=0.23) · E cél 58±25 (w=0.20)

**HEXACO abszolút szint:** H 59 · E 50 · X 56 · A 57 · C 48 · O 70

### geográfus

`19-3092.00` · **ISCO-08 2632** Szociológusok, antropológusok, és hasonló foglalkozásúak foglalkozásúak foglalkozásúak · **FEOR-08:** 2623 Néprajzkutató; 2626 Szociológus, demográfus; 2629 Egyéb társadalomtudományi foglalkozású · ESCO `2632.5` · EN: Geographers

*Piaci megnevezések (ESCO):* kultúrgeográfus, gazdasági geográfus

A geográfusok a humán és a természetföldrajzot tanulmányozzák. Szakosodásuktól függően az emberiség földrajzának politikai, gazdasági és kulturális szempontjait tanulmányozzák.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 45.0%-a jelölte

**Holland-kód:** IRA — R 68 · I 96 · A 45 · S 29 · E 18 · C 45

**HEXACO differenciál cél-profil:** O cél 74±14 (w=0.55) · A cél 41±24 (w=0.21) · H cél 45±27 (w=0.11)

**HEXACO abszolút szint:** H 46 · E 53 · X 48 · A 43 · C 46 · O 66

### szociológus

`19-3041.00` · **ISCO-08 2632** Szociológusok, antropológusok, és hasonló foglalkozásúak foglalkozásúak foglalkozásúak · **FEOR-08:** 2623 Néprajzkutató; 2626 Szociológus, demográfus; 2629 Egyéb társadalomtudományi foglalkozású · ESCO `2632.6` · EN: Sociologists

*Piaci megnevezések (ESCO):* kulturális mediátor, gazdaságszociológus, antropológus, kulturális közvetítő, viselkedéskutató, viselkedéselemző

A szociológusok a társadalmi és társas viselkedést tanulmányozzák, illetve azt vizsgálják, hogyan az emberek szerveződnek a társadalomban.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 50.0%-a jelölte

**Holland-kód:** ISA — R 9 · I 92 · A 50 · S 56 · E 35 · C 43

**HEXACO differenciál cél-profil:** O cél 71±16 (w=0.45) · C cél 40±23 (w=0.22) · E cél 60±24 (w=0.21)

**HEXACO abszolút szint:** H 59 · E 53 · X 54 · A 55 · C 45 · O 69

### politológus

`19-3094.00` · **ISCO-08 2633** Filozófusok, történészek és politológusok · **FEOR-08:** 2621 Filozófus, politológus 3.; 2622 Történész, régész · ESCO `2633.3` · EN: Political Scientists

*Piaci megnevezések (ESCO):* konfliktuskutató, politológiai kutató

A politológusok a politikai magatartást, a politikai aktivitást és a politikai rendszereket, illetve ezek elemeit tanulmányozzák.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 88.5%-a jelölte

**Holland-kód:** IAE — R 0 · I 95 · A 48 · S 40 · E 44 · C 42

**HEXACO differenciál cél-profil:** O cél 73±14 (w=0.55) · A cél 41±24 (w=0.21) · C cél 45±27 (w=0.11)

**HEXACO abszolút szint:** H 51 · E 49 · X 53 · A 47 · C 46 · O 68

### történész

`19-3093.00` · **ISCO-08 2633** Filozófusok, történészek és politológusok · **FEOR-08:** 2621 Filozófus, politológus 3.; 2622 Történész, régész · ESCO `2633.1` · EN: Historians

*Piaci megnevezések (ESCO):* egyiptológus, politikatörténész

Történészek az emberi társadalmak múltját kutatják, elemzik, értelmezik és mutatják be. A korábbi társadalmak megértése érdekében elemzik a múltból származó dokumentumokat, forrásokat és nyomokat.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 64.5%-a jelölte

**Holland-kód:** ICA — R 23 · I 72 · A 45 · S 37 · E 22 · C 64

**HEXACO differenciál cél-profil:** O cél 72±15 (w=0.39) · A cél 35±20 (w=0.26) · E cél 60±23 (w=0.18)

**HEXACO abszolút szint:** H 52 · E 57 · X 46 · A 41 · C 49 · O 65

### Pszichológusok

`19-3039.02` · **ISCO-08 2634** Pszichológusok · **FEOR-08:** 2628 Pszichológus · ESCO `2634.2` · EN: Neuropsychologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* pszichológus, pszichológiai kutató, tanácsadó pszichológus

A pszichológusok az emberek viselkedését és a bennük zajló mentális folyamatokat tanulmányozzák.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 84.0%-a jelölte

**Holland-kód:** ISC — R 27 · I 100 · A 38 · S 72 · E 12 · C 39

**HEXACO differenciál cél-profil:** O cél 60±23 (w=0.24) · X cél 42±24 (w=0.20) · H cél 58±25 (w=0.19) · E cél 58±25 (w=0.18)

**HEXACO abszolút szint:** H 66 · E 47 · X 54 · A 58 · C 58 · O 64

### Pszichológusok

`19-3039.03` · **ISCO-08 2634** Pszichológusok · **FEOR-08:** 2628 Pszichológus · ESCO `2634.2.1` · EN: Clinical Neuropsychologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* pszichológus, pszichológiai kutató, tanácsadó pszichológus

A pszichológusok az emberek viselkedését és a bennük zajló mentális folyamatokat tanulmányozzák.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 91.7%-a jelölte

**Holland-kód:** ISC — R 30 · I 100 · A 23 · S 78 · E 18 · C 42

**HEXACO differenciál cél-profil:** X cél 42±24 (w=0.22) · O cél 58±25 (w=0.21) · E cél 57±25 (w=0.19) · C cél 44±26 (w=0.16)

**HEXACO abszolút szint:** H 67 · E 45 · X 56 · A 64 · C 61 · O 65

### pszichológus

`19-3032.00` · **ISCO-08 2634** Pszichológusok · **FEOR-08:** 2628 Pszichológus · ESCO `2634.2` · EN: Industrial-Organizational Psychologists

*Piaci megnevezések (ESCO):* pszichológiai kutató, tanácsadó pszichológus

A pszichológusok az emberek viselkedését és a bennük zajló mentális folyamatokat tanulmányozzák.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 57.7%-a jelölte

**Holland-kód:** IEC — R 1 · I 72 · A 36 · S 50 · E 62 · C 55

**HEXACO differenciál cél-profil:** O cél 64±21 (w=0.38) · C cél 41±24 (w=0.24) · E cél 56±26 (w=0.16) · X cél 54±27 (w=0.11)

**HEXACO abszolút szint:** H 62 · E 45 · X 63 · A 63 · C 56 · O 69

### Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek

`21-1011.00` · **ISCO-08 2635** Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek · **FEOR-08:** 2311 Szociálpolitikus; 2312 Szociális munkás és tanácsadó · ESCO `2635.3.24` · EN: Substance Abuse and Behavioral Disorder Counselors · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szociális munkás, kulturális mediátor, kulturális közvetítő, szociális tanácsadó, pszichoterapeuta, párkapcsolati tanácsadó

A szociális munkások gyakorlatalapú szakemberek, akik előmozdítják a társadalmi változást és fejlődést, a társadalmi kohéziót, valamint az emberek fokozott szerepvállalását és felszabadulását.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 41.4%-a jelölte

**Holland-kód:** SIC — R 10 · I 47 · A 26 · S 94 · E 28 · C 36

**HEXACO differenciál cél-profil:** H cél 65±20 (w=0.33) · C cél 38±22 (w=0.25) · A cél 59±24 (w=0.20) · O cél 43±25 (w=0.16)

**HEXACO abszolút szint:** H 73 · E 42 · X 62 · A 67 · C 54 · O 53

### Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek

`21-1015.00` · **ISCO-08 2635** Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek · **FEOR-08:** 2311 Szociálpolitikus; 2312 Szociális munkás és tanácsadó · ESCO `2635.3.22` · EN: Rehabilitation Counselors · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szociális munkás, kulturális mediátor, kulturális közvetítő

A szociális munkások gyakorlatalapú szakemberek, akik előmozdítják a társadalmi változást és fejlődést, a társadalmi kohéziót, valamint az emberek fokozott szerepvállalását és felszabadulását.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 55.9%-a jelölte

**Holland-kód:** SEI — R 4 · I 38 · A 33 · S 97 · E 43 · C 38

**HEXACO differenciál cél-profil:** H cél 61±23 (w=0.24) · C cél 41±24 (w=0.20) · E cél 58±25 (w=0.18) · O cél 42±25 (w=0.17)

**HEXACO abszolút szint:** H 68 · E 47 · X 64 · A 62 · C 54 · O 52

### Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek

`21-1092.00` · **ISCO-08 2635** Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek · **FEOR-08:** 2311 Szociálpolitikus; 2312 Szociális munkás és tanácsadó · ESCO `2635.3.21` · EN: Probation Officers and Correctional Treatment Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szociális munkás, kulturális mediátor, kulturális közvetítő, szociális tanácsadó, pszichoterapeuta, párkapcsolati tanácsadó

A szociális munkások gyakorlatalapú szakemberek, akik előmozdítják a társadalmi változást és fejlődést, a társadalmi kohéziót, valamint az emberek fokozott szerepvállalását és felszabadulását.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 88.0%-a jelölte

**Holland-kód:** SCE — R 22 · I 41 · A 19 · S 76 · E 49 · C 53

**HEXACO differenciál cél-profil:** H cél 61±22 (w=0.28) · O cél 40±24 (w=0.24) · C cél 43±25 (w=0.18) · A cél 55±27 (w=0.13)

**HEXACO abszolút szint:** H 68 · E 41 · X 62 · A 63 · C 56 · O 50

### Vallási foglalkozásúak

`21-2011.00` · **ISCO-08 2636** Vallási foglalkozásúak · **FEOR-08:** 2730 Pap (lelkész), egyházi foglalkozású · ESCO `2636.1` · EN: Clergy · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* lelkész/lelkésznő, egyetemi lelkész, kórházi lelkésznő, vallási vezető, tiszteletesnő, buddhista szerzetesnő

A káplánok vallási tevékenységeket végeznek a világi intézményekben.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 47.8%-a jelölte

**Holland-kód:** SEA — R 18 · I 18 · A 41 · S 82 · E 53 · C 32

**HEXACO differenciál cél-profil:** H cél 74±14 (w=0.36) · C cél 33±19 (w=0.25) · X cél 59±24 (w=0.14) · E cél 59±24 (w=0.14)

**HEXACO abszolút szint:** H 83 · E 44 · X 70 · A 67 · C 52 · O 57

### Vallási foglalkozásúak

`21-2021.00` · **ISCO-08 2636** Vallási foglalkozásúak · **FEOR-08:** 2730 Pap (lelkész), egyházi foglalkozású · ESCO `2636` · EN: Directors, Religious Activities and Education · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* lelkész/lelkésznő, egyetemi lelkész, kórházi lelkésznő, vallási vezető, tiszteletesnő, buddhista szerzetesnő

_(HU leírás nincs; EN:)_ Coordinate or design programs and conduct outreach to promote the religious education or activities of a denominational group. May provide counseling, guidance, and leadership relative to marital, health, financial, and religious problems.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 53.6%-a jelölte

**Holland-kód:** SEA — R 0 · I 28 · A 40 · S 100 · E 86 · C 36

**HEXACO differenciál cél-profil:** C cél 35±20 (w=0.30) · H cél 64±21 (w=0.28) · X cél 60±23 (w=0.20)

**HEXACO abszolút szint:** H 74 · E 42 · X 69 · A 66 · C 53 · O 58

### Írók és hasonló szerzők

`27-3043.05` · **ISCO-08 2641** Írók és hasonló szerzők · **FEOR-08:** 2715 Könyv- és lapkiadó szerkesztője; 2721 Író (újságíró nélkül) · ESCO `2641.4` · EN: Poets, Lyricists and Creative Writers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* író, tankönyvíró, kreatív író, könyvszerkesztő, kéziratszerkesztő, kiadói szerkesztő

Az író a könyvek tartalmát fejlesztik. Regényeket, verseket, novellákat, képregényeket és egyéb irodalmi műveket írnak. Az írás ilyen formái lehetnek fiktívek vagy nem fiktívek.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 31.8%-a jelölte

**Holland-kód:** AIE — R 3 · I 43 · A 100 · S 30 · E 36 · C 31

**HEXACO differenciál cél-profil:** O cél 84±12 (w=0.48) · A cél 35±20 (w=0.22) · H cél 41±24 (w=0.13)

**HEXACO abszolút szint:** H 37 · E 55 · X 46 · A 35 · C 28 · O 70

### Vizuális művészek

`27-1013.00` · **ISCO-08 2651** Vizuális művészek · **FEOR-08:** 2722 Képzőművész · ESCO `2651.1` · EN: Fine Artists, Including Painters, Sculptors, and Illustrators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* festőművész, utcai festő, tájképfestő, konceptuális művész, konceptművész, rajzművész

A festőművészek olaj- vagy vízfesték, illetve pasztellkréta segítségével, saját kezűleg és/vagy teljes egészében az ellenőrzésük alatt állók hoznak létre festményeket, miniatúrákat, illetve rajzokat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: megkezdett felsőfokú tanulmányok · a válaszadók 37.0%-a jelölte

**Holland-kód:** ARI — R 51 · I 28 · A 100 · S 21 · E 23 · C 22

**HEXACO differenciál cél-profil:** O cél 80±12 (w=0.52) · A cél 39±23 (w=0.18) · H cél 43±26 (w=0.12)

**HEXACO abszolút szint:** H 39 · E 54 · X 46 · A 38 · C 30 · O 68

### Zenészek, énekesek és zeneszerzők

`27-2091.00` · **ISCO-08 2652** Zenészek, énekesek és zeneszerzők · **FEOR-08:** 2724 Zeneszerző, zenész, énekes · ESCO `2652` · EN: Disc Jockeys, Except Radio · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Play prerecorded music for live audiences at venues or events such as clubs, parties, or wedding receptions. May use techniques such as mixing, cutting, or sampling to manipulate recordings.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: —

**Holland-kód:** AEC — R 33 · I 9 · A 64 · S 32 · E 42 · C 42

**HEXACO differenciál cél-profil:** X cél 72±16 (w=0.28) · H cél 31±17 (w=0.25) · C cél 36±21 (w=0.18) · E cél 39±23 (w=0.14)

**HEXACO abszolút szint:** H 36 · E 43 · X 64 · A 54 · C 36 · O 54

### zenei igazgató

`27-2041.00` · **ISCO-08 2652** Zenészek, énekesek és zeneszerzők · **FEOR-08:** 2724 Zeneszerző, zenész, énekes · ESCO `2652.2` · EN: Music Directors and Composers

*Piaci megnevezések (ESCO):* rádióigazgató-helyettes, zenei igazgatóhelyettes, zeneszerző, számítógépes zeneszerző, hangmester, zenész

A zenei vezetők együtteseket, például zenekarokat és együtteseket vezetnek élő előadások, illetve stúdiófelvételek során. Megszervezi a zenét és az együttes összetételét, koordinálja a játszó zenészeket és rögzíti a teljesítményt.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: mesterszak (MA/MSc) · a válaszadók 28.2%-a jelölte

**Holland-kód:** AES — R 18 · I 21 · A 100 · S 34 · E 64 · C 27

**HEXACO differenciál cél-profil:** X cél 67±18 (w=0.25) · H cél 33±18 (w=0.24) · O cél 67±19 (w=0.24) · C cél 38±22 (w=0.17)

**HEXACO abszolút szint:** H 46 · E 40 · X 68 · A 58 · C 46 · O 68

### koreográfus

`27-2032.00` · **ISCO-08 2653** Táncosok és koreográfusok · **FEOR-08:** 2727 Táncművész, koreográfus · ESCO `2653.1` · EN: Choreographers

*Piaci megnevezések (ESCO):* táncművész, balettkoreográfus

A koreográfusok olyan mozgássorokat hoznak létre, amelyekhez mozgás, testi erőnlét vagy mindkettő szükséges.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 33.3%-a jelölte

**Holland-kód:** ASE — R 44 · I 20 · A 100 · S 49 · E 46 · C 19

**HEXACO differenciál cél-profil:** H cél 24±13 (w=0.28) · X cél 70±17 (w=0.22) · O cél 67±19 (w=0.19) · C cél 38±22 (w=0.14)

**HEXACO abszolút szint:** H 38 · E 41 · X 68 · A 60 · C 40 · O 67

### táncos

`27-2031.00` · **ISCO-08 2653** Táncosok és koreográfusok · **FEOR-08:** 2727 Táncművész, koreográfus · ESCO `2653.2` · EN: Dancers

*Piaci megnevezések (ESCO):* táncművész, balett-táncos

A táncosok a közönség számára értelmezik az ötleteket, érzéseket, történeteket vagy karaktereket, és ehhez elsősorban zenei kísérettel használják a mozgást és a testbeszédet.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 45.1%-a jelölte

**Holland-kód:** ARS — R 64 · I 7 · A 90 · S 44 · E 36 · C 10

**HEXACO differenciál cél-profil:** H cél 26±14 (w=0.34) · E cél 32±18 (w=0.26) · X cél 61±22 (w=0.16) · A cél 59±24 (w=0.12)

**HEXACO abszolút szint:** H 31 · E 40 · X 56 · A 53 · C 40 · O 53

### Film, színház- és hasonló rendezők, producerek

`27-2012.03` · **ISCO-08 2654** Film, színház- és hasonló rendezők, producerek · **FEOR-08:** 2725 Rendező, operatőr · ESCO `2654.1.8` · EN: Media Programming Directors · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* utómunka-vezető, utómunka-felügyelő, utómunka-koordinátor, producer, rádióproducer, rádiós szerkesztő

Az utómunka-vezetők a gyártás utáni teljes folyamat felügyelik. Együtt dolgoznak a zenei vágóval, valamint a video- és filmvágóval.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 52.0%-a jelölte

**Holland-kód:** ECA — R 7 · I 21 · A 52 · S 45 · E 92 · C 60

**HEXACO differenciál cél-profil:** H cél 34±20 (w=0.29) · X cél 64±20 (w=0.27) · O cél 59±24 (w=0.16) · C cél 43±25 (w=0.13)

**HEXACO abszolút szint:** H 47 · E 40 · X 66 · A 58 · C 52 · O 62

### utómunka-vezető

`27-2012.05` · **ISCO-08 2654** Film, színház- és hasonló rendezők, producerek · **FEOR-08:** 2725 Rendező, operatőr · ESCO `2654.1.7` · EN: Media Technical Directors/Managers

*Piaci megnevezések (ESCO):* utómunka-felügyelő, utómunka-koordinátor, producer, rádióproducer, rádiós szerkesztő, rádiós producer

Az utómunka-vezetők a gyártás utáni teljes folyamat felügyelik. Együtt dolgoznak a zenei vágóval, valamint a video- és filmvágóval.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 92.1%-a jelölte

**Holland-kód:** ECR — R 49 · I 30 · A 41 · S 27 · E 70 · C 58

**HEXACO differenciál cél-profil:** H cél 34±19 (w=0.31) · X cél 61±23 (w=0.21) · E cél 42±24 (w=0.16) · A cél 56±26 (w=0.12)

**HEXACO abszolút szint:** H 44 · E 41 · X 61 · A 58 · C 51 · O 57

### Színművészek

`27-2011.00` · **ISCO-08 2655** Színművészek · **FEOR-08:** 2726 Színész, bábművész · ESCO `2655` · EN: Actors · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* színész, előadóművész, musicalszínész

_(HU leírás nincs; EN:)_ Play parts in stage, television, radio, video, or film productions, or other settings for entertainment, information, or instruction. Interpret serious or comic role by speech, gesture, and body movement to entertain or inform audience.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 45.4%-a jelölte

**Holland-kód:** ASE — R 22 · I 19 · A 100 · S 51 · E 50 · C 14

**HEXACO differenciál cél-profil:** H cél 8±12 (w=0.35) · E cél 29±16 (w=0.18) · A cél 69±18 (w=0.15) · O cél 65±20 (w=0.12)

**HEXACO abszolút szint:** H 21 · E 36 · X 60 · A 62 · C 37 · O 61

### Rádió-, televízió- és egyéb médiabemondók

`27-3011.00` · **ISCO-08 2656** Rádió-, televízió- és egyéb médiabemondók · **FEOR-08:** 3719 Egyéb művészeti és kulturális foglalkozású · ESCO `2656` · EN: Broadcast Announcers and Radio Disc Jockeys · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* hírolvasó, televíziós hírolvasó, híradós, műsorvezető, sportriporter, rádiós műsorvezető

_(HU leírás nincs; EN:)_ Speak or read from scripted materials, such as news reports or commercial messages, on radio, television, or other communications media. May play and queue music, announce artist or title of performance, identify station, or interview guests.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 35.2%-a jelölte

**Holland-kód:** AES — R 11 · I 17 · A 78 · S 42 · E 56 · C 35

**HEXACO differenciál cél-profil:** X cél 70±16 (w=0.29) · H cél 35±20 (w=0.21) · E cél 36±20 (w=0.20) · C cél 39±23 (w=0.15)

**HEXACO abszolút szint:** H 40 · E 40 · X 64 · A 56 · C 39 · O 53


## 3 — Egyéb felsőfokú vagy középfokú képzettséget igénylő foglalkozások

### Kémia- és fizika tudományok technikusai

`19-4043.00` · **ISCO-08 3111** Kémia- és fizika tudományok technikusai · **FEOR-08:** 3139 Egyéb, máshova nem sorolható technikus · ESCO `3111.4` · EN: Geological Technicians, Except Hydrologic Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* geológiai technikus, geológus-geofizikus technikus, olajipari technikus, talajvizsgáló technikus, talajelemző

A geológiai technikusok segítik geológusok által végzett valamennyi tevékenységet.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: —

**Holland-kód:** RCI — R 77 · I 70 · A 5 · S 8 · E 2 · C 72

**HEXACO differenciál cél-profil:** O cél 62±22 (w=0.35) · X cél 42±25 (w=0.23) · E cél 55±26 (w=0.16) · C cél 54±28 (w=0.11)

**HEXACO abszolút szint:** H 45 · E 59 · X 39 · A 42 · C 45 · O 53

### Kémia- és fizika tudományok technikusai

`19-4044.00` · **ISCO-08 3111** Kémia- és fizika tudományok technikusai · **FEOR-08:** 3139 Egyéb, máshova nem sorolható technikus · ESCO `3111.5` · EN: Hydrologic Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* vízrajzi mérőtechnikus, hidrográfiai mérőtechnikus, hidrográfiai mérőtechnikus asszisztens

A vízrajzi méréstechnikusok tengeri környezetben oceanográfiai és felméréseket végeznek.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: —

**Holland-kód:** RCI — R 75 · I 65 · A 0 · S 11 · E 8 · C 71

**HEXACO differenciál cél-profil:** O cél 62±22 (w=0.42) · X cél 43±25 (w=0.27) · E cél 53±28 (w=0.11) · C cél 53±28 (w=0.11)

**HEXACO abszolút szint:** H 50 · E 53 · X 44 · A 48 · C 52 · O 58

### nukleáris technikus

`19-4051.00` · **ISCO-08 3111** Kémia- és fizika tudományok technikusai · **FEOR-08:** 3139 Egyéb, máshova nem sorolható technikus · ESCO `3111.10` · EN: Nuclear Technicians

*Piaci megnevezések (ESCO):* sugárvédelmi technikus, nukleáris laboratóriumi technikus, vegyésztechnikus, radiokémiai technikus, vegyészeti laboratóriumi technikus, fizikatudományi technikus

A nukleáris technikusok fizikusok és mérnökök munkáját segítik nukleáris laboratóriumokban és erőművekben. Nyomon követik a biztonságot és a minőség-ellenőrzést, valamint a berendezések karbantartását biztosító eljárásokat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: —

**Holland-kód:** RCI — R 79 · I 60 · A 0 · S 14 · E 21 · C 68

**HEXACO differenciál cél-profil:** X cél 32±18 (w=0.33) · C cél 60±23 (w=0.19) · H cél 59±24 (w=0.17) · A cél 57±25 (w=0.13)

**HEXACO abszolút szint:** H 58 · E 46 · X 41 · A 57 · C 64 · O 47

### nukleáris technikus

`19-4051.02` · **ISCO-08 3111** Kémia- és fizika tudományok technikusai · **FEOR-08:** 3139 Egyéb, máshova nem sorolható technikus · ESCO `3111.10` · EN: Nuclear Monitoring Technicians

*Piaci megnevezések (ESCO):* sugárvédelmi technikus, nukleáris laboratóriumi technikus, vegyésztechnikus, radiokémiai technikus, vegyészeti laboratóriumi technikus, fizikatudományi technikus

A nukleáris technikusok fizikusok és mérnökök munkáját segítik nukleáris laboratóriumokban és erőművekben. Nyomon követik a biztonságot és a minőség-ellenőrzést, valamint a berendezések karbantartását biztosító eljárásokat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 29.4%-a jelölte

**Holland-kód:** RCI — R 85 · I 57 · A 0 · S 15 · E 9 · C 75

**HEXACO differenciál cél-profil:** H cél 64±20 (w=0.28) · X cél 38±22 (w=0.23) · O cél 39±22 (w=0.22) · C cél 56±26 (w=0.11)

**HEXACO abszolút szint:** H 62 · E 45 · X 44 · A 56 · C 61 · O 44

### távérzékelési szaktechnikus

`19-2099.01` · **ISCO-08 3111** Kémia- és fizika tudományok technikusai · **FEOR-08:** 3139 Egyéb, máshova nem sorolható technikus · ESCO `3111.13` · EN: Remote Sensing Scientists and Technologists

*Piaci megnevezések (ESCO):* távérzékelési technikus

A távérzékelési szaktechnikusok légi felvételekből származó adatokat gyűjtenek.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 60.0%-a jelölte

**Holland-kód:** IRC — R 64 · I 85 · A 16 · S 4 · E 7 · C 64

**HEXACO differenciál cél-profil:** O cél 73±15 (w=0.53) · A cél 42±24 (w=0.20) · H cél 44±26 (w=0.15) · X cél 45±27 (w=0.11)

**HEXACO abszolút szint:** H 48 · E 49 · X 48 · A 46 · C 52 · O 68

### távérzékelési szaktechnikus

`19-4099.03` · **ISCO-08 3111** Kémia- és fizika tudományok technikusai · **FEOR-08:** 3139 Egyéb, máshova nem sorolható technikus · ESCO `3111.13` · EN: Remote Sensing Technicians

*Piaci megnevezések (ESCO):* távérzékelési technikus, geológiai technikus, geológus-geofizikus technikus, olajipari technikus, vízrajzi mérőtechnikus, hidrográfiai mérőtechnikus

A távérzékelési szaktechnikusok légi felvételekből származó adatokat gyűjtenek.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 62.0%-a jelölte

**Holland-kód:** CRI — R 68 · I 60 · A 19 · S 8 · E 12 · C 71

**HEXACO differenciál cél-profil:** O cél 66±19 (w=0.46) · X cél 43±26 (w=0.20) · A cél 45±27 (w=0.15)

**HEXACO abszolút szint:** H 45 · E 51 · X 43 · A 44 · C 48 · O 59

### Építésztechnikusok

`13-1041.04` · **ISCO-08 3112** Építésztechnikusok · **FEOR-08:** 3117 Építő- és építésztechnikus · ESCO `3112.1.1` · EN: Government Property Inspectors and Investigators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* építőtechnikus, mélyépítési technikus, építő- és építésztechnikus

Az építésztechnikusok segítenek az építési tervek megtervezésében és kivitelezésében, valamint a szervezési feladatok elvégzésében, például a tervezés és nyomon követés során, valamint az építési munkák megpályázásában és számlázásában.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 39.3%-a jelölte

**Holland-kód:** CEI — R 35 · I 39 · A 0 · S 24 · E 53 · C 88

**HEXACO differenciál cél-profil:** O cél 41±24 (w=0.24) · A cél 42±25 (w=0.22) · H cél 58±25 (w=0.21) · C cél 57±26 (w=0.18)

**HEXACO abszolút szint:** H 53 · E 53 · X 50 · A 43 · C 54 · O 43

### Építésztechnikusok

`47-4061.00` · **ISCO-08 3112** Építésztechnikusok · **FEOR-08:** 3117 Építő- és építésztechnikus · ESCO `3112.1.10` · EN: Rail-Track Laying and Maintenance Equipment Operators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* építőtechnikus, mélyépítési technikus, építő- és építésztechnikus, földmérő technikus, földmérő és térinformatikai technikus, földügyi térinformatikai szaktechnikus

Az építésztechnikusok segítenek az építési tervek megtervezésében és kivitelezésében, valamint a szervezési feladatok elvégzésében, például a tervezés és nyomon követés során, valamint az építési munkák megpályázásában és számlázásában.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 90.2%-a jelölte

**Holland-kód:** RCI — R 100 · I 12 · A 0 · S 0 · E 0 · C 52

**HEXACO differenciál cél-profil:** O cél 40±23 (w=0.36) · C cél 60±23 (w=0.34) · X cél 44±26 (w=0.22)

**HEXACO abszolút szint:** H 38 · E 57 · X 36 · A 40 · C 46 · O 35

### Építésztechnikusok

`53-6041.00` · **ISCO-08 3112** Építésztechnikusok · **FEOR-08:** 3117 Építő- és építésztechnikus · ESCO `3112.1` · EN: Traffic Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* építőtechnikus, mélyépítési technikus, építő- és építésztechnikus

Az építésztechnikusok segítenek az építési tervek megtervezésében és kivitelezésében, valamint a szervezési feladatok elvégzésében, például a tervezés és nyomon követés során, valamint az építési munkák megpályázásában és számlázásában.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 42.9%-a jelölte

**Holland-kód:** RCI — R 64 · I 56 · A 7 · S 16 · E 16 · C 58

**HEXACO differenciál cél-profil:** X cél 47±28 (w=0.34) · H cél 52±28 (w=0.33) · E cél 49±29 (w=0.15) · C cél 49±29 (w=0.14)

**HEXACO abszolút szint:** H 46 · E 54 · X 43 · A 44 · C 42 · O 46

### Gépésztechnikusok

`49-3043.00` · **ISCO-08 3115** Gépésztechnikusok · **FEOR-08:** 3116 Gépésztechnikus · ESCO `3115` · EN: Rail Car Repairers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Diagnose, adjust, repair, or overhaul railroad rolling stock, mine cars, or mass transit rail cars.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 61.4%-a jelölte

**Holland-kód:** RCI — R 100 · I 30 · A 4 · S 8 · E 3 · C 48

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.35) · X cél 42±25 (w=0.31) · A cél 44±26 (w=0.23)

**HEXACO abszolút szint:** H 42 · E 55 · X 38 · A 39 · C 49 · O 44

### gépésztechnikus

`17-3021.00` · **ISCO-08 3115** Gépésztechnikusok · **FEOR-08:** 3116 Gépésztechnikus · ESCO `3115.1.1` · EN: Aerospace Engineering and Operations Technologists and Technicians

A gépésztechnikusok műszaki támogatást nyújtanak a gépészmérnököknek a gépészeti berendezések előállítása és gyártása terén. Segítséget nyújtanak a tervek és a beállítások elkészítéséhez, valamint a vizsgálatok elvégzéséhez.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 39.2%-a jelölte

**Holland-kód:** RCI — R 91 · I 68 · A 0 · S 0 · E 7 · C 72

**HEXACO differenciál cél-profil:** X cél 42±24 (w=0.39) · O cél 58±25 (w=0.35) · E cél 47±28 (w=0.15)

**HEXACO abszolút szint:** H 49 · E 48 · X 44 · A 49 · C 53 · O 55

### Máshová nem sorolható természettudományi és műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok

`17-3026.01` · **ISCO-08 3119** Máshová nem sorolható természettudományi és műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok · **FEOR-08:** 3113 Élelmiszer-ipari technikus; 3114 Fa- és könnyűipari technikus; 3133 Földmérő és térinformatikai technikus; 3135 Minőségbiztosítási technikus; 3139 Egyéb, máshova nem sorolható technikus; 3162 Energetikus; 3163 Munkavédelmi és üzembiztonsági foglalkozású; 3190 Egyéb műszaki foglalkozású · ESCO `3119` · EN: Nanotechnology Engineering Technologists and Technicians · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Implement production processes and operate commercial-scale production equipment to produce, test, or modify materials, devices, or systems of unique molecular or macromolecular composition.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: doktori fokozat (PhD) · a válaszadók 40.0%-a jelölte

**Holland-kód:** RIC — R 86 · I 66 · A 9 · S 1 · E 17 · C 64

**HEXACO differenciál cél-profil:** X cél 36±20 (w=0.39) · O cél 64±21 (w=0.37) · C cél 56±26 (w=0.15)

**HEXACO abszolút szint:** H 51 · E 50 · X 42 · A 50 · C 59 · O 61

### csővezeték-megfelelőségi koordinátor

`17-3029.08` · **ISCO-08 3119** Máshová nem sorolható természettudományi és műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok · **FEOR-08:** 3113 Élelmiszer-ipari technikus; 3114 Fa- és könnyűipari technikus; 3133 Földmérő és térinformatikai technikus; 3135 Minőségbiztosítási technikus; 3139 Egyéb, máshova nem sorolható technikus; 3162 Energetikus; 3163 Munkavédelmi és üzembiztonsági foglalkozású; 3190 Egyéb műszaki foglalkozású · ESCO `3119.12` · EN: Photonics Technicians

A csővezeték-megfelelőségi koordinátorok nyomon követik, összeállítják és összegzik a csővezeték-infrastruktúrákkal és -mezőkkel kapcsolatos összes megfelelési és megfelelőségi tevékenységet.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 40.9%-a jelölte

**Holland-kód:** RCI — R 100 · I 53 · A 0 · S 0 · E 0 · C 74

**HEXACO differenciál cél-profil:** X cél 41±24 (w=0.30) · O cél 59±24 (w=0.28) · C cél 57±26 (w=0.21) · H cél 46±28 (w=0.11)

**HEXACO abszolút szint:** H 44 · E 54 · X 41 · A 45 · C 52 · O 54

### Erőműkezelők

`49-2095.00` · **ISCO-08 3131** Erőműkezelők · **FEOR-08:** 3151 Energetikai (erőművi) berendezés vezérlője · ESCO `3131.3.1` · EN: Electrical and Electronics Repairers, Powerhouse, Substation, and Relay · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Inspect, test, repair, or maintain electrical equipment in generating stations, substations, and in-service relays.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 50.3%-a jelölte

**Holland-kód:** RCI — R 100 · I 42 · A 0 · S 1 · E 5 · C 71

**HEXACO differenciál cél-profil:** X cél 41±24 (w=0.27) · A cél 42±25 (w=0.22) · C cél 57±25 (w=0.21) · O cél 55±27 (w=0.14)

**HEXACO abszolút szint:** H 45 · E 50 · X 42 · A 43 · C 55 · O 52

### Erőműkezelők

`51-8011.00` · **ISCO-08 3131** Erőműkezelők · **FEOR-08:** 3151 Energetikai (erőművi) berendezés vezérlője · ESCO `3131.3.6` · EN: Nuclear Power Reactor Operators · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Operate or control nuclear reactors. Move control rods, start and stop equipment, monitor and adjust controls, and record data in logs. Implement emergency procedures when needed. May respond to abnormalities, determine cause, and recommend corrective action.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 50.1%-a jelölte

**Holland-kód:** RCI — R 73 · I 35 · A 0 · S 18 · E 27 · C 69

**HEXACO differenciál cél-profil:** X cél 34±20 (w=0.27) · C cél 61±23 (w=0.19) · H cél 60±23 (w=0.17) · O cél 40±23 (w=0.17)

**HEXACO abszolút szint:** H 60 · E 42 · X 43 · A 55 · C 66 · O 46

### Erőműkezelők

`51-8012.00` · **ISCO-08 3131** Erőműkezelők · **FEOR-08:** 3151 Energetikai (erőművi) berendezés vezérlője · ESCO `3131.3.1` · EN: Power Distributors and Dispatchers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Coordinate, regulate, or distribute electricity or steam.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 40.3%-a jelölte

**Holland-kód:** RCE — R 70 · I 24 · A 0 · S 16 · E 35 · C 68

**HEXACO differenciál cél-profil:** E cél 36±21 (w=0.36) · H cél 43±25 (w=0.19) · A cél 57±25 (w=0.18) · O cél 43±26 (w=0.18)

**HEXACO abszolút szint:** H 48 · E 39 · X 53 · A 57 · C 58 · O 47

### vegyipari feldolgozó berendezés kezelője

`51-8092.00` · **ISCO-08 3133** Vegyipari feldolgozó berendezések kezelői · **FEOR-08:** 3153 Vegyipari alapanyag-feldolgozó berendezés vezérlője · ESCO `3133.1.5` · EN: Gas Plant Operators

*Piaci megnevezések (ESCO):* vegyipari folyamatoperátor

A vegyipari feldolgozó berendezések kezelője a vegyipari termelési folyamatot ellenőrzi. Gépeket és rendszereket üzemeltet, nyomon követi a berendezések és az ellenőrzése alatt álló műszerek működését, és karbantartja azokat.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 58.4%-a jelölte

**Holland-kód:** RCI — R 94 · I 26 · A 0 · S 8 · E 21 · C 70

**HEXACO differenciál cél-profil:** O cél 39±23 (w=0.26) · C cél 59±24 (w=0.23) · X cél 42±24 (w=0.21) · E cél 42±25 (w=0.19)

**HEXACO abszolút szint:** H 46 · E 48 · X 41 · A 49 · C 55 · O 40

### Kőolaj- és földgázfinomító berendezések kezelői

`53-7071.00` · **ISCO-08 3134** Kőolaj- és földgázfinomító berendezések kezelői · **FEOR-08:** 3154 Kőolaj- és földgázfinomító berendezés vezérlője · ESCO `3134.2` · EN: Gas Compressor and Gas Pumping Station Operators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gázfeldolgozó berendezés kezelője, gázelosztó berendezés kezelője, gázfeldolgozó-üzemi operátor, gázfeldolgozó-üzemi központi irányítótermi operátor, kőolajszivattyú-rendszer kezelője, szivattyúrendszer-kezelő

A gázfeldolgozó berendezés kezelője üzemelteti és karbantartja a gázfeldolgozó üzem elosztó berendezéseit. Biztosítja a gáz elosztását a közüzemi létesítményekhez, illetve fogyasztókhoz, valamint a gázvezetékek megfelelő nyomását.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 64.6%-a jelölte

**Holland-kód:** RCI — R 88 · I 22 · A 0 · S 8 · E 8 · C 64

**HEXACO differenciál cél-profil:** E cél 42±24 (w=0.28) · O cél 43±25 (w=0.24) · C cél 57±25 (w=0.24) · X cél 44±26 (w=0.21)

**HEXACO abszolút szint:** H 43 · E 49 · X 40 · A 44 · C 50 · O 40

### kőolajszivattyú-rendszer kezelője

`51-8093.00` · **ISCO-08 3134** Kőolaj- és földgázfinomító berendezések kezelői · **FEOR-08:** 3154 Kőolaj- és földgázfinomító berendezés vezérlője · ESCO `3134.4` · EN: Petroleum Pump System Operators, Refinery Operators, and Gaugers

*Piaci megnevezések (ESCO):* szivattyúrendszer-kezelő, kőolajipari táblakezelő, központi irányítótermi operátor kőolaj-finomítóban, kőolaj-finomítási folyamatkezelő, kőolaj-finomító berendezés kezelője, gázfeldolgozó berendezés kezelője

A kőolajszivattyú-rendszer kezelője olyan típusú szivattyúkat működtet, amelyek biztosítják az olaj és az olajszármazékok zökkenőmentes áramlását.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 97.0%-a jelölte

**Holland-kód:** RCI — R 86 · I 24 · A 0 · S 6 · E 21 · C 68

**HEXACO differenciál cél-profil:** O cél 39±23 (w=0.31) · C cél 59±24 (w=0.26) · E cél 42±25 (w=0.23) · X cél 44±26 (w=0.16)

**HEXACO abszolút szint:** H 44 · E 49 · X 41 · A 44 · C 53 · O 38

### kohókezelő

`51-4051.00` · **ISCO-08 3135** Fémfeldolgozási folyamatirányító rendszerek kezelői · **FEOR-08:** 3155 Fémgyártási berendezés vezérlője · ESCO `3135.1` · EN: Metal-Refining Furnace Operators and Tenders

*Piaci megnevezések (ESCO):* kohászati technikus, kohász

A kohókezelő figyelemmel kíséri a fémgyártás formákba öntés előtti folyamatát.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 64.1%-a jelölte

**Holland-kód:** RCI — R 98 · I 29 · A 1 · S 0 · E 0 · C 50

**HEXACO differenciál cél-profil:** C cél 60±23 (w=0.27) · O cél 42±24 (w=0.21) · X cél 43±25 (w=0.19) · E cél 44±26 (w=0.15)

**HEXACO abszolút szint:** H 37 · E 54 · X 36 · A 37 · C 47 · O 36

### Élettani tudományok technikusai (kivéve az orvostudományt)

`15-2099.01` · **ISCO-08 3141** Élettani tudományok technikusai (kivéve az orvostudományt) · **FEOR-08:** — · ESCO `3141.2` · EN: Bioinformatics Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* laboratóriumi technikus, kutatólaboratóriumi technikus, laboratóriumi szakasszisztens

A laboratóriumi technikus laboratóriumi kutatásokat, elemzéseket és vizsgálatokat végez, továbbá támogatja az élettudományokkal foglalkozó szakemberek munkáját.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 50.9%-a jelölte

**Holland-kód:** ICR — R 47 · I 90 · A 10 · S 12 · E 0 · C 84

**HEXACO differenciál cél-profil:** O cél 71±16 (w=0.46) · X cél 37±22 (w=0.28) · H cél 44±26 (w=0.13)

**HEXACO abszolút szint:** H 47 · E 50 · X 42 · A 48 · C 54 · O 66

### Erdésztechnikusok Erdésztechnikusok

`19-1032.00` · **ISCO-08 3143** Erdésztechnikusok Erdésztechnikusok · **FEOR-08:** 3132 Erdő- és természetvédelmi technikus · ESCO `3143.1` · EN: Foresters · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* erdésztechnikus, erdészetvezető, erdőfelügyelő

Az erdésztechnikus segíti és támogatja az erdőgazdálkodót, és végrehajtja annak döntéseit.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 84.0%-a jelölte

**Holland-kód:** RIC — R 72 · I 58 · A 4 · S 22 · E 46 · C 56

**HEXACO differenciál cél-profil:** O cél 56±26 (w=0.31) · X cél 56±26 (w=0.31) · H cél 48±28 (w=0.12) · A cél 48±28 (w=0.12)

**HEXACO abszolút szint:** H 53 · E 48 · X 57 · A 52 · C 52 · O 57

### Erdésztechnikusok Erdésztechnikusok

`19-4071.00` · **ISCO-08 3143** Erdésztechnikusok Erdésztechnikusok · **FEOR-08:** 3132 Erdő- és természetvédelmi technikus · ESCO `3143.1` · EN: Forest and Conservation Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* erdésztechnikus, erdészetvezető, erdőfelügyelő

Az erdésztechnikus segíti és támogatja az erdőgazdálkodót, és végrehajtja annak döntéseit.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 35.3%-a jelölte

**Holland-kód:** RCI — R 92 · I 56 · A 0 · S 30 · E 24 · C 62

**HEXACO differenciál cél-profil:** A cél 53±28 (w=0.31) · X cél 53±28 (w=0.30) · C cél 48±29 (w=0.17) · H cél 49±29 (w=0.12)

**HEXACO abszolút szint:** H 50 · E 49 · X 53 · A 52 · C 48 · O 50

### Hajógépészek

`53-5031.00` · **ISCO-08 3151** Hajógépészek · **FEOR-08:** 3171 Tengeri és belvízi hajóparancsnok, fedélzeti tiszt · ESCO `3151` · EN: Ship Engineers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* hajózási géptiszt, hajógépész, első géptiszt

_(HU leírás nincs; EN:)_ Supervise and coordinate activities of crew engaged in operating and maintaining engines, boilers, deck machinery, and electrical, sanitary, and refrigeration equipment aboard ship.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 48.0%-a jelölte

**Holland-kód:** RCE — R 91 · I 42 · A 0 · S 13 · E 46 · C 65

**HEXACO differenciál cél-profil:** E cél 42±25 (w=0.31) · H cél 43±25 (w=0.29) · C cél 55±26 (w=0.22)

**HEXACO abszolút szint:** H 51 · E 41 · X 55 · A 54 · C 63 · O 52

### Hajós fedélzeti tisztek és hajóvezetők

`53-5021.00` · **ISCO-08 3152** Hajós fedélzeti tisztek és hajóvezetők · **FEOR-08:** 3171 Tengeri és belvízi hajóparancsnok, fedélzeti tiszt · ESCO `3152.3` · EN: Captains, Mates, and Pilots of Water Vessels · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* révkalauz, hajókormányos, kormányos, hajóparancsnok, hajóskapitány, hajóparancsnok tengerjárón

A révkalauz olyan tengerész, aki veszélyes vagy forgalmas vizeken – például kikötőkben vagy folyótorkolatokban – irányítja a hajók mozgását. Nagy szakértelemmel rendelkezik a hajók kezelése terén, és jól ismeri a helyi vízi utakat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 42.0%-a jelölte

**Holland-kód:** RCE — R 77 · I 27 · A 0 · S 15 · E 54 · C 59

**HEXACO differenciál cél-profil:** E cél 40±23 (w=0.26) · H cél 40±23 (w=0.25) · X cél 60±23 (w=0.24) · O cél 44±26 (w=0.15)

**HEXACO abszolút szint:** H 52 · E 36 · X 64 · A 59 · C 64 · O 52

### légijármű-vezető

`53-2012.00` · **ISCO-08 3153** Légijármű-vezetők és hasonló foglalkozásúak · **FEOR-08:** 3172 Légijármű-vezető, hajózómérnök · ESCO `3153.2.2` · EN: Commercial Pilots

*Piaci megnevezések (ESCO):* repülőgép-vezető, pilóta

A légijármű-vezető légi járműveket irányít és navigál. Üzemelteti a légi járművek mechanikai és elektromos rendszereit, valamint utasokat, postai küldeményeket és árut szállít.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 36.4%-a jelölte

**Holland-kód:** CRE — R 63 · I 26 · A 2 · S 26 · E 49 · C 64

**HEXACO differenciál cél-profil:** E cél 36±20 (w=0.41) · H cél 42±25 (w=0.23) · X cél 55±27 (w=0.14) · O cél 45±27 (w=0.13)

**HEXACO abszolút szint:** H 53 · E 35 · X 59 · A 58 · C 63 · O 52

### Légiirányítók

`53-2022.00` · **ISCO-08 3154** Légiirányítók · **FEOR-08:** 3173 Légiforgalmi irányító · ESCO `3154.3` · EN: Airfield Operations Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* navigációs tiszt, repülésüzemi tiszt, repülőtéri járatindító, légiforgalmi irányító, légiforgalmi diszpécser, légiirányító

A navigációs tiszt összeállítja a járatinformációkat, hogy felgyorsítsa a légi járművek mozgását a repülőterek között és azokon keresztül.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 50.9%-a jelölte

**Holland-kód:** CRE — R 60 · I 42 · A 0 · S 25 · E 58 · C 66

**HEXACO differenciál cél-profil:** O cél 40±24 (w=0.26) · E cél 41±24 (w=0.24) · A cél 57±25 (w=0.20) · H cél 46±27 (w=0.12)

**HEXACO abszolút szint:** H 56 · E 38 · X 59 · A 62 · C 64 · O 48

### légiforgalmi irányító

`53-2021.00` · **ISCO-08 3154** Légiirányítók · **FEOR-08:** 3173 Légiforgalmi irányító · ESCO `3154.1` · EN: Air Traffic Controllers

*Piaci megnevezések (ESCO):* légiforgalmi diszpécser, légiirányító, navigációs tiszt, repülésüzemi tiszt, repülőtéri járatindító

A légiforgalmi irányító a pilóták munkáját segíti azáltal, hogy tájékoztatást nyújt a légi jármű magasságáról, sebességéről és útvonaláról. Segítenek a pilótáknak a repülőgépek biztonságos fel- és leszállása érdekében.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 36.1%-a jelölte

**Holland-kód:** CRE — R 59 · I 24 · A 0 · S 28 · E 55 · C 66

**HEXACO differenciál cél-profil:** O cél 30±17 (w=0.29) · E cél 33±19 (w=0.24) · A cél 64±21 (w=0.20) · C cél 59±24 (w=0.14)

**HEXACO abszolút szint:** H 49 · E 36 · X 52 · A 62 · C 66 · O 39

### repülésbiztonsági ellenőr

`53-6051.01` · **ISCO-08 3154** Légiirányítók · **FEOR-08:** 3173 Légiforgalmi irányító · ESCO `3154.2` · EN: Aviation Inspectors

A repülésbiztonsági ellenőr ellenőrzi a karbantartás, a légi navigációs segédeszközök, a légiforgalmi irányítás és a kommunikációs berendezések területén alkalmazott eljárásokat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 33.6%-a jelölte

**Holland-kód:** CRI — R 76 · I 52 · A 0 · S 7 · E 26 · C 79

**HEXACO differenciál cél-profil:** H cél 60±23 (w=0.24) · C cél 59±24 (w=0.21) · O cél 41±24 (w=0.21) · A cél 45±26 (w=0.12)

**HEXACO abszolút szint:** H 59 · E 44 · X 49 · A 50 · C 64 · O 46

### Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője

`29-1124.00` · **ISCO-08 3211** Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője · **FEOR-08:** 3323 Orvosi képalkotó diagnosztikai és terápiás · ESCO `3211.2` · EN: Radiation Therapists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* klinikai perfúziós asszisztens, műtéti szakasszisztens, műtő asszisztens

_(HU leírás nincs; EN:)_ Provide radiation therapy to patients as prescribed by a radiation oncologist according to established practices and standards.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 50.1%-a jelölte

**Holland-kód:** RSI — R 66 · I 61 · A 4 · S 63 · E 12 · C 58

**HEXACO differenciál cél-profil:** O cél 31±17 (w=0.30) · A cél 66±20 (w=0.24) · H cél 61±23 (w=0.17) · C cél 42±25 (w=0.13)

**HEXACO abszolút szint:** H 66 · E 48 · X 55 · A 68 · C 57 · O 43

### Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője

`29-2036.00` · **ISCO-08 3211** Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője · **FEOR-08:** 3323 Orvosi képalkotó diagnosztikai és terápiás · ESCO `3211` · EN: Medical Dosimetrists · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Generate radiation treatment plans, develop radiation dose calculations, communicate and supervise the treatment plan implementation, and consult with members of radiation oncology team.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 40.0%-a jelölte

**Holland-kód:** ICR — R 60 · I 72 · A 5 · S 43 · E 20 · C 67

**HEXACO differenciál cél-profil:** X cél 43±25 (w=0.41) · O cél 55±27 (w=0.27) · E cél 52±29 (w=0.11)

**HEXACO abszolút szint:** H 60 · E 45 · X 52 · A 59 · C 63 · O 60

### Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője

`29-2099.01` · **ISCO-08 3211** Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője · **FEOR-08:** 3323 Orvosi képalkotó diagnosztikai és terápiás · ESCO `3211` · EN: Neurodiagnostic Technologists · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Conduct electroneurodiagnostic (END) tests such as electroencephalograms, evoked potentials, polysomnograms, or electronystagmograms. May perform nerve conduction studies.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 48.4%-a jelölte

**Holland-kód:** IRC — R 72 · I 80 · A 7 · S 45 · E 7 · C 58

**HEXACO differenciál cél-profil:** X cél 41±24 (w=0.38) · H cél 57±25 (w=0.28) · E cél 54±27 (w=0.17) · A cél 53±28 (w=0.12)

**HEXACO abszolút szint:** H 58 · E 50 · X 48 · A 56 · C 55 · O 52

### Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője

`31-9099.02` · **ISCO-08 3211** Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője · **FEOR-08:** 3323 Orvosi képalkotó diagnosztikai és terápiás · ESCO `3211` · EN: Endoscopy Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* klinikai perfúziós asszisztens, műtéti szakasszisztens, műtő asszisztens

_(HU leírás nincs; EN:)_ Maintain a sterile field to provide support for physicians and nurses during endoscopy procedures. Prepare and maintain instruments and equipment. May obtain specimens.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 53.9%-a jelölte

**Holland-kód:** RCI — R 91 · I 52 · A 0 · S 33 · E 1 · C 69

**HEXACO differenciál cél-profil:** O cél 37±21 (w=0.33) · A cél 62±22 (w=0.30) · H cél 58±25 (w=0.19) · X cél 44±26 (w=0.16)

**HEXACO abszolút szint:** H 55 · E 50 · X 46 · A 58 · C 52 · O 41

### Orvosi és patológiai labortechnikusok

`29-2011.01` · **ISCO-08 3212** Orvosi és patológiai labortechnikusok · **FEOR-08:** 3324 Orvosi laboratóriumi asszisztens · ESCO `3212.1.2` · EN: Cytogenetic Technologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* orvosbiológus, orvosbiológiai kutató, biomedikai mérnök

Az orvosbiológus végzi el az összes, az orvosi vizsgálatokhoz, kezelésekhez és kutatásokhoz szükséges laboratóriumi vizsgálatot, különösen a klinikai kémiai, hematológiai, immunhematológiai, szövettani, citológiai, mikrobiológiai, parazitológiai, mikológiai, szerológiai és radiológiai vizsgálatokat.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 76.2%-a jelölte

**Holland-kód:** IRC — R 72 · I 82 · A 8 · S 16 · E 9 · C 67

**HEXACO differenciál cél-profil:** X cél 40±23 (w=0.35) · C cél 58±25 (w=0.26) · A cél 44±26 (w=0.19) · O cél 54±28 (w=0.12)

**HEXACO abszolút szint:** H 51 · E 49 · X 43 · A 46 · C 58 · O 53

### Orvosi és patológiai labortechnikusok

`29-2011.02` · **ISCO-08 3212** Orvosi és patológiai labortechnikusok · **FEOR-08:** 3324 Orvosi laboratóriumi asszisztens · ESCO `3212.1` · EN: Cytotechnologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* orvosbiológus, orvosbiológiai kutató, biomedikai mérnök

Az orvosbiológus végzi el az összes, az orvosi vizsgálatokhoz, kezelésekhez és kutatásokhoz szükséges laboratóriumi vizsgálatot, különösen a klinikai kémiai, hematológiai, immunhematológiai, szövettani, citológiai, mikrobiológiai, parazitológiai, mikológiai, szerológiai és radiológiai vizsgálatokat.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: alapszak (BA/BSc) · a válaszadók 50.0%-a jelölte

**Holland-kód:** IRC — R 82 · I 84 · A 2 · S 24 · E 14 · C 65

**HEXACO differenciál cél-profil:** X cél 38±22 (w=0.36) · C cél 60±24 (w=0.30) · H cél 55±27 (w=0.16) · A cél 47±28 (w=0.11)

**HEXACO abszolút szint:** H 52 · E 51 · X 41 · A 46 · C 58 · O 47

### Orvosi és patológiai labortechnikusok

`29-2011.04` · **ISCO-08 3212** Orvosi és patológiai labortechnikusok · **FEOR-08:** 3324 Orvosi laboratóriumi asszisztens · ESCO `3212.1` · EN: Histotechnologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* orvosbiológus, orvosbiológiai kutató, biomedikai mérnök

Az orvosbiológus végzi el az összes, az orvosi vizsgálatokhoz, kezelésekhez és kutatásokhoz szükséges laboratóriumi vizsgálatot, különösen a klinikai kémiai, hematológiai, immunhematológiai, szövettani, citológiai, mikrobiológiai, parazitológiai, mikológiai, szerológiai és radiológiai vizsgálatokat.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 42.9%-a jelölte

**Holland-kód:** IRC — R 79 · I 93 · A 5 · S 32 · E 1 · C 69

**HEXACO differenciál cél-profil:** X cél 41±24 (w=0.40) · C cél 57±26 (w=0.30) · E cél 52±28 (w=0.12)

**HEXACO abszolút szint:** H 51 · E 52 · X 44 · A 48 · C 57 · O 51

### Orvosi és patológiai labortechnikusok

`29-2012.01` · **ISCO-08 3212** Orvosi és patológiai labortechnikusok · **FEOR-08:** 3324 Orvosi laboratóriumi asszisztens · ESCO `3212` · EN: Histology Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* orvosi laboratóriumi asszisztens, orvosi laborasszisztens, klinikai laboratóriumi asszisztens, orvosbiológus, orvosbiológiai kutató, biomedikai mérnök

_(HU leírás nincs; EN:)_ Prepare histological slides from tissue sections for microscopic examination and diagnosis by pathologists. May assist with research studies.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 48.0%-a jelölte

**Holland-kód:** RIC — R 88 · I 73 · A 4 · S 19 · E 0 · C 67

**HEXACO differenciál cél-profil:** C cél 60±23 (w=0.27) · X cél 40±24 (w=0.27) · O cél 44±26 (w=0.15) · H cél 54±27 (w=0.12)

**HEXACO abszolút szint:** H 44 · E 58 · X 36 · A 39 · C 51 · O 40

### gyógyszertári asszisztens

`31-9095.00` · **ISCO-08 3213** Gyógyszerésztechnikusok és -asszisztensek · **FEOR-08:** 3326 Gyógyszertári és gyógyszerellátási asszisztens · ESCO `3213.1` · EN: Pharmacy Aides

*Piaci megnevezések (ESCO):* gyógyszertári szakasszisztens, gyógyszerkiadó szakasszisztens, gyógyszerellátási szakasszisztens, gyógyszergazdálkodó szakasszisztens

A gyógyszertári asszisztensek általános feladatokat, például készletkezelési, pénztárosi vagy adminisztratív feladatokat látnak el. A gyógyszertári leltárral gyógyszerész felügyelete alatt foglalkoznak.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 61.2%-a jelölte

**Holland-kód:** CER — R 46 · I 10 · A 0 · S 35 · E 47 · C 96

**HEXACO differenciál cél-profil:** H cél 69±17 (w=0.32) · O cél 35±20 (w=0.26) · A cél 58±25 (w=0.13) · E cél 57±25 (w=0.12)

**HEXACO abszolút szint:** H 59 · E 57 · X 44 · A 51 · C 43 · O 36

### Gyógyászatisegédeszköz- és fogtechnikusok

`29-1024.00` · **ISCO-08 3214** Gyógyászatisegédeszköz- és fogtechnikusok · **FEOR-08:** 3333 Fogtechnikus; 3334 Ortopédiai eszközkészítő · ESCO `3214.2` · EN: Prosthodontists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* fogtechnikus, kórházi fogtechnikus, fogműves, ortopédiai eszközkészítő, protéziskészítő, ortopédiai eszközkészítő asszisztens

A fogorvos előírásait és utasításait követve rendelésre készült eszközöket (hidak, koronák, műfogsorok és fogszabályzók) készít.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: posztdoktori képzés · a válaszadók 61.0%-a jelölte

**Holland-kód:** RIS — R 86 · I 76 · A 13 · S 60 · E 7 · C 37

**HEXACO differenciál cél-profil:** E cél 58±25 (w=0.38) · O cél 55±26 (w=0.24) · X cél 46±27 (w=0.19) · C cél 47±28 (w=0.13)

**HEXACO abszolút szint:** H 60 · E 48 · X 56 · A 59 · C 60 · O 61

### Gyógyászatisegédeszköz- és fogtechnikusok

`29-2092.00` · **ISCO-08 3214** Gyógyászatisegédeszköz- és fogtechnikusok · **FEOR-08:** 3333 Fogtechnikus; 3334 Ortopédiai eszközkészítő · ESCO `3214.1` · EN: Hearing Aid Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* hallásakusztikus, hallókészülék-technikus

A hallásakusztikusok hallást segítő készülékeket és hallásvédelmi termékeket készítenek és szervizelnek. Hallást segítő készülékeket készítenek, illesztenek és szolgáltatnak azok számára, akiknek szükségük van rájuk.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: doktori fokozat (PhD) · a válaszadók 44.0%-a jelölte

**Holland-kód:** SCI — R 48 · I 56 · A 12 · S 59 · E 12 · C 57

**HEXACO differenciál cél-profil:** E cél 60±23 (w=0.31) · C cél 42±24 (w=0.26) · H cél 57±25 (w=0.23) · A cél 54±27 (w=0.14)

**HEXACO abszolút szint:** H 64 · E 50 · X 58 · A 61 · C 54 · O 56

### Gyógyászatisegédeszköz- és fogtechnikusok

`51-9082.00` · **ISCO-08 3214** Gyógyászatisegédeszköz- és fogtechnikusok · **FEOR-08:** 3333 Fogtechnikus; 3334 Ortopédiai eszközkészítő · ESCO `3214` · EN: Medical Appliance Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* hallásakusztikus, hallókészülék-technikus, fogtechnikus, kórházi fogtechnikus, fogműves, ortopédiai eszközkészítő

_(HU leírás nincs; EN:)_ Construct, maintain, or repair medical supportive devices such as braces, orthotics and prosthetic devices, joints, arch supports, and other surgical and medical appliances.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 26.3%-a jelölte

**Holland-kód:** RIC — R 100 · I 49 · A 10 · S 37 · E 0 · C 44

**HEXACO differenciál cél-profil:** E cél 59±24 (w=0.32) · X cél 44±26 (w=0.23) · H cél 56±26 (w=0.22) · A cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 54 · E 56 · X 46 · A 48 · C 53 · O 50

### ortopédiai eszközkészítő

`29-2091.00` · **ISCO-08 3214** Gyógyászatisegédeszköz- és fogtechnikusok · **FEOR-08:** 3333 Fogtechnikus; 3334 Ortopédiai eszközkészítő · ESCO `3214.3` · EN: Orthotists and Prosthetists

*Piaci megnevezések (ESCO):* protéziskészítő, ortopédiai eszközkészítő asszisztens

Az ortopédiai eszközkészítő olyan személyek számára tervez és szab testre ortopéd és protetikus eszközöket, akik baleset, betegség, veleszületett rendellenesség miatt végtaghiányosak, vagy baleset, patológia vagy veleszületett rendellenesség miatt sérültek, károsodással vagy gyengeséggel rendelkeznek.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 90.0%-a jelölte

**Holland-kód:** RIS — R 83 · I 68 · A 16 · S 55 · E 9 · C 43

**HEXACO differenciál cél-profil:** E cél 57±25 (w=0.27) · C cél 43±25 (w=0.27) · O cél 55±26 (w=0.20) · H cél 53±28 (w=0.11)

**HEXACO abszolút szint:** H 64 · E 46 · X 58 · A 61 · C 58 · O 62

### Állatorvosi technikusok és asszisztensek

`31-9096.00` · **ISCO-08 3240** Állatorvosi technikusok és asszisztensek · **FEOR-08:** 3341 Állatorvosi asszisztens · ESCO `3240` · EN: Veterinary Assistants and Laboratory Animal Caretakers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* állatorvosi szaksegéd, állatorvosi szaksegédek, állatorvosi asszisztens

_(HU leírás nincs; EN:)_ Feed, water, and examine pets and other nonfarm animals for signs of illness, disease, or injury in laboratories and animal hospitals and clinics. Clean and disinfect cages and work areas, and sterilize laboratory and surgical equipment.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 78.2%-a jelölte

**Holland-kód:** RIC — R 89 · I 54 · A 0 · S 42 · E 0 · C 49

**HEXACO differenciál cél-profil:** A cél 60±23 (w=0.27) · O cél 41±24 (w=0.25) · H cél 59±24 (w=0.25) · X cél 46±27 (w=0.11)

**HEXACO abszolút szint:** H 60 · E 47 · X 51 · A 60 · C 51 · O 45

### Egészségügyi nyilvántartások és dokumentációk technikusai

`15-2051.02` · **ISCO-08 3252** Egészségügyi nyilvántartások és dokumentációk technikusai · **FEOR-08:** 3322 Egészségügyi dokumentátor · ESCO `3252.2` · EN: Clinical Data Managers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* egészségügyi dokumentációs vezető, betegnyilvántartási vezető, egészségügyi dokumentációs részleg vezetője

Az egészségügyi dokumentációs vezető felelős a betegadatokat fenntartó és biztosító orvosi nyilvántartásokkal kapcsolatos tevékenységekért. Felügyeli és képzi a munkavállalókat, és végrehajtja az adott kórházi osztályra vonatkozó előírásokat.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 85.0%-a jelölte

**Holland-kód:** CIE — R 4 · I 78 · A 4 · S 30 · E 38 · C 93

**HEXACO differenciál cél-profil:** O cél 58±24 (w=0.32) · A cél 44±26 (w=0.24) · X cél 46±27 (w=0.16) · E cél 53±28 (w=0.12)

**HEXACO abszolút szint:** H 55 · E 50 · X 50 · A 49 · C 58 · O 58

### Látszerészek

`29-2099.05` · **ISCO-08 3254** Látszerészek · **FEOR-08:** 3335 Látszerész · ESCO `3254` · EN: Ophthalmic Medical Technologists · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Assist ophthalmologists by performing ophthalmic clinical functions and ophthalmic photography. Provide instruction and supervision to other ophthalmic personnel. Assist with minor surgical procedures, applying aseptic techniques and preparing instruments.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 30.0%-a jelölte

**Holland-kód:** RCI — R 74 · I 62 · A 2 · S 55 · E 17 · C 62

**HEXACO differenciál cél-profil:** C cél 44±26 (w=0.30) · E cél 55±27 (w=0.25) · O cél 46±28 (w=0.19)

**HEXACO abszolút szint:** H 56 · E 49 · X 56 · A 56 · C 53 · O 51

### Látszerészek

`51-9083.00` · **ISCO-08 3254** Látszerészek · **FEOR-08:** 3335 Látszerész · ESCO `3254.1.1` · EN: Ophthalmic Laboratory Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* látszerész, látszerészasszisztens, optikus

A látszerész feladata, hogy a szakorvos és az optometrista előírásai alapján javítsák és korrigálják a hozzájuk irányított páciens látását.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 56.4%-a jelölte

**Holland-kód:** RCI — R 90 · I 31 · A 12 · S 15 · E 6 · C 52

**HEXACO differenciál cél-profil:** C cél 60±23 (w=0.32) · O cél 44±26 (w=0.19) · X cél 44±26 (w=0.18) · E cél 54±27 (w=0.13)

**HEXACO abszolút szint:** H 34 · E 63 · X 35 · A 36 · C 45 · O 36

### Fizioterápiás technikusok és asszisztensek

`31-2021.00` · **ISCO-08 3255** Fizioterápiás technikusok és asszisztensek · **FEOR-08:** 3332 Fizioterápiás asszisztens, masszőr · ESCO `3255.1` · EN: Physical Therapist Assistants · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* állatgyógyász, állatrehabilitációs terapeuta, állatorvos, aromaterapeuta, aromaterápiás szakember

Az állatgyógyász az állatorvosi diagnózist vagy beutalást követően terápiás kezelést nyújt.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 84.2%-a jelölte

**Holland-kód:** SRC — R 58 · I 44 · A 9 · S 90 · E 5 · C 46

**HEXACO differenciál cél-profil:** A cél 61±23 (w=0.24) · E cél 59±24 (w=0.20) · H cél 58±24 (w=0.19) · C cél 42±24 (w=0.19)

**HEXACO abszolút szint:** H 64 · E 50 · X 57 · A 64 · C 53 · O 51

### mentőautó-vezető

`53-3011.00` · **ISCO-08 3258** Mentőápolók · **FEOR-08:** 2226 Mentőtiszt · ESCO `3258.1` · EN: Ambulance Drivers and Attendants, Except Emergency Medical Technicians

*Piaci megnevezések (ESCO):* mentőgépkocsi-vezető, mentőautó-sofőr

A mentőautó-vezető orvosi vészhelyzetben vezeti a sürgősségi betegszállító járművet, orvosi felügyelet mellett támogatja a mentőápolók munkáját, gondoskodik a beteg biztonságos mozgatásáról, figyeli a beteg alapvető életfunkcióira utaló jelek változásait, jelentést tesz a mentőautó ügyeletes személyzetének és gondoskodik az orvosi eszközök tárolásáról, szállításáról és üzemképességéről.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 56.3%-a jelölte

**Holland-kód:** RSC — R 91 · I 24 · A 0 · S 62 · E 9 · C 43

**HEXACO differenciál cél-profil:** A cél 69±18 (w=0.29) · O cél 36±21 (w=0.22) · H cél 60±24 (w=0.15) · E cél 42±24 (w=0.13)

**HEXACO abszolút szint:** H 61 · E 41 · X 50 · A 65 · C 50 · O 42

### Máshová nem sorolható egészségügyi foglalkozásúak

`29-1122.01` · **ISCO-08 3259** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 3339 Egyéb, humánegészségügyhöz kapcsolódó foglalkozású · ESCO `3259` · EN: Low Vision Therapists, Orientation and Mobility Specialists, and Vision Rehabilitation Therapists · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Provide therapy to patients with visual impairments to improve their functioning in daily life activities. May train patients in activities such as computer use, communication skills, or home management skills.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: mesterszak (MA/MSc) · a válaszadók 56.5%-a jelölte

**Holland-kód:** SRI — R 49 · I 48 · A 37 · S 92 · E 19 · C 30

**HEXACO differenciál cél-profil:** C cél 40±23 (w=0.30) · A cél 59±24 (w=0.27) · E cél 56±26 (w=0.19) · H cél 56±26 (w=0.17)

**HEXACO abszolút szint:** H 65 · E 46 · X 59 · A 66 · C 54 · O 57

### Máshová nem sorolható egészségügyi foglalkozásúak

`29-1151.00` · **ISCO-08 3259** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 3339 Egyéb, humánegészségügyhöz kapcsolódó foglalkozású · ESCO `3259.1` · EN: Nurse Anesthetists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* aneszteziológiai szakasszisztens, aneszteziológiai technikus

Az aneszteziológiai szakasszisztens feladata az aneszteziológus szakorvosok munkájának támogatása.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 55.6%-a jelölte

**Holland-kód:** SIR — R 63 · I 68 · A 0 · S 72 · E 16 · C 52

**HEXACO differenciál cél-profil:** A cél 58±25 (w=0.30) · X cél 44±26 (w=0.22) · E cél 45±27 (w=0.19) · O cél 47±28 (w=0.10)

**HEXACO abszolút szint:** H 66 · E 36 · X 58 · A 68 · C 67 · O 58

### Máshová nem sorolható egészségügyi foglalkozásúak

`29-2057.00` · **ISCO-08 3259** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 3339 Egyéb, humánegészségügyhöz kapcsolódó foglalkozású · ESCO `3259` · EN: Ophthalmic Medical Technicians · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Assist ophthalmologists by performing ophthalmic clinical functions. May administer eye exams, administer eye medications, and instruct the patient in care and use of corrective lenses.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 59.1%-a jelölte

**Holland-kód:** RIS — R 72 · I 64 · A 0 · S 61 · E 12 · C 57

**HEXACO differenciál cél-profil:** O cél 38±22 (w=0.44) · A cél 56±26 (w=0.23) · C cél 45±27 (w=0.16) · H cél 54±27 (w=0.15)

**HEXACO abszolút szint:** H 53 · E 49 · X 50 · A 54 · C 49 · O 41

### Máshová nem sorolható egészségügyi foglalkozásúak

`31-9099.01` · **ISCO-08 3259** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 3339 Egyéb, humánegészségügyhöz kapcsolódó foglalkozású · ESCO `3259` · EN: Speech-Language Pathology Assistants · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Assist speech-language pathologists in the assessment and treatment of speech, language, voice, and fluency disorders. Implement speech and language programs or activities as planned and directed by speech-language pathologists.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 57.7%-a jelölte

**Holland-kód:** SCI — R 24 · I 56 · A 28 · S 75 · E 9 · C 67

**HEXACO differenciál cél-profil:** H cél 60±23 (w=0.23) · E cél 59±24 (w=0.20) · C cél 42±25 (w=0.18) · A cél 57±25 (w=0.17)

**HEXACO abszolút szint:** H 63 · E 51 · X 52 · A 61 · C 52 · O 52

### légzésfunkciós asszisztens

`29-2051.00` · **ISCO-08 3259** Máshová nem sorolható egészségügyi foglalkozásúak · **FEOR-08:** 3339 Egyéb, humánegészségügyhöz kapcsolódó foglalkozású · ESCO `3259.5` · EN: Dietetic Technicians

*Piaci megnevezések (ESCO):* légzőszervi szakápoló, respirációs terápiás asszisztens

A légzésfunkciós asszisztens légzési problémák kezelésében támogatja az orvosok és sebészek munkáját.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 34.6%-a jelölte

**Holland-kód:** SCR — R 47 · I 41 · A 26 · S 68 · E 26 · C 47

**HEXACO differenciál cél-profil:** E cél 59±24 (w=0.27) · C cél 42±25 (w=0.23) · H cél 56±26 (w=0.18) · A cél 56±26 (w=0.18)

**HEXACO abszolút szint:** H 58 · E 53 · X 54 · A 58 · C 48 · O 50

### Hitel- és kölcsönügyintézők

`43-4141.00` · **ISCO-08 3312** Hitel- és kölcsönügyintézők · **FEOR-08:** 3612 Pénzintézeti ügyintéző · ESCO `3312.1` · EN: New Accounts Clerks · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* bankszámla-ügyintéző, pénzintézeti ügyfélkapcsolati előadó, pénzintézeti ügyfélkapcsolati munkatárs, hitelügyintéző, hitelezési tanácsadó, banki hitelügyintéző

A bankszámla-ügyintézők tanácsot adnak a leendő ügyfeleknek azzal kapcsolatban, hogy milyen típusú bankszámlák felelnek meg a leginkább az igényeiknek.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 45.6%-a jelölte

**Holland-kód:** CES — R 6 · I 15 · A 0 · S 44 · E 61 · C 98

**HEXACO differenciál cél-profil:** O cél 35±20 (w=0.28) · H cél 63±22 (w=0.23) · A cél 59±24 (w=0.17) · E cél 57±26 (w=0.12)

**HEXACO abszolút szint:** H 59 · E 54 · X 54 · A 57 · C 48 · O 40

### statisztikai asszisztens

`43-9111.00` · **ISCO-08 3314** Statisztikusokat, matematikusokat és aktuáriusokat segítő foglalkozások · **FEOR-08:** 3615 Statisztikai ügyintéző · ESCO `3314.2` · EN: Statistical Assistants

*Piaci megnevezések (ESCO):* aktuárius asszisztens

A statisztikai asszisztensek összegyűjtik az adatokat, és statisztikai képletek segítségével statisztikai elemzéseket és jelentéseket készítenek. Diagramokat, grafikonokat és felméréseket készítenek.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 59.2%-a jelölte

**Holland-kód:** CIR — R 23 · I 58 · A 0 · S 7 · E 12 · C 100

**HEXACO differenciál cél-profil:** A cél 39±23 (w=0.31) · C cél 60±24 (w=0.27) · X cél 43±25 (w=0.21) · E cél 54±27 (w=0.11)

**HEXACO abszolút szint:** H 42 · E 60 · X 36 · A 34 · C 48 · O 43

### Becsüsök és kárfelmérők

`13-1032.00` · **ISCO-08 3315** Becsüsök és kárfelmérők · **FEOR-08:** 3616 Értékbecslő, kárbecslő, kárszakértő · ESCO `3315.7` · EN: Insurance Appraisers, Auto Damage · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* ingatlan-értékbecslő, lakóingatlan-értékbecslő, ingatlanszakértő, biztosítási kárügyintéző, biztosítási kárfelmérő, utasbiztosítási szakértő

Az ingatlan-értékbecslők alaposan elemzik és megvizsgálják az ingatlanokat, hogy meghatározzák azok értékét eladás, jelzálog- és biztosítási ügylet céljából.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: megkezdett felsőfokú tanulmányok · a válaszadók 30.6%-a jelölte

**Holland-kód:** CRE — R 70 · I 34 · A 3 · S 11 · E 42 · C 74

**HEXACO differenciál cél-profil:** H cél 58±25 (w=0.47) · O cél 46±27 (w=0.27) · A cél 48±28 (w=0.15)

**HEXACO abszolút szint:** H 53 · E 51 · X 48 · A 46 · C 47 · O 45

### Becsüsök és kárfelmérők

`23-2093.00` · **ISCO-08 3315** Becsüsök és kárfelmérők · **FEOR-08:** 3616 Értékbecslő, kárbecslő, kárszakértő · ESCO `3315.1` · EN: Title Examiners, Abstractors, and Searchers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* adósságrendező, adósságrendezési tanácsadó, ingósági szakértő, becsüs, bútor- és szőnyegbecsüs, ingatlan-értékbecslő

Az adósságrendezők vizsgálják felül a jelzálogjog érvényesítésének tárgyát képező ingatlanokra vonatkozó dokumentumokat.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 60.3%-a jelölte

**Holland-kód:** CEI — R 24 · I 27 · A 2 · S 22 · E 41 · C 96

**HEXACO differenciál cél-profil:** H cél 61±22 (w=0.23) · A cél 39±23 (w=0.23) · C cél 59±24 (w=0.18) · X cél 42±25 (w=0.16)

**HEXACO abszolút szint:** H 49 · E 59 · X 37 · A 36 · C 50 · O 40

### ingósági szakértő

`13-2022.00` · **ISCO-08 3315** Becsüsök és kárfelmérők · **FEOR-08:** 3616 Értékbecslő, kárbecslő, kárszakértő · ESCO `3315.6` · EN: Appraisers of Personal and Business Property

*Piaci megnevezések (ESCO):* becsüs, bútor- és szőnyegbecsüs, ingatlan-értékbecslő, lakóingatlan-értékbecslő, ingatlanszakértő, drágakőszakértő

Az ingósági szakértők az ingóságok – könyvek, borok, műtárgyak és régiségek – részletes elemzését és vizsgálatát végzik el annak érdekében, hogy megállapítsák azok eladási és biztosítási értékét.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 39.1%-a jelölte

**Holland-kód:** CER — R 43 · I 26 · A 18 · S 11 · E 61 · C 83

**HEXACO differenciál cél-profil:** A cél 33±19 (w=0.35) · H cél 65±20 (w=0.31) · O cél 57±26 (w=0.14)

**HEXACO abszolút szint:** H 55 · E 57 · X 45 · A 35 · C 48 · O 51

### Felvásárlók

`13-1021.00` · **ISCO-08 3323** Felvásárlók · **FEOR-08:** 3623 Anyaggazdálkodó, felvásárló · ESCO `3323.2.1` · EN: Buyers and Purchasing Agents, Farm Products · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* anyaggazdálkodó, felvásárló, beszerző, felvásárló

Az anyaggazdálkodó, felvásárló készleteket, anyagokat, szolgáltatásokat vagy árukat választ ki és vásárol fel. Közbeszerzési eljárásokat szervez és kiválasztja a beszállítókat.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 76.8%-a jelölte

**Holland-kód:** ECR — R 59 · I 14 · A 1 · S 12 · E 65 · C 63

**HEXACO differenciál cél-profil:** X cél 60±23 (w=0.46) · A cél 42±25 (w=0.34) · H cél 53±28 (w=0.13)

**HEXACO abszolút szint:** H 54 · E 49 · X 57 · A 47 · C 51 · O 51

### Munka- és bérmunka-közvetítők

`13-1074.00` · **ISCO-08 3333** Munka- és bérmunka-közvetítők · **FEOR-08:** 3520 Munkaerő-piaci szolgáltatási ügyintéző · ESCO `3333` · EN: Farm Labor Contractors · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Recruit and hire seasonal or temporary agricultural laborers. May transport, house, and provide meals for workers.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 48.0%-a jelölte

**Holland-kód:** ERC — R 64 · I 9 · A 0 · S 37 · E 66 · C 56

**HEXACO differenciál cél-profil:** X cél 65±20 (w=0.35) · O cél 38±22 (w=0.29) · C cél 43±26 (w=0.16) · H cél 56±26 (w=0.14)

**HEXACO abszolút szint:** H 54 · E 50 · X 59 · A 51 · C 41 · O 40

### Ingatlanügynökök és -kezelők

`39-9041.00` · **ISCO-08 3334** Ingatlanügynökök és -kezelők · **FEOR-08:** 3633 Ingatlanügynök, ingatlanforgalmazási ügyintéző · ESCO `3334.1` · EN: Residential Advisors · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* társasházkezelő, épületgondnok, háztömbfelügyelő

A társasházkezelők lakhatással kapcsolatos szolgáltatásokról gondoskodnak a bérlők vagy lakók számára.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: megkezdett felsőfokú tanulmányok · a válaszadók 50.2%-a jelölte

**Holland-kód:** SCE — R 30 · I 23 · A 21 · S 71 · E 47 · C 60

**HEXACO differenciál cél-profil:** C cél 35±20 (w=0.27) · A cél 62±22 (w=0.22) · X cél 62±22 (w=0.21) · O cél 40±24 (w=0.17)

**HEXACO abszolút szint:** H 65 · E 42 · X 67 · A 67 · C 49 · O 50

### Máshová nem sorolható üzleti szolgáltatásokat nyújtók

`13-1011.00` · **ISCO-08 3339** Máshová nem sorolható üzleti szolgáltatásokat nyújtók · **FEOR-08:** 3639 Egyéb, máshova nem sorolható üzleti jellegű szolgáltatás ügyintézője; 3910 Egyéb ügyintéző · ESCO `3339.7` · EN: Agents and Business Managers of Artists, Performers, and Athletes · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* relokációs tanácsadó, áttelepítési tanácsadó, szellemitulajdon-védelmi tanácsadó, szellemitulajdon-jogi szakértő, szellemitulajdon-védelmi szakértő

A relokációs tanácsadók a munkavállalók költözésében segítik a vállalkozásokat és szervezeteket. A költözés egész folyamatát megtervezik. A relokációs tanácsadók ingatlanokkal kapcsolatos tanácsokat adnak.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 41.3%-a jelölte

**Holland-kód:** ESC — R 0 · I 13 · A 42 · S 52 · E 91 · C 46

**HEXACO differenciál cél-profil:** X cél 71±16 (w=0.35) · H cél 29±16 (w=0.35) · E cél 42±25 (w=0.13)

**HEXACO abszolút szint:** H 42 · E 40 · X 69 · A 58 · C 50 · O 57

### igazgatási asszisztens

`27-3092.00` · **ISCO-08 3343** Igazgatási és ügyvezetési titkárok · **FEOR-08:** 3641 Személyi asszisztens; 3649 Egyéb igazgatási és jogi asszisztens · ESCO `3343.1.1` · EN: Court Reporters and Simultaneous Captioners

*Piaci megnevezések (ESCO):* adminisztratív asszisztens, titkárnő, nyelvi szerkesztő, korrektor, szabadúszó korrektor

Az igazgatási asszisztensek igazgatási és adminisztratív támogatást nyújtanak a vezetők számára.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 74.8%-a jelölte

**Holland-kód:** CAS — R 20 · I 19 · A 32 · S 32 · E 27 · C 77

**HEXACO differenciál cél-profil:** C cél 64±21 (w=0.25) · O cél 36±21 (w=0.24) · X cél 37±22 (w=0.23) · H cél 60±23 (w=0.18)

**HEXACO abszolút szint:** H 51 · E 51 · X 37 · A 43 · C 56 · O 36

### Vám- és határfelügyeleti ügyintézők

`33-9093.00` · **ISCO-08 3351** Vám- és határfelügyeleti ügyintézők · **FEOR-08:** 3651 Vám- és pénzügyőr · ESCO `3351.2` · EN: Transportation Security Screeners · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* utasbiztonsági ellenőr, kézipoggyász-ellenőr, repülőtéri vámkezelő

Az utasbiztonsági ellenőrök magánszemélyek poggyászát ellenőrzik a potenciálisan fenyegető tárgyak felderítése érdekében. Betartják a közbiztonsági előírásokat és a vállalati eljárást.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 85.2%-a jelölte

**Holland-kód:** CRE — R 70 · I 17 · A 0 · S 24 · E 27 · C 75

**HEXACO differenciál cél-profil:** O cél 35±20 (w=0.34) · A cél 59±24 (w=0.22) · E cél 43±25 (w=0.17) · X cél 44±26 (w=0.14)

**HEXACO abszolút szint:** H 51 · E 46 · X 46 · A 55 · C 53 · O 38

### vám- és pénzügyőr

`33-3051.04` · **ISCO-08 3351** Vám- és határfelügyeleti ügyintézők · **FEOR-08:** 3651 Vám- és pénzügyőr · ESCO `3351.1` · EN: Customs and Border Protection Officers

*Piaci megnevezések (ESCO):* vámőr, vámkezelő, bevándorlási tiszt, határfelügyeleti ügyintéző, utasbiztonsági ellenőr, kézipoggyász-ellenőr

A vám- és pénzügyőrök az illegális áruk, lőfegyverek, kábítószerek, illetve más veszélyes vagy illegális termékek behozatala ellen folytatnak küzdelmet a nemzeti határokon keresztül szállított áruk jogszerűségének ellenőrzése során.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 39.0%-a jelölte

**Holland-kód:** CER — R 40 · I 27 · A 0 · S 27 · E 55 · C 71

**HEXACO differenciál cél-profil:** E cél 39±22 (w=0.33) · O cél 41±24 (w=0.26) · C cél 55±27 (w=0.13) · H cél 46±27 (w=0.13)

**HEXACO abszolút szint:** H 50 · E 40 · X 55 · A 52 · C 59 · O 45

### Szociális ellátásokat kezelő ügyintézők

`43-4061.00` · **ISCO-08 3353** Szociális ellátásokat kezelő ügyintézők · **FEOR-08:** 3653 Társadalombiztosítási és segélyezési hatósági ügyintéző · ESCO `3353.1` · EN: Eligibility Interviewers, Government Programs · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* társadalombiztosítási ellenőr, társadalombiztosítási szakértő, munkajogi tanácsadó, társadalombiztosítási ügyintéző, társadalombiztosítási tanácsadó, foglalkoztatási és társadalombiztosítási tanácsadó

A társadalombiztosítási ellenőrök a társadalombiztosítás területén elkövetett, munkavállalói jogokat érintő csalárd tevékenységeket vizsgálják.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 25.6%-a jelölte

**Holland-kód:** CSE — R 0 · I 24 · A 0 · S 58 · E 49 · C 89

**HEXACO differenciál cél-profil:** H cél 68±18 (w=0.34) · O cél 35±20 (w=0.28) · A cél 58±25 (w=0.14) · E cél 56±26 (w=0.12)

**HEXACO abszolút szint:** H 62 · E 54 · X 48 · A 55 · C 49 · O 39

### Rendőrfelügyelők és nyomozók

`33-3021.02` · **ISCO-08 3355** Rendőrfelügyelők és nyomozók · **FEOR-08:** 3655 Nyomozó · ESCO `3355.2` · EN: Police Identification and Records Officers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* rendőrségi nyomozó, rendőr, rendőrnő, rendőrfelügyelő, rendőrkapitány, rendőr-főfelügyelő

A rendőrségi nyomozók a bűncselekmények nyomozása során segítséget nyújtó bizonyítékokat gyűjtenek és állítanak össze.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 34.6%-a jelölte

**Holland-kód:** CRI — R 64 · I 45 · A 10 · S 16 · E 32 · C 77

**HEXACO differenciál cél-profil:** X cél 42±24 (w=0.33) · H cél 57±25 (w=0.28) · E cél 44±26 (w=0.24)

**HEXACO abszolút szint:** H 61 · E 41 · X 50 · A 57 · C 60 · O 55

### Máshová nem sorolható közhivatali ügyintézők

`33-2022.00` · **ISCO-08 3359** Máshová nem sorolható közhivatali ügyintézők · **FEOR-08:** 3659 Egyéb hatósági ügyintéző; 3910 Egyéb ügyintéző · ESCO `3359.4` · EN: Forest Fire Inspectors and Prevention Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* erdészeti felügyelő, erdészetvezető, erdőgazdálkodási ágazat vezetője

Az erdészeti felügyelők nyomon követik az erdészeti műveleteket annak biztosítása érdekében, hogy a munkavállalók és tevékenységeik megfeleljenek a megfelelő jogszabályoknak és előírásoknak.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 31.6%-a jelölte

**Holland-kód:** RCI — R 89 · I 43 · A 2 · S 36 · E 40 · C 60

**HEXACO differenciál cél-profil:** E cél 40±23 (w=0.26) · H cél 42±25 (w=0.20) · A cél 57±25 (w=0.20) · O cél 43±26 (w=0.17)

**HEXACO abszolút szint:** H 52 · E 38 · X 58 · A 61 · C 60 · O 50

### mezőgazdasági felügyelő

`45-2011.00` · **ISCO-08 3359** Máshová nem sorolható közhivatali ügyintézők · **FEOR-08:** 3659 Egyéb hatósági ügyintéző; 3910 Egyéb ügyintéző · ESCO `3359.1` · EN: Agricultural Inspectors

*Piaci megnevezések (ESCO):* mezőgazdasági technikus, erdészeti felügyelő, erdészetvezető, erdőgazdálkodási ágazat vezetője, súly- és méretvizsgáló termékellenőr

A mezőgazdasági felügyelők a mezőgazdasági üzemekben és más mezőgazdasági létesítményekben végzett mezőgazdasági műveleteket követik nyomon.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 56.2%-a jelölte

**Holland-kód:** RCI — R 72 · I 51 · A 0 · S 15 · E 35 · C 70

**HEXACO differenciál cél-profil:** H cél 63±22 (w=0.36) · O cél 40±24 (w=0.27) · A cél 45±27 (w=0.14) · C cél 55±27 (w=0.14)

**HEXACO abszolút szint:** H 57 · E 53 · X 49 · A 46 · C 54 · O 42

### Jogi és hasonló foglalkozásúak

`23-1012.00` · **ISCO-08 3411** Jogi és hasonló foglalkozásúak · **FEOR-08:** 3649 Egyéb igazgatási és jogi asszisztens; 3910 Egyéb ügyintéző · ESCO `3411.2` · EN: Judicial Law Clerks · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* ingatlan-ügyintéző, ingatlanjogász, ingatlanátruházási ügyintéző, bírósági titkár, bírósági asszisztens, bírósági fogalmazó

Az ingatlan-ügyintézők a jogcímek és ingatlanok egyik féltől a másikhoz való jogátruházásához kapcsolódó szolgáltatásokat nyújtanak. Megkötik a szükséges csereügyleteket, és gondoskodnak minden ingatlan, jogcím és jog átruházásáról.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: doktori fokozat (PhD) · a válaszadók 51.9%-a jelölte

**Holland-kód:** CEI — R 10 · I 50 · A 18 · S 40 · E 58 · C 68

**HEXACO differenciál cél-profil:** H cél 61±22 (w=0.28) · X cél 41±24 (w=0.24) · A cél 44±26 (w=0.14) · O cél 56±26 (w=0.14)

**HEXACO abszolút szint:** H 62 · E 49 · X 48 · A 51 · C 60 · O 57

### bírósági rendfenntartó

`33-3011.00` · **ISCO-08 3411** Jogi és hasonló foglalkozásúak · **FEOR-08:** 3649 Egyéb igazgatási és jogi asszisztens; 3910 Egyéb ügyintéző · ESCO `3411.4` · EN: Bailiffs

*Piaci megnevezések (ESCO):* törvényszolga, hivatalsegéd, bírósági ügyintéző, bírósági hivatalvezető, bírósági adminisztrátor, bírósági titkár

A bírósági rendfenntartók a tárgyalótermi rendet és biztonságot tartják fenn.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 39.9%-a jelölte

**Holland-kód:** RCE — R 63 · I 19 · A 0 · S 38 · E 50 · C 58

**HEXACO differenciál cél-profil:** O cél 31±18 (w=0.46) · H cél 58±24 (w=0.21) · E cél 42±25 (w=0.18)

**HEXACO abszolút szint:** H 53 · E 46 · X 50 · A 51 · C 51 · O 36

### magánnyomozó

`33-9021.00` · **ISCO-08 3411** Jogi és hasonló foglalkozásúak · **FEOR-08:** 3649 Egyéb igazgatási és jogi asszisztens; 3910 Egyéb ügyintéző · ESCO `3411.8` · EN: Private Detectives and Investigators

*Piaci megnevezések (ESCO):* magándetektív

A magánnyomozók – az ügyfeleiktől függően – személyes, vállalati vagy jogi okokból tényfeltárási céllal végeznek kutatást és információ-elemzést.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 37.7%-a jelölte

**Holland-kód:** CEI — R 23 · I 48 · A 7 · S 31 · E 51 · C 74

**HEXACO differenciál cél-profil:** A cél 39±22 (w=0.26) · O cél 61±23 (w=0.25) · E cél 41±24 (w=0.20) · C cél 56±26 (w=0.15)

**HEXACO abszolút szint:** H 51 · E 41 · X 52 · A 47 · C 60 · O 60

### Sportolók

`27-2021.00` · **ISCO-08 3421** Sportolók · **FEOR-08:** 3721 Sportoló · ESCO `3421` · EN: Athletes and Sports Competitors · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* hivatásos sportoló, atléta, úszó

_(HU leírás nincs; EN:)_ Compete in athletic events.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 34.8%-a jelölte

**Holland-kód:** RES — R 70 · I 7 · A 19 · S 55 · E 59 · C 34

**HEXACO differenciál cél-profil:** E cél 28±15 (w=0.33) · X cél 69±17 (w=0.28) · H cél 31±18 (w=0.28)

**HEXACO abszolút szint:** H 39 · E 33 · X 64 · A 53 · C 50 · O 49

### sportoktató

`27-2023.00` · **ISCO-08 3422** Sportedzők, -oktatók és -tisztségviselők · **FEOR-08:** 2717 Szakképzett edző, sportszervező, -irányító · ESCO `3422.5` · EN: Umpires, Referees, and Other Sports Officials

A sportoktatók valamilyen sportágba vezetik be az embereket, és megtanítják nekik a sportoláshoz szükséges készségeket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 42.9%-a jelölte

**Holland-kód:** ECR — R 55 · I 10 · A 2 · S 41 · E 80 · C 59

**HEXACO differenciál cél-profil:** O cél 33±18 (w=0.32) · E cél 37±22 (w=0.23) · H cél 62±22 (w=0.22) · X cél 58±24 (w=0.15)

**HEXACO abszolút szint:** H 59 · E 41 · X 56 · A 50 · C 51 · O 38

### Fitneszoktatók és szabadidős programok vezetői

`29-1128.00` · **ISCO-08 3423** Fitneszoktatók és szabadidős programok vezetői · **FEOR-08:** 3722 Fitnesz- és rekreációs program irányítója · ESCO `3423.2.2` · EN: Exercise Physiologists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* fitneszoktató, fitnesz instruktor, aerobic oktató

A fitneszoktatók az új és meglévő tagok fitnesztevékenységekben való részvételéhez járulnak hozzá az igényeiknek megfelelő fitneszgyakorlatokkal. A berendezések segítségével egyének, illetve fitneszórák keretében csoportok számára tartanak fitneszoktatást.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 59.1%-a jelölte

**Holland-kód:** RIS — R 71 · I 65 · A 8 · S 62 · E 33 · C 46

**HEXACO differenciál cél-profil:** C cél 42±25 (w=0.32) · X cél 56±26 (w=0.23) · A cél 54±27 (w=0.17) · E cél 53±28 (w=0.14)

**HEXACO abszolút szint:** H 57 · E 47 · X 60 · A 60 · C 51 · O 57

### díszlettervező

`27-1027.00` · **ISCO-08 3432** Épületbelső-tervezők és -dekoratőrök · **FEOR-08:** 3714 Díszletező, díszítő; 3716 Lakberendező, dekoratőr · ESCO `3432.5` · EN: Set and Exhibit Designers

*Piaci megnevezések (ESCO):* színházi díszlettervező, kiállítástervező, makettkészítő, mintakészítő, miniatűr modell készítője, dekoratőr

A díszlettervezők egy-egy előadás díszlettervét dolgozzák ki, és felügyelik annak végrehajtását. Munkájuk kutatáson és művészi látásmódon alapul.

**Végzettségi minimum:** szakirányú diploma + szakvizsga/kamara (Job Zone 5) · tipikus: alapszak (BA/BSc) · a válaszadók 33.3%-a jelölte

**Holland-kód:** AER — R 45 · I 29 · A 95 · S 34 · E 49 · C 38

**HEXACO differenciál cél-profil:** H cél 29±16 (w=0.39) · O cél 65±20 (w=0.28) · X cél 59±24 (w=0.17)

**HEXACO abszolút szint:** H 37 · E 46 · X 56 · A 51 · C 46 · O 62

### Kiállítótermi, múzeumi és könyvtári technikusok

`25-4013.00` · **ISCO-08 3433** Kiállítótermi, múzeumi és könyvtári technikusok · **FEOR-08:** 3717 Kulturális intézményi szaktechnikus · ESCO `3433` · EN: Museum Technicians and Conservators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* művészeti szakértő, preparátor, konzervátor

_(HU leírás nincs; EN:)_ Restore, maintain, or prepare objects in museum collections for storage, research, or exhibit. May work with specimens such as fossils, skeletal parts, or botanicals; or artifacts, textiles, or art.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: mesterszak (MA/MSc) · a válaszadók 41.3%-a jelölte

**Holland-kód:** RCI — R 78 · I 37 · A 36 · S 27 · E 8 · C 60

**HEXACO differenciál cél-profil:** O cél 59±24 (w=0.34) · E cél 57±26 (w=0.25) · X cél 44±26 (w=0.20) · A cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 52 · E 53 · X 48 · A 50 · C 56 · O 58

### kellékkészítő

`27-4015.00` · **ISCO-08 3435** Egyéb művészeti és kulturális foglalkozásúak · **FEOR-08:** 2714 Kulturális szervező; 2719 Egyéb kulturális és sportfoglalkozású (felsőfokú képzettséghez kapcsolódó); 3711 Segédszínész, statiszta; 3712 Segédrendező; 3715 Kiegészítő filmgyártási és színházi foglalkozású; 3719 Egyéb művészeti és kulturális foglalkozású · ESCO `3435.15` · EN: Lighting Technicians

*Piaci megnevezések (ESCO):* díszítő, díszlettervező, filmrendező-asszisztens, video- és filmrendező-asszisztens, televíziós segédrendező

A kellékkészítők színpadon, illetve filmkészítéshez vagy televíziós műsorok készítéséhez használt kellékeket állítanak össze, építenek, készítenek, alakítanak át és tartanak karban.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: —

**Holland-kód:** RCA — R 100 · I 17 · A 23 · S 4 · E 16 · C 52

**HEXACO differenciál cél-profil:** H cél 40±24 (w=0.34) · E cél 42±25 (w=0.27) · A cél 55±27 (w=0.17)

**HEXACO abszolút szint:** H 40 · E 48 · X 45 · A 49 · C 48 · O 49

### statiszta

`39-3092.00` · **ISCO-08 3435** Egyéb művészeti és kulturális foglalkozásúak · **FEOR-08:** 2714 Kulturális szervező; 2719 Egyéb kulturális és sportfoglalkozású (felsőfokú képzettséghez kapcsolódó); 3711 Segédszínész, statiszta; 3712 Segédrendező; 3715 Kiegészítő filmgyártási és színházi foglalkozású; 3719 Egyéb művészeti és kulturális foglalkozású · ESCO `3435.7.1` · EN: Costume Attendants

*Piaci megnevezések (ESCO):* filmes statiszta, televíziós statiszta, világítástechnikus, világítási mérnök

A statiszták a filmforgatás során a háttérben vagy a tömegben hajtanak végre cselekményeket. Közvetlenül nem járulnak hozzá a cselekményhez, de bizonyos atmoszféra létrehozásához fontosak.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 32.2%-a jelölte

**Holland-kód:** ACR — R 48 · I 0 · A 77 · S 38 · E 31 · C 54

**HEXACO differenciál cél-profil:** A cél 59±24 (w=0.40) · H cél 44±26 (w=0.26) · C cél 45±26 (w=0.23)

**HEXACO abszolút szint:** H 46 · E 51 · X 50 · A 54 · C 44 · O 51

### közvetítési technikus

`27-4012.00` · **ISCO-08 3521** Műsorszórási és audiovizuális technikusok · **FEOR-08:** 3145 Műsorszóró és audiovizuális technikus · ESCO `3521.2` · EN: Broadcast Technicians

*Piaci megnevezések (ESCO):* közvetítési technikusok, rádió- és TV-technikus, audiovizuális technikus, hangtechnikus, műsorszóró és audiovizuális technikus

A közvetítési technikusok televíziós és rádiós műsorszolgálgatási jelek továbbításához és fogadásához használt berendezéseket helyeznek üzembe, indítanak el, tartanak karban, követnek nyomon és javítanak.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 43.4%-a jelölte

**Holland-kód:** CRI — R 63 · I 33 · A 30 · S 19 · E 25 · C 69

**HEXACO differenciál cél-profil:** X cél 42±25 (w=0.23) · E cél 42±25 (w=0.23) · O cél 57±25 (w=0.20) · H cél 44±26 (w=0.18)

**HEXACO abszolút szint:** H 41 · E 48 · X 41 · A 46 · C 50 · O 52


## 4 — Irodai és ügyviteli (adminisztratív) jellegű foglalkozások

### Bukmékerek, krupiék és hasonló foglalkozásúak

`39-1013.00` · **ISCO-08 4212** Bukmékerek, krupiék és hasonló foglalkozásúak · **FEOR-08:** 4212 Szerencsejáték-szervező · ESCO `4212.1` · EN: First-Line Supervisors of Gambling Services Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* bingóhoszt, bingó játékvezető-asszisztens, főjátékvezető, bukméker, nem helyszíni bukméker, sportfogadási ügyintéző

A bingóhosztok bingóteremben, társasági klubban vagy más szórakoztató létesítményben szerveznek és bonyolítanak le játékokat. A bingóhosztok ismerik a bingózásra irányadó jogszabályokat és az összes bingóváltozat játszására vonatkozó klubszabályokat.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 47.7%-a jelölte

**Holland-kód:** ECR — R 45 · I 0 · A 0 · S 34 · E 82 · C 75

**HEXACO differenciál cél-profil:** X cél 64±21 (w=0.30) · O cél 37±21 (w=0.29) · E cél 44±26 (w=0.13) · A cél 55±27 (w=0.11)

**HEXACO abszolút szint:** H 53 · E 42 · X 63 · A 58 · C 52 · O 43

### Bukmékerek, krupiék és hasonló foglalkozásúak

`43-3041.00` · **ISCO-08 4212** Bukmékerek, krupiék és hasonló foglalkozásúak · **FEOR-08:** 4212 Szerencsejáték-szervező · ESCO `4212.1` · EN: Gambling Cage Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* bingóhoszt, bingó játékvezető-asszisztens, főjátékvezető, bukméker, nem helyszíni bukméker, sportfogadási ügyintéző

A bingóhosztok bingóteremben, társasági klubban vagy más szórakoztató létesítményben szerveznek és bonyolítanak le játékokat. A bingóhosztok ismerik a bingózásra irányadó jogszabályokat és az összes bingóváltozat játszására vonatkozó klubszabályokat.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 84.8%-a jelölte

**Holland-kód:** CES — R 32 · I 0 · A 0 · S 32 · E 61 · C 83

**HEXACO differenciál cél-profil:** O cél 31±17 (w=0.44) · H cél 68±18 (w=0.42) · X cél 45±27 (w=0.10)

**HEXACO abszolút szint:** H 56 · E 54 · X 43 · A 45 · C 48 · O 32

### játéktermi osztó

`39-3011.00` · **ISCO-08 4212** Bukmékerek, krupiék és hasonló foglalkozásúak · **FEOR-08:** 4212 Szerencsejáték-szervező · ESCO `4212.5` · EN: Gambling Dealers

*Piaci megnevezések (ESCO):* játékfelügyelő, krupié, bingóhoszt, bingó játékvezető-asszisztens, főjátékvezető, bukméker

A játéktermi osztók asztali játékokat működtetnek. A játékasztal mögött állnak, és a játékosoknak kiosztott megfelelő számú kártyával vagy egyéb szerencsejáték-eszközök működtetésével bonyolítják le a szerencsejátékokat.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 69.0%-a jelölte

**Holland-kód:** CER — R 45 · I 0 · A 2 · S 19 · E 70 · C 74

**HEXACO differenciál cél-profil:** O cél 33±18 (w=0.30) · A cél 60±23 (w=0.17) · C cél 41±24 (w=0.16) · E cél 42±24 (w=0.15)

**HEXACO abszolút szint:** H 49 · E 49 · X 48 · A 51 · C 36 · O 33

### Ügyfélszolgálati ügyintézők

`43-4021.00` · **ISCO-08 4225** Ügyfélszolgálati ügyintézők · **FEOR-08:** 4224 Ügyfél- (vevő)tájékoztató · ESCO `4225` · EN: Correspondence Clerks · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Compose letters or electronic correspondence in reply to requests for merchandise, damage claims, credit and other information, delinquent accounts, incorrect billings, or unsatisfactory services.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 42.9%-a jelölte

**Holland-kód:** CES — R 5 · I 25 · A 10 · S 28 · E 40 · C 98

**HEXACO differenciál cél-profil:** H cél 64±21 (w=0.33) · X cél 41±24 (w=0.21) · O cél 42±25 (w=0.19) · A cél 56±26 (w=0.14)

**HEXACO abszolút szint:** H 53 · E 58 · X 39 · A 48 · C 43 · O 39

### Máshová nem sorolható, ügyfél-tájékoztatási foglalkozásúak

`39-6012.00` · **ISCO-08 4229** Máshová nem sorolható, ügyfél-tájékoztatási foglalkozásúak · **FEOR-08:** 4229 Egyéb ügyfélkapcsolati foglalkozású · ESCO `4229.2` · EN: Concierges · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Assist patrons at hotel, apartment, or office building with personal services. May take messages; arrange or give advice on transportation, business services, or entertainment; or monitor guest requests for housekeeping and maintenance.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 45.5%-a jelölte

**Holland-kód:** SEC — R 28 · I 0 · A 22 · S 72 · E 61 · C 53

**HEXACO differenciál cél-profil:** A cél 66±20 (w=0.31) · C cél 36±21 (w=0.27) · X cél 57±25 (w=0.14) · H cél 55±26 (w=0.10)

**HEXACO abszolút szint:** H 61 · E 42 · X 61 · A 66 · C 46 · O 51

### légi szállítmányozási nyilvántartó

`53-1041.00` · **ISCO-08 4323** Szállítmányozási nyilvántartók · **FEOR-08:** 3161 Munka- és termelésszervező; 4132 Szállítási, szállítmányozási nyilvántartó · ESCO `4323.1` · EN: Aircraft Cargo Handling Supervisors

*Piaci megnevezések (ESCO):* árufuvarozói ügyintéző, légi teherfuvarozási logisztikai szakember

A légi szállítmányozási nyilvántartók a légi fuvarozási terminál teheráru-rakodási és földi kiszolgálási tevékenységeit irányítják és koordinálják. A munkatevékenységek megtervezése érdekében felülvizsgálják az érkező járatokra vonatkozó adatokat.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 64.1%-a jelölte

**Holland-kód:** ECR — R 60 · I 20 · A 0 · S 24 · E 73 · C 63

**HEXACO differenciál cél-profil:** O cél 39±22 (w=0.30) · X cél 59±24 (w=0.24) · E cél 43±25 (w=0.18) · H cél 44±26 (w=0.16)

**HEXACO abszolút szint:** H 50 · E 42 · X 59 · A 56 · C 57 · O 45

### könyvtárosasszisztens

`25-4031.00` · **ISCO-08 4411** Könyvtári nyilvántartók · **FEOR-08:** 4133 Könyvtári, levéltári nyilvántartó · ESCO `4411.1` · EN: Library Technicians

*Piaci megnevezések (ESCO):* segédkönyvtáros, könyvtárossegéd

A könyvtárosasszisztensek a könyvtár napi szintű tevékenységei során segítik a könyvtárosokat. Segítséget nyújtanak az ügyfeleknek azoknak az anyagoknak a megtalálásában, amelyekre szükségük van, ellenőrzik a könyvtári anyagokat, és polcokat rendeznek.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: alapszak (BA/BSc) · a válaszadók 29.6%-a jelölte

**Holland-kód:** CSR — R 35 · I 28 · A 10 · S 51 · E 15 · C 92

**HEXACO differenciál cél-profil:** E cél 61±23 (w=0.24) · H cél 60±23 (w=0.23) · A cél 60±24 (w=0.21) · C cél 42±25 (w=0.18)

**HEXACO abszolút szint:** H 55 · E 59 · X 49 · A 54 · C 40 · O 44

### könyvtárosasszisztens

`43-4121.00` · **ISCO-08 4411** Könyvtári nyilvántartók · **FEOR-08:** 4133 Könyvtári, levéltári nyilvántartó · ESCO `4411.1` · EN: Library Assistants, Clerical

*Piaci megnevezések (ESCO):* segédkönyvtáros, könyvtárossegéd

A könyvtárosasszisztensek a könyvtár napi szintű tevékenységei során segítik a könyvtárosokat. Segítséget nyújtanak az ügyfeleknek azoknak az anyagoknak a megtalálásában, amelyekre szükségük van, ellenőrzik a könyvtári anyagokat, és polcokat rendeznek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 49.8%-a jelölte

**Holland-kód:** CSR — R 32 · I 17 · A 5 · S 46 · E 20 · C 98

**HEXACO differenciál cél-profil:** H cél 62±22 (w=0.26) · E cél 60±23 (w=0.23) · A cél 59±24 (w=0.20) · O cél 42±25 (w=0.18)

**HEXACO abszolút szint:** H 53 · E 61 · X 46 · A 51 · C 39 · O 40

### korrektor

`43-9081.00` · **ISCO-08 4413** Kódolók, korrektúrázók és hasonló irodai foglalkozásúak 4114 Adatrögzítő, kódoló · **FEOR-08:** — · ESCO `4413.1` · EN: Proofreaders and Copy Markers

*Piaci megnevezések (ESCO):* nyelvi szerkesztő, lektor

A korrektorok könyvek, újságok és magazinok nyomdakész anyagait vizsgálják át. A nyomtatott termékek színvonalának biztosítása érdekében nyelvtani, tipográfiai és helyesírási hibákat javítanak.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 47.3%-a jelölte

**Holland-kód:** CAI — R 7 · I 25 · A 43 · S 20 · E 9 · C 86

**HEXACO differenciál cél-profil:** C cél 65±20 (w=0.34) · O cél 41±24 (w=0.21) · A cél 43±25 (w=0.15) · X cél 43±26 (w=0.15)

**HEXACO abszolút szint:** H 40 · E 62 · X 36 · A 36 · C 53 · O 36


## 5 — Kereskedelmi és szolgáltatási foglalkozások

### Utaskísérők és stewardok

`53-1044.00` · **ISCO-08 5111** Utaskísérők és stewardok · **FEOR-08:** 5232 Utaskísérő (repülőn, hajón) · ESCO `5111.2.3` · EN: First-Line Supervisors of Passenger Attendants · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* utaskísérő, hostess, légiutas-kísérő, kabinszemélyzet-menedzser, kabinszemélyzet-vezető, ügyfélszolgálati igazgató

Az utaskísérők valamennyi szárazföldi, tengeri és légi járaton étel- és italfelszolgálási tevékenységeket végeznek.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: —

**Holland-kód:** ECS — R 27 · I 1 · A 0 · S 51 · E 92 · C 70

**HEXACO differenciál cél-profil:** X cél 63±21 (w=0.36) · O cél 42±25 (w=0.21) · C cél 43±26 (w=0.18) · A cél 56±26 (w=0.16)

**HEXACO abszolút szint:** H 56 · E 44 · X 65 · A 61 · C 53 · O 49

### Utaskísérők és stewardok

`53-6061.00` · **ISCO-08 5111** Utaskísérők és stewardok · **FEOR-08:** 5232 Utaskísérő (repülőn, hajón) · ESCO `5111.2.1` · EN: Passenger Attendants · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* utaskísérő, hostess, légiutas-kísérő

Az utaskísérők valamennyi szárazföldi, tengeri és légi járaton étel- és italfelszolgálási tevékenységeket végeznek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 82.2%-a jelölte

**Holland-kód:** CSR — R 46 · I 2 · A 0 · S 56 · E 35 · C 58

**HEXACO differenciál cél-profil:** O cél 33±19 (w=0.27) · A cél 65±20 (w=0.24) · H cél 63±21 (w=0.21) · C cél 39±23 (w=0.17)

**HEXACO abszolút szint:** H 61 · E 52 · X 54 · A 61 · C 43 · O 38

### Kalauzok

`53-4031.00` · **ISCO-08 5112** Kalauzok · **FEOR-08:** 5231 Kalauz, menetjegyellenőr · ESCO `5112.1` · EN: Railroad Conductors and Yardmasters · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* főkalauz, kalauz, vasúti jegyvizsgáló, jegyellenőr

A főkalauzok a személyszállító vonatokon a mozdonyvezető-fülkén kívül felmerülő operatív feladatok biztonságos ellátásáért felelnek, például felügyelik a vonatajtók biztonságos nyitását és zárását.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 85.6%-a jelölte

**Holland-kód:** RCE — R 80 · I 16 · A 0 · S 14 · E 46 · C 64

**HEXACO differenciál cél-profil:** O cél 37±21 (w=0.30) · E cél 40±23 (w=0.23) · X cél 59±24 (w=0.20) · H cél 44±26 (w=0.14)

**HEXACO abszolút szint:** H 48 · E 42 · X 58 · A 55 · C 55 · O 42

### Idegenvezetők

`19-1031.03` · **ISCO-08 5113** Idegenvezetők · **FEOR-08:** 5233 Idegenvezető · ESCO `5113.1.2` · EN: Park Naturalists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* idegenvezető, utaskísérő

Az idegenvezetők bármilyen művészeti létesítményben, társasutazáson vagy városnéző körúton, vagy idegenforgalmi jelentőségű helyszíneken – például múzeumokban, emlékműveknél vagy közterületeken – segítenek egyéneket vagy csoportokat.

**Végzettségi minimum:** felsőfokú diploma (Job Zone 4) · tipikus: alapszak (BA/BSc) · a válaszadók 49.8%-a jelölte

**Holland-kód:** SRI — R 56 · I 54 · A 46 · S 64 · E 41 · C 40

**HEXACO differenciál cél-profil:** C cél 39±23 (w=0.26) · X cél 60±24 (w=0.24) · O cél 58±25 (w=0.19) · E cél 56±26 (w=0.14)

**HEXACO abszolút szint:** H 55 · E 52 · X 58 · A 50 · C 40 · O 57

### szakács

`35-2012.00` · **ISCO-08 5120** Szakácsok · **FEOR-08:** 5131 Vendéglős; 5134 Szakács · ESCO `5120.1` · EN: Cooks, Institution and Cafeteria

*Piaci megnevezések (ESCO):* főszakács, szakácsnő

A szakácsok olyan gasztronómiai szakemberek, akik képesek – általában háztartási és intézményi környezetben – élelmiszert készíteni és bemutatni.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 71.1%-a jelölte

**Holland-kód:** RCS — R 82 · I 14 · A 17 · S 36 · E 36 · C 56

**HEXACO differenciál cél-profil:** O cél 40±23 (w=0.54) · A cél 55±27 (w=0.25)

**HEXACO abszolút szint:** H 46 · E 53 · X 46 · A 48 · C 45 · O 39

### Kozmetikusok és hasonló foglalkozásúak

`39-5091.00` · **ISCO-08 5142** Kozmetikusok és hasonló foglalkozásúak · **FEOR-08:** 5212 Kozmetikus; 5213 Manikűrös, pedikűrös · ESCO `5142.5` · EN: Makeup Artists, Theatrical and Performance · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* sminkmester, sminkes, kozmetikus, smink- és frizuratervező, fodrász és sminkmester, smink-, frizura- és parókatervező

A sminkmesterek az előadások, illetve filmek vagy televízióműsorok forgatása előtt, alatt és után nyújtanak segítséget és támogatást a művészeknek annak biztosítása érdekében, hogy a smink összhangban legyen a rendező és a művészeti csapat művészi elképzelésével.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 33.3%-a jelölte

**Holland-kód:** ARE — R 56 · I 6 · A 95 · S 33 · E 35 · C 34

**HEXACO differenciál cél-profil:** H cél 31±18 (w=0.38) · O cél 60±23 (w=0.20) · X cél 57±25 (w=0.15) · C cél 45±26 (w=0.11)

**HEXACO abszolút szint:** H 40 · E 46 · X 58 · A 55 · C 48 · O 60

### Temetkezési vállalkozók és balzsamozók

`11-9171.00` · **ISCO-08 5163** Temetkezési vállalkozók és balzsamozók · **FEOR-08:** 5293 Temetkezési foglalkozású · ESCO `5163.4` · EN: Funeral Home Managers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* temetésrendező, temetkezési vállalkozó, temetésszolgáltatási munkás

A temetésrendezők a temetés logisztikáját koordinálják. Oly módon támogatják elhunyt családját, hogy gondoskodnak a megemlékezés helyszínével, dátumával és időpontjával kapcsolatos részletekről.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 49.9%-a jelölte

**Holland-kód:** ECS — R 30 · I 22 · A 15 · S 56 · E 90 · C 59

**HEXACO differenciál cél-profil:** H cél 67±19 (w=0.29) · O cél 37±21 (w=0.22) · C cél 42±25 (w=0.14) · E cél 58±25 (w=0.14)

**HEXACO abszolút szint:** H 75 · E 46 · X 63 · A 67 · C 58 · O 49

### Temetkezési vállalkozók és balzsamozók

`39-4012.00` · **ISCO-08 5163** Temetkezési vállalkozók és balzsamozók · **FEOR-08:** 5293 Temetkezési foglalkozású · ESCO `5163.1` · EN: Crematory Operators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* temetői alkalmazott, temetőőr, halottszállító, halottbalzsamozó, temetkezési vállalkozó, halottasházi munkás

A temetői alkalmazottak megfelelő állapotban tartják temető területét. A temetés előtt gondoskodnak arról, hogy a sírok készen álljanak a temetkezésre, emellett pontos temetkezési nyilvántartást vezetnek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: —

**Holland-kód:** RCS — R 83 · I 18 · A 8 · S 29 · E 8 · C 56

**HEXACO differenciál cél-profil:** H cél 77±12 (w=0.37) · O cél 29±16 (w=0.29) · X cél 37±21 (w=0.19)

**HEXACO abszolút szint:** H 66 · E 54 · X 40 · A 52 · C 50 · O 34

### Temetkezési vállalkozók és balzsamozók

`39-4031.00` · **ISCO-08 5163** Temetkezési vállalkozók és balzsamozók · **FEOR-08:** 5293 Temetkezési foglalkozású · ESCO `5163.3` · EN: Morticians, Undertakers, and Funeral Arrangers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* temetkezési foglalkozású, halottszállító, temetkezési segéd, temetésrendező, temetkezési vállalkozó, temetésszolgáltatási munkás

A temetkezési foglalkozásúak a temetés előtt és alatt felemelik és viszik a koporsót, elhelyezik azt a ravatalozóban és a temetőben.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 73.2%-a jelölte

**Holland-kód:** CES — R 42 · I 7 · A 12 · S 57 · E 61 · C 61

**HEXACO differenciál cél-profil:** H cél 67±19 (w=0.29) · O cél 35±20 (w=0.26) · C cél 42±24 (w=0.14) · A cél 58±25 (w=0.14)

**HEXACO abszolút szint:** H 72 · E 47 · X 60 · A 64 · C 55 · O 46

### halottbalzsamozó

`39-4011.00` · **ISCO-08 5163** Temetkezési vállalkozók és balzsamozók · **FEOR-08:** 5293 Temetkezési foglalkozású · ESCO `5163.2` · EN: Embalmers

*Piaci megnevezések (ESCO):* temetkezési vállalkozó, halottasházi munkás, temetői alkalmazott, temetőőr, halottszállító, temetkezési foglalkozású

A halottbalzsamozók intézkednek az elhunyt személyek holttestének az elhalálozás helyéről való eltávolításánál, valamint előkészítik a holttesteket a temetésre vagy a hamvasztásra.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: felsőfokú szakképzés / kétéves diploma · a válaszadók 86.4%-a jelölte

**Holland-kód:** RCS — R 81 · I 26 · A 10 · S 40 · E 28 · C 48

**HEXACO differenciál cél-profil:** H cél 69±18 (w=0.34) · O cél 36±20 (w=0.26) · X cél 39±23 (w=0.20)

**HEXACO abszolút szint:** H 61 · E 54 · X 42 · A 51 · C 50 · O 38

### temetkezési foglalkozású

`39-4021.00` · **ISCO-08 5163** Temetkezési vállalkozók és balzsamozók · **FEOR-08:** 5293 Temetkezési foglalkozású · ESCO `5163.3` · EN: Funeral Attendants

*Piaci megnevezések (ESCO):* halottszállító, temetkezési segéd

A temetkezési foglalkozásúak a temetés előtt és alatt felemelik és viszik a koporsót, elhelyezik azt a ravatalozóban és a temetőben.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 47.0%-a jelölte

**Holland-kód:** RCS — R 66 · I 1 · A 14 · S 49 · E 44 · C 56

**HEXACO differenciál cél-profil:** H cél 75±13 (w=0.32) · O cél 33±19 (w=0.22) · A cél 65±20 (w=0.19) · C cél 39±23 (w=0.14)

**HEXACO abszolút szint:** H 70 · E 51 · X 50 · A 62 · C 45 · O 39

### állatgondozó idomár

`33-9011.00` · **ISCO-08 5164** Hobbiállat-gondozók és -kozmetikusok · **FEOR-08:** 5292 Hobbiállat-gondozó, -kozmetikus · ESCO `5164.2` · EN: Animal Control Workers

*Piaci megnevezések (ESCO):* állatgondozó, állatmenhelyi dolgozó, kutyazkozmetikus, állatmenhelyi segítő, cirkuszi állatgondozó, állatgondozók

Az állatgondozó idomárok feladata, hogy nemzeti jogszabályoknak megfelelően gondoskodjanak a munkát végző állatokról és folytassák a kiképzésüket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 65.4%-a jelölte

**Holland-kód:** RCI — R 82 · I 43 · A 0 · S 27 · E 20 · C 48

**HEXACO differenciál cél-profil:** A cél 58±24 (w=0.25) · O cél 42±25 (w=0.24) · H cél 56±26 (w=0.19) · E cél 45±26 (w=0.16)

**HEXACO abszolút szint:** H 58 · E 44 · X 53 · A 59 · C 49 · O 46

### állatgondozó idomár

`39-2011.00` · **ISCO-08 5164** Hobbiállat-gondozók és -kozmetikusok · **FEOR-08:** 5292 Hobbiállat-gondozó, -kozmetikus · ESCO `5164.2.1` · EN: Animal Trainers

*Piaci megnevezések (ESCO):* állatgondozó, cirkuszi állatgondozó, állatgondozók, állatjóléti felelős, állatjóléti koordinátor, állatjóléti ellenőr

Az állatgondozó idomárok feladata, hogy nemzeti jogszabályoknak megfelelően gondoskodjanak a munkát végző állatokról és folytassák a kiképzésüket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 44.4%-a jelölte

**Holland-kód:** RSC — R 92 · I 22 · A 13 · S 44 · E 18 · C 33

**HEXACO differenciál cél-profil:** A cél 55±26 (w=0.42) · C cél 47±28 (w=0.21) · H cél 52±29 (w=0.12) · O cél 48±29 (w=0.11)

**HEXACO abszolút szint:** H 57 · E 46 · X 55 · A 58 · C 52 · O 52

### Beosztott eladók

`27-1023.00` · **ISCO-08 5223** Beosztott eladók · **FEOR-08:** 5113 Bolti eladó; 5114 Kölcsönző · ESCO `5223.7.18` · EN: Floral Designers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szaküzleti eladó, eladó

A szaküzleti eladók árukat értékesítenek szaküzletekben.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 75.8%-a jelölte

**Holland-kód:** RAC — R 68 · I 11 · A 58 · S 24 · E 46 · C 48

**HEXACO differenciál cél-profil:** C cél 40±23 (w=0.33) · X cél 56±26 (w=0.19) · O cél 56±26 (w=0.19) · A cél 54±27 (w=0.12)

**HEXACO abszolút szint:** H 49 · E 52 · X 54 · A 53 · C 40 · O 55

### művészmodell

`41-9012.00` · **ISCO-08 5241** Manökenek és egyéb modellek · **FEOR-08:** 5122 Áru- és divatbemutató · ESCO `5241.1` · EN: Models

*Piaci megnevezések (ESCO):* modell, divatmodell, reklámmodell, glamour modell

A művészmodellek vizuális művészek kreatív munkájához hivatkozási alapként vagy ihletforrásként szolgálnak. Rajzokat, festményeket, szobrokat készítő vagy fotóművészetet létrehozó művészek számára állnak modellt.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 76.3%-a jelölte

**Holland-kód:** ARE — R 67 · I 2 · A 98 · S 25 · E 45 · C 21

**HEXACO differenciál cél-profil:** E cél 31±18 (w=0.27) · X cél 67±19 (w=0.24) · C cél 36±21 (w=0.20) · H cél 38±22 (w=0.17)

**HEXACO abszolút szint:** H 27 · E 49 · X 49 · A 42 · C 17 · O 41

### Termékbemutató ügynökök

`41-9011.00` · **ISCO-08 5242** Termékbemutató ügynökök · **FEOR-08:** 5122 Áru- és divatbemutató · ESCO `5242.1` · EN: Demonstrators and Product Promoters · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* promóciószervező, promóciós szervező, promóter

A promóciószervezők proaktív módon keresnek új potenciális ügyfeleket, és kapcsolatot vesznek fel velük. Termékspecifikus tanácsadást nyújtanak, és promóciós árukat vagy szolgáltatásokat mutatnak be.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 64.3%-a jelölte

**Holland-kód:** ECA — R 37 · I 15 · A 38 · S 38 · E 73 · C 43

**HEXACO differenciál cél-profil:** X cél 73±15 (w=0.40) · H cél 39±22 (w=0.20) · C cél 41±24 (w=0.15) · A cél 57±25 (w=0.12)

**HEXACO abszolút szint:** H 39 · E 49 · X 63 · A 53 · C 35 · O 47

### Büfések

`35-3041.00` · **ISCO-08 5246** Büfések · **FEOR-08:** 5131 Vendéglős · ESCO `5246.1` · EN: Food Servers, Nonrestaurant · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* légitársasági ételkészítő, ételkészítő

A légitársasági ételkészítők ételeket készítenek, és azokat felszolgálják az ügyfeleknek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 48.1%-a jelölte

**Holland-kód:** RSC — R 64 · I 8 · A 18 · S 54 · E 31 · C 48

**HEXACO differenciál cél-profil:** O cél 36±21 (w=0.28) · H cél 63±21 (w=0.26) · A cél 61±22 (w=0.23) · C cél 43±25 (w=0.15)

**HEXACO abszolút szint:** H 54 · E 55 · X 46 · A 53 · C 38 · O 36

### Kisegítő gondozó személyzet

`31-1133.00` · **ISCO-08 5321** Kisegítő gondozó személyzet · **FEOR-08:** 5222 Segédápoló, műtőssegéd · ESCO `5321.1` · EN: Psychiatric Aides · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* ápolási asszisztens, gerontológiai gondozó

Az ápolási asszisztensek az ápolók munkáját segítik, és részt vesznek az életkortól független gondozásban, ápolásban és ellátásban, emellett különféle akut kórházi kezeléseknél és az alapszintű egészségügyi ellátásban nyújtanak segítséget.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: megkezdett felsőfokú tanulmányok · a válaszadók 45.7%-a jelölte

**Holland-kód:** SIC — R 41 · I 51 · A 14 · S 97 · E 11 · C 46

**HEXACO differenciál cél-profil:** A cél 69±17 (w=0.28) · H cél 65±20 (w=0.22) · O cél 36±21 (w=0.20) · C cél 38±22 (w=0.18)

**HEXACO abszolút szint:** H 68 · E 42 · X 54 · A 70 · C 49 · O 45

### Máshová nem sorolható személygondozási foglalkozásúak (egészségügyben)

`29-2099.08` · **ISCO-08 5329** Máshová nem sorolható személygondozási foglalkozásúak (egészségügyben) · **FEOR-08:** 5229 Egyéb személygondozási foglalkozású · ESCO `5329` · EN: Patient Representatives · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Assist patients in obtaining services, understanding policies and making health care decisions.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 26.6%-a jelölte

**Holland-kód:** SIC — R 4 · I 51 · A 10 · S 94 · E 35 · C 47

**HEXACO differenciál cél-profil:** C cél 38±22 (w=0.27) · H cél 60±23 (w=0.23) · A cél 60±23 (w=0.22) · O cél 43±26 (w=0.14)

**HEXACO abszolút szint:** H 68 · E 44 · X 61 · A 66 · C 52 · O 52

### Máshová nem sorolható személygondozási foglalkozásúak (egészségügyben)

`31-1132.00` · **ISCO-08 5329** Máshová nem sorolható személygondozási foglalkozásúak (egészségügyben) · **FEOR-08:** 5229 Egyéb személygondozási foglalkozású · ESCO `5329.1` · EN: Orderlies · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* betegszállító

A betegszállítók olyan hivatásos ápolási asszisztensek, akik a kórház területén belül hordágyon szállítják a betegeket, illetve eszközöket szállítanak egyik helyről a másikra.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 89.3%-a jelölte

**Holland-kód:** RCS — R 74 · I 18 · A 0 · S 53 · E 3 · C 64

**HEXACO differenciál cél-profil:** O cél 33±19 (w=0.29) · H cél 65±20 (w=0.25) · A cél 63±21 (w=0.23) · C cél 44±26 (w=0.10)

**HEXACO abszolút szint:** H 57 · E 54 · X 45 · A 55 · C 42 · O 35

### Máshová nem sorolható személygondozási foglalkozásúak (egészségügyben)

`31-2022.00` · **ISCO-08 5329** Máshová nem sorolható személygondozási foglalkozásúak (egészségügyben) · **FEOR-08:** 5229 Egyéb személygondozási foglalkozású · ESCO `5329` · EN: Physical Therapist Aides · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Under close supervision of a physical therapist or physical therapy assistant, perform only delegated, selected, or routine tasks in specific situations. These duties include preparing the patient and the treatment area.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 34.4%-a jelölte

**Holland-kód:** SRC — R 62 · I 26 · A 1 · S 82 · E 18 · C 49

**HEXACO differenciál cél-profil:** H cél 66±20 (w=0.24) · O cél 34±20 (w=0.24) · A cél 64±20 (w=0.22) · C cél 42±24 (w=0.13)

**HEXACO abszolút szint:** H 60 · E 56 · X 48 · A 58 · C 43 · O 38

### Máshová nem sorolható személygondozási foglalkozásúak (egészségügyben)

`31-9093.00` · **ISCO-08 5329** Máshová nem sorolható személygondozási foglalkozásúak (egészségügyben) · **FEOR-08:** 5229 Egyéb személygondozási foglalkozású · ESCO `5329.3` · EN: Medical Equipment Preparers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* fertőtlenítő sterilező, eszközfertőtlenítő technikus

A fertőtlenítő sterilezők gondoskodnak az orvostechnikai eszközök szigorú higiéniai eljárásoknak megfelelő fertőtlenítéséről.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 43.8%-a jelölte

**Holland-kód:** RCI — R 96 · I 40 · A 0 · S 23 · E 0 · C 76

**HEXACO differenciál cél-profil:** X cél 40±23 (w=0.24) · O cél 40±24 (w=0.23) · H cél 59±24 (w=0.22) · C cél 56±26 (w=0.14)

**HEXACO abszolút szint:** H 50 · E 57 · X 38 · A 47 · C 50 · O 39

### Tűzoltók

`33-1021.00` · **ISCO-08 5411** Tűzoltók · **FEOR-08:** 5252 Tűzoltó · ESCO `5411.1` · EN: First-Line Supervisors of Firefighting and Prevention Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* tűzoltó, tűzoltósági referens, tűzoltó technikus

Tűz vagy más vészhelyzet esetén a tűzoltók feladata a katasztrófa elhárítása. A tűzoltók felügyelik a veszélyes helyszínek evakuálását, elvégik az áldozatok mentését, és gondoskodnak róla, hogy megfelelő, szakszerű ellátásban részesüljenek.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 29.2%-a jelölte

**Holland-kód:** ERC — R 69 · I 21 · A 0 · S 45 · E 86 · C 61

**HEXACO differenciál cél-profil:** X cél 62±22 (w=0.22) · E cél 38±22 (w=0.21) · A cél 61±23 (w=0.20) · H cél 40±24 (w=0.17)

**HEXACO abszolút szint:** H 57 · E 32 · X 69 · A 69 · C 61 · O 54

### javítóintézeti felügyelő

`33-3012.00` · **ISCO-08 5413** Börtönőrök · **FEOR-08:** 5253 Büntetés-végrehajtási őr · ESCO `5413.1` · EN: Correctional Officers and Jailers

*Piaci megnevezések (ESCO):* rabőr, körletfelügyelő, büntetés-véghajtási őr, rabkísérő

A javítóintézeti felügyelők gondoskodnak a fiatalkorú elkövetők biztonságáról, és felügyelik tevékenységeiket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 92.4%-a jelölte

**Holland-kód:** RCS — R 72 · I 12 · A 1 · S 48 · E 36 · C 64

**HEXACO differenciál cél-profil:** O cél 28±15 (w=0.48) · E cél 37±21 (w=0.29) · C cél 56±26 (w=0.12)

**HEXACO abszolút szint:** H 49 · E 42 · X 48 · A 48 · C 54 · O 33

### Biztonsági őrök

`33-9099.02` · **ISCO-08 5414** Biztonsági őrök · **FEOR-08:** 5254 Vagyonőr, testőr; 9231 Portás, telepőr, egyszerű őr · ESCO `5414.1` · EN: Retail Loss Prevention Specialists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* biztonsági őr, parkőr, őr

A biztonsági őrök megfigyelik és felderítik a szabálytalanságokat, és védik az embereket, az épületeket és tárgyi eszközöket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 68.6%-a jelölte

**Holland-kód:** CER — R 48 · I 41 · A 0 · S 28 · E 63 · C 78

**HEXACO differenciál cél-profil:** C cél 62±22 (w=0.28) · E cél 41±24 (w=0.22) · H cél 42±25 (w=0.18) · A cél 44±26 (w=0.13)

**HEXACO abszolút szint:** H 45 · E 44 · X 52 · A 47 · C 60 · O 48

### Máshová nem sorolható védelmi foglalkozások

`33-3041.00` · **ISCO-08 5419** Máshová nem sorolható védelmi foglalkozások · **FEOR-08:** 5255 Természetvédelmi őr; 5256 Közterület-felügyelő; 5259 Egyéb személy- és vagyonvédelmi foglalkozású 7. · ESCO `5419.2` · EN: Parking Enforcement Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* parkolóőr, közlekedési rendőr, közterület-felügyelő, gyalogátkelőhelyi forgalomirányító, katasztrófaelhárító munkás, katasztrófavédelmi munkatárs

A parkolóőrök feladata, hogy betartassák az utcai parkolási korlátozásokat, biztosítsák a forgalom szabad áramlását és a gyalogosok biztonságát, valamint gondoskodjanak a közlekedési és parkolási szabályok betartásáról.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 90.6%-a jelölte

**Holland-kód:** RCE — R 90 · I 7 · A 0 · S 27 · E 38 · C 68

**HEXACO differenciál cél-profil:** O cél 39±22 (w=0.36) · E cél 41±24 (w=0.28) · X cél 54±27 (w=0.14)

**HEXACO abszolút szint:** H 39 · E 53 · X 43 · A 38 · C 38 · O 34

### Máshová nem sorolható védelmi foglalkozások

`33-9092.00` · **ISCO-08 5419** Máshová nem sorolható védelmi foglalkozások · **FEOR-08:** 5255 Természetvédelmi őr; 5256 Közterület-felügyelő; 5259 Egyéb személy- és vagyonvédelmi foglalkozású 7. · ESCO `5419` · EN: Lifeguards, Ski Patrol, and Other Recreational Protective Service Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* parti őr, vízimentő, uszodamester, strandőr, polgárőr

_(HU leírás nincs; EN:)_ Monitor recreational areas, such as pools, beaches, or ski slopes, to provide assistance and protection to participants.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 39.2%-a jelölte

**Holland-kód:** RSC — R 88 · I 23 · A 0 · S 54 · E 31 · C 41

**HEXACO differenciál cél-profil:** O cél 35±20 (w=0.30) · A cél 65±20 (w=0.30) · E cél 43±25 (w=0.15) · C cél 44±26 (w=0.12)

**HEXACO abszolút szint:** H 59 · E 40 · X 57 · A 65 · C 52 · O 43

### gyalogátkelőhelyi forgalomirányító

`33-9091.00` · **ISCO-08 5419** Máshová nem sorolható védelmi foglalkozások · **FEOR-08:** 5255 Természetvédelmi őr; 5256 Közterület-felügyelő; 5259 Egyéb személy- és vagyonvédelmi foglalkozású 7. · ESCO `5419.4` · EN: Crossing Guards and Flaggers

A gyalogátkelőhelyi forgalomirányítók feladata, hogy a forgalom megfigyelésével és a járművek táblával történő megállításával irányítsák a gyalogosforgalmat nyilvános helyeken, többek között iskolák vagy vasút közelében található közutakon vagy közúti csomópontokon való biztonságos és szabályos átkelés biztosítása céljából.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 72.8%-a jelölte

**Holland-kód:** RCS — R 81 · I 11 · A 2 · S 35 · E 33 · C 44

**HEXACO differenciál cél-profil:** O cél 29±16 (w=0.40) · H cél 59±24 (w=0.18) · A cél 58±25 (w=0.14) · C cél 44±26 (w=0.12)

**HEXACO abszolút szint:** H 53 · E 53 · X 52 · A 53 · C 44 · O 33


## 6 — Mezőgazdasági és erdőgazdálkodási foglalkozások

### Kertészek, kertészeti és faiskolai kertészek

`37-3013.00` · **ISCO-08 6113** Kertészek, kertészeti és faiskolai kertészek · **FEOR-08:** 6113 Zöldségtermesztő; 6115 Dísznövény-, virág- és faiskolai kertész, csemetenevelő · ESCO `6113.6` · EN: Tree Trimmers and Pruners · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* tájkertész, tájkertészek, kertgondnokok

A tájkertészek feladata a parkok, kertek és zöld közterületek megtervezése, megépítése, felújítása és karbantartása.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 56.8%-a jelölte

**Holland-kód:** RCI — R 100 · I 19 · A 0 · S 13 · E 4 · C 35

**HEXACO differenciál cél-profil:** H cél 40±23 (w=0.29) · E cél 41±24 (w=0.26) · C cél 57±26 (w=0.20) · O cél 44±26 (w=0.16)

**HEXACO abszolút szint:** H 38 · E 47 · X 47 · A 45 · C 49 · O 43

### szarvasmarha-tenyésztő

`45-2021.00` · **ISCO-08 6121** Haszonállat-tenyésztők (kivéve a baromfitenyésztőket) 6121 Szarvasmarha-, ló-, sertés-, juhtartó és -tenyésztő és tejtermelők · **FEOR-08:** — · ESCO `6121.1` · EN: Animal Breeders

*Piaci megnevezések (ESCO):* szarvasmarhatenyésztő-szaktechnikus, szarvasmarha-tenyésztő szakmérnök, lótenyésztő, lótenyésztők, állattenyésztő, sertéstenyésztő

A szarvasmarha-tenyésztők feladata a termelési folyamatok felügyelete, és a szarvasmarhák napi szintű gondozása. Gondoskodnak a szarvasmarhák egészségéről és jólétéről.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 85.7%-a jelölte

**Holland-kód:** RCI — R 89 · I 40 · A 8 · S 23 · E 17 · C 43

**HEXACO differenciál cél-profil:** A cél 44±26 (w=0.32) · C cél 55±27 (w=0.29) · X cél 46±28 (w=0.20)

**HEXACO abszolút szint:** H 47 · E 54 · X 44 · A 43 · C 49 · O 48

### Halgazdálkodók

`45-2093.00` · **ISCO-08 6221** Halgazdálkodók · **FEOR-08:** 6230 Halászati foglalkozású · ESCO `6221.5` · EN: Farmworkers, Farm, Ranch, and Aquacultural Animals · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* keltetési akvakultúra-dolgozó, halkeltetési dolgozó, halkeltetési munkás, tenyésztési akvakultúra-munkás, haltermelő telep haltenyésztési munkása, haltenyésztési dolgozó

A keltetési akvakultúra-dolgozók a vízi szervezetek földi keltetési folyamatokkal történő termelésében vesznek részt. Közreműködnek az élőlények nevelésében az életciklusuk korai szakaszában, és szükség esetén az vízi élőlényke kiengedésében.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: megkezdett felsőfokú tanulmányok · a válaszadók 39.4%-a jelölte

**Holland-kód:** RCI — R 96 · I 28 · A 7 · S 25 · E 15 · C 32

**HEXACO differenciál cél-profil:** E cél 42±25 (w=0.29) · H cél 56±26 (w=0.22) · O cél 44±26 (w=0.20) · X cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 48 · E 49 · X 42 · A 43 · C 43 · O 41


## 7 — Ipari és építőipari foglalkozások

### Falazókőművesek és hasonló foglalkozásúak

`47-3011.00` · **ISCO-08 7112** Falazókőművesek és hasonló foglalkozásúak · **FEOR-08:** 7511 Kőműves; 7537 Kályha- és kandallóépítő · ESCO `7112.1` · EN: Helpers--Brickmasons, Blockmasons, Stonemasons, and Tile and Marble Setters · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* épületfalazó kőműves, falazó kőműves, kőműves

Az épületfalazó kőművesek a téglafalakat és az építményeket úgy állítják össze, hogy a téglákat egy adott mintázatban rendezik el, és kötőanyaggal, például cementtel ragasztják össze.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 58.0%-a jelölte

**Holland-kód:** RCS — R 100 · I 6 · A 10 · S 15 · E 0 · C 39

**HEXACO differenciál cél-profil:** O cél 41±24 (w=0.25) · X cél 41±24 (w=0.24) · H cél 58±25 (w=0.21) · A cél 57±26 (w=0.18)

**HEXACO abszolút szint:** H 43 · E 60 · X 33 · A 42 · C 37 · O 34

### Kőfaragók, -vágók és -törők

`51-9195.03` · **ISCO-08 7113** Kőfaragók, -vágók és -törők · **FEOR-08:** 7536 Kőfaragó, műköves · ESCO `7113` · EN: Stone Cutters and Carvers, Manufacturing · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* épületszobrász, sírkőkészítő, emlékműkészítő

_(HU leírás nincs; EN:)_ Cut or carve stone according to diagrams and patterns.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 65.5%-a jelölte

**Holland-kód:** RAC — R 100 · I 15 · A 47 · S 4 · E 0 · C 46

**HEXACO differenciál cél-profil:** C cél 62±22 (w=0.32) · A cél 40±23 (w=0.28) · X cél 44±26 (w=0.15) · O cél 45±27 (w=0.12)

**HEXACO abszolút szint:** H 33 · E 63 · X 34 · A 30 · C 44 · O 37

### betonozó

`47-2053.00` · **ISCO-08 7114** Betonozók, vasbetonszerelők és hasonló foglalkozásúak 7515 Építményszerkezet-szerelő · **FEOR-08:** — · ESCO `7114.1` · EN: Terrazzo Workers and Finishers

*Piaci megnevezések (ESCO):* beton-összeillesztő kőműves, terrazzo-készítő, hidegburkoló, műkövező

A betonozók például cementből és betonból készült kötőanyagokkal dolgoznak. A betont eltávolítható formába öntik.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 69.9%-a jelölte

**Holland-kód:** RCA — R 100 · I 13 · A 16 · S 0 · E 0 · C 38

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.34) · A cél 46±27 (w=0.18) · H cél 46±27 (w=0.18) · O cél 46±28 (w=0.16)

**HEXACO abszolút szint:** H 32 · E 61 · X 36 · A 34 · C 39 · O 37

### Ácsok és asztalosok

`49-9095.00` · **ISCO-08 7115** Ácsok és asztalosok · **FEOR-08:** 7513 Ács; 7514 Épületasztalos · ESCO `7115.2` · EN: Manufactured Building and Mobile Home Installers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* ajtóbeépítő, épületasztalos, nyílászáró-beépítő, ablakszerelő, lépcsőszerelő, építményszerkezet-szerelő

Az ajtóbeépítők a helyükre teszik és rögzítik az ajtókat.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 59.2%-a jelölte

**Holland-kód:** RCI — R 97 · I 15 · A 9 · S 12 · E 3 · C 48

**HEXACO differenciál cél-profil:** C cél 54±27 (w=0.33) · O cél 47±28 (w=0.24) · E cél 47±28 (w=0.22) · X cél 49±29 (w=0.12)

**HEXACO abszolút szint:** H 40 · E 56 · X 41 · A 40 · C 42 · O 41

### ács

`47-3012.00` · **ISCO-08 7115** Ácsok és asztalosok · **FEOR-08:** 7513 Ács; 7514 Épületasztalos · ESCO `7115.1` · EN: Helpers--Carpenters

*Piaci megnevezések (ESCO):* asztalos

Az ácsok feldarabolják, formára vágják és összeszerelik az épületek és egyéb építmények építésére szolgáló faelemeket. Műanyagot és fémet is felhasználnak építményeikhez.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 53.6%-a jelölte

**Holland-kód:** RCS — R 98 · I 5 · A 7 · S 19 · E 10 · C 41

**HEXACO differenciál cél-profil:** O cél 41±24 (w=0.29) · H cél 57±25 (w=0.23) · A cél 56±26 (w=0.18) · X cél 44±26 (w=0.17)

**HEXACO abszolút szint:** H 42 · E 61 · X 35 · A 41 · C 36 · O 34

### tetőfedő

`47-3016.00` · **ISCO-08 7121** Tetőfedők · **FEOR-08:** 7532 Tetőfedő · ESCO `7121.1` · EN: Helpers--Roofers

*Piaci megnevezések (ESCO):* tetőkátrányozó, hullámlemeztető-fedő

A tetőfedők cseréppel fedik be a tetőszerkezeteket. Lapos vagy ferde súlytartó tetőelemeket építenek be, amelyeket időjárásálló réteggel fednek le.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 43.4%-a jelölte

**Holland-kód:** RCS — R 99 · I 0 · A 0 · S 16 · E 7 · C 44

**HEXACO differenciál cél-profil:** O cél 41±24 (w=0.34) · H cél 55±27 (w=0.19) · X cél 45±27 (w=0.18) · C cél 53±28 (w=0.13)

**HEXACO abszolút szint:** H 40 · E 58 · X 36 · A 39 · C 36 · O 34

### Burkolók

`47-2042.00` · **ISCO-08 7122** Burkolók · **FEOR-08:** 7534 Burkoló · ESCO `7122.2` · EN: Floor Layers, Except Carpet, Wood, and Hard Tiles · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* fapadló- és parkettarakó, melegburkoló, fapadlórakó, fapadló- és műanyagburkoló, lamináltpadló-fektető, padlószőnyeg-fektető

A fapadló- és parkettarakók tömör fából készült padlókat raknak le. Előkészítik a felületet, méretre vágják a parketta- vagy deszkaelemeket, és előre meghatározott mintázatban egyenletesen és szintezve fektetik le őket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 89.5%-a jelölte

**Holland-kód:** RCA — R 100 · I 6 · A 14 · S 9 · E 0 · C 45

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.36) · O cél 45±27 (w=0.20) · A cél 45±27 (w=0.20) · X cél 46±27 (w=0.17)

**HEXACO abszolút szint:** H 35 · E 62 · X 35 · A 34 · C 39 · O 37

### Burkolók

`47-2043.00` · **ISCO-08 7122** Burkolók · **FEOR-08:** 7534 Burkoló · ESCO `7122.2` · EN: Floor Sanders and Finishers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* fapadló- és parkettarakó, melegburkoló, fapadlórakó, fapadló- és műanyagburkoló, lamináltpadló-fektető, padlószőnyeg-fektető

A fapadló- és parkettarakók tömör fából készült padlókat raknak le. Előkészítik a felületet, méretre vágják a parketta- vagy deszkaelemeket, és előre meghatározott mintázatban egyenletesen és szintezve fektetik le őket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 46.6%-a jelölte

**Holland-kód:** RCE — R 100 · I 6 · A 6 · S 7 · E 9 · C 39

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.33) · A cél 42±25 (w=0.28) · O cél 45±27 (w=0.18) · X cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 32 · E 63 · X 34 · A 30 · C 38 · O 35

### padlószőnyeg-fektető

`47-2041.00` · **ISCO-08 7122** Burkolók · **FEOR-08:** 7534 Burkoló · ESCO `7122.1` · EN: Carpet Installers

*Piaci megnevezések (ESCO):* szőnyegpadló-burkoló, fapadló- és parkettarakó, melegburkoló, fapadlórakó, fapadló- és műanyagburkoló, lamináltpadló-fektető

A padlószőnyeg-fektetők szőnyegtekercseket fektetnek le a padlóra. A szőnyeget méretre vágják, előkészítik a felületet, és a szőnyeget a helyére teszik.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 69.2%-a jelölte

**Holland-kód:** RCA — R 100 · I 2 · A 16 · S 5 · E 0 · C 42

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.42) · O cél 44±26 (w=0.32) · A cél 47±28 (w=0.16)

**HEXACO abszolút szint:** H 35 · E 60 · X 37 · A 35 · C 38 · O 36

### Stukkó készítők (épületszobrászok)

`47-3014.00` · **ISCO-08 7123** Stukkó készítők (épületszobrászok) · **FEOR-08:** 7512 Gipszkartonozó, stukkózó · ESCO `7123.2` · EN: Helpers--Painters, Paperhangers, Plasterers, and Stucco Masons · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* vakoló kőműves, vakoló, vakoló munkás

A vakoló kőművesek gipszből, cementből vagy más oldott építőanyagokból készült vakolatot hordanak fel sima felületként a falra. A száraz vakolatot vízzel összekeverik, majd a masszát felhordják.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 68.2%-a jelölte

**Holland-kód:** RCS — R 92 · I 2 · A 13 · S 24 · E 6 · C 41

**HEXACO differenciál cél-profil:** H cél 61±23 (w=0.31) · O cél 42±25 (w=0.23) · A cél 57±26 (w=0.19) · X cél 45±26 (w=0.15)

**HEXACO abszolút szint:** H 43 · E 63 · X 34 · A 40 · C 30 · O 34

### vakoló kőműves

`47-2161.00` · **ISCO-08 7123** Stukkó készítők (épületszobrászok) · **FEOR-08:** 7512 Gipszkartonozó, stukkózó · ESCO `7123.2` · EN: Plasterers and Stucco Masons

*Piaci megnevezések (ESCO):* vakoló, vakoló munkás

A vakoló kőművesek gipszből, cementből vagy más oldott építőanyagokból készült vakolatot hordanak fel sima felületként a falra. A száraz vakolatot vízzel összekeverik, majd a masszát felhordják.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 68.0%-a jelölte

**Holland-kód:** RCA — R 100 · I 9 · A 26 · S 6 · E 1 · C 38

**HEXACO differenciál cél-profil:** C cél 57±25 (w=0.36) · O cél 44±26 (w=0.28) · A cél 47±28 (w=0.15) · H cél 48±28 (w=0.12)

**HEXACO abszolút szint:** H 36 · E 59 · X 38 · A 37 · C 40 · O 37

### Szigetelők

`47-2131.00` · **ISCO-08 7124** Szigetelők · **FEOR-08:** 7531 Szigetelő · ESCO `7124.1` · EN: Insulation Workers, Floor, Ceiling, and Wall · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szigetelő, ipari szigetelő, tetőszigetelő

A szigetelő munkások különféle szigetelőanyagokat építenek be, hogy megóvják a szerkezetet vagy anyagokat a hőtől, a hidegtől és a környezeti zajtól.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 68.2%-a jelölte

**Holland-kód:** RCI — R 96 · I 13 · A 5 · S 1 · E 0 · C 50

**HEXACO differenciál cél-profil:** O cél 43±25 (w=0.32) · C cél 57±26 (w=0.30) · X cél 46±27 (w=0.17) · A cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 36 · E 60 · X 35 · A 35 · C 39 · O 35

### szigetelő

`47-2132.00` · **ISCO-08 7124** Szigetelők · **FEOR-08:** 7531 Szigetelő · ESCO `7124.1` · EN: Insulation Workers, Mechanical

*Piaci megnevezések (ESCO):* ipari szigetelő, tetőszigetelő

A szigetelő munkások különféle szigetelőanyagokat építenek be, hogy megóvják a szerkezetet vagy anyagokat a hőtől, a hidegtől és a környezeti zajtól.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 71.7%-a jelölte

**Holland-kód:** RCI — R 99 · I 24 · A 0 · S 4 · E 0 · C 54

**HEXACO differenciál cél-profil:** C cél 56±26 (w=0.39) · O cél 46±27 (w=0.25) · X cél 48±28 (w=0.15) · A cél 48±29 (w=0.12)

**HEXACO abszolút szint:** H 35 · E 60 · X 37 · A 36 · C 39 · O 38

### épületüvegező

`49-3022.00` · **ISCO-08 7125** Üvegesek · **FEOR-08:** 7538 Üvegező · ESCO `7125.1` · EN: Automotive Glass Installers and Repairers

*Piaci megnevezések (ESCO):* tetőszerkezet-üvegező, üvegburkolat-készítő, autóüvegező, szélvédő-javító, autóüveges

Az épületüvegezők beépítik az üvegtáblákat az ablakokba és más szerkezeti elemekbe, például üvegajtókba, falakba, homlokzatokba stb.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 89.5%-a jelölte

**Holland-kód:** RCI — R 100 · I 21 · A 0 · S 5 · E 6 · C 45

**HEXACO differenciál cél-profil:** A cél 42±25 (w=0.29) · C cél 57±26 (w=0.25) · O cél 44±26 (w=0.21) · X cél 46±28 (w=0.13)

**HEXACO abszolút szint:** H 39 · E 58 · X 37 · A 34 · C 42 · O 38

### Víz-, gáz- és csővezeték-szerelők

`47-2151.00` · **ISCO-08 7126** Víz-, gáz- és csővezeték-szerelők · **FEOR-08:** 7521 Vezeték- és csőhálózat-szerelő (víz, gáz, fűtés) · ESCO `7126.11` · EN: Pipelayers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* csatornafektető, csatornaépítő munkás, csőfektető

A csatornafektetők csatornacsöveket telepítenek a szennyvíz építményekből víztestbe vagy kezelőberendezésbe történő elvezetéséhez.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 65.4%-a jelölte

**Holland-kód:** RCI — R 100 · I 24 · A 0 · S 5 · E 2 · C 42

**HEXACO differenciál cél-profil:** O cél 41±24 (w=0.45) · C cél 57±25 (w=0.38)

**HEXACO abszolút szint:** H 37 · E 58 · X 40 · A 40 · C 42 · O 36

### Víz-, gáz- és csővezeték-szerelők

`47-3015.00` · **ISCO-08 7126** Víz-, gáz- és csővezeték-szerelők · **FEOR-08:** 7521 Vezeték- és csőhálózat-szerelő (víz, gáz, fűtés) · ESCO `7126.8` · EN: Helpers--Pipelayers, Plumbers, Pipefitters, and Steamfitters · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* víz- és gázvezeték-szerelő, vízvezeték-szerelő, vezeték- és csőhálózat-szerelő, gázvezeték-szerelő, olajvezeték-karbantartó

A víz- és gázvezeték-szerelők a víz-, gáz- és szennyvízelvezető rendszerek karbantartását és üzembe helyezését végzik. Rendszeresen átvizsgálják a csöveket és tartozékokat, amelyeket szükség szerint megjavítanak.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 48.7%-a jelölte

**Holland-kód:** RCS — R 99 · I 6 · A 0 · S 14 · E 4 · C 44

**HEXACO differenciál cél-profil:** O cél 43±25 (w=0.24) · A cél 57±25 (w=0.23) · X cél 43±26 (w=0.23) · H cél 55±26 (w=0.17)

**HEXACO abszolút szint:** H 42 · E 58 · X 36 · A 43 · C 38 · O 37

### szennyvíztároló-karbantartó

`47-4071.00` · **ISCO-08 7126** Víz-, gáz- és csővezeték-szerelők · **FEOR-08:** 7521 Vezeték- és csőhálózat-szerelő (víz, gáz, fűtés) · ESCO `7126.9` · EN: Septic Tank Servicers and Sewer Pipe Cleaners

*Piaci megnevezések (ESCO):* szippantógép-kezelő, településtisztasági szippantógép-kezelő, csatornafektető, csatornaépítő munkás, csőfektető, szennyvízhálózat-karbantartó

A szennyvíztároló-karbantartók tisztítják és karbantartják a szennyvíztisztító rendszereket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 40.4%-a jelölte

**Holland-kód:** RCI — R 100 · I 18 · A 0 · S 8 · E 3 · C 54

**HEXACO differenciál cél-profil:** C cél 56±26 (w=0.26) · O cél 44±26 (w=0.26) · E cél 44±26 (w=0.25) · X cél 46±27 (w=0.17)

**HEXACO abszolút szint:** H 41 · E 53 · X 39 · A 40 · C 43 · O 38

### Festők és hasonló foglalkozásúak

`47-2142.00` · **ISCO-08 7131** Festők és hasonló foglalkozásúak · **FEOR-08:** 7535 Festő és mázoló · ESCO `7131.3` · EN: Paperhangers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Cover interior walls or ceilings of rooms with decorative wallpaper or fabric, or attach advertising posters on surfaces such as walls and billboards. May remove old materials or prepare surfaces to be papered.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 54.1%-a jelölte

**Holland-kód:** RCA — R 81 · I 0 · A 33 · S 10 · E 2 · C 48

**HEXACO differenciál cél-profil:** C cél 58±24 (w=0.34) · O cél 44±26 (w=0.24) · A cél 45±27 (w=0.18)

**HEXACO abszolút szint:** H 32 · E 64 · X 35 · A 32 · C 38 · O 34

### Fém öntőminta- és magkészítők

`51-4052.00` · **ISCO-08 7211** Fém öntőminta- és magkészítők · **FEOR-08:** 7310 Fémöntőminta-készítő · ESCO `7211` · EN: Pourers and Casters, Metal · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* öntő, folyamatos öntő, kokilla- és nyomásos öntő

_(HU leírás nincs; EN:)_ Operate hand-controlled mechanisms to pour and regulate the flow of molten metal into molds to produce castings or ingots.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 80.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 24 · A 2 · S 1 · E 0 · C 46

**HEXACO differenciál cél-profil:** O cél 40±23 (w=0.30) · C cél 60±24 (w=0.27) · X cél 42±25 (w=0.23) · E cél 45±27 (w=0.14)

**HEXACO abszolút szint:** H 34 · E 57 · X 33 · A 37 · C 42 · O 33

### Fém öntőminta- és magkészítők

`51-4071.00` · **ISCO-08 7211** Fém öntőminta- és magkészítők · **FEOR-08:** 7310 Fémöntőminta-készítő · ESCO `7211.1` · EN: Foundry Mold and Coremakers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* öntő, folyamatos öntő, kokilla- és nyomásos öntő

Az öntők öntödei kézi vezérlésű berendezések működtetésével öntvényeket, például csöveket, üreges profilokat és egyéb kohászati termékeket készítenek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 64.4%-a jelölte

**Holland-kód:** RCI — R 97 · I 21 · A 19 · S 1 · E 0 · C 42

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.29) · O cél 43±26 (w=0.24) · A cél 45±26 (w=0.20) · X cél 46±28 (w=0.14)

**HEXACO abszolút szint:** H 31 · E 62 · X 33 · A 32 · C 37 · O 33

### Fémlemez-megmunkálók

`51-4192.00` · **ISCO-08 7213** Fémlemez-megmunkálók · **FEOR-08:** 7533 Épület-, építménybádogos · ESCO `7213` · EN: Layout Workers, Metal and Plastic · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Lay out reference points and dimensions on metal or plastic stock or workpieces, such as sheets, plates, tubes, structural shapes, castings, or machine parts, for further processing.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 60.0%-a jelölte

**Holland-kód:** RCA — R 91 · I 30 · A 31 · S 0 · E 0 · C 48

**HEXACO differenciál cél-profil:** C cél 60±24 (w=0.30) · A cél 41±24 (w=0.28) · H cél 45±26 (w=0.17) · X cél 45±27 (w=0.16)

**HEXACO abszolút szint:** H 35 · E 60 · X 37 · A 34 · C 45 · O 43

### kazánkészítő

`47-2011.00` · **ISCO-08 7213** Fémlemez-megmunkálók · **FEOR-08:** 7533 Épület-, építménybádogos · ESCO `7213.1` · EN: Boilermakers

*Piaci megnevezések (ESCO):* kazánkovács, tartály-összeszerelő, gyártósori tartály-összeszerelő, gyártósori tartályszerelő, lemezlakatos, vas- és fémszerkezeti lakatos

A kazánkészítők különféle berendezéseket és gépeket használnak meleg vizes és gőzkazánok előállításához, újravezetékezéséhez és újracsövezéséhez, a gyártási folyamat minden szakaszát érintve.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 52.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 22 · A 0 · S 0 · E 0 · C 45

**HEXACO differenciál cél-profil:** C cél 62±22 (w=0.38) · X cél 43±26 (w=0.20) · O cél 44±26 (w=0.17) · H cél 47±28 (w=0.10)

**HEXACO abszolút szint:** H 40 · E 54 · X 39 · A 41 · C 53 · O 41

### Fémszerkezet-készítők és -összeállítók

`47-2171.00` · **ISCO-08 7214** Fémszerkezet-készítők és -összeállítók · **FEOR-08:** 7321 Lakatos · ESCO `7214.3` · EN: Reinforcing Iron and Rebar Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* vas- és fémszerkezeti lakatos, vasszerkezeti lakatos

A vas- és fémszerkezeti lakatosok vaselemeket építenek be különféle felépítményekbe. Acélszerkezeteket készítenek épületekhez, hidakhoz és egyéb építési projektekhez, emellett fémrudak vagy betonacél rudak rögzítésével vasbetont készítenek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 36.6%-a jelölte

**Holland-kód:** RCI — R 100 · I 20 · A 2 · S 3 · E 6 · C 42

**HEXACO differenciál cél-profil:** O cél 40±24 (w=0.31) · C cél 59±24 (w=0.30) · X cél 46±27 (w=0.15) · E cél 46±27 (w=0.13)

**HEXACO abszolút szint:** H 36 · E 57 · X 35 · A 36 · C 42 · O 34

### Fémszerkezet-készítők és -összeállítók

`47-2221.00` · **ISCO-08 7214** Fémszerkezet-készítők és -összeállítók · **FEOR-08:** 7321 Lakatos · ESCO `7214.3` · EN: Structural Iron and Steel Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* vas- és fémszerkezeti lakatos, vasszerkezeti lakatos

A vas- és fémszerkezeti lakatosok vaselemeket építenek be különféle felépítményekbe. Acélszerkezeteket készítenek épületekhez, hidakhoz és egyéb építési projektekhez, emellett fémrudak vagy betonacél rudak rögzítésével vasbetont készítenek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 42.1%-a jelölte

**Holland-kód:** RCI — R 100 · I 30 · A 7 · S 3 · E 4 · C 46

**HEXACO differenciál cél-profil:** O cél 37±21 (w=0.34) · C cél 60±23 (w=0.26) · E cél 42±25 (w=0.20) · H cél 46±27 (w=0.11)

**HEXACO abszolút szint:** H 38 · E 51 · X 42 · A 41 · C 49 · O 35

### Fémszerkezet-készítők és -összeállítók

`49-9098.00` · **ISCO-08 7214** Fémszerkezet-készítők és -összeállítók · **FEOR-08:** 7321 Lakatos · ESCO `7214.1` · EN: Helpers--Installation, Maintenance, and Repair Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szétszerelő, bontómunkás, hajóépítő, tengeralattjáró-tervező, hajójavító, vas- és fémszerkezeti lakatos

A szétszerelők a csoportvezető utasításai szerint ipari berendezések, gépek és épületek szétszerelését végzik. A feladattól függően nehézgépeket és különböző szerszámgépeket használnak.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 31.7%-a jelölte

**Holland-kód:** RCI — R 100 · I 16 · A 2 · S 14 · E 10 · C 51

**HEXACO differenciál cél-profil:** A cél 59±24 (w=0.32) · H cél 57±26 (w=0.24) · X cél 44±26 (w=0.20) · O cél 45±27 (w=0.18)

**HEXACO abszolút szint:** H 46 · E 57 · X 39 · A 47 · C 39 · O 40

### darukötöző

`49-9096.00` · **ISCO-08 7215** Állványozók, rakományrögzítők és tartószerkezetek szerelői · **FEOR-08:** 7328 Fém- és egyéb tartószerkezet-szerelő · ESCO `7215.2` · EN: Riggers

*Piaci megnevezések (ESCO):* darukezelő, daruzó, rendezvénytechnikai tartószerkezet-szerelő, állványozó munkás, állványozó, fúrótorony-felügyelő

A darukötözők nehéz tárgyak emelésére szakosodtak, amit gyakran daru vagy árbócdaru segítségével végeznek. Darukezelőkkel együtt dolgozva rögzítik és leválasztják a daruról a rakományt.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 62.9%-a jelölte

**Holland-kód:** RCI — R 100 · I 23 · A 7 · S 0 · E 16 · C 44

**HEXACO differenciál cél-profil:** O cél 39±23 (w=0.41) · E cél 43±25 (w=0.27) · C cél 56±26 (w=0.23)

**HEXACO abszolút szint:** H 45 · E 48 · X 47 · A 46 · C 52 · O 40

### Szerszámkészítők és hasonló foglalkozásúak

`51-4061.00` · **ISCO-08 7222** Szerszámkészítők és hasonló foglalkozásúak · **FEOR-08:** 7321 Lakatos; 7322 Szerszámkészítő · ESCO `7222.1` · EN: Model Makers, Metal and Plastic · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* öntőminta-készítő, mintakészítő, kokillakészítő, szerszámkészítő, fémipari eszközgyártó, szerszámmegmunkáló

Az öntőminta-készítők az öntéssel elkészítendő késztermék fém, fa vagy műanyag modelljeit készítik el. A modelleket ezután öntőminták készítésére használják fel, amelyek végül a modellel megegyező alakú terméket eredményeznek.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 41.0%-a jelölte

**Holland-kód:** RCI — R 98 · I 32 · A 28 · S 1 · E 0 · C 50

**HEXACO differenciál cél-profil:** C cél 61±22 (w=0.29) · A cél 41±24 (w=0.24) · H cél 41±24 (w=0.24) · X cél 46±27 (w=0.12)

**HEXACO abszolút szint:** H 35 · E 56 · X 40 · A 36 · C 50 · O 48

### Szerszámkészítők és hasonló foglalkozásúak

`51-7032.00` · **ISCO-08 7222** Szerszámkészítők és hasonló foglalkozásúak · **FEOR-08:** 7321 Lakatos; 7322 Szerszámkészítő · ESCO `7222.1` · EN: Patternmakers, Wood · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* öntőminta-készítő, mintakészítő, kokillakészítő

Az öntőminta-készítők az öntéssel elkészítendő késztermék fém, fa vagy műanyag modelljeit készítik el. A modelleket ezután öntőminták készítésére használják fel, amelyek végül a modellel megegyező alakú terméket eredményeznek.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 57.2%-a jelölte

**Holland-kód:** RAC — R 93 · I 18 · A 51 · S 5 · E 4 · C 51

**HEXACO differenciál cél-profil:** A cél 37±21 (w=0.33) · C cél 61±23 (w=0.27) · H cél 45±27 (w=0.13) · E cél 55±27 (w=0.12)

**HEXACO abszolút szint:** H 34 · E 62 · X 37 · A 31 · C 46 · O 44

### Fémcsiszolók, köszörűsök és szerszámköszörűsök

`51-9022.00` · **ISCO-08 7224** Fémcsiszolók, köszörűsök és szerszámköszörűsök · **FEOR-08:** 7324 Fémcsiszoló, köszörűs, szerszámköszörűs · ESCO `7224.1` · EN: Grinding and Polishing Workers, Hand · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* fémcsiszoló, fémfelület-kezelő, szerszámköszörűs, köszörűs, köszörűgép-beállító és kezelő

A fémcsiszolók fémmegmunkáló berendezéseket és gépeket használnak a majdnem kész fémdarabok csiszolására annak érdekében, hogy simábbá és tetszetősebbé tegyék őket, valamint hogy eltávolítsák az oxidálódott részeket, megtisztítva a fémet a többi megmunkálási folyamat után.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 37.3%-a jelölte

**Holland-kód:** RCA — R 100 · I 8 · A 17 · S 1 · E 0 · C 38

**HEXACO differenciál cél-profil:** C cél 60±24 (w=0.33) · A cél 43±26 (w=0.23) · O cél 44±26 (w=0.23) · X cél 46±28 (w=0.13)

**HEXACO abszolút szint:** H 34 · E 64 · X 34 · A 31 · C 38 · O 34

### szerszámköszörűs

`51-4194.00` · **ISCO-08 7224** Fémcsiszolók, köszörűsök és szerszámköszörűsök · **FEOR-08:** 7324 Fémcsiszoló, köszörűs, szerszámköszörűs · ESCO `7224.2` · EN: Tool Grinders, Filers, and Sharpeners

*Piaci megnevezések (ESCO):* köszörűs, köszörűgép-beállító és kezelő

A szerszámköszörűsök precíziós csiszolási eljárásokat végeznek fémtárgyakon és fémszerszámokon. A megfelelő szerszámok és műszerek segítségével lecsiszolják, élesítik vagy elsimítják a fémfelületeket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 45.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 17 · A 4 · S 0 · E 0 · C 52

**HEXACO differenciál cél-profil:** C cél 61±22 (w=0.33) · A cél 41±24 (w=0.27) · X cél 44±26 (w=0.17) · O cél 46±27 (w=0.12)

**HEXACO abszolút szint:** H 33 · E 60 · X 35 · A 32 · C 44 · O 38

### Gépjárműszerelők és -karbantartók

`49-3052.00` · **ISCO-08 7231** Gépjárműszerelők és -karbantartók · **FEOR-08:** 7331 Gépjármű- és motorkarbantartó, -javító · ESCO `7231` · EN: Motorcycle Mechanics · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gépjármű-karbantartó és -javító, autóbusz-szerelő, kamionszerelő

_(HU leírás nincs; EN:)_ Diagnose, adjust, repair, or overhaul motorcycles, scooters, mopeds, dirt bikes, or similar motorized vehicles.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 59.6%-a jelölte

**Holland-kód:** RCI — R 100 · I 35 · A 4 · S 7 · E 0 · C 44

**HEXACO differenciál cél-profil:** C cél 56±26 (w=0.24) · A cél 44±26 (w=0.23) · X cél 46±27 (w=0.18) · H cél 46±28 (w=0.15)

**HEXACO abszolút szint:** H 40 · E 54 · X 41 · A 40 · C 46 · O 47

### Légijármű szerelők és -karbantartók

`53-6032.00` · **ISCO-08 7232** Légijármű szerelők és -karbantartók · **FEOR-08:** 7332 Repülőgépmotor-karbantartó, -javító · ESCO `7232` · EN: Aircraft Service Attendants · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Service aircraft with fuel. May de-ice aircraft, refill water and cooling agents, empty sewage tanks, service air and oxygen systems, or clean and polish exterior.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: —

**Holland-kód:** RCE — R 85 · I 14 · A 0 · S 14 · E 18 · C 53

**HEXACO differenciál cél-profil:** O cél 39±23 (w=0.33) · E cél 44±26 (w=0.18) · X cél 45±27 (w=0.16) · C cél 55±27 (w=0.15)

**HEXACO abszolút szint:** H 41 · E 53 · X 39 · A 44 · C 44 · O 36

### Mezőgazdasági és iparigép szerelők és -karbantartók

`49-3051.00` · **ISCO-08 7233** Mezőgazdasági és iparigép szerelők és -karbantartók · **FEOR-08:** 7333 Mezőgazdasági és ipari gép (motor) karbantartója, javítója; 7334 Mechanikaigép-karbantartó, -javító (műszerész) · ESCO `7233.10` · EN: Motorboat Mechanics and Service Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* bányászati gépszerelő, javító, bányászati gépszerelő, gépüzemsegéd, hajó másodgépésze, segédgépmester

A bányászati gépszerelő, javító telepíti, eltávolítja, karbantartja és szervizeli a bányászati berendezéseket.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 53.7%-a jelölte

**Holland-kód:** RCI — R 100 · I 31 · A 0 · S 0 · E 10 · C 48

**HEXACO differenciál cél-profil:** A cél 40±24 (w=0.36) · C cél 59±24 (w=0.34) · X cél 46±27 (w=0.16)

**HEXACO abszolút szint:** H 40 · E 55 · X 40 · A 36 · C 48 · O 45

### építőipari gépszerelő

`49-3041.00` · **ISCO-08 7233** Mezőgazdasági és iparigép szerelők és -karbantartók · **FEOR-08:** 7333 Mezőgazdasági és ipari gép (motor) karbantartója, javítója; 7334 Mechanikaigép-karbantartó, -javító (műszerész) · ESCO `7233.1` · EN: Farm Equipment Mechanics and Service Technicians

*Piaci megnevezések (ESCO):* építőipari gépjavító, öntödei gépésztechnikus, öntödei gépszerelő, öntödei géplakatos, textil- és ruhaiparigép-szerelő, textiliparigép-szerelő

Az építőipari gépszerelők ellenőrzik, karbantartják és szervizelik az építőiparban, erdőgazdálkodásban és a földmunkák során használt nehéz tehergépjárműveket, például buldózereket, kotrókat és kombájnokat.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 51.5%-a jelölte

**Holland-kód:** RCI — R 100 · I 34 · A 0 · S 5 · E 1 · C 55

**HEXACO differenciál cél-profil:** A cél 43±25 (w=0.29) · C cél 57±25 (w=0.27) · X cél 46±27 (w=0.17) · O cél 54±28 (w=0.14)

**HEXACO abszolút szint:** H 44 · E 53 · X 43 · A 40 · C 50 · O 49

### Kerékpárszerelők és hasonló foglalkozásúak

`49-3091.00` · **ISCO-08 7234** Kerékpárszerelők és hasonló foglalkozásúak · **FEOR-08:** 7335 Kerékpár-karbantartó, -javító · ESCO `7234` · EN: Bicycle Repairers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* kerékpár-karbantartó, - javító, kerékpár-karbantartó, kerékpárjavító

_(HU leírás nincs; EN:)_ Repair and service bicycles.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 50.8%-a jelölte

**Holland-kód:** RCI — R 100 · I 14 · A 3 · S 10 · E 8 · C 39

**HEXACO differenciál cél-profil:** E cél 58±24 (w=0.42) · H cél 54±27 (w=0.21) · O cél 47±28 (w=0.16) · A cél 47±28 (w=0.14)

**HEXACO abszolút szint:** H 47 · E 60 · X 44 · A 42 · C 43 · O 43

### órajavító

`49-9064.00` · **ISCO-08 7311** Precíziósműszer-gyártók és -javítók · **FEOR-08:** 7420 Finommechanikai műszerész · ESCO `7311.6` · EN: Watch and Clock Repairers

*Piaci megnevezések (ESCO):* órás, órásmester, órakészítő, optikai műszerész, mérő- és precíziósműszer-készítő, műszerkalibráló

Az órajavítók karórákat és órákat javítanak és szervizelnek. Azonosítják a hibákat, elemet vagy szíjat cserélnek, megolajozzák és kicserélik az alkatrészeket.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 45.8%-a jelölte

**Holland-kód:** RCI — R 92 · I 16 · A 6 · S 7 · E 2 · C 57

**HEXACO differenciál cél-profil:** A cél 38±22 (w=0.27) · C cél 61±22 (w=0.26) · X cél 42±24 (w=0.19) · E cél 57±26 (w=0.15)

**HEXACO abszolút szint:** H 43 · E 61 · X 37 · A 34 · C 50 · O 43

### Hangszergyártók és hangolók

`49-9063.00` · **ISCO-08 7312** Hangszergyártók és hangolók · **FEOR-08:** 7415 Hangszerkészítő · ESCO `7312` · EN: Musical Instrument Repairers and Tuners · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* hangszerjavító, hegedűjavító, organ repairer	orgonajavító, hangszerkészítő, idiofon hangszerek, hangszerész, húrozó

_(HU leírás nincs; EN:)_ Repair percussion, stringed, reed, or wind instruments. May specialize in one area, such as piano tuning.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 54.5%-a jelölte

**Holland-kód:** RCA — R 90 · I 27 · A 41 · S 10 · E 0 · C 42

**HEXACO differenciál cél-profil:** A cél 41±24 (w=0.26) · C cél 57±25 (w=0.21) · O cél 57±25 (w=0.21) · X cél 44±26 (w=0.17)

**HEXACO abszolút szint:** H 41 · E 58 · X 40 · A 38 · C 47 · O 50

### drágakővágó, - csiszoló

`51-9071.00` · **ISCO-08 7313** Ékszerészek és nemesfém-megmunkálók · **FEOR-08:** 7412 Ékszerkészítő, ötvös, drágakőcsiszoló · ESCO `7313.2` · EN: Jewelers and Precious Stone and Metal Workers

*Piaci megnevezések (ESCO):* ékszerész, brilliánscsiszoló, ékszerkészítő, ékszerkészítő, ötvös, drágakőcsiszoló

A drágakővágó, - csiszolók vágó- és csiszológépeket használnak gyémánt és más drágakövek feldarabolására és csiszolására a megadott rajzok és minták szerint, a különböző előírások figyelembevételével.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 25.3%-a jelölte

**Holland-kód:** RAC — R 93 · I 27 · A 45 · S 0 · E 8 · C 39

**HEXACO differenciál cél-profil:** A cél 36±20 (w=0.36) · C cél 59±24 (w=0.22) · O cél 56±26 (w=0.15) · X cél 45±26 (w=0.13)

**HEXACO abszolút szint:** H 46 · E 56 · X 43 · A 37 · C 53 · O 52

### Fazekasok és hasonló kézművesek

`49-9045.00` · **ISCO-08 7314** Fazekasok és hasonló kézművesek · **FEOR-08:** 7413 Keramikus · ESCO `7314.1` · EN: Refractory Materials Repairers, Except Brickmasons · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* téglakészítő, cserép-és téglavető, téglaöntő

A téglakészítők egyedi téglákat, csöveket és egyéb hőálló termékeket készítenek kézi öntőszerszámok segítségével. Az előírásoknak megfelelően formákat készítenek, megtisztítják és kiolajozzák őket, majd beleteszik és eltávolítják a masszát az öntőformából.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 74.8%-a jelölte

**Holland-kód:** RCI — R 100 · I 20 · A 5 · S 0 · E 0 · C 42

**HEXACO differenciál cél-profil:** C cél 58±24 (w=0.26) · A cél 42±24 (w=0.26) · X cél 43±26 (w=0.20) · O cél 44±26 (w=0.17)

**HEXACO abszolút szint:** H 36 · E 59 · X 33 · A 32 · C 40 · O 36

### keramikus

`51-9195.05` · **ISCO-08 7314** Fazekasok és hasonló kézművesek · **FEOR-08:** 7413 Keramikus · ESCO `7314.2` · EN: Potters, Manufacturing

*Piaci megnevezések (ESCO):* kerámiaformázó, korongozó/mfn, téglakészítő, cserép-és téglavető, téglaöntő

A keramikusok kézzel vagy korongozással dolgozzák fel és formázzák meg az agyagot, hogy kerámiákat, kőárukat, fajansz és porcelán késztermékeket készítsenek.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: megkezdett felsőfokú tanulmányok · a válaszadók 30.9%-a jelölte

**Holland-kód:** RCA — R 99 · I 11 · A 19 · S 0 · E 3 · C 45

**HEXACO differenciál cél-profil:** A cél 43±25 (w=0.27) · O cél 57±25 (w=0.27) · H cél 44±26 (w=0.24) · C cél 54±28 (w=0.14)

**HEXACO abszolút szint:** H 35 · E 60 · X 40 · A 35 · C 38 · O 48

### üveggyártó

`51-9195.04` · **ISCO-08 7315** Üvegfújók, -vágók, -csiszolók és -felületkezelők · **FEOR-08:** 7414 Üveggyártó · ESCO `7315.1` · EN: Glass Blowers, Molders, Benders, and Finishers

*Piaci megnevezések (ESCO):* üvegművész, üvegfúvó, üvegező, tükörkészítő üvegező, üvegajtó-szerelő

Az üveggyártók üvegtárgyakat, például üvegablakokat, tükröket és építészeti üvegeket terveznek, gyártanak és díszítenek. Egyes üveggyártók az eredeti darabok restaurálására, felújítására és javítására szakosodtak.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 43.2%-a jelölte

**Holland-kód:** RCI — R 96 · I 25 · A 8 · S 0 · E 8 · C 69

**HEXACO differenciál cél-profil:** C cél 57±26 (w=0.29) · X cél 45±27 (w=0.23) · H cél 45±27 (w=0.22) · A cél 47±28 (w=0.13)

**HEXACO abszolút szint:** H 33 · E 59 · X 35 · A 36 · C 39 · O 40

### Címfestők, díszítőfestők, üveg-, réz-, fametszők és - 7411 Címfestő vésők

`27-1012.00` · **ISCO-08 7316** Címfestők, díszítőfestők, üveg-, réz-, fametszők és - 7411 Címfestő vésők · **FEOR-08:** — · ESCO `7316.1` · EN: Craft Artists · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* iparművész-festő

Az iparművész-festők vizuális művészeti alkotásokat készítenek különböző típusú felületekre, például kerámiára, tokokra, üvegre és szövetre. Különféle technikákat és anyagokat alkalmaznak a dekorációk készítéséhez, a stencilezéstől a szabad kezes festésig.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 26.1%-a jelölte

**Holland-kód:** ARE — R 82 · I 14 · A 82 · S 11 · E 31 · C 28

**HEXACO differenciál cél-profil:** O cél 68±18 (w=0.35) · H cél 39±22 (w=0.23) · A cél 40±23 (w=0.20) · E cél 56±26 (w=0.11)

**HEXACO abszolút szint:** H 37 · E 59 · X 48 · A 38 · C 37 · O 59

### üvegmetsző

`51-9194.00` · **ISCO-08 7316** Címfestők, díszítőfestők, üveg-, réz-, fametszők és - 7411 Címfestő vésők · **FEOR-08:** — · ESCO `7316.2` · EN: Etchers and Engravers

*Piaci megnevezések (ESCO):* üveggravírozó, üvegműves, fémvésnök, fémmegmunkáló gép kezelője, nemesfém-vésnök

Az üvegmetszők gravírozó kéziszerszámok segítségével betűket és díszítőmintákat gravíroznak az üvegbe. Rárajzolják és elrendezik a betűket és a mintát a munkadarabra, amelyet azután belevésnek az üvegbe, és készre csiszolnak.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 53.9%-a jelölte

**Holland-kód:** RAC — R 92 · I 24 · A 46 · S 6 · E 0 · C 41

**HEXACO differenciál cél-profil:** C cél 61±23 (w=0.27) · A cél 40±23 (w=0.26) · X cél 42±25 (w=0.18) · E cél 55±27 (w=0.12)

**HEXACO abszolút szint:** H 33 · E 64 · X 34 · A 31 · C 44 · O 42

### nyomdai előkészítő

`51-5111.00` · **ISCO-08 7321** Nyomtatás-előkészítéssel foglalkozó technikusok · **FEOR-08:** 7231 Nyomdai előkészítő · ESCO `7321.1` · EN: Prepress Technicians and Workers

*Piaci megnevezések (ESCO):* szövegszerkesztő

A nyomdai előkészítők a szöveg és a grafika megfelelő formázásával, beállításával és összeállításával előkészítik a nyomtatási folyamatokat. Ez magában foglalja a szöveg és a kép elektronikus úton történő rögzítését és feldolgozását.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 39.3%-a jelölte

**Holland-kód:** CRA — R 67 · I 16 · A 35 · S 11 · E 6 · C 79

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.27) · X cél 43±25 (w=0.25) · H cél 43±25 (w=0.24) · E cél 54±27 (w=0.15)

**HEXACO abszolút szint:** H 32 · E 63 · X 34 · A 38 · C 43 · O 42

### Nyomdaipari befejező és könyvkötő foglalkozásúak

`43-9071.00` · **ISCO-08 7323** Nyomdaipari befejező és könyvkötő foglalkozásúak · **FEOR-08:** 7233 Könyvkötő · ESCO `7323.1` · EN: Office Machine Operators, Except Computer · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gépi könyvkötő, nyomdaipari gépmester, könyvkötő, hajtogatógép-kezelő, nyomdai gépmester, nyomdász

A gépi könyvkötők olyan gépeket kezelnek, amelyek nyomtatott vagy nem nyomtatott papírt kötnek kötegekbe tűzőkapcsok, fonal, ragasztó vagy más kötési technológia segítségével.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 67.7%-a jelölte

**Holland-kód:** CRI — R 59 · I 19 · A 3 · S 11 · E 18 · C 93

**HEXACO differenciál cél-profil:** C cél 55±26 (w=0.30) · X cél 46±27 (w=0.26) · O cél 46±27 (w=0.26)

**HEXACO abszolút szint:** H 34 · E 64 · X 33 · A 34 · C 35 · O 35

### Nyomdaipari befejező és könyvkötő foglalkozásúak

`51-5113.00` · **ISCO-08 7323** Nyomdaipari befejező és könyvkötő foglalkozásúak · **FEOR-08:** 7233 Könyvkötő · ESCO `7323` · EN: Print Binding and Finishing Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gépi könyvkötő, nyomdaipari gépmester, könyvkötő, könyvfűzőgép-kezelő, nyomdász, nyomdai gépmester

_(HU leírás nincs; EN:)_ Bind books and other publications or finish printed products by hand or machine. May set up binding and finishing machines.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 87.9%-a jelölte

**Holland-kód:** CRA — R 74 · I 3 · A 18 · S 8 · E 4 · C 75

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.33) · O cél 42±24 (w=0.30) · A cél 47±28 (w=0.10)

**HEXACO abszolút szint:** H 33 · E 63 · X 36 · A 35 · C 41 · O 34

### villanyszerelő

`47-3013.00` · **ISCO-08 7411** Építőipari villanyszerelők és hasonló foglalkozásúak · **FEOR-08:** 7524 Épületvillamossági szerelő, villanyszerelő · ESCO `7411.1` · EN: Helpers--Electricians

*Piaci megnevezések (ESCO):* villamosmérnök

A villanyszerelők elektromos áramköröket és huzalozási rendszereket szerelnek fel és javítanak. Emellett telepítik és karbantartják az elektromos berendezéseket és gépeket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 70.8%-a jelölte

**Holland-kód:** RCI — R 100 · I 20 · A 0 · S 18 · E 0 · C 49

**HEXACO differenciál cél-profil:** O cél 42±25 (w=0.32) · A cél 56±26 (w=0.26) · X cél 46±27 (w=0.17) · H cél 53±28 (w=0.13)

**HEXACO abszolút szint:** H 41 · E 58 · X 38 · A 44 · C 39 · O 37

### Elektroműszerészek és szerelők

`49-3053.00` · **ISCO-08 7412** Elektroműszerészek és szerelők · **FEOR-08:** 7341 Villamos gépek és készülékek műszerésze, javítója; 7523 Felvonószerelő · ESCO `7412.10` · EN: Outdoor Power Equipment and Other Small Engine Mechanics · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* vidámparki karbantartó, kalandparki karbantartó, hullámvasút-karbantartó

A vidámparki karbantartók a vidámpark látnivalóinak karbantartását és javítását végzik. Erős műszaki ismeretekkel és szaktudással kell rendelkezniük a vidámpark karbantartandó berendezéseiről.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 48.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 25 · A 0 · S 3 · E 4 · C 50

**HEXACO differenciál cél-profil:** A cél 42±25 (w=0.45) · C cél 55±27 (w=0.28) · X cél 48±29 (w=0.11)

**HEXACO abszolút szint:** H 42 · E 57 · X 42 · A 38 · C 44 · O 45

### Elektroműszerészek és szerelők

`49-3092.00` · **ISCO-08 7412** Elektroműszerészek és szerelők · **FEOR-08:** 7341 Villamos gépek és készülékek műszerésze, javítója; 7523 Felvonószerelő · ESCO `7412` · EN: Recreational Vehicle Service Technicians · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Diagnose, inspect, adjust, repair, or overhaul recreational vehicles including travel trailers. May specialize in maintaining gas, electrical, hydraulic, plumbing, or chassis/towing systems as well as repairing generators, appliances, and interior components.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 46.3%-a jelölte

**Holland-kód:** RCI — R 100 · I 27 · A 0 · S 10 · E 4 · C 52

**HEXACO differenciál cél-profil:** X cél 46±27 (w=0.38) · C cél 53±28 (w=0.30) · A cél 48±29 (w=0.15) · O cél 51±29 (w=0.10)

**HEXACO abszolút szint:** H 46 · E 52 · X 45 · A 46 · C 49 · O 48

### Elektroműszerészek és szerelők

`49-9011.00` · **ISCO-08 7412** Elektroműszerészek és szerelők · **FEOR-08:** 7341 Villamos gépek és készülékek műszerésze, javítója; 7523 Felvonószerelő · ESCO `7412` · EN: Mechanical Door Repairers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Install, service, or repair automatic door mechanisms and hydraulic doors. Includes garage door mechanics.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 70.8%-a jelölte

**Holland-kód:** RCI — R 98 · I 13 · A 0 · S 8 · E 0 · C 49

**HEXACO differenciál cél-profil:** A cél 45±26 (w=0.31) · C cél 54±27 (w=0.26) · H cél 53±28 (w=0.19)

**HEXACO abszolút szint:** H 43 · E 57 · X 41 · A 38 · C 43 · O 43

### Elektroműszerészek és szerelők

`49-9081.00` · **ISCO-08 7412** Elektroműszerészek és szerelők · **FEOR-08:** 7341 Villamos gépek és készülékek műszerésze, javítója; 7523 Felvonószerelő · ESCO `7412` · EN: Wind Turbine Service Technicians · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Inspect, diagnose, adjust, or repair wind turbines. Perform maintenance on wind turbine equipment including resolving electrical, mechanical, and hydraulic malfunctions.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 34.4%-a jelölte

**Holland-kód:** RCI — R 100 · I 43 · A 0 · S 10 · E 13 · C 55

**HEXACO differenciál cél-profil:** E cél 41±24 (w=0.23) · C cél 58±25 (w=0.20) · H cél 43±25 (w=0.19) · X cél 44±26 (w=0.17)

**HEXACO abszolút szint:** H 46 · E 44 · X 46 · A 48 · C 58 · O 54

### Elektronikai műszerészek és karbantartók

`49-2093.00` · **ISCO-08 7421** Elektronikai műszerészek és karbantartók · **FEOR-08:** 7341 Villamos gépek és készülékek műszerésze, javítója · ESCO `7421.8` · EN: Electrical and Electronics Installers and Repairers, Transportation Equipment · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* hajóelektronikai technikus, villanyszerelő, autóelektronika-telepítő, autórádió-szerelő, GPS elektronikai szerelő, szórakoztatóelektronikai szerelő

_(HU leírás nincs; EN:)_ Install, adjust, or maintain mobile electronics communication equipment, including sound, sonar, security, navigation, and surveillance systems on trains, watercraft, or other mobile equipment.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 47.7%-a jelölte

**Holland-kód:** RCI — R 100 · I 40 · A 0 · S 2 · E 0 · C 64

**HEXACO differenciál cél-profil:** X cél 42±24 (w=0.34) · C cél 58±25 (w=0.32) · A cél 46±27 (w=0.16) · E cél 46±28 (w=0.15)

**HEXACO abszolút szint:** H 45 · E 51 · X 40 · A 43 · C 53 · O 47

### Elektronikai műszerészek és karbantartók

`49-2096.00` · **ISCO-08 7421** Elektronikai műszerészek és karbantartók · **FEOR-08:** 7341 Villamos gépek és készülékek műszerésze, javítója · ESCO `7421.8` · EN: Electronic Equipment Installers and Repairers, Motor Vehicles · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* hajóelektronikai technikus, villanyszerelő, jármű-elektronikai technikus, vasúti jármű-elektronikai technikus, szórakoztatóelektronikai szerelő, TV-szerelő

_(HU leírás nincs; EN:)_ Install, diagnose, or repair communications, sound, security, or navigation equipment in motor vehicles.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 47.4%-a jelölte

**Holland-kód:** RCI — R 100 · I 41 · A 0 · S 5 · E 0 · C 56

**HEXACO differenciál cél-profil:** A cél 46±27 (w=0.31) · C cél 54±27 (w=0.28) · X cél 47±28 (w=0.22) · O cél 52±29 (w=0.15)

**HEXACO abszolút szint:** H 43 · E 55 · X 43 · A 41 · C 46 · O 47

### Elektronikai műszerészek és karbantartók

`49-9061.00` · **ISCO-08 7421** Elektronikai műszerészek és karbantartók · **FEOR-08:** 7341 Villamos gépek és készülékek műszerésze, javítója · ESCO `7421.3` · EN: Camera and Photographic Equipment Repairers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* szórakoztatóelektronikai szerelő, TV-szerelő, ezermester

A szórakoztatóelektronikai szerelők szórakoztató elektronikai berendezések, például televíziók, video- és audiorendszerek, valamint digitális fényképezőgépek működési hibáinak és vizsgálati funkcióinak diagnosztizálása céljából elektromos berendezéseket használnak.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 32.3%-a jelölte

**Holland-kód:** RCI — R 99 · I 28 · A 16 · S 3 · E 0 · C 64

**HEXACO differenciál cél-profil:** A cél 40±23 (w=0.25) · C cél 60±23 (w=0.24) · H cél 43±25 (w=0.17) · X cél 43±26 (w=0.17)

**HEXACO abszolút szint:** H 36 · E 57 · X 38 · A 35 · C 48 · O 49

### avionikus

`49-2091.00` · **ISCO-08 7421** Elektronikai műszerészek és karbantartók · **FEOR-08:** 7341 Villamos gépek és készülékek műszerésze, javítója · ESCO `7421.2` · EN: Avionics Technicians

*Piaci megnevezések (ESCO):* repülőgép-technikus, repülőgép-szerelő

Az avionikusok elektromos és elektronikus berendezések, például légi járművek és űrjárművek navigációs, kommunikációs és repülésvezérlő rendszereinek beszerelésével, tesztelésével, ellenőrzésével és beállításával foglalkoznak.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 50.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 55 · A 3 · S 6 · E 1 · C 57

**HEXACO differenciál cél-profil:** X cél 40±23 (w=0.31) · C cél 59±24 (w=0.27) · A cél 45±26 (w=0.16) · O cél 54±27 (w=0.13)

**HEXACO abszolút szint:** H 47 · E 50 · X 42 · A 45 · C 58 · O 52

### Információs és kommunikációs technológiai berendezések szerelői műszerésze, javítója

`49-2021.00` · **ISCO-08 7422** Információs és kommunikációs technológiai berendezések szerelői műszerésze, javítója · **FEOR-08:** 7342 Informatikai és telekommunikációs berendezések · ESCO `7422.4` · EN: Radio, Cellular, and Tower Equipment Installers and Repairers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* rádiótechnikus, rádiószakember, telekommunikációs berendezések műszerésze, távközlési berendezések műszerésze, telekommunikációs berendezések javítója, kommunikációs infrastruktúra karbantartó

A rádiótechnikusok telepítik, beállítják, tesztelik, karbantartják és javítják a mobil vagy helyhez kötött rádióadó és -vevő berendezéseket, valamint a kétirányú rádiós kommunikációs rendszereket.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 30.7%-a jelölte

**Holland-kód:** RCI — R 96 · I 41 · A 1 · S 6 · E 6 · C 59

**HEXACO differenciál cél-profil:** C cél 60±24 (w=0.35) · X cél 44±26 (w=0.22) · E cél 45±26 (w=0.19) · H cél 45±27 (w=0.19)

**HEXACO abszolút szint:** H 41 · E 51 · X 41 · A 44 · C 52 · O 46

### Információs és kommunikációs technológiai berendezések szerelői műszerésze, javítója

`49-2097.00` · **ISCO-08 7422** Információs és kommunikációs technológiai berendezések szerelői műszerésze, javítója · **FEOR-08:** 7342 Informatikai és telekommunikációs berendezések · ESCO `7422` · EN: Audiovisual Equipment Installers and Repairers · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Install, repair, or adjust audio or television receivers, stereo systems, camcorders, video systems, or other electronic entertainment equipment in homes or other venues. May perform routine maintenance.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 38.4%-a jelölte

**Holland-kód:** RCI — R 98 · I 27 · A 11 · S 11 · E 2 · C 60

**HEXACO differenciál cél-profil:** E cél 52±29 (w=0.29) · H cél 48±29 (w=0.22) · X cél 49±29 (w=0.18) · C cél 51±29 (w=0.15)

**HEXACO abszolút szint:** H 44 · E 55 · X 45 · A 46 · C 45 · O 46

### Élelmiszer- és italkóstolók és -osztályozók

`45-2041.00` · **ISCO-08 7515** Élelmiszer- és italkóstolók és -osztályozók · **FEOR-08:** 3135 Minőségbiztosítási technikus; 7919 Egyéb, máshova nem sorolható ipari és építőipari foglalkozású · ESCO `7515.3` · EN: Graders and Sorters, Agricultural Products · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* élelmiszer-osztályozó, élelmiszer-minősítő technikus, tejellenőrzésért felelős szakember, tejellenőrzésért felelős szakemberek, tej ellenőrzését végző szakember

Az élelmiszer-osztályozók ellenőrzik, válogatják és osztályozzák az élelmiszereket. Érzékszervi kritériumok alapján vagy gépek segítségével élelmiszereket osztályoznak.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 63.8%-a jelölte

**Holland-kód:** RCI — R 77 · I 25 · A 11 · S 8 · E 19 · C 67

**HEXACO differenciál cél-profil:** O cél 43±26 (w=0.28) · C cél 55±26 (w=0.22) · X cél 46±27 (w=0.16) · H cél 53±28 (w=0.12)

**HEXACO abszolút szint:** H 33 · E 66 · X 32 · A 31 · C 33 · O 32

### bútorfelület-kezelő

`51-7021.00` · **ISCO-08 7522** Műbútorasztalosok és hasonló foglalkozásúak · **FEOR-08:** 7223 Bútorasztalos; 7225 Kádár, bognár · ESCO `7522.5` · EN: Furniture Finishers

*Piaci megnevezések (ESCO):* bútorfestő, fa-, és bútor csiszoló, bútorrestaurátor, műbútorasztalos, bútorkárpitos, bútorasztalos

A bútorfelület-kezelők kézi és elektromos szerszámokkal csiszolják és polírozzák a bútorokat. Különböző technikákkal, például kefével vagy szórópisztollyal fabevonatokat visznek fel a fafelületekre.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 61.2%-a jelölte

**Holland-kód:** RAC — R 100 · I 8 · A 32 · S 4 · E 0 · C 31

**HEXACO differenciál cél-profil:** A cél 41±24 (w=0.28) · C cél 58±24 (w=0.24) · X cél 45±27 (w=0.14) · O cél 54±27 (w=0.12)

**HEXACO abszolút szint:** H 34 · E 62 · X 36 · A 33 · C 41 · O 44

### díszletmakett-készítő

`51-7031.00` · **ISCO-08 7522** Műbútorasztalosok és hasonló foglalkozásúak · **FEOR-08:** 7223 Bútorasztalos; 7225 Kádár, bognár · ESCO `7522.7` · EN: Model Makers, Wood

*Piaci megnevezések (ESCO):* makettkészítő, modellezőmakett-készítő

A díszletmakett-készítők különféle anyagokból, például műanyagból, fából, viaszból és fémekből – többnyire kézzel – terveznek és készítenek díszletmaketteket.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi utáni szakképzés / OKJ-utód szakma · a válaszadók 30.8%-a jelölte

**Holland-kód:** RCA — R 100 · I 26 · A 46 · S 6 · E 10 · C 50

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.24) · A cél 42±24 (w=0.22) · H cél 43±25 (w=0.19) · O cél 56±26 (w=0.16)

**HEXACO abszolút szint:** H 35 · E 60 · X 39 · A 36 · C 46 · O 48

### Textilszabászok

`51-4062.00` · **ISCO-08 7532** Textilszabászok · **FEOR-08:** 7211 Szabásminta-készítő · ESCO `7532.6` · EN: Patternmakers, Metal and Plastic · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* bőripari szabásminta-készítő, szabásminta-rajzoló, szériázó, ruhaipari szabásminta-készítő, ruhaipari előkészítő, szabásminta-digitalizáló

A bőripari szabásminta-készítők kézi és szerszámgépek felhasználásával megtervezik és kivágják a mintákat a különféle bőrárukból. Ellenőrzik a beágyazott változatokat, és megbecsülik az anyagszükségletet.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: megkezdett felsőfokú tanulmányok · a válaszadók 40.2%-a jelölte

**Holland-kód:** RCA — R 87 · I 12 · A 40 · S 0 · E 0 · C 54

**HEXACO differenciál cél-profil:** C cél 61±22 (w=0.33) · A cél 40±23 (w=0.29) · X cél 44±26 (w=0.17) · E cél 54±28 (w=0.10)

**HEXACO abszolút szint:** H 35 · E 62 · X 35 · A 32 · C 45 · O 41

### ruhaipari szabásminta-készítő

`51-6092.00` · **ISCO-08 7532** Textilszabászok · **FEOR-08:** 7211 Szabásminta-készítő · ESCO `7532.7` · EN: Fabric and Apparel Patternmakers

*Piaci megnevezések (ESCO):* szabásminta-rajzoló, ruhaipari előkészítő, ruhaipari CAD-szabásminta-készítő, CAD-modellező, ruhaszabó, szőrmekészítő

A ruhaipari szabásminta-készítők kézi eszközökkel vagy a megrendelő igényeinek megfelelő ipari gépek segítségével értelmezik a szabásmintákat, és kiszabják a ruházati termékek részeit.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 40.7%-a jelölte

**Holland-kód:** RAC — R 78 · I 6 · A 73 · S 5 · E 8 · C 53

**HEXACO differenciál cél-profil:** H cél 41±24 (w=0.27) · C cél 58±24 (w=0.24) · O cél 56±26 (w=0.16) · X cél 46±27 (w=0.13)

**HEXACO abszolút szint:** H 34 · E 60 · X 39 · A 39 · C 47 · O 48

### Varrók, hímzők és hasonló foglalkozásúak

`51-6051.00` · **ISCO-08 7533** Varrók, hímzők és hasonló foglalkozásúak · **FEOR-08:** 7418 Textilműves, hímző, csipkeverő · ESCO `7533.2` · EN: Sewers, Hand · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* hímző, műhímző, emblémázó, kesztyűkészítő, kesztyűvasaló, kesztyűdíszítő

A hímzők a textilfelületeket kézzel vagy hímzőgéppel hímezik ki. Számos hagyományos öltéstechnikát alkalmaznak, hogy bonyolult mintákat hímezzenek a ruhadarabokra, kiegészítőkre és lakberendezési tárgyakra.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 82.2%-a jelölte

**Holland-kód:** RCA — R 91 · I 0 · A 23 · S 9 · E 2 · C 38

**HEXACO differenciál cél-profil:** C cél 60±23 (w=0.31) · A cél 43±25 (w=0.22) · O cél 44±26 (w=0.18) · X cél 46±27 (w=0.14)

**HEXACO abszolút szint:** H 32 · E 65 · X 33 · A 31 · C 40 · O 35

### cipész

`51-6041.00` · **ISCO-08 7536** Cipészek és hasonló foglalkozásúak · **FEOR-08:** 7217 Cipész, cipőkészítő, -javító · ESCO `7536.2.8` · EN: Shoe and Leather Workers and Repairers

*Piaci megnevezések (ESCO):* cipészmester, kézműves cipőkészítő, bőrdíszmű-összeállító, bőrműves, szűcs

A cipészek kézi vagy gépi műveleteket használnak különféle lábbelik hagyományos előállítására. Ezen kívül minden lábbelitípust is megjavítanak egy javítóműhelyben.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 56.4%-a jelölte

**Holland-kód:** RCA — R 99 · I 10 · A 36 · S 5 · E 9 · C 36

**HEXACO differenciál cél-profil:** A cél 41±24 (w=0.33) · C cél 58±25 (w=0.28) · E cél 54±27 (w=0.14) · X cél 46±28 (w=0.12)

**HEXACO abszolút szint:** H 35 · E 63 · X 36 · A 32 · C 40 · O 42

### Lő- és robbantómesterek

`47-5032.00` · **ISCO-08 7542** Lő- és robbantómesterek · **FEOR-08:** 7913 Robbantómester · ESCO `7542` · EN: Explosives Workers, Ordnance Handling Experts, and Blasters · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* robbantómester, kőrobbantó, robbantás-vezető

_(HU leírás nincs; EN:)_ Place and detonate explosives to demolish structures or to loosen, remove, or displace earth, rock, or other materials. May perform specialized handling, storage, and accounting procedures.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 62.5%-a jelölte

**Holland-kód:** RCI — R 98 · I 46 · A 4 · S 5 · E 14 · C 53

**HEXACO differenciál cél-profil:** O cél 33±19 (w=0.29) · E cél 37±21 (w=0.24) · C cél 62±22 (w=0.21) · X cél 39±23 (w=0.19)

**HEXACO abszolút szint:** H 49 · E 42 · X 41 · A 48 · C 60 · O 37

### Termékosztályozók és -vizsgálók (kivéve az élelmiszereket) élelmiszereket) foglalkozású

`45-4023.00` · **ISCO-08 7543** Termékosztályozók és -vizsgálók (kivéve az élelmiszereket) élelmiszereket) foglalkozású · **FEOR-08:** 3135 Minőségbiztosítási technikus; 7919 Egyéb, máshova nem sorolható ipari és építőipari · ESCO `7543.11` · EN: Log Graders and Scalers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* furnérlap-minősítő, furnérlap-osztályozó, rétegeltlemez-osztályozó, termékminősítő, termékosztályozó

A furnérlap-minősítők a lapok minőségét vizsgálják. A szabálytalanságokat, sérüléseket és gyártási hibákat keresik, és a lapokat a mintázatok alapján osztályozzák.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 64.2%-a jelölte

**Holland-kód:** CRI — R 66 · I 23 · A 0 · S 2 · E 13 · C 88

**HEXACO differenciál cél-profil:** A cél 41±24 (w=0.31) · C cél 56±26 (w=0.21) · H cél 56±26 (w=0.20) · X cél 46±27 (w=0.14)

**HEXACO abszolút szint:** H 39 · E 62 · X 35 · A 32 · C 39 · O 38

### Kártevőirtók

`37-3012.00` · **ISCO-08 7544** Kártevőirtók · **FEOR-08:** 7914 Kártevőirtó, gyomirtó · ESCO `7544.1.1` · EN: Pesticide Handlers, Sprayers, and Applicators, Vegetation · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* féreg-, rovar- és kártevőirtó szakember, fertőtlenítéssel foglalkozó személy, rovar és kártevőirtó szakember

A féreg-, rovar- és kártevőirtó szakemberek azonosítják, megszüntetik és visszaszorítják a kártevőket specifikus kémiai oldatok alkalmazásával, csapdák és egyéb, a kártevők, például patkányok, egerek és csótányok irtására szolgáló felszerelések felállításával.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 56.2%-a jelölte

**Holland-kód:** RCI — R 92 · I 29 · A 0 · S 16 · E 7 · C 44

**HEXACO differenciál cél-profil:** X cél 42±25 (w=0.29) · C cél 57±25 (w=0.27) · A cél 44±26 (w=0.22)

**HEXACO abszolút szint:** H 43 · E 55 · X 38 · A 38 · C 47 · O 43

### Máshová nem sorolható kézműipari és hasonló foglalkozásúak foglalkozású

`51-9031.00` · **ISCO-08 7549** Máshová nem sorolható kézműipari és hasonló foglalkozásúak foglalkozású · **FEOR-08:** 7919 Egyéb, máshova nem sorolható ipari és építőipari 9. · ESCO `7549` · EN: Cutters and Trimmers, Hand · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Use hand tools or hand-held power tools to cut and trim a variety of manufactured items, such as carpet, fabric, stone, glass, or rubber.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 72.8%-a jelölte

**Holland-kód:** RCA — R 87 · I 4 · A 20 · S 2 · E 0 · C 46

**HEXACO differenciál cél-profil:** C cél 58±24 (w=0.30) · O cél 44±26 (w=0.22) · A cél 44±26 (w=0.22) · X cél 45±26 (w=0.20)

**HEXACO abszolút szint:** H 32 · E 64 · X 32 · A 31 · C 38 · O 34


## 8 — Gépkezelők, összeszerelők, járművezetők

### Kútfúrók és hasonló foglalkozásúak

`47-5023.00` · **ISCO-08 8113** Kútfúrók és hasonló foglalkozásúak · **FEOR-08:** 8312 Kútfúró, mélyfúró gép kezelője (kőolaj, földgáz, víz) · ESCO `8113.3` · EN: Earth Drillers, Except Oil and Gas · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* olajipari fúróberendezés-karbantartó, kapcsolós, olajipari darukezelő, derrickdaru-kezelő, fúrósegédmunkás, fúrósegéd

Az olajipari fúróberendezés-karbantartók felelősséget vállalnak a fúróberendezést ellátó motorokért. Biztosítják, hogy minden egyéb berendezés megfelelően működjön.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 72.8%-a jelölte

**Holland-kód:** RCI — R 100 · I 44 · A 2 · S 4 · E 12 · C 44

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.27) · E cél 42±24 (w=0.25) · H cél 45±27 (w=0.15) · X cél 46±27 (w=0.12)

**HEXACO abszolút szint:** H 38 · E 51 · X 40 · A 40 · C 48 · O 42

### bányaszivattyú-kezelő

`53-7072.00` · **ISCO-08 8113** Kútfúrók és hasonló foglalkozásúak · **FEOR-08:** 8312 Kútfúró, mélyfúró gép kezelője (kőolaj, földgáz, víz) · ESCO `8113.4` · EN: Pump Operators, Except Wellhead Pumpers

A bányaszivattyú-kezelők a folyadékok és anyagok (pl. vegyi oldatok, nyersolaj, gázok és egyebek) egyik pontról a másikra történő átvitelére szolgáló szivattyúfelszerelések és -rendszerek ellátását végzik.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 60.9%-a jelölte

**Holland-kód:** RCI — R 95 · I 21 · A 0 · S 5 · E 8 · C 58

**HEXACO differenciál cél-profil:** O cél 40±23 (w=0.28) · C cél 60±24 (w=0.26) · X cél 44±26 (w=0.17) · E cél 45±27 (w=0.13)

**HEXACO abszolút szint:** H 38 · E 54 · X 38 · A 42 · C 49 · O 36

### Cement- és más ásványitermék-gyártó gépek kezelői

`47-5051.00` · **ISCO-08 8114** Cement- és más ásványitermék-gyártó gépek kezelői · **FEOR-08:** 8143 Cement-, kő- és egyéb ásványianyag-feldolgozó gép kezelője · ESCO `8114.8` · EN: Rock Splitters, Quarry · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* kővágógép-kezelő, kővágógép kezelője, granulátumkeverő gép kezelője, kőcsiszoló

A kővágógép-kezelők olyan gépeket működtetnek és tartanak karban, amelyek köveket vágnak. A köveket különböző formákra alakítják, például tömbök, macskakövek, csempék és beton termékek létrehozására.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 49.5%-a jelölte

**Holland-kód:** RCI — R 100 · I 18 · A 12 · S 4 · E 3 · C 36

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.28) · A cél 42±25 (w=0.25) · O cél 43±26 (w=0.20) · X cél 46±28 (w=0.11)

**HEXACO abszolút szint:** H 29 · E 62 · X 32 · A 28 · C 34 · O 32

### műgyantás kézi-lamináló

`51-2051.00` · **ISCO-08 8142** Műanyagterméket gyártó gépek kezelői · **FEOR-08:** 8135 Műanyagtermék-gyártó gép kezelője · ESCO `8142.4` · EN: Fiberglass Laminators and Fabricators

*Piaci megnevezések (ESCO):* húzósajtológép-kezelő, üvegszálszóró berendezés kezelője, száltekercselőgép-kezelő, fröccsöntőgép-kezelő, műanyag bútorokat gyártó gép kezelője

A műgyantás kézi-laminálók műgyantát öntenek hajótesteket és hajófedélzeteket formázva. Műszaki rajzok alapján kézi és gépi szerszámokat használnak a kompozit anyagok vágására.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 45.8%-a jelölte

**Holland-kód:** RCA — R 96 · I 17 · A 20 · S 0 · E 3 · C 42

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.29) · O cél 44±26 (w=0.24) · H cél 46±27 (w=0.15) · A cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 31 · E 60 · X 34 · A 33 · C 37 · O 34

### papírzacskógép-kezelő

`51-9196.00` · **ISCO-08 8143** Papírterméket gyártó gépek kezelői · **FEOR-08:** 8126 Papír- és cellulóztermék-gyártó gép kezelője és gyártósor mellett dolgozó · ESCO `8143.4` · EN: Paper Goods Machine Setters, Operators, and Tenders

*Piaci megnevezések (ESCO):* pelenkagyártógép-kezelő, papírkendő-perforáló és -áttekercselő gép kezelője, WC-papír-gyártó gép kezelője, kendőperforáló és áttekercselő berendezés kezelője, hullámpapírgyártógép-kezelő, borítékgyártógép-kezelő

A papírzacskógép-kezelők olyan gépet szolgálnak ki, amely papírt vesz be, hajtogat és ragaszt különböző méretű, formájú és erősségű papírokat előállítva.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 69.3%-a jelölte

**Holland-kód:** RCI — R 92 · I 12 · A 4 · S 0 · E 8 · C 59

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.32) · H cél 45±27 (w=0.19) · X cél 46±27 (w=0.18) · O cél 46±28 (w=0.15)

**HEXACO abszolút szint:** H 34 · E 58 · X 36 · A 37 · C 41 · O 38

### csévélőgép-kezelő

`51-6064.00` · **ISCO-08 8151** Fonalelőkészítő, -fonó és -sodró gépek kezelői · **FEOR-08:** 8121 Textilipari gép kezelője és gyártósor mellett dolgozó · ESCO `8151.4` · EN: Textile Winding, Twisting, and Drawing Out Machine Setters, Operators, and Tenders

*Piaci megnevezések (ESCO):* fonógépkezelő, fonótechnikus

A csévélőgép-kezelők tekercseket, zsinórokat, fonalakat, köteleket, szálakat hengerekre, csévékre vagy orsókra tekerő gépeket szolgálnak ki. Kezelik az anyagokat, felkészítik ezeket a feldolgozásra, és működtetik a csévélőgépeket.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 53.8%-a jelölte

**Holland-kód:** RCE — R 92 · I 8 · A 6 · S 0 · E 9 · C 55

**HEXACO differenciál cél-profil:** C cél 57±26 (w=0.30) · O cél 44±26 (w=0.25) · X cél 46±28 (w=0.17) · A cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 32 · E 64 · X 34 · A 34 · C 37 · O 35

### textilkikészítő gép kezelője

`51-6061.00` · **ISCO-08 8154** Fehérítő-, ruhafestő- és tisztítógép-kezelők · **FEOR-08:** 8121 Textilipari gép kezelője és gyártósor mellett dolgozó · ESCO `8154.4` · EN: Textile Bleaching and Dyeing Machine Operators and Tenders

*Piaci megnevezések (ESCO):* textilfestő technikus, textilfestő, textilfestőgép-kezelő, textilkikészítő technikus, textilipari kikészítő, textilkikészítő

A textilkikészítő gépek kezelői textilkikészítő gépeken zajló gyártást kezelik, felügyelik, ellenőrzik és fenntartják a gyártást.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 56.0%-a jelölte

**Holland-kód:** RCI — R 96 · I 18 · A 4 · S 4 · E 4 · C 53

**HEXACO differenciál cél-profil:** O cél 42±24 (w=0.36) · C cél 57±25 (w=0.31) · X cél 46±28 (w=0.16)

**HEXACO abszolút szint:** H 34 · E 60 · X 35 · A 36 · C 39 · O 34

### cipőgyártó gép kezelője

`51-6042.00` · **ISCO-08 8156** Cipőgyártó és hasonló gépek kezelői · **FEOR-08:** 8124 Cipőgyártó gép kezelője és gyártósor mellett dolgozó · ESCO `8156.2` · EN: Shoe Machine Operators and Tenders

*Piaci megnevezések (ESCO):* tűzödei előkészítő, cipőfelsőrész-előkészítő

A cipőgyártó gépek kezelői a cipőgyártás területén speciális gépeket szolgálnak ki. Gépeket működtetnek a lábbelik fárahúzására, vágására, lezárására és kikészítésére.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 46.4%-a jelölte

**Holland-kód:** RCI — R 95 · I 13 · A 11 · S 5 · E 9 · C 48

**HEXACO differenciál cél-profil:** C cél 58±25 (w=0.29) · O cél 44±26 (w=0.23) · A cél 45±27 (w=0.19) · X cél 46±27 (w=0.15)

**HEXACO abszolút szint:** H 32 · E 65 · X 33 · A 31 · C 37 · O 33

### Élelmiszert és hasonló terméket gyártó gépek kezelői

`51-9193.00` · **ISCO-08 8160** Élelmiszert és hasonló terméket gyártó gépek kezelői · **FEOR-08:** 7115 Borász és egyéb szeszesital-gyártó, szikvízkészítő; 8111 Élelmiszer-, italgyártó gép kezelője · ESCO `8160.15` · EN: Cooling and Freezing Equipment Operators and Tenders · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* készételhűtő gépkezelő

A készételhűtő gépkezelők különféle eljárásokat végeznek, és a készételek előállításához használt speciális gépeket szolgálják ki. Hűtési, tömítési és fagyasztási módszereket alkalmaznak a nem közvetlen fogyasztásra szánt élelmiszerek esetében.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 51.4%-a jelölte

**Holland-kód:** RCI — R 100 · I 22 · A 0 · S 7 · E 2 · C 55

**HEXACO differenciál cél-profil:** O cél 42±24 (w=0.31) · C cél 58±25 (w=0.29) · X cél 45±26 (w=0.20) · A cél 47±28 (w=0.11)

**HEXACO abszolút szint:** H 36 · E 59 · X 35 · A 36 · C 42 · O 34

### Fafeldolgozó berendezések kezelői

`45-4021.00` · **ISCO-08 8172** Fafeldolgozó berendezések kezelői · **FEOR-08:** 8125 Fafeldolgozó gép kezelője és gyártósor mellett dolgozó · ESCO `8172.1` · EN: Fallers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* faaprítógép-kezelő, ácsfűrészkezelő, kéreghántológép-kezelő

A faaprítógép-kezelők olyan gépeket szolgálnak ki, amelyek a faanyagot apró darabokra zúzzák, amelyeket forgácslemez készítésére, további pépesítési feldolgozásra, vagy önmagukban használnak fel.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 55.8%-a jelölte

**Holland-kód:** RCI — R 100 · I 25 · A 2 · S 15 · E 10 · C 39

**HEXACO differenciál cél-profil:** C cél 63±21 (w=0.29) · E cél 40±23 (w=0.23) · X cél 42±25 (w=0.17) · O cél 43±25 (w=0.15)

**HEXACO abszolút szint:** H 34 · E 51 · X 35 · A 39 · C 49 · O 37

### üvegprésgép-kezelő

`51-6091.00` · **ISCO-08 8181** Üveg- és kerámiagyártó berendezések kezelői · **FEOR-08:** 8141 Kerámiaipari terméket gyártó gép kezelője; 8142 Üveget és üvegterméket gyártó gép kezelője · ESCO `8181.8` · EN: Extruding and Forming Machine Setters, Operators, and Tenders, Synthetic and Glass Fibers

*Piaci megnevezések (ESCO):* üvegpréselő, extrudálógép-kezelő, extrudálógép kezelője

Az üvegprésgép-kezelők olyan gépeket üzemeltetnek és tartanak karban, amelyek a megolvadt üveget préselik vagy felfújják termékek alakjára, például neoncsövek, palackok, üvegedények és poharak formájára.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 74.1%-a jelölte

**Holland-kód:** RCI — R 92 · I 20 · A 4 · S 4 · E 7 · C 51

**HEXACO differenciál cél-profil:** O cél 42±25 (w=0.31) · C cél 58±25 (w=0.30) · H cél 46±27 (w=0.15) · X cél 46±27 (w=0.15)

**HEXACO abszolút szint:** H 32 · E 60 · X 35 · A 36 · C 39 · O 34

### Máshová nem sorolható helyhez kötött berendezések és 8190 Egyéb, máshova nem sorolható feldolgozóipari gép gépek kezelői kezelője gépek kezelői gépek kezelői gépek kezelői gépek kezelői gépek kezelői kezelője

`51-9191.00` · **ISCO-08 8189** Máshová nem sorolható helyhez kötött berendezések és 8190 Egyéb, máshova nem sorolható feldolgozóipari gép gépek kezelői kezelője gépek kezelői gépek kezelői gépek kezelői gépek kezelői gépek kezelői kezelője · **FEOR-08:** — · ESCO `8189.1` · EN: Adhesive Bonding Machine Operators and Tenders · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* élzárógép-kezelő, élfóliázógép-kezelő, élzáró

Az élzárógép-kezelők olyan gépeket szolgálnak ki, amelyek anyagok, főként fa, furnérozását végzik, a tartósság és az esztétika fokozására.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 72.6%-a jelölte

**Holland-kód:** RCI — R 92 · I 18 · A 1 · S 0 · E 2 · C 56

**HEXACO differenciál cél-profil:** O cél 42±24 (w=0.42) · C cél 56±26 (w=0.28) · A cél 48±29 (w=0.10)

**HEXACO abszolút szint:** H 33 · E 61 · X 35 · A 34 · C 36 · O 33

### légijármű-összeszerelő

`51-2011.00` · **ISCO-08 8211** Mechanikai gépek összeszerelői · **FEOR-08:** 8211 Mechanikaigép-összeszerelő · ESCO `8211.1` · EN: Aircraft Structure, Surfaces, Rigging, and Systems Assemblers

*Piaci megnevezések (ESCO):* hajómotor-összeszerelő

A légijármű-összeszerelők kézi szerszámokat, gépi meghajtású eszközöket és egyéb berendezéseket, például CNC gépeket vagy robotokat használnak olyan előregyártott alkatrészek építésére, illesztésére és felszerelésére, amelyek a rögzített- vagy forgószárnyú légi járművek és légijármű-alegységek, például repülésvezérlés, légi járművek borítása, rudazat és egyéb mechanikus rendszerek stb.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 54.8%-a jelölte

**Holland-kód:** RCI — R 100 · I 28 · A 12 · S 0 · E 6 · C 47

**HEXACO differenciál cél-profil:** C cél 62±22 (w=0.29) · X cél 40±23 (w=0.25) · O cél 41±24 (w=0.21) · H cél 55±27 (w=0.12)

**HEXACO abszolút szint:** H 45 · E 56 · X 37 · A 40 · C 53 · O 39

### Erős- és gyengeáramú berendezések összeszerelői

`51-2021.00` · **ISCO-08 8212** Erős- és gyengeáramú berendezések összeszerelői · **FEOR-08:** 8212 Villamosberendezés-összeszerelő · ESCO `8212.2.2` · EN: Coil Winders, Tapers, and Finishers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* villamosberendezés-összeszerelő, elektronikai berendezés összeszerelője, elektronikaiberendezés-összeszerelő

A villamosberendezés-összeszerelők felelnek az elektromos berendezések összeszereléséért. Összeszerelik a termékek részegységeit és vezetékeit a tervrajzoknak megfelelően.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 57.2%-a jelölte

**Holland-kód:** RCI — R 92 · I 21 · A 0 · S 2 · E 7 · C 53

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.29) · O cél 43±25 (w=0.24) · A cél 44±26 (w=0.19) · X cél 45±27 (w=0.16)

**HEXACO abszolút szint:** H 32 · E 65 · X 32 · A 30 · C 38 · O 32

### Erős- és gyengeáramú berendezések összeszerelői

`51-9141.00` · **ISCO-08 8212** Erős- és gyengeáramú berendezések összeszerelői · **FEOR-08:** 8212 Villamosberendezés-összeszerelő · ESCO `8212.3.6` · EN: Semiconductor Processing Technicians · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* elektronikus berendezések összeszerelője, elektronikusberendezés-összeszerelő, SMT-gépkezelő, felületszerelőgép-kezelő, SMT gépkezelő operátor, hullámforrasztógép-kezelő

Az elektronikus berendezések összeszerelői felelősek az elektronikus berendezések és rendszerek összeszereléséért. Az elektromos alkatrészeket és vezetékeket tervrajzok és összeállítási rajzok szerint szerelik össze.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 83.8%-a jelölte

**Holland-kód:** RCI — R 90 · I 34 · A 0 · S 2 · E 8 · C 69

**HEXACO differenciál cél-profil:** C cél 62±22 (w=0.39) · O cél 41±24 (w=0.31) · X cél 42±25 (w=0.27)

**HEXACO abszolút szint:** H 40 · E 57 · X 36 · A 40 · C 51 · O 36

### Mozdonyvezetők

`53-4011.00` · **ISCO-08 8311** Mozdonyvezetők · **FEOR-08:** 8411 Mozdonyvezető; 8414 Metróvezető · ESCO `8311` · EN: Locomotive Engineers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* mozdonyvezető

_(HU leírás nincs; EN:)_ Drive electric, diesel-electric, steam, or gas-turbine-electric locomotives to transport passengers or freight. Interpret train orders, electronic or manual signals, and railroad rules and regulations.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 67.8%-a jelölte

**Holland-kód:** RCI — R 100 · I 42 · A 0 · S 14 · E 15 · C 61

**HEXACO differenciál cél-profil:** O cél 36±21 (w=0.30) · C cél 61±23 (w=0.23) · E cél 39±23 (w=0.23) · X cél 41±24 (w=0.20)

**HEXACO abszolút szint:** H 46 · E 46 · X 40 · A 46 · C 57 · O 37

### Vasúti fékezők, jelzőberendezés- és váltókezelők

`49-9097.00` · **ISCO-08 8312** Vasúti fékezők, jelzőberendezés- és váltókezelők · **FEOR-08:** 8412 Vasútijármű-vezetéshez kapcsolódó foglalkozású · ESCO `8312.1` · EN: Signal and Track Switch Repairers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* vasúti átjárót biztosító jelzőberendezés kezelője, vasúti váltókezelő, váltókezelő, kocsirendező, tolatásvezető, tolatómunkás

A vasúti átjárót biztosító jelzőberendezések kezelői a vasúti átjárók védelmére szolgáló berendezéseket üzemeltetnek a biztonsági előírásoknak megfelelően.

**Végzettségi minimum:** szakma / technikus (Job Zone 3) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 34.0%-a jelölte

**Holland-kód:** RCI — R 92 · I 27 · A 0 · S 3 · E 0 · C 58

**HEXACO differenciál cél-profil:** C cél 61±22 (w=0.36) · X cél 43±25 (w=0.23) · A cél 45±27 (w=0.14) · O cél 46±27 (w=0.13)

**HEXACO abszolút szint:** H 42 · E 53 · X 39 · A 41 · C 52 · O 42

### Vasúti fékezők, jelzőberendezés- és váltókezelők

`53-4013.00` · **ISCO-08 8312** Vasúti fékezők, jelzőberendezés- és váltókezelők · **FEOR-08:** 8412 Vasútijármű-vezetéshez kapcsolódó foglalkozású · ESCO `8312.2` · EN: Rail Yard Engineers, Dinkey Operators, and Hostlers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* vasúti váltókezelő, váltókezelő, kocsirendező, tolatásvezető, tolatómunkás

A vasúti váltókezelők segítséget nyújtanak a forgalomirányító feladatainak ellátásához. A vasúti forgalomirányítási utasítások szerint, a szabályozásnak és a biztonsági szabályoknak megfelelően kapcsolókat és jelzéseket működtetnek.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 82.5%-a jelölte

**Holland-kód:** RCE — R 96 · I 17 · A 0 · S 13 · E 18 · C 55

**HEXACO differenciál cél-profil:** O cél 36±20 (w=0.37) · E cél 43±25 (w=0.18) · C cél 56±26 (w=0.15) · A cél 55±26 (w=0.14)

**HEXACO abszolút szint:** H 44 · E 50 · X 41 · A 47 · C 49 · O 35

### Vasúti fékezők, jelzőberendezés- és váltókezelők

`53-4022.00` · **ISCO-08 8312** Vasúti fékezők, jelzőberendezés- és váltókezelők · **FEOR-08:** 8412 Vasútijármű-vezetéshez kapcsolódó foglalkozású · ESCO `8312` · EN: Railroad Brake, Signal, and Switch Operators and Locomotive Firers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* vasúti átjárót biztosító jelzőberendezés kezelője, vasúti váltókezelő, váltókezelő, kocsirendező, tolatásvezető, tolatómunkás

_(HU leírás nincs; EN:)_ Operate or monitor railroad track switches or locomotive instruments. May couple or uncouple rolling stock to make up or break up trains. Watch for and relay traffic signals. May inspect couplings, air hoses, journal boxes, and hand brakes.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: —

**Holland-kód:** RCI — R 100 · I 18 · A 0 · S 4 · E 7 · C 54

**HEXACO differenciál cél-profil:** O cél 34±19 (w=0.33) · A cél 58±25 (w=0.17) · C cél 57±25 (w=0.14) · X cél 44±26 (w=0.13)

**HEXACO abszolút szint:** H 46 · E 51 · X 40 · A 49 · C 50 · O 34

### Személy- és tehergépkocsi-vezetők, taxisofőrök

`53-3053.00` · **ISCO-08 8322** Személy- és tehergépkocsi-vezetők, taxisofőrök · **FEOR-08:** 8416 Személygépkocsi-vezető · ESCO `8322.3` · EN: Shuttle Drivers and Chauffeurs · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* halottaskocsi-vezető, magánsofőr, londíner, komornyik, taxis, mikrobuszvezető

A halottaskocsi-vezetők speciális járműveket működtetik és tartanak karban, hogy az elhunyt személyeket otthonukból, kórházakból, illetve a ravatalozóból a végső nyughelyükre szállítsák.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 56.2%-a jelölte

**Holland-kód:** RCS — R 92 · I 0 · A 0 · S 34 · E 19 · C 53

**HEXACO differenciál cél-profil:** O cél 33±19 (w=0.34) · H cél 62±22 (w=0.25) · A cél 62±22 (w=0.24)

**HEXACO abszolút szint:** H 55 · E 54 · X 47 · A 54 · C 44 · O 36

### erdőgazdasági gépkezelő

`45-4022.00` · **ISCO-08 8341** Mezőgazdasági és erdészeti mobilgépek kezelői · **FEOR-08:** 8421 Mezőgazdasági, erdőgazdasági, növényvédő gép kezelője · ESCO `8341.1` · EN: Logging Equipment Operators

*Piaci megnevezések (ESCO):* erdészeti rakodógép kezelője, erdészeti gépésztechnikus

Az erdőgazdasági gépkezelők speciális felszereléssel ellátott műveleteket hajtanak végre az erdő területén, fagazdálkodást, -kivágást, -kitermelést és faszállítást végezve fogyasztási cikkek és ipari termékek előállítása céljából.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 55.4%-a jelölte

**Holland-kód:** RCI — R 97 · I 14 · A 0 · S 2 · E 2 · C 57

**HEXACO differenciál cél-profil:** E cél 38±22 (w=0.30) · C cél 59±24 (w=0.24) · O cél 42±25 (w=0.20) · X cél 45±27 (w=0.12)

**HEXACO abszolút szint:** H 36 · E 50 · X 38 · A 39 · C 45 · O 37

### Földmozgató és hasonló gépek kezelői

`47-5022.00` · **ISCO-08 8342** Földmozgató és hasonló gépek kezelői · **FEOR-08:** 8422 Földmunkagép és hasonló könnyű- és nehézgép kezelője · ESCO `8342.10` · EN: Excavating and Loading Machine and Dragline Operators, Surface Mining · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* külszíni bányászati nehézgépkezelő, külszíni fejtő, nehézgépkezelő főfejtőben, buldózerkezelő, munkagépkezelő, markológép-kezelő

A külszíni bányászati nehézgépkezelő olyan nagy teljesítményű berendezéseket szabályoznak, mint például exkavátorok és leürítő teherautók, amely művelethez gyakran jelentős tértudatra van szükség nyers ásványok, ércek kitermelésére, rakodására és szállítására, beleértve a homokot, a követ és az agyagot, valamint a kőbányák és a külszíni bányák fedőrétegeit.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 71.1%-a jelölte

**Holland-kód:** RCI — R 100 · I 23 · A 0 · S 0 · E 0 · C 42

**HEXACO differenciál cél-profil:** O cél 42±24 (w=0.26) · C cél 58±24 (w=0.25) · E cél 43±26 (w=0.20) · A cél 46±27 (w=0.13)

**HEXACO abszolút szint:** H 34 · E 55 · X 37 · A 36 · C 42 · O 35

### cölöpverő kalapács kezelője

`47-2072.00` · **ISCO-08 8342** Földmozgató és hasonló gépek kezelői · **FEOR-08:** 8422 Földmunkagép és hasonló könnyű- és nehézgép kezelője · ESCO `8342.5` · EN: Pile Driver Operators

*Piaci megnevezések (ESCO):* cölöpverőgép-kezelő, cölöpverő gép kezelője, buldózerkezelő, munkagépkezelő, markológép-kezelő, exkavátorkezelő

A cölöpverő kalapács kezelői nehézberendezéssel dolgoznak, amely cölöpöket pozícionál, és azokat kötélmechanizmus segítségével a talajba kalapácsolja.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 52.6%-a jelölte

**Holland-kód:** RCI — R 100 · I 16 · A 0 · S 0 · E 2 · C 44

**HEXACO differenciál cél-profil:** C cél 59±24 (w=0.25) · O cél 41±24 (w=0.24) · A cél 42±24 (w=0.23) · E cél 44±26 (w=0.17)

**HEXACO abszolút szint:** H 36 · E 56 · X 35 · A 32 · C 41 · O 34

### kotrógépkezelő

`53-7031.00` · **ISCO-08 8342** Földmozgató és hasonló gépek kezelői · **FEOR-08:** 8422 Földmunkagép és hasonló könnyű- és nehézgép kezelője · ESCO `8342.2` · EN: Dredge Operators

*Piaci megnevezések (ESCO):* mezőgazdasági kotrógépkezelő, munkagépkezelő, markológép-kezelő, exkavátorkezelő, markológép kezelője

A kotrógépkezelők ipari berendezésekkel dolgoznak a víz alatti anyagok eltávolítása céljából annak érdekében, hogy a terület a hajók számára átjárható legyen, kikötők létrehozására, valamint kábelfektetésre vagy más célokra, és az anyagot a kívánt helyre szállítják.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 80.0%-a jelölte

**Holland-kód:** RCI — R 94 · I 33 · A 0 · S 6 · E 22 · C 41

**HEXACO differenciál cél-profil:** O cél 41±24 (w=0.35) · C cél 56±26 (w=0.24) · E cél 44±26 (w=0.23)

**HEXACO abszolút szint:** H 35 · E 56 · X 38 · A 38 · C 39 · O 34

### Daruk, emelők és hasonló gépek kezelői

`53-7041.00` · **ISCO-08 8343** Daruk, emelők és hasonló gépek kezelői · **FEOR-08:** 8424 Daru, felvonó és hasonló anyagmozgató gép kezelője · ESCO `8343.2` · EN: Hoist and Winch Operators · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* konténerdaru kezelője, darukormányos, darukezelő, mobildaru-kezelő, autódarus, toronydaru-kezelő

A konténerdaruk kezelői az emelőszerkezetet tartó konzolos tartókkal felszerelt elektromosan hajtott darukat működtetnek rakomány ki- vagy berakodásához. A tornyokat a hajók mentén mozgatják, a konzolos tartókat pedig fedélzetre vagy raktérbe irányítják.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 41.2%-a jelölte

**Holland-kód:** RCI — R 98 · I 9 · A 1 · S 8 · E 8 · C 39

**HEXACO differenciál cél-profil:** O cél 40±23 (w=0.44) · C cél 55±27 (w=0.20) · X cél 46±27 (w=0.18) · E cél 47±28 (w=0.12)

**HEXACO abszolút szint:** H 36 · E 59 · X 35 · A 37 · C 39 · O 33

### Hajók fedélzeti személyzete és hasonló foglalkozásúak

`45-3031.00` · **ISCO-08 8350** Hajók fedélzeti személyzete és hasonló foglalkozásúak · **FEOR-08:** 8430 Hajószemélyzet, kormányos, matróz · ESCO `8350.1` · EN: Fishing and Hunting Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* fedélzetmester halászhajón, fedélzetmester, matróz halászhajón, matróz, halász

A fedélzetmesterek a hajósszemélyzet irányítják a fedélzeten és a halászat során, a felettestől kapott parancsok végrehajtására.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 45.0%-a jelölte

**Holland-kód:** RCI — R 100 · I 21 · A 1 · S 0 · E 16 · C 38

**HEXACO differenciál cél-profil:** E cél 44±26 (w=0.25) · C cél 55±27 (w=0.20) · O cél 54±27 (w=0.17) · A cél 54±28 (w=0.14)

**HEXACO abszolút szint:** H 36 · E 55 · X 38 · A 41 · C 36 · O 44

### hajókarbantartó

`53-5011.00` · **ISCO-08 8350** Hajók fedélzeti személyzete és hasonló foglalkozásúak · **FEOR-08:** 8430 Hajószemélyzet, kormányos, matróz · ESCO `8350.7` · EN: Sailors and Marine Oilers

*Piaci megnevezések (ESCO):* matróz, hajótakarító, fedélzetmester halászhajón, fedélzetmester, tanulómatróz, matróz gyakornok

A hajókarbantartók a hajó kapitányának és a személyzet bármely magasabb beosztású munkatársának utasításait végzik el a hajók üzemben tartása érdekében.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 52.4%-a jelölte

**Holland-kód:** RCI — R 100 · I 27 · A 0 · S 4 · E 24 · C 49

**HEXACO differenciál cél-profil:** E cél 39±23 (w=0.25) · O cél 41±24 (w=0.20) · A cél 59±24 (w=0.19) · H cél 43±25 (w=0.15)

**HEXACO abszolút szint:** H 42 · E 46 · X 44 · A 51 · C 50 · O 40


## 9 — Szakképzettséget nem igénylő (egyszerű) foglalkozások

### Mosónők és vasalónők

`51-6021.00` · **ISCO-08 9121** Mosónők és vasalónők · **FEOR-08:** 9113 Kézi mosó, vasaló · ESCO `9121.2` · EN: Pressers, Textile, Garment, and Related Materials · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gépi vasaló, ruhaneműhöz és kapcsolódó anyagokhoz használt vasalógép kezelője, vasalónő

A gépi vasalók ruházati termékeket alakítanak gőzvasaló, vákuumvasaló vagy kézi vasalók segítségével.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 59.2%-a jelölte

**Holland-kód:** RCA — R 90 · I 8 · A 22 · S 2 · E 0 · C 42

**HEXACO differenciál cél-profil:** A cél 44±26 (w=0.26) · O cél 44±26 (w=0.24) · C cél 56±26 (w=0.23) · X cél 47±28 (w=0.13)

**HEXACO abszolút szint:** H 32 · E 64 · X 32 · A 29 · C 32 · O 32

### Egyéb takarító foglalkozásúak

`51-9192.00` · **ISCO-08 9129** Egyéb takarító foglalkozásúak · **FEOR-08:** 9119 Egyéb takarító és kisegítő · ESCO `9129` · EN: Cleaning, Washing, and Metal Pickling Equipment Operators and Tenders · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Operate or tend machines to wash or clean products, such as barrels or kegs, glass items, tin plate, food, pulp, coal, plastic, or rubber, to remove impurities.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 59.8%-a jelölte

**Holland-kód:** RCI — R 100 · I 11 · A 0 · S 0 · E 0 · C 57

**HEXACO differenciál cél-profil:** O cél 40±23 (w=0.33) · C cél 58±25 (w=0.26) · A cél 43±25 (w=0.24)

**HEXACO abszolút szint:** H 33 · E 64 · X 34 · A 29 · C 36 · O 31

### erdei munkás

`45-4011.00` · **ISCO-08 9215** Képesítést nem igénylő erdészeti foglalkozásúak · **FEOR-08:** 9332 Egyszerű erdészeti, vadászati és halászati foglalkozású · ESCO `9215.1` · EN: Forest and Conservation Workers

*Piaci megnevezések (ESCO):* erdőmunkás, erdésztechnikus

Az erdei munkások számos feladatot látnak el a fák, az erdős területek és az erdők gondozása és kezelése érdekében. E tevékenységek közé tartozik a fák ültetése, metszése, ritkítása és kivágása, valamint a kártevők, betegségek és károk elleni védelme.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 43.6%-a jelölte

**Holland-kód:** RCI — R 100 · I 39 · A 0 · S 28 · E 34 · C 51

**HEXACO differenciál cél-profil:** A cél 59±24 (w=0.28) · E cél 44±26 (w=0.19) · X cél 44±26 (w=0.19) · O cél 44±26 (w=0.17)

**HEXACO abszolút szint:** H 42 · E 52 · X 39 · A 48 · C 43 · O 40

### Magasépítő segédmunkások

`47-4031.00` · **ISCO-08 9313** Magasépítő segédmunkások · **FEOR-08:** 9329 Egyéb egyszerű építőipari foglalkozású · ESCO `9313.1` · EN: Fence Erectors · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* építőipari munkás, építőmunkás, építőipari technikus

Az építőipari munkások építési tevékenységeket készítenek elő és végeznek el építési területeken. Előkészítő és tisztítási munkálatokat végeznek a szakosodott építőipari munkások segítése érdekében.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 47.5%-a jelölte

**Holland-kód:** RCI — R 100 · I 18 · A 6 · S 6 · E 0 · C 45

**HEXACO differenciál cél-profil:** O cél 44±26 (w=0.36) · C cél 56±26 (w=0.32) · A cél 47±28 (w=0.16)

**HEXACO abszolút szint:** H 35 · E 62 · X 38 · A 35 · C 37 · O 36

### Máshová nem sorolható képesítést nem igénylő ipari foglalkozásúak

`51-9198.00` · **ISCO-08 9329** Máshová nem sorolható képesítést nem igénylő ipari foglalkozásúak · **FEOR-08:** 9310 Egyszerű ipari foglalkozású · ESCO `9329.1` · EN: Helpers--Production Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gyári segédmunkás, gyári kisegítő

A gyári segédmunkások a gépkezelők és a termékösszeszerelők munkáját segítik. Tisztítják a gépeket és a munkaterületeket. A gyári segédmunkások gondoskodnak a készletek és az anyagok feltöltéséről.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 49.3%-a jelölte

**Holland-kód:** RCE — R 92 · I 5 · A 2 · S 11 · E 15 · C 57

**HEXACO differenciál cél-profil:** O cél 42±25 (w=0.30) · A cél 57±25 (w=0.28) · H cél 56±26 (w=0.23)

**HEXACO abszolút szint:** H 38 · E 64 · X 35 · A 39 · C 29 · O 33

### Rakodómunkások

`53-7121.00` · **ISCO-08 9333** Rakodómunkások · **FEOR-08:** 9223 Rakodómunkás · ESCO `9333` · EN: Tank Car, Truck, and Ship Loaders · ⚠️ **név-review kell**

_(HU leírás nincs; EN:)_ Load and unload chemicals and bulk solids, such as coal, sand, and grain, into or from tank cars, trucks, or ships, using material moving equipment. May perform a variety of other tasks relating to shipment of products.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 81.4%-a jelölte

**Holland-kód:** RCI — R 99 · I 16 · A 0 · S 0 · E 5 · C 63

**HEXACO differenciál cél-profil:** O cél 40±23 (w=0.30) · C cél 58±25 (w=0.23) · A cél 44±26 (w=0.18) · X cél 45±27 (w=0.15)

**HEXACO abszolút szint:** H 40 · E 57 · X 37 · A 36 · C 45 · O 35

### Gyorsételek készítői

`35-2015.00` · **ISCO-08 9411** Gyorsételek készítői · **FEOR-08:** 9235 Gyorséttermi eladó · ESCO `9411.2` · EN: Cooks, Short Order · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* gyorskiszolgáló éttermi személyzet, gyorséttermi személyzet, gyorskiszolgáló étterem személyzetének tagja

A gyorskiszolgáló éttermi személyzet tagjai ételt és italokat készítenek, főznek és szolgálnak fel gyorskiszolgáló környezetben.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 66.3%-a jelölte

**Holland-kód:** RCE — R 86 · I 0 · A 21 · S 36 · E 45 · C 56

**HEXACO differenciál cél-profil:** E cél 39±23 (w=0.29) · O cél 40±24 (w=0.26) · A cél 58±24 (w=0.23) · X cél 54±27 (w=0.11)

**HEXACO abszolút szint:** H 41 · E 49 · X 46 · A 47 · C 36 · O 37

### Utcai árusok (kivéve az élelmiszerárusokat)

`41-9091.00` · **ISCO-08 9520** Utcai árusok (kivéve az élelmiszerárusokat) · **FEOR-08:** 5115 Piaci, utcai árus · ESCO `9520` · EN: Door-to-Door Sales Workers, News and Street Vendors, and Related Workers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* utcai árus, vásári kereskedő, piaci árus

_(HU leírás nincs; EN:)_ Sell goods or services door-to-door or on the street.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 56.5%-a jelölte

**Holland-kód:** ECR — R 43 · I 0 · A 17 · S 30 · E 75 · C 62

**HEXACO differenciál cél-profil:** X cél 78±12 (w=0.36) · H cél 27±15 (w=0.29) · E cél 34±19 (w=0.20)

**HEXACO abszolút szint:** H 33 · E 39 · X 68 · A 46 · C 44 · O 49

### Kézbesítők, csomagkihordók és hordárok

`39-6011.00` · **ISCO-08 9621** Kézbesítők, csomagkihordók és hordárok · **FEOR-08:** 9233 Hivatalsegéd, kézbesítő; 9234 Hordár, csomagkihordó · ESCO `9621.2` · EN: Baggage Porters and Bellhops · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* londiner, londinerek, hordár

A londinerek fogadják a vendégeket a szálláshelyeken, szállítják poggyászaikat, és eseti szolgáltatásokat nyújtanak, például tisztítást.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: 8 általános alatt / nincs formális követelmény · a válaszadók 41.8%-a jelölte

**Holland-kód:** RCS — R 65 · I 0 · A 0 · S 42 · E 26 · C 64

**HEXACO differenciál cél-profil:** H cél 66±19 (w=0.26) · O cél 35±20 (w=0.24) · A cél 64±20 (w=0.23) · C cél 40±23 (w=0.17)

**HEXACO abszolút szint:** H 59 · E 53 · X 51 · A 56 · C 35 · O 37

### Mérőóra-leolvasók és árusító automaták pénzbegyűjtői

`49-9091.00` · **ISCO-08 9623** Mérőóra-leolvasók és árusító automaták pénzbegyűjtői · **FEOR-08:** 9232 Mérőóra-leolvasó és hasonló egyszerű foglalkozású · ESCO `9623.2` · EN: Coin, Vending, and Amusement Machine Servicers and Repairers · ⚠️ **név-review kell**

*Piaci megnevezések (ESCO):* automataüzemeltető, fénykép-automata üzemeltetője, automatatöltő

Az automataüzemeltetők beszedik a készpénzt, elvégzik a gép vizuális ellenőrzését, ellátják az alapvető karbantartást, és utántöltik az árukat az automata berendezésekben és egyéb érmés gépekben.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 91.6%-a jelölte

**Holland-kód:** RCE — R 85 · I 14 · A 0 · S 4 · E 15 · C 78

**HEXACO differenciál cél-profil:** H cél 55±26 (w=0.26) · X cél 46±27 (w=0.22) · C cél 54±27 (w=0.21) · A cél 47±28 (w=0.13)

**HEXACO abszolút szint:** H 42 · E 58 · X 37 · A 38 · C 40 · O 40

### mérőóra-leolvasó

`43-5041.00` · **ISCO-08 9623** Mérőóra-leolvasók és árusító automaták pénzbegyűjtői · **FEOR-08:** 9232 Mérőóra-leolvasó és hasonló egyszerű foglalkozású · ESCO `9623.1` · EN: Meter Readers, Utilities

*Piaci megnevezések (ESCO):* díjbeszedő-leolvasó, gázóra-leolvasó

A mérőóra-leolvasók a lakó- és kereskedelmi vagy ipari épületeket és létesítményeket keresik fel annak érdekében, hogy rögzítsék a gáz-, víz-, elektromosáram- és egyéb közműhasználat-mérőórák állását.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 71.0%-a jelölte

**Holland-kód:** CRI — R 65 · I 26 · A 0 · S 19 · E 5 · C 93

**HEXACO differenciál cél-profil:** H cél 65±20 (w=0.45) · O cél 39±23 (w=0.32)

**HEXACO abszolút szint:** H 48 · E 60 · X 38 · A 38 · C 38 · O 34

### öltözőfelelős

`39-3093.00` · **ISCO-08 9629** Máshová nem sorolható képesítést nem igénylő foglalkozásúaki foglalkozásúaki és szállítási foglalkozású · **FEOR-08:** 9237 Háztartási alkalmazott; 9239 Egyéb, máshova nem sorolható egyszerű szolgáltatási · ESCO `9629.6` · EN: Locker Room, Coatroom, and Dressing Room Attendants

*Piaci megnevezések (ESCO):* tornatermi alkalmazott, sportközponti alkalmazott, ruhatáros, ruhatárfelelős, önkiszolgáló mosodai ügyeletes, mosodai kisegítő

Az öltözőfelelősök az ügyfeleket segítik a személyes tárgyak és cikkek kezelésében az öltözőben, általában a sport vagy a színház területén.

**Végzettségi minimum:** tanfolyam / rövid képzés (Job Zone 2) · tipikus: érettségi (vagy azzal egyenértékű) · a válaszadók 64.8%-a jelölte

**Holland-kód:** CRS — R 53 · I 0 · A 9 · S 52 · E 25 · C 76

**HEXACO differenciál cél-profil:** H cél 68±18 (w=0.33) · O cél 40±23 (w=0.19) · A cél 59±24 (w=0.17) · C cél 41±24 (w=0.17)

**HEXACO abszolút szint:** H 52 · E 62 · X 42 · A 46 · C 28 · O 35


---

# III. rész — kihagyásra javasolt (T4, 38 tétel)

A magyar munkaerőpiacon nem értelmezhető vagy elhanyagolható (pl. amerikai iskolarendszer-specifikus, olaj-/gázkitermelés, mélybányászat, tengeri hajózás, kihalt irodai szerepek).

| O\*NET-SOC | EN cím | HU név |
|---|---|---|
| `19-1031.02` | Range Managers | Mezőgazdasági és erdőgazdálkodási termelési vezetők 1311 Mezőgazdasági, erdészeti, halászati és vadászati |
| `11-9179.01` | Fitness and Wellness Coordinators | Sport-, rekreációs és kulturális központok vezetői |
| `17-2121.00` | Marine Engineers and Naval Architects | Máshová nem sorolható mérnökök |
| `29-1125.00` | Recreational Therapists | rekreációs terapeuta |
| `25-3031.00` | Substitute Teachers, Short-Term | Máshová nem sorolható oktatási foglalkozásúak |
| `21-1091.00` | Health Education Specialists | Stratégiai fejlesztők, elemzők |
| `13-1041.06` | Coroners | esküdtszéki koordinátor |
| `15-1299.03` | Document Management Specialists | Levél- és irattárosok, muzeológusok |
| `53-7073.00` | Wellhead Pumpers | Kőolaj- és földgázfinomító berendezések kezelői |
| `29-1071.00` | Physician Assistants | Orvosi asszisztensek |
| `29-1071.01` | Anesthesiologist Assistants | Máshová nem sorolható egészségügyi foglalkozásúak |
| `31-9094.00` | Medical Transcriptionists | orvosipraxis-menedzser |
| `33-9031.00` | Gambling Surveillance Officers and Gambling Investigators | Máshová nem sorolható közhivatali ügyintézők |
| `35-2013.00` | Cooks, Private Household | Konyhafőnökök |
| `39-3021.00` | Motion Picture Projectionists | Műsorszórási és audiovizuális technikusok |
| `43-9022.00` | Word Processors and Typists | gyors- és gépíró |
| `39-3012.00` | Gambling and Sports Book Writers and Runners | Bukmékerek, krupiék és hasonló foglalkozásúak |
| `41-2012.00` | Gambling Change Persons and Booth Cashiers | Bukmékerek, krupiék és hasonló foglalkozásúak |
| `43-2011.00` | Switchboard Operators, Including Answering Service | telefonközpont-kezelő |
| `43-2021.00` | Telephone Operators | telefonközpont-kezelő |
| `39-5093.00` | Shampooers | Fodrászok |
| `33-3052.00` | Transit and Railroad Police | Rendőrök |
| `25-9021.00` | Farm and Home Management Educators | Vegyes gazdálkodók |
| `51-2061.00` | Timing Device Assemblers and Adjusters | Precíziósműszer-gyártók és -javítók |
| `51-9071.06` | Gem and Diamond Workers | Ékszerészek és nemesfém-megmunkálók |
| `49-9092.00` | Commercial Divers | ipari búvár |
| `47-5012.00` | Rotary Drill Operators, Oil and Gas | Bányászok és kőfejtők |
| `47-5041.00` | Continuous Mining Machine Operators | Bányászok és kőfejtők |
| `47-5043.00` | Roof Bolters, Mining | Bányászok és kőfejtők |
| `47-5044.00` | Loading and Moving Machine Operators, Underground Mining | Bányászok és kőfejtők |
| `47-5011.00` | Derrick Operators, Oil and Gas | Kútfúrók és hasonló foglalkozásúak |
| `47-5013.00` | Service Unit Operators, Oil and Gas | Kútfúrók és hasonló foglalkozásúak |
| `47-5071.00` | Roustabouts, Oil and Gas | fúrósegédmunkás |
| `51-9151.00` | Photographic Process Workers and Processing Machine Operators | Fényképészeti termékeket gyártó gépek kezelői |
| `45-2091.00` | Agricultural Equipment Operators | Mezőgazdasági és erdészeti mobilgépek kezelői |
| `53-5022.00` | Motorboat Operators | Hajók fedélzeti személyzete és hasonló foglalkozásúak |
| `47-5081.00` | Helpers--Extraction Workers | Bányászati és kőfejtő segédmunkások |
| `53-6011.00` | Bridge and Lock Tenders | Mélyépítő segédmunkások |

---

## Függelék A — név-review lista

Ezeknél a tételeknél a magyar megnevezés a hivatalos ISCO/FEOR csoportnévre esett vissza, mert az ESCO-tétel címe nem egyezett meggyőzően az O\*NET foglalkozással. Itt érdemes kézzel dönteni a végleges magyar névről — a jelöltek fel vannak sorolva.

| O\*NET-SOC | EN cím | jelenlegi HU név | ESCO-jelöltek |
|---|---|---|---|
| `11-1031.00` | Legislators | Törvényhozók | önkormányzati képviselő, megyei önkormányzati képviselő, települési önkormányzati képviselő, miniszter |
| `33-1012.00` | First-Line Supervisors of Police and Detectives | Országos közigazgatási vezetők | rendőrkapitány, rendőr, rendőrnő |
| `11-1021.00` | General and Operations Managers | Ügyvezetők és vezérigazgatók | cégvezető, ügyvezető, csoportvezető, ügyvezető igazgató |
| `11-3031.01` | Treasurers and Controllers | Pénzügyi vezetők | pénzügyi vezető, pénzügyi igazgató |
| `11-3111.00` | Compensation and Benefits Managers | Emberi erőforrás-gazdálkodási vezetők | — |
| `11-3121.00` | Human Resources Managers | Emberi erőforrás-gazdálkodási vezetők | — |
| `11-9199.08` | Loss Prevention Managers | Máshová nem sorolható üzleti és igazgatási vezetők | üzleti szolgáltatási vezető, aktuáriusi tanácsadó szolgálat vezetője, reklámügynökség vezetője |
| `13-1082.00` | Project Management Specialists | Máshová nem sorolható üzleti és igazgatási vezetők | projektmenedzser, projektkoordinátor, vezető projektmenedzser |
| `11-9041.00` | Architectural and Engineering Managers | Kutatási és fejlesztési vezetők | — |
| `11-9121.00` | Natural Sciences Managers | Kutatási és fejlesztési vezetők | kutatás-fejlesztési menedzser, kutatási és fejlesztési tevékenységet folytató egység vezetője, kutatás-fejlesztési egység/szervezet vezetője |
| `11-9121.01` | Clinical Research Coordinators | Kutatási és fejlesztési vezetők | kutatás-fejlesztési menedzser, kutatási és fejlesztési tevékenységet folytató egység vezetője, kutatás-fejlesztési egység/szervezet vezetője |
| `11-9013.00` | Farmers, Ranchers, and Other Agricultural Managers | Mezőgazdasági és erdőgazdálkodási termelési vezetők 1311 Mezőgazdasági, erdészeti, halászati és vadászati | — |
| `19-1031.02` | Range Managers | Mezőgazdasági és erdőgazdálkodási termelési vezetők 1311 Mezőgazdasági, erdészeti, halászati és vadászati | erdész, erdőgazdálkodó, erdészetvezető |
| `45-1011.00` | First-Line Supervisors of Farming, Fishing, and Forestry Workers | Halgazdálkodási és halászati termelési vezetők | akvakultúra-betakarítási menedzser, halgazdaság halászati menedzsere, akvakultúra-betakarítási felügyelő, akvakultúrás-tenyésztési menedzser |
| `11-3051.00` | Industrial Production Managers | Feldolgozóipari vezetők | — |
| `11-3051.01` | Quality Control Systems Managers | Feldolgozóipari vezetők | — |
| `11-3061.00` | Purchasing Managers | Beszerzési, elosztási értékesítési és hasonló vezetők | — |
| `11-3071.04` | Supply Chain Managers | Beszerzési, elosztási értékesítési és hasonló vezetők | logisztikai és disztribúciós vezető, logisztikai vezető, disztribúciós vezető |
| `11-3021.00` | Computer and Information Systems Managers | Információs szolgáltatások vezetői folytató egység vezetője | informatikai igazgató, informatikai igazgatók, chief information officer, infokommunikációs üzemeltetési menedzser |
| `11-9031.00` | Education and Childcare Administrators, Preschool and Daycare | Gyermekgondozási szolgáltatások vezetői | gyermekgondozási koordinátor, szünidei tevékenységek koordinátora, napközis koordinátor, gyermeknapközi vezetője |
| `11-9111.00` | Medical and Health Services Managers | Egészségügyi szolgáltatások vezetői | egészségügyi tevékenységet folytató egység vezetője, egészségügyi szolgáltató egység/szervezet vezetője, műtő vezetője |
| `11-9032.00` | Education Administrators, Kindergarten through Secondary | Oktatási vezetők | iskolaigazgató, iskolavezető, oktatási igazgató |
| `11-9033.00` | Education Administrators, Postsecondary | Oktatási vezetők | iskolaigazgató, iskolavezető, oktatási igazgató |
| `11-3012.00` | Administrative Services Managers | Máshová nem sorolható szakmai szolgáltatások vezetői 1329 Egyéb szolgáltatást nyújtó egység vezetője | könyvtári igazgató, könyvtárvezető, büntetés-végrehajtási intézet vezetője, börtönparancsnok |
| `11-9131.00` | Postmasters and Mail Superintendents | Máshová nem sorolható szakmai szolgáltatások vezetői 1329 Egyéb szolgáltatást nyújtó egység vezetője | — |
| `33-1011.00` | First-Line Supervisors of Correctional Officers | Máshová nem sorolható szakmai szolgáltatások vezetői 1329 Egyéb szolgáltatást nyújtó egység vezetője | kereskedelmi galéria vezetője, művészeti galéria vezetője, galériai programvezető |
| `11-9051.00` | Food Service Managers | Étteremvezetők | konyhavezető étterem vezető, étterem vezetők, étterem menedzser |
| `35-1012.00` | First-Line Supervisors of Food Preparation and Serving Workers | Étteremvezetők | konyhavezető étterem vezető, étterem vezetők, étterem menedzser |
| `41-1011.00` | First-Line Supervisors of Retail Sales Workers | Kis- és nagykereskedelmi vezetők | áruházi osztály-, részlegvezető, outlet áruház részlegvezetője, áruházi osztályvezető, áruházvezető |
| `41-1012.00` | First-Line Supervisors of Non-Retail Sales Workers | Kis- és nagykereskedelmi vezetők | boltvezető, butik vezetője, kiskereskedelmi bolt vezetője, szupermarket vezetője |
| `11-9179.01` | Fitness and Wellness Coordinators | Sport-, rekreációs és kulturális központok vezetői | sportlétesítmény vezetője, uszodaigazgató, fitneszklub vezetője, rekreációs központ vezetője |
| `39-1022.00` | First-Line Supervisors of Personal Service Workers | Máshová nem sorolható szolgáltatások vezetői | turisztikai információs központ menedzser, turisztikai információs központ irányítója, turisztikai információs központ koordinátora, utazási iroda menedzsere |
| `19-2021.00` | Atmospheric and Space Scientists | Meteorológusok | meteorológus, tengeri meteorológus, meteorológiai kutató |
| `19-2042.00` | Geoscientists, Except Hydrologists and Geographers | Geológusok és geofizikusok | geológus, terepi felvételező geológus, negyedkorral foglalkozó geológus, geofizikus |
| `15-2011.00` | Actuaries | Matematikusok, biztosításmatematikusok (aktuáriusok) és statisztikusok és statisztikusok | aktuárius, biztosításmatematikus, biztosításmatematikai tanácsadó |
| `15-2031.00` | Operations Research Analysts | Matematikusok, biztosításmatematikusok (aktuáriusok) és statisztikusok és statisztikusok | — |
| `15-2041.01` | Biostatisticians | Matematikusok, biztosításmatematikusok (aktuáriusok) és statisztikusok és statisztikusok | statisztikus, bűnügyi statisztikus, energetikai statisztikus |
| `19-3022.00` | Survey Researchers | Matematikusok, biztosításmatematikusok (aktuáriusok) és statisztikusok és statisztikusok | demográfus, népességszociológus, népességstatisztikus |
| `19-1013.00` | Soil and Plant Scientists | Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak | biológus, halbiológus, gombaszakértő |
| `19-1042.00` | Medical Scientists, Except Epidemiologists | Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak | biológus, halbiológus, gombaszakértő, immunológus |
| `29-9092.00` | Genetic Counselors | Biológusok, botanikusok, zoológusok és hasonló foglalkozásúak foglalkozásúak | immunológus, immunológiai elemző, immunológiai kutató, farmakológus |
| `19-4012.01` | Precision Agriculture Technicians | Mezőgazdasági, erdészeti és halászati tanácsadók | mezőgazdasági kutató, mezőgazdasági szakértő, agrárszakértő, agronómus |
| `33-3031.00` | Fish and Game Wardens | Környezetvédelmi foglalkozásúak | erdő- és természetvédelmi mérnök, természetvédelmi felügyelő, természetvédelmi területkezelő, zöldterület-kezelésért felelős munkatárs |
| `13-1081.00` | Logisticians | Ipari és termelési mérnökök | karbantartási mérnök, karbantartó mérnök |
| `17-2051.00` | Civil Engineers | Építőmérnökök | — |
| `17-2051.01` | Transportation Engineers | Építőmérnökök | — |
| `17-2151.00` | Mining and Geological Engineers, Including Mining Safety Engineers | Építőmérnökök | — |
| `19-2041.00` | Environmental Scientists and Specialists, Including Health | Környezetvédelmi mérnökök | környezetmérnök, természetvédelmi mérnök, környezetvédelmi mérnök, környezetvédelmi szakértő |
| `17-2112.01` | Human Factors Engineers and Ergonomists | Máshová nem sorolható mérnökök | optikai mérnök, alkalmazásmérnök, alkalmazási mérnök |
| `17-2121.00` | Marine Engineers and Naval Architects | Máshová nem sorolható mérnökök | — |
| `17-2199.09` | Nanosystems Engineers | Máshová nem sorolható mérnökök | mennyiségi ellenőr, mennyiségellenőr, alkalmazásmérnök, alkalmazási mérnök |
| `17-2072.01` | Radio Frequency Identification Device Specialists | Gyengeáramú villamosmérnökök | elektronikai mérnök, elektronikus mérnök, repülőelektronikai mérnök |
| `15-1241.01` | Telecommunications Engineering Specialists | Telekommunikációs mérnökök | távközlési mérnök, telekommunikációs mérnök, távközlési mérnökök |
| `19-3051.00` | Urban and Regional Planners | Várostervezők és közlekedési mérnökök | földrendező mérnök, ingatlanrendező földmérnök, földmérő és földrendező mérnök, településtervező mérnök |
| `27-1011.00` | Art Directors | Tervezőgrafikusok és multimédiatervezők | speciáliseffekt-tervező, speciáliseffekt-tervező művész, digitáliseffekt-tervező művész, stoptrükkanimátor |
| `27-2012.04` | Talent Directors | Tervezőgrafikusok és multimédiatervezők | — |
| `29-1215.00` | Family Medicine Physicians | Általános orvosok | háziorvos |
| `29-1211.00` | Anesthesiologists | Szakorvosok | szakorvos |
| `29-1212.00` | Cardiologists | Szakorvosok | szakorvos |
| `29-1213.00` | Dermatologists | Szakorvosok | szakorvos |
| `29-1214.00` | Emergency Medicine Physicians | Szakorvosok | szakorvos |
| `29-1216.00` | General Internal Medicine Physicians | Szakorvosok | szakorvos |
| `29-1217.00` | Neurologists | Szakorvosok | szakorvos |
| `29-1218.00` | Obstetricians and Gynecologists | Szakorvosok | szakorvos |
| `29-1221.00` | Pediatricians, General | Szakorvosok | szakorvos |
| `29-1222.00` | Physicians, Pathologists | Szakorvosok | szakorvos |
| `29-1223.00` | Psychiatrists | Szakorvosok | szakorvos |
| `29-1229.01` | Allergists and Immunologists | Szakorvosok | szakorvos |
| `29-1229.02` | Hospitalists | Szakorvosok | — |
| `29-1229.03` | Urologists | Szakorvosok | szakorvos |
| `29-1229.04` | Physical Medicine and Rehabilitation Physicians | Szakorvosok | szakorvos |
| `29-1229.05` | Preventive Medicine Physicians | Szakorvosok | szakorvos |
| `29-1229.06` | Sports Medicine Physicians | Szakorvosok | szakorvos |
| `29-1241.00` | Ophthalmologists, Except Pediatric | Szakorvosok | szakorvos |
| `29-1242.00` | Orthopedic Surgeons, Except Pediatric | Szakorvosok | szakorvos |
| `29-1243.00` | Pediatric Surgeons | Szakorvosok | szakorvos |
| `29-1141.03` | Critical Care Nurses | Diplomás ápolók | szakápoló, ápoló, angiológiai szakápoló, osztályvezető ápoló |
| `29-1161.00` | Nurse Midwives | Szülésznők | szülész/szülésznő, független bába, bába |
| `29-9099.01` | Midwives | Szülésznők | szülész/szülésznő, független bába, bába |
| `29-1291.00` | Acupuncturists | Hagyományos és alternatív gyógyítók | alternatív gyógymódot alkalmazó terapeuta, természetgyógyász, alternatív terapeuta |
| `29-1299.01` | Naturopathic Physicians | Hagyományos és alternatív gyógyítók | alternatív gyógymódot alkalmazó terapeuta, természetgyógyász, alternatív terapeuta |
| `29-1131.00` | Veterinarians | Állatorvosok | állat manuálterapeuta, állat kiropraktőr, állat csontkovács, víziállatokkal foglalkozó egészségügyi szakember |
| `29-1021.00` | Dentists, General | Fogorvosok | fogszakorvos, dentofaciális szakorvos, szájsebész, fogorvos |
| `29-1022.00` | Oral and Maxillofacial Surgeons | Fogorvosok | fogorvos, gyermekfogász, kórházi fogorvos, fogszakorvos |
| `29-1023.00` | Orthodontists | Fogorvosok | fogorvos, gyermekfogász, kórházi fogorvos, fogszakorvos |
| `11-9161.00` | Emergency Management Directors | Környezet-, foglalkozás-egészségügyi és higiénés foglalkozásúak | vészhelyzeti koordinátor, katasztrófavédelmi koordinátor, veszélyhelyzeti koordinátor |
| `29-1123.00` | Physical Therapists | Fizioterapeuták | vezető fizioterapeuta, fizioterapeuta, gyógytornász, állat fizikoterapeuta |
| `29-1224.00` | Radiologists | Máshová nem sorolható egészségügyi foglalkozásúak | radiográfus, radioterapeuta, orvosi képalkotó diagnosztikai és terápiás berendezés kezelője |
| `29-9091.00` | Athletic Trainers | Máshová nem sorolható egészségügyi foglalkozásúak | állat csontkovács, állat csontkovácsok, állat manuálterapeuta, kiropraktőr |
| `19-4061.00` | Social Science Research Assistants | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1011.00` | Business Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1021.00` | Computer Science Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1022.00` | Mathematical Science Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1031.00` | Architecture Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1032.00` | Engineering Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1041.00` | Agricultural Sciences Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1042.00` | Biological Science Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1043.00` | Forestry and Conservation Science Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1051.00` | Atmospheric, Earth, Marine, and Space Sciences Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1052.00` | Chemistry Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1053.00` | Environmental Science Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1054.00` | Physics Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1061.00` | Anthropology and Archeology Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1062.00` | Area, Ethnic, and Cultural Studies Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1063.00` | Economics Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1064.00` | Geography Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1065.00` | Political Science Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1066.00` | Psychology Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1067.00` | Sociology Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1071.00` | Health Specialties Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1072.00` | Nursing Instructors and Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1081.00` | Education Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1082.00` | Library Science Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1111.00` | Criminal Justice and Law Enforcement Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1112.00` | Law Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1121.00` | Art, Drama, and Music Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1122.00` | Communications Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1123.00` | English Language and Literature Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1124.00` | Foreign Language and Literature Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1125.00` | History Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1126.00` | Philosophy and Religion Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1192.00` | Family and Consumer Sciences Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | oktató felsőoktatási intézményben, egyetemi tanár, főiskolai tanár |
| `25-1193.00` | Recreation and Fitness Studies Teachers, Postsecondary | Egyetemek és egyéb felsőoktatási intézmények oktatói | — |
| `25-1194.00` | Career/Technical Education Teachers, Postsecondary | Szakoktatók | szakoktató, műszaki szakoktató |
| `25-2032.00` | Career/Technical Education Teachers, Secondary School | Szakoktatók | szakoktató, műszaki szakoktató |
| `25-2022.00` | Middle School Teachers, Except Special and Career/Technical Education | Középiskolai tanárok | középiskolai tanár |
| `25-2023.00` | Career/Technical Education Teachers, Middle School | Középiskolai tanárok | középiskolai tanár |
| `25-2011.00` | Preschool Teachers, Except Special Education | Óvodapedagógusok | óvodapedagógus, óvodai kisgyermeknevelő, óvónő, Freinet-pedagógus |
| `25-2012.00` | Kindergarten Teachers, Except Special Education | Óvodapedagógusok | óvodapedagógus, óvodai kisgyermeknevelő, óvónő, Freinet-pedagógus |
| `25-9031.00` | Instructional Coordinators | Oktatás-módszertani foglalkozásúak | gyógypedagógiai koordinátor, gyógypedagógai igazgató, sajátos nevelési igényű tanulók oktatásával foglalkozó koordinátor, tantervfejlesztő |
| `25-2056.00` | Special Education Teachers, Elementary School | Gyógypedagógusok | gyógypedagógus, jelnyelvtanár, sajátos nevelési igényű tanulók oktatója |
| `25-2057.00` | Special Education Teachers, Middle School | Gyógypedagógusok | gyógypedagógus, jelnyelvtanár, sajátos nevelési igényű tanulók oktatója, tehetséggondozó pedagógus |
| `25-2059.01` | Adapted Physical Education Specialists | Gyógypedagógusok | gyógypedagógus, jelnyelvtanár, sajátos nevelési igényű tanulók oktatója |
| `25-3011.00` | Adult Basic Education, Adult Secondary Education, and English as a Second Language Instructors | Gyógypedagógusok | gyógypedagógus, jelnyelvtanár, sajátos nevelési igényű tanulók oktatója |
| `25-3031.00` | Substitute Teachers, Short-Term | Máshová nem sorolható oktatási foglalkozásúak | — |
| `13-2082.00` | Tax Preparers | Könyvelők és könyvvizsgálók | könyvelő, mérlegképes könyvelő, főkönyvelő |
| `13-2099.04` | Fraud Examiners, Investigators and Analysts | Könyvelők és könyvvizsgálók | könyvelő, mérlegképes könyvelő, főkönyvelő |
| `13-2052.00` | Personal Financial Advisors | Pénzügyi és befektetési tanácsadók | pénzügyi tervező, személyi bankár, személyi pénzügyi tervező, programfinanszírozási menedzser |
| `13-2054.00` | Financial Risk Specialists | Pénzügyi elemzők | pénzügyi elemző, pénzpiaci elemző, middle office munkatárs |
| `13-1111.00` | Management Analysts | Vezetési tanácsadók és szervezeti elemzők | gazdasági elemző, üzleti elemző, szabványosítási tanácsadó |
| `21-1091.00` | Health Education Specialists | Stratégiai fejlesztők, elemzők | szociálpolitikai szakértő, szociálpolitikai tanácsadó, szociálpolitikai tervezési tanácsadó, közösségfejlesztési szakértő |
| `13-1075.00` | Labor Relations Specialists | Személyzeti szakemberek és karrier-tanácsadók | munkaügyi kapcsolattartó, munkaügyi referens, szakszervezeti képviselő, személyzeti és pályaválasztási szakértő |
| `13-1141.00` | Compensation, Benefits, and Job Analysis Specialists | Személyzeti szakemberek és karrier-tanácsadók | személyzeti és pályaválasztási szakértő, humánpolitikai előadó, humánerőforrás-menedzser, munkaügyi elemző |
| `13-1151.00` | Training and Development Specialists | Továbbképzési és személyzet-fejlesztési foglalkozásúak 2524 Képzési és személyzetfejlesztési szakértő | vállalati képzési felelős, oktatásszervező, képzési felelős, üzleti coach |
| `13-1199.06` | Online Merchants | Reklám- és marketing foglalkozásúak | marketingszakértő, digitális marketingszakértő, marketingtanácsadó |
| `13-1131.00` | Fundraisers | PR foglalkozásúak | adományszervezési menedzser, adományszervező, fundraising szakértő |
| `15-1211.00` | Computer Systems Analysts | Rendszerelemzők | IT rendszermérnök, IKT rendszermérnök, IT rendszermérnökök, IKT rendszerfejlesztő |
| `15-1211.01` | Health Informatics Specialists | Rendszerelemzők | IT rendszermérnök, IKT rendszermérnök, IT rendszermérnökök, IKT rendszerintegrációs tanácsadó |
| `13-1161.01` | Search Marketing Strategists | Web- és multimédia-fejlesztők | keresőmotor-optimalizálás szakértő, SEO szakértő, keresőmotor optimalizáló |
| `15-1251.00` | Computer Programmers | Alkalmazásfejlesztők | IKT alkalmazásfejlesztő, szoftverfejlesztők, szoftveres alkalmazásfejlesztő, ipari mobilkészülékek szoftvereinek fejlesztője |
| `51-9162.00` | Computer Numerically Controlled Tool Programmers | Alkalmazásfejlesztők | irányítástechnikai programozó, automatizálási mérnök, folyamatirányítási szakmérnök |
| `13-1199.04` | Business Continuity Planners | Máshová alkalmazásfejlesztők, -elemzők | IKT minőségbiztosítási menedzser, IT minőségügyi menedzser, IT minőségbiztosítási menedzser |
| `15-1253.00` | Software Quality Assurance Analysts and Testers | Máshová alkalmazásfejlesztők, -elemzők | IKT-tesztelemző, informatikai tesztelő, IKT-teszttervező, szoftvertesztelő |
| `15-1243.01` | Data Warehousing Specialists | Adatbázis-tervezők és -rendszergazdák | adattárház-tervező, adatraktár-fejlesztő, adatraktár-tervező, adatbázis adminisztrátor |
| `15-1231.00` | Computer Network Support Specialists | Rendszergazdák | IKT rendszeradminisztrátor, IKT adminisztrátor, IT rendszeradminisztrátor |
| `15-1212.00` | Information Security Analysts | Máshová nem sorolható adatbázis- és hálózati 2159 Egyéb adatbázis- és hálózati elemző, üzemeltető foglalkozásúak | IKT biztonságtechnikai tanácsadó, IT biztonságtechnikai tanácsadó, IKT biztonságtechnikai tanácsadók, IKT biztonsági menedzser |
| `15-1299.04` | Penetration Testers | Máshová nem sorolható adatbázis- és hálózati 2159 Egyéb adatbázis- és hálózati elemző, üzemeltető foglalkozásúak | IKT biztonsági igazgató, biztonsági igazgatók, biztonsági főigazgató, digitális kriminalisztika szakértő |
| `23-1021.00` | Administrative Law Judges, Adjudicators, and Hearing Officers | Bírák | bíró, közigazgatási és munkaügyi bíró, törvényszéki bíró, békebíró |
| `23-1022.00` | Arbitrators, Mediators, and Conciliators | Máshová nem sorolható jogi foglalkozásúak | szabályozási menedzser, szabályozási szakértő, compliance szakértő, választási megfigyelő |
| `15-1299.03` | Document Management Specialists | Levél- és irattárosok, muzeológusok | levéltáros, ingatlan-nyilvántartó levéltáros, kulturális örökségvédelmi szakember, műemlékvédelmi szakember |
| `25-4022.00` | Librarians and Media Collections Specialists | Könyvtárosok és hasonló információs foglalkozásúak | könyvtáros, iskolai könyvtáros, zenei könyvtáros, információmenedzser |
| `19-3011.00` | Economists | Közgazdászok | közgazdász, ökonofizikus, közgazdász statisztikus |
| `19-4092.00` | Forensic Science Technicians | Szociológusok, antropológusok, és hasonló foglalkozásúak foglalkozásúak foglalkozásúak | kriminológus, kriminológiai szakértő, kriminológiai kutató, tanatológus |
| `19-3039.02` | Neuropsychologists | Pszichológusok | pszichológus, pszichológiai kutató, tanácsadó pszichológus |
| `19-3039.03` | Clinical Neuropsychologists | Pszichológusok | pszichológus, pszichológiai kutató, tanácsadó pszichológus |
| `21-1011.00` | Substance Abuse and Behavioral Disorder Counselors | Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek | szociális munkás, kulturális mediátor, kulturális közvetítő, szociális tanácsadó |
| `21-1013.00` | Marriage and Family Therapists | Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek | szociális tanácsadó, pszichoterapeuta, párkapcsolati tanácsadó, szociális munkás |
| `21-1015.00` | Rehabilitation Counselors | Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek | szociális munkás, kulturális mediátor, kulturális közvetítő |
| `21-1022.00` | Healthcare Social Workers | Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek | szociális munkás, kulturális mediátor, kulturális közvetítő |
| `21-1092.00` | Probation Officers and Correctional Treatment Specialists | Szociális munkások, tanácsadással foglalkozó szakemberek szakemberek | szociális munkás, kulturális mediátor, kulturális közvetítő, szociális tanácsadó |
| `21-2011.00` | Clergy | Vallási foglalkozásúak | lelkész/lelkésznő, egyetemi lelkész, kórházi lelkésznő, vallási vezető |
| `21-2021.00` | Directors, Religious Activities and Education | Vallási foglalkozásúak | lelkész/lelkésznő, egyetemi lelkész, kórházi lelkésznő, vallási vezető |
| `27-3043.00` | Writers and Authors | Írók és hasonló szerzők | író, tankönyvíró, kreatív író, könyvszerkesztő |
| `27-3043.05` | Poets, Lyricists and Creative Writers | Írók és hasonló szerzők | író, tankönyvíró, kreatív író, könyvszerkesztő |
| `27-3023.00` | News Analysts, Reporters, and Journalists | Újságírók | újságíró, riporter, ; tényfeltáró újságíró |
| `27-3091.00` | Interpreters and Translators | Fordítók, tolmácsok és egyéb nyelvészek | tolmács, orvosi tolmács, konszekutív tolmács, fordító |
| `27-1013.00` | Fine Artists, Including Painters, Sculptors, and Illustrators | Vizuális művészek | festőművész, utcai festő, tájképfestő, konceptuális művész |
| `27-2042.00` | Musicians and Singers | Zenészek, énekesek és zeneszerzők | zenész, hangversenymester, kürtművész, zeneszerző |
| `27-2091.00` | Disc Jockeys, Except Radio | Zenészek, énekesek és zeneszerzők | — |
| `27-2012.03` | Media Programming Directors | Film, színház- és hasonló rendezők, producerek | utómunka-vezető, utómunka-felügyelő, utómunka-koordinátor, producer |
| `27-4032.00` | Film and Video Editors | Film, színház- és hasonló rendezők, producerek | utómunka-vezető, utómunka-felügyelő, utómunka-koordinátor, rádióproducer |
| `27-2011.00` | Actors | Színművészek | színész, előadóművész, musicalszínész |
| `27-3011.00` | Broadcast Announcers and Radio Disc Jockeys | Rádió-, televízió- és egyéb médiabemondók | hírolvasó, televíziós hírolvasó, híradós, műsorvezető |
| `17-3028.00` | Calibration Technologists and Technicians | Kémia- és fizika tudományok technikusai | metrológiai technikus, metrológustechnikus |
| `19-4013.00` | Food Science Technicians | Kémia- és fizika tudományok technikusai | élelmiszeranalitikus, élelmiszeranalitikusok, élelmiszeranalitikus  vegyész |
| `19-4031.00` | Chemical Technicians | Kémia- és fizika tudományok technikusai | vegyésztechnikus, radiokémiai technikus, vegyészeti laboratóriumi technikus, bőrfeldolgozó-ipari laboratóriumi technikus |
| `19-4043.00` | Geological Technicians, Except Hydrologic Technicians | Kémia- és fizika tudományok technikusai | geológiai technikus, geológus-geofizikus technikus, olajipari technikus, talajvizsgáló technikus |
| `19-4044.00` | Hydrologic Technicians | Kémia- és fizika tudományok technikusai | vízrajzi mérőtechnikus, hidrográfiai mérőtechnikus, hidrográfiai mérőtechnikus asszisztens |
| `13-1041.04` | Government Property Inspectors and Investigators | Építésztechnikusok | építőtechnikus, mélyépítési technikus, építő- és építésztechnikus |
| `47-4061.00` | Rail-Track Laying and Maintenance Equipment Operators | Építésztechnikusok | építőtechnikus, mélyépítési technikus, építő- és építésztechnikus, földmérő technikus |
| `53-6041.00` | Traffic Technicians | Építésztechnikusok | építőtechnikus, mélyépítési technikus, építő- és építésztechnikus |
| `17-3024.00` | Electro-Mechanical and Mechatronics Technologists and Technicians | Gépésztechnikusok | gépésztechnikus |
| `49-3043.00` | Rail Car Repairers | Gépésztechnikusok | — |
| `17-3025.00` | Environmental Engineering Technologists and Technicians | Máshová nem sorolható természettudományi és műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok | — |
| `17-3026.01` | Nanotechnology Engineering Technologists and Technicians | Máshová nem sorolható természettudományi és műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok | — |
| `19-4099.01` | Quality Control Analysts | Máshová nem sorolható természettudományi és műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok műszaki technikusok | textilipari folyamatellenőr, textilipari minőségbiztosítási vezető, textilipari minőségellenőr |
| `47-1011.00` | First-Line Supervisors of Construction Trades and Extraction Workers | Építőipari irányítók | építésvezető, építőipari szakmai irányító, felügyelő, építőipari műszakvezető |
| `49-1011.00` | First-Line Supervisors of Mechanics, Installers, and Repairers | Építőipari irányítók | építésvezető, építőipari szakmai irányító, felügyelő, építőipari műszakvezető |
| `53-1042.00` | First-Line Supervisors of Helpers, Laborers, and Material Movers, Hand | Építőipari irányítók | építésvezető, építőipari szakmai irányító, felügyelő, építőipari műszakvezető |
| `53-1043.00` | First-Line Supervisors of Material-Moving Machine and Vehicle Operators | Építőipari irányítók | építésvezető, építőipari szakmai irányító, felügyelő, építőipari műszakvezető |
| `49-2095.00` | Electrical and Electronics Repairers, Powerhouse, Substation, and Relay | Erőműkezelők | — |
| `51-8011.00` | Nuclear Power Reactor Operators | Erőműkezelők | — |
| `51-8012.00` | Power Distributors and Dispatchers | Erőműkezelők | — |
| `51-8013.00` | Power Plant Operators | Erőműkezelők | erőműkezelő, generátorállomás-kezelő, biomasszaerőmű-kezelő |
| `53-7071.00` | Gas Compressor and Gas Pumping Station Operators | Kőolaj- és földgázfinomító berendezések kezelői | gázfeldolgozó berendezés kezelője, gázelosztó berendezés kezelője, gázfeldolgozó-üzemi operátor, gázfeldolgozó-üzemi központi irányítótermi operátor |
| `53-7073.00` | Wellhead Pumpers | Kőolaj- és földgázfinomító berendezések kezelői | kőolajszivattyú-rendszer kezelője, szivattyúrendszer-kezelő, kőolajipari táblakezelő |
| `51-4191.00` | Heat Treating Equipment Setters, Operators, and Tenders, Metal and Plastic | Fémfeldolgozási folyamatirányító rendszerek kezelői | kohókezelő, kohászati technikus, kohász |
| `15-2099.01` | Bioinformatics Technicians | Élettani tudományok technikusai (kivéve az orvostudományt) | laboratóriumi technikus, kutatólaboratóriumi technikus, laboratóriumi szakasszisztens |
| `19-1032.00` | Foresters | Erdésztechnikusok Erdésztechnikusok | erdésztechnikus, erdészetvezető, erdőfelügyelő |
| `19-4071.00` | Forest and Conservation Technicians | Erdésztechnikusok Erdésztechnikusok | erdésztechnikus, erdészetvezető, erdőfelügyelő |
| `53-5031.00` | Ship Engineers | Hajógépészek | hajózási géptiszt, hajógépész, első géptiszt |
| `53-5021.00` | Captains, Mates, and Pilots of Water Vessels | Hajós fedélzeti tisztek és hajóvezetők | révkalauz, hajókormányos, kormányos, hajóparancsnok |
| `53-2011.00` | Airline Pilots, Copilots, and Flight Engineers | Légijármű-vezetők és hasonló foglalkozásúak | légijármű-vezető, repülőgép-vezető, pilóta, űrhajós |
| `53-2022.00` | Airfield Operations Specialists | Légiirányítók | navigációs tiszt, repülésüzemi tiszt, repülőtéri járatindító, légiforgalmi irányító |
| `29-1124.00` | Radiation Therapists | Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője | klinikai perfúziós asszisztens, műtéti szakasszisztens, műtő asszisztens |
| `29-2032.00` | Diagnostic Medical Sonographers | Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője | klinikai perfúziós asszisztens, műtéti szakasszisztens, műtő asszisztens |
| `29-2034.00` | Radiologic Technologists and Technicians | Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője | klinikai perfúziós asszisztens, műtéti szakasszisztens, műtő asszisztens |
| `29-2035.00` | Magnetic Resonance Imaging Technologists | Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője | — |
| `29-2036.00` | Medical Dosimetrists | Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője | — |
| `29-2099.01` | Neurodiagnostic Technologists | Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője | — |
| `31-9099.02` | Endoscopy Technicians | Orvosi képalkotó diagnosztikai és terápiás berendezések technikusai berendezések kezelője | klinikai perfúziós asszisztens, műtéti szakasszisztens, műtő asszisztens |
| `29-2011.01` | Cytogenetic Technologists | Orvosi és patológiai labortechnikusok | orvosbiológus, orvosbiológiai kutató, biomedikai mérnök |
| `29-2011.02` | Cytotechnologists | Orvosi és patológiai labortechnikusok | orvosbiológus, orvosbiológiai kutató, biomedikai mérnök |
| `29-2011.04` | Histotechnologists | Orvosi és patológiai labortechnikusok | orvosbiológus, orvosbiológiai kutató, biomedikai mérnök |
| `29-2012.00` | Medical and Clinical Laboratory Technicians | Orvosi és patológiai labortechnikusok | orvosi laboratóriumi asszisztens, orvosi laborasszisztens, klinikai laboratóriumi asszisztens, orvosbiológus |
| `29-2012.01` | Histology Technicians | Orvosi és patológiai labortechnikusok | orvosi laboratóriumi asszisztens, orvosi laborasszisztens, klinikai laboratóriumi asszisztens, orvosbiológus |
| `29-1024.00` | Prosthodontists | Gyógyászatisegédeszköz- és fogtechnikusok | fogtechnikus, kórházi fogtechnikus, fogműves, ortopédiai eszközkészítő |
| `29-2092.00` | Hearing Aid Specialists | Gyógyászatisegédeszköz- és fogtechnikusok | hallásakusztikus, hallókészülék-technikus |
| `51-9082.00` | Medical Appliance Technicians | Gyógyászatisegédeszköz- és fogtechnikusok | hallásakusztikus, hallókészülék-technikus, fogtechnikus, kórházi fogtechnikus |
| `29-2061.00` | Licensed Practical and Licensed Vocational Nurses | Ápolók | — |
| `31-9096.00` | Veterinary Assistants and Laboratory Animal Caretakers | Állatorvosi technikusok és asszisztensek | állatorvosi szaksegéd, állatorvosi szaksegédek, állatorvosi asszisztens |
| `15-2051.02` | Clinical Data Managers | Egészségügyi nyilvántartások és dokumentációk technikusai | egészségügyi dokumentációs vezető, betegnyilvántartási vezető, egészségügyi dokumentációs részleg vezetője |
| `29-9021.00` | Health Information Technologists and Medical Registrars | Egészségügyi nyilvántartások és dokumentációk technikusai | egészségügyi dokumentációs vezető, betegnyilvántartási vezető, egészségügyi dokumentációs részleg vezetője, képtároló és képtovábbító rendszer kezelője |
| `29-2081.00` | Opticians, Dispensing | Látszerészek | látszerész, látszerészasszisztens, optikus |
| `29-2099.05` | Ophthalmic Medical Technologists | Látszerészek | — |
| `51-9083.00` | Ophthalmic Laboratory Technicians | Látszerészek | látszerész, látszerészasszisztens, optikus |
| `31-2021.00` | Physical Therapist Assistants | Fizioterápiás technikusok és asszisztensek | állatgyógyász, állatrehabilitációs terapeuta, állatorvos, aromaterapeuta |
| `29-1071.00` | Physician Assistants | Orvosi asszisztensek | orvosi rendelő asszisztense, szemészeti asszisztens, műtéti szakasszisztens |
| `29-2055.00` | Surgical Technologists | Orvosi asszisztensek | orvosi rendelő asszisztense, szemészeti asszisztens, műtéti szakasszisztens |
| `29-9093.00` | Surgical Assistants | Orvosi asszisztensek | orvosi rendelő asszisztense, szemészeti asszisztens, műtéti szakasszisztens |
| `31-9092.00` | Medical Assistants | Orvosi asszisztensek | orvosi rendelő asszisztense, szemészeti asszisztens, műtéti szakasszisztens |
| `29-2042.00` | Emergency Medical Technicians | Mentőápolók | mentőautó-vezető, mentőgépkocsi-vezető, mentőautó-sofőr |
| `29-1071.01` | Anesthesiologist Assistants | Máshová nem sorolható egészségügyi foglalkozásúak | aneszteziológiai szakasszisztens, aneszteziológiai technikus |
| `29-1122.01` | Low Vision Therapists, Orientation and Mobility Specialists, and Vision Rehabilitation Therapists | Máshová nem sorolható egészségügyi foglalkozásúak | — |
| `29-1126.00` | Respiratory Therapists | Máshová nem sorolható egészségügyi foglalkozásúak | aneszteziológiai szakasszisztens, aneszteziológiai technikus |
| `29-1151.00` | Nurse Anesthetists | Máshová nem sorolható egészségügyi foglalkozásúak | aneszteziológiai szakasszisztens, aneszteziológiai technikus |
| `29-2031.00` | Cardiovascular Technologists and Technicians | Máshová nem sorolható egészségügyi foglalkozásúak | — |
| `29-2057.00` | Ophthalmic Medical Technicians | Máshová nem sorolható egészségügyi foglalkozásúak | — |
| `31-9099.01` | Speech-Language Pathology Assistants | Máshová nem sorolható egészségügyi foglalkozásúak | — |
| `41-3031.00` | Securities, Commodities, and Financial Services Sales Agents | Értékpapír-kereskedők és pénzügyi közvetítők | pénzügyi bróker, jelzálog-tanácsadó, pénzügyi ügynök, tőzsde- és pénzügyi ügynök |
| `43-4041.00` | Credit Authorizers, Checkers, and Clerks | Hitel- és kölcsönügyintézők | hitelügyi tanácsadó, hitelezési tanácsadó, hitelszakértő, hitelkockázati elemző |
| `43-4131.00` | Loan Interviewers and Clerks | Hitel- és kölcsönügyintézők | hitelügyintéző, hitelezési tanácsadó, banki hitelügyintéző, hitelbíráló |
| `43-4141.00` | New Accounts Clerks | Hitel- és kölcsönügyintézők | bankszámla-ügyintéző, pénzintézeti ügyfélkapcsolati előadó, pénzintézeti ügyfélkapcsolati munkatárs, hitelügyintéző |
| `13-1031.00` | Claims Adjusters, Examiners, and Investigators | Becsüsök és kárfelmérők | biztosítási kárfelmérő, gépjármű-értékbecslő, gépjárműkárigény-ügyintéző, biztosítási kárügyintéző |
| `13-1032.00` | Insurance Appraisers, Auto Damage | Becsüsök és kárfelmérők | ingatlan-értékbecslő, lakóingatlan-értékbecslő, ingatlanszakértő, biztosítási kárügyintéző |
| `23-2093.00` | Title Examiners, Abstractors, and Searchers | Becsüsök és kárfelmérők | adósságrendező, adósságrendezési tanácsadó, ingósági szakértő, becsüs |
| `41-3021.00` | Insurance Sales Agents | Biztosítási üzletkötők | biztosítási ügynök, biztosításközvetítő, lakásbiztosítási ügynök |
| `41-3091.00` | Sales Representatives of Services, Except Advertising, Insurance, Financial Services, and Travel | Kereskedelmi értékesítők | értékesítési ügyintéző, kereskedelmi ügyintéző, értékesítési előadó |
| `41-4012.00` | Sales Representatives, Wholesale and Manufacturing, Except Technical and Scientific Products | Kereskedelmi értékesítők | értékesítési ügyintéző, kereskedelmi ügyintéző, értékesítési előadó |
| `13-1021.00` | Buyers and Purchasing Agents, Farm Products | Felvásárlók | anyaggazdálkodó, felvásárló, beszerző, felvásárló |
| `13-1022.00` | Wholesale and Retail Buyers, Except Farm Products | Felvásárlók | — |
| `13-1023.00` | Purchasing Agents, Except Wholesale, Retail, and Farm Products | Felvásárlók | anyaggazdálkodó, felvásárló, beszerző, felvásárló, díszletfelelős |
| `13-1041.08` | Customs Brokers | Vámügyintézők és speditőrök | vám- és jövedéki ügyintéző, pénzügyőr, vámőr, szállítási, szállítmányozási nyilvántartó |
| `13-1121.00` | Meeting, Convention, and Event Planners | Konferencia- és rendezvényszervezők | konferencia- és rendezvényszervező-asszisztens, rendezvénykoordinátor, rendezvényszervező-asszisztens, konferencia- és rendezvényszervező |
| `13-1074.00` | Farm Labor Contractors | Munka- és bérmunka-közvetítők | — |
| `39-9041.00` | Residential Advisors | Ingatlanügynökök és -kezelők | társasházkezelő, épületgondnok, háztömbfelügyelő |
| `13-1011.00` | Agents and Business Managers of Artists, Performers, and Athletes | Máshová nem sorolható üzleti szolgáltatásokat nyújtók | relokációs tanácsadó, áttelepítési tanácsadó, szellemitulajdon-védelmi tanácsadó, szellemitulajdon-jogi szakértő |
| `43-1011.00` | First-Line Supervisors of Office and Administrative Support Workers | Irodavezetők | piackutatási vezető, piackutató menedzser, call center minőségbiztosító, ügyfélkapcsolati minőségbiztosítási auditor |
| `43-4031.00` | Court, Municipal, and License Clerks | Jogi titkárok | — |
| `43-3061.00` | Procurement Clerks | Igazgatási és ügyvezetési titkárok | igazgatási asszisztens, adminisztratív asszisztens, titkárnő |
| `43-6011.00` | Executive Secretaries and Executive Administrative Assistants | Igazgatási és ügyvezetési titkárok | igazgatási asszisztens, adminisztratív asszisztens, titkárnő, igazgatói asszisztens |
| `33-9093.00` | Transportation Security Screeners | Vám- és határfelügyeleti ügyintézők | utasbiztonsági ellenőr, kézipoggyász-ellenőr, repülőtéri vámkezelő |
| `13-2081.00` | Tax Examiners and Collectors, and Revenue Agents | Adóhatósági ügyintézők | adópolitikai tanácsadó, adószakértő, adótanácsadó, adóellenőr |
| `43-4061.00` | Eligibility Interviewers, Government Programs | Szociális ellátásokat kezelő ügyintézők | társadalombiztosítási ellenőr, társadalombiztosítási szakértő, munkajogi tanácsadó, társadalombiztosítási ügyintéző |
| `33-3021.02` | Police Identification and Records Officers | Rendőrfelügyelők és nyomozók | rendőrségi nyomozó, rendőr, rendőrnő, rendőrfelügyelő |
| `33-2022.00` | Forest Fire Inspectors and Prevention Specialists | Máshová nem sorolható közhivatali ügyintézők | erdészeti felügyelő, erdészetvezető, erdőgazdálkodási ágazat vezetője |
| `33-9031.00` | Gambling Surveillance Officers and Gambling Investigators | Máshová nem sorolható közhivatali ügyintézők | szerencsejáték-felügyelő, játéktermi ellenőr, szerencsejáték-ellenőr |
| `53-6051.07` | Transportation Vehicle, Equipment and Systems Inspectors, Except Aviation | Máshová nem sorolható közhivatali ügyintézők | — |
| `23-1012.00` | Judicial Law Clerks | Jogi és hasonló foglalkozásúak | ingatlan-ügyintéző, ingatlanjogász, ingatlanátruházási ügyintéző, bírósági titkár |
| `21-1021.00` | Child, Family, and School Social Workers | Szociális foglalkozásúak | szociális gondozó, házi gondozó, szociális munkás |
| `25-3021.00` | Self-Enrichment Teachers | Szociális foglalkozásúak | életvezetési tanácsadó, életvezetési coach, mentor |
| `29-2053.00` | Psychiatric Technicians | Szociális foglalkozásúak | szociális gondozó, házi gondozó, szociális munkás |
| `31-1122.00` | Personal Care Aides | Szociális foglalkozásúak | szociális gondozó, házi gondozó, szociális munkás |
| `27-2021.00` | Athletes and Sports Competitors | Sportolók | hivatásos sportoló, atléta, úszó |
| `27-2022.00` | Coaches and Scouts | Sportedzők, -oktatók és -tisztségviselők | sportszervező, sportbíró, versenybíró, sportedző |
| `39-9031.00` | Exercise Trainers and Group Fitness Instructors | Sportedzők, -oktatók és -tisztségviselők | sportedző, edző |
| `29-1128.00` | Exercise Physiologists | Fitneszoktatók és szabadidős programok vezetői | fitneszoktató, fitnesz instruktor, aerobic oktató |
| `39-1014.00` | First-Line Supervisors of Entertainment and Recreation Workers, Except Gambling Services | Fitneszoktatók és szabadidős programok vezetői | szabadidő-szervező, sportanimátor, animátor |
| `39-9032.00` | Recreation Workers | Fitneszoktatók és szabadidős programok vezetői | szabadidő-szervező, sportanimátor, animátor |
| `27-1026.00` | Merchandise Displayers and Window Trimmers | Épületbelső-tervezők és -dekoratőrök | dekoratőr, kirakattervező, díszítő, árufeltöltő |
| `25-4013.00` | Museum Technicians and Conservators | Kiállítótermi, múzeumi és könyvtári technikusok | művészeti szakértő, preparátor, konzervátor |
| `35-2013.00` | Cooks, Private Household | Konyhafőnökök | séf, helyettes séf, séfek |
| `15-1232.00` | Computer User Support Specialists | Információs és kommunikációs technológiák felhasználói támogatását biztosító technikusok támogató technikus | infokommunikációs ügyfélszolgálati munkatárs, IT ügyfélszolgálati munkatárs, IKT ügyfélszolgálati munkatárs, infokommunikációs ügyfélszolgálati menedzser |
| `15-1299.01` | Web Administrators | Webtechnikusok | internetes rendszergazda, webmaster, weboldal adminisztrátor |
| `27-4014.00` | Sound Engineering Technicians | Műsorszórási és audiovizuális technikusok | audiovizuális technikus, hangtechnikus, műsorszóró és audiovizuális technikus |
| `27-4031.00` | Camera Operators, Television, Video, and Film | Műsorszórási és audiovizuális technikusok | audiovizuális technikus, hangtechnikus, műsorszóró és audiovizuális technikus |
| `39-3021.00` | Motion Picture Projectionists | Műsorszórási és audiovizuális technikusok | audiovizuális technikus, hangtechnikus, műsorszóró és audiovizuális technikus |
| `43-9061.00` | Office Clerks, General | Általános irodai foglalkozásúak | irodai ügyintéző, irodai asszisztens, iratkezelő, irattáros |
| `43-6014.00` | Secretaries and Administrative Assistants, Except Legal, Medical, and Executive | Titkárok (általános) | titkár/titkárnő, személyi asszisztens, önkormányzati ügyintéző |
| `43-5051.00` | Postal Service Clerks | Bankpénztárosok és hasonló foglalkozásúak | postai ügyfélkapcsolati foglalkozású, postai szolgáltató (kézbesítő, válogató), hírközlési, postai tevékenységet folytató részegység vezetője |
| `39-1013.00` | First-Line Supervisors of Gambling Services Workers | Bukmékerek, krupiék és hasonló foglalkozásúak | bingóhoszt, bingó játékvezető-asszisztens, főjátékvezető, bukméker |
| `39-3012.00` | Gambling and Sports Book Writers and Runners | Bukmékerek, krupiék és hasonló foglalkozásúak | bingóhoszt, bingó játékvezető-asszisztens, főjátékvezető, bukméker |
| `41-2012.00` | Gambling Change Persons and Booth Cashiers | Bukmékerek, krupiék és hasonló foglalkozásúak | kaszinói pénztáros, kaszinói zsetonkezelő, zsetonkasszás, bingóhoszt |
| `43-3041.00` | Gambling Cage Workers | Bukmékerek, krupiék és hasonló foglalkozásúak | bingóhoszt, bingó játékvezető-asszisztens, főjátékvezető, bukméker |
| `43-3011.00` | Bill and Account Collectors | Adósságbehajtók és hasonló foglalkozásúak | végrehajtó, adósságbehajtó, követeléskezelő, adósságbehajtó, biztosítási követeléskezelő |
| `43-4181.00` | Reservation and Transportation Ticket Agents and Travel Clerks | Utazási irodai ügyintézők | idegenforgalmi tájékoztató munkatárs, ügyfél-tájékoztató, utastájékoztató |
| `43-5031.00` | Public Safety Telecommunicators | Telefonközpont-kezelők | telefonközpont-kezelő |
| `43-4021.00` | Correspondence Clerks | Ügyfélszolgálati ügyintézők | — |
| `43-4151.00` | Order Clerks | Ügyfélszolgálati ügyintézők | — |
| `43-4111.00` | Interviewers, Except Eligibility and Loan | Összeírók és piackutatási kérdezők | piackutatási kérdező, közvéleménykutató (kérdező), kérdező, lakossági kérdező, összeíró |
| `39-6012.00` | Concierges | Máshová nem sorolható, ügyfél-tájékoztatási foglalkozásúak | — |
| `43-4081.00` | Hotel, Motel, and Resort Desk Clerks | Máshová nem sorolható, ügyfél-tájékoztatási foglalkozásúak | — |
| `43-3031.00` | Bookkeeping, Accounting, and Auditing Clerks | Számviteli és könyvelési nyilvántartók | számlázási ügyintéző, számlakezelő munkatárs, számlázási munkatárs |
| `43-5071.00` | Shipping, Receiving, and Inventory Clerks | Készletnyilvántartók | raktárgazdálkodó, raktározási szakember, leltározó |
| `43-5111.00` | Weighers, Measurers, Checkers, and Samplers, Recordkeeping | Készletnyilvántartók | raktárgazdálkodó, raktározási szakember, leltározó |
| `43-5061.00` | Production, Planning, and Expediting Clerks | Termelési nyilvántartók | gyártósori gyártáskoordinátor, gyártáskoordinátor, termelési koordinátor |
| `43-5011.00` | Cargo and Freight Agents | Szállítmányozási nyilvántartók | árufuvarozói ügyintéző, logisztikai ügyintéző, útitervkészító, légi szállítmányozási nyilvántartó |
| `43-5011.01` | Freight Forwarders | Szállítmányozási nyilvántartók | árufuvarozói ügyintéző, logisztikai ügyintéző, útitervkészító, vasúti árufuvarozási ügyintéző |
| `43-5032.00` | Dispatchers, Except Police, Fire, and Ambulance | Szállítmányozási nyilvántartók | repülésüzemi tiszt, légiforgalmi irányító, légiforgalmi felügyelő, hajóforgalmi irányító |
| `43-5052.00` | Postal Service Mail Carriers | Postai kézbesítők és válogatók | postai válogató, válogató, csomagválogató, postai kézbesítő |
| `43-5053.00` | Postal Service Mail Sorters, Processors, and Processing Machine Operators | Postai kézbesítők és válogatók | postai válogató, válogató, csomagválogató |
| `53-1044.00` | First-Line Supervisors of Passenger Attendants | Utaskísérők és stewardok | utaskísérő, hostess, légiutas-kísérő, kabinszemélyzet-menedzser |
| `53-6061.00` | Passenger Attendants | Utaskísérők és stewardok | utaskísérő, hostess, légiutas-kísérő |
| `53-4031.00` | Railroad Conductors and Yardmasters | Kalauzok | főkalauz, kalauz, vasúti jegyvizsgáló, jegyellenőr |
| `19-1031.03` | Park Naturalists | Idegenvezetők | idegenvezető, utaskísérő |
| `35-9031.00` | Hosts and Hostesses, Restaurant, Lounge, and Coffee Shop | Idegenvezetők | idegenvezető, utaskísérő |
| `39-7011.00` | Tour Guides and Escorts | Idegenvezetők | idegenvezető, utaskísérő |
| `35-3031.00` | Waiters and Waitresses | Felszolgálók | pincér/pincérnő, főpincér, pincérek |
| `39-5093.00` | Shampooers | Fodrászok | fodrász, fodrásznő, kozmetikus |
| `39-5091.00` | Makeup Artists, Theatrical and Performance | Kozmetikusok és hasonló foglalkozásúak | sminkmester, sminkes, kozmetikus, smink- és frizuratervező |
| `39-5094.00` | Skincare Specialists | Kozmetikusok és hasonló foglalkozásúak | kozmetikus, sminkes, elektrokozmetikus, szőreltávolító szakember |
| `11-9171.00` | Funeral Home Managers | Temetkezési vállalkozók és balzsamozók | temetésrendező, temetkezési vállalkozó, temetésszolgáltatási munkás |
| `39-4012.00` | Crematory Operators | Temetkezési vállalkozók és balzsamozók | temetői alkalmazott, temetőőr, halottszállító, halottbalzsamozó |
| `39-4031.00` | Morticians, Undertakers, and Funeral Arrangers | Temetkezési vállalkozók és balzsamozók | temetkezési foglalkozású, halottszállító, temetkezési segéd, temetésrendező |
| `27-1023.00` | Floral Designers | Beosztott eladók | szaküzleti eladó, eladó |
| `41-2022.00` | Parts Salespersons | Beosztott eladók | járműalkatrész-eladó, értékesítési asszisztens, értékesítési asszisztens gyakornok, eladó |
| `41-2031.00` | Retail Salespersons | Beosztott eladók | értékesítési asszisztens, értékesítési asszisztens gyakornok, eladó, bolti eladó |
| `41-9011.00` | Demonstrators and Product Promoters | Termékbemutató ügynökök | promóciószervező, promóciós szervező, promóter |
| `41-9041.00` | Telemarketers | Telefonos/multimédiás értékesítő ügynökök | call center operátor, telefonközpont-kezelő, híváskoordinátor |
| `53-6031.00` | Automotive and Watercraft Service Attendants | Benzinkutasok | — |
| `35-3041.00` | Food Servers, Nonrestaurant | Büfések | légitársasági ételkészítő, ételkészítő |
| `41-2021.00` | Counter and Rental Clerks | Máshová nem sorolható értékesítési foglalkozásúak | kölcsönzői munkatárs, multimédiás szolgáltató, járműkölcsönző, járműkölcsönzői munkatárs |
| `39-9011.00` | Childcare Workers | Gyermekgondozók | gyermekfelügyelő, gyermekgondozó |
| `39-9011.01` | Nannies | Gyermekgondozók | gyermekfelügyelő, gyermekgondozó |
| `31-1133.00` | Psychiatric Aides | Kisegítő gondozó személyzet | ápolási asszisztens, gerontológiai gondozó |
| `29-2099.08` | Patient Representatives | Máshová nem sorolható személygondozási foglalkozásúak (egészségügyben) | — |
| `31-1132.00` | Orderlies | Máshová nem sorolható személygondozási foglalkozásúak (egészségügyben) | betegszállító |
| `31-2022.00` | Physical Therapist Aides | Máshová nem sorolható személygondozási foglalkozásúak (egészségügyben) | — |
| `31-9093.00` | Medical Equipment Preparers | Máshová nem sorolható személygondozási foglalkozásúak (egészségügyben) | fertőtlenítő sterilező, eszközfertőtlenítő technikus |
| `33-1021.00` | First-Line Supervisors of Firefighting and Prevention Workers | Tűzoltók | tűzoltó, tűzoltósági referens, tűzoltó technikus |
| `33-3052.00` | Transit and Railroad Police | Rendőrök | rendőr, baleseti vizsgáló, nyomozókutya-vezető |
| `13-1199.07` | Security Management Specialists | Biztonsági őrök | biztonsági őr, parkőr, őr |
| `33-1091.00` | First-Line Supervisors of Security Workers | Biztonsági őrök | biztonsági őr, parkőr, őr |
| `33-9099.02` | Retail Loss Prevention Specialists | Biztonsági őrök | biztonsági őr, parkőr, őr |
| `33-3041.00` | Parking Enforcement Workers | Máshová nem sorolható védelmi foglalkozások | parkolóőr, közlekedési rendőr, közterület-felügyelő, gyalogátkelőhelyi forgalomirányító |
| `33-9092.00` | Lifeguards, Ski Patrol, and Other Recreational Protective Service Workers | Máshová nem sorolható védelmi foglalkozások | parti őr, vízimentő, uszodamester, strandőr |
| `37-1012.00` | First-Line Supervisors of Landscaping, Lawn Service, and Groundskeeping Workers | Kertészek, kertészeti és faiskolai kertészek | kertész-gondnok, szállodai gondnok, pályamester, kertészeti termeléssel foglalkozó egység vezetője |
| `37-3011.00` | Landscaping and Groundskeeping Workers | Kertészek, kertészeti és faiskolai kertészek | kertész-gondnok, szállodai gondnok, pályamester, kertész |
| `37-3013.00` | Tree Trimmers and Pruners | Kertészek, kertészeti és faiskolai kertészek | tájkertész, tájkertészek, kertgondnokok |
| `45-2092.00` | Farmworkers and Laborers, Crop, Nursery, and Greenhouse | Kertészek, kertészeti és faiskolai kertészek | kertészeti termeléssel foglalkozó egység vezetője, kertészeti termeléssel foglalkozó egység vezetői, kertészeti termesztés vezetője, kertészeti termelési csoportvezető |
| `25-9021.00` | Farm and Home Management Educators | Vegyes gazdálkodók | — |
| `45-2093.00` | Farmworkers, Farm, Ranch, and Aquacultural Animals | Halgazdálkodók | keltetési akvakultúra-dolgozó, halkeltetési dolgozó, halkeltetési munkás, tenyésztési akvakultúra-munkás |
| `47-2021.00` | Brickmasons and Blockmasons | Falazókőművesek és hasonló foglalkozásúak | épületfalazó kőműves, falazó kőműves, kőműves |
| `47-3011.00` | Helpers--Brickmasons, Blockmasons, Stonemasons, and Tile and Marble Setters | Falazókőművesek és hasonló foglalkozásúak | épületfalazó kőműves, falazó kőműves, kőműves |
| `51-9195.03` | Stone Cutters and Carvers, Manufacturing | Kőfaragók, -vágók és -törők | épületszobrász, sírkőkészítő, emlékműkészítő |
| `49-9095.00` | Manufactured Building and Mobile Home Installers | Ácsok és asztalosok | ajtóbeépítő, épületasztalos, nyílászáró-beépítő, ablakszerelő |
| `47-2042.00` | Floor Layers, Except Carpet, Wood, and Hard Tiles | Burkolók | fapadló- és parkettarakó, melegburkoló, fapadlórakó, fapadló- és műanyagburkoló |
| `47-2043.00` | Floor Sanders and Finishers | Burkolók | fapadló- és parkettarakó, melegburkoló, fapadlórakó, fapadló- és műanyagburkoló |
| `47-2044.00` | Tile and Stone Setters | Burkolók | hidegburkoló, járólapozó, hidegfal- és padlóburkoló, fapadló- és parkettarakó |
| `47-3014.00` | Helpers--Painters, Paperhangers, Plasterers, and Stucco Masons | Stukkó készítők (épületszobrászok) | vakoló kőműves, vakoló, vakoló munkás |
| `47-2131.00` | Insulation Workers, Floor, Ceiling, and Wall | Szigetelők | szigetelő, ipari szigetelő, tetőszigetelő |
| `47-2121.00` | Glaziers | Üvegesek | autóüvegező, szélvédő-javító, autóüveges, épületüvegező |
| `47-2151.00` | Pipelayers | Víz-, gáz- és csővezeték-szerelők | csatornafektető, csatornaépítő munkás, csőfektető |
| `47-3015.00` | Helpers--Pipelayers, Plumbers, Pipefitters, and Steamfitters | Víz-, gáz- és csővezeték-szerelők | víz- és gázvezeték-szerelő, vízvezeték-szerelő, vezeték- és csőhálózat-szerelő, gázvezeték-szerelő |
| `49-9021.00` | Heating, Air Conditioning, and Refrigeration Mechanics and Installers | Légkondicionáló- és hűtőberendezés-szerelők | szellőző-, hűtő- és klimatizálóberendezés-szerelő, szellőzőberendezés-szerelő, klímaműszerész |
| `47-2082.00` | Tapers | Festők és hasonló foglalkozásúak | — |
| `47-2142.00` | Paperhangers | Festők és hasonló foglalkozásúak | — |
| `51-9123.00` | Painting, Coating, and Decorating Workers | Festők és hasonló foglalkozásúak | — |
| `51-9124.00` | Coating, Painting, and Spraying Machine Setters, Operators, and Tenders | Felületkezelők, fényezők | korrózióvédelmi festő, fémfestő, fémmázoló, fémsavazó, festékszóró, fényező |
| `47-4041.00` | Hazardous Materials Removal Workers | Épületszerkezet-tisztítók | azbesztmentesítő, azbesztmentesítő szakember, azbesztmentesítő munkás, környezetvédelmi munkás |
| `51-4052.00` | Pourers and Casters, Metal | Fém öntőminta- és magkészítők | öntő, folyamatos öntő, kokilla- és nyomásos öntő |
| `51-4071.00` | Foundry Mold and Coremakers | Fém öntőminta- és magkészítők | öntő, folyamatos öntő, kokilla- és nyomásos öntő |
| `51-4072.00` | Molding, Coremaking, and Casting Machine Setters, Operators, and Tenders, Metal and Plastic | Fém öntőminta- és magkészítők | öntő, folyamatos öntő, kokilla- és nyomásos öntő |
| `51-4121.00` | Welders, Cutters, Solderers, and Brazers | Hegesztők és lángvágók | lágyforrasztó, hegesztő, lángvágó, elektromosív-hegesztő, hegesztő |
| `51-4192.00` | Layout Workers, Metal and Plastic | Fémlemez-megmunkálók | — |
| `47-2171.00` | Reinforcing Iron and Rebar Workers | Fémszerkezet-készítők és -összeállítók | vas- és fémszerkezeti lakatos, vasszerkezeti lakatos |
| `47-2221.00` | Structural Iron and Steel Workers | Fémszerkezet-készítők és -összeállítók | vas- és fémszerkezeti lakatos, vasszerkezeti lakatos |
| `49-9098.00` | Helpers--Installation, Maintenance, and Repair Workers | Fémszerkezet-készítők és -összeállítók | szétszerelő, bontómunkás, hajóépítő, tengeralattjáró-tervező |
| `51-2041.00` | Structural Metal Fabricators and Fitters | Fémszerkezet-készítők és -összeállítók | vas- és fémszerkezeti lakatos, vasszerkezeti lakatos |
| `49-9044.00` | Millwrights | Állványozók, rakományrögzítők és tartószerkezetek szerelői | darukötöző, darukezelő, daruzó |
| `51-4022.00` | Forging Machine Setters, Operators, and Tenders, Metal and Plastic | Kovácsok | süllyesztékes kovácsoló gép kezelője, kovácsológép-kezelő, gépi kovács, hidraulikus kovácssajtó kezelője |
| `51-4061.00` | Model Makers, Metal and Plastic | Szerszámkészítők és hasonló foglalkozásúak | öntőminta-készítő, mintakészítő, kokillakészítő, szerszámkészítő |
| `51-7032.00` | Patternmakers, Wood | Szerszámkészítők és hasonló foglalkozásúak | öntőminta-készítő, mintakészítő, kokillakészítő |
| `51-4031.00` | Cutting, Punching, and Press Machine Setters, Operators, and Tenders, Metal and Plastic | Fémmegmunkálógép-beállítók és -üzemeltetők | CNC-gépkezelő, CNC-esztergályos, CNC-programozó, lemezkivágó gép kezelője |
| `51-4032.00` | Drilling and Boring Machine Tool Setters, Operators, and Tenders, Metal and Plastic | Fémmegmunkálógép-beállítók és -üzemeltetők | furatbővítő gép kezelője, fúrógépkezelő, gépi forgácsoló, fúrós |
| `51-4081.00` | Multiple Machine Tool Setters, Operators, and Tenders, Metal and Plastic | Fémmegmunkálógép-beállítók és -üzemeltetők | lemezkivágó gép kezelője, forgácsoló, gép forgácsoló, csavareszterga-kezelő |
| `51-9161.00` | Computer Numerically Controlled Tool Operators | Fémmegmunkálógép-beállítók és -üzemeltetők | CNC-gépkezelő, CNC-esztergályos, CNC-programozó, gyalus |
| `51-4033.00` | Grinding, Lapping, Polishing, and Buffing Machine Tool Setters, Operators, and Tenders, Metal and Plastic | Fémcsiszolók, köszörűsök és szerszámköszörűsök | fémcsiszoló, fémfelület-kezelő, szerszámköszörűs, köszörűs |
| `51-9022.00` | Grinding and Polishing Workers, Hand | Fémcsiszolók, köszörűsök és szerszámköszörűsök | fémcsiszoló, fémfelület-kezelő, szerszámköszörűs, köszörűs |
| `49-3021.00` | Automotive Body and Related Repairers | Gépjárműszerelők és -karbantartók | gépjármű-karbantartó és -javító, autóbusz-szerelő, kamionszerelő, karosszérialakatos |
| `49-3052.00` | Motorcycle Mechanics | Gépjárműszerelők és -karbantartók | gépjármű-karbantartó és -javító, autóbusz-szerelő, kamionszerelő |
| `49-3093.00` | Tire Repairers and Changers | Gépjárműszerelők és -karbantartók | gumijavító és centírozó |
| `53-6032.00` | Aircraft Service Attendants | Légijármű szerelők és -karbantartók | — |
| `49-3051.00` | Motorboat Mechanics and Service Technicians | Mezőgazdasági és iparigép szerelők és -karbantartók | bányászati gépszerelő, javító, bányászati gépszerelő, gépüzemsegéd, hajó másodgépésze |
| `49-9043.00` | Maintenance Workers, Machinery | Mezőgazdasági és iparigép szerelők és -karbantartók | építőipari gépszerelő, építőipari gépjavító, ipari gép karbantartója, javítója, textil- és ruhaiparigép-szerelő |
| `49-3091.00` | Bicycle Repairers | Kerékpárszerelők és hasonló foglalkozásúak | kerékpár-karbantartó, - javító, kerékpár-karbantartó, kerékpárjavító |
| `49-9062.00` | Medical Equipment Repairers | Precíziósműszer-gyártók és -javítók | optikai műszerész, orvosi műszerész |
| `51-2061.00` | Timing Device Assemblers and Adjusters | Precíziósműszer-gyártók és -javítók | optikai szerszámkészítő, finommechanikai műszerész, optikai műszerész, mérő- és precíziósműszer-készítő |
| `49-9063.00` | Musical Instrument Repairers and Tuners | Hangszergyártók és hangolók | hangszerjavító, hegedűjavító, organ repairer	orgonajavító, hangszerkészítő, idiofon hangszerek |
| `51-9071.06` | Gem and Diamond Workers | Ékszerészek és nemesfém-megmunkálók | ékszerkészítő, ékszerkészítő, ötvös, drágakőcsiszoló, ékszerész, drágakővágó, - csiszoló |
| `49-9045.00` | Refractory Materials Repairers, Except Brickmasons | Fazekasok és hasonló kézművesek | téglakészítő, cserép-és téglavető, téglaöntő |
| `51-9195.00` | Molders, Shapers, and Casters, Except Metal and Plastic | Fazekasok és hasonló kézművesek | téglakészítő, cserép-és téglavető, téglaöntő, keramikus |
| `27-1012.00` | Craft Artists | Címfestők, díszítőfestők, üveg-, réz-, fametszők és - 7411 Címfestő vésők | iparművész-festő |
| `43-9071.00` | Office Machine Operators, Except Computer | Nyomdaipari befejező és könyvkötő foglalkozásúak | gépi könyvkötő, nyomdaipari gépmester, könyvkötő, hajtogatógép-kezelő |
| `51-5113.00` | Print Binding and Finishing Workers | Nyomdaipari befejező és könyvkötő foglalkozásúak | gépi könyvkötő, nyomdaipari gépmester, könyvkötő, könyvfűzőgép-kezelő |
| `47-2231.00` | Solar Photovoltaic Installers | Építőipari villanyszerelők és hasonló foglalkozásúak | villanyszerelő, villamosmérnök |
| `47-4021.00` | Elevator and Escalator Installers and Repairers | Elektroműszerészek és szerelők | hajóvillamossági szerelő, villanyszerelő |
| `49-2092.00` | Electric Motor, Power Tool, and Related Repairers | Elektroműszerészek és szerelők | vidámparki karbantartó, kalandparki karbantartó, hullámvasút-karbantartó, gépjármű-akkumulátor szerelő |
| `49-3053.00` | Outdoor Power Equipment and Other Small Engine Mechanics | Elektroműszerészek és szerelők | vidámparki karbantartó, kalandparki karbantartó, hullámvasút-karbantartó |
| `49-3092.00` | Recreational Vehicle Service Technicians | Elektroműszerészek és szerelők | — |
| `49-9011.00` | Mechanical Door Repairers | Elektroműszerészek és szerelők | — |
| `49-9012.00` | Control and Valve Installers and Repairers, Except Mechanical Door | Elektroműszerészek és szerelők | — |
| `49-9031.00` | Home Appliance Repairers | Elektroműszerészek és szerelők | felvonó-karbantartó szerelő, felvonószerelő, felvonó- és szállítóberendezés-kezelő, vidámparki karbantartó |
| `49-9081.00` | Wind Turbine Service Technicians | Elektroműszerészek és szerelők | — |
| `49-9051.00` | Electrical Power-Line Installers and Repairers | Elektromosvezeték szerelők és javítók | villamoshálózati távvezeték- és kábelszerelő, villamossági szerelő, villamostávvezeték-építő, -üzemeltető |
| `49-2093.00` | Electrical and Electronics Installers and Repairers, Transportation Equipment | Elektronikai műszerészek és karbantartók | hajóelektronikai technikus, villanyszerelő, autóelektronika-telepítő, autórádió-szerelő |
| `49-2094.00` | Electrical and Electronics Repairers, Commercial and Industrial Equipment | Elektronikai műszerészek és karbantartók | hajóelektronikai technikus, villanyszerelő, jármű-elektronikai technikus, vasúti jármű-elektronikai technikus |
| `49-2096.00` | Electronic Equipment Installers and Repairers, Motor Vehicles | Elektronikai műszerészek és karbantartók | hajóelektronikai technikus, villanyszerelő, jármű-elektronikai technikus, vasúti jármű-elektronikai technikus |
| `49-9061.00` | Camera and Photographic Equipment Repairers | Elektronikai műszerészek és karbantartók | szórakoztatóelektronikai szerelő, TV-szerelő, ezermester |
| `49-2011.00` | Computer, Automated Teller, and Office Machine Repairers | Információs és kommunikációs technológiai berendezések szerelői műszerésze, javítója | számítógép-szerelő, -karbantartó, személyiszámítógép-szerelő, számítógépalkatrész-összeszerelő, mobileszköz-technikus |
| `49-2021.00` | Radio, Cellular, and Tower Equipment Installers and Repairers | Információs és kommunikációs technológiai berendezések szerelői műszerésze, javítója | rádiótechnikus, rádiószakember, telekommunikációs berendezések műszerésze, távközlési berendezések műszerésze |
| `49-2097.00` | Audiovisual Equipment Installers and Repairers | Információs és kommunikációs technológiai berendezések szerelői műszerésze, javítója | — |
| `49-9052.00` | Telecommunications Line Installers and Repairers | Információs és kommunikációs technológiai berendezések szerelői műszerésze, javítója | távközlési technikus, telekommunikációs technikus, telekommunikációs berendezések műszerésze, távközlési berendezések műszerésze |
| `45-2041.00` | Graders and Sorters, Agricultural Products | Élelmiszer- és italkóstolók és -osztályozók | élelmiszer-osztályozó, élelmiszer-minősítő technikus, tejellenőrzésért felelős szakember, tejellenőrzésért felelős szakemberek |
| `51-7011.00` | Cabinetmakers and Bench Carpenters | Műbútorasztalosok és hasonló foglalkozásúak | műbútorasztalos, bútorkárpitos, bútorfestő, bútorasztalos |
| `51-7042.00` | Woodworking Machine Setters, Operators, and Tenders, Except Sawing | Famegmunkáló gépek beállítói és üzemeltetői | szögelő, raklapszögelő, szögbelövő, fafúrós |
| `51-6052.00` | Tailors, Dressmakers, and Custom Sewers | Szabók, szűcsök és kalaposok | női szabó, átalakító szabó, szabó, varró, férfi szabó |
| `51-4062.00` | Patternmakers, Metal and Plastic | Textilszabászok | bőripari szabásminta-készítő, szabásminta-rajzoló, szériázó, ruhaipari szabásminta-készítő |
| `51-6051.00` | Sewers, Hand | Varrók, hímzők és hasonló foglalkozásúak | hímző, műhímző, emblémázó, kesztyűkészítő |
| `47-5032.00` | Explosives Workers, Ordnance Handling Experts, and Blasters | Lő- és robbantómesterek | robbantómester, kőrobbantó, robbantás-vezető |
| `45-4023.00` | Log Graders and Scalers | Termékosztályozók és -vizsgálók (kivéve az élelmiszereket) élelmiszereket) foglalkozású | furnérlap-minősítő, furnérlap-osztályozó, rétegeltlemez-osztályozó, termékminősítő |
| `51-9061.00` | Inspectors, Testers, Sorters, Samplers, and Weighers | Termékosztályozók és -vizsgálók (kivéve az élelmiszereket) élelmiszereket) foglalkozású | termékminőség-ellenőr, minőségbiztosítási munkatárs, ellenőrzési és minőségbiztosítási munkatárs, termék-összeszerelési felügyelő |
| `37-3012.00` | Pesticide Handlers, Sprayers, and Applicators, Vegetation | Kártevőirtók | féreg-, rovar- és kártevőirtó szakember, fertőtlenítéssel foglalkozó személy, rovar és kártevőirtó szakember |
| `51-9031.00` | Cutters and Trimmers, Hand | Máshová nem sorolható kézműipari és hasonló foglalkozásúak foglalkozású | — |
| `47-5012.00` | Rotary Drill Operators, Oil and Gas | Bányászok és kőfejtők | fúrómester, fúrómunkás, kútfúró |
| `47-5041.00` | Continuous Mining Machine Operators | Bányászok és kőfejtők | földalatti bányászati nehézgépkezelő, nehézgépkezelő, külszíni bányász, földalatti bányász |
| `47-5043.00` | Roof Bolters, Mining | Bányászok és kőfejtők | külszíni bányász, földalatti bányászati nehézgépkezelő, nehézgépkezelő, földalatti bányász |
| `47-5044.00` | Loading and Moving Machine Operators, Underground Mining | Bányászok és kőfejtők | földalatti bányászati nehézgépkezelő, nehézgépkezelő, földalatti bányász, mélyművelésű bányász |
| `51-9021.00` | Crushing, Grinding, and Polishing Machine Setters, Operators, and Tenders | Szilárdásványfeldolgozó-gépek kezelői | ásványőrlőgép-kezelő, ásvány-előkészítő |
| `47-5011.00` | Derrick Operators, Oil and Gas | Kútfúrók és hasonló foglalkozásúak | mélyfúrógép-kezelő, olajipari fúróberendezés-karbantartó, kapcsolós, olajipari darukezelő |
| `47-5013.00` | Service Unit Operators, Oil and Gas | Kútfúrók és hasonló foglalkozásúak | olajipari fúróberendezés-karbantartó |
| `47-5023.00` | Earth Drillers, Except Oil and Gas | Kútfúrók és hasonló foglalkozásúak | olajipari fúróberendezés-karbantartó, kapcsolós, olajipari darukezelő, derrickdaru-kezelő |
| `47-5051.00` | Rock Splitters, Quarry | Cement- és más ásványitermék-gyártó gépek kezelői | kővágógép-kezelő, kővágógép kezelője, granulátumkeverő gép kezelője, kőcsiszoló |
| `51-4035.00` | Milling and Planing Machine Setters, Operators, and Tenders, Metal and Plastic | Fémfeldolgozó berendezések kezelői | — |
| `51-4193.00` | Plating Machine Setters, Operators, and Tenders, Metal and Plastic | Fémmegmunkáló, fémbevonó és felületkezelő gépek kezelői | eloxálógép-kezelő, rétegfelhordógép-kezelő, rétegfelhordó berendezés kezelője, galvanizálógép-kezelő |
| `51-9011.00` | Chemical Equipment Operators and Tenders | Vegyipari termékeket gyártó berendezések és gépek kezelői kezelői kezelői kezelői | vegyianyag-keverő kezelője, gravitációs szeparátor kezelője, fajsúlyszeparátor-kezelő, gravitációsszeparátor-kezelő |
| `51-9023.00` | Mixing and Blending Machine Setters, Operators, and Tenders | Vegyipari termékeket gyártó berendezések és gépek kezelői kezelői kezelői kezelői | illatszerkészítő gép kezelője, nitroglicerin-semlegesítő, vegyianyag-keverő kezelője |
| `51-9041.00` | Extruding, Forming, Pressing, and Compacting Machine Setters, Operators, and Tenders | Vegyipari termékeket gyártó berendezések és gépek kezelői kezelői kezelői kezelői | szappanpréskezelő |
| `51-9151.00` | Photographic Process Workers and Processing Machine Operators | Fényképészeti termékeket gyártó gépek kezelői | fotólaboráns, mozgófilmlaboráns |
| `51-9197.00` | Tire Builders | Gumiterméket gyártó gépek kezelői | gumitermékgyártó gép kezelője |
| `51-3091.00` | Food and Tobacco Roasting, Baking, and Drying Machine Operators and Tenders | Élelmiszert és hasonló terméket gyártó gépek kezelői | malátapörkölő kezelője, malátapörkölő kezelői, malátapörkölő, kávépörkölő |
| `51-3092.00` | Food Batchmakers | Élelmiszert és hasonló terméket gyártó gépek kezelői | élelmiszergyártó gép kezelője, élelmiszergyártó gép kezelői, élelmiszergyártó gépek kezelője, édesség automata kezelője |
| `51-9012.00` | Separating, Filtering, Clarifying, Precipitating, and Still Machine Setters, Operators, and Tenders | Élelmiszert és hasonló terméket gyártó gépek kezelői | hidrogénező reaktorkezelő, hidrogénező reaktor kezelője, hidrogénező reaktor kezelői, finomító berendezés vezérlője |
| `51-9193.00` | Cooling and Freezing Equipment Operators and Tenders | Élelmiszert és hasonló terméket gyártó gépek kezelői | készételhűtő gépkezelő |
| `45-4021.00` | Fallers | Fafeldolgozó berendezések kezelői | faaprítógép-kezelő, ácsfűrészkezelő, kéreghántológép-kezelő |
| `51-7041.00` | Sawing Machine Setters, Operators, and Tenders, Wood | Fafeldolgozó berendezések kezelői | fűrészüzemi gépkezelő, ácsfűrészkezelő |
| `51-9032.00` | Cutting and Slicing Machine Setters, Operators, and Tenders | Máshová nem sorolható helyhez kötött berendezések és 8190 Egyéb, máshova nem sorolható feldolgozóipari gép gépek kezelői kezelője gépek kezelői gépek kezelői gépek kezelői gépek kezelői gépek kezelői kezelője | áttekercselő-daraboló gép kezelője |
| `51-9051.00` | Furnace, Kiln, Oven, Drier, and Kettle Operators and Tenders | Máshová nem sorolható helyhez kötött berendezések és 8190 Egyéb, máshova nem sorolható feldolgozóipari gép gépek kezelői kezelője gépek kezelői gépek kezelői gépek kezelői gépek kezelői gépek kezelői kezelője | — |
| `51-9191.00` | Adhesive Bonding Machine Operators and Tenders | Máshová nem sorolható helyhez kötött berendezések és 8190 Egyéb, máshova nem sorolható feldolgozóipari gép gépek kezelői kezelője gépek kezelői gépek kezelői gépek kezelői gépek kezelői gépek kezelői kezelője | élzárógép-kezelő, élfóliázógép-kezelő, élzáró |
| `53-7011.00` | Conveyor Operators and Tenders | Máshová nem sorolható helyhez kötött berendezések és 8190 Egyéb, máshova nem sorolható feldolgozóipari gép gépek kezelői kezelője gépek kezelői gépek kezelői gépek kezelői gépek kezelői gépek kezelői kezelője | — |
| `53-7063.00` | Machine Feeders and Offbearers | Máshová nem sorolható helyhez kötött berendezések és 8190 Egyéb, máshova nem sorolható feldolgozóipari gép gépek kezelői kezelője gépek kezelői gépek kezelői gépek kezelői gépek kezelői gépek kezelői kezelője | — |
| `51-2021.00` | Coil Winders, Tapers, and Finishers | Erős- és gyengeáramú berendezések összeszerelői | villamosberendezés-összeszerelő, elektronikai berendezés összeszerelője, elektronikaiberendezés-összeszerelő |
| `51-2022.00` | Electrical and Electronic Equipment Assemblers | Erős- és gyengeáramú berendezések összeszerelői | villamosberendezés-összeszerelő, elektronikai berendezés összeszerelője, elektronikaiberendezés-összeszerelő, elektronikus berendezések összeszerelője |
| `51-9141.00` | Semiconductor Processing Technicians | Erős- és gyengeáramú berendezések összeszerelői | elektronikus berendezések összeszerelője, elektronikusberendezés-összeszerelő, SMT-gépkezelő, felületszerelőgép-kezelő |
| `53-4011.00` | Locomotive Engineers | Mozdonyvezetők | mozdonyvezető |
| `53-4041.00` | Subway and Streetcar Operators | Mozdonyvezetők | mozdonyvezető |
| `49-9097.00` | Signal and Track Switch Repairers | Vasúti fékezők, jelzőberendezés- és váltókezelők | vasúti átjárót biztosító jelzőberendezés kezelője, vasúti váltókezelő, váltókezelő, kocsirendező |
| `53-4013.00` | Rail Yard Engineers, Dinkey Operators, and Hostlers | Vasúti fékezők, jelzőberendezés- és váltókezelők | vasúti váltókezelő, váltókezelő, kocsirendező, tolatásvezető |
| `53-4022.00` | Railroad Brake, Signal, and Switch Operators and Locomotive Firers | Vasúti fékezők, jelzőberendezés- és váltókezelők | vasúti átjárót biztosító jelzőberendezés kezelője, vasúti váltókezelő, váltókezelő, kocsirendező |
| `53-3031.00` | Driver/Sales Workers | Személy- és tehergépkocsi-vezetők, taxisofőrök | futár, kézbesítő, biciklis futár |
| `53-3033.00` | Light Truck Drivers | Személy- és tehergépkocsi-vezetők, taxisofőrök | taxis, mikrobuszvezető, páncélozott gépjármű vezetője, biztonsági őr |
| `53-3053.00` | Shuttle Drivers and Chauffeurs | Személy- és tehergépkocsi-vezetők, taxisofőrök | halottaskocsi-vezető, magánsofőr, londíner, komornyik |
| `53-3032.00` | Heavy and Tractor-Trailer Truck Drivers | Kamion- és teherautósofőrök | tehergépkocsi-vezető, kamionsofőr, kamionsofőr, tehergépkocsi-vezető, veszélyes árut szállító jármű vezetője |
| `53-7051.00` | Industrial Truck and Tractor Operators | Kamion- és teherautósofőrök | költöztető tehergépkocsi vezetője, kamionsofőr, tehergépkocsi-vezető, tehergépkocsi-vezető, kamionsofőr |
| `45-2091.00` | Agricultural Equipment Operators | Mezőgazdasági és erdészeti mobilgépek kezelői | mezőgazdasági gépüzemeltető szaktechnikus, mezőgazdasági szervizüzemi szaktechnikus, mezőgazdasági gép karbantartója, mezőgazdasági gépek ellenőrzésért felelős szakember |
| `47-2071.00` | Paving, Surfacing, and Tamping Equipment Operators | Földmozgató és hasonló gépek kezelői | buldózerkezelő, munkagépkezelő, markológép-kezelő, exkavátorkezelő |
| `47-2073.00` | Operating Engineers and Other Construction Equipment Operators | Földmozgató és hasonló gépek kezelői | buldózerkezelő, munkagépkezelő, markológép-kezelő, exkavátorkezelő |
| `47-4091.00` | Segmental Pavers | Földmozgató és hasonló gépek kezelői | útépítő, aszfaltozó, munkagépkezelő |
| `47-5022.00` | Excavating and Loading Machine and Dragline Operators, Surface Mining | Földmozgató és hasonló gépek kezelői | külszíni bányászati nehézgépkezelő, külszíni fejtő, nehézgépkezelő főfejtőben, buldózerkezelő |
| `53-7041.00` | Hoist and Winch Operators | Daruk, emelők és hasonló gépek kezelői | konténerdaru kezelője, darukormányos, darukezelő, mobildaru-kezelő |
| `45-3031.00` | Fishing and Hunting Workers | Hajók fedélzeti személyzete és hasonló foglalkozásúak | fedélzetmester halászhajón, fedélzetmester, matróz halászhajón, matróz |
| `53-5022.00` | Motorboat Operators | Hajók fedélzeti személyzete és hasonló foglalkozásúak | hajókarbantartó, matróz, hajótakarító |
| `37-2012.00` | Maids and Housekeeping Cleaners | Háztartási takarítók és kisegítők | háztartási takarító, szobalány, háztartási takarító és kisegítő |
| `37-2011.00` | Janitors and Cleaners, Except Maids and Housekeeping Cleaners | Irodai, szállodai és egyéb intézményi takarítók és kisegítők | épülettakarító, intézményi takarító és kisegítő, kórházi takarító, vonattakarító |
| `51-6021.00` | Pressers, Textile, Garment, and Related Materials | Mosónők és vasalónők | gépi vasaló, ruhaneműhöz és kapcsolódó anyagokhoz használt vasalógép kezelője, vasalónő |
| `51-9192.00` | Cleaning, Washing, and Metal Pickling Equipment Operators and Tenders | Egyéb takarító foglalkozásúak | — |
| `47-5081.00` | Helpers--Extraction Workers | Bányászati és kőfejtő segédmunkások | bányászati technikus, bányaipari technikus |
| `47-2061.00` | Construction Laborers | Mélyépítő segédmunkások | mélyépítő technikus |
| `47-4051.00` | Highway Maintenance Workers | Mélyépítő segédmunkások | mélyépítő technikus |
| `53-6011.00` | Bridge and Lock Tenders | Mélyépítő segédmunkások | — |
| `47-4031.00` | Fence Erectors | Magasépítő segédmunkások | építőipari munkás, építőmunkás, építőipari technikus |
| `51-9198.00` | Helpers--Production Workers | Máshová nem sorolható képesítést nem igénylő ipari foglalkozásúak | gyári segédmunkás, gyári kisegítő |
| `53-7062.00` | Laborers and Freight, Stock, and Material Movers, Hand | Rakodómunkások | költöztető, irodaköltöztető, szállító-költöztető, anyagmozgató |
| `53-7065.00` | Stockers and Order Fillers | Rakodómunkások | raktáros, raktári munkás, raktári csomagoló |
| `53-7121.00` | Tank Car, Truck, and Ship Loaders | Rakodómunkások | — |
| `35-2011.00` | Cooks, Fast Food | Gyorsételek készítői | gyorskiszolgáló éttermi személyzet, gyorséttermi személyzet, gyorskiszolgáló étterem személyzetének tagja |
| `35-2015.00` | Cooks, Short Order | Gyorsételek készítői | gyorskiszolgáló éttermi személyzet, gyorséttermi személyzet, gyorskiszolgáló étterem személyzetének tagja |
| `35-3023.00` | Fast Food and Counter Workers | Gyorsételek készítői | gyorskiszolgáló éttermi személyzet, gyorséttermi személyzet, gyorskiszolgáló étterem személyzetének tagja |
| `35-2021.00` | Food Preparation Workers | Konyhai kisegítők | konyhai kisegítő, konyhai dolgozó, étkezdei kisegítő |
| `35-9021.00` | Dishwashers | Konyhai kisegítők | ételkiosztó tálaló konyhai kisegítő, konyhai dolgozó, konyhai kisegítő |
| `41-9091.00` | Door-to-Door Sales Workers, News and Street Vendors, and Related Workers | Utcai árusok (kivéve az élelmiszerárusokat) | utcai árus, vásári kereskedő, piaci árus |
| `39-6011.00` | Baggage Porters and Bellhops | Kézbesítők, csomagkihordók és hordárok | londiner, londinerek, hordár |
| `43-5021.00` | Couriers and Messengers | Kézbesítők, csomagkihordók és hordárok | — |
| `49-9071.00` | Maintenance and Repair Workers, General | Alkalmi munkások | karbantartó, szerelő, épületkarbantartó technikus |
| `49-9091.00` | Coin, Vending, and Amusement Machine Servicers and Repairers | Mérőóra-leolvasók és árusító automaták pénzbegyűjtői | automataüzemeltető, fénykép-automata üzemeltetője, automatatöltő |
| `39-3031.00` | Ushers, Lobby Attendants, and Ticket Takers | Máshová nem sorolható képesítést nem igénylő foglalkozásúaki foglalkozásúaki és szállítási foglalkozású | jegyszedő, hivatalsegéd, színházi ültető, szórakoztatóparki és rekreációs munkatárs |

## Levezetési mátrix (Work Style → HEXACO)

| O\*NET Work Style | HEXACO loading |
|---|---|
| Integrity | H +1.00 |
| Sincerity | H +1.00 |
| Humility | H +1.00 |
| Empathy | A +0.50, E +0.50 |
| Cooperation | A +1.00 |
| Self-Control | A +0.60, C +0.40 |
| Adaptability | A +0.60, E -0.40 |
| Stress Tolerance | E -1.00 |
| Optimism | E -0.50, X +0.50 |
| Self-Confidence | X +0.60, E -0.40 |
| Social Orientation | X +1.00 |
| Leadership Orientation | X +1.00 |
| Initiative | X +0.50, C +0.50 |
| Perseverance | C +1.00 |
| Achievement Orientation | C +1.00 |
| Dependability | C +1.00 |
| Attention to Detail | C +1.00 |
| Cautiousness | C +1.00 |
| Innovation | O +1.00 |
| Intellectual Curiosity | O +1.00 |
| Tolerance for Ambiguity | O +0.70, E -0.30 |

Az `E` (emocionalitás) fordított skálájú: a stressztolerancia, önbizalom és optimizmus NEGATÍV loadinggal szerepel benne. Az `aesthetic appreciation` HEXACO-facetnek nincs O\*NET Work Style megfelelője — ez a levezetés ismert hiányossága.
