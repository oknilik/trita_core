import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  TEAM_ROLES,
  calculateTeamRoleScores,
  calculateTeamRoleScoresRaw,
  getTopRoles,
  type TeamRoleCode,
  type TeamRoleScores,
} from "@/lib/team-role-scoring";
import {
  TEAM_ROLE_ITEMS,
  TEAM_ROLE_ITEM_COUNT,
  TEAM_ROLE_MIN_SELECT,
  TEAM_ROLE_MAX_SELECT,
  TEAM_ROLE_TOP_SELECT,
  isValidTeamRoleSelectionSet,
  type TeamRoleSelections,
} from "@/lib/team-role-questions";
import {
  aggregatePeerRoleScores,
  compareSelfAndPeerTopRoles,
  poolPeerSelectionsByRatedMember,
  TEAM_ROLE_PEER_MIN_RATERS,
} from "@/lib/team-role-peer";

describe("team-role itembank", () => {
  it("has 27 items — 3 per role, ids prefixed with the role code", () => {
    assert.equal(TEAM_ROLE_ITEM_COUNT, 27);
    const perRole = new Map<string, number>();
    for (const item of TEAM_ROLE_ITEMS) {
      assert.ok(item.id.startsWith(item.role));
      assert.ok(item.self.hu.length > 0);
      assert.ok(item.self.en.length > 0);
      assert.ok(item.peer.hu.length > 0);
      assert.ok(item.peer.en.length > 0);
      perRole.set(item.role, (perRole.get(item.role) ?? 0) + 1);
    }
    assert.equal(perRole.size, Object.keys(TEAM_ROLES).length);
    for (const count of perRole.values()) assert.equal(count, 3);
  });

  it("validates selection sets: count band and exact top count", () => {
    const ids = TEAM_ROLE_ITEMS.map((i) => i.id);
    const valid: TeamRoleSelections = {};
    ids.slice(0, TEAM_ROLE_MIN_SELECT).forEach((id, idx) => {
      valid[id] = idx < TEAM_ROLE_TOP_SELECT ? 2 : 1;
    });
    assert.equal(isValidTeamRoleSelectionSet(valid), true);

    // túl kevés kijelölés
    const few = { ...valid };
    delete few[ids[TEAM_ROLE_MIN_SELECT - 1]];
    assert.equal(isValidTeamRoleSelectionSet(few), false);

    // túl sok kijelölés
    const many: TeamRoleSelections = {};
    ids.slice(0, TEAM_ROLE_MAX_SELECT + 1).forEach((id, idx) => {
      many[id] = idx < TEAM_ROLE_TOP_SELECT ? 2 : 1;
    });
    assert.equal(isValidTeamRoleSelectionSet(many), false);

    // rossz kiemelt-darabszám
    const wrongTop = { ...valid, [ids[0]]: 1 } as TeamRoleSelections;
    assert.equal(isValidTeamRoleSelectionSet(wrongTop), false);

    // ismeretlen item-id
    assert.equal(
      isValidTeamRoleSelectionSet({ ...valid, NOPE1: 1 } as TeamRoleSelections),
      false,
    );
  });

  it("rejects the all-weight-2 exploit (a candidate-route korábbi rése)", () => {
    // C1: a jelölt-route kézi ellenőrzése NEM zárta ki, ha minden kijelölt
    // item 2-es (kiemelt) súlyt kap — 12×2 = 24 összsúly, amivel egyszerre
    // több szerep 100%-ra tornászható. A kanonikus validátor a „pontosan 3
    // kiemelt" szabállyal ezt elutasítja.
    const ids = TEAM_ROLE_ITEMS.map((i) => i.id).slice(0, TEAM_ROLE_MAX_SELECT);
    const allTop: TeamRoleSelections = {};
    ids.forEach((id) => {
      allTop[id] = 2;
    });
    assert.equal(Object.keys(allTop).length, TEAM_ROLE_MAX_SELECT);
    assert.equal(isValidTeamRoleSelectionSet(allTop), false);
  });
});

