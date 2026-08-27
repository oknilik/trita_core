// ─────────────────────────────────────────────────────────────────────
// Több-lépéses kampányok — SZERVER-oldali léptetés és inicializálás.
// A tiszta lépés-logika a campaign-steps-core.ts-ben él.
// ─────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  getCampaignSteps,
  getCampaignTeamIds,
  isSelfAssessmentCampaignStep,
  isStepOpenFor,
  type CampaignStepType,
} from "@/lib/campaign-steps-core";
import {
  CAMPAIGN_ACTIVATION_PRECONDITION_CODES,
  getCampaignActivationPreconditionFailure,
  type CampaignActivationPreconditionCode,
} from "@/lib/campaign-activation-core";
import { countCoveredCurrentPeerTargets } from "@/lib/peer-submission-coverage";
import { handleCampaignProgressMilestone, handleMeasurementStepOpened } from "@/lib/notifications";

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
  const currentMembers = await prisma.teamMember.findMany({
    where: { teamId },
    select: { userId: true },
  });
  const currentMemberIds = currentMembers.map((member) => member.userId);
  let ratedUserIds: string[] = [];
  if (stepType === "TEAM_ROLE_360") {
    const rows = await prisma.teamRoleObservation.findMany({
      where: { campaignId: campaign.id, teamId, raterUserId: profileId },
      select: { aboutUserId: true },
    });
    ratedUserIds = rows.map((row) => row.aboutUserId);
  } else if (stepType === "TRUST_360") {
    const rows = await prisma.trustObservation.findMany({
      where: { campaignId: campaign.id, teamId, raterUserId: profileId },
      select: { aboutUserId: true },
    });
    ratedUserIds = rows.map((row) => row.aboutUserId);
  } else {
    const rows = await prisma.peerFeedbackItem.findMany({
      where: {
        campaignId: campaign.id,
        teamId,
        fromUserId: profileId,
        kind: "feedforward",
      },
      select: { toUserId: true },
      distinct: ["toUserId"],
    });
    ratedUserIds = rows.map((row) => row.toUserId);
  }
  const coverage = countCoveredCurrentPeerTargets(
    currentMemberIds,
    profileId,
    ratedUserIds,
  );
  return coverage.total > 0 ? coverage : null;
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
      where: {
        userProfileId_scope: {
          userProfileId: profileId,
          scope: `campaign:${campaign.id}`,
        },
      },
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
 * Lépés-teljesítés lekönyvelése kizárólag az explicit megadott kampányban.
 * A kampányazonosító kötelező: egy résztvevőnek több párhuzamos aktív köre
 * is lehet, ezért a globális "minden illeszkedő kampány" léptetés mérési
 * adatot hamisítana. A zárt ütemezési kaput közvetlen API-beadással sem
 * lehet megkerülni.
 *
 * A beküldő API-k hívják (self assessment, szerep-kérdőív, pulse) –
 * fire-and-forget jelleggel is biztonságos (idempotens: ha a user már
 * túlhaladt a lépésen, nem történik semmi).
 */
