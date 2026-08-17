import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PILOT_NORM_MIN_N,
  pilotNormActivationBlockers,
} from "../../../scripts/research/norm-activation";

describe("pilotNormActivationBlockers", () => {
  it("csak scope-olt, dokumentált, rövid formás, legalább 200 fős kohorszt enged", () => {
    assert.deepEqual(
      pilotNormActivationBlockers({
        campaignCount: 15,
        form: "short",
        sourceLabel: "Trita magyar pilotkohorsz, 2026",
        n: PILOT_NORM_MIN_N,
        invalidSdCodes: [],
      }),
      [],
    );
  });

  it("scope, forrás, forma, n és szórás hibáján egyszerre fail-closed", () => {
    const blockers = pilotNormActivationBlockers({
      campaignCount: 0,
      form: null,
      sourceLabel: " ",
      n: 199,
      invalidSdCodes: ["O"],
    });
    assert.equal(blockers.length, 5);
    assert.ok(blockers.some((item) => item.includes("kampány")));
    assert.ok(blockers.some((item) => item.includes("--form=short")));
    assert.ok(blockers.some((item) => item.includes("--source")));
    assert.ok(blockers.some((item) => item.includes("minimum 200")));
    assert.ok(blockers.some((item) => item.includes("O")));
  });
});

