const TEAM_MARKETING_PATHS = ["/how-we-work", "/pilot", "/contact"] as const;
const EDITORIAL_MARKETING_PATHS = ["/blog"] as const;

export type MarketingChromeTone = "neutral" | "team" | "editorial";

/** Az oldal tartalmi rétegéhez illeszkedő marketing-fejléc tónusa. */
export function getMarketingChromeTone(pathname: string): MarketingChromeTone {
  if (
    TEAM_MARKETING_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return "team";
  }

  if (
    EDITORIAL_MARKETING_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return "editorial";
  }

  return "neutral";
}

/** Marketingoldalak, amelyek a csapat-réteg meleg vizuális terét használják. */
export function usesTeamMarketingChrome(pathname: string): boolean {
  return getMarketingChromeTone(pathname) === "team";
}
