import test from "node:test";
import assert from "node:assert/strict";
import { buildWorkspaceNavigation } from "@/lib/navigation/config";
import {
  canViewAnalyticsFeature,
  canViewDashboardBlock,
  canViewOrgAdminFeature,
  getUserMenuItemIds,
} from "@/lib/navigation/visibility";

const baseContext = {
  homeHref: "/dashboard",
  org: { id: "org_1", name: "Acme" },
  teams: [{ id: "team_1", name: "Alpha Team" }],
  hasHiringAccess: true,
  activeCampaignCount: 2,
} as const;

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
