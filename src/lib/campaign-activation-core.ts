export const CAMPAIGN_ACTIVATION_PRECONDITION_CODES = [
  "PSYCH_SAFETY_SINGLE_TEAM_REQUIRED",
  "CAMPAIGN_PARTICIPANTS_REQUIRED",
  "CAMPAIGN_MINIMUM_PARTICIPANTS_NOT_MET",
  "ANONYMITY_THRESHOLD_NOT_MET",
  "PARTICIPANT_OUTSIDE_TARGET_TEAMS",
] as const;

export const MIN_CAMPAIGN_TEAM_PARTICIPANTS = 3;

export type CampaignActivationPreconditionCode =
  (typeof CAMPAIGN_ACTIVATION_PRECONDITION_CODES)[number];

/**
 * A DRAFT -> ACTIVE valtashoz tartozo, tranzakcioban is ujraellenorizheto
 * uzleti invariansok. A route es az adatbazis-muvelet nem tarthat fenn ket
 * eltero validacios implementaciot: a vegso dontest mindig a claim utan,
 * ugyanabban a tranzakcioban meghozott eredmeny adja.
 */
export function getCampaignActivationPreconditionFailure(input: {
  presetId: string | null;
  steps: readonly string[];
  teamIds: readonly string[];
  participantUserIds: readonly string[];
  targetMemberUserIds: readonly string[];
}): CampaignActivationPreconditionCode | null {
  if (
    input.presetId === "SCAN_V1" &&
    input.steps.includes("PSYCH_SAFETY") &&
    input.teamIds.length !== 1
  ) {
    return "PSYCH_SAFETY_SINGLE_TEAM_REQUIRED";
  }
  if (input.participantUserIds.length === 0) {
    return "CAMPAIGN_PARTICIPANTS_REQUIRED";
  }
  if (
    input.teamIds.length > 0 &&
    input.participantUserIds.length < MIN_CAMPAIGN_TEAM_PARTICIPANTS
  ) {
    return "CAMPAIGN_MINIMUM_PARTICIPANTS_NOT_MET";
  }
  if (
    input.steps.includes("PSYCH_SAFETY") &&
    input.participantUserIds.length < 3
  ) {
    return "ANONYMITY_THRESHOLD_NOT_MET";
  }
  if (input.teamIds.length > 0) {
    const targetMemberIds = new Set(input.targetMemberUserIds);
    if (input.participantUserIds.some((userId) => !targetMemberIds.has(userId))) {
      return "PARTICIPANT_OUTSIDE_TARGET_TEAMS";
    }
  }
  return null;
}
