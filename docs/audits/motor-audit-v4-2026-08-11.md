# Motor-audit — negyedik kör (vak újra-vizsgálat, 2026-08-11)

> Vizuális riport (ábrákkal): claude.ai artifact „Trita motor-audit · negyedik
> kör — a minta, nem a példány". Ez a doksi a repo-belüli referencia (teljes lista).
>
> **Módszer:** a v3-javítási kör (3 commit, `pnpm check` PASS · unit 748 · client
> 121) után **hat friss elemző** a hat motor-területen (pontozás · interpretáció ·
> csapat-dinamika · observer/360 · csapatszerep · karrier), tiltva a
> `docs/audits/`, `docs/development/changelog/` és minden riport-HTML olvasása —
> a kódból ítélve, a korábbi körök ismerete nélkül.
>
> **Összkép:** mind a hat elemző **külön megerősítette, hogy a v2/v3-javítások a
> helyükön vannak, 0 regresszió** (közös rankDimensionScores a címke+ábra mögött,
> egységes isMeasuredDynamicsSource, centralizált anonimitás-padló, debiased FNV
> tie-break, diversify-monotonitás, a W6-törlés helyes sorrendje). A negyedik pass
> viszont megmutatta: **a javítások LOKÁLISAK voltak** — ugyanaz a hiba-OSZTÁLY
> vissza-visszatér a testvér-felületeken, amiket a v3 nem ért el. A vak szem a
> MINTÁT találta meg, nem csak a példányt.

## A négy kör íve

- **1. kör** — felszíni hibák (élő bugok, halott kód).
- **2. kör** — biztonsági + statisztikai fegyelem (anonimitás, Bessel, provenance).
- **3. kör** — befejezetlen fixek + validitási alap + konzisztencia-maradék.
- **4. kör (ez)** — a javítások **tartanak**, de: (a) nem érték el az összes testvér-
  felületet; (b) két rendszerszintű minta (mért-vs-becsült jelölés · RESO fordított
  orientáció); (c) a mérési-hiba fegyelem alul-érvényesített (a próza állítja, amit
  a kapu tilt); (d) egy privacy-réteg; (e) a változatlan (pilot-gated) validitási alap.

---

## A. Keresztmetsző minták (a v4 lényege)

### A1. A v3-fixek LOKÁLISAK — a testvér-felületek kimaradtak
A javítás helyes volt, de csak az egyik hívási úton. Ugyanaz a fix kell a többire is:

- **W6 (GDPR) — 3 rés a saját fixemben:**
  - **case-sensitivity** (`profile/delete/route.ts:32-34`): a rater-match `{observerEmail: profile.email}` szigorúan egyezik (Postgres case-sensitive), míg a flow minden más email-összevetése `mode:"insensitive"`. „John.Doe@X.com" meghívó vs „john.doe@x.com" profil → a scrub kihagyja a sort. **[MED, pure code]**
  - **CANCELED kihagyva** (`:83-95`): a rater-oldali update csak PENDING/AWAITING + COMPLETED; a CANCELED sorok örökre megtartják a törölt rater PII-ját. **[LOW, pure code]**
  - **Clerk-webhook megkerüli** (`webhooks/clerk/route.ts:140-162`): a `user.deleted` webhook csak részleges takarítást végez — NEM a W6 observer-scrubot. Dashboard/support-törlés kikerüli a W6-ot: a pending tokenek élnek, a reminder emailez tovább. **[MED, pure code]** Fix: közös `scrubProfileData(profileId)`, hívja mindkét út.
