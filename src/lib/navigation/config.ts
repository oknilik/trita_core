import { resolveWorkspaceNavRole, type WorkspaceNavRole } from "@/lib/navigation/roles";
import { t, type Locale } from "@/lib/i18n";
import { canViewNavSection } from "@/lib/navigation/visibility";
import { CAREER_MODULE_READY } from "@/lib/career/module-state";
import { isPortfolioSurfaceActive } from "@/lib/portfolio-parking";

export { resolveWorkspaceNavRole };
export type { WorkspaceNavRole };

// ─────────────────────────────────────────────────────────────────────
// Workspace-navigáció — szándékosan egyszerű (2026-07-17 felület-diéta).
//
// Legfeljebb 5 menüpont, duplikátumok nélkül:
//   · Vezérlő (link) — mindenkinek
//   · Eredményeim (link) — self
//   · Csapatok (dropdown) — a menü maga a csapatlista, egy kattintás a
//     csapatoldalra; adminnál a végén „Összes csapat" az org-oldalra
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
  /**
   * Karrier-iránytű (`/career`) elérhető-e. Org-szintű kapcsoló rejtheti
   * (Organization.hideCareerModule) — a menü és az oldal UGYANAZT a szabályt
   * használja (`lib/career/module-visibility.ts`), különben a link 404-re vinne.
   */
  careerModuleHidden?: boolean;
  org: WorkspaceNavOrg | null;
  teams: WorkspaceNavTeam[];
  hasHiringAccess: boolean;
  activeCampaignCount: number;
  /**
   * Nyitott mérési feladatok száma (nyitott kampány-lépés + rám váró
   * observer-visszajelzés kérés) — a „Feladataim" menü badge-e.
   */
  openTaskCount: number;
}

export interface WorkspaceNavDestination {
  id: string;
  label: string;
  description: string;
  href: string;
  badge?: number;
}

export interface WorkspaceNavItem {
  id: "home" | "results" | "interaction" | "career" | "tasks" | "teams" | "hiring" | "org" | "analytics";
  label: string;
  kind: "link" | "dropdown";
  primaryHref: string;
  matchPrefixes: string[];
  badge?: number;
  items?: WorkspaceNavDestination[];
}

/** Adminnál a Csapatok-menüben legfeljebb ennyi csapat fér el. */
const ADMIN_TEAM_MENU_LIMIT = 8;

function uniqueMatchPrefixes(...prefixes: Array<string | null | undefined>): string[] {
  return [...new Set(prefixes.filter((value): value is string => Boolean(value)))];
}

function stripQuery(path: string): string {
  return path.split("?")[0] ?? path;
}

function buildHomeItem(homeHref: string, locale: Locale): WorkspaceNavItem {
  const homePath = stripQuery(homeHref);

  return {
    id: "home",
    label: t("nav.home", locale),
    kind: "link",
    primaryHref: homeHref,
    matchPrefixes: [homePath],
  };
}

function buildResultsItem(locale: Locale): WorkspaceNavItem {
  return {
    id: "results",
    label: t("nav.results", locale),
    kind: "link",
    primaryHref: "/profile/results",
    matchPrefixes: ["/profile/results"],
  };
}

// UX-B7: „Hogyan működnétek együtt?" — eddig az egyetlen belépő a riport
// legalján ült; a páros-összehasonlító meghívó-hurokkal együtt nav-szintű
// felület lett. Az Eredményeim mellett a helye (ugyanabból a profilból dolgozik).
function buildInteractionItem(locale: Locale): WorkspaceNavItem {
  return {
    id: "interaction",
    label: t("nav.interaction", locale),
    kind: "link",
    primaryHref: "/interaction",
    matchPrefixes: ["/interaction"],
  };
}

