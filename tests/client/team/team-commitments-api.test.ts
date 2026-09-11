import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import type { SubscriptionCapabilityPolicyState } from "@/lib/capabilities";
import type { CommitmentFields } from "@/lib/team-commitments";

vi.mock("server-only", () => ({}));
const f = vi.hoisted(() => ({
  authId: "clerk-viewer" as string | null,
  viewerId: "viewer",
  orgRole: "ORG_MEMBER", teamRole: "manager" as string | null,
  policyState: "active" as SubscriptionCapabilityPolicyState,
  leftAt: null as Date | null, deleted: false, ownerValid: true,
  updateCount: 1, importCount: 1, planConflict: false,
  itemOwnerId: "viewer" as string | null,
  itemTeamId: "team", itemVersion: 2,
  readItems: vi.fn(), readPlan: vi.fn(), readReports: vi.fn(),
  create: vi.fn(), createMany: vi.fn(), update: vi.fn(), event: vi.fn(),
  planCreate: vi.fn(), planUpdate: vi.fn(), planEvent: vi.fn(), tx: vi.fn(), validateOwner: vi.fn(),
}));
vi.mock("@/lib/auth-server", () => ({ getServerAuth: async () => ({ userId: f.authId }) }));
vi.mock("@/lib/prisma", () => {
  const db = {
    userProfile: {
      findUnique: vi.fn(async () => ({ id: f.viewerId, deleted: f.deleted })),
      findMany: vi.fn(async () => [
        { id: "viewer", username: "Alex", deleted: false },
        { id: "email-user", username: "private@example.test", deleted: false },
        { id: "deleted-user", username: "Removed person", deleted: true },
      ]),
    },
    team: { findUnique: vi.fn(async () => ({ orgId: "org" })) },
    organizationMember: { findUnique: vi.fn(async () => ({ role: f.orgRole, leftAt: f.leftAt })) },
    teamMember: {
      findUnique: vi.fn(async () => f.teamRole ? ({ role: f.teamRole }) : null),
      findFirst: f.validateOwner,
      findMany: vi.fn(async () => [{ userId: "viewer", user: { username: "Alex", deleted: false } }]),
    },
    teamCommitment: {
      findMany: f.readItems,
      findFirst: vi.fn(async ({ where }: { where: { teamId: string; id: string } }) =>
        where.teamId === f.itemTeamId && where.id === "item" ? record() : null),
      findUniqueOrThrow: vi.fn(async () => record()),
      create: f.create,
      createMany: f.createMany,
      updateMany: f.update,
    },
    teamCommitmentEvent: { create: f.event },
    teamCommitmentPlan: { findUnique: f.readPlan, create: f.planCreate, updateMany: f.planUpdate },
    teamCommitmentPlanEvent: { create: f.planEvent },
    teamReport: { findMany: f.readReports },
    $transaction: f.tx,
    $queryRaw: vi.fn(async () => [{ id: "report" }]),
  };
  f.tx.mockImplementation(async (operation: (tx: typeof db) => Promise<unknown>) => operation(db));
  return { prisma: db };
});
vi.mock("@/lib/policy-service", async () => {
  const { getAccessPolicy } = await import("@/lib/policy-engine");
  return {
    resolveTeamPolicySnapshot: async () => {
      const subject = { isAuthenticated: true, orgRole: f.orgRole, teamRole: f.teamRole,
        membership: { orgId: "org", teamId: "team", hasOrgMembership: true, hasTeamMembership: f.teamRole !== null } };
      const policy = getAccessPolicy(subject, { activeOrgId: "org", activeTeamId: "team", capabilityPolicyState: f.policyState });
      return { subject, policy };
    },
    isPolicyReadOnly: (state: string) => !["active", "trialing"].includes(state),
    // Deliberately permissive rollout: the new feature must not use this grant.
    resolveOrgCapabilityDecision: () => ({ allowed: true }),
  };
});

import { GET, POST, PATCH } from "@/app/api/team/[id]/commitments/route";
import { commitmentSourceActions, importedCommitmentSourceKeys } from "@/lib/team-commitments-source";

