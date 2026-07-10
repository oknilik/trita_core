import test from "node:test";
import assert from "node:assert/strict";
import { buildWorkspaceNavigation, type WorkspaceNavContext } from "@/lib/navigation/config";
import {
  canViewAnalyticsFeature,
  canViewDashboardBlock,
  canViewOrgAdminFeature,
  getUserMenuItemIds,
} from "@/lib/navigation/visibility";

const baseContext: WorkspaceNavContext = {
  homeHref: "/dashboard",
  org: { id: "org_1", name: "Acme" },
  teams: [{ id: "team_1", name: "Alpha Team" }],
  hasHiringAccess: true,
  activeCampaignCount: 2,
};

const multiTeamContext: WorkspaceNavContext = {
  ...baseContext,
  teams: [
    { id: "team_1", name: "Alpha Team" },
    { id: "team_2", name: "Beta Team" },
  ],
};

test("admin topnav contains the full IA menu", () => {
  const navItems = buildWorkspaceNavigation("org_admin", baseContext);
  const ids = navItems.map((item) => item.id);

  assert.deepEqual(ids, ["home", "teams", "hiring", "org", "analytics"]);
});

test("manager topnav omits admin-only organization menu", () => {
  const navItems = buildWorkspaceNavigation("org_manager", baseContext);
  const ids = navItems.map((item) => item.id);

  assert.deepEqual(ids, ["home", "teams", "hiring", "analytics"]);
  assert.equal(ids.includes("org"), false);
});

test("manager teams dropdown lists all accessible teams (member or manager)", () => {
  const navItems = buildWorkspaceNavigation("org_manager", multiTeamContext);
  const teamsItem = navItems.find((item) => item.id === "teams");

  assert.ok(teamsItem);
  assert.equal(teamsItem.kind, "dropdown");
  assert.equal(teamsItem.primaryHref, "/team");

  const childLabels = teamsItem.items?.map((item) => item.label) ?? [];
  assert.deepEqual(childLabels, ["Csapataim", "Alpha Team", "Beta Team", "Observer körök"]);

  const childHrefs = teamsItem.items?.map((item) => item.href) ?? [];
  assert.deepEqual(childHrefs, [
    "/team",
    "/team/team_1?tab=overview",
    "/team/team_2?tab=overview",
    "/org/org_1?tab=campaigns",
  ]);
});

test("manager analytics dropdown includes report entry for each accessible team", () => {
  const navItems = buildWorkspaceNavigation("org_manager", multiTeamContext);
  const analyticsItem = navItems.find((item) => item.id === "analytics");

  assert.ok(analyticsItem);
  assert.equal(analyticsItem.kind, "dropdown");

  const childLabels = analyticsItem.items?.map((item) => item.label) ?? [];
  assert.deepEqual(childLabels, ["Csapatriportok", "Alpha Team", "Beta Team"]);

  const childHrefs = analyticsItem.items?.map((item) => item.href) ?? [];
  assert.deepEqual(childHrefs, ["/team", "/team/team_1?tab=profile", "/team/team_2?tab=profile"]);
});

test("manager cannot see admin-only org features in visibility model", () => {
  assert.equal(canViewOrgAdminFeature("org_manager", "settings"), false);
  assert.equal(canViewOrgAdminFeature("org_manager", "billing"), false);
  assert.equal(canViewOrgAdminFeature("org_manager", "permissions"), false);
  assert.equal(canViewOrgAdminFeature("org_admin", "settings"), true);
});

test("manager analytics visibility is report-focused, not full org analytics", () => {
  assert.equal(canViewAnalyticsFeature("org_manager", "reports"), true);
  assert.equal(canViewAnalyticsFeature("org_manager", "org_overview"), false);
  assert.equal(canViewAnalyticsFeature("org_manager", "deep_analysis"), false);
});

test("user menu stays consistent across roles", () => {
  assert.deepEqual(getUserMenuItemIds(), ["profile", "language", "sign_out"]);
});

test("dashboard block visibility is role-aware", () => {
  assert.equal(canViewDashboardBlock("org_admin", "onboarding_checklist"), true);
  assert.equal(canViewDashboardBlock("org_manager", "onboarding_checklist"), false);
  assert.equal(canViewDashboardBlock("org_admin", "analytics_teaser"), true);
  assert.equal(canViewDashboardBlock("org_manager", "analytics_teaser"), true);
});

test("member topnav shows results and own teams, no manager sections", () => {
  const navItems = buildWorkspaceNavigation("self", baseContext);
  const ids = navItems.map((item) => item.id);

  assert.deepEqual(ids, ["home", "results", "teams"]);
});

test("member team dropdown omits manager-only observer rounds entry", () => {
  const navItems = buildWorkspaceNavigation("self", multiTeamContext);
  const teamsItem = navItems.find((item) => item.id === "teams");
  const childIds = (teamsItem?.items ?? []).map((item) => item.id);

  assert.equal(childIds.includes("team-observer-rounds"), false);
});

test("member without teams gets no teams dropdown", () => {
  const navItems = buildWorkspaceNavigation("self", { ...baseContext, teams: [] });
  const ids = navItems.map((item) => item.id);

  assert.deepEqual(ids, ["home", "results"]);
});

test("admin org dropdown no longer contains the dead billing entry", () => {
  const navItems = buildWorkspaceNavigation("org_admin", baseContext);
  const orgItem = navItems.find((item) => item.id === "org");
  const childIds = (orgItem?.items ?? []).map((item) => item.id);

  assert.equal(childIds.includes("org-billing"), false);
});
