export type WorkspaceNavRole = "org_admin" | "org_manager" | "self";

export interface WorkspaceNavTeam {
  id: string;
  name: string;
}

export interface WorkspaceNavOrg {
  id: string;
  name: string;
}

export interface WorkspaceNavContext {
  homeHref: string;
  org: WorkspaceNavOrg | null;
  teams: WorkspaceNavTeam[];
  hasHiringAccess: boolean;
  activeCampaignCount: number;
}

export interface WorkspaceNavDestination {
  id: string;
  label: string;
  description: string;
  href: string;
  badge?: number;
}

export interface WorkspaceNavItem {
  id: "home" | "teams" | "hiring" | "org" | "analytics";
  label: string;
  kind: "link" | "dropdown";
  primaryHref: string;
  matchPrefixes: string[];
  badge?: number;
  items?: WorkspaceNavDestination[];
}

export function resolveWorkspaceNavRole(role: string): WorkspaceNavRole {
  if (role === "ORG_ADMIN") return "org_admin";
  if (role === "ORG_MANAGER") return "org_manager";
  return "self";
}

function uniqueMatchPrefixes(...prefixes: Array<string | null | undefined>): string[] {
  return [...new Set(prefixes.filter((value): value is string => Boolean(value)))];
}

function stripQuery(path: string): string {
  return path.split("?")[0] ?? path;
}

function buildHomeItem(homeHref: string): WorkspaceNavItem {
  const homePath = stripQuery(homeHref);
  const matchPrefixes =
    homePath === "/dashboard" || homePath === "/platform/home"
      ? ["/dashboard", "/platform/home"]
      : [homePath];

  return {
    id: "home",
    label: "Vezérlő",
    kind: "link",
    primaryHref: homeHref,
    matchPrefixes,
  };
}

function buildTeamDestinations(role: WorkspaceNavRole, teams: WorkspaceNavTeam[]): WorkspaceNavDestination[] {
  if (teams.length === 0) return [];

  if (teams.length === 1) {
    const team = teams[0];
    return [
      {
        id: "team-overview",
        label: "Csapat áttekintése",
        description: "Eredmények és aktivitás",
        href: `/team/${team.id}`,
      },
      {
        id: "team-members",
        label: "Tagok és szerepkörök",
        description: "Meglévő tagok kezelése",
        href: `/team/${team.id}?tab=members`,
      },
      {
        id: "team-profile",
        label: role === "org_manager" ? "Riportok" : "Személyiségprofil",
        description: "Személyiségprofil áttekintése",
        href: `/team/${team.id}?tab=profile`,
      },
    ];
  }

  return teams.map((team) => ({
    id: `team-${team.id}`,
    label: team.name,
    description: "Csapat áttekintése",
    href: `/team/${team.id}`,
  }));
}

function buildHiringDestinations(
  ctx: WorkspaceNavContext,
  role: WorkspaceNavRole,
): WorkspaceNavDestination[] {
  if (!ctx.org || !ctx.hasHiringAccess) return [];

  const items: WorkspaceNavDestination[] = [
    {
      id: "hiring-overview",
      label: "Jelöltfolyamat",
      description: "Aktív és archív jelöltek",
      href: `/hiring/${ctx.org.id}`,
    },
    {
      id: "hiring-add",
      label: "Új jelölt hozzáadása",
      description: "Értékelés indítása",
      href: `/hiring/${ctx.org.id}?invite=true`,
    },
  ];

  if (role === "org_admin") {
    items.push({
      id: "hiring-credits",
      label: "Csomagok és kreditek",
      description: "Candidate add-on kezelése",
      href: `/org/${ctx.org.id}/settings`,
    });
  }

  return items;
}

