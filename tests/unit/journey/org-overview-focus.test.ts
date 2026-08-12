import assert from "node:assert/strict";
import test from "node:test";
import { resolveOrgOverviewFocus } from "@/lib/org-overview-focus";

const base = {
  locale: "hu" as const,
  orgId: "org-1",
  teamCount: 2,
  memberCount: 8,
  completedMemberCount: 8,
  pendingInviteCount: 0,
  activeCampaignCount: 0,
  canCreateTeam: true,
  canInviteMembers: true,
  canLaunchCampaign: true,
  canViewCampaigns: true,
};

test("team setup is the first organization action", () => {
  const focus = resolveOrgOverviewFocus({ ...base, teamCount: 0 });
  assert.equal(focus.primary.href, "/org/org-1?tab=teams");
  assert.match(focus.title, /első csapatot/);
});

test("pending invites win over launching a campaign", () => {
  const focus = resolveOrgOverviewFocus({ ...base, pendingInviteCount: 2 });
  assert.equal(focus.primary.href, "/org/org-1?tab=members");
  assert.match(focus.description, /^2 meghívás/);
});

test("ready organization is directed to a new campaign", () => {
  const focus = resolveOrgOverviewFocus(base);
  assert.equal(focus.primary.href, "/org/org-1/campaigns/new");
});

test("non-consultant fallback never links to a hidden campaigns tab", () => {
  const focus = resolveOrgOverviewFocus({
    ...base,
    canViewCampaigns: false,
    activeCampaignCount: 1,
  });
  assert.equal(focus.primary.href, "/org/org-1?tab=teams");
});
