import test from "node:test";
import assert from "node:assert/strict";
import { buildWorkspaceNavigation, type WorkspaceNavContext } from "@/lib/navigation/config";
import { CAREER_MODULE_READY } from "@/lib/career/module-state";
import { isPortfolioSurfaceActive } from "@/lib/portfolio-parking";
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

test("a pilot operációs és disztribúciós felületei aktívak maradnak", () => {
  assert.equal(isPortfolioSurfaceActive("crm"), true);
  assert.equal(isPortfolioSurfaceActive("publicSharing"), true);
  assert.equal(isPortfolioSurfaceActive("career"), false);
  assert.equal(isPortfolioSurfaceActive("hiring"), false);
});

test("admin topnav is the simplified IA menu (no analytics)", () => {
  const navItems = buildWorkspaceNavigation("org_admin", baseContext);
  const ids = navItems.map((item) => item.id);

  // A „Feladataim" org-tagságnál mindenkinek megjelenik (2026-07-29):
  // a tanácsadó/admin is lehet csapattag, neki is lehet kitöltendő köre.
  assert.deepEqual(ids, ["home", "tasks", "teams", "org"]);
});

test("admin org entry is a plain link into the simple org page", () => {
  const navItems = buildWorkspaceNavigation("org_admin", baseContext);
  const orgItem = navItems.find((item) => item.id === "org");

  assert.equal(orgItem?.kind, "link");
  assert.equal(orgItem?.primaryHref, "/org/org_1");
  assert.equal(orgItem?.badge, 2);
});

// 2026-08-09: az admin Csapatok-menüje eddig a SZERVEZET oldalára vitt, és
// onnan kellett még egyszer kattintani. A menü mostantól maga a lista.
test("admin teams menu links straight to each team, with an all-teams escape", () => {
  const navItems = buildWorkspaceNavigation("org_admin", multiTeamContext);
  const teamsItem = navItems.find((item) => item.id === "teams");

  assert.equal(teamsItem?.kind, "dropdown");
  assert.deepEqual(
    teamsItem?.items?.map((entry) => entry.href),
    ["/team/team_1?tab=overview", "/team/team_2?tab=overview", "/org/org_1?tab=teams"],
  );
  // A menü FEJE is az org-listára visz: a dropdown címkéjére kattintva a
  // teljes lista nyílik, nem egy önkényesen kiválasztott csapat.
  assert.equal(teamsItem?.primaryHref, "/org/org_1?tab=teams");
});

test("admin teams menu keeps the team list short and never loses the escape", () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ id: `t${i}`, name: `Csapat ${i}` }));
  const navItems = buildWorkspaceNavigation("org_admin", { ...baseContext, teams: many });
  const teamsItem = navItems.find((item) => item.id === "teams");

  // Adminnál a lista a szervezet ÖSSZES csapata — 12 tétel hosszabb lenne a
  // képernyőnél, ezért vágjuk. Az „Összes csapat" tétel a levágottak útja.
  assert.equal(teamsItem?.items?.length, 9);
  assert.equal(teamsItem?.items?.at(-1)?.href, "/org/org_1?tab=teams");
});

test("admin without any team still gets a plain link to create the first one", () => {
  const navItems = buildWorkspaceNavigation("org_admin", { ...baseContext, teams: [] });
  const teamsItem = navItems.find((item) => item.id === "teams");

  assert.equal(teamsItem?.kind, "link");
  assert.equal(teamsItem?.primaryHref, "/org/org_1?tab=teams");
});

test("manager topnav omits admin-only organization menu", () => {
  const navItems = buildWorkspaceNavigation("org_manager", baseContext);
  const ids = navItems.map((item) => item.id);

  assert.deepEqual(ids, ["home", "tasks", "teams"]);
  assert.equal(ids.includes("org"), false);
});

// 2026-08-09: a menüpont MINDIG listát nyit. Korábban egy csapatnál közvetlen
// link volt (UX-audit #25) — a használatban ez kiszámíthatatlanná tette a
// gombot: ugyanaz a „Csapatok" hol listát nyitott, hol elnavigált.
test("teams menu opens a list even with a single team, for every role", () => {
  for (const role of ["self", "org_manager"] as const) {
    const teamsItem = buildWorkspaceNavigation(role, baseContext)
      .find((item) => item.id === "teams");

    assert.ok(teamsItem, `${role}: nincs Csapatok menüpont`);
    assert.equal(teamsItem.kind, "dropdown", `${role}: a menüpont navigál lista helyett`);
    assert.deepEqual(
      teamsItem.items?.map((entry) => entry.href),
      ["/team/team_1?tab=overview"],
    );
  }
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

test("member topnav has results + interaction + tasks next to own teams (UX-B7)", () => {
  const navItems = buildWorkspaceNavigation("self", baseContext);
  const ids = navItems.map((item) => item.id);

  assert.deepEqual(ids, ["home", "results", "interaction", "tasks", "teams"]);

  // Az összehasonlítás-belépő az /interaction oldalra visz.
  const interactionItem = navItems.find((item) => item.id === "interaction");
  assert.equal(interactionItem?.primaryHref, "/interaction");
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

  assert.deepEqual(ids, ["home", "results", "interaction", "tasks"]);
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
  assert.equal(isPortfolioSurfaceActive("career"), false, "a P2.2 parkolás feloldódott");
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

test("a parkolt hiring hozzáféréssel sem kerül vissza a munkatér-menübe", () => {
  assert.equal(isPortfolioSurfaceActive("hiring"), false);
  assert.equal(
    buildWorkspaceNavigation("org_admin", baseContext).some((item) => item.id === "hiring"),
    false,
  );
});
