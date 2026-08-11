# Motor-audit — hatodik kör (vak, ledgerhez osztályozva, 2026-08-11)

> Vizuális riport: claude.ai artifact „Trita motor-audit · hatodik kör — a konvergencia".
> Ez a doksi a repo-belüli referencia. Alapvonal: `motor-known-residuals.md` (ledger).
>
> **Módszer:** a v5-javítási kör (5 commit, `pnpm check` PASS · unit 788 · client 121)
> után hat friss elemző a hat motor-területen, tiltva minden korábbi audit-doksi,
> changelog és riport-HTML. Minden elemző **[CODE]** vs **[STRUCTURAL]** címkét adott.
> A szintézis a leleteket a **ledgerhez** méri (a konvergencia-szabály szerint).

## Verdikt (a konvergencia-elemzés)

**Három tiszta megállapítás, mind a hat elemzőtől megerősítve:**

1. **A v5-javítások TARTANAK — 0 regresszió.** Minden elemző külön, teszttel igazolta:
   a ± eltűnt a felületről (szótár-szintű guard-teszt védi); a √2·SEM-kapu az invariáns-
   teszttel a bankhoz kötve; a GDPR-scrub egy közös forrásból; a karrier observer-blend
   „bitre azonos a self-only-val" a padló alatt; a csapatszerep exact-fegyelem „minden
   rangsoroló hívási helyen"; a RESO „stabil" címke egy forrásból; a known-groups
   körkörösség-mentes. Idézet: a mért-vs-becsült nyelvi fegyelem „a kódbázis
   legjobban megvalósított része".

2. **A validitási alap KONVERGÁLT — 0 új struktúrális meglepetés.** Mind a hat elemző
   [STRUCTURAL] leletei PONTOSAN a ledger tételei (nem-normált POMP, MEAN_ITEM_R/SCORE_SD,
   16-minta és friction küszöbök, cohesion, karrier N=0 súlyok, W2, becslő-súlyok). A
   ledger helyesen jósolta meg őket. **Ez az oldal kész — a következő lépés a PILOT.**

3. **A kód-oldal NEM konvergált — valódi új [CODE] réteg van**, de NEM végtelen zaj:
   jól jellemezhető és zsugorodó. Három alfaja:
   - **(a) A v5-fixek „lokális" maradéka** — a legnagyobb csoport. A v5 az általa
     felsorolt felületeken zárta az osztályt, de a vak szem elérhetetlen testvéreket
     talált (ld. lent). Ez a v4 fő tanulságának megismétlődése.
   - **(b) v4-lelet, ami a v5 réseibe esett** (gazdátlan) — pl. a results-oldal
     peer-scope, a self-submit hibanyelés, a hiring-küszöbök.
   - **(c) Tényleg új terep, amit a korábbi körök nem szondáztak** — 2 endpoint-szivárgás
     + 1 crash + a duplikált minta-motor.

**Konvergencia-státusz:** STRUKTÚRA ✅ kész (pilot) · KÓD ⏳ egy fókuszált kör (v7) a
konvergenciáig. A ciklus NEM végtelen — csökkenő, a ledger a padló.

---

## A. Genuinely-new [CODE] — biztonság / crash (v7 ELSŐ prioritás)

1. **[HIGH, biztonság] `/api/team/[id]/pattern` nevesített `styleDistances`-t ad + megkerüli
   a konzultáns-kaput** (route.ts:37-38 gate=`canAccessTeam` only; :105-112 spread-eli a
   `styleDistances:[{userId,tensionAxes}]`-t). Bármely ORG_MEMBER lekérheti, KI tér el
   &gt;20 ponttal MELYIK tengelyen — miközben a lap átirányítja a nem-konzultánst és a
   report csak anonim számot publikál. Az egyetlen kliens-fogyasztó csak patternCode/Name-et
   használ. **Korábbi körök sosem auditálták ezt a route-ot.** Fix: `styleDistances` (+ nyers
   tengelyértékek) törlése a válaszból, vagy `canViewRawTeamResults`-gate.

