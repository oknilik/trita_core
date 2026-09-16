import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AXES, ITEMS, OPERATING_STYLE_VERSION } from "@/lib/team-operating-style/questions";
import { OPERATING_PATTERNS } from "@/lib/team-operating-style/patterns";
import { calculateOperatingStyle, type OperatingAnswers, type OperatingInput } from "@/lib/team-operating-style/scoring";
import { buildOperatingStyleReport, type ReviewedReflection } from "@/lib/team-operating-style/report";
import { calculateTeamPattern } from "@/lib/team-pattern";

function answers(code = "0000"): OperatingAnswers {
  return Object.fromEntries(ITEMS.map((item) => [item.id,
    (code[AXES.indexOf(item.axis)] === "0") === (item.pole === "left") ? 5 : 1]));
}
function input(rows: OperatingAnswers[] = [answers(), answers(), answers()], eligible = rows.length): OperatingInput {
  return { teamId: "team-1", roundId: "round-1", instrumentVersion: OPERATING_STYLE_VERSION,
    eligibleRespondentIds: Array.from({ length: eligible }, (_, i) => `member-${i}`),
    responses: rows.map((a, i) => ({ respondentId: `member-${i}`, answers: a })) };
}
function uniform(value: number): OperatingAnswers { return Object.fromEntries(ITEMS.map((q) => [q.id, value])); }
function composition() {
  return { teamId: "team-1", snapshotId: "snapshot-1", result: calculateTeamPattern(
    Array.from({ length: 3 }, (_, i) => ({ userId: `private-id-${i}`, scores: { H: 70, E: 50, X: 70, A: 70, C: 70, O: 70 } })),
  )! };
}

describe("Team Operating Style pilot scoring", () => {
  it("has 24 unique bilingual items and three items for each pole of each construct", () => {
    assert.equal(new Set(ITEMS.map((q) => q.id)).size, 24);
    for (const axis of AXES) for (const pole of ["left", "right"]) {
      assert.equal(ITEMS.filter((q) => q.axis === axis && q.pole === pole).length, 3);
    }
    for (const q of ITEMS) assert.ok(q.text.hu && q.text.en);
    assert.equal(new Set(Object.values(OPERATING_PATTERNS).map((p) => p.hu)).size, 16);
  });
  it("resolves all 16 combinations independently of the personality model", () => {
    for (const code of Object.keys(OPERATING_PATTERNS)) {
      const result = calculateOperatingStyle(input([answers(code), answers(code), answers(code)]));
      assert.equal(result.pattern?.code, code);
      assert.equal(result.pattern?.status, "descriptive");
      for (const [i, axis] of AXES.entries()) {
        assert.equal(result.axes[axis].mean, code[i] === "0" ? 0 : 100);
        assert.equal(result.axes[axis].sd, 0);
      }
    }
  });
  it("computes sample SD across people, not items: 0, 50, 100 -> mean 50, SD 50", () => {
    const r = calculateOperatingStyle(input([answers(), uniform(3), answers("1111")]));
    assert.equal(r.axes.information.mean, 50);
    assert.equal(r.axes.information.sd, 50);
    assert.ok(r.axes.information.flags.includes("disagreement"));
    assert.equal(r.pattern?.status, "tentative");
    assert.equal(r.pattern?.alternativeCodes.length, 15);
  });
  it("distinguishes shared middle from disagreement despite identical means", () => {
    const middle = calculateOperatingStyle(input([uniform(3), uniform(3), uniform(3)]));
    assert.equal(middle.axes.information.mean, 50);
    assert.equal(middle.axes.information.sd, 0);
    assert.equal(middle.axes.information.pole, "mixed");
    assert.equal(middle.pattern?.status, "tentative");
  });
  it("does not classify both-frequent or neither-frequent responses", () => {
    for (const value of [1, 5]) {
      const r = calculateOperatingStyle(input([uniform(value), uniform(value), uniform(value)]));
      assert.equal(r.pattern, null);
      assert.equal(r.axes.information.mean, 50);
      assert.ok(r.axes.information.flags.includes(value === 1 ? "neither_frequent" : "both_frequent"));
    }
  });
  it("suppresses numerical output for fewer than three respondents", () => {
    for (const n of [0, 1, 2]) {
      const r = calculateOperatingStyle(input(Array.from({ length: n }, () => answers())));
      assert.equal(r.pattern, null);
      for (const axis of AXES) {
        assert.equal(r.axes[axis].mean, null);
        assert.equal(r.axes[axis].sd, null);
      }
    }
  });
  it("uses eligible roster, not response count, as coverage denominator", () => {
    const rows = [answers(), answers(), answers()];
    assert.ok(calculateOperatingStyle(input(rows, 5)).pattern);
    const r = calculateOperatingStyle(input(rows, 6));
    assert.equal(r.axes.information.coverage, 0.5);
    assert.equal(r.axes.information.mean, 0);
    assert.equal(r.pattern, null);
  });
  it("uses five of six items with equal pole and member weights", () => {
    const a = { ...answers(), INF1: null, INF2: 3 };
    const r = calculateOperatingStyle(input([a, a, a]));
    assert.ok(Math.abs(r.axes.information.mean! - 100 / 12) < 1e-10);
    assert.equal(r.axes.information.n, 3);
  });
  it("treats null and omitted values as missing, never as neutral", () => {
    const a = answers();
    a.INF1 = null;
    delete a.INF3;
    const r = calculateOperatingStyle(input([a, a, a]));
    assert.equal(r.axes.information.n, 0);
    assert.equal(r.axes.information.mean, null);
    assert.equal(r.axes.execution.n, 3);
    assert.equal(r.pattern, null);
  });
  it("refuses a synthetic pattern composed of different respondent cohorts", () => {
    const rows = [answers(), answers(), answers(), answers()];
    rows[0].INF1 = rows[0].INF3 = null;
    rows[1].COO1 = rows[1].COO3 = null;
    const r = calculateOperatingStyle(input(rows));
    assert.equal(r.axes.information.n, 3);
    assert.equal(r.axes.coordination.n, 3);
    assert.equal(r.pattern, null);
    assert.equal(r.patternUnavailableReason, "different_cohorts");
  });
  it("rejects invalid answers, unknown items and unsupported versions", () => {
    for (const v of [0, 6, 2.5, NaN, Infinity, "3"]) {
      const data = input();
      data.responses[0].answers.INF1 = v as number;
      assert.throws(() => calculateOperatingStyle(data));
    }
    const extra = input(); extra.responses[0].answers.UNKNOWN = 3;
    assert.throws(() => calculateOperatingStyle(extra));
    assert.throws(() => calculateOperatingStyle({ ...input(), instrumentVersion: "old" } as unknown as OperatingInput));
  });
  it("rejects duplicate roster entries, duplicate responses and outsiders", () => {
    const a = input(); a.eligibleRespondentIds.push(a.eligibleRespondentIds[0]);
    assert.throws(() => calculateOperatingStyle(a), /DUPLICATE_ELIGIBLE/);
    const b = input(); b.responses.push(b.responses[0]);
    assert.throws(() => calculateOperatingStyle(b), /DUPLICATE_RESPONSE/);
    const c = input(); c.responses[0].respondentId = "outsider";
    assert.throws(() => calculateOperatingStyle(c), /INELIGIBLE/);
  });
  it("does not mutate inputs or expose respondent IDs or raw answers", () => {
    const data = input(); const before = structuredClone(data);
    const json = JSON.stringify(calculateOperatingStyle(data));
    assert.deepEqual(data, before);
    assert.doesNotMatch(json, /member-0|respondentId|INF1|answers/);
  });
  it("includes both neutral-band boundaries", () => {
    // left mean=3, right mean=3.5 from two valid right items: score=56.25.
    const a = uniform(3); a.INF2 = 4; a.INF6 = null;
    const r = calculateOperatingStyle(input([a, a, a]));
    assert.equal(r.axes.information.mean, 56.25);
    assert.equal(r.axes.information.pole, "mixed");
    const b = uniform(3); b.INF1 = 4; b.INF5 = null;
    assert.equal(calculateOperatingStyle(input([b, b, b])).axes.information.pole, "mixed");
  });
});

