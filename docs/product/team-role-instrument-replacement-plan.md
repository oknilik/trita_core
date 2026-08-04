# Csapatszerep self-kérdőív jogi kiváltása — terv (SPI-mentesítés)

> Készült: 2026-07-20 · A TSFI-playbook megismétlése a csapatszerep-mérésre.
> Kapcsolódó: `team-role-360-plan.md`, `team-role-items-draft.md`,
> `tritan-naming.md` (minta a névtér-váltásra).

## 1. Helyzet — mi a kitettség

Az audit eredménye (2026-07-20):

- `src/lib/team-role-questions.ts`: 7 szekció × 8 állítás, pontelosztásos —
  a kódkomment szerint is „standard Self-Perception Inventory mapping".
  A szerkezet, a formátum ÉS a scoring-térkép
  (`TEAM_ROLE_SCORING_MAP`) a Belbin-instrumentum tükre. **Ez a fő
  kitettség** — az instrumentum licencköteles, a Belbin Associates
  aktívan érvényesíti.
- `team-role-scoring.ts` EN címkék: szó szerint a Belbin-szerepnevek
  (Plant, Shaper, Completer Finisher…). A HU nevek már saját fordítások.
- Prisma: `@@map("BelbinAnswer")`, `@@map("BelbinScore")`,
  `belbinAnswerId`, `belbinRoundActive/StartedAt` oszlopnevek.
- Kódban máshol „Belbin" csak történeti dokumentumokban (2026-04-es
  changelogok, sprint-terv) — ezek changelog-elv szerint maradnak.
- User-facing szövegben Belbin-említést az audit nem talált.

## 2. Elvi keret (ugyanaz, mint a HEXACO→TSFI-nél)

- A **9 szerep-konstruktum** (a csapatszerep-kutatás eredménye) szabadon
  használható fogalmi keret — ahogy a hatfaktoros modell is az volt.
- A **védett elem**: az SPI/OA itemszövegei, a 7×8 pontelosztásos
  szerkezet, a scoring-kulcs és a „Belbin" név/védjegy.
- Ezért a kiváltás NEM fordítás-átfogalmazás, hanem **másik instrumentum**:
  saját itemek, más válaszformátum, saját scoring — a konstruktumok
  megtartásával. Kommunikációban: „Trita csapatszerep-modell" (9 szerep),
  Belbin-hivatkozás sehol, kivéve kutatás-módszertani jegyzet a blog/doc
  szinten („a csapatszerep-kutatási hagyományra épül" — név nélkül, vagy
  irodalmi hivatkozásként, ahogy a TRITAN-blognál megoldottuk).

## 3. Az új self-instrumentum

**Döntés (2026-07-20): a self-kérdőív ugyanarra a 27 itemes bankra épül,
mint a peer-kör** (`team-role-items-draft.md`), E/1 megfogalmazásban,
azonos formátummal (8–12 kijelölés + top 3 kiemelés).

Miért jó ez architekturálisan és pszichometriailag:

1. **Egy munka, két mérés** — az itembank-effort nem duplázódik.
2. **Tiszta önkép–csapatkép összevetés** — azonos itemeken mért self és
   peer profil különbsége valódi percepció-különbség, nem
   instrumentum-különbség.
3. **Rövidebb kitöltés** — a 7×10 pontos elosztásnál (ami kognitívan
   terhelő) gyorsabb és mobilbarátabb a chip-kiválasztás.
4. **Jogilag a legtávolabb** a 7×8 pontelosztásos eredetitől: más itemek,
   más formátum, más scoring.

Scoring: azonos a peer-oldalival (súlyozott kijelölés → 0–100 szerep-
profil → top 3), forrás: `"questionnaire"` marad.

## 4. Átállási terv (kód)