2. **[MED, biztonság] `GET /api/observer/invite` HALOTT, de él — teljes-pontosságú
   `completedAt`-et + neveket ad** (invite/route.ts:287-318). Újranyitja a differencia-
   csatornát, amit a D-féle nap-pontos csonkolás (results/page.tsx) lezárt. Ugyanaz a
   „lokális fix" osztály, mint A1. Fix: a halott GET törlése (vagy nap-pontos ott is).

3. **[MED, crash] Örökség szerep-kód 500-azza a dossiert** (member-dossier.server.ts:195-197):
   `getTopRoles(roleSelf.scores)` megkerüli a kulcs-szűrőt; egy „PL" kód → `TEAM_ROLES["PL"]`
   undefined → `.hu` dob → admin/konzultáns oldal 500. Fix: a selfTop-ot a resolveren át.

## B. „Lokális fix" maradék — a v5-fixek elérhetetlen testvérei (v7 fő tömeg)

Kétszeresen megerősített (2 elemző) tételek **★**:

- **★ ComparisonTab dimenzió-gap még 10, nem DIFF_MIN_GAP=15** (ComparisonTab.tsx:48-49,
  315,322,466 — 5 hely). A user Comparison-tabja „vakfoltot" jelez ott, ahol az admin
  dossier (15) nem — a két felület ellentmond. Az én √2·SEM-fixem a personality-type-ot +
  member-dossier-t érte el, a ComparisonTab-ot D nem kötötte át. Fix: `DIFF_MIN_GAP` import.
- **★ Növekedési tipp (growthTip/growthPlan) alacsony RESO-t céloz** (workstyle-content.ts:
  286-297 csak „I"-t szűr). Ellentmond a `selectGrowthFocusItems`-nek UGYANABBAN a fájlban.
  D a listát fixálta, a tippet nem. Fix: RESO kizárás a tipp-blokkban is.
- **Facet-összevetés kapu 1×facetSEM, nem √2** (ComparisonTab.tsx:131). A dim-kapukat √2-re
  emeltem, a facet-kaput nem. Fix: √2·facetSEM (vagy n-tudatos).
- **S3-próza hedge hiányos — az `isTopPairUncertain` túl szűk** (TypeGlyphPlate/archetype-
  story csak a top-párt nézi, a 2-3. gap esetét nem — a címke MINDKETTŐRE főnév-only-ra
  vált). Az én foundational helperem maradéka. Fix: `isSecondaryUncertain = topPair || adjective`.
- **RESO a PDF „Kiemelkedő alskálák"-ban + a hero gyenge-slotban** (PlusFacetsPage top-facets;
  page.tsx:469-479 hero weak). D a deficit-oldalt fixálta, a pozitív/hero-oldalt nem.
- **Flat-profil: „Erősségeid: X,Y" + „nincs kiugró erősség" egy PDF-lapon** (strengthBullets
  vs profileCharacter — D a profileCharactert gate-elte, a strengthBullets-et nem).
- **GDPR inviter-oldal: COMPLETED/CANCELED megtartja a rater-PII-t** (account-scrub.ts:62-71).
  A rater-oldalt (82-85) minden státuszra nulláztam, az inviter-tükröt nem. Fix: tükrözés.
- **Dossier observer-aggregátum nincs org-scope-olva** (member-dossier.server.ts:110-114) —
  a peer-role query-t v5-ben scope-oltam, ezt a testvért nem. Fix: campaign/org-scope.
- **Dossier peer rater-set nincs current-member-szűrve** (leaverek beleszámítanak) —
  a v5 dossier-scope-om részleges volt (teamId+self, de nem current-member). Fix: pool-helper.
- **Draft DELETE nincs rate-limitelve** (draft/route.ts:101-103) — a POST-ot v5-ben
  rate-limiteltem, a DELETE-et nem. Fix: tükrözés.
- **Karrier scoped: flat MÉRT érdeklődés 100%-ot rangsorol** (engine.ts:568 forrásra
  kapuz, differenciáltságra nem) — F a becsültet zárta, a mért+flat-et nem. Fix: diff-gate.
- **Karrier gating testvérek** (career-background POST/DELETE + fakedoor org-hidden nélkül) —
  F a fit/occupations/feedback-et gate-elte, ezeket nem.
- **case-sensitive email a submit-értesítésben** (submit/route.ts:199-201) — még egy hely,
  amit a case-insensitive konvenció nem ért el.

