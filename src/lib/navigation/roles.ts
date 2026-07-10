export type WorkspaceNavRole = "org_admin" | "org_manager" | "self";

export function resolveWorkspaceNavRole(role: string): WorkspaceNavRole {
  if (role === "ORG_ADMIN" || role === "ORG_CONSULTANT") return "org_admin";
  if (role === "ORG_MANAGER") return "org_manager";
  return "self";
}
