import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregatePeerRoleScores,
  poolPeerSelectionsByRatedMember,
} from "@/lib/team-role-peer";
import type { TeamRoleSelections } from "@/lib/team-role-questions";

// A results-oldal csapatszerep peer-aggregátumának HATÓKÖR-szabálya
// (motor-audit v6, M6). A korábbi lekérdezés minden `aboutUserId` szerinti
// observationt összeszedett — csapattól/időtől függetlenül, kilépő-védelem
// és self-szűrés nélkül. Az oldal kompozíciója mostantól:
//   1. csak a user JELENLEGI csapataiból származó sorok;
//   2. előszűrő: az értékelő az ADOTT csapatnak MA is tagja;
//   3. poolPeerSelectionsByRatedMember: self-kizárás + raterenként a
//      legutolsó kör (updatedAt szerint növekvő sorrend, csapatokon átívelő
//      dedupe);
//   4. aggregatePeerRoleScores: anonimitás-padló (n≥3) a szűkítés UTÁN.
// Ez a teszt PONTOSAN ezt a kompozíciót futtatja szintetikus sorokon — ha a
// pool szemantikája vagy a szabály elmozdul, itt törik.

const USER = "user-me";

interface Row {
  teamId: string;
  raterUserId: string;
  selections: TeamRoleSelections;
}

/** A page.tsx-beli kompozíció tükre (előszűrő + pool + aggregátor). */
function aggregateScoped(
  rows: Row[],
  membersByTeam: Map<string, Set<string>>,
) {
  const coMemberIds = new Set(
    [...membersByTeam.values()].flatMap((set) => [...set]),
  );
  const scoped = rows
    .filter((obs) => membersByTeam.get(obs.teamId)?.has(obs.raterUserId))
    .map((obs) => ({
      aboutUserId: USER,
      raterUserId: obs.raterUserId,
      selections: obs.selections,
    }));
  const pooled = poolPeerSelectionsByRatedMember(scoped, coMemberIds);
  return aggregatePeerRoleScores(pooled.get(USER) ?? []);
}

const team = (id: string, ...members: string[]) =>
  [id, new Set([USER, ...members])] as const;

test("kilépett értékelő ittmaradt sora nem számít bele az aggregátumba", () => {
  // T1-ben hárman értékeltek, de r3 azóta kilépett → 2 aktuális rater →
  // az anonimitás-padló alatt a scores rejtve marad.
  const membersByTeam = new Map([team("T1", "r1", "r2")]);
  const agg = aggregateScoped(
    [
      { teamId: "T1", raterUserId: "r1", selections: { OG1: 2 } },
      { teamId: "T1", raterUserId: "r2", selections: { OG2: 1 } },
      { teamId: "T1", raterUserId: "r3", selections: { KE1: 2 } }, // kilépő
    ],
    membersByTeam,
  );
  assert.equal(agg.raterCount, 2);
  assert.equal(agg.scores, null);
});

test("másik (már elhagyott) csapat sora nem szivárog be", () => {
  // A T2 nem a user aktuális csapata (nincs a membersByTeam-ben) → a sora
  // kiesik; T1-ből csak 3 érvényes rater marad.
  const membersByTeam = new Map([team("T1", "r1", "r2", "r3")]);
  const agg = aggregateScoped(
    [
      { teamId: "T1", raterUserId: "r1", selections: { OG1: 2 } },
      { teamId: "T1", raterUserId: "r2", selections: { OG1: 2 } },
      { teamId: "T1", raterUserId: "r3", selections: { OG1: 2 } },
      { teamId: "T2", raterUserId: "rX", selections: { MV1: 2 } }, // idegen
    ],
    membersByTeam,
  );
  assert.equal(agg.raterCount, 3);
  assert.ok(agg.scores);
  assert.equal(agg.scores.MV, 0, "idegen csapat jelölése beszivárgott");
});

test("önértékelés-sor (rater == user) kiesik", () => {
  const membersByTeam = new Map([team("T1", "r1", "r2", "r3")]);
  const agg = aggregateScoped(
    [
      { teamId: "T1", raterUserId: USER, selections: { SZ1: 2 } }, // self
      { teamId: "T1", raterUserId: "r1", selections: { OG1: 1 } },
      { teamId: "T1", raterUserId: "r2", selections: { OG1: 1 } },
      { teamId: "T1", raterUserId: "r3", selections: { OG1: 1 } },
    ],
    membersByTeam,
  );
  assert.equal(agg.raterCount, 3);
  assert.ok(agg.scores);
  assert.equal(agg.scores.SZ, 0, "a self-sor beszámítódott");
});

test("közös rater két csapatban: egyszer számít, a legutolsó köre él", () => {
  // r1 a T1-ben ÉS a T2-ben is értékelte a usert; a sorok updatedAt szerint
  // növekvő sorrendben érkeznek → a T2-es (újabb) kör írja felül a T1-est.
  const membersByTeam = new Map([team("T1", "r1", "r2"), team("T2", "r1", "r3")]);
  const agg = aggregateScoped(
    [
      { teamId: "T1", raterUserId: "r1", selections: { OG1: 2 } }, // régi
      { teamId: "T1", raterUserId: "r2", selections: { KE1: 1 } },
      { teamId: "T2", raterUserId: "r3", selections: { KE1: 1 } },
      { teamId: "T2", raterUserId: "r1", selections: { KE1: 2 } }, // új
    ],
    membersByTeam,
  );
  // r1 nem duplázódik: 3 külön rater.
  assert.equal(agg.raterCount, 3);
  assert.ok(agg.scores);
  // r1 régi OG-jelölése felülíródott — az OG-pontszám 0.
  assert.equal(agg.scores.OG, 0, "a felülírt (régi) kör beszámítódott");
});

test("nincs aktuális csapat: üres aggregátum (a régi sorok nem élnek tovább)", () => {
  const agg = aggregateScoped(
    [{ teamId: "T-old", raterUserId: "r1", selections: { OG1: 2 } }],
    new Map(),
  );
  assert.equal(agg.raterCount, 0);
  assert.equal(agg.scores, null);
});
