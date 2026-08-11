# Motor-audit — harmadik kör (vak újra-vizsgálat, 2026-08-10)

> Vizuális riport (ábrákkal): claude.ai artifact „Trita motor-audit · harmadik
> kör — a réteg alatt". Ez a doksi a repo-belüli referencia.
>
> **Módszer:** a második kör (`motor-audit-v2-2026-08-10.md`) javításai után (PR
> #22-vel bezárólag) hat friss elemző átnézte a JAVÍTOTT kódot a hat motor-területen
> (pontozás · interpretáció · csapat-dinamika · observer/360 · szerepek · karrier),
> tiltva a `docs/audits/` és `docs/development/changelog/` olvasása — elfogulatlan,
> kód-alapú ítélet. A „✓ igazolt" jelű leleteket külön kód-olvasás visszaellenőrizte.
>
> **Összkép:** mind a hat elemző megerősítette, hogy a v2-javítások a helyükön
> vannak, **0 regresszió**. A friss szem viszont feltárta a **harmadik réteget**,
> amiben három fajta lelet van: (1) épp a v2-ben javított biztonsági fixek
> **befejezetlen pereme** — most zárható, pilot nélkül; (2) a konstrukció- és
> mérési **validitás alapja** — pilot-adatot igényel; (3) **konzisztencia-maradék**
> — egy élő megjelenítési bug + jelölés-fegyelem, jórészt kód-szintű.
>
> **JAVÍTÁSI ÁLLAPOT:** feltárás-only kör. A javítás külön döntés — ez a doksi és a
> riport egy lehetséges v3-javítási kör bemenete. A bal oszlop (kód-szintű) egy
> fókuszált körben zárható; a jobb oszlop (validitási alap) a pilot-backlog.

## 0. Verdikt — a v2-javítások tartanak (0 regresszió)

Idézet-szintű megerősítés a hat jelentésből:

- **Csapat-mag:** a provenance-fegyelem genuinely erős — egy `isMeasuredDynamicsSource`,
  egy hub-definíció, egy trust-leképezés, mind megosztva; a Bessel dokumentált, a
  `disconnected≠friction` tesztelt.
- **Observer:** a lifecycle centralizált, a token kriptoerős, az anonimitás min-N
  egy konstansból (`MIN_RATERS_FOR_ANONYMOUS_AGGREGATE`), a completion-értesítés
  következetesen anonim, a reveal-küszöb 2→3.
- **Pontozás:** a provenance-pecsét (form/bankVersion/engineVersion), az
  input-hardening minden határon, a `scoring.test` alapos.
- **Karrier/szerepek:** a candidate-route a kanonikus validátort hívja (a régi rés
  zárva); a mért-súly `meta`-konzisztencia teszttel zárva.

## 1. Befejezetlen fixek — a v2 biztonsági javítások maradék pereme

**A legélesebb réteg: mind a három egy már meglévő fix befejezetlen éle, mind a
három javítható pilot-adat nélkül.**

1. **[W2 · magas · ✓ igazolt] A self-submission guard csak belépve véd.** A v2-ben
   bevezetett önbeküldés-tiltás (`isObserverSelfSubmission`) csak akkor tüzel, ha a
   viewer feloldódik; a submit-oldali auth „best-effort", a hibát `null`-ra nyeli.
   A külső/link-alapú meghívó nem igényel bejelentkezést → a **ratee inkognitó
   ablakban beküldheti a saját „külső" értékelését magáról**, észrevétlenül. A
   self-serve external-nak nincs jóváhagyás-kapuja, egy ratee ≤5 aktív tokent
   tarthat → ≥3 hamis „külső" ratert gyárthat, átlépi a reveal-küszöböt, és uralja
   a saját összevetését ÉS a karrier-blendjét. Belépve 403-mal blokkol; a rés
   kizárólag a kijelentkezett úton van. **Ez a C3-fix maradék pereme.**
   *Zárás:* a külső-token submitnél a ratee-azonosságot a token-tulajdonos vs.
   cél-profil egyezéséből ellenőrizd (a meghívó `userProfileId`-ját ismerjük a
   tokenből), auth nélkül is kiszűrhető. Pilot nem kell.
   `src/app/api/observer/submit/route.ts · src/lib/observer/`

2. **[W1 · magas · ✓ igazolt] A 4. értékelőtől a de-anonimizálás attribúálhatóvá
   válik.** Az observer-átlag minden betöltéskor újraszámol, az n≥3 küszöb csak az
   első hármat védi: `rₖ = k·avgₖ − (k−1)·avgₖ₋₁`. A v2 a completion-értesítést
   anonimizálta (jó), de az `InvitationsTab` a **nevesített és időbélyeges** „kész"
   meghívókat listázza → a visszafejtett vektor névhez rendelhető. A kód-komment
   „elvben" elismeri, de nem jelzi, hogy a nevesített lista teszi gyakorlativá.
   *Enyhítés:* a completed-lista időbélyeg-precizitásának csökkentése / stabil
   (fagyasztott/kvantált) aggregátum töri az illesztést; a teljes zárás
   strukturális (zajos aggregátum) → pilot-kalibráció.
   `observerAvg · components/results/InvitationsTab.tsx`

3. **[W6 · közép · ✓ igazolt] A fiók-törlés csak a meghívó, nem az értékelő
   szerepet takarítja.** A v2-bővített törlés (C4-fix) a törölt userhez tartozó
   függő meghívókat lezárja — de csak ahol a user az INVITER. Ha a törölt user
   RATER volt (neve/emailje egy másik user meghívóján + `observerProfileId` egy
   COMPLETED-hez), az adat megmarad → hiányos GDPR-törlés. Marad árva
   `ObserverDraft` is. *Zárás:* a törlési sweep rater-oldalon is keressen
   (email/observerProfileId a COMPLETED-eken → anonimizálás), takarítsa az árva
   draftokat. Pilot nem kell.
   `fiók-törlési útvonal · ObserverInvitation (RATER-oldal) · ObserverDraft`

## 2. A validitási alap — magabiztos számok kalibrálatlan padlón

**Nem bug: a motorok helyesen számolnak. A kérdés, hogy amit számolnak, mit
jelent. Ezek pilot-adatot és kalibrációt igényelnek, nem kód-írást. Az eszközök
(`scripts/research/`) készen állnak.**

### Pontozás

4. **[F1 · validitás · pilot kell] A nem-normált POMP-pont %-ként prezentálódik —
   de nem percentilis.** A dimenzió-pont `round(((átlag−1)/4)·100)` egy 0–100-ra
   vetített nyers átlag, nem populációhoz viszonyított percentilis. A Likert
   pozitív ferdeség miatt szinte mindenki mid/high; a fix 40/70 vágás mellett a
   „62%" percentilisnek olvasódik. A norma be van drótozva, de **kikapcsolva**
   (`ACTIVE_NORM_TABLE = null`) — a rendszer készen áll, a referencia-minta
   hiányzik. `src/lib/scoring.ts · src/lib/norms.ts`

5. **[F2 · validitás · pilot kell] A teljes SEM-gépezet két validálatlan
   konstanson áll.** Minden `±SEM` és minden „mérési hibán belül" döntés a
   `MEAN_ITEM_R = 0.22` és `SCORE_SD = 20` kézzel beállított számokból ered —
   priorok, a pszichometriai szigor látszatával. Az `alphaFromItems` egyetlen
   átlag-korrelációból számol α-t (durva proxy). A hibasávok a pilotig
   illusztratívak, nem mértek. `src/lib/psychometrics.ts`

6. **[F3 · konzisztencia · ✓ igazolt] Két ellentmondó küszöb-rendszer ugyanazon a
   0–100 skálán.** 40/70 (tier/insight/hero/glyph/legend) vs 35/65
   (profile-engine/personality/interaction/pressure); growth 60; glyph 40. Egy
   **67-es** érték az accordionban „közepes", a személyiség-címkében „magas pólus".
   Nincs teszttel védve; kód-szintű konszolidációval (egy kanonikus küszöb-konstans)
   zárható — a küszöb *értéke* pilot-kérdés. `src/lib/scoring.ts · profile-engine.ts`

### Csapat

7. **[HIGH-1 · validitás · pilot kell] A 16-mintás taxonómia kalibrálatlan
   küszöbökön billen ellentétes csapat-sztorira.** `team-pattern.ts:92-97` („kalibrálandó"):
   cohesion 61 → „Összetartó", 59 → „Versengő" — két pont ellentétes narratívát ad,
   a ±3.75 instabilitási sávon belül. Márkázott, magabiztos kimenet nem-normált
   vágásokból. A csapat-mag legnagyobb validitás-kitettsége. `src/lib/team-pattern.ts`

8. **[HIGH-2 · konstrukció · pilot kell] cohesion = mean((ADAP+INTE)/2) empirikus
   alap nélkül, és varianciát komprimál.** (a) Két HEXACO-dim egyenlő súlyú átlaga
   validáló adat nélkül; (b) a tag-átlag szisztematikusan kisebb varianciájú
   (`Var = σ²(1+ρ)/2` → ~20–30%-kal kisebb SD), mégis ugyanaz a 10/20 diverzitás-sáv
   és TENSION-20 vonatkozik rá → strukturálisan „homogén" felé húz, kevesebb
   tension-flag. Örökli a `cohesion_risk` és a `styleDistances`.
   `src/lib/team-pattern.ts · friction-model.ts`

9. **[HIGH-3 · mérési hiba · pilot kell] A 12/22 súrlódás-küszöb szűkebb, mint a
   mérési hiba.** A profil-gap besorolás 12/22-nél vág, a becsült dimenzió-SEM 5–10
   pont. Egy pár zajra átbillenhet aligned↔friction — ezt fogyasztja a DynamicsMap,
   a `frictionShare≥0.4` narratíva-trigger, a „potenciális súrlódás" számláló, már
   3 fős csapatnál is. Nincs CI, nincs min-N simítás. `src/lib/friction-model.ts`

### Hiring

10. **[S1 · mérési hiba · pilot kell] A jelölt–csapat illeszkedés „szoros egyezést"
    jelez a mérési hibán belül.** Az `avgAbsGap < 10` „erős illeszkedés", miközben a
    dimenzió-különbség SE ≈ `SCORE_SD/√3 ≈ 11.5` — a küszöb a hibasávon belül van.
    `src/app/(app)/hiring/[orgId]/candidates/[inviteId]`

## 3. Konzisztencia-maradék — egy élő bug + a jelölés-fegyelem szélei

**Jórészt kód-szintű, pilot nélkül javítható.**

11. **[Kultúra-jelölő · ÉLŐ] Az `IdealEnvironmentSection.getShortLabel` a kanonikus
    kulcs helyett szűkebb leképezésből old fel** → az egyik környezeti dimenzió
    (Kultúra) rövid címkéje üresen vagy rossz póluson jelenik meg. Vizuális, nem
    adat-hiba, de látható; tisztán kód-szintű javítás.
    `src/components/results/IdealEnvironmentSection.tsx`

12. **[interpr. S2] A glyph és a szöveges címke a top-2 dimenziót eltérő szabállyal
    választja** (más tie-break, más pólus-küszöb) → a rajzolt jel és a felirat
    ellentmondhat ugyanazon a kártyán. Ugyanaz a családi ok, mint a v2-ben javított
    vendég-teaser I-szivárgásnál, de a fő results-nézeten. Közös top-2 kiválasztó
    kell. `src/lib/scoring.ts · TypeGlyph`

13. **[interpr. S3] A bizonytalanság-kapu csak a 2./3. dimenzióra fut, az elsőre
    nem** — ha a két legerősebb dimenzió van egy SEM-en belül (a fő archetípust
    meghatározó, leggyakoribb eset), a jelölés elmarad. `src/lib/profile-content.ts`

14. **[szerep S1] A csapatszerep-százalék egyben mutatja a mért és a becsült
    forrást** — a becsült (HEXACO-becslés) szám ugyanolyan magabiztosnak látszik,
    mint a mért (self/peer). A forrás-badge kötelező (CLAUDE.md alapelv).
    `src/lib/team-role*`

15. **[szerep S2] A holtverseny-feloldás betűrend szerint torzít** (OG/KE/KO előny
    SZ/MV/MI-vel szemben) — kis mintánál (3 peer) sok a holtverseny.
    `src/lib/team-role*`

16. **[szerep S4] A több körből / kilépőktől pooling-olt értékelés >100%
    lefedettséget adhat** — felső korlát nélkül, régi/kilépő adat súlyozatlanul
    keveredik. A min-N anonimitás teljesül, a lefedettség-szám félrevezető.
    `src/lib/team-role*`

17. **[csapat S3] A trust-hálózat az aszimmetriát és a disconnected élt egységesen
    kezeli** — az irányított bizalmat (A→B ≠ B→A) több ponton szimmetrikusra
    egyszerűsíti; a `disconnected` a v2 óta már nem súrlódás (jó), de a hub-/él-
    számlálók egy része még egy skálára vetíti a bizalmat és a profil-gapet.
    `src/lib/friction-model.ts`

18. **[karrier S2/S3 · parkolt] A known-groups validáció önbeteljesítő, a családok
    halottak** — a validáció ugyanazokból a súlyokból származtatja a referencia-
    csoportokat, amiket validálni hivatott (körkörös); a szakma-családok számítottak,
    de sehol nem olvasottak. A modul gateelt (`CAREER_MODULE_READY`), nem élő
    kockázat. `src/lib/career/engine.ts · feasibility.ts`

## 4. Fejlesztési térkép

### Zárható most (kód-szintű, pilot nélkül)
W2 (self-submission kijelentkezve) · W6 (fiók-törlés rater-PII) · Kultúra-jelölő
élő bug · F3 (küszöb-konszolidáció) · interpr. S2 (közös top-2) · interpr. S3
(uncertainty-kapu) · szerep S1 (forrás-badge) · szerep S2/S4 (tie-break,
lefedettség-plafon) · karrier halott-kód.

### Enyhíthető most, teljes zárás strukturális
W1 (differencia-támadás): időbélyeg-precizitás csökkentés + stabil aggregátum
enyhít; teljes zárás zajos aggregátum → a paramétert a pilot adja.

### Pilot-adatot igényel (kalibráció)
F1 (normálás) · F2 (SEM-konstansok) · HIGH-1 (16-minta küszöbök) · HIGH-2 (cohesion
konstrukció + variancia) · HIGH-3 (friction-sáv) · hiring S1 (fit-küszöb) · karrier
súlyok + független known-groups. Eszközök: `scripts/research/` (norms-from-results,
friction-calibration) — a minta hiányzik.

### Ajánlás
Egy fókuszált **v3-javítási kör** a „zárható most" oszlopot zárja — élén a két
befejezetlen biztonsági fixszel (W2, W6) és a Kultúra-jelölő élő buggal, majd a
jelölés-konszolidációval (F3, szerep S1, interpr. S2/S3); a W1 enyhítése ugyanitt
elfér. A validitási alap a pilot-backlog.