describe("Team Operating Style report contract", () => {
  it("orders operating style, composition, reflections and preserves the legacy model", () => {
    const c = composition(), before = structuredClone(c);
    const r = buildOperatingStyleReport({ operating: input(), composition: c });
    assert.deepEqual(r.sections.map((s) => s.kind), ["operatingStyle", "composition", "reflections"]);
    assert.deepEqual(c, before);
    assert.equal(r.sections[1].data?.axes.drive.mean, 70);
    assert.deepEqual(r.sections[2].data, []);
    assert.doesNotMatch(JSON.stringify(r), /private-id|styleDistances|member-0|respondentId/);
    c.result.axes.drive.value = 0;
    assert.equal(r.sections[1].data?.axes.drive.mean, 70);
  });
  it("allows missing composition without inventing it from operating scores", () => {
    const r = buildOperatingStyleReport({ operating: input(), composition: null });
    assert.equal(r.sections[1].data, null);
    assert.deepEqual(r.sections[2].data, []);
  });
  const reflection: ReviewedReflection = {
    teamId: "team-1", roundId: "round-1", compositionSnapshotId: "snapshot-1",
    operatingAxis: "execution", compositionAxis: "openness", kind: "possible_tension",
    statement: "Megbeszélendő eltérés.", observedExample: "A workshopon bemutatott munkamenet.",
    discussionQuestion: "Mikor segít a rögzített sorrend?", reviewed: true,
  };
  it("accepts reviewed, source-bound discussion hypotheses", () => {
    const r = buildOperatingStyleReport({ operating: input(), composition: composition(), reflections: [reflection] });
    assert.equal(r.sections[2].data[0].kind, "possible_tension");
    assert.equal(r.sections[2].evidenceStatus, "discussion_hypotheses");
  });
  it("rejects cross-team, cross-round and cross-snapshot reflections", () => {
    for (const key of ["teamId", "roundId", "compositionSnapshotId"]) {
      assert.throws(() => buildOperatingStyleReport({ operating: input(), composition: composition(),
        reflections: [{ ...reflection, [key]: "other" }] }), /REFLECTION_SOURCE_MISMATCH/);
    }
    assert.throws(() => buildOperatingStyleReport({ operating: input(), composition: { ...composition(), teamId: "other" } }), /COMPOSITION_TEAM/);
  });
  it("requires actual observations, review and sufficient operating data", () => {
    assert.throws(() => buildOperatingStyleReport({ operating: input(), composition: composition(),
      reflections: [{ ...reflection, observedExample: "" }] }));
    assert.throws(() => buildOperatingStyleReport({ operating: input(), composition: composition(),
      reflections: [{ ...reflection, reviewed: false } as unknown as ReviewedReflection] }));
    assert.throws(() => buildOperatingStyleReport({ operating: input([answers(), answers()]), composition: composition(),
      reflections: [reflection] }), /INSUFFICIENT_DATA/);
    assert.throws(() => buildOperatingStyleReport({ operating: input(), composition: null,
      reflections: [reflection] }), /SOURCE_MISMATCH/);
  });
});
