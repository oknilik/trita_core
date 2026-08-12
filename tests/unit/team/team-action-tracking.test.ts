import assert from "node:assert/strict";
import test from "node:test";
import { actionStatus, summarizeTeamActions } from "../../../src/lib/team-action-tracking";
import type { TeamReportActionItem } from "../../../src/lib/team-report";

const actions: TeamReportActionItem[] = [
  { title: "Kész", description: "", timeframe: "30", status: "done", dueDate: "2026-08-01" },
  { title: "Elakadt", description: "", timeframe: "30", status: "blocked", dueDate: "2026-08-11" },
  { title: "Heti", description: "", timeframe: "60", status: "in_progress", dueDate: "2026-08-17" },
  { title: "Későbbi", description: "", timeframe: "90", dueDate: "2026-09-01" },
];

test("missing action status remains backward-compatible as not started", () => {
  assert.equal(actionStatus(actions[3]), "not_started");
});

test("weekly summary separates blockers, overdue and due-soon actions", () => {
  assert.deepEqual(summarizeTeamActions(actions, "2026-08-12"), {
    total: 4,
    done: 1,
    inProgress: 1,
    blocked: 1,
    overdue: 1,
    dueSoon: 1,
  });
});
