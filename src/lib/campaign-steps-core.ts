// ─────────────────────────────────────────────────────────────────────
// Több-lépéses kampányok — TISZTA lépés-logika (kliens-oldalon is
// importálható, nincs prisma-függése).
//
// Egy kampány rendezett mérés-lépésekből áll (Campaign.steps); a lépések
// FELHASZNÁLÓNKÉNT, sorban nyílnak meg: amikor valaki teljesíti az
// aktuális lépését, számára megnyílik a következő (értesítéssel).
// A csapat többi tagja a saját ütemében halad.
// ─────────────────────────────────────────────────────────────────────

export const CAMPAIGN_STEP_ORDER = [
  "OBSERVER_360",
  "TEAM_ROLE",
  "PSYCH_SAFETY",
] as const;

export type CampaignStepType = (typeof CAMPAIGN_STEP_ORDER)[number];

export const CAMPAIGN_STEP_LABELS: Record<CampaignStepType, { hu: string; en: string }> = {
  OBSERVER_360: { hu: "Önértékelés + kollégai visszajelzés", en: "Self-assessment + peer feedback" },
  TEAM_ROLE: { hu: "Csapatszerep-kérdőív", en: "Team role questionnaire" },
  PSYCH_SAFETY: { hu: "Pszichológiai biztonság pulse", en: "Psychological safety pulse" },
};

/** Az adott lépés kitöltő-felülete (értesítés-link és banner-CTA). */
export const CAMPAIGN_STEP_LINKS: Record<CampaignStepType, string> = {
  OBSERVER_360: "/assessment",
  TEAM_ROLE: "/assessment/team-roles",
  PSYCH_SAFETY: "/assessment/psych-safety",
};

export function isCampaignStepType(value: string): value is CampaignStepType {
  return (CAMPAIGN_STEP_ORDER as readonly string[]).includes(value);
}

/**
 * Lépés-lista normalizálása: csak érvényes típusok, duplikátum nélkül,
 * kanonikus sorrendben (személyiség → szerepek → biztonság).
 */
export function normalizeCampaignSteps(types: string[]): CampaignStepType[] {
  const set = new Set(types.filter(isCampaignStepType));
  return CAMPAIGN_STEP_ORDER.filter((t) => set.has(t));
}

/** A kampány effektív lépései — üres steps-nél a legacy `type` az egyetlen lépés. */
export function getCampaignSteps(campaign: { type: string; steps: string[] }): string[] {
  return campaign.steps.length > 0 ? campaign.steps : [campaign.type];
}

/** A résztvevő aktuális (nyitott) lépésének típusa; null = minden lépés kész. */
export function getCurrentStepType(
  campaign: { type: string; steps: string[] },
  participant: { currentStep: number },
): string | null {
  const steps = getCampaignSteps(campaign);
  return steps[participant.currentStep] ?? null;
}

/** Igaz, ha a résztvevő aktuális lépése a megadott típus. */
export function isStepOpenFor(
  campaign: { type: string; steps: string[] },
  participant: { currentStep: number },
  stepType: string,
): boolean {
  return getCurrentStepType(campaign, participant) === stepType;
}