1. **Névtér** — `team-role-scoring.ts`:
   - EN display-nevek cseréje: Idea Generator · Opportunity Scout ·
     Coordinator · Driver · Critical Evaluator · Team Supporter ·
     Executor · Quality Guardian · Domain Expert.
   - Szerep-kódok: a PL/RI/CO/SH/ME/TW/IM/CF/SP kódok a Belbin-nevek
     rövidítései → cseréljük a saját HU-bázisú kódokra (OG/KE/KO/HA/ER/
     CS/MV/MI/SZ, az itembank szerint). Most olcsó: a DB friss-reset
     állapotban van, adatmigráció nincs. (Ha mégis maradna régi sor:
     egyszeri kód-térkép szkript.)
2. **Kérdésbank** — `team-role-questions.ts` lecserélése az új 27 itemes
   bankra (self+peer változat egy modulban, `perspective` flaggel — a
   TSFI self/observer mintája).
3. **Kitöltő UI** — a 7-szekciós pontelosztó helyett a chip-kiválasztó
   (a peer-kitöltővel közös komponens-készlet — a 360-plan 6. pontja).
4. **Scoring** — `calculateTeamRoleScores` új implementáció (súlyozott
   kijelölés); a `TEAM_ROLE_SCORING_MAP` törlődik. `getTopRoles`
   változatlan. A TRITAN-becslés (`team-role-estimate.ts`) érintetlen —
   az a saját súlytérképünk.
5. **Séma-átnevezés az init migrációban** (most ingyen van, DB-reset
   állapotban): `BelbinAnswer` → `TeamRoleAnswer`, `BelbinScore` →
   `TeamRoleScore`, `belbinAnswerId` → `teamRoleAnswerId`,
   `belbinRoundActive/StartedAt` → `teamRoleRound*` — a `@@map`/`@map`
   sorok egyszerűen törölhetők, a Prisma-nevek már jók. A
   `TeamRoleAnswer.answers` Json-formátuma az új formátumra vált
   (`{ selections: { itemId: 1|2 } }`).
6. **Tesztek**: scoring-unit újraírás (kijelölés-súlyozás, top-3
   határesetek), a nav/riport-tesztek érintetlenek.

Effort: a 360-plan becslésében ez NAGYRÉSZT benne van (közös itembank,
közös kitöltő-komponensek); a self-oldali többlet: kitöltő-oldal átállás
+ scoring-csere + séma-átnevezés ≈ **+6–8 óra** a 37 órán felül.

## 5. Sorrend és kapuk

1. Itembank véglegesítés (nyelvi kör + kereszttöltés-ellenőrzés) — ELSŐ,
   mert minden más erre épül.
2. Séma-átnevezés + init migráció (user gépén: db push + generate).
3. Self-átállás (4. pont) — ezzel a jogi kitettség megszűnik, a peer-kör
   nélkül is értékes önmagában.
4. Peer-kör a 360-plan szerint.
5. QA a dry run keretében (5. hét); go/no-go kritérium: ha a peer-kör
   csúszik, a self-átállás akkor is élesedik (a jogi kiváltás nem
   opcionális), a TEAM_ROLE_360 lépést egyszerűen nem vesszük be az első
   kampányba.

## 6. Kommunikációs jegyzet

- User-facing szövegben a mérés neve: „csapatszerep-kérdőív" /
  „csapatszerep-visszajelzés"; a modell: „Trita csapatszerep-modell
  (9 szerep)".
- A CLAUDE.md „Felmérés — FONTOS" szekciója bővítendő egy csapatszerep-
  bekezdéssel (a HEXACO-szabály mintájára): user-facing szövegben ne
  szerepeljen „Belbin"; a szerep-konstruktumok generikus néven futnak.
- Az ügyvédi anyagcsomagba (B1) kerüljön be: az új instrumentum
  provenance-jegyzete (saját itemek, saját formátum, konstruktum-szintű
  merítés a publikált csapatszerep-kutatásból) — a
  `tsfi-item-provenance.md` mintájára készül majd
  `team-role-item-provenance.md`.
