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
  "TEAM_ROLE_360",
  "TRUST_360",
  "PSYCH_SAFETY",
  "PEER_FEEDBACK",
] as const;

export type CampaignStepType = (typeof CAMPAIGN_STEP_ORDER)[number];

// Névtan (UX-audit #13): az OBSERVER_360 „külső visszajelzés" (kollégák
// KÍVÜLRŐL jellemeznek), a PEER_FEEDBACK „elismerés-kör" (csapaton BELÜLI
// köszönet + javaslat) — a két lépés neve korábban majdnem azonos volt
// („kollégai visszajelzés…"), ami összetéveszthetővé tette őket.
export const CAMPAIGN_STEP_LABELS: Record<CampaignStepType, { hu: string; en: string }> = {
  OBSERVER_360: { hu: "Önértékelés + külső visszajelzés", en: "Self-assessment + external feedback" },
  TEAM_ROLE: { hu: "Csapatszerep-kérdőív", en: "Team role questionnaire" },
  TEAM_ROLE_360: { hu: "Csapattársak szerep-visszajelzése", en: "Team role peer feedback" },
  TRUST_360: { hu: "Bizalmi háló kör", en: "Trust network round" },
  PSYCH_SAFETY: { hu: "Pszichológiai biztonság pulse", en: "Psychological safety pulse" },
  PEER_FEEDBACK: { hu: "Elismerés-kör", en: "Recognition round" },
};

/** Az adott lépés kitöltő-felülete (értesítés-link és banner-CTA). */
export const CAMPAIGN_STEP_LINKS: Record<CampaignStepType, string> = {
  OBSERVER_360: "/assessment",
  TEAM_ROLE: "/assessment/team-roles",
  TEAM_ROLE_360: "/assessment/team-roles/peers",
  TRUST_360: "/assessment/trust",
  PSYCH_SAFETY: "/assessment/psych-safety",
  PEER_FEEDBACK: "/assessment/peer-feedback",
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

/**
 * Lépés-ütemezési kapu: az aktuális lépés csak akkor nyitott, ha nincs
 * jövőbeli nyitási időpontja (nextStepOpensAt). A mező hiánya (régi hívók,
 * régi rekordok) nyitottnak számít — visszafelé kompatibilis.
 */
export function isStepGateOpen(
  participant: { nextStepOpensAt?: Date | string | null },
  now: Date = new Date(),
): boolean {
  if (!participant.nextStepOpensAt) return true;
  return new Date(participant.nextStepOpensAt).getTime() <= now.getTime();
}

/**
 * Igaz, ha a résztvevő aktuális lépése a megadott típus ÉS az ütemezési
 * kapu nyitva van (a hívó felelőssége a nextStepOpensAt select-elése —
 * enélkül a kapu mindig nyitottnak számít).
 */
export function isStepOpenFor(
  campaign: { type: string; steps: string[] },
  participant: { currentStep: number; nextStepOpensAt?: Date | string | null },
  stepType: string,
): boolean {
  return (
    getCurrentStepType(campaign, participant) === stepType &&
    isStepGateOpen(participant)
  );
}
