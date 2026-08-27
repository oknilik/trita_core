import test from "node:test";
import assert from "node:assert/strict";
import type { SerializedTeamMember } from "@/lib/team-stats";
import {
  MIN_INTELLIGENCE_ASSESSMENTS,
  buildTeamIntelligenceEvidence,
  buildTeamIntelligencePriorities,
  resolveTeamIntelligenceConfidence,
  resolveTeamIntelligenceQuality,
  resolveTeamTabRedirect,
} from "@/lib/team-intelligence";

function makeMember(
  id: string,
  role: string,
  scores: Record<string, number>,
): SerializedTeamMember {
  return {
    id,
    userId: id,
    displayName: `Member ${id}`,
    email: `${id}@example.com`,
    role,
    joinedAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    scores,
    testType: "TRITAN",
    top3Dims: [],
    teamRoleScores: null,
    teamRoleSource: null,
  };
}

test("quality resolver follows minimum-assessment threshold", () => {
  assert.equal(resolveTeamIntelligenceQuality(0, 6), "none");
  assert.equal(resolveTeamIntelligenceQuality(MIN_INTELLIGENCE_ASSESSMENTS - 1, 6), "partial");
  assert.equal(resolveTeamIntelligenceQuality(MIN_INTELLIGENCE_ASSESSMENTS, 6), "sufficient");
});

test("quality resolver requires coverage, not just an absolute count (D3)", () => {
  // 3 kitöltés 50 tagból = 6% lefedettség → csak részleges, nem "elégséges".
  assert.equal(resolveTeamIntelligenceQuality(3, 50), "partial");
  // 3/6 = 50% a küszöbön → elégséges.
  assert.equal(resolveTeamIntelligenceQuality(3, 6), "sufficient");
  // magas lefedettség → elégséges.
  assert.equal(resolveTeamIntelligenceQuality(6, 6), "sufficient");
  // 100% lefedettség sem elég, ha az abszolút szám a minimum alatt van.
  assert.equal(resolveTeamIntelligenceQuality(2, 2), "partial");
});

test("confidence resolver maps quality to expected confidence", () => {
  assert.equal(resolveTeamIntelligenceConfidence("none"), "low");
  assert.equal(resolveTeamIntelligenceConfidence("partial"), "medium");
  assert.equal(resolveTeamIntelligenceConfidence("sufficient"), "high");
});

test("legacy team tabs redirect to their consolidated sections", () => {
  assert.deepEqual(resolveTeamTabRedirect("roles"), {
    tab: "intelligence",
    anchor: "#team-roles",
  });
  assert.deepEqual(resolveTeamTabRedirect("teamRole"), {
    tab: "intelligence",
    anchor: "#team-roles",
  });
  assert.deepEqual(resolveTeamTabRedirect("profile"), {
    tab: "intelligence",
    anchor: "#team-profile",
  });
  assert.equal(resolveTeamTabRedirect("feedback"), null);
  assert.equal(resolveTeamTabRedirect("intelligence"), null);
  assert.equal(resolveTeamTabRedirect(undefined), null);
});

test("priority engine flags missing assessment completions", () => {
  const priorities = buildTeamIntelligencePriorities({
    members: [],
    completedCount: 1,
    memberCount: 5,
    teamId: "team_1",
    orgId: "org_1",
    hasObserverRound: false,
    canManageTeamActions: true,
    locale: "hu",
  });

  assert.equal(priorities[0]?.id, "missing_assessments");
});

test("priority engine adds high spread trigger when a dimension range is wide", () => {
  const members: SerializedTeamMember[] = [
    makeMember("u1", "member", { H: 60, E: 45, X: 20, A: 60, C: 60, O: 50 }),
    makeMember("u2", "member", { H: 61, E: 46, X: 75, A: 59, C: 58, O: 52 }),
    makeMember("u3", "member", { H: 59, E: 44, X: 24, A: 61, C: 62, O: 48 }),
    makeMember("u4", "member", { H: 60, E: 45, X: 70, A: 60, C: 61, O: 50 }),
  ];

  const priorities = buildTeamIntelligencePriorities({
    members,
    completedCount: 4,
    memberCount: 4,
    teamId: "team_1",
    orgId: "org_1",
    hasObserverRound: true,
    canManageTeamActions: false,
    locale: "hu",
  });

  assert.equal(priorities.some((priority) => priority.id === "dimension_spread"), true);
});

test("cohesion risk reason shows the average but no ± spread number (2026-08-11)", () => {
  // Alacsony kohézió-proxy (A/H = 40 → átlag 40% < 45) → cohesion_risk.
  // A szórás továbbra is kiváltó lehet, de számként nem jelenhet meg.
  const members: SerializedTeamMember[] = ["u1", "u2", "u3", "u4"].map((id) =>
    makeMember(id, "member", { H: 40, E: 48, X: 52, A: 40, C: 54, O: 51 }),
  );

  for (const locale of ["hu", "en"] as const) {
    const priorities = buildTeamIntelligencePriorities({
      members,
      completedCount: 4,
      memberCount: 4,
      teamId: "team_1",
      orgId: "org_1",
      hasObserverRound: true,
      canManageTeamActions: false,
      locale,
    });

    const cohesion = priorities.find((priority) => priority.id === "cohesion_risk");
    assert.ok(cohesion, `hiányzó cohesion_risk (${locale})`);
    assert.ok(cohesion.reason.includes("40%"), `hiányzó átlag-szám (${locale})`);
    assert.ok(!cohesion.reason.includes("±"), `± maradt a szövegben (${locale})`);
  }
});

