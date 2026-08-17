import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTeamReportComparisonBasis,
  teamReportContributorKey,
} from "@/lib/team-report-composition";

test("a közreműködő-kulcs stabil, csapat-specifikus és nem tartalmaz user ID-t", () => {
  const first = teamReportContributorKey("team-a", "user-secret-id");
  const again = teamReportContributorKey("team-a", "user-secret-id");
  const otherTeam = teamReportContributorKey("team-b", "user-secret-id");

  assert.equal(first, again);
  assert.notEqual(first, otherTeam);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(first.includes("user-secret-id"), false);
});

test("a comparison basis csak a hat véges dimenziót tartja meg és rendezett", () => {
  const basis = buildTeamReportComparisonBasis("team-a", [
    { userId: "user-2", scores: { H: 60, E: Number.NaN, EXTRA: 99 } },
    { userId: "user-1", scores: { H: 50, C: 70 } },
    { userId: "empty", scores: null },
  ]);

  assert.equal(basis.version, 1);
  assert.equal(basis.contributors.length, 2);
  assert.deepEqual(
    basis.contributors.map((item) => item.key),
    [...basis.contributors.map((item) => item.key)].sort(),
  );
  const dimensions = basis.contributors.map((item) => item.dimensions);
  assert.equal(dimensions.some((item) => "EXTRA" in item), false);
  assert.equal(dimensions.some((item) => "E" in item), false);
});
