/**
 * Olyan, megszakításra érzékeny folyamatok, ahol a globális lebegő elemek
 * nem fedhetik el a kérdést, az űrlapot vagy az alsó navigációs dokkot.
 */
export const FOCUS_ROUTE_PREFIXES = [
  "/try",
  "/assessment",
  "/observe",
  "/apply",
  "/join",
  "/onboarding",
] as const;

function matchesRoutePrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isFocusRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return FOCUS_ROUTE_PREFIXES.some((prefix) => matchesRoutePrefix(pathname, prefix));
}

