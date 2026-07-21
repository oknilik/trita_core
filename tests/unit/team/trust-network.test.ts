import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  TRUST_QUESTIONS,
  TRUST_QUESTION_COUNT,
  TRUST_MIN_RATERS,
  isValidTrustAnswerSet,
  directedTrustScore,
  trustEdgeType,
  computeTrustNetwork,
  type TrustAnswerSet,
} from "@/lib/trust-network";

function answersAt(level: "max" | "min" | "mid"): TrustAnswerSet {
  return Object.fromEntries(
    TRUST_QUESTIONS.map((q) => [
      q.id,
      level === "max" ? q.max : level === "min" ? 1 : Math.ceil((1 + q.max) / 2),
    ]),
  );
}

function obs(rater: string, about: string, answers: TrustAnswerSet) {
  return { raterUserId: rater, aboutUserId: about, answers };
}

describe("trust instrument", () => {
  it("has 5 questions with unique ids, both locales and labeled endpoints", () => {
    assert.equal(TRUST_QUESTION_COUNT, 5);
    const ids = new Set(TRUST_QUESTIONS.map((q) => q.id));
    assert.equal(ids.size, 5);
    for (const q of TRUST_QUESTIONS) {
      assert.ok(q.text.hu.length > 10);
      assert.ok(q.text.en.length > 10);
      assert.ok(q.max === 3 || q.max === 5);
      assert.ok(q.options.length >= 2);
      for (const opt of q.options) {
        assert.ok(opt.value >= 1 && opt.value <= q.max);
        assert.ok(opt.hu.length > 0 && opt.en.length > 0);
      }
    }
  });

  it("validates answer sets: exact keys, integer range per question", () => {
    assert.equal(isValidTrustAnswerSet(answersAt("mid")), true);
    // hiányzó kulcs
    const partial = answersAt("mid");
    delete partial[TRUST_QUESTIONS[0].id];
    assert.equal(isValidTrustAnswerSet(partial), false);
    // skálán kívüli érték (3-fokú kérdésre 5)
    const threePoint = TRUST_QUESTIONS.find((q) => q.max === 3)!;
    assert.equal(
      isValidTrustAnswerSet({ ...answersAt("mid"), [threePoint.id]: 5 }),
      false,
    );
    // nem egész
    assert.equal(
      isValidTrustAnswerSet({ ...answersAt("mid"), [TRUST_QUESTIONS[0].id]: 2.5 }),
      false,
    );
    // extra kulcs
    assert.equal(isValidTrustAnswerSet({ ...answersAt("mid"), EXTRA: 3 }), false);
    assert.equal(isValidTrustAnswerSet(null), false);
    assert.equal(isValidTrustAnswerSet([answersAt("mid")]), false);
  });

  it("scores directed answers on a 0-100 scale", () => {
    assert.equal(directedTrustScore(answersAt("max")), 100);
    assert.equal(directedTrustScore(answersAt("min")), 0);
    const mid = directedTrustScore(answersAt("mid"));
    assert.ok(mid >= 40 && mid <= 60);
  });

  it("maps scores to edge types at documented thresholds", () => {
    assert.equal(trustEdgeType(75), "strong_trust");
    assert.equal(trustEdgeType(74), "moderate");
    assert.equal(trustEdgeType(55), "moderate");
    assert.equal(trustEdgeType(54), "weak_trust");
    assert.equal(trustEdgeType(35), "weak_trust");
    assert.equal(trustEdgeType(34), "disconnected");
  });
});

describe("computeTrustNetwork — élek", () => {
  it("averages both directions into one undirected, mutual edge", () => {
    const net = computeTrustNetwork([
      obs("u1", "u2", answersAt("max")),
      obs("u2", "u1", answersAt("min")),
    ]);
    assert.equal(net.edges.length, 1);
    const edge = net.edges[0];
    assert.deepEqual([edge.a, edge.b], ["u1", "u2"]);
    assert.equal(edge.score, 50);
    assert.equal(edge.mutual, true);
    assert.equal(edge.type, "weak_trust");
  });

  it("builds a one-directional edge as non-mutual", () => {
    const net = computeTrustNetwork([obs("u1", "u2", answersAt("max"))]);
    assert.equal(net.edges.length, 1);
    assert.equal(net.edges[0].mutual, false);
    assert.equal(net.edges[0].score, 100);
    assert.equal(net.edges[0].type, "strong_trust");
  });

  it("ignores invalid answer sets defensively", () => {
    const net = computeTrustNetwork([
      obs("u1", "u2", { broken: 1 } as TrustAnswerSet),
    ]);
    assert.equal(net.edges.length, 0);
  });

  it("reports coverage against the member list", () => {
    const net = computeTrustNetwork(
      [obs("u1", "u2", answersAt("max")), obs("u2", "u1", answersAt("max"))],
      ["u1", "u2", "u3"],
    );
    assert.equal(net.possiblePairCount, 3);
    assert.equal(net.measuredPairCount, 1);
    assert.ok(Math.abs((net.coverage ?? 0) - 1 / 3) < 0.01);
  });
});

