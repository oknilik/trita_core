import { resolveWorkspaceNavRole, type WorkspaceNavRole } from "@/lib/navigation/roles";
import { canViewNavSection } from "@/lib/navigation/visibility";

export { resolveWorkspaceNavRole };
export type { WorkspaceNavRole };

// ─────────────────────────────────────────────────────────────────────
// Workspace-navigáció — szándékosan egyszerű (2026-07-17 felület-diéta).
//
// Legfeljebb 5 menüpont, duplikátumok nélkül:
//   · Vezérlő (link) — mindenkinek
//   · Eredményeim (link) — self
//   · Csapatok — admin/tanácsadó: link az org-oldal Csapatok fülére;
//     tag/manager: dropdown a saját csapatokkal
//   · Jelöltek (dropdown) — hiring-hozzáféréssel (candidate flow marad)
//   · Szervezet (link) — admin/tanácsadó: az egyszerű org-oldal
//     (fülek: Csapatok · Kampányok · Tagok; Beállítások a hero-ban)
// Az Analitika-menü kivezetve: minden célpontja a Csapatok/Szervezet
// alatt él; a "Observer körök" mérés-belépő a tanácsadói Kampányok fülé.
// ─────────────────────────────────────────────────────────────────────

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

function buildHomeItem(homeHref: string): WorkspaceNavItem {
  const homePath = stripQuery(homeHref);

  return {
    id: "home",
    label: "Vezérlő",
    kind: "link",
    primaryHref: homeHref,
    matchPrefixes: [homePath],
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

// Csapatok: admin/tanácsadó → egyetlen link az org-oldal Csapatok fülére
// (ott a lista és a létrehozás is); tag/manager → dropdown a saját csapatokkal.
function buildTeamsNav(role: WorkspaceNavRole, ctx: WorkspaceNavContext): WorkspaceNavItem | null {
  if (role === "org_admin") {
    if (!ctx.org) return null;
    return {
      id: "teams",
      label: "Csapatok",
      kind: "link",
      primaryHref: `/org/${ctx.org.id}?tab=teams`,
      matchPrefixes: ["/team"],
    };
  }

  if (ctx.teams.length === 0) return null;

  // Egyetlen csapatnál nincs dropdown (UX-audit #25): a menü nagyobb lenne,
  // mint a mögötte lévő világ — közvetlen link a csapatra.
  if (ctx.teams.length === 1) {
    const only = ctx.teams[0];
    return {
      id: "teams",
      label: role === "org_manager" ? "Csapatom" : (only.name || "Csapatom"),
      kind: "link",
      primaryHref: `/team/${only.id}?tab=overview`,
      matchPrefixes: uniqueMatchPrefixes("/team", `/team/${only.id}`),
    };
  }

  const items: WorkspaceNavDestination[] = [
    {
      id: "team-overview",
      label: "Csapataim",
      description: "Összes csapat és aktuális állapot",
      href: "/team",
    },
    ...ctx.teams.map((team) => ({
      id: `team-${team.id}`,
      label: team.name,
      description: "Csapatoldal és publikált csapatkép",
      href: `/team/${team.id}?tab=overview`,
    })),
  ];

  return {
    id: "teams",
    label: role === "org_manager" ? "Csapatom" : "Csapatok",
    kind: "dropdown",
    primaryHref: "/team",
    matchPrefixes: uniqueMatchPrefixes("/team", ...ctx.teams.map((team) => `/team/${team.id}`)),
    items,
  };
}

// Jelöltek: sima link (UX-audit #25) — a korábbi 3-elemű dropdown minden
// tétele gyakorlatilag ugyanarra az oldalra vitt; az „Új jelölt" és a
// „Kreditek" akciók a /hiring felület fejlécében élnek.
function buildHiringNav(ctx: WorkspaceNavContext, role: WorkspaceNavRole): WorkspaceNavItem | null {
  void role;
  if (!ctx.org || !ctx.hasHiringAccess) return null;
  return {
    id: "hiring",
    label: "Jelöltek",
    kind: "link",
    primaryHref: `/hiring/${ctx.org.id}`,
    matchPrefixes: uniqueMatchPrefixes(`/hiring/${ctx.org.id}`),
  };
}

// Szervezet: egyetlen link az egyszerű org-oldalra — a fülek (Csapatok ·
// Kampányok · Tagok) és a Beállítások ott élnek. Badge: aktív mérések.
function buildOrgNav(ctx: WorkspaceNavContext): WorkspaceNavItem | null {
  if (!ctx.org) return null;
  return {
    id: "org",
    label: "Szervezet",
    kind: "link",
    primaryHref: `/org/${ctx.org.id}`,
    matchPrefixes: [`/org/${ctx.org.id}`],
    badge: ctx.activeCampaignCount > 0 ? ctx.activeCampaignCount : undefined,
  };
}

export function buildWorkspaceNavigation(
  role: WorkspaceNavRole,
  ctx: WorkspaceNavContext,
): WorkspaceNavItem[] {
  const items: Array<WorkspaceNavItem | null> = [buildHomeItem(ctx.homeHref)];

  if (canViewNavSection(role, "results")) items.push(buildResultsItem());
  if (canViewNavSection(role, "teams")) items.push(buildTeamsNav(role, ctx));
  if (canViewNavSection(role, "hiring")) items.push(buildHiringNav(ctx, role));
  if (canViewNavSection(role, "org")) items.push(buildOrgNav(ctx));

  return items.filter((item): item is WorkspaceNavItem => Boolean(item));
}
