// ─────────────────────────────────────────────────────────────────────
// Több-lépéses kampányok — SZERVER-oldali léptetés és inicializálás.
// A tiszta lépés-logika a campaign-steps-core.ts-ben él.
// ─────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import {
  getCampaignSteps,
  getCampaignTeamIds,
  isSelfAssessmentCampaignStep,
  isStepOpenFor,
  type CampaignStepType,
} from "@/lib/campaign-steps-core";
import { handleMeasurementStepOpened } from "@/lib/notifications";

/**
 * Több-csapatos kampányban a tag SAJÁT cél-csapata: az a kampány-csapat,
 * amelynek a user tagja (több találatnál az első kampány-sorrend szerint).
 * A csapat-kötött kitöltők (szerep-360, bizalmi kör, elismerés-kör) ezt
 * használják a "campaign.teamId" közvetlen olvasása helyett.
 */
export async function resolveCampaignTeamIdForUser(
  campaign: { teamId?: string | null; teamIds?: string[] },
  profileId: string,
): Promise<string | null> {
  const teamIds = getCampaignTeamIds(campaign);
  if (teamIds.length === 0) return null;
  if (teamIds.length === 1) return teamIds[0];
  const membership = await prisma.teamMember.findFirst({
    where: { userId: profileId, teamId: { in: teamIds } },
    select: { teamId: true },
  });
  if (membership) {
    // A kampány-lista sorrendje a mérvadó, nem a tagság kora.
    return teamIds.find((id) => id === membership.teamId) ?? membership.teamId;
  }
  return null;
}

type StepCompletions = Record<string, string>;

/**
 * Lépésen belüli rész-haladás (értékelős lépések): hány csapattársat
 * értékelt már a user / összesen hányat kell. Nem-értékelős lépésre null.
 * A tag-nézet és a csapat-oldali banner „folytatás" felirata épül rá.
 */
export async function getStepPartialProgress(
  campaign: { id: string; teamId?: string | null; teamIds?: string[] },
  stepType: string,
  profileId: string,
): Promise<{ done: number; total: number } | null> {
  if (
    stepType !== "TEAM_ROLE_360" &&
    stepType !== "TRUST_360" &&
    stepType !== "PEER_FEEDBACK"
  ) {
    return null;
  }
  const teamId = await resolveCampaignTeamIdForUser(campaign, profileId);
  if (!teamId) return null;
  const total = await prisma.teamMember.count({
    where: { teamId, userId: { not: profileId } },
  });
  if (total === 0) return null;
  let done = 0;
  if (stepType === "TEAM_ROLE_360") {
    done = await prisma.teamRoleObservation.count({
      where: { campaignId: campaign.id, raterUserId: profileId },
    });
  } else if (stepType === "TRUST_360") {
    done = await prisma.trustObservation.count({
      where: { campaignId: campaign.id, raterUserId: profileId },
    });
  } else {
    const rows = await prisma.peerFeedbackItem.findMany({
      where: { campaignId: campaign.id, fromUserId: profileId, kind: "feedforward" },
      select: { toUserId: true },
      distinct: ["toUserId"],
    });
    done = rows.length;
  }
  return { done: Math.min(done, total), total };
}

/**
 * Megkezdett-e a user az adott nyitott lépést? Értékelős lépésnél a
 * rész-haladásból, self / OBSERVER_360 lépésnél a szerver-oldali
 * felmérés-piszkozatból
 * derül ki — a CTA erre vált „kezdés"-ről „folytatás"-ra.
 */
export async function hasStartedStep(
  campaign: { id: string; teamId?: string | null; teamIds?: string[] },
  stepType: string,
  profileId: string,
): Promise<boolean> {
  if (isSelfAssessmentCampaignStep(stepType)) {
    const draft = await prisma.assessmentDraft.findUnique({
      where: { userProfileId: profileId },
      select: { answers: true },
    });
    return Boolean(
      draft &&
        draft.answers &&
        typeof draft.answers === "object" &&
        !Array.isArray(draft.answers) &&
        Object.keys(draft.answers as Record<string, unknown>).length > 0,
    );
  }
  const partial = await getStepPartialProgress(campaign, stepType, profileId);
  return (partial?.done ?? 0) > 0;
}

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
 * A user melyik AKTÍV kampányában áll épp a megadott típusú lépésnél?
 * A beküldő API-k kör-címkézésre használják (pl. TeamRoleAnswer.campaignId):
 * a beadás ahhoz a kampányhoz kötődik, amelyikben épp ez a lépés nyitott.
 * Explicit campaignId esetén csak azt a kört fogadja el, és az ütemezési
 * kaput is ellenőrzi. Az opció nélküli régi hívóknál a legkorábbi nyitott
 * kampány nyer (determinisztikus).
 */
