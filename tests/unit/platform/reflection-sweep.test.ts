import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  selectReflectionCandidates,
  REFLECTION_WINDOW_START_DAYS,
  REFLECTION_WINDOW_END_DAYS,
} from "@/lib/notifications/sweep";

const NOW = new Date("2026-08-04T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY);
}

function likert(dims: Record<string, number>) {
  return { type: "likert", dimensions: dims };
}

const DIMS = { H: 50, E: 50, X: 82, A: 50, C: 60, O: 40 };

describe("selectReflectionCandidates – 7–10 napos ablak", () => {
  it("az ablakban lévő legfrissebb eredmény jelölt, a legerősebb dimenzióval", () => {
    const candidates = selectReflectionCandidates(
      [{ userProfileId: "u1", createdAt: daysAgo(8), scores: likert(DIMS) }],
      NOW,
    );
    assert.equal(candidates.length, 1);
    assert.deepEqual(candidates[0], { userId: "u1", topDim: "X" });
  });

  it("ablakon kívül (túl friss vagy túl régi) nem jelölt", () => {
    const candidates = selectReflectionCandidates(
      [
        { userProfileId: "fresh", createdAt: daysAgo(REFLECTION_WINDOW_START_DAYS - 1), scores: likert(DIMS) },
        { userProfileId: "old", createdAt: daysAgo(REFLECTION_WINDOW_END_DAYS + 1), scores: likert(DIMS) },
      ],
      NOW,
    );
    assert.deepEqual(candidates, []);
  });

  it("újrakitöltés kiüti az ablakot: a legfrissebb (friss) sor számít, nem a régi", () => {
    // A bemenet userenként MÁR a legfrissebb sor — ha az friss, nincs jelölés.
    const candidates = selectReflectionCandidates(
      [{ userProfileId: "u1", createdAt: daysAgo(2), scores: likert(DIMS) }],
      NOW,
    );
    assert.deepEqual(candidates, []);
  });

  it("anonimizált (null userProfileId) és nem-likert sorokat kihagyja", () => {
    const candidates = selectReflectionCandidates(
      [
        { userProfileId: null, createdAt: daysAgo(8), scores: likert(DIMS) },
        { userProfileId: "u2", createdAt: daysAgo(8), scores: { type: "other" } },
        { userProfileId: "u3", createdAt: daysAgo(8), scores: null },
      ],
      NOW,
    );
    assert.deepEqual(candidates, []);
  });

  it("ismeretlen dimenziókulcsokat kiszűr a top-dim választásból", () => {
    const candidates = selectReflectionCandidates(
      [
        {
          userProfileId: "u1",
          createdAt: daysAgo(9),
          scores: likert({ FOO: 99, C: 70, O: 30 }),
        },
      ],
      NOW,
    );
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].topDim, "C");
  });
});
