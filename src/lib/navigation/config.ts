import { resolveWorkspaceNavRole, type WorkspaceNavRole } from "@/lib/navigation/roles";
import {
  canViewAnalyticsFeature,
  canViewNavSection,
  canViewOrgAdminFeature,
} from "@/lib/navigation/visibility";

export { resolveWorkspaceNavRole };
export type { WorkspaceNavRole };

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
  id: "home" | "results" | "teams" | "hiring" | "org" | "analytics";
  label: string;
  kind: "link" | "dropdown";
  primaryHref: string;
  matchPrefixes: string[];
  badge?: number;
  items?: WorkspaceNavDestination[];
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
  const matchPrefixes = [homePath];

  return {
    id: "home",
    label: "Vezérlő",
    kind: "link",
    primaryHref: homeHref,
    matchPrefixes,
  };
}

function buildResultsItem(): WorkspaceNavItem {
  return {
    id: "results",
    label: "Eredményeim",
    kind: "link",
    primaryHref: "/profile/results",
    matchPrefixes: ["/profile/results"],
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

  if (ctx.teams.length === 0) return [];

  return [
    {
      id: "team-overview",
      label: "Csapataim",
      description: "Összes csapat és aktuális állapot",
      href: "/team",
    },
    ...ctx.teams.map((team) => ({
      id: `team-${team.id}`,
      label: team.name,
      description: "Csapatkép és intelligencia riport",
      href: `/team/${team.id}?tab=overview`,
    })),
    ...(ctx.org && role === "org_manager"
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
  if (!ctx.org) return [];

  const items: WorkspaceNavDestination[] = [];

  if (canViewOrgAdminFeature(role, "settings")) {
    items.push({
      id: "org-admin",
      label: "Admin központ",
      description: "Szervezeti adminfeladatok egy helyen",
      href: `/org/${ctx.org.id}/settings`,
    });
    items.push({
      id: "org-settings",
      label: "Beállítások",
      description: "Szervezeti beállítások",
      href: `/org/${ctx.org.id}/settings`,
    });
  }

  if (canViewOrgAdminFeature(role, "permissions")) {
    items.push({
      id: "org-permissions",
      label: "Jogosultságok",
      description: "Szerepkörök és hozzáférések kezelése",
      href: `/org/${ctx.org.id}?tab=members`,
    });
  }

  return items;
}

function buildAnalyticsDestinations(
  ctx: WorkspaceNavContext,
  role: WorkspaceNavRole,
): WorkspaceNavDestination[] {
  const primaryTeam = getPrimaryTeam(ctx.teams);

  if (role === "org_admin") {
    if (!ctx.org) return [];
    const items: WorkspaceNavDestination[] = [];

    if (canViewAnalyticsFeature(role, "org_overview")) {
      items.push({
        id: "analytics-org-profile",
        label: "Szervezeti kép",
        description: "Összkép és fő értelmezés",
        href: `/org/${ctx.org.id}`,
      });
    }

    if (canViewAnalyticsFeature(role, "team_patterns")) {
      items.push({
        id: "analytics-team-patterns",
        label: "Csapatmintázatok",
        description: "Csapatok mintázatai egy nézetben",
        href: `/org/${ctx.org.id}?tab=teams`,
      });
    }

    if (canViewAnalyticsFeature(role, "reports") && primaryTeam) {
      items.push({
            id: "analytics-reports",
            label: "Riportok",
            description: "Részletes csapatriport",
            href: `/team/${primaryTeam.id}?tab=profile`,
          });
    }

    if (canViewAnalyticsFeature(role, "deep_analysis")) {
      items.push({
        id: "analytics-deeper-layers",
        label: "Mélyelemzés",
        description: "Rétegek és részletes értelmezés",
        href: "/assessment-layers",
      });
    }

    return items;
  }

  if (!canViewAnalyticsFeature(role, "reports")) return [];
  if (ctx.teams.length === 0) return [];

  return [
    {
      id: "analytics-team-reports-overview",
      label: "Csapatriportok",
      description: "Válassz csapatot a részletes riporthoz",
      href: "/team",
    },
    ...ctx.teams.map((team) => ({
      id: `analytics-team-${team.id}`,
      label: team.name,
      description: "Csapatriport és összevetés",
      href: `/team/${team.id}?tab=profile`,
    })),
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
    uniqueMatchPrefixes("/team", ...ctx.teams.map((team) => `/team/${team.id}`)),
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

  if (canViewNavSection(role, "results")) items.push(buildResultsItem());
  if (canViewNavSection(role, "teams") && teamNav) items.push(teamNav);
  if (canViewNavSection(role, "hiring") && hiringNav) items.push(hiringNav);
  if (canViewNavSection(role, "org") && orgNav) items.push(orgNav);
  if (canViewNavSection(role, "analytics") && analyticsNav) items.push(analyticsNav);

  return items.filter((item): item is WorkspaceNavItem => Boolean(item));
}