export async function advanceCampaignStepForUser(
  profileId: string,
  completedType: CampaignStepType,
  options: {
    campaignId: string;
    db?: Prisma.TransactionClient;
    emitNotifications?: boolean;
  },
): Promise<CampaignStepOpening[]> {
  const db = options.db ?? prisma;
  const openings: CampaignStepOpening[] = [];
  const participants = await db.campaignParticipant.findMany({
    where: {
      userId: profileId,
      campaign: {
        status: "ACTIVE",
        id: options.campaignId,
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
    // Ütemezés: a következő kérdőív ne azonnal érkezzen – default napi egy
    // (stepIntervalHours, 0 = azonnal). A kapu-időpontig a lépés zárva,
    // az értesítést a release (esedékesség / küldés-most) küldi ki.
    const intervalHours = Math.max(0, p.campaign.stepIntervalHours ?? 0);
    const gateUntil =
      nextType && intervalHours > 0
        ? new Date(Date.now() + intervalHours * 60 * 60 * 1000)
        : null;

    await db.campaignParticipant.update({
      where: { id: p.id },
      data: {
        currentStep: nextStep,
        stepCompletions: withCompletion(p.stepCompletions, completedType),
        nextStepOpensAt: gateUntil,
      },
    });

    if (nextType && !gateUntil) {
      const opening = {
        userId: profileId,
        campaignId: p.campaign.id,
        campaignName: p.campaign.name,
        stepType: nextType,
      };
      openings.push(opening);
      if (options.emitNotifications !== false) {
        await handleMeasurementStepOpened(opening);
      }
    }
  }
  return openings;
}

export interface CampaignStepOpening {
  userId: string;
  campaignId: string;
  campaignName: string;
  stepType: string;
}

export interface CampaignActivationResult {
  outcome: "activated" | "already_active" | "conflict";
  campaign: {
    id: string;
    name: string;
    status: string;
    activatedAt: Date | null;
    closedAt: Date | null;
  };
  openings: CampaignStepOpening[];
}

export class CampaignActivationPreconditionError extends Error {
  readonly code: CampaignActivationPreconditionCode;

  constructor(code: CampaignActivationPreconditionCode) {
    super(code);
    this.name = "CampaignActivationPreconditionError";
    this.code = code;
  }
}

export function isCampaignActivationPreconditionError(
  error: unknown,
): error is CampaignActivationPreconditionError {
  if (error instanceof CampaignActivationPreconditionError) return true;
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  return CAMPAIGN_ACTIVATION_PRECONDITION_CODES.includes(
    (error as { code: CampaignActivationPreconditionCode }).code,
  );
}

export interface DraftCampaignUpdateInput {
  steps: string[];
  type: string;
  teamId: string | null;
  teamIds: string[];
  stepIntervalHours?: number;
  peerFeedbackAnonymous?: boolean;
  name?: string;
  description?: string | null;
}

/**
 * Resztvevo hozzaadasa/torlese ugyanazon Campaign sor kizarolagos zarja
 * mogott fut, mint a DRAFT -> ACTIVE claim. Igy az aktivacios precondition-
 * olvasas vagy a teljes participant mutacio elott, vagy teljesen utana fut;
 * felig alkalmazott resztvevo-listat nem inicializalhat.
 */
export async function lockCampaignForParticipantMutation(
  db: Prisma.TransactionClient,
  campaignId: string,
  orgId: string,
): Promise<boolean> {
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "Campaign"
    WHERE "id" = ${campaignId}
      AND "orgId" = ${orgId}
    FOR UPDATE
  `;
  return rows.length === 1;
}

/**
 * A draft szerkesztes ugyanazert foglalja feltetelesen a Campaign sort,
 * mint az aktivalas: ha az ACTIVE claim nyert, egy stale route-context mar
 * nem irhatja at a meresi lepessorozatot vagy a celcsapatot. Ha a szerkesztes
 * nyer, az aktivalas a commit utan az uj konfiguraciot olvassa es validalja.
 */
export async function updateDraftCampaignAtomically(
  campaignId: string,
  data: DraftCampaignUpdateInput,
) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.campaign.updateMany({
      where: { id: campaignId, status: "DRAFT" },
      data,
    });
    const campaign = await tx.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        status: true,
        presetId: true,
        type: true,
        steps: true,
        teamId: true,
        teamIds: true,
        stepIntervalHours: true,
      },
    });
    return {
      outcome: claimed.count === 1 ? ("updated" as const) : ("not_draft" as const),
      campaign,
    };
  });
}

/**
 * DRAFT → ACTIVE állapotfoglalás egyetlen feltételes DB update-tel.
 *
 * Két párhuzamos aktiválás közül csak az a tranzakció inicializálhatja a
 * résztvevőket és a team-role kört, amelyik ténylegesen DRAFT sort váltott.
 * A második kérés ugyanazt a már aktív kampányt kapja vissza változtatás
 * nélkül; az activatedAt és a teamRoleRoundStartedAt ezért stabil marad.
 */
export async function activateCampaignAtomically(
  campaignId: string,
): Promise<CampaignActivationResult> {
  const activatedAt = new Date();
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.campaign.updateMany({
      where: { id: campaignId, status: "DRAFT" },
      data: { status: "ACTIVE", activatedAt },
    });

    const campaign = await tx.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        status: true,
        activatedAt: true,
        closedAt: true,
        presetId: true,
        type: true,
        steps: true,
        teamId: true,
        teamIds: true,
      },
    });
    if (!campaign) throw new Error("CAMPAIGN_NOT_FOUND_DURING_ACTIVATION");

    const responseCampaign = {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      activatedAt: campaign.activatedAt,
      closedAt: campaign.closedAt,
    };
    if (claimed.count === 0) {
      return {
        outcome: campaign.status === "ACTIVE" ? "already_active" : "conflict",
        campaign: responseCampaign,
        openings: [],
      };
    }

    const campaignSteps = getCampaignSteps(campaign);
    const campaignTeamIds = getCampaignTeamIds(campaign);
    const participants = await tx.campaignParticipant.findMany({
      where: { campaignId },
      select: { userId: true },
    });
    const targetMembers =
      campaignTeamIds.length > 0
        ? await tx.teamMember.findMany({
            where: {
              teamId: { in: campaignTeamIds },
              userId: { in: participants.map((participant) => participant.userId) },
            },
            select: { userId: true },
            distinct: ["userId"],
          })
        : [];
    const preconditionFailure = getCampaignActivationPreconditionFailure({
      presetId: campaign.presetId,
      steps: campaignSteps,
      teamIds: campaignTeamIds,
      participantUserIds: participants.map((participant) => participant.userId),
      targetMemberUserIds: targetMembers.map((member) => member.userId),
    });
    if (preconditionFailure) {
      // A throw a korabbi ACTIVE update-et is rollbackolja. Igy a kliens a
      // konkret, javithato okot kapja, a kampany pedig DRAFT marad.
      throw new CampaignActivationPreconditionError(preconditionFailure);
    }

    if (campaignSteps.includes("TEAM_ROLE") && campaignTeamIds.length > 0) {
      await tx.team.updateMany({
        where: { id: { in: campaignTeamIds } },
        data: {
          teamRoleRoundActive: true,
          // Ugyanaz az időpont, mint a kampány aktiválásánál: nemcsak egyszer
          // íródik, hanem az audit-idővonalon is egy eseményt jelent.
          teamRoleRoundStartedAt: activatedAt,
        },
      });
    }

    const openings = await initializeCampaignProgress(campaignId, undefined, {
      db: tx,
      emitNotifications: false,
    });
    return {
      outcome: "activated",
      campaign: responseCampaign,
      openings,
    };
  });
}

export async function notifyCampaignStepOpenings(
  openings: CampaignStepOpening[],
): Promise<void> {
  for (const opening of openings) {
    await handleMeasurementStepOpened(opening);
  }
  for (const campaignId of new Set(openings.map((opening) => opening.campaignId))) {
    await handleCampaignProgressMilestone(campaignId);
  }
}

/**
 * A DB szerint jelenleg nyitott lépések értesítéseinek újraépítése.
 *
 * Az értesítés dedupe-kulcsos, ezért ez biztonságosan hívható egy korábbi
 * post-commit hiba után, kérés-retryból, oldalbetöltésből vagy cronból is.
 * Csak a nem kapuzott aktuális lépést veszi figyelembe; lezárt kampányt és
 * teljesen végigért résztvevőt nem érint.
 */
export async function reconcileCampaignStepOpenings(options?: {
  campaignId?: string;
  userId?: string;
}): Promise<number> {
  const participants = await prisma.campaignParticipant.findMany({
    where: {
      ...(options?.campaignId ? { campaignId: options.campaignId } : {}),
      ...(options?.userId ? { userId: options.userId } : {}),
      nextStepOpensAt: null,
      campaign: { status: "ACTIVE" },
    },
    select: {
      userId: true,
      currentStep: true,
      campaign: {
        select: { id: true, name: true, type: true, steps: true },
      },
    },
  });

  const openings = participants.flatMap((participant) => {
    const stepType = getCampaignSteps(participant.campaign)[participant.currentStep];
    return stepType
      ? [
          {
            userId: participant.userId,
            campaignId: participant.campaign.id,
            campaignName: participant.campaign.name,
            stepType,
          },
        ]
      : [];
  });
  if (openings.length > 0) await notifyCampaignStepOpenings(openings);
  return openings.length;
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
   * most" (force) út adja meg – ott a user nincs jelen. Az oldalbetöltéses
   * user-szintű release NEM emailez (a user épp a felületen van).
   */
  emailNotify?: boolean;
}): Promise<number> {
  // Ugyanazt a határidőt használja a keresés és a feltételes update is. Ha
  // két cron/force kérés egyszerre találja meg ugyanazt a kaput, az első
  // update nullázza; a második updateMany így már 0 sort foglal le.
  const releaseCutoff = new Date();
  const gatePredicate: Prisma.DateTimeNullableFilter = options?.force
    ? { not: null }
    : { lte: releaseCutoff };
  const due = await prisma.campaignParticipant.findMany({
    where: {
      campaign: { status: "ACTIVE", ...(options?.campaignId ? { id: options.campaignId } : {}) },
      ...(options?.userId ? { userId: options.userId } : {}),
      nextStepOpensAt: gatePredicate,
    },
    select: {
      id: true,
      userId: true,
      currentStep: true,
      nextStepOpensAt: true,
      campaign: { select: { id: true, name: true, type: true, steps: true } },
    },
  });

  let released = 0;
  for (const p of due) {
    // A findMany csak nem-null kaput adhat vissza, de a guard a típust is
    // leszűkíti. Az eredeti gate-időpont és currentStep összevetése azt is
    // megakadályozza, hogy egy közben újraütemezett, újabb kaput nyissunk ki.
    if (!p.nextStepOpensAt) continue;
    const openType = getCampaignSteps(p.campaign)[p.currentStep];
    const claimed = await prisma.campaignParticipant.updateMany({
      where: {
        id: p.id,
        currentStep: p.currentStep,
        campaign: { status: "ACTIVE" },
        AND: [
          { nextStepOpensAt: gatePredicate },
          { nextStepOpensAt: p.nextStepOpensAt },
        ],
      },
      data: { nextStepOpensAt: null },
    });
    if (claimed.count === 0) continue;
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
  // A release egyben olcsó reconciliation-pont is. Ez helyreállítja azt az
  // in-app értesítést is, amelynek lépése egy korábbi tranzakcióban már
  // megnyílt, de a commit utáni notification írás akkor elhasalt.
  await reconcileCampaignStepOpenings({
    campaignId: options?.campaignId,
    userId: options?.userId,
  });
  return released;
}

/**
 * Résztvevők haladásának inicializálása aktiváláskor (vagy utólagos
 * hozzáadáskor). Szabály: a selfet tartalmazó lépés "előre teljesítettnek"
 * számít, ha a usernek már van elfogadható self-eredménye – így a nem-fresh
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
  options?: { db?: Prisma.TransactionClient; emitNotifications?: boolean },
): Promise<CampaignStepOpening[]> {
  const db = options?.db ?? prisma;
  const openings: CampaignStepOpening[] = [];
  const campaign = await db.campaign.findUnique({
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
  if (!campaign || campaign.status !== "ACTIVE") return openings;

  const steps = getCampaignSteps(campaign);
  if (steps.length === 0 || campaign.participants.length === 0) return openings;

  // Kinek van már kész self-eredménye? (self-lépés fast-forwardhoz)
  // Újrafelvételi körben csak az aktiválás utáni eredmény számít.
  const userIds = campaign.participants.map((p) => p.userId);
  const selfDone = await db.assessmentResult.findMany({
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
      await db.campaignParticipant.update({
        where: { id: p.id },
        data: { currentStep, stepCompletions: completions },
      });
    }

    const openType = steps[currentStep];
    if (openType) {
      const opening = {
        userId: p.userId,
        campaignId: campaign.id,
        campaignName: campaign.name,
        stepType: openType,
      };
      openings.push(opening);
      if (options?.emitNotifications !== false) {
        await handleMeasurementStepOpened(opening);
      }
    }
  }
  return openings;
}
