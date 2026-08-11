# Motor-audit — második kör (vak újra-vizsgálat, 2026-08-10)

> Vizuális riport (ábrákkal): claude.ai artifact „Trita motor-audit · második kör
> — friss szem". Ez a doksi a repo-belüli referencia.
>
> **Módszer:** az első kör (`motor-audit-2026-08-10.md`) leleteinek javítása
> után (PR #22) hat friss elemző átnézte a JAVÍTOTT kódot, tiltva a `docs/audits/`
> és `docs/development/changelog/` olvasása — elfogulatlan, kód-alapú ítélet. A
> „✓ igazolt" jelű leleteket külön kód-olvasás visszaellenőrizte.
>
> **Összkép:** az első kör javításai megerősítve, 0 regresszió. A friss szem
> viszont mélyebb réteget talált: 5 élő bug, 7 biztonsági/hozzáférési lelet, és
> egy rendszerszintű statisztikai minta.
>
> **JAVÍTÁSI ÁLLAPOT (2026-08-10, még aznap):** a teljes lista javítva — mind az
> 5 élő bug, mind a 7 biztonsági lelet, a csapat-réteg statisztikai fegyelme
> (Bessel-korrekció, aligned/bizalom de-konfláció, coverage-tudat), a karrier-
> motor mélyrétege és a konszolidáció. Részletek:
> `docs/development/changelog/2026-08-10-motor-audit-v2-javitas.md`. Pilot-adatra
> vár: a csapat-küszöbök és a karrier-súlyok tényleges kalibrációja (az eszközök
> `scripts/research/` alatt készen). Strukturális változást igényel: a
> differencia-támadás maradék kockázata (részleges mitigáció megtörtént).

## 1. Élő bugok (kódban visszaellenőrizve)

1. **Vendég-teszt archetípus I-szivárgás** — `/try/complete/page.tsx:12-18` a 60
   rövid item mindegyikéből épít teaser-metát, nem szűri az interstitiális `I`
   (Altruizmus) 2 itemét; a `computeGuestTeaserScores`-nak sincs allow-listje. Ha
   `I` a top-2-be kerül (gyakori): üres glyph (`TypeGlyph` null ismeretlen kódra),
   „I × …" felirat — miközben a `typeLabel` jól szűr → önellentmondó teaser.
   *Fix:* `TRITAN_ORDER`-szűrés a scoringMetában vagy a teaser-scorerben + assert.
2. **Hiring csapatátlag-tick láthatatlan** — `hiring/.../[inviteId]/page.tsx:543`
   `bg-[var(--color-surface-inverse)]-body/40` nem létező Tailwind-utility (elrontott
   token-migráció, egyedi előfordulás) → a csapatátlag-jelölő háttér nélkül renderel.
3. **Org HEXACO-átlag a legkorábbi kitöltésből** — `org-stats.ts:247`
   `distinct:["userProfileId"]` `orderBy` NÉLKÜL (a `:143` testvér-lekérdezés
   helyesen `orderBy createdAt desc`-et tesz elé); a Prisma distinct az első sort
   tartja → `tritanAvg`/`completedMemberCount` valószínűleg a legelső kitöltésből,
   minden más felület a legutolsóból.
4. **Ragadós kitöltési zsákutca** — `AssessmentClient.tsx:79,86-98,250-260` a
   szerver-piszkozatot szűrés nélkül seedeli; a formán kívüli id-k benne maradnak az
   `answeredCount`-ban és a submit-payloadban → 400 (`isCompleteFormAnswerSet`), a
   debounced mentés visszaírja → helyrehozhatatlan hurok. Az observer-kliens jól
   sanitizál (párhuzamos-implementáció eltérés).
5. **Ideális-környezet tábla EN üres pólusok + RESO fordított jelölés** —
   `IdealEnvironmentSection.tsx:28,36-82` a marker-pozíciót lokalizált felirat-szóból
   parse-olja; `getEnvRows` EN-ben „Load management"-et ad, a `POLES` kulcs „Stress
   tolerance" → üres pólus-feliratok; a RESO-sor szint-szava invertált → az érzékeny
   profil középre, a terhelhető 80-ra kerül.

## 2. Biztonság / hozzáférés

1. **Candidate team-role route megkerüli a validátort** (✓) —
   `api/candidate/[token]/team-role/route.ts:35-41` nem ellenőrzi a „pontosan 3
   kiemelt (weight 2)" szabályt; 12 item mind 2-es súllyal → 24 összsúly → 4 szerep
   egyszerre 100%. A két hitelesített útvonal az `isValidTeamRoleSelectionSet`-et hívja.
2. **`/api/career/fit` nincs `CAREER_MODULE_READY` mögött** (✓) —
   `career/fit/route.ts:36-39` csak auth + rate-limit; a parkolt motor API-ból elérhető.
   Ugyanígy `industry-fit/feedback`, `career-background`.
3. **Jóváhagyás-kapu megkerülhető** — a token-életciklus az `AWAITING_APPROVAL`-t
   „aktív"-nak veszi → az observe-oldal renderel és a submit elfogad jóváhagyás előtt,
   miközben a draft-endpoint `PENDING`-re kapuz (ellentmondó kapuk).
4. **Fiók-törlés nem érinti az observer-sorokat** (GDPR) — a raterek
   observerEmail/Name marad, PENDING tokenek élnek, a reminder tovább emailez, a
   `/observe/[token]` beküldhető törölt célpontra.
5. **Differencia-támadás a futó observer-átlagon** — `r₃ = 3·avg₃ − 2·avg₂`; a
   célszemély tudja ki/mikor végzett (név a completion-értesítésben, élő poll, lista
   completedAt-tal) → az n≥3 anonimitás-ígéret nem véd; facet-szinten a kapu 2.
6. **Önhamisítás a külső observer-linken** — EXTERNAL/link-meghívónál nincs
   címzett-ellenőrzés, a meghívó visszakapja a saját tokenjeit → kitöltheti a saját
   „külső" értékeléseit.
7. **Rate-limit + méret-korlát hiánya** — csak `assessment/submit` rate-limitel; a
   `claim-guest`, `observer/submit` (token-only, auth nélkül), `candidate/submit` nem;
   egyik zod-séma sem korlátozza az `answers`-tömb méretét.

## 3. Rendszerszintű minta: a csapat-réteg megkerüli a SEM-et

Az egyéni réteg az első kör óta a `psychometrics.ts` SEM-jéhez (±10 pont short dim)
köti a döntéseit (típuscímke, hero, ±SEM chip, dossier-küszöb — invariáns-teszttel).
A csapat-réteg EGYETLEN fájlja sem importálja a `psychometrics`-et, és a küszöbei a
mérési hibán belül vágnak:

- Súrlódás-él `<12/<22` — a különbség SEM-je `√2·10 ≈ 14`.
- Minta-stabilitás `±3,75` — a 3 fős átlag SE `≈ 5,8`.
- Tag-nézet „átlag felett" `Δ≥6` (a dossier tudatosan 10-re állt).
- **5 populációs-SD** implementáció (pattern, intelligence, report, TeamInsights,
  psych-safety) — mind ÷N, Bessel és CI nélkül; n=3-nál ~18% lefelé torzít.
- **6 él-számláló** implementáció; a `DynamicsMap:385` csak `trust_round`-ot számol,
  a többi 5 observer-t is → ellentmondó „mért" felirat.
- **„aligned" = hasonlóság ÉS bizalom** összemosva: `strong_trust→aligned`, majd a
  narratíva „homogén profil, közös vakfolt"-ként értelmezi; `disconnected`
  (nincs kapcsolat) → `friction`.
- **„elégséges" adatminőség** abszolút 3 kitöltésnél, coverage-tudat nélkül (3/50 zöld).
- Szerep-skála keveredés: becslés (folytonos, felül nyitott, Σ|w| 0,75–1,00) a mérttel
  egy `%`-ban; döntetlen tiebreak nélkül → OG/KE/KO bias.

## 4. Karrier-motor mélyrétege (parkolt, de a hiring-ág + API él)

1. **`diversify` töri a rangsor-monotonitást** (`engine.ts:313-332`) → a
   `clusterByOverlap` negatív gap-nél triviálisan igaz → magas rangú elem a legalsó
   klaszterbe olvad; a klaszter-szerződés sérül.
2. **`scoped` mód megkerüli a low-differentiation védelmet** + duplán számolja az
   ipari jelet (`choiceScore` +5, majd +6/+6 → akár +17 egy 100-as skálán).
3. **Engedélyköteles szakma elveszti a licenc-caveatet** — `specialized`+ready+
   fieldMatch → gap "ready", a licenc-flag sosem emelődik, a UI „elég a végzettséged".
4. **„measured" RIASEC kliens-állított** — a szerver bármilyen 0–100 vektort elfogad;
   4-betűs parciális „measured"-ként megy át; nyers itemek nem perzisztálnak → auditálhatatlan.
5. **A kalibrációs harness nulla-N és nem futhat** — a widget csak élő modulnál
   renderel; a v1-sorokat a report-szkript kizárja → egyetlen súly sincs empirikusan alátámasztva.

## 5. Konszolidáció még nyitva

- **9 független „3"-küszöb** egy fogalomra (peer/trust/intelligence/psych-safety/
  observer-reveal/hub + journey 3× + 2 névtelen literál).
