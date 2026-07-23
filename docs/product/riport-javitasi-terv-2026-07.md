# Persona-riport javítási terv — 2026-07-23

> Kiindulás: a 48 persona-riportos dosszié (`docs/testing/persona-riportok.pdf`)
> külső szakmai verdiktje (szervezetpszichológus + HR Director szemüveg), plusz
> a content-pipeline kód-szintű átvilágítása. A verdikt fő irányai helytállóak;
> ez a terv a megállapításokat kód-szintű gyökérokokra fordítja le, és
> priorizált backloggá alakítja.

## 0. A verdikt értékelése röviden

| Verdikt-állítás | Ítélet | Megjegyzés |
|---|---|---|
| Túl sok kategorikus állítás („Hitelesen és manipulációmentesen működsz") | ✅ jogos | `strengthVerbs`/`weakVerbs` térképek, kijelentő mód, minden oldal fejlécében ismétlődik |
| Szerepkör-ajánlás túl korai/erős | ✅ jogos, súlyosabb | a roleFit forrása EGYETLEN kulcs: `block6Pairs[0]` vagy a domináns solo dim — a második dimenzió nem módosítja (ezért azonos a blokk az Empatikus/Együttműködő/Módszeres értékőrnél) |
| Csapatszerep 60/59/58 álprecizitás | ✅ jogos | + szinte minden profil Koordinátor/Megvalósító — gyenge differenciálás |
| Nincs konfliktus/vakfolt/stressz | ⚠️ részben | a feszültség-pár riportokban van („élesebb reakciók konfliktusban", „Ahol segít a felkészülés") — a baj: vékony, és a solo-dim (archetípus) ágon tényleg túl puha |
| Alskálák: túl sok, kell Top3/Bottom2 | ⚠️ részben | a „Kiemelkedő alskálák" chip-sor már top+bottom kiemelés; a lista maradhat, az értelmezést kell erősíteni |
| Ismétlődés, sablonosság | ✅ jogos, konkrétabb | „A legfontosabbak" ugyanabból a forrásból jön, mint az „Ahogy működsz" (szó szerinti duplikáció); „a(z)" feloldatlan névelő-sablonok |
| Executive summary hiányzik | ✅ jogos | |
| Dupla cím a borítón | ❌ teszt-műtermék | personáknál `userName` = archetípus-név; éles usernél név + archetípus, nem hiba |
| 12 új szekció (motiváció, kommunikáció…) | ⚠️ szűrve | jó ötletbank, de először 3–4 modul, különben a „túl sok állítás" probléma duplázódik |

Amit a verdikt nem vett észre (kód-átvilágításból):

1. **A „Top 10% / Top 25%" badge nem valós percentilis** — a saját hat
   dimenzió-pontszám átlagából számolódik (`avg >= 70 → "Top 10%"`,
   `>= 60 → "Top 25%"`). Normacsoport nélkül ez a riport leggyengébb
   hitelességi pontja. (`generate-persona-reports.tsx` + `results/page.tsx`)
2. **„a(z)" feloldatlan névelők** user-facing szövegben:
   `facetHighAndLow`, `facetHighOnly`, `facetLowOnly`, `toplineGapPrefix`,
   `summaryGoodMatchDeeper`, `noResultBody` (i18n/results.ts).
3. **Takeaways-duplikáció**: solo-dim ágon a `takeaways` ugyanazokat a
   `SOLO_DIM_NARRATIVES` szövegeket kapja, mint a `howYouWork`
   (workstyle-content.ts 137–143 vs 173–178) — a záró blokk szó szerint
   megismétli az előző szekciót.
4. **Tartalom-térképek négy helyen duplikálva**: a `strengthVerbs`/
   `weakVerbs`/`strengthDescs`/`watchDescs` a results-oldalon, a
   ProfileTabs-ban, a hiring-oldalon és a generátor-scriptben élnek
   párhuzamosan — drift-veszély, központosítandó.
5. A „Segítőkészség" kiegészítő skála szövege minden sávban ugyanaz a
   generikus mondat — jelenleg nulla információt ad.

## 1. Backlog

Jelmagyarázat: becslés S (≤ fél nap) / M (1–2 nap) / L (több nap).

### P1 — Hitelesség (azonnal)

| # | Feladat | Hol | Becslés |
|---|---|---|---|
| 1.1 | „Top 10%/25%" ál-percentilis eltávolítása (amíg nincs valós normaadat) | `results/page.tsx`, `generate-persona-reports.tsx`, share-kártya | S |
| 1.2 | „a(z)" névelő-feloldás magyar helyesírás szerint (helper + érintett i18n kulcsok) | `i18n/results.ts` + hívók | S |
| 1.3 | Takeaways-duplikáció megszüntetése: solo-dim ágra saját, rövid összefoglaló szövegek (12 db, HU+EN), hipotézis-keretezéssel | `profile-content.ts`, `workstyle-content.ts` | S–M |
| 1.4 | Kategorikus tagline-ok valószínűségi átfogalmazása („jellemzően", „válaszaid alapján") — kijelentő jellem-ítéletek helyett | verb/desc térképek | S |
| 1.5 | Verb/desc térképek központosítása egy modulba (drift ellen) | új `src/lib/dimension-insights.ts` | S |
| 1.6 | „Hogyan olvasd ezt a riportot?" módszertani blokk: önbeszámoló, valószínűség nem címke, környezet/stressz módosít | PDF (Start/Reflect oldal) + eredmény-oldal | S–M |

### P2 — Tartalmi mélység

| # | Feladat | Hol | Becslés |
|---|---|---|---|
| 2.1 | Vakfolt + „nyomás alatt" blokk az archetípus (solo-dim) ágra: dimenziónként/kombinációnként 2–3 hipotézisként keretezett kockázat | `profile-content.ts` (új content-készlet) + PDF/UI blokk | M |
| 2.2 | RoleFit differenciálás: a második dimenzió módosítsa a szöveget (pár-kulcs hiányában dim1×dim2 kombinált tag-készlet), óvatosabb framing + „a személyiség csak egy tényező" disclaimer | `workstyle-content.ts`, `ROLE_TAGS`/`SOLO_ROLE_TAGS` | M–L |
| 2.3 | Csapatszerep-becslés: pontszám helyett sáv (Elsődleges/Jelentős/Lehetséges), és a becslő spread-jének felülvizsgálata (miért fut ki minden Koordinátorra) | `team-role-estimate.ts`, `PdfTeamRoles` | M |
| 2.4 | Fejlődési javaslat: dimenziónként 1 konkrét, viselkedéses tanács (a „Nyitottságon van tér fejlődni" helyett) | content-készlet + PDF | M |
| 2.5 | „Segítőkészség" skála: sávonként (low/mid/high) külön értelmező szöveg | kérdésbank-config / content | S |

### P3 — Élmény és nyelv

| # | Feladat | Hol | Becslés |
|---|---|---|---|
| 3.1 | Executive summary oldal a riport elejére: 3 erősség, 2 vakfolt, stressz alatt, csapatban, fejlesztési fókusz | új PDF-oldal | M |
| 3.2 | Nyelvi variancia: szinonima-készlet a „hiteles/integritás" ismétlésre; sablonmondatok 2–3 változatban | content-készletek | M |
| 3.3 | Tördelés: 4. oldal (Ahogy működsz + roleFit) tömörítése, félig üres oldalak összevonása | PDF pages | S–M |
| 3.4 | Középsávos (40–60) dimenzió-szövegek variálása (most minden 55-ös ugyanazt a mondatot kapja) | kérdésbank insights | M |

### P4 — Következő kör (differenciátor)

| # | Feladat | Hol | Becslés |
|---|---|---|---|
| 4.1 | 3–4 új modul a verdikt 12-es listájából: motiváció/demotiváció, kommunikációs stílus, döntéshozatal, ideális környezet — fokozatosan | content + PDF | L |
| 4.2 | Típus-közi együttműködés fejezet (kivel természetes, hol súrlódik, mi kell a biztonságérzethez) — a team-pattern réteg egyéni riportba fordítása | `team-pattern.ts` → riport | L |
| 4.3 | Valós normacsoport felépítése → ekkor térhet vissza a percentilis, immár definiáltan | adat + scoring | L |

## 2. Megjegyzések

- A dosszié riportok *közötti* ismétlődése részben a determinisztikus
  teszt-personák műterméke (a maradék 4 dimenzió fix 55/50/45/30), de pont ez
  teszi láthatóvá: a content-motor dimenziónként templátol, a két domináns
  dimenzió kombinációja a szövegben alig keveredik. A „blending" (2.2, 4.1)
  a legnagyobb tartalmi feladat.
- A CLAUDE.md hitelességi alapelve („becsült vs mért adat mindig jelölve")
  jelenleg sérül a percentilis-badge-nél — az 1.1 ezt állítja helyre.
- Minden szövegváltozás HU+EN párban készül (i18n-konvenció).

## 3. Állapotkövetés

- [x] P1.1 percentilis — 2026-07-23 (results/page.tsx + generátor; ProfileHero/PdfHeader propok érintetlenek, üres értékre rejtenek)
- [x] P1.2 a(z) — 2026-07-23 (új `src/lib/hu-grammar.ts`; results.ts 6 kulcs + PlusFacetsPage/ReflectPage hívók)
- [x] P1.3 takeaways-duplikáció — 2026-07-23 (új `SOLO_DIM_SUMMARIES` 12 db HU+EN, erőforrás + figyelő-pont műfajban)
- [x] P1.4 valószínűségi nyelv — 2026-07-23 (hero-tagline verb-térképek + 3 legkategorikusabb solo-narratíva felütés)
- [x] P1.5 térkép-központosítás — 2026-07-23 (új `src/lib/dimension-insights.ts`; results page, ProfileTabs, generátor átállítva)
- [x] P1.6 módszertani blokk — 2026-07-23 (PlusWorkStylePage + `pdf.methodNoteTitle/Body` i18n kulcsok)

Ellenőrzés: `tsc --noEmit` 0 hiba; content-pipeline harness futtatva
(duplikáció-mentes takeaways, helyes névelők, tagline-ok). A dosszié
újragenerálása: `pnpm report:personas` (a seed-personák változatlanok).
- [x] P2.1 vakfolt + nyomás alatt — 2026-07-23 (`SOLO_DIM_PRESSURE` 12 db, „Vakfoltok és nyomás alatt" kártya a PDF-en, hipotézis-disclaimerrel) · commit c3fd286
- [x] P2.2 roleFit differenciálás — 2026-07-23 (`SOLO_DIM_ROLE_MODIFIERS` 12 db + tag-merge a „Működhet" sávba + „a személyiség csak egy tényező" disclaimer; mellékjavítás: a PdfRoleFit sáv-címkék EN-riportban eddig magyarul jelentek meg) · commit 70d2db2
- [x] P2.3 csapatszerep-sávok — 2026-07-23 (becslésnél sáv-címke pontszám nélkül: Elsődleges/Jelentős/Lehetséges; mért kérdőívnél marad a pontszám; mellékjavítás: PdfTeamRoles locale) · commit 49432c7
- [x] P2.4 fejlődési javaslat — 2026-07-23 (`DIMENSION_GROWTH_TIPS` 6 db; „Fejlődési fókusz" kártya, csak <40 pontos legalacsonyabb dimenziónál) · commit f600fdc
- [~] P2.5 Segítőkészség-szövegek — részben okafogyott: a skálának már van low/mid/high sávszövege a kérdésbank-configban; a dossziéban látott ismétlődés a fix 50-es persona-pontszám műterméke. Teendő később: a sávszövegek gazdagítása (P3.4-gyel együtt).
- [x] P3.1 executive summary — 2026-07-23 (új `SummaryPage`: archetípus + tagline + dimenzió-sáv + erősségek/vakfoltok/nyomás alatt/csapatban/fejlődési fókusz; `SOLO_DIM_PRESSURE` strukturálva stress/blindspot mezőkre) · commit 0bf8782
- [x] P3.2 nyelvi dedup — 2026-07-23 (az erősség/figyelendő bulletek a tagline-tól eltérő szókinccsel; a teljes szinonima-variancia gépezet — több sablonváltozat determinisztikus váltogatása — külön copy-deck döntést igényel, később) · commit 6207323
- [x] P3.3 tördelés — 2026-07-23 (renderelt mintán ellenőrizve: a munkastílus-oldal a P2-blokkokkal megtelt, a legzsúfoltabb feszültség-pár eset is egy oldalon marad; külön tördelési változtatás nem kellett)
- [ ] P3.4 középsávos dimenzió-szövegek variálása — elhalasztva: a kérdésbank-config insight-struktúrájának bővítését igényli (sávonként több változat + determinisztikus választás); copy-deck után érdemes.
- A becslő spread-je (P2.3 megjegyzés): a súlyozott becslő tendenciózusan Koordinátor/Megvalósító irányba húz — algoritmus-módosítást validációs adat nélkül nem tettünk; a sáv-megjelenítés ezt kommunikációs szinten kezeli. Újranézendő valós kérdőíves adatok birtokában.