const fields: CommitmentFields = {
  title: "Clearer decisions", description: "Record the decision.", nextStep: "Try Friday.",
  successCriteria: "Two meetings with an owner.", ownerUserId: "viewer", dueDate: "2026-10-01",
};
const report = {
  id: "report", title: "Published snapshot", publishedAt: new Date("2026-09-01"),
  actionItems: [{ id: "action", title: "Try a check-in", description: "Review progress.", timeframe: "30", owner: "Alex", status: "in_progress", note: "Tried once.", dueDate: "2026-10-01" }],
};
function record() {
  return {
    id: "item", teamId: f.itemTeamId, ...fields, ownerUserId: f.itemOwnerId,
    ownerLabel: "Alex", status: "in_progress", latestNote: null, targetMetric: null,
    sourceReportId: null, sourceActionKey: null, sourceSnapshot: null, version: f.itemVersion,
    createdById: "viewer", createdAt: new Date("2026-09-01"), updatedAt: new Date("2026-09-02"),
  };
}
function request(method: "POST" | "PATCH" | "GET", body?: unknown) {
  return new Request("http://localhost/api/team/team/commitments", {
    method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
  });
}
const params = () => ({ params: Promise.resolve({ id: "team" }) });
const updateBody = () => ({ action: "update", id: "item", expectedVersion: 2, status: "done", note: "Tried successfully twice." });

beforeEach(() => {
  f.authId = "clerk-viewer"; f.viewerId = "viewer"; f.orgRole = "ORG_MEMBER"; f.teamRole = "manager";
  f.policyState = "active"; f.leftAt = null; f.deleted = false; f.ownerValid = true;
  f.updateCount = 1; f.importCount = 1; f.planConflict = false;
  f.itemOwnerId = "viewer"; f.itemTeamId = "team"; f.itemVersion = 2;
  f.readItems.mockImplementation(async () => [{ ...record(), events: [] }]);
  f.readPlan.mockResolvedValue(null);
  f.readReports.mockResolvedValue([report]);
  f.validateOwner.mockImplementation(async () => f.ownerValid ? { id: "membership" } : null);
  f.create.mockImplementation(async () => ({ ...record(), version: 1 }));
  f.createMany.mockImplementation(async () => ({ count: f.importCount }));
  f.update.mockImplementation(async () => {
    if (f.updateCount === 1) f.itemVersion += 1;
    return { count: f.updateCount };
  });
  f.event.mockResolvedValue({ id: "event" });
  f.planCreate.mockImplementation(async () => {
    if (f.planConflict) throw new Prisma.PrismaClientKnownRequestError("Duplicate", { code: "P2002", clientVersion: "6.6.0" });
    return { teamId: "team", version: 1 };
  });
  f.planUpdate.mockImplementation(async () => ({ count: f.updateCount }));
  f.planEvent.mockResolvedValue({ id: "plan-event" });
});