## C. v4-lelet, ami a v5 réseibe esett (gazdátlan — v7)

- **results-oldal peer-aggregátum SCOPE nélkül** (results/page.tsx:377-392): minden csapat/
  org/idő, nincs current-member/self/leaver védelem. v4-S4, de a results/page.tsx D-é volt,
  D-nek nem volt kiosztva, E nem birtokolta → átcsúszott. Fix: pool-helper current-scope-pal.
- **self-kérdőív submit hibanyelése** (TeamRolesClient.tsx:17-31 „redirect regardless") →
  csendes adatvesztés. v4-lelet, senkihez nem rendelve.
- **hiring-oldal nyers gap-küszöbök SE nélkül** (<10/<20 „excellent/divergent") + candidate
  ??0. v4 hiring-S1; a hiring nem importál career-t → gazdátlan maradt.
- **minForReveal=2 default még él** (InvitationsTab.tsx:81 + ProfileTabs self-serve ág).

## D. Egyéb [CODE] (kisebb — v7 opcionális)

Csapat-dinamika: pattern letter vs balanced-grade vs stability-band inkonzisztens (M5);
két párhuzamos minta-motor divergált nevekkel (M6); trust-aszimmetria eldobva (M8);
per-request dupla trust-lekérdezés (M7); egyoldalú trust-él consent-rés (H1) + hub/isolated
naming padló nélkül (M1); dead-code (dimAvg 1-fős, totalFriction, stb.); fake completion
tri-state (L3); leader-delta self-inclusive mean (L6). Observer: draft lazily-expired
elfogadás, double-submit P2002→500, invite TOCTOU, link self-link guard, webhook
observerType-felülírás COMPLETED-en, orphan draft TTL, `scrubProfileData` 0 teszt. Scoring:
value-clamp hiánya, malformed-JSON 500, RESO-pólus literálként ≥4 modulban (→ egy
predikátum), heroInsight nyers `.sort`, halott kód/i18n. Interpretáció: „pont" vs „%",
rank-címke 3 szótár (PDF „Jelentős" vs „Másodlagos"), team-role rank-label drift, dead
plumbing. Karrier: targetRaw clamp, meta.strategy, calibration never-shown poisoning, dead
families.ts/decorate-payload. Csapatszerep: latest-row-wins árnyékolás (M1), estimate %-ok,
3 ellentmondó „hiányzó szerep" def, POST/submit gating/rate-limit, `in`-operátor hazard.

## E. Struktúra — LEDGERELT (0 új; a validitási alap konvergált)

Minden [STRUCTURAL] lelet a ledger tétele: nem-normált POMP · SEM-konstansok · 40/70 vs
35/65 vs glyph-intenzitás (3 család) · 16-minta és friction küszöbök · cohesion konstrukció ·
karrier N=0 súlyok + becslő-súlyok · self-vs-observer gate-modell · 2-itemes Altruizmus ·
W2 · rate-limit fail-open · törölt profil demográfia. **Ezekhez PILOT kell, nem kód.**

---

## F. A v7 térkép (egy fókuszált, EXHAUSZTÍV kód-kör)

1. **Biztonság/crash ELŐSZÖR** (A1-3): pattern-API `styleDistances`, halott GET invite,
   dossier örökség-kulcs crash.
2. **A „lokális maradék" osztály-szintű, EXHAUSZTÍV lezárása** (B): egy szisztematikus
   sweep — MINDEN gap-küszöb → DIFF_MIN_GAP; MINDEN RESO-kizárás testvér; MINDEN GDPR-tükör;
   MINDEN gating-testvér. Ezúttal nem felület-listából, hanem grep-alapú teljes lefedéssel.
3. **A gazdátlan v4-leletek** (C): results-peer-scope, self-submit, hiring-SE, minForReveal.
4. **Opcionális [CODE] tömeg** (D) prioritás szerint.

**Előrejelzés (a ledger-mechanizmus szerint):** a v7 után a következő vak kör ~0 új [CODE]-ot
talál (a testvérek kimerülnek, az endpointok auditáltak) → a maradék a ledgerelt struktúra →
**KONVERGENCIA → PILOT.** A v6 tehát az utolsó előtti kód-kör bemenete.

*Feltárás-only kör. A javítás külön döntés.*