describe("team-role scoring (selection-based)", () => {
  it("scores a full-role highlighted pick at 100 and unpicked roles at 0", () => {
    // OG mindhárom iteme kiemelt (a 3 kiemelt-limit pont kijön), + 5 sima
    const selections: TeamRoleSelections = {
      OG1: 2,
      OG2: 2,
      OG3: 2,
      KE1: 1,
      KO1: 1,
      HA1: 1,
      ER1: 1,
      CS1: 1,
    };
    const scores = calculateTeamRoleScores(selections);
    assert.equal(scores.OG, 100);
    assert.equal(scores.KE, Math.round((1 / 6) * 100));
    assert.equal(scores.MV, 0);
    const top = getTopRoles(scores);
    assert.equal(top[0].role, "OG");
    assert.equal(top.length, 3);
  });

  it("ignores unknown item ids defensively", () => {
    const scores = calculateTeamRoleScores({
      OG1: 1,
      XX9: 2,
    } as TeamRoleSelections);
    assert.equal(scores.OG, Math.round((1 / 6) * 100));
    const sum = Object.values(scores).reduce((a, b) => a + b, 0);
    assert.equal(sum, scores.OG);
  });

  it("a raw változat kerekítetlen, a kerekített annak a Math.round-ja", () => {
    const selections: TeamRoleSelections = { OG1: 1, MV1: 2 };
    const raw = calculateTeamRoleScoresRaw(selections);
    assert.ok(Math.abs(raw.OG - (1 / 6) * 100) < 1e-9);
    assert.ok(Math.abs(raw.MV - (2 / 6) * 100) < 1e-9);
    const rounded = calculateTeamRoleScores(selections);
    for (const role of Object.keys(raw) as TeamRoleCode[]) {
      assert.equal(rounded[role], Math.round(raw[role]));
    }
  });
});

