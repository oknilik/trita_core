/**
 * Portfólió-parkolás — kliens- és szerveroldalon is biztonságosan importálható.
 *
 * A parkolás nem törlés: a modellek, adatok és modulok a repóban maradnak,
 * miközben az ügyfél- és adminfelület, valamint a hozzájuk tartozó HTTP API
 * nem érhető el. Egy felület visszaállításának első lépése az állapot
 * `active`-ra váltása; a teljes ellenőrzőlista a P2.2 dokumentumban él.
 */
export const PORTFOLIO_SURFACE_STATE = {
  career: "parked",
  hiring: "parked",
  // A fizetett pilotok intake → ajánlat → utánkövetés operációs gerince.
  crm: "active",
  blog: "active",
  fakedoor: "parked",
  patternExplorer: "parked",
  // A vendég-teaser és az OG/share kimenet a Team Scan disztribúcióját szolgálja.
  publicSharing: "active",
} as const;

export type PortfolioSurface = keyof typeof PORTFOLIO_SURFACE_STATE;
export type PortfolioSurfaceState = "active" | "parked";

export function isPortfolioSurfaceActive(surface: PortfolioSurface): boolean {
  return (PORTFOLIO_SURFACE_STATE[surface] as PortfolioSurfaceState) === "active";
}

interface ParkedRouteRule {
  surface: PortfolioSurface;
  prefixes: readonly string[];
}

/**
 * A specifikus fakedoor-szabály szándékosan megelőzi a tágabb `/api/career`
 * szabályt: így a két felület később egymástól függetlenül is visszaállítható.
 */
const PARKED_ROUTE_RULES: readonly ParkedRouteRule[] = [
  {
    surface: "fakedoor",
    prefixes: [
      "/admin/fakedoor",
      "/api/admin/fakedoor",
      "/api/career/fakedoor",
      "/api/feature-interest",
      "/api/features/interest",
    ],
  },
  {
    surface: "career",
    prefixes: [
      "/career",
      "/api/career",
      "/api/industry-fit",
      "/api/profile/career-background",
    ],
  },
  {
    surface: "hiring",
    prefixes: [
      "/hiring",
      "/apply",
      "/api/candidate",
      "/api/hiring",
      "/api/manager/candidates",
    ],
  },
  {
    surface: "crm",
    prefixes: [
      "/admin/crm",
      "/admin/quote",
      "/api/admin/crm",
      "/api/admin/quote",
    ],
  },
  {
    surface: "blog",
    prefixes: ["/blog", "/api/admin/blog"],
  },
  {
    surface: "patternExplorer",
    prefixes: ["/patterns"],
  },
  {
    surface: "publicSharing",
    prefixes: ["/share", "/api/profile/share"],
  },
];

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Visszaadja a kért HTTP útvonalat lezáró parkolt felületet, ha van ilyen. */
export function parkedPortfolioSurfaceForPath(pathname: string): PortfolioSurface | null {
  for (const rule of PARKED_ROUTE_RULES) {
    if (
      !isPortfolioSurfaceActive(rule.surface) &&
      rule.prefixes.some((prefix) => matchesPathPrefix(pathname, prefix))
    ) {
      return rule.surface;
    }
  }
  return null;
}
