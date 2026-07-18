// ─────────────────────────────────────────────────────────────────────
// Több-lépéses kampányok — SZERVER-oldali léptetés és inicializálás.
// A tiszta lépés-logika a campaign-steps-core.ts-ben él.
// ─────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import {
  getCampaignSteps,
  type CampaignStepType,
} from "@/lib/campaign-steps-core";
import { handleMeasurementStepOpened } from "@/lib/notifications";

type StepCompletions = Record<string, string>;

function withCompletion(
  existing: unknown,
  stepType: string,
): StepCompletions {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as StepCompletions) }
      : {};
  base[stepType] = new Date().toISOString();
  return base;
}

/**
 * Lépés-teljesítés lekönyvelése: minden AKTÍV kampányban, ahol a user
 * résztvevő és épp a most teljesített típusú lépésnél tart, léptetünk —
 * és ha van következő lépés, értesítjük róla.
 *
 * A beküldő API-k hívják (self assessment, szerep-kérdőív, pulse) —
 * fire-and-forget jelleggel is biztonságos (idempotens: ha a user már
 * túlhaladt a lépésen, nem történik semmi).
 */
export async function advanceCampaignStepForUser(
  profileId: string,
  completedType: CampaignStepType,
): Promise<void> {
  const participants = await prisma.campaignParticipant.findMany({
    where: { userId: profileId, campaign: { status: "ACTIVE" } },
    select: {
      id: true,
      currentStep: true,
      stepCompletions: true,
      campaign: { select: { id: true, name: true, type: true, steps: true } },
    },
  });

  for (const p of participants) {
    const steps = getCampaignSteps(p.campaign);
    if (steps[p.currentStep] !== completedType) continue;

    const nextStep = p.currentStep + 1;
    await prisma.campaignParticipant.update({
      where: { id: p.id },
      data: {
        currentStep: nextStep,
        stepCompletions: withCompletion(p.stepCompletions, completedType),
      },
    });

    const nextType = steps[nextStep];
    if (nextType) {
      await handleMeasurementStepOpened({
        userId: profileId,
        campaignId: p.campaign.id,
        campaignName: p.campaign.name,
        stepType: nextType,
      }).catch(() => {});
    }
  }
}

/**
 * Résztvevők haladásának inicializálása aktiváláskor (vagy utólagos
 * hozzáadáskor). Szabály: az OBSERVER_360 lépés "előre teljesítettnek"
 * számít, ha a usernek már van kész self-eredménye (a self teszt a
 * termékben egyszeri) — így nem ragad be az első lépésnél. Minden más
 * lépést a kampány alatt kell teljesíteni.
 *
 * A végén minden érintett résztvevő értesítést kap az aktuálisan
 * megnyílt lépéséről.
 */
export async function initializeCampaignProgress(
  campaignId: string,
  onlyUserIds?: string[],
): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      name: true,
      type: true,
      steps: true,
      status: true,
      participants: {
        where: onlyUserIds ? { userId: { in: onlyUserIds } } : undefined,
        select: { id: true, userId: true, currentStep: true, stepCompletions: true },
      },
    },
  });
  if (!campaign || campaign.status !== "ACTIVE") return;

  const steps = getCampaignSteps(campaign);
  if (steps.length === 0 || campaign.participants.length === 0) return;

  // Kinek van már kész self-eredménye? (OBSERVER_360 fast-forwardhoz)
  const userIds = campaign.participants.map((p) => p.userId);
  const selfDone = await prisma.assessmentResult.findMany({
    where: { userProfileId: { in: userIds }, isSelfAssessment: true },
    select: { userProfileId: true },
    distinct: ["userProfileId"],
  });
  const selfDoneSet = new Set(
    selfDone.map((r) => r.userProfileId).filter((v): v is string => Boolean(v)),
  );

  for (const p of campaign.participants) {
    let currentStep = p.currentStep;
    let completions =
      p.stepCompletions && typeof p.stepCompletions === "object" && !Array.isArray(p.stepCompletions)
        ? { ...(p.stepCompletions as StepCompletions) }
        : {};

    while (
      steps[currentStep] === "OBSERVER_360" &&
      selfDoneSet.has(p.userId) &&
      !completions.OBSERVER_360
    ) {
      completions = { ...completions, OBSERVER_360: new Date().toISOString() };
      currentStep += 1;
    }

    if (currentStep !== p.currentStep) {
      await prisma.campaignParticipant.update({
        where: { id: p.id },
        data: { currentStep, stepCompletions: completions },
      });
    }

    const openType = steps[currentStep];
    if (openType) {
      await handleMeasurementStepOpened({
        userId: p.userId,
        campaignId: campaign.id,
        campaignName: campaign.name,
        stepType: openType,
      }).catch(() => {});
    }
  }
}
