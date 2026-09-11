import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Capability, SubscriptionCapabilityPolicyState } from "@/lib/capabilities";
import type { AccessPolicyContext, AccessPolicyUser } from "@/lib/policy-engine";

const fixture = vi.hoisted(() => ({
  orgRole: "ORG_CONSULTANT", teamRole: "manager" as string | null,
  policyState: "active" as SubscriptionCapabilityPolicyState, isConsultant: false,
  membershipExists: true, leftAt: null as Date | null,
  readReport: vi.fn(async () => null),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: "clerk-viewer" }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  userProfile: { findUnique: async () => ({ id: "viewer", email: null, isConsultant: fixture.isConsultant }) },
  team: { findUnique: async () => ({ id: "team", orgId: "org" }) },
  organizationMember: { findUnique: async () => fixture.membershipExists ? ({ role: fixture.orgRole, leftAt: fixture.leftAt }) : null },
  teamReport: { findFirst: fixture.readReport },
} }));
vi.mock("@/lib/team-report", () => ({ serializeTeamReport: vi.fn() }));
vi.mock("@/lib/logger.server", () => ({ getRequestLogger: async () => ({ error: vi.fn(), info: vi.fn() }) }));
vi.mock("@/lib/policy-service", async () => {
  const { getAccessPolicy, can } = await import("@/lib/policy-engine");
  const resolve = async ({ orgId, teamId }: { orgId: string; teamId?: string }) => {
    const subject: AccessPolicyUser = { orgRole: fixture.orgRole, teamRole: fixture.teamRole,
      membership: { orgId, teamId, hasOrgMembership: true, hasTeamMembership: fixture.teamRole !== null } };
    const context: AccessPolicyContext = { activeOrgId: orgId, activeTeamId: teamId, capabilityPolicyState: fixture.policyState };
    return { subject, context, policy: getAccessPolicy(subject, context) };
  };
  return {
    resolveTeamPolicySnapshot: resolve, resolveOrgPolicySnapshot: resolve,
    isPolicyReadOnly: (state: SubscriptionCapabilityPolicyState) => state !== "active" && state !== "trialing",
    resolveOrgCapabilityDecision: (snapshot: { subject: AccessPolicyUser; context: AccessPolicyContext }, capability: Capability) => can(snapshot.subject, capability, snapshot.context),
  };
});

import { GET, POST, PATCH, DELETE } from "@/app/api/team/[id]/report/route";
import { POST as translate } from "@/app/api/team/[id]/report/translate/route";
import { PATCH as updateActions } from "@/app/api/team/[id]/report/actions/route";
const request = () => new Request("http://localhost/api/team/team/report", { method: "POST", body: JSON.stringify({ reportId: "report", actionItems: [] }) });
const params = () => ({ params: Promise.resolve({ id: "team" }) });

beforeEach(() => {
  fixture.orgRole = "ORG_CONSULTANT"; fixture.teamRole = "manager";
  fixture.policyState = "active"; fixture.isConsultant = false; fixture.readReport.mockClear();
  fixture.membershipExists = true; fixture.leftAt = null;
});

describe("report capability boundaries", () => {
  it.each(["missing", "departed"])("translation requires live org membership even for a platform consultant (%s)", async (membership) => {
    fixture.isConsultant = true;
    fixture.orgRole = "ORG_MEMBER";
    if (membership === "missing") fixture.membershipExists = false;
    else fixture.leftAt = new Date("2026-09-01");
    expect((await translate(request(), params())).status).toBe(403);
    expect(fixture.readReport).not.toHaveBeenCalled();
  });
  for (const state of ["restricted", "frozen", "none"] as const) {
    it(`${state}: blocks every report mutation and translation before loading a report`, async () => {
      fixture.policyState = state;
      for (const route of [POST, PATCH, DELETE, translate, updateActions]) {
        expect((await route(request(), params())).status).toBe(403);
      }
      expect(fixture.readReport).not.toHaveBeenCalled();
    });
  }
  it("restricted consultant can read history while frozen consultant cannot", async () => {
    fixture.policyState = "restricted";
    expect((await GET(request(), params())).status).toBe(400); // missing report id, authorization passed
    fixture.policyState = "frozen";
    expect((await GET(request(), params())).status).toBe(403);
  });
  it("active platform consultant retains draft permissions regardless of org role", async () => {
    fixture.orgRole = "ORG_MEMBER"; fixture.teamRole = null; fixture.isConsultant = true;
    expect((await POST(request(), params())).status).toBe(400); // missing campaign id, authorization passed
  });
  it("ordinary admin cannot create consultant drafts", async () => {
    fixture.orgRole = "ORG_ADMIN";
    expect((await POST(request(), params())).status).toBe(403);
  });
  it("org manager outside the team cannot update its action plan", async () => {
    fixture.orgRole = "ORG_MANAGER"; fixture.teamRole = null;
    expect((await updateActions(request(), params())).status).toBe(403);
    expect(fixture.readReport).not.toHaveBeenCalled();
  });
  it("active team manager receives the live commitments destination without loading a report", async () => {
    fixture.orgRole = "ORG_MEMBER";
    const response = await updateActions(request(), params());
    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({ error: "ACTION_TRACKING_MOVED", destination: "/team/team?tab=commitments" });
    expect(fixture.readReport).not.toHaveBeenCalled();
  });
});