- **W1 (doc-drift a saját commentemben):** a W1-komment „nap-pontos dátum (nincs sorrendi idő-finomság)"-ot állít, de az csak a MEGJELENÍTÉS — a szerver teljes pontosságú `completedAt` ISO-t szerializál (`results/page.tsx:430`) + egy soha-nem-renderelt `relationship` mezőt. Az egzakt sorrend elérhető. **[MED, pure code]** Fix: nap-pontosra csonkolni + a `relationship` mezőt elhagyni → a komment igazzá válik.
- **minForReveal=2 még él** (`InvitationsTab.tsx:16-17,81`; `ProfileTabs.tsx:1187-1195`): a self-serve ág prop nélkül rendereli → default 2 → a banner „kész" 2-nél, de az összevetés 3-ig zárva. **[LOW, pure code]**
- **Csapatszerep S1 (badge) nem éri el a member-reportot** (`team-report-member.ts:137-147`; `TeamReportMemberView.tsx:236-265`): a `buildMemberReportViewModel` eldobja a `source`-ot; a nézet „A te szereped" medált + „kulcsszerep" badge-et + „own it" tippet mutat becsült szerepre **badge nélkül**. **[HIGH, pure code]**
- **Csapatszerep S2 (exact) 6-ból 1 felületen érvényesül** (használ: TeamRoleSection:623; eldob: TeamRoles, team-intelligence:229, team-report:266, team-report-member:141, ProfileTabs:893): a többi `getTopRoles`-t exact nélkül hívja → hash-fallback → a fő szerep felületenként ELTÉR. **[MED, pure code]** + az `exact` maga is KEREKÍTETT per-rater értékek átlaga (peer-aggregáció round BEFORE average, `team-role-peer.ts:48-64`) → a koncentrált (2-súlyú) jelölés veszít a szórtakkal szemben. **[MED bias, pure code]** Fix: nyers súly-összeget átlagolni, csak megjelenítésre kerekíteni; exact minden getTopRoles-hoz.
- **Csapatszerep S4 (lefedettség-scope) kimarad 2 read-úton** (`results/page.tsx:400-415` + `member-dossier.server.ts:123-127`): a kézzel-írt aggregációk NEM a `poolPeerSelectionsByRatedMember`-t használják → nincs current-member scope/leaver-szűrés → multi-team blend + >100% ismét; a dossier org-határt is átlép. **[MED, pure code]**
- **S3-próza (a SEM-kapu nyelvi párjai)** — a v3-ban bevezetett noun-only kapu (mikor a top-pár egy SEM-en belül) a CÍMKÉT rövidíti, de a PRÓZA több helyen továbbra is állítja a sorrendet: glyph-plate „második legerősebb {secondary}" (`TypeGlyphPlate.tsx:96-116`), archetype-story (`ProfileTabs.tsx:852-855`), interakció-subtitle „Energikus + Újító" (`InteractionSection.tsx:240-247`). **[MED, pure code]** Fix: a bizonytalanság-flaget átadni ezeknek is.
- **F3 (dual küszöb) a FORRÁS-CHIP-en látszik** — a hitelesség-jelző chip „magas"-t ír (65/35), míg a strip „mérsékelt"-et (70/40) ugyanarra a 67-re, egy PDF-en belül (`workstyle-content.ts:157-158` vs `ProfileTabs.tsx:343-346`). Feltűnőbb, mint a v3-doc sejtette. **[MED, interim pure code]** Fix: a 65-70/35-40 sávban a chip szövegét a vizuális tierből venni vagy hedge-elni.

### A2. A mért-vs-becsült jelölés elve — sokkal több helyen sérül
A termék hitelességi alapelve (becsült ≠ mért, badge kötelező) a v3-ban javított helyeken túl is sérül:

- **HIGH:** member-report becsült szerep „A te szereped"-ként (A1); **karrier observer-blend visszafejthető** min-3 alatt (`career/person.ts:176-202` raterCount≥1, observerWeight 0.25 verbatim a componentsben → `blended=self·(1−w)+obs·w`, self ismert → egyetlen rater vektora invertálható; ungated differencia-támadás) **[pure code: gate MIN_RATERS]**.
- **MED:** flat-50 kitalált profil a dinamika-breakdownban „MÉRT" badge alatt (`intelligence-data.ts:30-37 ?? 50`); becsült szerep-% a weben+share-en (a PDF elrejti); karrier „te 58" a centrált (ipsatizált) pontból mutatva, ellentmond a results-oldal THOR 90-ének (`engine.ts:181`).

### A3. RESO fordított orientáció — rendszerszintű interpretációs hiba
Az érzelmi stabilitás (alacsony RESO) többször „hiányként" jelenik meg, ellentmondva a saját pole-semleges narratíváknak:

- **HIGH:** „Fejlődési fókusz" a legalacsonyabb facetekből → egy stabil user #1 fejlődési területe a Félelem/Szorongás, a tipp „stresszkezelés" (a MAGAS emocionalitás gyógyszere) (`results/page.tsx:359-390`, `GrowthFocus` GROWTH_HINT.RESO). Ellentmond a DIMENSION_GROWTH_TIPS.RESO + RESO_low narratívának.
- **MED:** observer-gap „mások erősebbnek látnak" invertál E-re (`results.ts:369-370`); PDF profile-character „magas {dim}" nem-magas pontra + „Emocionalitás területen fejlődésre" (`ProfileTabs.tsx:784-796`); minden <40 „figyelendő" a hero-ban, 2 görgetéssel lejjebb „a stabilitásod erőforrás" (`ProfileTabs.tsx:734-735`).

### A4. Mérési hiba vs küszöbök — a próza állítja, amit a kapu tilt
- **A különbség-kapuk 1×SEM-et használnak, nem SE(diff)=√2·SEM≈14.65-öt** (personality-type, member-dossier, ComparisonTab): egy 12-es delta „vakfolt", egy 12-es top-2 gap teljes címke — mindkettő egy SE(diff)-en belül. Az elv ~40%-kal alul-érvényesített. **[MED, pure code]** Fix: `DIFF_MIN_GAP=round(√2·SEM)`.
- Kemény küszöbök a mérési hibán belül: friction 12/22 (SEM ~5-13), karrier 55/70, hiring 10/20, cohesion 10/20. **[pilot / interim borderline-band]**
- „How you work" 2. bekezdés minden felületen „Figyelendő"-ként (pozíciós slice, nem risk-aware) — egy erősség a sárga kártyán (`HowYouWorkSection.tsx:16-18`). **[HIGH, pure code]**

---

## B. Privacy / biztonsági réteg (új / alul-mitigált)

- **HIGH** Karrier observer-blend visszafejthető min-3 alatt (A2) — ungated differencia-támadás. Pure code: gate `person.observer` MIN_RATERS mögé, ne szerializáld az observerWeight/nyers userValue-t.
- **HIGH** Külső rater in-progress DRAFT-ja olvasható/felülírható a megosztott tokennel (`observe/[token]/page.tsx:130-174`, `observer/draft/route.ts`): a self-guard CSAK a submiten van. (1) READ: a ratee a saját tokenjén megkapja a rater nyers item-válaszait (n=1 leak); (2) WRITE: doctored draftot POST-ol → a rater azt küldi be. **Distinct a W2-től, dokumentálatlan.** Pure code: self-guard a draft load + POST/DELETE-re, ha a viewer feloldódik.
- **HIGH** `GET /api/team/role-round` nincs tagság-guard (`role-round/route.ts:72-125`) — bármely belépett user bármely team roszterét+kitöltési státuszát lekérheti (a POST guardol, a GET nem); ráadásul halott (nincs hívó). Pure code: guard vagy törlés.
- **MED** Dossier peer-aggregátum org-határt lép (`member-dossier.server.ts:123-127`) — a szomszédos trustObservation team-scoped, ez nem. Pure code: teamIds scope.
- **MED** Törölt profil megtartja username/demográfia/careerBackground (`delete/route.ts:105-108`) — csak clerkId+email nullázódik. Product+code.
- **MED** Public draft-endpoint rate-limit + méret-korlát nélkül (`observer/draft/route.ts:19-33`). Pure code.
- **MED** Approval-kapu megkerülhető aktív-org váltással (`invite/route.ts:42-61`). Product+code.
- **MED** Egyoldalú trust-él kitesz egy rater választ min-N=3 alatt (`trust-network.ts:144-145`; kampány-progress felfedi ki válaszolt). Pure code/policy: nem-mutual élt elrejteni/aggregálni.
- **LOW** double-submit → kezeletlen 500 (P2002); knownDuration nem enum; reminder-sweep unbounded rows; ObserverType.ANONYMOUS halott; facet-komment „≥2" vs kód ≥3; invite-kvóta read-then-write race; árva draft cancel/expiry után; calibration-feedback endpoint gate nélkül + client-fitScore; /api/career/occupations gate nélkül.

---

## C. Per-terület lelet-index (a teljes lista)

