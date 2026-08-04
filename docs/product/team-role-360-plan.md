# Csapatszerep-visszajelzés (peer-kör) — megvalósítási terv

> Készült: 2026-07-20 · Státusz: JÓVÁHAGYOTT terv, fejlesztés a pilot előtt
> · Kapcsolódó: `team-role-items-draft.md` (itembank),
> `team-role-instrument-replacement-plan.md` (jogi kiváltás),
> `feature-ideas.md` #2 (ennek kiterjesztése peer-forrással).

## Döntések (user, 2026-07-20)

1. A csapatszerep-képet a self-kitöltés és a TRITAN-becslés mellett **élő
   csapat-visszajelzéssel** támasztjuk meg (Belbin OA-analóg, de saját
   instrumentummal — a Belbin SPI/OA licencköteles, a név védjegy).
2. **Anonimitás: aggregált megjelenítés, n ≥ 3 értékelő küszöbbel** — a
   pulse-nál bevált minta. A rater kiléte soha nem jelenik meg.
3. **Ütemezés: most, a pilot-indulás előtt** — az 1. pilot-körben már
   peer-adattal.
4. Egy itembank, két perspektíva: a self-kérdőív jogi kiváltása UGYANERRE
   a 27 itemes bankra épül (E/1 self, E/3 peer) — külön tervdoc.

## 1. Koncepció

Három forrás, egy szerep-kép, forrás-transzparenciával:

| Forrás | Instrumentum | Súly a riportban |
|---|---|---|
| **Csapatkép (peer)** | 27 itemes viselkedés-checklist E/3-ban, tagonként | elsődleges, ha n ≥ 3 |
| **Önkép (self)** | ugyanaz a 27 item E/1-ben | mindig látszik, a peer-képpel összevetve |
| **TRITAN-becslés** | meglévő `estimateTeamRolesFromTritan` | fallback, badge-dzsel |

A termékérték magja az **önkép vs. csapatkép delta**: hol egyezik a top 3,
hol tér el — mért beszélgetésindító a tanácsadói debriefre.

## 2. Instrumentum (részletek az itembank-docban)

- 27 állítás (9 szerep × 3 megfigyelhető viselkedés), saját megfogalmazás.
- Kitöltés értékelt személyenként: a rater kiválasztja a **leginkább
  jellemző 8–12 állítást**, ebből hármat „kiemelten jellemző"-ként jelöl
  (dupla súly). Ipsatív jelleg: nem lehet mindent mindenkire ráhagyni.
- Idő: ~3–4 perc/fő; 6 fős csapatnál ~15–20 perc összesen.
- Scoring (rater × értékelt): szerep-pont = Σ(kijelölt item súlya, kiemelt
  = 2, sima = 1) / elméleti max → 0–100. Aggregátum: raterenkénti
  szerep-profilok átlaga; top 3 „a csapat szerint".

## 3. Adatmodell

```prisma
model TeamRoleObservation {
  id            String   @id @default(cuid())
  teamId        String
  campaignId    String?          // melyik kampány-kör része
  aboutUserId   String           // akiről a visszajelzés szól
  raterUserId   String           // CSAK dedupe + haladás-követés; UI-ban soha
  selections    Json             // { itemId: 1 | 2 }  (1 = jellemző, 2 = kiemelt)
  createdAt     DateTime @default(now())

  @@unique([teamId, campaignId, aboutUserId, raterUserId])
  @@index([teamId, aboutUserId])
}
```

