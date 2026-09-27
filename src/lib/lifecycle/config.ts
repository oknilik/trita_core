export type LifecycleMode = "off" | "preview" | "manual" | "automatic";

export function lifecycleConfig() {
  const raw = process.env.LIFECYCLE_MODE;
  const mode: LifecycleMode = raw === "preview" || raw === "manual" || raw === "automatic" ? raw : "off";
  const since = process.env.LIFECYCLE_COHORT_FROM;
  const cohortFrom = since && /^\d{4}-\d{2}-\d{2}T/.test(since) && Number.isFinite(Date.parse(since)) ? new Date(since) : null;
  const allowlist = (process.env.LIFECYCLE_EMAIL_ALLOWLIST ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  return { mode, cohortFrom, allowlist };
}

export function sendingEnabled(source: "manual" | "automatic"): boolean {
  const { mode } = lifecycleConfig();
  return source === "automatic" ? mode === "automatic" : mode === "manual" || mode === "automatic";
}
