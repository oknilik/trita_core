const TEAM_MARKETING_PATHS = ["/how-we-work", "/pilot", "/contact"] as const;

/** Marketingoldalak, amelyek a csapat-réteg meleg vizuális terét használják. */
export function usesTeamMarketingChrome(pathname: string): boolean {
  return TEAM_MARKETING_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
