# 2026-08-10 — motor-audit javítási kör

A `docs/audits/motor-audit-2026-08-10.md` P0-leleteinek teljes javítása, a
P1/P2-réteg érdemes részeivel és három kisebb feature-rel. 55 fájl, minden
ellenőrzés zöld (type-check 0 hiba · lint tiszta · unit 647 · client 120).

## Megerősített hibák (P0) — mind javítva

| Mi | Hol |
|---|---|
| Önkép–külső kép insight-doboz sosem renderelt (kulcs-eltérés) → `TRITAN_DIM_ABBR`-leképezés | `ComparisonTab.tsx` |
| Hamis vakfolt a hiányzó observer-dimenzióból (0-fallback) → kanonikus `computeObserverAverage` a results-oldalon is | `results/page.tsx` |
| Hiányzó külső adat „tökéletes egyezésként" (`?? self`) → dimenziónkénti „nincs külső adat" állapot (képernyő + PDF), az ilyen sor kimarad a számlálókból | `ComparisonTab` · `ProfileTabs` |
| `RISK_TEXTS` halott volt → a kockázati párok mitigációs tanácsa bekerül a „hogyan dolgozol" blokkba + strukturált `riskParts`; a PDF `riskInsight` ebből jön (nem a 2. tetszőleges bekezdésből) | `workstyle-content` · `ProfileTabs` |
| Meghívó-kvóta lifetime-ként számolt → csak aktív (függő, nem lejárt) meghívó számít az 5-be | `api/observer/invite` |
| Súrlódás-modell: hiányzó dimenziónál nincs renormalizálás → jelen lévő súlyokkal normalizál, közös dim nélkül `null`; ÚJ `friction-model.test.ts` | `friction-model.ts` |
| Nyomás-modell: egyazon dim mindkét pólusa tüzelhetett → egyetlen „polarizált" találat, saját HU+EN szöveggel | `team-pressure.ts` |
| Hub-számítás: a DynamicsMap csak az él `to` végpontját számolta → közös `computeAlignedHubIds` (mindkét végpont), a riport-fallback is ezt hívja; a trust-hub (mért) külön fogalom marad | `friction-model` · `DynamicsMap` · `team-report` |
| Dinamika-provenance: fix „profil becslés" mért trust-körnél is → él-forrás alapú mért/vegyes/becslés/nincs-adat címke, evidencia-forrás csak mért élnél `self_plus_observer` | `intelligence-data` · `TeamIntelligence` |
| Vezető-detektálás angol substringekkel → a kötött szerep-készletre az `isTeamManagerRole` az igazságforrás | `team-intelligence.ts` |
| Fallback prioritás-kártya idegen id-t hasznosított újra → saját `healthy_baseline` | `team-intelligence.ts` |
| Guest-teaser ≠ belépett út döntetlen-szabálya → közös `rankDimensionScores` (score desc, majd TRITAN_ORDER) | `tritan.ts` · `guest-teaser` · `personality-type` |
| Dossier: adathiány (`disconnected`) konfliktusként, hiányzó self-dim −100-as deltaként → mindkettő kimarad | `member-dossier*` |
| `topFrictionDims`: másra szűrt, mint amire rangsorolt → mindkettő a súlyozott szóráson (w·spread ≥ 2) | `team-report.ts` |
| Hibás, HU-only facet-nevek az upsell-teaserben → kanonikus `TRITAN_DIMENSION_FACETS` + lokalizált nevek, guardrail-teszttel | `tritan.ts` · `DimensionAccordion` |
| Karrier: halott `RANK_WEIGHTS.interest`, duplikált UI-súly (2× mutatott súly), scoped 0.7/0.3 eltérés, fix short-form SEM → effektív súly a `meta`-ban, form a tárolt pecsétből | `career/*` |
| Hiring team-fit: 1 fős „csapatátlag" + illeszkedés-nyelv → ≥3 tag küszöb (`{min}` interpolációval), őszinte hasonlóság-címkék | `hiring/.../[inviteId]` |
| Observer-számlálók széttartása (all-time vs kampány-szűrt; lejárt meghívók túlszámolása) → fresh-szemantika org-governed ágon + közös `sentObserverInviteWhere()` a team- és tasks-oldalon | `observer-flow` · `invite-policy` |