describe("computeTrustNetwork — csomópontok, hub, izolált", () => {
  it("withholds inbound aggregate below the rater threshold", () => {
    const net = computeTrustNetwork([
      obs("u1", "u3", answersAt("max")),
      obs("u2", "u3", answersAt("max")),
    ]);
    const n3 = net.nodes.find((n) => n.userId === "u3")!;
    assert.equal(n3.inboundCount, 2);
    assert.ok(n3.inboundCount < TRUST_MIN_RATERS);
    assert.equal(n3.inboundMean, null);
  });

  it("aggregates inbound trust at or above the threshold", () => {
    const net = computeTrustNetwork([
      obs("u1", "u4", answersAt("max")),
      obs("u2", "u4", answersAt("max")),
      obs("u3", "u4", answersAt("min")),
    ]);
    const n4 = net.nodes.find((n) => n.userId === "u4")!;
    assert.equal(n4.inboundCount, 3);
    assert.equal(n4.inboundMean, 67);
  });

  it("identifies the hub as the member with the most strong edges (min. 2)", () => {
    // u1 mindenkivel erős; u2–u3, u2–u4, u3–u4 gyenge
    const strong = answersAt("max");
    const weak = answersAt("min");
    const net = computeTrustNetwork(
      [
        obs("u1", "u2", strong), obs("u2", "u1", strong),
        obs("u1", "u3", strong), obs("u3", "u1", strong),
        obs("u1", "u4", strong), obs("u4", "u1", strong),
        obs("u2", "u3", weak), obs("u3", "u2", weak),
        obs("u2", "u4", weak), obs("u4", "u2", weak),
        obs("u3", "u4", weak), obs("u4", "u3", weak),
      ],
      ["u1", "u2", "u3", "u4"],
    );
    assert.deepEqual(net.hubUserIds, ["u1"]);
    assert.equal(net.coverage, 1);
  });

  it("flags an unembedded member: 2+ measured edges, none reaching moderate", () => {
    const weak = answersAt("min");
    const strong = answersAt("max");
    const net = computeTrustNetwork(
      [
        // u4 mindenkivel gyenge, a többiek egymással erősek
        obs("u1", "u4", weak), obs("u4", "u1", weak),
        obs("u2", "u4", weak), obs("u4", "u2", weak),
        obs("u1", "u2", strong), obs("u2", "u1", strong),
      ],
      ["u1", "u2", "u4"],
    );
    assert.deepEqual(net.isolatedUserIds, ["u4"]);
  });

  it("does not flag isolation from a single measured edge", () => {
    const net = computeTrustNetwork([obs("u1", "u2", answersAt("min"))]);
    assert.deepEqual(net.isolatedUserIds, []);
  });
});

describe("kampánylépés-integráció (TRUST_360)", () => {
  it("normalizes TRUST_360 into canonical order between TEAM_ROLE_360 and PSYCH_SAFETY", async () => {
    const { normalizeCampaignSteps, CAMPAIGN_STEP_LABELS, CAMPAIGN_STEP_LINKS } =
      await import("@/lib/campaign-steps-core");
    assert.deepEqual(
      normalizeCampaignSteps(["PSYCH_SAFETY", "TRUST_360", "TEAM_ROLE_360"]),
      ["TEAM_ROLE_360", "TRUST_360", "PSYCH_SAFETY"],
    );
    assert.ok(CAMPAIGN_STEP_LABELS.TRUST_360.hu.length > 3);
    assert.ok(CAMPAIGN_STEP_LABELS.TRUST_360.en.length > 3);
    assert.equal(CAMPAIGN_STEP_LINKS.TRUST_360, "/assessment/trust");
  });
});