- A `raterUserId` tárolása tudatos eltérés a pulse-modelltől: itt páronkénti
  dedupe és „ki kit értékelt már" haladás kell. Az anonimitást a
  **megjelenítési réteg** garantálja (aggregátum + n ≥ 3 küszöb), nem a
  tárolás — ezt a consent-szöveg mondja ki („a válaszokat a rendszer
  tárolja, de társaid és vezetőd csak összesítve, legalább 3 értékelőnél
  látják"). Ha jogi kör szigorúbbat kér: raterUserId → HMAC-hash
  (dedupe marad, visszafejtés nem).
- `TeamRoleScore` bővítés: `source` értékkészlet `"questionnaire" |
  "estimate" | "peer_aggregate"` — VAGY (tisztább) a peer-aggregátum nem
  ír TeamRoleScore-t, hanem olvasáskor számolódik a team-intelligence
  rétegben (`buildPeerRoleProfile(teamId, aboutUserId)`), cache nélkül.
  **Javaslat: számolt** — a pulse-aggregátum is így működik, és nincs
  szinkron-probléma új observation érkezésekor.

## 4. Kampány-integráció

- `CAMPAIGN_STEP_ORDER` bővítés: `OBSERVER_360 → TEAM_ROLE →
  TEAM_ROLE_360 → PSYCH_SAFETY` (campaign-steps-core.ts; a normalizálás
  és a legacy-fallback változatlan logikával viszi).
- Lépés-nyitás (per-user): a TEAM_ROLE_360 akkor nyílik a raternek, amikor
  a SAJÁT szerep-kérdőívét (TEAM_ROLE lépés) teljesítette. Teljesítés: ha
  a csapat minden AKTÍV tagjáról beadta a visszajelzést (részleges mentés
  védelme: batch-submit, ld. API).
- `CAMPAIGN_STEP_LABELS`: „Csapattársak szerep-visszajelzése" /
  „Team role peer feedback"; link: `/assessment/team-roles/peers`.
- Értesítés: a meglévő MEASUREMENT_STEP_OPENED fedi; remind a meglévő
  kampány-remind útján (CONSULTANT_ONLY marad).
- Utólagos tag-hozzáadás: az `initializeCampaignProgress` fast-forward
  logika érintetlen; az új tag raterként az elejéről indul, értékeltként
  azonnal kaphat visszajelzést.

## 5. API

- `GET /api/team-role/peers?teamId&campaignId` — a rater számára: értékelendő
  tagok listája + melyikről adott már be (dedupe-alapon). Guard: aktív
  résztvevő + nyitott TEAM_ROLE_360 lépés (STEP_LOCKED minta, 409).
- `POST /api/team-role/peers/submit` — batch: `{ teamId, campaignId,
  observations: [{ aboutUserId, selections }] }`. Tranzakcióban: upsert
  observation-ök + ha minden aktív tag lefedett →
  `advanceCampaignStepForUser` (a meglévő idempotens léptető).
- Aggregátum-olvasás: nem külön API — a team-oldal / riport szerver-oldali
  betöltője hívja a `buildPeerRoleProfile`-t (lib, prisma-réteg).

## 6. UI

- **Kitöltő** — `/assessment/team-roles/peers`: kártya-carousel tagonként
  (fotó/monogram + név), alatta a 27 állítás chip-rácsban; 8–12 kijelölés
  + 3 kiemelés; haladás-jelző („3/6 csapattárs kész"); a self-kitöltő
  vizuális nyelvén (QuestionCard-család). Anonimitás-ígéret az intro-n:
  a pulse-oldal mintája.
- **TeamCsapatszerepSection** bővítés: szerep-eloszlás a peer-aggregátumból
  (ha n ≥ 3), tagonként „önkép vs. csapatkép" sor: két top-3 chip-sor
  egymás alatt, eltérésnél jelölés; forrás-badge-ek: „csapat-visszajelzés
  (n=5)" / „önkitöltés" / „becslés". Küszöb alatt a pulse-mintájú
  magyarázó szöveg.
- **Csapatriport (team-report.ts)**: `TeamReportAggregates.peerRoles?`
  (opcionális — régi pillanatképekkel kompatibilis, a psychSafety
  mintájára): lefedettség, csapat-szintű szerep-eloszlás peer-forrásból,
  top önkép–csapatkép eltérések (max 3, név nélkül vagy a vezetői
  riportban névvel — DÖNTÉS: a validált riport csapatszintű marad,
  egyéni delta csak a debrief-beszélgetésben).
- **Saját profil** (results): „a csapatod így lát" blokk a saját top 3
  mellett — csak n ≥ 3-nál, különben a küszöb-szöveg.

## 7. Effort-becslés és ütemterv-hatás

| Tétel | Óra |
|---|---|
| Itembank véglegesítés HU/EN (vázlatból) + súly-kalibráció | 4 |
| Séma + init-migráció frissítés + API-k (peers, submit, léptető-hook) | 8 |
| Kitöltő UI (carousel + chip-rács + haladás) | 10 |
| Aggregátum-lib + TeamCsapatszerepSection + riport-integráció | 8 |
| Lépés-motor bővítés + tesztek (unit: aggregátum-küszöb, dedupe, léptetés) | 4 |
| Kézi QA friss DB-n | 3 |
| **Összesen** | **~37** |

Fedezet: az A1–A2 (TSFI) 16 órája felszabadult + ~26 óra tartalék + F1
puffer 20 óra. A vállalás belefér, de a slack nagyját elviszi → a C2
(lint-kör) és a D3 (landing záró kör) az optimista forgatókönyv szerint
elhagyható, ha szorít. A go/no-go (aug. 20.) kritériuma bővül: a peer-kör
QA-ja zöld VAGY a lépés kikapcsolható (a wizardban egyszerűen nem
választjuk ki — a multi-select miatt természetes vészkijárat, kód-szintű
feature flag nem is kell).

Ütem: 2. hét (júl. 27–aug. 2.) séma+API+itembank · 3. hét UI · 4. hét
aggregátum+riport+tesztek · 5. hét dry run részeként QA.

## 8. Kockázatok

- **Kis csapatok**: 3 fős csapatnál n≥3 csak teljes részvételnél teljesül;
  4 fő alatt a peer-kör felajánlását a wizard jelezze („kis csapatnál
  előfordulhat, hogy nem áll össze a csapatkép").
- **Rater-terhelés**: 8+ fős csapatnál a kitöltés 25+ perc — a pilotban
  (5–8 fős csapatok) még oké; nagyobb csapatokra később: random rater-
  részminta (Belbin is 4–6 observert kér, nem mindenkit).
- **Szépítés / halo**: a kiválasztás-kényszer (max 12) tompítja; a
  debrief-útmutató kezeli az értelmezést (riport-sablonok doc frissítendő
  a peer-szekcióval — külön tétel a pilot-playbookban).
- **Jogi**: a consent-szövegbe be kell kerülnie a peer-visszajelzés
  adatkezelésének (ki látja, hogyan aggregálódik, meddig tárolódik) —
  az ügyvédi anyagcsomag (B1) része legyen, MOST kerül ki hozzá.