// Karrier-iránytű: 2026-07-31 óta önálló oldal (korábban az Eredményeim egyik
// füle). Az Eredményeim mellett van a helye, mert ugyanabból a profilból dolgozik.
function buildCareerItem(ctx: WorkspaceNavContext, locale: Locale): WorkspaceNavItem | null {
  if (!isPortfolioSurfaceActive("career")) return null;
  if (ctx.careerModuleHidden) return null;
  // Amíg a modul nem kész, a `/career` a kereslet-mérő ajánlót mutatja. Azt
  // egyetlen úton engedjük elérni (riport-oldali CTA), különben a tölcsér
  // első foka mellett becsorognának a menüből jövők, és a lemorzsolódási
  // arány értelmezhetetlen lenne.
  if (!CAREER_MODULE_READY) return null;
  return {
    id: "career",
    label: t("nav.career", locale),
    kind: "link",
    primaryHref: "/career",
    matchPrefixes: ["/career"],
  };
}

// Feladataim: a mérési teendők egyetlen belépője (kampány-lépések +
// tőlem kért observer-visszajelzések). Csak akkor jelenik meg, ha van rá
// kontextus: org-tagság (csapatos működés) VAGY tényleges nyitott feladat —
// magányos self-usernek felesleges menüpont lenne. Badge: nyitott darabszám.
function buildTasksNav(ctx: WorkspaceNavContext, locale: Locale): WorkspaceNavItem | null {
  if (!ctx.org && ctx.openTaskCount === 0) return null;
  return {
    id: "tasks",
    label: t("nav.tasks", locale),
    kind: "link",
    primaryHref: "/tasks",
    matchPrefixes: ["/tasks"],
    badge: ctx.openTaskCount > 0 ? ctx.openTaskCount : undefined,
  };
}

// Csapatok: MINDEN szerepnél a menü maga a csapatlista — egy kattintás a
// csapatoldalra. Adminnál a lista végén ott az „Összes csapat" tétel az
// org-oldal Csapatok fülére (létrehozás, teljes lista).
function buildTeamsNav(role: WorkspaceNavRole, ctx: WorkspaceNavContext, locale: Locale): WorkspaceNavItem | null {
  if (role === "org_admin") {
    if (!ctx.org) return null;
    const allTeamsHref = `/org/${ctx.org.id}?tab=teams`;

    // Csapat nélküli szervezetben nincs mit lenyitni — marad a link a
    // listára, ahol létre lehet hozni az elsőt.
    if (ctx.teams.length === 0) {
      return {
        id: "teams",
        label: t("nav.teams", locale),
        kind: "link",
        primaryHref: allTeamsHref,
        matchPrefixes: ["/team"],
      };
    }

    // 2026-08-09: az admin eddig egy kattintással a SZERVEZET oldalára
    // került, és onnan kellett még egyszer kattintania a csapatra. Mostantól
    // a menü maga a lista: egy kattintás a csapatoldalra. A teljes lista és
    // a létrehozás az utolsó tételen marad elérhető.
    //
    // Adminnál a `ctx.teams` a szervezet ÖSSZES csapata (getAccessibleTeams),
    // ezért kell a felső korlát: egy 20 csapatos szervezetben a menü
    // hosszabb lenne a képernyőnél. A levágottak az „Összes csapat" mögött
    // vannak — a lista sosem néma, mert az a tétel mindig ott van.
    const shown = ctx.teams.slice(0, ADMIN_TEAM_MENU_LIMIT);
    return {
      id: "teams",
      label: t("nav.teams", locale),
      kind: "dropdown",
      primaryHref: allTeamsHref,
      matchPrefixes: uniqueMatchPrefixes("/team", ...shown.map((team) => `/team/${team.id}`)),
      items: [
        ...shown.map((team) => ({
          id: `team-${team.id}`,
          label: team.name,
          description: t("nav.teamItemDescription", locale),
          href: `/team/${team.id}?tab=overview`,
        })),
        {
          id: "teams-all",
          label: t("nav.allTeams", locale),
          description: t("nav.allTeamsDescription", locale),
          href: allTeamsHref,
        },
      ],
    };
  }

  if (ctx.teams.length === 0) return null;

  // 2026-08-09: az egy-csapatos KÖZVETLEN LINK kivezetve (korábban UX-audit
  // #25). Az a szabály onnan nézve volt logikus, hogy egy elemű menü
  // felesleges — a használatban viszont kiszámíthatatlanná tette a
  // menüpontot: ugyanaz a „Csapatok" gomb hol listát nyitott, hol azonnal
  // elnavigált egy csapatra. A menüpont mostantól MINDIG listát nyit,
  // szereptől és darabszámtól függetlenül.

  // A külön „Csapataim" lista-oldal tétel kivezetve (2026-07-29): a menü
  // maga A lista — az elemek egyben AKTÍV CSAPATOT is váltanak (a Vezérlő
  // ezután a kijelölt csapatra visz).
  const items: WorkspaceNavDestination[] = ctx.teams.map((team) => ({
    id: `team-${team.id}`,
    label: team.name,
    description: t("nav.teamItemDescription", locale),
    href: `/team/${team.id}?tab=overview`,
  }));

  return {
    id: "teams",
    label: role === "org_manager" ? t("nav.myTeam", locale) : t("nav.teams", locale),
    kind: "dropdown",
    primaryHref: "/team",
    matchPrefixes: uniqueMatchPrefixes("/team", ...ctx.teams.map((team) => `/team/${team.id}`)),
    items,
  };
}