### Pontozás (Agent 1)
- HIGH validitás: nem-normált abszolút küszöbök (F1, pilot). MED: ±SEM két kézi konstanson (F2, pilot); **SE(diff) alul-érvényesítés (pure code)**; **glyph-plate próza vs S3-kapu (pure code)**; F3 + HARMADIK küszöb (intensity 25/40/62/80); **nulla mint „nem mért" sentinel → kitalált 0-facetek „growth focus"-ként (pure code)**; **facet+I ± nélkül (pure code)**. LOW: facet-név drift (Kapzsiság vs Mohóság); ComparisonTab hardcode 10; extractDimensionScores nested cast; engine nem clampel + submit .max hiány; „%" percentilis-félreolvasás; halott aspects/redundáns NaN-check.
- Solid: reverse+POMP locked; exact-set completeness; „I" kizárva mindenhol; **rankDimensionScores egy forrás (S2 validálva)**; provenance+norms.

### Interpretáció (Agent 2)
- HIGH: **HowYouWork 2. bekezdés watch-ként (pure code)**; **RESO growth-focus inverz (pure code)**. MED: archetype-story SEM-kapu nélkül; „én vezetem" leader-notes subordinate-nek; F3 forrás-chip; becsült szerep-% weben; observer-gap RESO-invert; PDF „magas" nem-magasra; blanket „figyelendő" <40-re. LOW: interakció-subtitle ungated; env-row hedged→extrém címke; orphan i18n + „Third/Tertiary"; RoleFit 2/3 azonos címke ellentétes tartalomra; halott strengths/watchAreas; duplikált getInsight; hardcode stringek; share Plus-tartalom gate nélkül (latent).
- Solid: ideál-környezet robusztus (Culture-fix validálva); type-label kapu exemplary (S2+S3 validálva); interakció hedged; mérési hiba first-class; team-role badge konzisztens.

### Csapat-dinamika (Agent 3)
- HIGH: **trust-él „hasonlóság"-ként a RENDERELT reportban (a v2 de-konfláció csak a prefillt érte el, pure code)**; **ex-tagok trust-obszervációi szennyezik a hálót + coverage>100% (pure code)**. MED: flat-50 kitalált profil unbadged; trust-aszimmetria elveszik; „disconnected"<35 elnyeli az aktív bizalmatlanságot; cohesion variancia-kompresszió (pilot); 16-minta hand-set + stability SE-t ignorál (pilot); psych-safety multi-team legacy teamId; egyoldalú él min-N alatt; TeamPatternCard „balanced" strip ≠ grading; redundáns trust rebuild (perf). LOW: dead dimensionDelta/totalFriction + duplikált 16-minta-katalógus; thin-data moderátorok (max-range n-nel nő, leader-delta self-inclusive, PRESSURE_MIN_COUNT=2).
- Solid: calculatePairFriction renormalizál; isMeasuredDynamicsSource egy forrás; Bessel; anonimitás-padló node-szinten; coverage-aware gating.

### Observer/360 (Agent 4)
- HIGH: **karrier observer-blend invertálható min-3 alatt (pure code)**; **külső draft olvasható/felülírható (pure code)**. MED: W6 case-sensitivity (saját bug); W6 Clerk-webhook megkerüli (saját bug); W1 doc-drift (saját comment); törölt profil demográfia; draft rate-limit; approval org-váltás. LOW: W6 CANCELED; double-submit 500; knownDuration enum; sweep unbounded; ANONYMOUS halott; facet-komment ≥2; dim-avg n=1; árva draft; invite race; minForReveal=2 él.
- Solid: token-higiénia (crypto.randomBytes); lifecycle egy modul; anonimitás egy konstans; W6 helyes sorrend (validálva); rate-limit submit/invite.

### Csapatszerep (Agent 5)
- HIGH: **role-round GET nincs guard (pure code)**; **member-report becsült szerep badge nélkül (pure code)**. MED: results-oldal peer-scope kimarad; dossier org-határ; self-rating 2 read-úton; **peer round-before-average bias**; **exact 1/6 felületen**; becsült-% weben; estimator súlyok unnormalized (pilot); „önkép vs csapat" becslést hasonlít. LOW: partial-dim bypass 3 helyen; 3 ellentmondó „hiányzó szerep" def; hardcode + „TeamRole" márkanév; completion-kártya becslést „done"-ként; self-submit némán nyeli a hibát; anonimitás „3" hardcode copyban.
- Solid: FNV tie-break debiased (S2 validálva); min-3 filter után (S4 validálva); write-path validator; estimates soha nem perzisztálnak; PDF badging gold standard.

