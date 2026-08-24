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
  "SELF_ASSESSMENT",
  "OBSERVER_360",
  "TEAM_ROLE",
  "TEAM_ROLE_360",
  "TRUST_360",
  "PSYCH_SAFETY",
  "PEER_FEEDBACK",
] as const;

export type CampaignStepType = (typeof CAMPAIGN_STEP_ORDER)[number];

export const CAMPAIGN_PRESET_IDS = ["SCAN_V1"] as const;
export type CampaignPresetId = (typeof CAMPAIGN_PRESET_IDS)[number];

/**
 * Nevesített, szerver által feloldott mérési csomagok. A preset nem csak
 * kliensoldali kényelmi alapérték: ugyanaz az azonosító minden létrehozáskor
 * ugyanarra a lépés-sorra oldódik, ezért a pilot Scanek összevethetők.
 *
 * A Scan v1-ben a self külön lépés. Az OBSERVER_360 szándékosan nincs benne:
 * az observer-teher a második kör / külön kiegészítő része.
 */
export const CAMPAIGN_PRESETS: Record<
  CampaignPresetId,
  {
    label: { hu: string; en: string };
    description: { hu: string; en: string };
    steps: readonly CampaignStepType[];
    /** A preset minden self-eredménye ehhez a konkrét körhöz címkézett. */
    requireFreshResults: boolean;
  }
> = {
  SCAN_V1: {
    label: { hu: "Trita Team Scan v1", en: "Trita Team Scan v1" },
    description: {
      hu: "Önértékelés, bizalmi háló és pszichológiai biztonság pulse.",
      en: "Self-assessment, trust network and psychological safety pulse.",
    },
    steps: ["SELF_ASSESSMENT", "TRUST_360", "PSYCH_SAFETY"],
    requireFreshResults: true,
  },
};

export function getCampaignPresetSteps(
  presetId: CampaignPresetId,
): CampaignStepType[] {
  return [...CAMPAIGN_PRESETS[presetId].steps];
}

/**
 * Presetnél a szerver-konstans az igazság: a kliens nem kapcsolhatja ki a
 * kör-címkézéshez szükséges fresh selfet. Egyedi körben a kért érték marad.
 */
export function resolveCampaignRequireFreshResults(
  presetId: CampaignPresetId | undefined,
  requested: boolean,
): boolean {
  return presetId
    ? CAMPAIGN_PRESETS[presetId].requireFreshResults
    : requested;
}

export function isSelfAssessmentCampaignStep(
  stepType: string,
): stepType is "SELF_ASSESSMENT" | "OBSERVER_360" {
  return stepType === "SELF_ASSESSMENT" || stepType === "OBSERVER_360";
}

// Névtan (UX-audit #13): az OBSERVER_360 „külső visszajelzés" (kollégák
// KÍVÜLRŐL jellemeznek), a PEER_FEEDBACK „elismerés-kör" (csapaton BELÜLI
// köszönet + javaslat) — a két lépés neve korábban majdnem azonos volt
// („kollégai visszajelzés…"), ami összetéveszthetővé tette őket.
export const CAMPAIGN_STEP_LABELS: Record<CampaignStepType, { hu: string; en: string }> = {
  SELF_ASSESSMENT: { hu: "Önértékelés", en: "Self-assessment" },
  OBSERVER_360: { hu: "Önértékelés + külső visszajelzés", en: "Self-assessment + external feedback" },
  TEAM_ROLE: { hu: "Csapatszerep-kérdőív", en: "Team role questionnaire" },
  TEAM_ROLE_360: { hu: "Csapattársak szerep-visszajelzése", en: "Team role peer feedback" },
  TRUST_360: { hu: "Bizalmi háló kör", en: "Trust network round" },
  PSYCH_SAFETY: { hu: "Pszichológiai biztonság pulse", en: "Psychological safety pulse" },
  PEER_FEEDBACK: { hu: "Elismerés-kör", en: "Recognition round" },
};

/** Az adott lépés kitöltő-felülete (értesítés-link és banner-CTA). */
export const CAMPAIGN_STEP_LINKS: Record<CampaignStepType, string> = {
  SELF_ASSESSMENT: "/assessment",
  OBSERVER_360: "/assessment",
  TEAM_ROLE: "/assessment/team-roles",
  TEAM_ROLE_360: "/assessment/team-roles/peers",
  TRUST_360: "/assessment/trust",
  PSYCH_SAFETY: "/assessment/psych-safety",
  PEER_FEEDBACK: "/assessment/peer-feedback",
};

/**
 * Kampányból nyitott self-kérdőívnél a kör az URL része. A többi mérés
 * saját beadási útja már kampányhoz kötött; náluk a kanonikus link marad.
 */
export function getCampaignStepLink(
  stepType: CampaignStepType,
  campaignId?: string | null,
): string {
  const base = CAMPAIGN_STEP_LINKS[stepType];
  if (!campaignId) return base;
  return `${base}?campaignId=${encodeURIComponent(campaignId)}`;
}

export function isCampaignStepType(value: string): value is CampaignStepType {
  return (CAMPAIGN_STEP_ORDER as readonly string[]).includes(value);
}

/**
 * Lépés-lista normalizálása: csak érvényes típusok, duplikátum nélkül,
 * kanonikus sorrendben (személyiség → szerepek → biztonság).
 */
export function normalizeCampaignSteps(types: string[]): CampaignStepType[] {
  const set = new Set(types.filter(isCampaignStepType));
  // Az observer-kör már magában foglalja a self kitöltést. Ha egy régi vagy
  // kézzel írt kliens mindkettőt küldi, ne kérjük ugyanazt kétszer.
  if (set.has("OBSERVER_360")) set.delete("SELF_ASSESSMENT");
  return CAMPAIGN_STEP_ORDER.filter((t) => set.has(t));
}

