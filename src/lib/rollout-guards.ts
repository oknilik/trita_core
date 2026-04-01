const TRUTHY_ENV_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSY_ENV_VALUES = new Set(["0", "false", "no", "off"]);

export function parseBooleanRolloutFlag(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (TRUTHY_ENV_VALUES.has(normalized)) return true;
  if (FALSY_ENV_VALUES.has(normalized)) return false;
  return defaultValue;
}

export function isUnifiedJourneyHandoffEnabled(): boolean {
  return parseBooleanRolloutFlag(
    process.env.NEXT_PUBLIC_TRITA_UNIFIED_JOURNEY_HANDOFF,
    true,
  );
}