function buildOrgDestinations(ctx: WorkspaceNavContext, role: WorkspaceNavRole): WorkspaceNavDestination[] {
  if (!ctx.org || role !== "org_admin") return [];

  const items: WorkspaceNavDestination[] = [
    {
      id: "org-overview",
      label: "Szervezeti áttekintés",
      description: "Csapatok és tagok összesítése",
      href: `/org/${ctx.org.id}`,
    },
    {
      id: "org-members",
      label: "Szerepkörök kezelése",
      description: "Admin, manager, member",
      href: `/org/${ctx.org.id}?tab=members`,
    },
    {
      id: "org-settings",
      label: "Beállítások",
      description: "Számlázás, csomagok",
      href: `/org/${ctx.org.id}/settings`,
    },
  ];

  return items;
}

function buildAnalyticsDestinations(
  ctx: WorkspaceNavContext,
  role: WorkspaceNavRole,
): WorkspaceNavDestination[] {
  if (ctx.teams.length === 0) return [];

  if (ctx.teams.length === 1) {
    const team = ctx.teams[0];
    return [
      {
        id: "analytics-team-profile",
        label: role === "org_manager" ? "Csapatriport" : "Csapatprofil",
        description: "Team pattern és értelmező nézet",
        href: `/team/${team.id}?tab=profile`,
      },
    ];
  }

  return ctx.teams.map((team) => ({
    id: `analytics-team-${team.id}`,
    label: team.name,
    description: "Csapatprofil és riportok",
    href: `/team/${team.id}?tab=profile`,
  }));
}

function buildDropdownItem(
  id: WorkspaceNavItem["id"],
  label: string,
  primaryHref: string,
  matchPrefixes: string[],
  items: WorkspaceNavDestination[],
  badge?: number,
): WorkspaceNavItem | null {
  if (items.length === 0) return null;
  return {
    id,
    label,
    kind: "dropdown",
    primaryHref,
    matchPrefixes,
    items,
    badge,
  };
}

export function buildWorkspaceNavigation(
  role: WorkspaceNavRole,
  ctx: WorkspaceNavContext,
): WorkspaceNavItem[] {
  const home = buildHomeItem(ctx.homeHref);

  const teamItems = buildTeamDestinations(role, ctx.teams);
  const teamLabel = role === "org_manager" ? "Csapatom" : "Csapatok";
  const teamNav = buildDropdownItem(
    "teams",
    teamLabel,
    teamItems[0]?.href ?? (ctx.teams[0] ? `/team/${ctx.teams[0].id}` : ctx.homeHref),
    uniqueMatchPrefixes(...ctx.teams.map((team) => `/team/${team.id}`)),
    teamItems,
  );

  const hiringItems = buildHiringDestinations(ctx, role);
  const hiringNav = buildDropdownItem(
    "hiring",
    "Jelöltek",
    ctx.org ? `/hiring/${ctx.org.id}` : ctx.homeHref,
    uniqueMatchPrefixes(ctx.org ? `/hiring/${ctx.org.id}` : null),
    hiringItems,
  );

  const orgItems = buildOrgDestinations(ctx, role);
  const orgNav = buildDropdownItem(
    "org",
    "Szervezet",
    ctx.org ? `/org/${ctx.org.id}` : ctx.homeHref,
    uniqueMatchPrefixes(ctx.org ? `/org/${ctx.org.id}` : null),
    orgItems,
    ctx.activeCampaignCount > 0 ? ctx.activeCampaignCount : undefined,
  );

  const analyticsItems = buildAnalyticsDestinations(ctx, role);
  const analyticsNav = buildDropdownItem(
    "analytics",
    role === "org_manager" ? "Riportok" : "Analitika",
    analyticsItems[0]?.href ?? ctx.homeHref,
    uniqueMatchPrefixes(...ctx.teams.map((team) => `/team/${team.id}?tab=profile`), ...ctx.teams.map((team) => `/team/${team.id}`)),
    analyticsItems,
  );

  const items: Array<WorkspaceNavItem | null> = [home];

  if (teamNav) items.push(teamNav);
  if (hiringNav) items.push(hiringNav);
  if (role === "org_admin" && orgNav) items.push(orgNav);
  if (analyticsNav) items.push(analyticsNav);

  return items.filter((item): item is WorkspaceNavItem => Boolean(item));
}
