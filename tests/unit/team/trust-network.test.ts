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

describe("computeTrustNetwork – élek", () => {
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

  it("withholds a one-directional edge from identified output", () => {
    const net = computeTrustNetwork([obs("u1", "u2", answersAt("max"))]);
    assert.equal(net.edges.length, 0);
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

describe("computeTrustNetwork – csomópontok, hub, izolált", () => {
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

  it("flags an unembedded member only with 3+ raters and mutual weak edges", () => {
    const weak = answersAt("min");
    const strong = answersAt("max");
    const net = computeTrustNetwork(
      [
        // u4 mindenkivel gyenge, a többiek egymással erősek
        obs("u1", "u4", weak), obs("u4", "u1", weak),
        obs("u2", "u4", weak), obs("u4", "u2", weak),
        obs("u3", "u4", weak), obs("u4", "u3", weak),
        obs("u1", "u2", strong), obs("u2", "u1", strong),
      ],
      ["u1", "u2", "u3", "u4"],
    );
    assert.deepEqual(net.isolatedUserIds, ["u4"]);
  });

  it("does not flag isolation from a single measured edge", () => {
    const net = computeTrustNetwork([obs("u1", "u2", answersAt("min"))]);
    assert.deepEqual(net.isolatedUserIds, []);
  });
});

// ── Befelé evidenciált hub/beágyazatlan (kifelé-él támadás elleni védelem) ──
// A hub- és beágyazatlan-jelölés csak olyan élből számolható, amiben a
// csomópontról VAN bejövő evidencia (kölcsönös él, vagy egyoldalú él az
// értékelt oldalán). A csak-kifelé él a SAJÁT kiosztott értékelése — abból
// róla nem állítható semmi.

describe("computeTrustNetwork – befelé evidenciált hub/beágyazatlan", () => {
  it("regresszió: két szigorú KIFELÉ értékelés nem bélyegzi az értékelőt beágyazatlan tagnak", () => {
    // "attacker" két csapattársat értékel mélyre, őt senki — a régi logika
    // a 2 (csak-kifelé) gyenge éle alapján névvel „beágyazatlan tagként"
    // tette volna a publikált riportba.
    const net = computeTrustNetwork(
      [
        obs("attacker", "u2", answersAt("min")),
        obs("attacker", "u3", answersAt("min")),
        obs("u2", "u3", answersAt("max")),
        obs("u3", "u2", answersAt("max")),
      ],
      ["attacker", "u2", "u3"],
    );
    assert.deepEqual(net.isolatedUserIds, []);
  });

  it("regresszió: két magas KIFELÉ értékelés nem teszi az értékelőt hubbá", () => {
    const net = computeTrustNetwork(
      [obs("rater", "u2", answersAt("max")), obs("rater", "u3", answersAt("max"))],
      ["rater", "u2", "u3"],
    );
    assert.deepEqual(net.hubUserIds, []);
    assert.equal(net.nodes.find((n) => n.userId === "rater")?.strongEdgeCount, 0);
  });

  it("egyoldalú bejövő élek nem szivárogtatnak személyszintű minősítést", () => {
    const net = computeTrustNetwork(
      [
        obs("u1", "u4", answersAt("min")),
        obs("u2", "u4", answersAt("min")),
        obs("u1", "u2", answersAt("max")),
        obs("u2", "u1", answersAt("max")),
      ],
      ["u1", "u2", "u4"],
    );
    assert.deepEqual(net.isolatedUserIds, []);
  });

  it("egyoldalú erős élek sem képeznek azonosítható hub-minősítést", () => {
    // u1-et hárman értékelik erősre — u1 hub; az értékelők kifelé-élei
    // nekik nem adnak erős-él-fokot.
    const net = computeTrustNetwork(
      [
        obs("u2", "u1", answersAt("max")),
        obs("u3", "u1", answersAt("max")),
        obs("u4", "u1", answersAt("max")),
      ],
      ["u1", "u2", "u3", "u4"],
    );
    assert.deepEqual(net.hubUserIds, []);
    assert.equal(net.nodes.find((n) => n.userId === "u2")?.strongEdgeCount, 0);
  });
});

// ── FIX 4: kilépett tagok megfigyelései nem szennyezik a hálót ──────────────

describe("computeTrustNetwork – kilépett tagok szűrése", () => {
  const strong = () => answersAt("max");
  const weak = () => answersAt("min");

  it("kilépett tag párjai kiesnek: él-szám, erős-él-szám, hub és inbound nem duzzad", () => {
    // "gone" mindenkivel erős párt hagyott hátra; a jelenlegi tagok közt
    // csak u1–u2 él. Szűrés nélkül u1/u2 2-2 erős éllel hub lenne, és az
    // inbound-számokba a kilépett értékelése is beszámítana.
    const net = computeTrustNetwork(
      [
        obs("gone", "u1", strong()), obs("u1", "gone", strong()),
        obs("gone", "u2", strong()), obs("u2", "gone", strong()),
        obs("gone", "u3", strong()), obs("u3", "gone", strong()),
        obs("u1", "u2", strong()), obs("u2", "u1", strong()),
      ],
      ["u1", "u2", "u3"],
    );
    assert.equal(net.edges.length, 1);
    assert.deepEqual([net.edges[0].a, net.edges[0].b], ["u1", "u2"]);
    const current = new Set(["u1", "u2", "u3"]);
    assert.ok(net.edges.every((e) => current.has(e.a) && current.has(e.b)));
    assert.equal(net.nodes.find((n) => n.userId === "gone"), undefined);
    // u1 erős élei: csak u2 (a gone-pár nem számít) → nincs hub (min. 2 kell).
    assert.equal(net.nodes.find((n) => n.userId === "u1")?.strongEdgeCount, 1);
    assert.deepEqual(net.hubUserIds, []);
    // u1 inbound: csak u2 értékelése — a kilépetté nem.
    assert.equal(net.nodes.find((n) => n.userId === "u1")?.inboundCount, 1);
    assert.equal(net.measuredPairCount, 1);
  });

  it("lefedettség 100% felett nem lehet – kilépett-párok az élszámot sem növelik", () => {
    // 2 jelenlegi tag → 1 lehetséges pár; a kilépettel együtt 3 megfigyelt
    // pár maradt hátra. Szűrés nélkül a lefedettség 3/1 = 300% lenne.
    const net = computeTrustNetwork(
      [
        obs("u1", "u2", strong()),
        obs("u2", "u1", strong()),
        obs("u1", "gone", strong()),
        obs("u2", "gone", strong()),
        obs("gone", "u1", strong()),
      ],
      ["u1", "u2"],
    );
    assert.equal(net.possiblePairCount, 1);
    assert.equal(net.measuredPairCount, 1);
    assert.equal(net.coverage, 1);
    assert.ok((net.coverage ?? 0) <= 1, "a lefedettség 100% fölé ment");
  });

  it("kilépett tagok gyenge élei nem jelölnek beágyazatlan (isolated) tagot", () => {
    // u3-nak csak két kilépetthez volt (gyenge) éle — szűrés nélkül
    // „2+ mért él, mind gyenge" alapon tévesen beágyazatlannak látszana.
    const net = computeTrustNetwork(
      [
        obs("u3", "gone1", weak()), obs("gone1", "u3", weak()),
        obs("u3", "gone2", weak()), obs("gone2", "u3", weak()),
        obs("u1", "u2", strong()), obs("u2", "u1", strong()),
      ],
      ["u1", "u2", "u3"],
    );
    assert.deepEqual(net.isolatedUserIds, []);
  });

  it("taglista nélkül a szűrés nem fut (a hívó felel a scope-ért) – kompatibilitás", () => {
    const net = computeTrustNetwork([
      obs("x", "y", strong()),
      obs("y", "x", strong()),
    ]);
    assert.equal(net.edges.length, 1);
    assert.equal(net.coverage, null);
  });
});

describe("lépés-ütemezési kapu (isStepGateOpen / isStepOpenFor)", () => {
  it("gate: missing or past nextStepOpensAt is open, future is closed", async () => {
    const { isStepGateOpen } = await import("@/lib/campaign-steps-core");
    const now = new Date("2026-07-21T12:00:00Z");
    assert.equal(isStepGateOpen({}, now), true);
    assert.equal(isStepGateOpen({ nextStepOpensAt: null }, now), true);
    assert.equal(
      isStepGateOpen({ nextStepOpensAt: "2026-07-21T11:00:00Z" }, now),
      true,
    );
    assert.equal(
      isStepGateOpen({ nextStepOpensAt: "2026-07-21T13:00:00Z" }, now),
      false,
    );
    assert.equal(
      isStepGateOpen({ nextStepOpensAt: new Date("2026-07-22T00:00:00Z") }, now),
      false,
    );
  });

  it("isStepOpenFor respects the schedule gate", async () => {
    const { isStepOpenFor } = await import("@/lib/campaign-steps-core");
    const camp = { type: "OBSERVER_360", steps: ["OBSERVER_360", "PSYCH_SAFETY"] };
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    assert.equal(
      isStepOpenFor(camp, { currentStep: 1, nextStepOpensAt: future }, "PSYCH_SAFETY"),
      false,
    );
    assert.equal(
      isStepOpenFor(camp, { currentStep: 1, nextStepOpensAt: past }, "PSYCH_SAFETY"),
      true,
    );
    // régi hívó (mező nélkül) — visszafelé kompatibilis: nyitott
    assert.equal(isStepOpenFor(camp, { currentStep: 1 }, "PSYCH_SAFETY"), true);
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
