import type { SerializedTeamReport } from "../../src/lib/team-report";
import { calculateOperatingStyle } from "../../src/lib/team-operating-style/scoring";
import { AXES, ITEMS, OPERATING_STYLE_VERSION } from "../../src/lib/team-operating-style/questions";
import { snapshotComposition, compareTeamPatterns } from "../../src/lib/team-operating-style/comparison";
import { calculateTeamPattern } from "../../src/lib/team-pattern";

/** Synthetic QA data only; never stored as a team's measurement. */
export function makeReaderReport(mismatchedCohorts = false): SerializedTeamReport {
  const ids = ["a", "b", "c", "d", "e"];
  const operating = { ...calculateOperatingStyle({ teamId: "team_reader", roundId: "round_reader", instrumentVersion: OPERATING_STYLE_VERSION,
    eligibleRespondentIds: ids,
    responses: ids.map((respondentId) => ({ respondentId, answers: Object.fromEntries(ITEMS.map((q) => [q.id,
      mismatchedCohorts ? q.axis === "execution" && respondentId === "e" ? null : 3 : q.pole === "left" ? 5 : 1,
    ])) })),
  }), referenceStart: "2026-08-19", referenceEnd: "2026-09-16" };
  const composition = snapshotComposition(calculateTeamPattern(ids.map((userId) => ({ userId, scores: { H: 62, A: 62, X: 56.4, C: 66.4, O: 68, E: 50 } }))));
  if (mismatchedCohorts) {
    // Screenshot-shaped aggregate values for layout QA; cohort gates come from scoring above.
    const means = [49.2, 48.8, 55, 52.1];
    const sds = [9, 10.8, 16, 16.1];
    AXES.forEach((axis, index) => { operating.axes[axis].mean = means[index]; operating.axes[axis].sd = sds[index]; });
    if (composition) [15.2, 11.4, 17.3, 15.4].forEach((sd, index) => { composition.axes[(["drive", "cohesion", "discipline", "openness"] as const)[index]].sd = sd; });
  }
  return {
    id: "report_reader", teamId: "team_reader", status: "PUBLISHED", title: "Termékfejlesztés · bemutatóadat",
    publishedAt: "2026-09-17T08:00:00Z", createdAt: "2026-09-17T08:00:00Z", updatedAt: "2026-09-17T08:00:00Z",
    summary: null, strengths: null, risks: null, recommendations: null, interviewFindings: null,
    leadershipGuide: null, internalNotes: "Private consultant note", translationsEn: null, actionItems: null,
    aggregates: {
      generatedAt: "2026-09-17T08:00:00Z", memberCount: 5, completedCount: 5, completionPct: 100,
      teamStyle: { version: 1, operating, composition, sameRespondents: true, comparison: compareTeamPatterns(operating, composition) },
      dimensionAverages: null, dimensionSpread: null, roleDistribution: null, roleGaps: null,
      evidence: null, dynamics: null, pattern: null,
    },
  };
}
