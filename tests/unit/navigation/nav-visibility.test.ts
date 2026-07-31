import test from "node:test";
import assert from "node:assert/strict";
import { buildWorkspaceNavigation, type WorkspaceNavContext } from "@/lib/navigation/config";
import { CAREER_MODULE_READY } from "@/lib/career/deep-probe";
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
  openTaskCount: 0,
  activeCampaignCount: 2,
};

const multiTeamContext: WorkspaceNavContext = {
  ...baseContext,
  teams: [
    { id: "team_1", name: "Alpha Team" },
    { id: "team_2", name: "Beta Team" },
  ],
};

test("admin topnav is the simplified IA menu (no analytics)", () => {
  const navItems = buildWorkspaceNavigation("org_admin", baseContext);
  const ids = navItems.map((item) => item.id);

  // A „Feladataim" org-tagságnál mindenkinek megjelenik (2026-07-29):
  // a tanácsadó/admin is lehet csapattag, neki is lehet kitöltendő köre.
  assert.deepEqual(ids, ["home", "tasks", "teams", "hiring", "org"]);
});

test("admin teams and org entries are plain links into the simple org page", () => {
  const navItems = buildWorkspaceNavigation("org_admin", baseContext);
  const teamsItem = navItems.find((item) => item.id === "teams");
  const orgItem = navItems.find((item) => item.id === "org");

  assert.equal(teamsItem?.kind, "link");
  assert.equal(teamsItem?.primaryHref, "/org/org_1?tab=teams");
  assert.equal(orgItem?.kind, "link");
  assert.equal(orgItem?.primaryHref, "/org/org_1");
  assert.equal(orgItem?.badge, 2);
});

test("manager topnav omits admin-only organization menu", () => {
  const navItems = buildWorkspaceNavigation("org_manager", baseContext);
  const ids = navItems.map((item) => item.id);

  assert.deepEqual(ids, ["home", "tasks", "teams", "hiring"]);
  assert.equal(ids.includes("org"), false);
});

test("manager teams dropdown lists all accessible teams (member or manager)", () => {
  const navItems = buildWorkspaceNavigation("org_manager", multiTeamContext);
  const teamsItem = navItems.find((item) => item.id === "teams");

  assert.ok(teamsItem);
  assert.equal(teamsItem.kind, "dropdown");
  assert.equal(teamsItem.primaryHref, "/team");

  const childLabels = teamsItem.items?.map((item) => item.label) ?? [];
  assert.deepEqual(childLabels, ["Alpha Team", "Beta Team"]);

  const childHrefs = teamsItem.items?.map((item) => item.href) ?? [];
  assert.deepEqual(childHrefs, [
    "/team/team_1?tab=overview",
    "/team/team_2?tab=overview",
  ]);
});

test("analytics menu is retired for every role", () => {
  for (const role of ["org_admin", "org_manager", "self"] as const) {
    const navItems = buildWorkspaceNavigation(role, multiTeamContext);
    assert.equal(navItems.some((item) => item.id === "analytics"), false);
  }
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

test("member topnav has results + tasks next to own teams (2026-07-29)", () => {
  const navItems = buildWorkspaceNavigation("self", baseContext);
  const ids = navItems.map((item) => item.id);

  assert.deepEqual(ids, ["home", "results", "tasks", "teams"]);
});

test("tasks badge counts open measurement work; hidden without org and tasks", () => {
  const withTasks = buildWorkspaceNavigation("self", { ...baseContext, openTaskCount: 3 });
  const tasksItem = withTasks.find((item) => item.id === "tasks");
  assert.equal(tasksItem?.primaryHref, "/tasks");
  assert.equal(tasksItem?.badge, 3);

  // Magányos self-user (nincs org, nincs feladat) → nincs menüpont.
  const solo = buildWorkspaceNavigation("self", {
    ...baseContext,
    org: null,
    teams: [],
    openTaskCount: 0,
  });
  assert.equal(solo.some((item) => item.id === "tasks"), false);
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

  assert.deepEqual(ids, ["home", "results", "tasks"]);
});

test("admin org dropdown no longer contains the dead billing entry", () => {
  const navItems = buildWorkspaceNavigation("org_admin", baseContext);
  const orgItem = navItems.find((item) => item.id === "org");
  const childIds = (orgItem?.items ?? []).map((item) => item.id);

  assert.equal(childIds.includes("org-billing"), false);
});

// A karrier-iránytű önálló oldal (`/career`), de a modul MÉG NEM KÉSZ: addig
// az oldalon a kereslet-mérő ajánló áll, és a menüpont nem jelenik meg — az
// ajánlóhoz egyetlen út vezet (riport-oldali CTA), különben a mérés tölcsére
// olvashatatlan lenne. Ha a `CAREER_MODULE_READY` true-ra vált, ez a teszt
// bukik: akkor az alábbi állítást kell megfordítani, nem a kapcsolót.
test("karrier menüpont: amíg a modul nem kész, nincs a menüben", () => {
  assert.equal(CAREER_MODULE_READY, false, "a modul kész lett — ld. a teszt kommentjét");

  const visible = buildWorkspaceNavigation("self", {
    homeHref: "/dashboard",
    org: null,
    teams: [],
    hasHiringAccess: false,
    activeCampaignCount: 0,
    openTaskCount: 0,
  });
  assert.equal(
    visible.find((item) => item.id === "career"),
    undefined,
    "a készületlen modul menüpontja megjelent",
  );

  // Az org-szintű kapcsoló önmagában is elrejti — ez a szabály a modul
  // élesítése után is érvényben marad.
  const hidden = buildWorkspaceNavigation("self", {
    homeHref: "/dashboard",
    org: null,
    teams: [],
    hasHiringAccess: false,
    activeCampaignCount: 0,
    openTaskCount: 0,
    careerModuleHidden: true,
  });
  assert.equal(
    hidden.find((item) => item.id === "career"),
    undefined,
    "a menüpont megjelent",
  );
});