describe("commitments API authorization", () => {
  it("requires shared server authentication before reading or writing", async () => {
    f.authId = null;
    for (const route of [GET, POST, PATCH]) {
      expect((await route(request("POST", updateBody()), params())).status).toBe(401);
    }
    expect(f.readItems).not.toHaveBeenCalled();
    expect(f.tx).not.toHaveBeenCalled();
  });
  it.each(["deleted profile", "departed org", "outside team"])("rejects %s before loading commitments", async (kind) => {
    if (kind === "deleted profile") f.deleted = true;
    if (kind === "departed org") f.leftAt = new Date();
    if (kind === "outside team") { f.orgRole = "ORG_MANAGER"; f.teamRole = null; }
    expect((await GET(request("GET"), params())).status).toBe(kind === "deleted profile" ? 401 : 403);
    expect(f.readItems).not.toHaveBeenCalled();
  });
  it.each(["frozen", "none"] as const)("%s blocks reads and writes", async (state) => {
    f.policyState = state;
    expect((await GET(request("GET"), params())).status).toBe(403);
    expect((await PATCH(request("PATCH", updateBody()), params())).status).toBe(403);
    expect(f.readItems).not.toHaveBeenCalled();
    expect(f.tx).not.toHaveBeenCalled();
  });
  it.each(["restricted", "past_due"] as const)("%s keeps read-only content but blocks writes, even in permissive rollout", async (state) => {
    f.policyState = state;
    const response = await GET(request("GET"), params());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ perspective: "team", canManage: false, canUpdateOwn: false, suggestions: [], assignees: [] });
    for (const body of [updateBody(), { action: "plan", expectedVersion: 0, focus: "Focus", nextCheckInDate: null }]) {
      expect((await PATCH(request("PATCH", body), params())).status).toBe(403);
    }
    expect((await POST(request("POST", { action: "create", fields }), params())).status).toBe(403);
    expect(f.tx).not.toHaveBeenCalled();
  });
  it("a scoped org consultant can manage without team membership", async () => {
    f.orgRole = "ORG_CONSULTANT"; f.teamRole = null;
    expect((await POST(request("POST", { action: "create", fields }), params())).status).toBe(200);
    expect(f.create).toHaveBeenCalled();
  });
  it("a team manager can create with a current assignee and an actual actor event", async () => {
    expect((await POST(request("POST", { action: "create", fields }), params())).status).toBe(200);
    expect(f.validateOwner).toHaveBeenCalledWith(expect.objectContaining({
      where: { teamId: "team", userId: "viewer", user: { deleted: false, orgMemberships: { some: { orgId: "org", leftAt: null } } } },
    }));
    expect(f.create).toHaveBeenCalledWith({ data: { ...fields, teamId: "team", createdById: "viewer", status: "not_started" } });
    expect(f.event).toHaveBeenCalledWith({ data: expect.objectContaining({ actorUserId: "viewer", eventType: "CREATED", commitmentId: "item", payload: expect.objectContaining({ nextStep: fields.nextStep, successCriteria: fields.successCriteria }) }) });
    expect(f.tx).toHaveBeenCalledOnce();
  });
  it("rejects assignment to someone without live org and team membership", async () => {
    f.ownerValid = false;
    const response = await POST(request("POST", { action: "create", fields }), params());
    expect(await response.json()).toEqual({ error: "OWNER_NOT_TEAM_MEMBER" });
    expect(f.create).not.toHaveBeenCalled();
    expect(f.event).not.toHaveBeenCalled();
  });
  it("a regular assignee may update only the owned item", async () => {
    f.teamRole = "member";
    expect((await PATCH(request("PATCH", updateBody()), params())).status).toBe(200);
    expect(f.update).toHaveBeenCalledWith({
      where: { id: "item", teamId: "team", version: 2, ownerUserId: "viewer" },
      data: { status: "done", latestNote: "Tried successfully twice.", version: { increment: 1 } },
    });
  });
  it.each([null, "peer"])("legacy owner text or another assignee never grants personal access (%s)", async (ownerId) => {
    f.teamRole = "member"; f.itemOwnerId = ownerId;
    expect((await PATCH(request("PATCH", updateBody()), params())).status).toBe(403);
    expect(f.update).not.toHaveBeenCalled(); expect(f.event).not.toHaveBeenCalled();
  });
  it("scopes item lookup to the requested team", async () => {
    f.itemTeamId = "other-team";
    expect((await PATCH(request("PATCH", updateBody()), params())).status).toBe(404);
    expect(f.update).not.toHaveBeenCalled();
  });
  it("ordinary members cannot edit fields, change the plan, create or import", async () => {
    f.teamRole = "member";
    for (const body of [{ action: "edit", id: "item", expectedVersion: 2, fields }, { action: "plan", expectedVersion: 0, focus: "Focus", nextCheckInDate: null }]) {
      expect((await PATCH(request("PATCH", body), params())).status).toBe(403);
    }
    for (const body of [{ action: "create", fields }, { action: "import", items: [{ reportId: "report", sourceActionKey: "id:action" }] }]) {
      expect((await POST(request("POST", body), params())).status).toBe(403);
    }
    expect(f.tx).not.toHaveBeenCalled();
  });
});