describe("peer aggregate (anonymity threshold)", () => {
  const pick = (ids: string[], top: string[]): TeamRoleSelections => {
    const sel: TeamRoleSelections = {};
    ids.forEach((id) => {
      sel[id] = top.includes(id) ? 2 : 1;
    });
    return sel;
  };
  const raterA = pick(
    ["OG1", "OG2", "OG3", "KE1", "KO1", "HA1", "ER1", "CS1"],
    ["OG1", "OG2", "OG3"],
  );
  const raterB = pick(
    ["OG1", "OG2", "MV1", "MV2", "KE1", "KO1", "HA1", "ER1"],
    ["OG1", "MV1", "MV2"],
  );
  const raterC = pick(
    ["OG1", "OG3", "MV1", "SZ1", "KE2", "KO2", "HA2", "ER2"],
    ["OG1", "OG3", "MV1"],
  );

  it("returns no scores below the rater threshold", () => {
    const agg = aggregatePeerRoleScores([raterA, raterB]);
    assert.equal(agg.raterCount, 2);
    assert.ok(agg.raterCount < TEAM_ROLE_PEER_MIN_RATERS);
    assert.equal(agg.scores, null);
    assert.equal(agg.topRoles.length, 0);
  });

  it("averages rater profiles at or above the threshold", () => {
    const agg = aggregatePeerRoleScores([raterA, raterB, raterC]);
    assert.equal(agg.raterCount, 3);
    assert.notEqual(agg.scores, null);
    assert.equal(agg.topRoles[0].role, "OG");
    // OG: A=100, B=(2+1+0? OG1=2,OG2=1 →3/6=50), C=(2+0+2 →4/6≈67) → átlag ~72
    assert.ok(agg.scores!.OG > agg.scores!.KE);
  });

  it("compares self and peer top-3 sets", () => {
    const diff = compareSelfAndPeerTopRoles(
      [{ role: "OG" as TeamRoleCode }, { role: "KE" as TeamRoleCode }, { role: "KO" as TeamRoleCode }],
      [{ role: "OG" as TeamRoleCode }, { role: "MV" as TeamRoleCode }, { role: "KO" as TeamRoleCode }],
    );
    assert.deepEqual([...diff.shared].sort(), ["KO", "OG"]);
    assert.deepEqual(diff.selfOnly, ["KE"]);
    assert.deepEqual(diff.peerOnly, ["MV"]);
  });

  it("azonos össz-súlyú koncentrált (2+2+2 egy raternél) és szórt (2 mindenkitől) jelölés EGYENLŐ evidencia — nem a per-rater kerekítés dönt", () => {
    // MV: egy rater mindhárom itemet kiemeli (súly 6) → nyers 100, 0, 0;
    // OG: mindhárom rater 1-1 kiemelt itemet ad (súly 2) → nyers 33,33×3.
    // Össz-súly mindkettőnél 6 → a nyers átlag azonos (33,33) — VALÓDI
    // holtverseny, amit a determinisztikus hash old fel. A régi, kerekített
    // per-rater átlagolás (100+0+0)/3 = 33,33 vs (33+33+33)/3 = 33,0
    // torzítást csinált az azonos evidenciából.
    const raterHigh: TeamRoleSelections = { MV1: 2, MV2: 2, MV3: 2, OG1: 2 };
    const raterLow1: TeamRoleSelections = { OG1: 2 };
    const raterLow2: TeamRoleSelections = { OG1: 2 };
    const agg = aggregatePeerRoleScores([raterHigh, raterLow1, raterLow2]);
    assert.ok(agg.scores);
    assert.equal(agg.scores.MV, 33);
    assert.equal(agg.scores.OG, 33);
    // Azonos evidencia → a sorrend determinisztikus (ismételt hívásra azonos).
    const again = aggregatePeerRoleScores([raterHigh, raterLow1, raterLow2]);
    assert.deepEqual(
      agg.topRoles.map((r) => r.role),
      again.topRoles.map((r) => r.role),
    );
  });

  it("a koncentrált dupla-súly (2+1+0) nem veszít a szórt szimplákkal (1+1+1) szemben — a nyers átlag a mérce (motor-audit v4)", () => {
    // Azonos össz-súly (3-3) → az MI–SZ relatív sorrendnek FÜGGETLENNEK kell
    // lennie attól, melyik szerep kapta a koncentrált jelölést. A régi kód
    // per-rater kerekített átlagot vett: 1+1+1 → 17,0 verte a 2+1+0 → 16,67-et,
    // így a sorrend a koncentráció-irány cseréjére megfordult.
    const scenarioA = [
      { MI1: 1, SZ1: 2 } as TeamRoleSelections,
      { MI2: 1, SZ2: 1 } as TeamRoleSelections,
      { MI3: 1 } as TeamRoleSelections,
    ];
    const scenarioB = [
      { MI1: 2, SZ1: 1 } as TeamRoleSelections,
      { MI2: 1, SZ2: 1 } as TeamRoleSelections,
      { SZ3: 1 } as TeamRoleSelections,
    ];
    const aggA = aggregatePeerRoleScores(scenarioA);
    const aggB = aggregatePeerRoleScores(scenarioB);
    assert.ok(aggA.scores && aggB.scores);
    // Mindkét szerep mindkét forgatókönyvben azonos kerekített pontot kap.
    assert.equal(aggA.scores.MI, aggA.scores.SZ);
    assert.deepEqual(aggA.scores, aggB.scores);
    // Csak MI és SZ kapott jelölést → mindkettő a top-3-ban van, és a
    // relatív sorrendjük nem fordulhat meg a koncentráció-irány cseréjétől
    // (azonos evidencia → azonos seed → azonos hash-döntés).
    const order = (roles: { role: TeamRoleCode }[]) => {
      const mi = roles.findIndex((r) => r.role === "MI");
      const sz = roles.findIndex((r) => r.role === "SZ");
      assert.ok(mi >= 0 && sz >= 0, `MI/SZ hiányzik a top-listából: ${roles.map((r) => r.role).join(",")}`);
      return Math.sign(mi - sz);
    };
    assert.equal(
      order(aggA.topRoles),
      order(aggB.topRoles),
      "a MI–SZ sorrend a koncentráció-iránytól függ — a per-rater kerekítés torzít",
    );
  });

  it("nagyobb össz-súly a rangsorban a kisebb elé kerül, koncentrációtól függetlenül", () => {
    // SZ össz-súly 4 (2+2+0) vs MI össz-súly 3 (1+1+1) → SZ áll elöl.
    const agg = aggregatePeerRoleScores([
      { SZ1: 2, MI1: 1 } as TeamRoleSelections,
      { SZ2: 2, MI2: 1 } as TeamRoleSelections,
      { MI3: 1 } as TeamRoleSelections,
    ]);
    assert.ok(agg.scores);
    const roles = agg.topRoles.map((r) => r.role);
    assert.ok(
      roles.indexOf("SZ") < roles.indexOf("MI"),
      `SZ (össz-súly 4) az MI (3) mögé került: ${roles.join(",")}`,
    );
  });
});

