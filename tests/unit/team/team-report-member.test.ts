import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildMemberReportViewModel,
  type MemberViewerInput,
} from "@/lib/team-report-member";
import type { SerializedTeamReport } from "@/lib/team-report";
import { resolveDisplayRoleScores } from "@/lib/team-role-estimate";
import { getTopRoles } from "@/lib/team-role-scoring";

// ── Fixtúrák ────────────────────────────────────────────────────────────────

function makeReport(
  overrides: Partial<SerializedTeamReport> = {},
): SerializedTeamReport {
  return {
    id: "rep_1",
    teamId: "team_1",
    status: "PUBLISHED",
    title: "Csapatkép",
    aggregates: {
      generatedAt: "2026-08-01T10:00:00Z",
      memberCount: 5,
      completedCount: 4,
      completionPct: 80,
      dimensionAverages: {
        H: 55, E: 50, X: 52, A: 48, C: 60, O: 45,
      },
      dimensionSpread: { H: 8, E: 6, X: 9, A: 7, C: 10, O: 5 },
      pattern: null,
      roleDistribution: {
        counts: { MV: 2, KE: 1 },
        secondaryCounts: {},
        questionnaireCount: 1,
        estimateCount: 3,
      },
      roleGaps: null,
      evidence: { quality: "partial", measuredEdgeCount: 0, estimatedEdgeCount: 6 },
      dynamics: null,
    },
    summary: null,
    strengths: null,
    risks: null,
    recommendations: null,
    interviewFindings: null,
    leadershipGuide: null,
    actionItems: null,
    internalNotes: null,
    translationsEn: null,
    publishedAt: "2026-08-01T10:00:00Z",
    createdAt: "2026-08-01T09:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
    ...overrides,
  };
}

const FULL_TRITAN = {
  H: 50, E: 50, X: 50, A: 50, C: 50, O: 50,
};

function viewer(overrides: Partial<MemberViewerInput> = {}): MemberViewerInput {
  return {
    displayName: "Teszt Tag",
    scores: { ...FULL_TRITAN },
    teamRoleScores: null,
    teamRoleSource: null,
    ...overrides,
  };
}

// ── roleSource a nézetmodellben (FIX 1) ─────────────────────────────────────

describe("buildMemberReportViewModel – szerep-forrás (mért vs becsült)", () => {
  it("kitöltött kérdőívnél roleSource = questionnaire, a mért top a szerep", () => {
    const vm = buildMemberReportViewModel(
      makeReport(),
      viewer({
        teamRoleSource: "questionnaire",
        teamRoleScores: { OG: 10, KE: 20, KO: 30, HA: 0, ER: 5, CS: 15, MV: 90, MI: 60, SZ: 25 },
      }),
      "hu",
    );
    assert.equal(vm.roleSource, "questionnaire");
    assert.equal(vm.primaryRole?.code, "MV");
    assert.equal(vm.secondaryRole?.code, "MI");
  });

  it("mért adat nélkül, teljes profilból roleSource = estimate – a nézetnek badge-elnie kell", () => {
    const vm = buildMemberReportViewModel(makeReport(), viewer(), "hu");
    assert.equal(vm.roleSource, "estimate");
    assert.ok(vm.primaryRole, "teljes profilból kell becsült szerep");
  });

  it("profil nélkül roleSource = null és nincs szerep", () => {
    const vm = buildMemberReportViewModel(
      makeReport(),
      viewer({ scores: null }),
      "hu",
    );
    assert.equal(vm.roleSource, null);
    assert.equal(vm.primaryRole, null);
    assert.equal(vm.secondaryRole, null);
  });

  it("részleges profilból nincs becslés (roleSource null) – nem gyártunk mért-kinézetű szerepet", () => {
    const vm = buildMemberReportViewModel(
      makeReport(),
      viewer({ scores: { H: 80, X: 20 } }),
      "hu",
    );
    assert.equal(vm.roleSource, null);
    assert.equal(vm.primaryRole, null);
  });
});

// ── exact holtverseny-evidencia (FIX 2a) ────────────────────────────────────