test("priority engine adds leader-team mismatch trigger for large H/A delta", () => {
  // A TeamMember.role kötött készlete: "member" | "manager" | "admin" –
  // mindkét kezelő szerep vezetőnek számít.
  for (const leaderRole of ["manager", "admin"] as const) {
    const members: SerializedTeamMember[] = [
      makeMember("lead_1", leaderRole, { H: 80, E: 45, X: 50, A: 80, C: 55, O: 50 }),
      makeMember("u2", "member", { H: 55, E: 48, X: 52, A: 55, C: 54, O: 51 }),
      makeMember("u3", "member", { H: 54, E: 47, X: 50, A: 56, C: 56, O: 49 }),
      makeMember("u4", "member", { H: 56, E: 46, X: 49, A: 54, C: 55, O: 50 }),
    ];

    const priorities = buildTeamIntelligencePriorities({
      members,
      completedCount: 4,
      memberCount: 4,
      teamId: "team_1",
      orgId: "org_1",
      hasObserverRound: true,
      canManageTeamActions: false,
      locale: "hu",
    });

    assert.equal(
      priorities.some((priority) => priority.id === "leader_team_mismatch"),
      true,
      `leader role: ${leaderRole}`,
    );
  }
});

test("priority engine falls back to a dedicated healthy_baseline card", () => {
  const members: SerializedTeamMember[] = [
    makeMember("u1", "member", { H: 55, E: 48, X: 52, A: 55, C: 54, O: 51 }),
    makeMember("u2", "member", { H: 54, E: 47, X: 50, A: 56, C: 56, O: 49 }),
    makeMember("u3", "member", { H: 56, E: 46, X: 49, A: 54, C: 55, O: 50 }),
  ];

  const priorities = buildTeamIntelligencePriorities({
    members,
    completedCount: 3,
    memberCount: 3,
    teamId: "team_1",
    orgId: "org_1",
    hasObserverRound: true,
    canManageTeamActions: true,
    locale: "hu",
  });

  assert.equal(priorities.length, 1);
  assert.equal(priorities[0].id, "healthy_baseline");
});

// ─── buildTeamIntelligenceEvidence – dinamika-provenance ─────────────────────

test("dynamics evidence: purely estimated edges stay self-sourced, low confidence", () => {
  const evidence = buildTeamIntelligenceEvidence({
    assessedCount: 4,
    totalCount: 4,
    dynamicsEdgeCount: 6,
    measuredDynamicsEdgeCount: 0,
    locale: "en",
  });

  assert.equal(evidence.dynamics.source, "self");
  assert.equal(evidence.dynamics.quality, "partial");
  assert.equal(evidence.dynamics.confidence, "low");
});

test("dynamics evidence: measured trust edges raise source and confidence", () => {
  const evidence = buildTeamIntelligenceEvidence({
    assessedCount: 4,
    totalCount: 4,
    dynamicsEdgeCount: 6,
    measuredDynamicsEdgeCount: 2,
    locale: "en",
  });

  // A MÉRT él a BIZALMI KÖRBŐL jön (isMeasuredDynamicsSource), nem az
  // observer-körből. A korábbi `self_plus_observer` címke olyan forrást
  // állított, ami nem járult hozzá – a bemenet neve is ezt mondja
  // (measuredDynamicsEdgeCount, trust-él).
  assert.equal(evidence.dynamics.source, "self_plus_trust");
  assert.equal(evidence.dynamics.confidence, "medium");
});

test("dynamics evidence: observer-kör NEM állítható forrásként", () => {
  // Szerkezeti garancia: a dinamika-evidencia bemenetei közt egyáltalán
  // nincs observer-jel, tehát semmilyen kombináció nem termelhet observer
  // forrás-címkét. Ha valaha lesz observer-alapú dinamika, az ÚJ forrás-
  // értéket kap – ez a teszt akkor tudatosan frissítendő.
  for (const measured of [0, 1, 5]) {
    const evidence = buildTeamIntelligenceEvidence({
      assessedCount: 4,
      totalCount: 4,
      dynamicsEdgeCount: 6,
      measuredDynamicsEdgeCount: measured,
      locale: "en",
    });
    assert.notEqual(
      evidence.dynamics.source as string,
      "self_plus_observer",
      "a dinamika-nézet observer-evidenciát állít, ami nincs mögötte",
    );
  }
});

test("dynamics evidence: no edges at all → quality none", () => {
  const evidence = buildTeamIntelligenceEvidence({
    assessedCount: 4,
    totalCount: 4,
    dynamicsEdgeCount: 0,
    measuredDynamicsEdgeCount: 0,
    locale: "en",
  });

  assert.equal(evidence.dynamics.quality, "none");
  assert.equal(evidence.dynamics.confidence, "low");
});

// ─── canViewRawTeamResults (report gating, F1) ──────────────────────────────

test("raw team results are consultant-only", async () => {
  const { canViewRawTeamResults } = await import("@/lib/team-auth");
  assert.equal(canViewRawTeamResults("ORG_CONSULTANT"), true);
  assert.equal(canViewRawTeamResults("ORG_ADMIN"), false);
  assert.equal(canViewRawTeamResults("ORG_MANAGER"), false);
  assert.equal(canViewRawTeamResults("ORG_MEMBER"), false);
  assert.equal(canViewRawTeamResults(null), false);
});
