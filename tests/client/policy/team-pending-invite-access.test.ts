import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Capability, SubscriptionCapabilityPolicyState } from "@/lib/capabilities";
import type { AccessPolicyContext, AccessPolicyUser } from "@/lib/policy-engine";

const fixture = vi.hoisted(() => ({
  orgRole: "ORG_ADMIN",
  teamRole: "manager" as string | null,
  policyState: "active" as SubscriptionCapabilityPolicyState,
  sendEmail: vi.fn(),
  deleteInvite: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: "clerk-viewer" }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  userProfile: { findUnique: async () => ({ id: "viewer" }) },
  organizationMember: { findUnique: async () => ({ role: fixture.orgRole, leftAt: null }) },
  teamPendingInvite: {
    findUnique: async () => ({ id: "invite", teamId: "team", email: "invite@example.test", token: "token", team: { id: "team", orgId: "org", name: "Team" } }),
    delete: fixture.deleteInvite,
  },
} }));
vi.mock("@/lib/emails", () => ({ sendTeamInviteEmail: fixture.sendEmail }));
vi.mock("@/lib/i18n-server", () => ({ getServerLocale: async () => "hu" }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: async () => null }));
vi.mock("@/lib/policy-service", async () => {
  const { getAccessPolicy, can } = await import("@/lib/policy-engine");
  return {
    resolveTeamPolicySnapshot: async ({ orgId, teamId }: { orgId: string; teamId: string }) => {
      const subject: AccessPolicyUser = { orgRole: fixture.orgRole, teamRole: fixture.teamRole,
        membership: { orgId, teamId, hasOrgMembership: true, hasTeamMembership: fixture.teamRole !== null } };
      const context: AccessPolicyContext = { activeOrgId: orgId, activeTeamId: teamId, capabilityPolicyState: fixture.policyState };
      return { subject, context, policy: getAccessPolicy(subject, context) };
    },
    resolveOrgCapabilityDecision: (snapshot: { subject: AccessPolicyUser; context: AccessPolicyContext }, capability: Capability) => can(snapshot.subject, capability, snapshot.context),
  };
});

import { DELETE } from "@/app/api/team/pending-invite/[id]/route";
import { POST } from "@/app/api/team/pending-invite/[id]/resend/route";

const request = () => new Request("http://localhost/api/team/pending-invite/invite");
const params = () => ({ params: Promise.resolve({ id: "invite" }) });

beforeEach(() => {
  fixture.orgRole = "ORG_ADMIN";
  fixture.teamRole = "manager";
  fixture.policyState = "active";
  fixture.sendEmail.mockClear();
  fixture.deleteInvite.mockClear();
});

describe("pending invitation capability boundaries", () => {
  for (const state of ["restricted", "frozen", "none"] as const) {
    it(`${state}: denies resend and cancellation before sending or mutating`, async () => {
      fixture.policyState = state;
      expect((await POST(request(), params())).status).toBe(403);
      expect((await DELETE(request(), params())).status).toBe(403);
      expect(fixture.sendEmail).not.toHaveBeenCalled();
      expect(fixture.deleteInvite).not.toHaveBeenCalled();
    });
  }
  it("active admin can resend", async () => {
    expect((await POST(request(), params())).status).toBe(200);
    expect(fixture.sendEmail).toHaveBeenCalledOnce();
  });
  it("team manager can cancel but email resend requires admin parity", async () => {
    fixture.orgRole = "ORG_MEMBER";
    expect((await DELETE(request(), params())).status).toBe(200);
    expect(fixture.deleteInvite).toHaveBeenCalledOnce();
    expect((await POST(request(), params())).status).toBe(403);
    expect(fixture.sendEmail).not.toHaveBeenCalled();
  });
  it("org manager outside the team cannot cancel its invitations", async () => {
    fixture.orgRole = "ORG_MANAGER";
    fixture.teamRole = null;
    expect((await DELETE(request(), params())).status).toBe(403);
    expect(fixture.deleteInvite).not.toHaveBeenCalled();
  });
});