/** A kampány effektív lépései — üres steps-nél a legacy `type` az egyetlen lépés. */
export function getCampaignSteps(campaign: { type: string; steps: string[] }): string[] {
  return campaign.steps.length > 0 ? campaign.steps : [campaign.type];
}

/**
 * A kampány cél-csapatai — a teamIds lista az igazság, üres listánál a
 * legacy egy-csapatos teamId (2026-07-29 előtti kampányok).
 */
export function getCampaignTeamIds(campaign: {
  teamId?: string | null;
  teamIds?: string[];
}): string[] {
  if (campaign.teamIds && campaign.teamIds.length > 0) return campaign.teamIds;
  return campaign.teamId ? [campaign.teamId] : [];
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
 * Lépés-teljesítés egy résztvevőnél: túlhaladt rajta (currentStep) VAGY
 * lekönyvelt teljesítés (stepCompletions) VAGY — selfet tartalmazó
 * kampánylépésnél, ahol a léptetés még nem futott — kész (fresh-tudatosan
 * szűrt) self-eredmény. A hasFreshSelfResult-ot a hívó számolja:
 * újrafelvételi körben (requireFreshResults) csak az aktiválás utáni
 * self-eredményre lehet igaz.
 */
export function isCampaignStepDone(
  steps: string[],
  idx: number,
  participant: { currentStep: number; stepCompletions?: unknown },
  hasFreshSelfResult: boolean,
): boolean {
  const stepType = steps[idx];
  if (!stepType) return false;
  const sc = participant.stepCompletions;
  const completions =
    sc && typeof sc === "object" && !Array.isArray(sc)
      ? (sc as Record<string, unknown>)
      : {};
  return (
    participant.currentStep > idx ||
    Boolean(completions[stepType]) ||
    (isSelfAssessmentCampaignStep(stepType) && hasFreshSelfResult)
  );
}

/** Hány lépést teljesített a résztvevő a kampány lépéseiből. */
export function countCampaignStepsDone(
  steps: string[],
  participant: { currentStep: number; stepCompletions?: unknown },
  hasFreshSelfResult: boolean,
): number {
  return steps.filter((_, idx) =>
    isCampaignStepDone(steps, idx, participant, hasFreshSelfResult),
  ).length;
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

/**
 * Egy self-eredmény beleszámít-e az adott kampány OBSERVER_360 lépésébe?
 * Fresh körben az explicit kampánycímke az elsődleges. A címke nélküli,
 * aktiválás utáni eredmény csak a migráció előtti adatok kompatibilitási
 * fallbackje; más kampány címkézett eredménye soha nem számít bele.
 */
export function isSelfResultForCampaign(
  result: { campaignId?: string | null; createdAt: Date | string },
  campaign: {
    id: string;
    requireFreshResults: boolean;
    activatedAt?: Date | string | null;
  },
): boolean {
  if (!campaign.requireFreshResults) return true;
  if (result.campaignId === campaign.id) return true;
  if (result.campaignId || !campaign.activatedAt) return false;
  return new Date(result.createdAt).getTime() >= new Date(campaign.activatedAt).getTime();
}

// ─── P1-OPS-02 · Lépés-célzott emlékeztető kohorsz ───────────────────────────

/** Ugyanarra a lépésre ennyi időn belül nem megy második emlékeztető. */
export const STEP_REMINDER_COOLDOWN_MS = 48 * 60 * 60 * 1000;

export interface StepReminderParticipant {
  userId: string;
  currentStep: number;
  nextStepOpensAt?: Date | string | null;
  lastRemindedAt?: Date | string | null;
  lastRemindedStep?: number | null;
}

export interface StepReminderCohort {
  /** Nyitott lépésen álló, cooldown-on kívüli címzettek. */
  pending: Array<{ userId: string; stepIndex: number; stepType: string }>;
  /** Cooldown miatt kihagyottak (idempotens ismétlés — nem hiba). */
  skippedRecent: number;
  /** Ütemezett (még zárt) lépésen állók — nem az ő késésük. */
  gated: number;
  /** Minden lépést teljesítők. */
  done: number;
}

/**
 * Emlékeztető-célzás az AKTUÁLIS befejezetlen lépésből: a self-kész/
 * trust-függő és a trust-kész/pulse-függő résztvevő is a saját nyitott
 * lépéséhez kap emlékeztetőt — nem csak a semmit-sem-kezdők. Tiszta
 * függvény: a route és egy jövőbeli cron ugyanazt a kaput használja.
 */
export function selectStepReminderCohort(
  campaign: { type: string; steps: string[] },
  participants: StepReminderParticipant[],
  now: Date = new Date(),
  cooldownMs: number = STEP_REMINDER_COOLDOWN_MS,
): StepReminderCohort {
  const steps = getCampaignSteps(campaign);
  const cohort: StepReminderCohort = { pending: [], skippedRecent: 0, gated: 0, done: 0 };
  for (const participant of participants) {
    const stepType = steps[participant.currentStep];
    if (!stepType) {
      cohort.done += 1;
      continue;
    }
    if (!isStepGateOpen(participant, now)) {
      cohort.gated += 1;
      continue;
    }
    const remindedThisStep =
      participant.lastRemindedStep === participant.currentStep &&
      participant.lastRemindedAt != null &&
      now.getTime() - new Date(participant.lastRemindedAt).getTime() < cooldownMs;
    if (remindedThisStep) {
      cohort.skippedRecent += 1;
      continue;
    }
    cohort.pending.push({
      userId: participant.userId,
      stepIndex: participant.currentStep,
      stepType,
    });
  }
  return cohort;
}