describe("buildMemberReportViewModel – S2: a kerekítetlen becslés-evidencia dönt", () => {
  // KE és HA súlyai úgy vannak belőve, hogy a kerekített pontjuk azonos
  // legyen, a kerekítetlen összegük viszont eltérjen — az elsődleges
  // szerepnek az exact szerint kell dőlnie, nem a hash-fallback szerint,
  // különben a tag-riport mást mutatna, mint a csapatszerep-tab.
  const P1 = { H: 50, E: 52, X: 90, A: 46, C: 50, O: 50 }; // KE 67,0 > HA 66,8
  const P2 = { H: 50, E: 52, X: 90, A: 45, C: 50, O: 50 }; // HA 67,1 > KE 66,8

  it("kerekítve azonos KE/HA-nál a magasabb kerekítetlen összegű az elsődleges (mindkét irányban)", () => {
    const vm1 = buildMemberReportViewModel(makeReport(), viewer({ scores: P1 }), "hu");
    assert.equal(vm1.primaryRole?.code, "KE");
    assert.equal(vm1.secondaryRole?.code, "HA");

    const vm2 = buildMemberReportViewModel(makeReport(), viewer({ scores: P2 }), "hu");
    assert.equal(vm2.primaryRole?.code, "HA");
    assert.equal(vm2.secondaryRole?.code, "KE");
  });

  it("a tag-riport elsődleges szerepe azonos a kanonikus (exact-tudatos) rangsorral – felület-konzisztencia", () => {
    for (const profile of [P1, P2]) {
      const vm = buildMemberReportViewModel(
        makeReport(),
        viewer({ scores: profile }),
        "hu",
      );
      const resolved = resolveDisplayRoleScores(null, profile);
      assert.ok(resolved);
      const canonical = getTopRoles(resolved.scores, 2, resolved.exact);
      assert.equal(vm.primaryRole?.code, canonical[0].role);
      assert.equal(vm.secondaryRole?.code, canonical[1].role);
    }
  });
});

// ── roleFit a befagyasztott eloszlásból (meglévő viselkedés őre) ────────────

describe("buildMemberReportViewModel – szerep-illeszkedés", () => {
  it("ritka szerep (≤1 elsődleges a csapatban) → rare, megosztott (≥2) → shared", () => {
    const measured = viewer({
      teamRoleSource: "questionnaire",
      teamRoleScores: { OG: 0, KE: 0, KO: 0, HA: 0, ER: 0, CS: 0, MV: 90, MI: 10, SZ: 0 },
    });
    const shared = buildMemberReportViewModel(makeReport(), measured, "hu");
    assert.equal(shared.primaryRole?.code, "MV");
    assert.equal(shared.roleFit, "shared"); // counts.MV = 2

    const rareReport = makeReport();
    rareReport.aggregates!.roleDistribution!.counts = { MV: 1, KE: 3 };
    const rare = buildMemberReportViewModel(rareReport, measured, "hu");
    assert.equal(rare.roleFit, "rare");
  });

  it("a pillanatképben nem szereplő néző szerepére nincs rare/shared állítás (FIX 11)", () => {
    // A befagyasztott eloszlásban a néző MV szerepe 0 darab — ez nem
    // különböztethető meg attól, hogy a néző nincs is benne a pillanatképben
    // (pl. később töltött ki). Ilyenkor nem állítunk illeszkedést.
    const measured = viewer({
      teamRoleSource: "questionnaire",
      teamRoleScores: { OG: 0, KE: 0, KO: 0, HA: 0, ER: 0, CS: 0, MV: 90, MI: 10, SZ: 0 },
    });
    const report = makeReport();
    report.aggregates!.roleDistribution!.counts = { KE: 3 };
    const vm = buildMemberReportViewModel(report, measured, "hu");
    assert.equal(vm.primaryRole?.code, "MV");
    assert.equal(vm.roleFit, null);
    assert.ok(!vm.tips.some((tip) => tip.includes("ritka")));
    assert.ok(!vm.tips.some((tip) => tip.includes("többen is viszitek")));
  });
});