// Jelöltek: sima link (UX-audit #25) — a korábbi 3-elemű dropdown minden
// tétele gyakorlatilag ugyanarra az oldalra vitt; az „Új jelölt" és a
// „Kreditek" akciók a /hiring felület fejlécében élnek.
function buildHiringNav(ctx: WorkspaceNavContext, role: WorkspaceNavRole, locale: Locale): WorkspaceNavItem | null {
  void role;
  if (!isPortfolioSurfaceActive("hiring")) return null;
  if (!ctx.org || !ctx.hasHiringAccess) return null;
  return {
    id: "hiring",
    label: t("nav.hiring", locale),
    kind: "link",
    primaryHref: `/hiring/${ctx.org.id}`,
    matchPrefixes: uniqueMatchPrefixes(`/hiring/${ctx.org.id}`),
  };
}

// Szervezet: egyetlen link az egyszerű org-oldalra — a fülek (Csapatok ·
// Kampányok · Tagok) és a Beállítások ott élnek. Badge: aktív mérések.
function buildOrgNav(ctx: WorkspaceNavContext, locale: Locale): WorkspaceNavItem | null {
  if (!ctx.org) return null;
  return {
    id: "org",
    label: t("nav.org", locale),
    kind: "link",
    primaryHref: `/org/${ctx.org.id}`,
    matchPrefixes: [`/org/${ctx.org.id}`],
    badge: ctx.activeCampaignCount > 0 ? ctx.activeCampaignCount : undefined,
  };
}

export function buildWorkspaceNavigation(
  role: WorkspaceNavRole,
  ctx: WorkspaceNavContext,
  locale: Locale = "hu",
): WorkspaceNavItem[] {
  const items: Array<WorkspaceNavItem | null> = [buildHomeItem(ctx.homeHref, locale)];

  if (canViewNavSection(role, "results")) items.push(buildResultsItem(locale));
  // Az összehasonlítás a személyes réteg része — ugyanaz a kapu, mint az
  // Eredményeim.
  if (canViewNavSection(role, "results")) items.push(buildInteractionItem(locale));
  // A karrier a személyes réteg része — ugyanaz a jogosultsági kapu, mint az
  // Eredményeim, plusz az org-szintű kikapcsolhatóság.
  if (canViewNavSection(role, "results")) items.push(buildCareerItem(ctx, locale));
  if (canViewNavSection(role, "tasks")) items.push(buildTasksNav(ctx, locale));
  if (canViewNavSection(role, "teams")) items.push(buildTeamsNav(role, ctx, locale));
  if (canViewNavSection(role, "hiring")) items.push(buildHiringNav(ctx, role, locale));
  if (canViewNavSection(role, "org")) items.push(buildOrgNav(ctx, locale));

  return items.filter((item): item is WorkspaceNavItem => Boolean(item));
}