## Kivezetés (egyszerűsítés)

- **Contribution-placement (TeamMap-modell) törölve**: minden betöltéskor
  számolt, de a redesign óta semmi nem renderelte; az adat nélküli tag ráadásul
  „high" konfidenciát kapott. Ment vele: zóna-névtáblák, árva i18n-kulcsok,
  placement-tesztek. (CLAUDE.md frissítve.)
- Halott kód: scoring `aspects`-út (számítás+tárolás megszűnt, olvasás toleráns
  maradt), 11 nem használt `profile-content` export, `rawDiversity`
  emotionality/honesty, `normalizeToCodes` no-op a hazug Big Five-kommenttel,
  `dimensionFacets` másolat.

## Konszolidáció

- `resolveDisplayRoleScores` mostantól az EGYETLEN precedencia-hely (7 inline
  másolat kivezetve); a becslés-ág elé teljességi kapu került
  (`hasCompleteTritanDims`): részleges profilból nem születik szerep-becslés.
- Konstans-deduplikáció: `TEAM_ROLE_PEER_MIN_RATERS` import a literál helyett,
  `PATTERN_THRESHOLDS` export, `PROFILE_HIGH/LOW_THRESHOLD` (65/35) egy helyről
  az interakció- és nyomás-motorban, `TRUST_EDGE_MODERATE_MIN`,
  `EDGE_CONFIDENCE_MUTUAL/ONE_SIDED`, `OBSERVER_INVITE_MAX_ACTIVE/TTL_DAYS`
  a policy-modulban.
- Score-JSON provenance-pecsét minden író útvonalon (a `calculateScores`-ba
  ágyazva): `form` + `bankVersion: "tsfi-v2"` + `engineVersion` — a
  karrier-motor `formFromScores` a pecsétet olvassa, heurisztika csak legacy
  fallback. ÚJ `tests/unit/scoring/scoring.test.ts` (pivot, horgonyok,
  short/full ekvivalencia, extract-szűrés).

## Új funkciók

- **Automata observer-emlékeztető** a napi sweep-ben (nincs új Vercel-cron):
  PENDING + nem lejárt + ≥4 napos meghívó, ismétlés ≥5 nap után, max 2 automata
  emlékeztető, futásonként max 50; a meglévő `sendObserverInviteEmail(isReminder)`
  úton, a számláló csak sikeres küldés után lép. Teszt: kiválasztási szabályok.
- **Átlagos rater-magabiztosság badge** az összevetés-tabon (az eddig
  write-only `confidence` mezőből, a megírva várakozó i18n-kulcsokkal).
- **Egyoldalú mért trust-él jelzése** a DynamicsMap él-részletezőjében
  (mutual/one-sided confidence eddig tárolt, de láthatatlan volt).
- Kiegyensúlyozott profil narratívája (`DEFAULT_NARRATIVE`) bekötve: lapos
  profil is értelmes szöveget kap; a `COLLAB_FRICTION` RESO/TEMP/OPEN ágai
  elérhetővé váltak (teljes súly-sorrend, max 2 marad); share-oldalon is van
  becslés-badge a csapatszerepen; PDF forrás-címkék a képernyős i18n-kulcsokból.

## Nem része ennek a körnek (tudatosan)

Norma-percentilis (P4.3, pilot-adat kell), SEM-sávok a fő felületen, 12/22 és
minta-küszöbök kalibrálása, rater-bias/halo-detektor, facet-szintű
observer-összevetés, recency-súlyozás a peer/trust poolokban — ezek a
motor-audit P1 rétegében várnak, több adat vagy termék-döntés kell hozzájuk.