// ── S2: holtverseny-feloldás — determinisztikus, de kódsorrend-mentes ───────

describe("getTopRoles tie-break (S2)", () => {
  const allTied = (value: number): TeamRoleScores =>
    Object.fromEntries(
      (Object.keys(TEAM_ROLES) as TeamRoleCode[]).map((role) => [role, value]),
    ) as TeamRoleScores;

  it("determinisztikus: ugyanarra a profilra ismételten ugyanaz a sorrend", () => {
    const scores = allTied(42);
    const first = getTopRoles(scores, 9).map((r) => r.role);
    const second = getTopRoles(scores, 9).map((r) => r.role);
    assert.deepEqual(first, second);
  });

  it("teljes döntetlennél NEM a deklarációs sorrend (OG/KE/KO) nyer minden profilon", () => {
    // A régi stabil sort minden döntetlent az OG-nak adott. Az új szabály
    // profil-függő hash-sel dönt: 100 különböző döntetlen-profilon minden
    // szerepnek nyernie kell legalább egyszer, és a késői kódoknak
    // (MV/MI/SZ) is érdemi arányban.
    const winners = new Map<TeamRoleCode, number>();
    for (let value = 0; value < 100; value += 1) {
      const [top] = getTopRoles(allTied(value), 1);
      winners.set(top.role, (winners.get(top.role) ?? 0) + 1);
    }
    assert.equal(winners.size, 9, `nem minden szerep nyert: ${[...winners.keys()].join(",")}`);
    const lateWins = (["MV", "MI", "SZ"] as TeamRoleCode[]).reduce(
      (sum, role) => sum + (winners.get(role) ?? 0),
      0,
    );
    // Egyenletes eloszlásnál 33 lenne; a torzításmentesség őre egy laza sáv.
    assert.ok(lateWins >= 15, `a késői kódok alig nyernek (${lateWins}/100) — kódsorrend-torzítás`);
    assert.ok(
      (winners.get("OG") ?? 0) < 50,
      `az OG nyeri a döntetlenek felét (${winners.get("OG")}/100) — kódsorrend-torzítás`,
    );
  });

  it("a finomabb evidencia (exact) felülírja a hash-t a kerekítés-azonos szerepeknél", () => {
    const scores = { OG: 33, KE: 0, KO: 0, HA: 0, ER: 0, CS: 0, MV: 33, MI: 0, SZ: 0 } as TeamRoleScores;
    // Az exact szerint az MV mögött több a jel — neki kell nyernie, minden
    // hash-kimenettől függetlenül.
    const top = getTopRoles(scores, 2, { OG: 33.0, MV: 33.4 });
    assert.equal(top[0].role, "MV");
    assert.equal(top[1].role, "OG");
    // A megjelenített pontszám a kerekített marad.
    assert.equal(top[0].score, 33);
    // Fordított evidenciával fordul a sorrend — tehát tényleg az exact dönt.
    const flipped = getTopRoles(scores, 2, { OG: 33.4, MV: 33.0 });
    assert.equal(flipped[0].role, "OG");
  });
});

