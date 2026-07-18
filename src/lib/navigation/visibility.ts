import type { WorkspaceNavRole } from "@/lib/navigation/roles";

export type WorkspaceNavSectionId = "home" | "results" | "teams" | "hiring" | "org" | "analytics";
export type OrgAdminFeatureId = "settings" | "billing" | "permissions";
export type AnalyticsFeatureId = "org_overview" | "team_patterns" | "reports" | "deep_analysis";
export type DashboardBlockId = "onboarding_checklist" | "analytics_teaser";
export type UserMenuItemId = "profile" | "language" | "sign_out";

interface WorkspaceRoleVisibility {
  topLevel: Record<WorkspaceNavSectionId, boolean>;
  orgAdmin: Record<OrgAdminFeatureId, boolean>;
  analytics: Record<AnalyticsFeatureId, boolean>;
  dashboard: Record<DashboardBlockId, boolean>;
}

const ADMIN_VISIBILITY: WorkspaceRoleVisibility = {
  topLevel: {
    home: true,
    results: false,
    teams: true,
    hiring: true,
    org: true,
    analytics: false,
  },
  orgAdmin: {
    settings: true,
    billing: true,
    permissions: true,
  },
  analytics: {
    org_overview: true,
    team_patterns: true,
    reports: true,
    deep_analysis: true,
  },
  dashboard: {
    onboarding_checklist: true,
    analytics_teaser: true,
  },
};

const MANAGER_VISIBILITY: WorkspaceRoleVisibility = {
  topLevel: {
    home: true,
    results: false,
    teams: true,
    hiring: true,
    org: false,
    analytics: false,
  },
  orgAdmin: {
    settings: false,
    billing: false,
    permissions: false,
  },
  analytics: {
    org_overview: false,
    team_patterns: false,
    reports: true,
    deep_analysis: false,
  },
  dashboard: {
    onboarding_checklist: false,
    analytics_teaser: true,
  },
};

const SELF_VISIBILITY: WorkspaceRoleVisibility = {
  topLevel: {
    home: true,
    results: true,
    teams: true,
    hiring: false,
    org: false,
    analytics: false,
  },
  orgAdmin: {
    settings: false,
    billing: false,
    permissions: false,
  },
  analytics: {
    org_overview: false,
    team_patterns: false,
    reports: false,
    deep_analysis: false,
  },
  dashboard: {
    onboarding_checklist: false,
    analytics_teaser: false,
  },
};

const USER_MENU_ITEMS: readonly UserMenuItemId[] = ["profile", "language", "sign_out"];

export function resolveWorkspaceRoleVisibility(role: WorkspaceNavRole): WorkspaceRoleVisibility {
  if (role === "org_admin") return ADMIN_VISIBILITY;
  if (role === "org_manager") return MANAGER_VISIBILITY;
  return SELF_VISIBILITY;
}

export function canViewNavSection(role: WorkspaceNavRole, section: WorkspaceNavSectionId): boolean {
  return resolveWorkspaceRoleVisibility(role).topLevel[section];
}

export function canViewOrgAdminFeature(role: WorkspaceNavRole, feature: OrgAdminFeatureId): boolean {
  return resolveWorkspaceRoleVisibility(role).orgAdmin[feature];
}

export function canViewAnalyticsFeature(role: WorkspaceNavRole, feature: AnalyticsFeatureId): boolean {
  return resolveWorkspaceRoleVisibility(role).analytics[feature];
}

export function canViewDashboardBlock(role: WorkspaceNavRole, block: DashboardBlockId): boolean {
  return resolveWorkspaceRoleVisibility(role).dashboard[block];
}

export function getUserMenuItemIds(): readonly UserMenuItemId[] {
  return USER_MENU_ITEMS;
}
