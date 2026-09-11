import test from "node:test";
import assert from "node:assert/strict";
import { resolveActiveWorkspaceItem } from "@/lib/navigation/active-item";
import { buildWorkspaceNavigation, type WorkspaceNavContext } from "@/lib/navigation/config";

const context: WorkspaceNavContext = {
  homeHref: "/profile/results", org: { id: "org1", name: "Org" },
  teams: [{ id: "team1", name: "Team" }], hasHiringAccess: false,
  activeCampaignCount: 0, openTaskCount: 0,
};
test("the specific result entry wins over its home alias for every role", () => {
  for (const role of ["self", "org_manager", "org_admin"] as const) {
    const items = buildWorkspaceNavigation(role, context);
    assert.equal(resolveActiveWorkspaceItem(items, "/profile/results", "details"), "results");
    assert.equal(resolveActiveWorkspaceItem(items, "/profile", null), null);
  }
});
test("team pages and organization team list have one consistent owner", () => {
  const items = buildWorkspaceNavigation("org_admin", { ...context, homeHref: "/org/org1" });
  assert.equal(resolveActiveWorkspaceItem(items, "/org/org1", null), "org");
  assert.equal(resolveActiveWorkspaceItem(items, "/org/org1", "teams"), "teams");
  assert.equal(resolveActiveWorkspaceItem(items, "/team/team1", "profile"), "teams");
  assert.equal(resolveActiveWorkspaceItem(items, "/team-dynamics", null), null);
});
test("dedicated manager home remains active and unrelated prefixes do not match", () => {
  const items = buildWorkspaceNavigation("org_manager", { ...context, homeHref: "/manager" });
  assert.equal(resolveActiveWorkspaceItem(items, "/manager", null), "home");
  assert.equal(resolveActiveWorkspaceItem(items, "/profile/results-extra", null), null);
});
