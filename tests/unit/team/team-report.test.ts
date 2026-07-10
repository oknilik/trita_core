import test from "node:test";
import assert from "node:assert/strict";
import { serializeTeamReport } from "@/lib/team-report";

const baseRecord = {
  id: "rep_1",
  teamId: "team_1",
  status: "PUBLISHED",
  title: "Q3 csapatkép",
  aggregates: { memberCount: 5 },
  summary: "Összefoglaló",
  strengths: null,
  risks: null,
  recommendations: null,
  interviewFindings: "Interjú-tanulságok",
  internalNotes: "BIZALMAS tanácsadói jegyzet",
  publishedAt: new Date("2026-07-10T10:00:00Z"),
  createdAt: new Date("2026-07-09T10:00:00Z"),
  updatedAt: new Date("2026-07-10T10:00:00Z"),
};

test("internal notes are stripped for non-consultant serialization", () => {
  const serialized = serializeTeamReport(baseRecord, { includeInternalNotes: false });
  assert.equal(serialized.internalNotes, null);
  assert.equal(serialized.summary, "Összefoglaló");
  assert.equal(serialized.interviewFindings, "Interjú-tanulságok");
});

test("internal notes survive consultant serialization", () => {
  const serialized = serializeTeamReport(baseRecord, { includeInternalNotes: true });
  assert.equal(serialized.internalNotes, "BIZALMAS tanácsadói jegyzet");
});

test("unknown status normalizes to DRAFT", () => {
  const serialized = serializeTeamReport(
    { ...baseRecord, status: "weird" },
    { includeInternalNotes: false },
  );
  assert.equal(serialized.status, "DRAFT");
});
