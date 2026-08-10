# 2026-08-10 — Manager-cockpit: N+1 megszüntetése + mért/becsült él-megoszlás

Audit P2 zárása: a `/manager` cockpit csapatonként a TELJES `getTeamPageData`
pipeline-t futtatta (trust-háló, mintázat, heatmap — ~6 lekérdezés/csapat),
a headline dinamika-számok pedig mért és becsült éleket adtak össze jelölés
nélkül; a „primary" csapat a rendezés ELŐTTI lista [0]-ja volt.

## Kötegelt betöltő (`getManagerCockpitTeamStats`)

- Az összes kezelt csapat cockpit-statja KONSTANS számú lekérdezésből:
  (1) csapatok+tagok egy `findMany`-ben · (2) tagonkénti legutolsó
  self-eredmény (`distinct`+`orderBy`, az org-stats mintája) ·
  (3) trust-megfigyelések egyben, csapatonként csoportosítva ·
  (4) függő csapat-meghívó darabszámok (`groupBy`) · (5) aktív org-kampány
  egyszer (nem csapatonként) · (6) COMPLETED observer-inviterek egyben.
- Lekérdezés-szám: korábban ~6+6·N (5 csapatnál ~36), most ~18 fixen,
  csapatszámtól függetlenül; a nem-primary csapatokra a mintázat/heatmap
  számítás is elmarad.
- Az élek in-memory épülnek a meglévő függvényekkel: `buildProfileBasedEdges`
  + `mergeTrustEdges` (mostantól exportált, `team-stats.ts`) és
  `computeTrustNetwork` + új közös `dedupeLatestTrustObservations`
  (`trust-network.ts`, a `buildTeamTrustNetwork` is ezt hívja).
- A kampány csapat-szintű statja tiszta helperbe került
  (`computeTeamActiveCampaign`, `team-stats.ts`) — a `getTeamPageData` és a
  cockpit ugyanazt a logikát futtatja, viselkedés-azonosan.
- Teljes `TeamPageData` már CSAK a primary csapatra töltődik (a tag-lista
  szekcióhoz); a feed maradt 3 lekérdezés, a several-team tag first-team-wins
  attribúciója tudatos korlátként kommentelve.

## Mért/becsült él-megoszlás a cockpiton

- `ManagerTeamSummary` új mezői: `measuredEdgeCount` / `estimatedEdgeCount`
  — a „mért" definíció a team-report.ts-sel azonos (`trust_round` VAGY
  örökség `observer`; a `profile_estimate` becslés).
- A `/manager` dinamika-szekcióban a headline számok alatt diszkrét
  forrás-sor: „ebből mért (bizalmi körből): n · profil-becslés: m", ill.
  mért adat híján „profil-alapú becslés — még nincs mért bizalmi kör"
  (HU+EN, a cockpit meglévő szöveg-stílusában).

## Primary-csapat javítás

- A „primary" (részletesen renderelt) csapat mostantól a RENDEZETT
  (legalacsonyabb kitöltöttség elöl) lista első eleme — korábban a tag-lista
  és a dinamika-szekció másik csapatot mutathatott, mint a kártyalista eleje.
- Tiszta, unit-tesztelt logika: `src/lib/manager-cockpit-core.ts`
  (`splitDynamicsEdges`, `sortTeamsByCompletion`, `pickPrimaryTeam`) + új
  teszt `tests/unit/team/manager-cockpit-core.test.ts` (12 eset).

Ellenőrzés: type-check 0 hiba · lint tiszta a változott fájlokon · unit zöld
(az egyetlen piros, `guest-teaser`, egy párhuzamos, folyamatban lévő
`personality-type.ts` módosításból jön — HEAD-en zöld).
