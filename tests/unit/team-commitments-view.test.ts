import assert from "node:assert/strict";
import test from "node:test";
import type { TeamCommitment } from "../../src/lib/team-commitments";
import { commitmentAttention, commitmentCalendarDate, sortCommitments } from "../../src/lib/team-commitments-view";

const base: TeamCommitment = {
  id: "one", title: "A shared step", description: "", nextStep: "", successCriteria: "",
  ownerUserId: "member", ownerName: "Anna", dueDate: "2026-09-12", status: "in_progress",
  latestNote: null, targetMetric: null, sourceReportId: null, sourceReportTitle: null,
  createdAt: "2026-09-01T12:00:00Z", updatedAt: "2026-09-10T12:00:00Z", version: 1, events: [],
};

test("attention preserves overlapping reasons without duplicating items", () => {
  const blocked = { ...base, id: "blocked", status: "blocked" as const, dueDate: "2026-09-01", ownerUserId: null, updatedAt: "2026-09-01T12:00:00Z" };
  assert.deepEqual(commitmentAttention(blocked, "2026-09-11"), ["blocked", "overdue", "unassigned", "stale"]);
  assert.equal(sortCommitments([base, blocked], "2026-09-11").length, 2);
  assert.equal(sortCommitments([base, blocked], "2026-09-11")[0].id, "blocked");
});

test("legacy owner names never count as linked owners and completed commitments need no attention", () => {
  assert.deepEqual(commitmentAttention({ ...base, ownerUserId: null }, "2026-09-11"), ["unassigned"]);
  assert.deepEqual(commitmentAttention({ ...base, status: "done", ownerUserId: null, dueDate: "2026-08-01", updatedAt: "2026-08-01T12:00:00Z" }, "2026-09-11"), []);
});

test("a due date today is not overdue; stale begins after seven calendar days", () => {
  const sevenDaysAgo = new Date(2026, 8, 4, 0, 15);
  assert.deepEqual(commitmentAttention({ ...base, dueDate: "2026-09-11", updatedAt: sevenDaysAgo.toISOString() }, "2026-09-11"), []);
  assert.deepEqual(commitmentAttention({ ...base, updatedAt: new Date(2026, 8, 3, 23, 55).toISOString() }, "2026-09-11"), ["stale"]);
  assert.equal(commitmentCalendarDate(new Date(2026, 8, 11, 0, 15)), "2026-09-11");
});

test("sort gives help, passed date, assignment and stale attention precedence without mutating input", () => {
  const items: TeamCommitment[] = [
    { ...base, id: "planned", status: "not_started" },
    { ...base, id: "stale", updatedAt: "2026-08-01T12:00:00Z" },
    { ...base, id: "unassigned", ownerUserId: null },
    { ...base, id: "overdue", dueDate: "2026-09-10" },
    { ...base, id: "blocked", status: "blocked" },
    { ...base, id: "progress" },
  ];
  assert.deepEqual(sortCommitments(items, "2026-09-11").map((item) => item.id), ["blocked", "overdue", "unassigned", "stale", "progress", "planned"]);
  assert.equal(items[0].id, "planned");
});
