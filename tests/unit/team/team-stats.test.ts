import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeTeamCompletionBuckets,
  mergeTrustEdges,
  type TeamDynamicsEdge,
} from "@/lib/team-stats";
import {
  computeTrustNetwork,
  TRUST_QUESTIONS,
  type TrustAnswerSet,
  type TrustEdge,
  type TrustNetwork,
} from "@/lib/trust-network";

function trustNet(edges: TrustEdge[]): TrustNetwork {
  return {
    edges,
    nodes: [],
    hubUserIds: [],
    isolatedUserIds: [],
    measuredPairCount: edges.length,
    possiblePairCount: null,
    coverage: null,
  };
}

function profileEdge(a: string, b: string): TeamDynamicsEdge {
  return {
    fromUserId: a,
    toUserId: b,
    type: "friction",
    source: "profile_estimate",
    relationshipType: null,
    confidence: null,
    dimensionDelta: 30,
    createdAt: "2026-08-10T00:00:00.000Z",
  };
}

describe("mergeTrustEdges — disconnected nem súrlódás (D2)", () => {
  it("a disconnected mért él a profil-becslést törli, NEM friction-né alakítja", () => {
    const merged = mergeTrustEdges(
      [profileEdge("u1", "u2")],
      trustNet([{ a: "u1", b: "u2", score: 10, type: "disconnected", mutual: true }]),
    );
    // A pár kimarad: a mérés felülírja a becslést, de a kapcsolat hiánya nem él.
    assert.equal(merged.length, 0);
    assert.equal(merged.filter((e) => e.type === "friction").length, 0);
  });

  it("profil-él nélküli disconnected mért él sem kerül be", () => {
    const merged = mergeTrustEdges(
      [],
      trustNet([{ a: "u1", b: "u2", score: 5, type: "disconnected", mutual: false }]),
    );
    assert.equal(merged.length, 0);
  });

  it("a mért él-típusok leképezése egyébként változatlan (strong/moderate/weak)", () => {
    const merged = mergeTrustEdges(
      [],
      trustNet([
        { a: "u1", b: "u2", score: 90, type: "strong_trust", mutual: true },
        { a: "u1", b: "u3", score: 60, type: "moderate", mutual: true },
        { a: "u2", b: "u3", score: 40, type: "weak_trust", mutual: false },
        { a: "u3", b: "u4", score: 8, type: "disconnected", mutual: true },
      ]),
    );
    const byPair = Object.fromEntries(
      merged.map((e) => [[e.fromUserId, e.toUserId].sort().join("|"), e.type]),
    );
    assert.equal(byPair["u1|u2"], "aligned");
    assert.equal(byPair["u1|u3"], "complementary");
    assert.equal(byPair["u2|u3"], "friction");
    // a disconnected pár kimaradt
    assert.equal(byPair["u3|u4"], undefined);
    assert.equal(merged.length, 3);
    // minden bekerült él mért forrású
    assert.ok(merged.every((e) => e.source === "trust_round"));
  });

  it("mért adat nélkül a profil-becslés érintetlenül marad", () => {
    const edges = [profileEdge("u1", "u2"), profileEdge("u1", "u3")];
    assert.equal(mergeTrustEdges(edges, null).length, 2);
    assert.equal(mergeTrustEdges(edges, trustNet([])).length, 2);
  });
});

// ── FIX 4: a kilépett tag hátrahagyott mért párja nem éri el a térképet ─────

describe("mergeTrustEdges — kilépett tag mért párjai (a szűrt trust-hálón át)", () => {
  const maxAnswers = (): TrustAnswerSet =>
    Object.fromEntries(TRUST_QUESTIONS.map((q) => [q.id, q.max]));

  it("a jelenlegi tag-halmazra szűrt trust-hálóból csak tag-tag él jön át a dinamika-élek közé", () => {
    const trust = computeTrustNetwork(
      [
        { raterUserId: "u1", aboutUserId: "gone", answers: maxAnswers() },
        { raterUserId: "gone", aboutUserId: "u1", answers: maxAnswers() },
        { raterUserId: "u1", aboutUserId: "u2", answers: maxAnswers() },
      ],
      ["u1", "u2"],
    );
    const merged = mergeTrustEdges([profileEdge("u1", "u2")], trust);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].source, "trust_round");
    const current = new Set(["u1", "u2"]);
    assert.ok(
      merged.every((e) => current.has(e.fromUserId) && current.has(e.toUserId)),
      "kilépett taghoz kötött él került a dinamika-térképre",
    );
  });
});

// ── FIX 8: kitöltés-vödrök — kész / folyamatban (vázlat) / vár ──────────────

describe("computeTeamCompletionBuckets", () => {
  it("folyamatban = vázlat eredmény nélkül; vár = se eredmény, se vázlat", () => {
    const buckets = computeTeamCompletionBuckets([
      { scores: { H: 50 }, hasDraft: false }, // kész
      { scores: null, hasDraft: true }, // folyamatban
      { scores: null, hasDraft: false }, // vár
      { scores: null, hasDraft: undefined }, // vár (kötegelt betöltő, nincs vázlat-adat)
    ]);
    assert.deepEqual(buckets, {
      completedCount: 1,
      inProgressCount: 1,
      waitingCount: 2,
    });
  });

  it("eredménnyel rendelkező tag ittmaradt vázlata nem duplázódik folyamatban-ba", () => {
    const buckets = computeTeamCompletionBuckets([
      { scores: { H: 62 }, hasDraft: true },
    ]);
    assert.deepEqual(buckets, {
      completedCount: 1,
      inProgressCount: 0,
      waitingCount: 0,
    });
  });

  it("regresszió: a 'vár' szegmens nem szerkezetileg 0 — a vázlat nélküli tag oda esik", () => {
    // A régi képlet (scores === null && joinedAt → folyamatban) minden
    // kitöltetlen tagot folyamatban-nak számolt, a waiting mindig 0 volt.
    const buckets = computeTeamCompletionBuckets([
      { scores: null, hasDraft: false },
      { scores: null, hasDraft: false },
    ]);
    assert.equal(buckets.waitingCount, 2);
    assert.equal(buckets.inProgressCount, 0);
  });
});
