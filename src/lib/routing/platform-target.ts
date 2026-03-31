export const PLATFORM_TARGET_ROUTES = {
  home: "/platform/home",
  selfRoot: "/platform/self",
  selfResults: "/platform/self/results",
  teamRoot: "/platform/team",
  teamDetail: (id: string) => `/platform/team/${id}`,
  orgRoot: "/platform/org",
  orgDetail: (id: string) => `/platform/org/${id}`,
  journeyState: "/journey/state",
  assessmentLayersRoot: "/assessment-layers",
  assessmentLayerDetail: (slug: string) => `/assessment-layers/${slug}`,
} as const;

export const LEGACY_PLATFORM_ROUTE_MAP = {
  "/dashboard": PLATFORM_TARGET_ROUTES.home,
  "/profile/results": PLATFORM_TARGET_ROUTES.selfResults,
  "/team": PLATFORM_TARGET_ROUTES.teamRoot,
  "/org": PLATFORM_TARGET_ROUTES.orgRoot,
  "/api/journey/state": PLATFORM_TARGET_ROUTES.journeyState,
} as const;