describe("commitments integrity and serialization", () => {
  it("GET is read-only and suppresses emails/internal payloads in shared event history", async () => {
    f.readItems.mockResolvedValue([{ ...record(), events: [
      { id: "event", actorUserId: "email-user", eventType: "UPDATED", note: "Public note", createdAt: new Date("2026-09-02"), payload: { status: "done", internalNotes: "PRIVATE" } },
      { id: "deleted", actorUserId: "deleted-user", eventType: "UPDATED", note: null, createdAt: new Date("2026-09-02"), payload: { status: "in_progress" } },
    ] }]);
    const response = await GET(request("GET"), params());
    const body = await response.json();
    expect(body.plan.version).toBe(0); expect(body.suggestions).toHaveLength(1);
    expect(body.items[0].events.map((event: { actorName: string }) => event.actorName)).toEqual(["–", "–"]);
    expect(JSON.stringify(body)).not.toMatch(/PRIVATE|private@example|Removed person/);
    expect(f.tx).not.toHaveBeenCalled(); expect(f.createMany).not.toHaveBeenCalled(); expect(f.planCreate).not.toHaveBeenCalled();
  });
  it("ordinary readers receive no report proposals or assignee list", async () => {
    f.teamRole = "member";
    const body = await (await GET(request("GET"), params())).json();
    expect(body).toMatchObject({ perspective: "personal", canManage: false, canUpdateOwn: true, suggestions: [], assignees: [] });
    expect(f.readReports).not.toHaveBeenCalled();
  });
  it("already imported report proposals are excluded without touching current progress", async () => {
    f.readItems.mockResolvedValue([{ ...record(), sourceReportId: "report", sourceActionKey: "id:action", events: [] }]);
    const body = await (await GET(request("GET"), params())).json();
    expect(body.suggestions).toEqual([]); expect(body.items[0].status).toBe("in_progress");
    expect(f.update).not.toHaveBeenCalled();
  });
  it("returns conflict without an event when the compare-and-swap loses", async () => {
    f.updateCount = 0;
    const response = await PATCH(request("PATCH", updateBody()), params());
    expect(response.status).toBe(409); expect(await response.json()).toEqual({ error: "VERSION_CONFLICT" });
    expect(f.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "item", teamId: "team", version: 2 } }));
    expect(f.event).not.toHaveBeenCalled();
  });
  it("manager edits are versioned and recorded just like status updates", async () => {
    const response = await PATCH(request("PATCH", { action: "edit", id: "item", expectedVersion: 2, fields }), params());
    expect(response.status).toBe(200);
    expect(f.update).toHaveBeenCalledWith({ where: { id: "item", teamId: "team", version: 2 }, data: { ...fields, ownerLabel: null, version: { increment: 1 } } });
    expect(f.event).toHaveBeenCalledWith({ data: expect.objectContaining({ actorUserId: "viewer", eventType: "EDITED", version: 3 }) });
  });
  it("editing an unassigned legacy item retains its display-only owner label", async () => {
    f.itemOwnerId = null;
    expect((await PATCH(request("PATCH", { action: "edit", id: "item", expectedVersion: 2, fields: { ...fields, ownerUserId: null } }), params())).status).toBe(200);
    expect(f.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ ownerUserId: null, ownerLabel: "Alex" }) }));
  });
  it("a failed event write rejects the transaction instead of reporting an unaudited success", async () => {
    f.event.mockRejectedValue(new Error("EVENT_WRITE_FAILED"));
    await expect(PATCH(request("PATCH", updateBody()), params())).rejects.toThrow("EVENT_WRITE_FAILED");
    expect(f.tx).toHaveBeenCalledOnce();
  });
  it.each(["blocked", "done"])("%s requires a nonblank note", async (status) => {
    const response = await PATCH(request("PATCH", { ...updateBody(), status, note: "  " }), params());
    expect(await response.json()).toEqual({ error: "NOTE_REQUIRED" }); expect(f.tx).not.toHaveBeenCalled();
  });
  it("rejects forged owner/actor fields on the narrow personal update path", async () => {
    for (const extra of [{ ownerUserId: "peer" }, { actorUserId: "peer" }, { title: "Replaced" }]) {
      expect((await PATCH(request("PATCH", { ...updateBody(), ...extra }), params())).status).toBe(400);
    }
    expect(f.tx).not.toHaveBeenCalled();
  });
  it("rejects impossible calendar dates and missing versions", async () => {
    expect((await POST(request("POST", { action: "create", fields: { ...fields, dueDate: "2026-02-31" } }), params())).status).toBe(400);
    expect((await PATCH(request("PATCH", { ...updateBody(), expectedVersion: undefined }), params())).status).toBe(400);
    expect(f.tx).not.toHaveBeenCalled();
  });
  it("imports only server-resolved published fields and records the source snapshot", async () => {
    const response = await POST(request("POST", { action: "import", items: [{ reportId: "report", sourceActionKey: "id:action" }] }), params());
    expect(response.status).toBe(200);
    expect(f.readReports).toHaveBeenCalledWith(expect.objectContaining({ where: { teamId: "team", id: { in: ["report"] }, status: "PUBLISHED" } }));
    expect(f.createMany).toHaveBeenCalledWith({ skipDuplicates: true, data: [expect.objectContaining({
      teamId: "team", ownerUserId: null, ownerLabel: "Alex", status: "in_progress", latestNote: "Tried once.",
      sourceReportId: "report", sourceActionKey: "id:action", sourceSnapshot: expect.objectContaining({ reportTitle: "Published snapshot" }),
    })] });
    expect(f.event).toHaveBeenCalledWith({ data: expect.objectContaining({ eventType: "IMPORTED", actorUserId: "viewer" }) });
  });
  it("duplicate imports never overwrite the live item or create a second event", async () => {
    f.importCount = 0;
    expect((await POST(request("POST", { action: "import", items: [{ reportId: "report", sourceActionKey: "id:action" }] }), params())).status).toBe(200);
    expect(f.event).not.toHaveBeenCalled(); expect(f.update).not.toHaveBeenCalled();
  });
  it("GET and POST preserve an imported legacy proposal after a normal save adds its id", async () => {
    const legacy = { title: "Unchanged proposal", description: "Still the same.", timeframe: "30", owner: "Alex" };
    const legacyKey = commitmentSourceActions({ ...report, actionItems: [legacy] })[0].sourceActionKey;
    f.readItems.mockResolvedValue([{
      ...record(), sourceReportId: "report", sourceActionKey: legacyKey,
      sourceSnapshot: { reportId: "report", reportTitle: "Original publication", action: legacy }, events: [],
    }]);
    f.readReports.mockResolvedValue([{ ...report, actionItems: [{ ...legacy, id: "assigned-on-save", status: "not_started" }] }]);
    const body = await (await GET(request("GET"), params())).json();
    expect(body.suggestions).toEqual([]);
    const result = await POST(request("POST", { action: "import", items: [{ reportId: "report", sourceActionKey: "id:assigned-on-save" }] }), params());
    expect(result.status).toBe(200);
    expect(f.createMany).not.toHaveBeenCalled();
    expect(f.event).not.toHaveBeenCalled();
    expect(f.update).not.toHaveBeenCalled();
  });
  it("rejects unpublished/other-team reports and nonexistent proposal keys", async () => {
    f.readReports.mockResolvedValueOnce([]);
    expect((await POST(request("POST", { action: "import", items: [{ reportId: "other-report", sourceActionKey: "id:action" }] }), params())).status).toBe(409);
    expect((await POST(request("POST", { action: "import", items: [{ reportId: "report", sourceActionKey: "forged" }] }), params())).status).toBe(404);
    expect(f.createMany).not.toHaveBeenCalled();
  });
  it("simultaneous first plan writes surface the unique-key conflict", async () => {
    f.planConflict = true;
    const response = await PATCH(request("PATCH", { action: "plan", expectedVersion: 0, focus: "Focus", nextCheckInDate: null }), params());
    expect(response.status).toBe(409); expect(await response.json()).toEqual({ error: "VERSION_CONFLICT" });
    expect(f.planEvent).not.toHaveBeenCalled();
  });
  it("existing plan edits compare versions and record the actual updater", async () => {
    f.updateCount = 0;
    expect((await PATCH(request("PATCH", { action: "plan", expectedVersion: 3, focus: "Focus", nextCheckInDate: "2026-10-01" }), params())).status).toBe(409);
    expect(f.planUpdate).toHaveBeenCalledWith({ where: { teamId: "team", version: 3 }, data: { focus: "Focus", nextCheckInDate: "2026-10-01", updatedById: "viewer", version: { increment: 1 } } });
    expect(f.planEvent).not.toHaveBeenCalled();
  });
  it("two successful plan saves append separate snapshots with their actual actors", async () => {
    expect((await PATCH(request("PATCH", { action: "plan", expectedVersion: 0, focus: "First focus", nextCheckInDate: "2026-10-01" }), params())).status).toBe(200);
    f.viewerId = "consultant"; f.orgRole = "ORG_CONSULTANT"; f.teamRole = null;
    expect((await PATCH(request("PATCH", { action: "plan", expectedVersion: 1, focus: "Second focus", nextCheckInDate: null }), params())).status).toBe(200);

    expect(f.planEvent.mock.calls).toEqual([
      [{ data: { teamId: "team", actorUserId: "viewer", focus: "First focus", nextCheckInDate: "2026-10-01", version: 1 } }],
      [{ data: { teamId: "team", actorUserId: "consultant", focus: "Second focus", nextCheckInDate: null, version: 2 } }],
    ]);
    expect(f.tx).toHaveBeenCalledTimes(2);
  });
  it("a failed plan event rejects the same transaction instead of reporting an unaudited save", async () => {
    f.planEvent.mockRejectedValue(new Error("PLAN_EVENT_WRITE_FAILED"));
    await expect(PATCH(request("PATCH", { action: "plan", expectedVersion: 3, focus: "Focus", nextCheckInDate: null }), params())).rejects.toThrow("PLAN_EVENT_WRITE_FAILED");
    expect(f.planUpdate).toHaveBeenCalledOnce();
    expect(f.tx).toHaveBeenCalledOnce();
  });
});

