import { PSYCH_SAFETY_ITEMS } from "@/lib/psych-safety";
import { TEAM_ROLES, type TeamRoleCode } from "@/lib/team-role-scoring";

export const PSYCH_SAFETY_TARGET_ITEM_IDS = [
  "PS1",
  "PS2",
  "PS3",
  "PS4",
  "PS5",
  "PS6",
  "PS7",
  "PS8",
] as const;

export const TEAM_ROLE_TARGET_CODES = [
  "OG",
  "KE",
  "KO",
  "HA",
  "ER",
  "CS",
  "MV",
  "MI",
  "SZ",
] as const satisfies readonly TeamRoleCode[];

export type TeamActionTarget =
  | { kind: "psych_safety_index" }
  | { kind: "psych_safety_item"; itemId: (typeof PSYCH_SAFETY_TARGET_ITEM_IDS)[number] }
  | { kind: "trust_coverage" }
  | { kind: "trust_isolated_count" }
  | { kind: "role_gap"; roleCode: (typeof TEAM_ROLE_TARGET_CODES)[number] };

export type TeamActionTargetGroup = "psych_safety" | "trust" | "team_role";

export interface TeamActionTargetOption {
  key: string;
  group: TeamActionTargetGroup;
  target: TeamActionTarget;
  label: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseTeamActionTarget(value: unknown): TeamActionTarget | undefined {
  if (!isRecord(value) || typeof value.kind !== "string") return undefined;
  if (value.kind === "psych_safety_index") return { kind: value.kind };
  if (value.kind === "trust_coverage") return { kind: value.kind };
  if (value.kind === "trust_isolated_count") return { kind: value.kind };
  if (
    value.kind === "psych_safety_item" &&
    PSYCH_SAFETY_TARGET_ITEM_IDS.includes(
      value.itemId as (typeof PSYCH_SAFETY_TARGET_ITEM_IDS)[number],
    )
  ) {
    return {
      kind: value.kind,
      itemId: value.itemId as (typeof PSYCH_SAFETY_TARGET_ITEM_IDS)[number],
    };
  }
  if (
    value.kind === "role_gap" &&
    TEAM_ROLE_TARGET_CODES.includes(
      value.roleCode as (typeof TEAM_ROLE_TARGET_CODES)[number],
    )
  ) {
    return {
      kind: value.kind,
      roleCode: value.roleCode as (typeof TEAM_ROLE_TARGET_CODES)[number],
    };
  }
  return undefined;
}

export function teamActionTargetKey(target?: TeamActionTarget): string {
  if (!target) return "";
  if (target.kind === "psych_safety_item") return `${target.kind}:${target.itemId}`;
  if (target.kind === "role_gap") return `${target.kind}:${target.roleCode}`;
  return target.kind;
}

export function teamActionTargetFromKey(key: string): TeamActionTarget | undefined {
  const [kind, detail] = key.split(":", 2);
  return parseTeamActionTarget(
    kind === "psych_safety_item"
      ? { kind, itemId: detail }
      : kind === "role_gap"
        ? { kind, roleCode: detail }
        : { kind },
  );
}

export function teamActionTargetLabel(
  target: TeamActionTarget,
  locale: "hu" | "en",
): string {
  if (target.kind === "psych_safety_index") {
    return locale === "hu" ? "Pszichológiai biztonság index" : "Psychological safety index";
  }
  if (target.kind === "psych_safety_item") {
    const item = PSYCH_SAFETY_ITEMS.find((candidate) => candidate.id === target.itemId);
    return item?.area[locale] ?? target.itemId;
  }
  if (target.kind === "trust_coverage") {
    return locale === "hu" ? "Bizalmi háló lefedettsége" : "Trust-network coverage";
  }
  if (target.kind === "trust_isolated_count") {
    return locale === "hu" ? "Beágyazatlan tagok száma" : "Number of isolated members";
  }
  return locale === "hu"
    ? `Szerephézag: ${TEAM_ROLES[target.roleCode].hu}`
    : `Role gap: ${TEAM_ROLES[target.roleCode].en}`;
}

export function teamActionTargetOptions(
  locale: "hu" | "en",
): TeamActionTargetOption[] {
  const targets: Array<{ group: TeamActionTargetGroup; target: TeamActionTarget }> = [
    { group: "psych_safety", target: { kind: "psych_safety_index" } },
    ...PSYCH_SAFETY_TARGET_ITEM_IDS.map((itemId) => ({
      group: "psych_safety" as const,
      target: { kind: "psych_safety_item" as const, itemId },
    })),
    { group: "trust", target: { kind: "trust_coverage" } },
    { group: "trust", target: { kind: "trust_isolated_count" } },
    ...TEAM_ROLE_TARGET_CODES.map((roleCode) => ({
      group: "team_role" as const,
      target: { kind: "role_gap" as const, roleCode },
    })),
  ];
  return targets.map(({ group, target }) => ({
    key: teamActionTargetKey(target),
    group,
    target,
    label: teamActionTargetLabel(target, locale),
  }));
}
