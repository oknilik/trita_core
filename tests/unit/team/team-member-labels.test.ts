import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { relationshipEvidenceNote } from "@/lib/team-intelligence";
import { buildTeamMemberLabels } from "@/lib/team-member-labels";

describe("team network labels", () => {
  it("finds distinguishing tokens when every name shares an organization prefix", () => {
    const labels = buildTeamMemberLabels([
      { id: "a", name: "Aurora Kata" },
      { id: "b", name: "Aurora Bence" },
      { id: "c", name: "Aurora Márton" },
    ]);
    assert.deepEqual(labels, { a: "Kata", b: "Bence", c: "Márton" });
  });

  it("does not assume name order and falls back to full names for reused tokens", () => {
    assert.deepEqual(buildTeamMemberLabels([
      { id: "a", name: "Anna Nagy" },
      { id: "b", name: "Nagy Anna" },
    ]), { a: "Anna Nagy", b: "Nagy Anna" });
  });

  it("disambiguates identical and truncated names consistently across reordering", () => {
    const members = [
      { id: "b", name: "Kovács Anna" },
      { id: "a", name: "Kovács Anna" },
      { id: "c", name: "Nagyonhosszúszemélynévegy" },
      { id: "d", name: "Nagyonhosszúszemélynévkettő" },
    ];
    const labels = buildTeamMemberLabels(members);
    assert.equal(labels.a, "Kovács Anna · 1");
    assert.equal(labels.b, "Kovács Anna · 2");
    assert.equal(new Set(Object.values(labels)).size, members.length);
    assert.deepEqual(labels, buildTeamMemberLabels([...members].reverse()));
  });
});


describe("relationship evidence labels", () => {
  it("distinguishes measured, mixed, estimated and absent relationships", () => {
    assert.match(relationshipEvidenceNote(6, 6, "en"), /Every displayed connection/);
    assert.match(relationshipEvidenceNote(2, 6, "en"), /2\/6.*the rest are profile-based estimates/);
    assert.match(relationshipEvidenceNote(0, 6, "en"), /no measured relationship feedback/);
    assert.equal(relationshipEvidenceNote(0, 0, "en"), "No relationship data is available to display yet.");
  });
});
