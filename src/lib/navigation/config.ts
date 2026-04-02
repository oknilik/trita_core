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

function getPrimaryTeam(teams: WorkspaceNavTeam[]): WorkspaceNavTeam | null {
  return teams[0] ?? null;
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

function buildTeamDestinations(role: WorkspaceNavRole, ctx: WorkspaceNavContext): WorkspaceNavDestination[] {
  if (role === "org_admin") {
    if (!ctx.org) return [];
    return [
      {
        id: "teams-overview",
        label: "Összes csapat",
        description: "Csapatlista és aktuális állapot",
        href: `/org/${ctx.org.id}?tab=teams`,
      },
      {
        id: "teams-create",
        label: "Új csapat",
        description: "Új csapat indítása",
        href: `/org/${ctx.org.id}?tab=teams`,
      },
      {
        id: "teams-members",
        label: "Tagok",
        description: "Tagok és szerepkörök kezelése",
        href: `/org/${ctx.org.id}?tab=members`,
      },
      {
        id: "teams-invites",
        label: "Meghívások",
        description: "Nyitott meghívások áttekintése",
        href: `/org/${ctx.org.id}?tab=members`,
      },
    ];
  }

  const primaryTeam = getPrimaryTeam(ctx.teams);
  if (!primaryTeam) return [];

  return [
    {
      id: "team-profile",
      label: "Csapatkép",
      description: "Csapatkép és fő riport",
      href: `/team/${primaryTeam.id}?tab=profile`,
    },
    {
      id: "team-members",
      label: "Tagok",
      description: "Taglista és szerepkörök",
      href: `/team/${primaryTeam.id}?tab=members`,
    },
    {
      id: "team-invites",
      label: "Meghívások",
      description: "Nyitott meghívások kezelése",
      href: `/team/${primaryTeam.id}?tab=members`,
    },
    ...(ctx.org
      ? [{
          id: "team-observer-rounds",
          label: "Observer körök",
          description: "Observer körök állapota",
          href: `/org/${ctx.org.id}?tab=campaigns`,
        }]
      : []),
  ];
}

function buildHiringDestinations(
  ctx: WorkspaceNavContext,
  role: WorkspaceNavRole,
): WorkspaceNavDestination[] {
  if (!ctx.org || !ctx.hasHiringAccess) return [];

  if (role === "org_admin") {
    return [
      {
        id: "hiring-overview",
        label: "Jelöltfolyamat",
        description: "Aktív és lezárt jelöltek",
        href: `/hiring/${ctx.org.id}`,
      },
      {
        id: "hiring-add",
        label: "Új jelölt",
        description: "Meghívó küldése új jelöltnek",
        href: `/hiring/${ctx.org.id}?invite=true`,
      },
      {
        id: "hiring-credits",
        label: "Kreditek",
        description: "Kreditkeret és csomagok",
        href: `/org/${ctx.org.id}/settings`,
      },
    ];
  }

  return [
    {
      id: "hiring-my-candidates",
      label: "Jelöltjeim",
      description: "A kezelt jelöltfolyamatok",
      href: `/hiring/${ctx.org.id}`,
    },
    {
      id: "hiring-add",
      label: "Új jelölt",
      description: "Új jelölt meghívása értékelésre",
      href: `/hiring/${ctx.org.id}?invite=true`,
    },
    {
      id: "hiring-credits-available",
      label: "Kreditek",
      description: "Elérhető kreditkeret",
      href: `/hiring/${ctx.org.id}`,
    },
  ];
}

function buildOrgDestinations(ctx: WorkspaceNavContext, role: WorkspaceNavRole): WorkspaceNavDestination[] {
  if (!ctx.org || role !== "org_admin") return [];

  return [
    {
      id: "org-admin",
      label: "Admin központ",
      description: "Szervezeti adminfeladatok egy helyen",
      href: `/org/${ctx.org.id}/settings`,
    },
    {
      id: "org-permissions",
      label: "Jogosultságok",
      description: "Szerepkörök és hozzáférések kezelése",
      href: `/org/${ctx.org.id}?tab=members`,
    },
    {
      id: "org-billing",
      label: "Számlázás",
      description: "Előfizetés és számlázás kezelése",
      href: `/org/${ctx.org.id}/settings`,
    },
    {
      id: "org-settings",
      label: "Beállítások",
      description: "Szervezeti beállítások",
      href: `/org/${ctx.org.id}/settings`,
    },
  ];
}

function buildAnalyticsDestinations(
  ctx: WorkspaceNavContext,
  role: WorkspaceNavRole,
): WorkspaceNavDestination[] {
  const primaryTeam = getPrimaryTeam(ctx.teams);

  if (role === "org_admin") {
    if (!ctx.org) return [];
    return [
      {
        id: "analytics-org-profile",
        label: "Szervezeti kép",
        description: "Összkép és fő értelmezés",
        href: `/org/${ctx.org.id}`,
      },
      {
        id: "analytics-team-patterns",
        label: "Csapatmintázatok",
        description: "Csapatok mintázatai egy nézetben",
        href: `/org/${ctx.org.id}?tab=teams`,
      },
      ...(primaryTeam
        ? [{
            id: "analytics-reports",
            label: "Riportok",
            description: "Részletes csapatriport",
            href: `/team/${primaryTeam.id}?tab=profile`,
          }]
        : []),
      {
        id: "analytics-deeper-layers",
        label: "Mélyelemzés",
        description: "Rétegek és részletes értelmezés",
        href: "/assessment-layers",
      },
    ];
  }

  if (!primaryTeam) return [];

  return [
    {
      id: "analytics-team-report",
      label: "Csapatriport",
      description: "A csapatkép fő riportja",
      href: `/team/${primaryTeam.id}?tab=profile`,
    },
    {
      id: "analytics-comparison",
      label: "Összevetés",
      description: "Mintázatok és eltérések",
      href: `/team/${primaryTeam.id}?tab=profile`,
    },
    {
      id: "analytics-export",
      label: "Export",
      description: "Riport export és megosztás",
      href: `/team/${primaryTeam.id}?tab=profile`,
    },
  ];
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

  const teamItems = buildTeamDestinations(role, ctx);
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
    ctx.org ? `/org/${ctx.org.id}/settings` : ctx.homeHref,
    uniqueMatchPrefixes(
      ctx.org ? `/org/${ctx.org.id}/settings` : null,
      ctx.org ? `/org/${ctx.org.id}?tab=members` : null,
    ),
    orgItems,
    ctx.activeCampaignCount > 0 ? ctx.activeCampaignCount : undefined,
  );

  const analyticsItems = buildAnalyticsDestinations(ctx, role);
  const analyticsNav = buildDropdownItem(
    "analytics",
    role === "org_manager" ? "Riportok" : "Analitika",
    analyticsItems[0]?.href ?? ctx.homeHref,
    uniqueMatchPrefixes(
      ...ctx.teams.map((team) => `/team/${team.id}?tab=profile`),
      ctx.org ? `/org/${ctx.org.id}?tab=overview` : null,
      ctx.org ? `/org/${ctx.org.id}?tab=teams` : null,
      ctx.org ? `/org/${ctx.org.id}?tab=campaigns` : null,
      "/assessment-layers",
    ),
    analyticsItems,
  );

  const items: Array<WorkspaceNavItem | null> = [home];

  if (teamNav) items.push(teamNav);
  if (hiringNav) items.push(hiringNav);
  if (role === "org_admin" && orgNav) items.push(orgNav);
  if (analyticsNav) items.push(analyticsNav);

  return items.filter((item): item is WorkspaceNavItem => Boolean(item));
}