export async function resolveActiveCampaignIdForStep(
  profileId: string,
  stepType: CampaignStepType,
  options?: { campaignId?: string },
): Promise<string | null> {
  const participants = await prisma.campaignParticipant.findMany({
    where: {
      userId: profileId,
      campaign: {
        status: "ACTIVE",
        ...(options?.campaignId ? { id: options.campaignId } : {}),
      },
    },
    orderBy: { campaign: { createdAt: "asc" } },
    select: {
      currentStep: true,
      nextStepOpensAt: true,
      campaign: { select: { id: true, type: true, steps: true } },
    },
  });
  for (const p of participants) {
    if (isStepOpenFor(p.campaign, p, stepType)) {
      return p.campaign.id;
    }
  }
  return null;
}

/**
 * A személyiség-kérdőívet két kampánylépés nyithatja: az önálló self és a
 * legacy self + observer kör. A beadó útvonalnak azt is tudnia kell, melyik
 * konkrét lépést teljesítse, ezért az id mellett a típust is visszaadjuk.
 */
export async function resolveActiveSelfAssessmentCampaign(
  profileId: string,
  options?: { campaignId?: string },
): Promise<{
  campaignId: string;
  stepType: "SELF_ASSESSMENT" | "OBSERVER_360";
} | null> {
  for (const stepType of ["SELF_ASSESSMENT", "OBSERVER_360"] as const) {
    const campaignId = await resolveActiveCampaignIdForStep(
      profileId,
      stepType,
      options,
    );
    if (campaignId) return { campaignId, stepType };
  }
  return null;
}

/**
 * Lépés-teljesítés lekönyvelése: explicit campaignId-val csak a megadott,
 * egyébként minden illeszkedő AKTÍV kampányban léptetünk. A zárt ütemezési
 * kaput nem lehet egy közvetlen API-beadással megkerülni.
 *
 * A beküldő API-k hívják (self assessment, szerep-kérdőív, pulse) —
 * fire-and-forget jelleggel is biztonságos (idempotens: ha a user már
 * túlhaladt a lépésen, nem történik semmi).
 */