### Karrier (Agent 6)
- HIGH: **known-groups validáció a saját pool-ra csonkolva → körkörös (pure code)**; **scoped rangsor egy-komponensű bázis → becsült érdeklődés vezérli a 100%-ot (pure code)**. MED: scoped rankSe unnormalized → 1.2-2.5× szűk klaszter; congruence flat-vektort felnagyít; H-floor ipsatizált pontból bünteti a becsületeseket; demandFit szaturál lapos profilra; centrált pont „te"-ként; kemény küszöb 1 SEM-en belül (hiring S1 megerősítve); prior-alapú bizonytalanság. LOW: calibration-feedback gate nélkül + client-fitScore; occupations gate nélkül; PDF „leggyakoribb" gaps[0]; halott absoluteFit/general/clusters + unplumbed known-groups.
- Solid: RIASEC completeness 3 réteg; licenc-szemantika; **diversify-monotonitás (v2 validálva)**; gating koherens; delta-method error-propagáció.

---

## D. A változatlan validitási alap (pilot-gated, a 3. körből)
Nem-normált POMP; ±SEM a MEAN_ITEM_R=0.22 / SCORE_SD=20 kézi konstansokon; cohesion variancia-kompresszió; 16-minta hand-set küszöbök; friction 12/22; karrier N=0 súlyok + gyengén-támogatott HEXACO→RIASEC linkek. Az eszközök (`scripts/research/`) készen; a minta hiányzik. **Ezek NEM javíthatók kód-írással.**

---

## E. Fejlesztési térkép (egy lehetséges v5-kör)

### Zárható most — kód-szintű, pilot nélkül (prioritás szerint)
1. **A v3-fixek kiterjesztése a testvér-felületekre** (A1): W6 (case-insensitive + CANCELED + közös scrub a webhookhoz), W1 (nap-pontos csonkolás + `relationship` drop), minForReveal default, csapatszerep S1 (member-report badge) / S2 (exact minden felületen + nyers-átlag) / S4 (results+dossier scope), S3-próza (glyph-plate/archetype/interakció).
2. **Privacy (A/B)**: karrier observer-blend gate (MIN_RATERS); külső draft self-guard; role-round GET guard; dossier org-scope.
3. **RESO fordított orientáció (A3)**: growth-focus pole-aware; observer-gap + profile-character + watch-framing pole-aware.
4. **HowYouWork strukturált slotok** (A4); **SE(diff) küszöb** (`DIFF_MIN_GAP`); **nulla-sentinel** (facet-szekció gate); **facet/I ±**.
5. **Trust-háló**: ex-tag szűrés + coverage-clamp; flat-50 badge/suppress; F3 forrás-chip a tierből.
6. **Karrier struktúra**: known-groups strategy:"composite"; scoped bázisba demandFit; scoped rankSe normalizálás; H-floor nyers INTE-n.
7. **Gating/dead-code**: /api/career/occupations + calibration-feedback gate; halott mezők (absoluteFit/general/clusters/dimensionDelta/totalFriction/aspects/strengths-props) törlése; duplikált katalógus/getInsight egységesítés; i18n orphan + hardcode + „TeamRole" márkanév.

### Termék-döntést igényel
- **W2** (kijelentkezett self-submission) — auth-mentesség vs. zárás.
- Approval-kapu org-váltás; törölt profil demográfia-retenció; ANONYMOUS observer-típus sorsa.

### Pilot-adatot igényel (D)
Normálás; SEM-konstansok; cohesion/16-minta/friction/karrier küszöbök és súlyok kalibrációja.

---

*Feltárás-only kör. A javítás külön döntés — ez a doksi és a riport egy lehetséges
v5-javítási kör bemenete. A vak elemzők a korábbi körök doksijait NEM olvasták.*