// ── S4: a peer-halmaz a jelenlegi tagokra szűkül ────────────────────────────

describe("poolPeerSelectionsByRatedMember (S4)", () => {
  const sel = (id: string): TeamRoleSelections => ({ [id]: 2 });
  const row = (about: string, rater: string, itemId = "OG1") => ({
    aboutUserId: about,
    raterUserId: rater,
    selections: sel(itemId),
  });

  it("kilépett értékelők kiesnek → az értékelő-szám ≤ aktuális taglétszám − 1 (lefedettség ≤ 100%)", () => {
    const current = new Set(["a", "b", "c"]);
    // 'a'-ról 4 értékelés: 2 jelenlegi tagtól (b, c) + 2 kilépettől (x, y).
    // Szűkítés nélkül raterCount=4 > taglétszám−1=2 → 200% „lefedettség".
    const pooled = poolPeerSelectionsByRatedMember(
      [row("a", "b"), row("a", "c"), row("a", "x"), row("a", "y")],
      current,
    );
    const sets = pooled.get("a");
    assert.ok(sets);
    assert.equal(sets.length, 2, "kilépett értékelő jelölése bent maradt");
    assert.ok(sets.length <= current.size - 1, "az értékelő-szám átlépi a taglétszám − 1 korlátot");
  });

  it("kilépett ÉRTÉKELT tag profilja nem képződik", () => {
    const pooled = poolPeerSelectionsByRatedMember(
      [row("gone", "a"), row("b", "a")],
      new Set(["a", "b"]),
    );
    assert.equal(pooled.has("gone"), false);
    assert.equal(pooled.has("b"), true);
  });

  it("páronként a legutolsó kör számít (a bemenet updatedAt szerint növekvő)", () => {
    const older = { aboutUserId: "a", raterUserId: "b", selections: sel("OG1") };
    const newer = { aboutUserId: "a", raterUserId: "b", selections: sel("MV1") };
    const pooled = poolPeerSelectionsByRatedMember([older, newer], new Set(["a", "b"]));
    const sets = pooled.get("a");
    assert.ok(sets);
    assert.equal(sets.length, 1, "az ismételt kör duplázódott a felülírás helyett");
    assert.deepEqual(sets[0], sel("MV1"), "nem a legfrissebb kör maradt meg");
  });

  it("önjelölés védekezően kiesik", () => {
    const pooled = poolPeerSelectionsByRatedMember([row("a", "a"), row("a", "b")], new Set(["a", "b"]));
    assert.equal(pooled.get("a")?.length, 1);
  });

  it("a szűkítés UTÁN is áll az anonimitás-padló: küszöb alá eső profil rejtve", () => {
    // 3 értékelésből 1 kilépetté → 2 marad, ami a küszöb (3) alatt van:
    // az aggregátumnak null pontszámot kell adnia, nem kilépő-adattal feltöltöttet.
    const pooled = poolPeerSelectionsByRatedMember(
      [row("a", "b"), row("a", "c"), row("a", "leaver")],
      new Set(["a", "b", "c"]),
    );
    const agg = aggregatePeerRoleScores(pooled.get("a") ?? []);
    assert.equal(agg.raterCount, 2);
    assert.ok(agg.raterCount < TEAM_ROLE_PEER_MIN_RATERS);
    assert.equal(agg.scores, null, "küszöb alatti profil mégis megjelenik");
    assert.deepEqual(agg.topRoles, []);
  });
});