- **6 él-számláló**, **5 sávrendszer** (65/35 strict, 65/35 inclusive, 65/38, 60/40
  halott, 70/40) — a 67-es dim „mérsékelt" chip + „high" narratíva.
- Duplikált `getInsight`, háromszoros form-feloldás, kétszeres `EDU_RANK`, két 9→3
  szerep-család térkép eltérő kulcsnevekkel (thinking vs thought).
- **Kampány-scope bug**: az aktív-kampány lekérdezés `{orgId, status:ACTIVE}` —
  csapat-szűrő nélkül (`team-stats.ts:421`) → B csapat kampánya A-nak is „aktív"; a
  cockpit minden kezelt csapatra megismétli. `getCampaignTeamIds` létezik, 0 hívóval.
- **getTeamPageData N+1** változatlan (a cockpit batch-elt, de a primaryTeamre újra hívja).
- **Bővebb halott-kód**: `evidence.map` (sosem renderel + hamis állítást hordoz),
  `families`/`absoluteFit`/`general`/`clusters`, „measured" interakció-szint,
  `source:"estimate"` sosem íródik, `GRADE_LABELS`, `topDim/bottomDim`, `daysActive`,
  két Big-Five „N"-blokk, a gyakorlatilag elérhetetlen „polarized" ág.

## Javasolt v2-sorrend

1. Az öt élő bug (mind pontszerű, S).
2. Biztonsági köteg: candidate-validátor, career-API kapu, jóváhagyás-kapu, rate-limit
   + `.max`, fiók-törlés → observer-sorok (S–M).
3. SEM-minta a csapat-rétegben: közös `dimensionStats()` Bessel-lel; küszöbök tudatos
   viszonyítása a SEM-hez; `disconnected→friction` és az aligned=bizalom feloldása (M).
4. Konszolidáció: 9→1 anonimitás-küszöb, 6→1 él-számláló, 5→1 sáv; kampány-scope; halott-kód (M).
5. Karrier élesítés előtti feltételek + a kalibráció tényleges lefuttatása pilot-adaton (M).