describe("legacy proposal identity", () => {
  it("retains real ids and distinguishes missing/duplicate ids with deterministic source keys", () => {
    const action = report.actionItems[0];
    const input = { ...report, actionItems: [null, action, { ...action, id: undefined }, { ...action, id: "duplicate" }, { ...action, id: "duplicate" }] };
    const first = commitmentSourceActions(input);
    expect(first[0].sourceActionKey).toBe("id:action");
    expect(new Set(first.map((item) => item.sourceActionKey)).size).toBe(4);
    expect(commitmentSourceActions(input)).toEqual(first);
    const changed = commitmentSourceActions({ ...input, actionItems: [null, action, { ...action, id: undefined, title: "Changed proposal" }] });
    expect(changed[1].sourceActionKey).not.toBe(first[1].sourceActionKey);
  });
  const legacy = { title: "Same proposal", description: "Published description", timeframe: "30", owner: "Alex", note: "Original note", evidenceUrl: "https://example.test/evidence" };
  const source = (action: typeof legacy & { id?: string }) => {
    const first = commitmentSourceActions({ ...report, actionItems: [action] })[0];
    return { sourceActionKey: first.sourceActionKey, sourceSnapshot: { action: first.item } };
  };
  it("bridges added ids and changed array positions without comparing only titles", () => {
    const imported = source(legacy);
    const current = commitmentSourceActions({ ...report, actionItems: [
      { ...legacy, title: "New preceding proposal" },
      { ...legacy, id: "new-id", status: "not_started" },
    ] });
    expect([...importedCommitmentSourceKeys(current, [imported])]).toEqual(["id:new-id"]);
    const moved = commitmentSourceActions({ ...report, actionItems: [null, legacy] });
    expect([...importedCommitmentSourceKeys(moved, [imported])]).toEqual([moved[0].sourceActionKey]);
    for (const changed of [{ description: "Changed" }, { owner: "Someone else" }, { note: "Changed" }, { evidenceUrl: "https://example.test/other" }]) {
      const actions = commitmentSourceActions({ ...report, actionItems: [{ ...legacy, ...changed, id: "new-id" }] });
      expect(importedCommitmentSourceKeys(actions, [imported]).size).toBe(0);
    }
  });
  it("matches identical legacy duplicates one-to-one, preserving the unimported copy", () => {
    const current = commitmentSourceActions({ ...report, actionItems: [{ ...legacy, id: "first" }, { ...legacy, id: "second" }] });
    expect([...importedCommitmentSourceKeys(current, [source(legacy)])]).toEqual(["id:first"]);
    const old = commitmentSourceActions({ ...report, actionItems: [legacy, legacy] });
    const imported = old.map((action) => ({ sourceActionKey: action.sourceActionKey, sourceSnapshot: { action: action.item } }));
    expect(importedCommitmentSourceKeys(current, imported).size).toBe(2);
  });
  it("never merges two distinct real ids and reserves exact matches before legacy aliases", () => {
    const current = commitmentSourceActions({ ...report, actionItems: [{ ...legacy, id: "second" }, { ...legacy, id: "first" }] });
    expect([...importedCommitmentSourceKeys(current, [source({ ...legacy, id: "first" })])]).toEqual(["id:first"]);
    expect(importedCommitmentSourceKeys(current, [source(legacy), source({ ...legacy, id: "first" })]).size).toBe(2);
  });
});
