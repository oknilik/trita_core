import type { WorkspaceNavItem } from "./config";

/** One destination owns the current page; a dispatcher alias never wins a tie. */
export function resolveActiveWorkspaceItem(
  items: WorkspaceNavItem[],
  pathname: string,
  tab: string | null,
): WorkspaceNavItem["id"] | null {
  const matches = (prefix: string) => {
    const [path, query] = prefix.split("?");
    if (pathname !== path && !pathname.startsWith(`${path}/`)) return false;
    if (!query) return true;
    const expected = new URLSearchParams(query).get("tab");
    return tab === expected || (tab === null && expected === "overview");
  };
  const candidates = items.filter((item) => item.matchPrefixes.some(matches));
  // /org/:id?tab=teams belongs to Teams, even though Organization shares its path.
  if (tab === "teams" && items.some((item) => item.id === "teams" && item.primaryHref === `${pathname}?tab=teams`)) {
    return "teams";
  }
  return candidates.find((item) => item.id !== "home")?.id ?? candidates[0]?.id ?? null;
}