export async function advanceCampaignStepForUser(
  profileId: string,
  completedType: CampaignStepType,
  options?: { campaignId?: string },
): Promise<void> {
  const participants = await prisma.campaignParticipant.findMany({
    where: {
      userId: profileId,
      campaign: {
        status: "ACTIVE",
        ...(options?.campaignId ? { id: options.campaignId } : {}),
      },
    },
    select: {
      id: true,
      currentStep: true,
      nextStepOpensAt: true,
      stepCompletions: true,
      campaign: {
        select: { id: true, name: true, type: true, steps: true, stepIntervalHours: true },
      },
    },
  });

  for (const p of participants) {
    const steps = getCampaignSteps(p.campaign);
    if (!isStepOpenFor(p.campaign, p, completedType)) continue;

    const nextStep = p.currentStep + 1;
    const nextType = steps[nextStep];
    // Ütemezés: a következő kérdőív ne azonnal érkezzen — default napi egy
    // (stepIntervalHours, 0 = azonnal). A kapu-időpontig a lépés zárva,
    // az értesítést a release (esedékesség / küldés-most) küldi ki.
    const intervalHours = Math.max(0, p.campaign.stepIntervalHours ?? 0);
    const gateUntil =
      nextType && intervalHours > 0
        ? new Date(Date.now() + intervalHours * 60 * 60 * 1000)
        : null;

    await prisma.campaignParticipant.update({
      where: { id: p.id },
      data: {
        currentStep: nextStep,
        stepCompletions: withCompletion(p.stepCompletions, completedType),
        nextStepOpensAt: gateUntil,
      },
    });

    if (nextType && !gateUntil) {
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
 * Esedékes (vagy force-olt) ütemezett lépések kinyitása: a kapu törlődik,
 * és kimegy a MEASUREMENT_STEP_OPENED értesítés (dedupe-kulcsos, így az
 * ismételt futás biztonságos). Hívók: óránkénti cron, a kitöltő-oldalak
 * user-szintű frissítése, és a „Küldés most" akció (force).
 */
export async function releaseDueCampaignSteps(options?: {
  campaignId?: string;
  userId?: string;
  force?: boolean;
  /**
   * A lépés-nyitási értesítés email-párjának kérése. A cron- és a „Küldés
   * most" (force) út adja meg — ott a user nincs jelen. Az oldalbetöltéses
   * user-szintű release NEM emailez (a user épp a felületen van).
   */
  emailNotify?: boolean;
}): Promise<number> {
  const due = await prisma.campaignParticipant.findMany({
    where: {
      campaign: { status: "ACTIVE", ...(options?.campaignId ? { id: options.campaignId } : {}) },
      ...(options?.userId ? { userId: options.userId } : {}),
      nextStepOpensAt: options?.force ? { not: null } : { lte: new Date() },
    },
    select: {
      id: true,
      userId: true,
      currentStep: true,
      campaign: { select: { id: true, name: true, type: true, steps: true } },
    },
  });

  let released = 0;
  for (const p of due) {
    const openType = getCampaignSteps(p.campaign)[p.currentStep];
    await prisma.campaignParticipant.update({
      where: { id: p.id },
      data: { nextStepOpensAt: null },
    });
    released += 1;
    if (openType) {
      await handleMeasurementStepOpened({
        userId: p.userId,
        campaignId: p.campaign.id,
        campaignName: p.campaign.name,
        stepType: openType,
        sendEmail: options?.emailNotify === true,
      }).catch(() => {});
    }
  }
  return released;
}

/**
 * Résztvevők haladásának inicializálása aktiváláskor (vagy utólagos
 * hozzáadáskor). Szabály: a selfet tartalmazó lépés "előre teljesítettnek"
 * számít, ha a usernek már van elfogadható self-eredménye — így a nem-fresh
 * kör nem ragad be az első lépésnél. Minden más lépést a kampány alatt kell
 * teljesíteni.
 *
 * Újrafelvételi kör (requireFreshResults): a fast-forward a konkrét
 * kampányhoz címkézett eredményt fogadja el. Migráció előtti, címke nélküli
 * rekordnál megmarad az aktiválás utáni dátum-kompatibilitás.
 * (Az advanceCampaignStepForUser-nek nem kell külön ellenőrzés: azt mindig
 * egy épp most beadott eredmény hívja, ami definíció szerint friss.)
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
      requireFreshResults: true,
      activatedAt: true,
      participants: {
        where: onlyUserIds ? { userId: { in: onlyUserIds } } : undefined,
        select: { id: true, userId: true, currentStep: true, stepCompletions: true },
      },
    },
  });
  if (!campaign || campaign.status !== "ACTIVE") return;

  const steps = getCampaignSteps(campaign);
  if (steps.length === 0 || campaign.participants.length === 0) return;

  // Kinek van már kész self-eredménye? (self-lépés fast-forwardhoz)
  // Újrafelvételi körben csak az aktiválás utáni eredmény számít.
  const userIds = campaign.participants.map((p) => p.userId);
  const selfDone = await prisma.assessmentResult.findMany({
    where: {
      userProfileId: { in: userIds },
      isSelfAssessment: true,
      ...(campaign.requireFreshResults
        ? campaign.activatedAt
          ? {
              OR: [
                { campaignId: campaign.id },
                { campaignId: null, createdAt: { gte: campaign.activatedAt } },
              ],
            }
          : { campaignId: campaign.id }
        : {}),
    },
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
      isSelfAssessmentCampaignStep(steps[currentStep] ?? "") &&
      selfDoneSet.has(p.userId) &&
      !completions[steps[currentStep]]
    ) {
      completions = {
        ...completions,
        [steps[currentStep]]: new Date().toISOString(),
      };
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
