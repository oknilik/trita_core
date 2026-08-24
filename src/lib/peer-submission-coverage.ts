import type { Prisma } from "@prisma/client";
import {
  getCampaignTeamIds,
  isStepOpenFor,
  type CampaignStepType,
} from "@/lib/campaign-steps-core";

type PeerSubmissionStep = Extract<
  CampaignStepType,
  "TRUST_360" | "TEAM_ROLE_360"
>;

export type PeerSubmissionGuardError =
  | "NOT_FOUND"
  | "CAMPAIGN_NOT_ACTIVE"
  | "STEP_LOCKED"
  | "NO_TARGET_TEAM";

export type PeerSubmissionGuardResult =
  | { ok: true; teamId: string }
  | { ok: false; error: PeerSubmissionGuardError };

/**
 * A peer-bekuldest es az azt koveto lefedettsegi dontest kampany + ertekelo
 * szinten serializalja. A CampaignParticipant sora kozos mindket peer
 * lepesnel, ezert stabil zar-kulcs akkor is, ha ket kulon cel observationje
 * egyszerre erkezik.
 *
 * PostgreSQL READ COMMITTED mellett a zarra varo masodik tranzakcio a zar
 * megszerzese utan mar latja az elso commitolt observationjet. A zar nelkul
 * mindket tranzakcio a masik sor nelkul szamolhatna, es egyik sem leptetne
 * tovabb a resztvevot.
 */
export async function lockPeerSubmissionCoverageDecision(
  db: Prisma.TransactionClient,
  campaignId: string,
  raterUserId: string,
): Promise<boolean> {
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "CampaignParticipant"
    WHERE "campaignId" = ${campaignId}
      AND "userId" = ${raterUserId}
    FOR UPDATE
  `;
  return rows.length > 0;
}

async function lockPeerSubmissionCampaign(
  db: Prisma.TransactionClient,
  campaignId: string,
): Promise<boolean> {
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "Campaign"
    WHERE "id" = ${campaignId}
    FOR SHARE
  `;
  return rows.length > 0;
}

/**
 * A gyors, tranzakción kívüli route-guard csak UX-optimalizáció. Mire egy
 * párhuzamos kérés megszerzi a résztvevő sorzárját, az előző beküldés már
 * tovább is léptethette a résztvevőt, lezárhatta a kampányt, vagy
 * megváltozhatott a célcsapata. Ezért a mutáció előtti autoritatív guard a
 * ZÁR MEGSZERZÉSE UTÁN újraolvassa a résztvevőt és a kampányt, majd ugyanabban
 * a tranzakcióban oldja fel a jelenlegi csapattagságot.
 */
export async function lockAndValidatePeerSubmission(
  db: Prisma.TransactionClient,
  campaignId: string,
  raterUserId: string,
  stepType: PeerSubmissionStep,
): Promise<PeerSubmissionGuardResult> {
  // Lock-sorrend: Campaign -> CampaignParticipant. Az aktiválás/lezárás is a
  // kampánysort módosítja először, ezért ez a sorrend kerüli a kereszt-zárat.
  // A FOR SHARE egymással kompatibilis, így külön értékelők beküldéseit nem
  // serializálja, de a kampány lezárása megvárja az éppen engedélyezett írást.
  const campaignLocked = await lockPeerSubmissionCampaign(db, campaignId);
  if (!campaignLocked) return { ok: false, error: "NOT_FOUND" };

  const locked = await lockPeerSubmissionCoverageDecision(
    db,
    campaignId,
    raterUserId,
  );
  if (!locked) return { ok: false, error: "NOT_FOUND" };

  // Fontos: ez az olvasás a FOR UPDATE után történik. READ COMMITTED mellett
  // így a záron váró kérés már az előző tranzakció commitolt lépését látja.
  const participant = await db.campaignParticipant.findUnique({
    where: { campaignId_userId: { campaignId, userId: raterUserId } },
    select: {
      currentStep: true,
      nextStepOpensAt: true,
      campaign: {
        select: {
          status: true,
          type: true,
          steps: true,
          teamId: true,
          teamIds: true,
        },
      },
    },
  });
  if (!participant) return { ok: false, error: "NOT_FOUND" };
  if (participant.campaign.status !== "ACTIVE") {
    return { ok: false, error: "CAMPAIGN_NOT_ACTIVE" };
  }
  if (!isStepOpenFor(participant.campaign, participant, stepType)) {
    return { ok: false, error: "STEP_LOCKED" };
  }

  const campaignTeamIds = getCampaignTeamIds(participant.campaign);
  if (campaignTeamIds.length === 0) {
    return { ok: false, error: "NO_TARGET_TEAM" };
  }
  const memberships = await db.teamMember.findMany({
    where: {
      userId: raterUserId,
      teamId: { in: campaignTeamIds },
    },
    select: { teamId: true },
  });
  const memberTeamIds = new Set(
    memberships.map((membership) => membership.teamId),
  );
  const teamId = campaignTeamIds.find((candidate) => memberTeamIds.has(candidate));
  if (!teamId) return { ok: false, error: "NO_TARGET_TEAM" };

  return { ok: true, teamId };
}

/**
 * Egy peer-lepes akkor teljes, ha az ertekelo az aktualis celcsapat minden
 * mas tagjarol adott visszajelzest. A regi/kilepett tagok observationjei nem
 * potolhatnak egy hianyzo aktualis tagot, a duplikalt azonosito pedig nem
 * novelheti a lefedettseget.
 */
export function hasCoveredCurrentPeerTargets(
  currentMemberIds: Iterable<string>,
  raterUserId: string,
  ratedUserIds: Iterable<string>,
): boolean {
  const coverage = countCoveredCurrentPeerTargets(
    currentMemberIds,
    raterUserId,
    ratedUserIds,
  );

  // Peer nelkuli csapatban nincs ertelmezheto 360 fokos kor; az eddigi
  // route-viselkedessel osszhangban ezt nem tekintjuk automatikusan kesznek.
  return coverage.total > 0 && coverage.done === coverage.total;
}

/**
 * Ugyanaz a halmazmetszet adja a reszhaladas szamlalojat, mint a completion
 * guard donteset. Igy stale/kilepett cel, masik teamId-ju sor vagy duplikalt
 * azonosito a UI-ban sem mutathat hamis 3/3 allapotot.
 */
export function countCoveredCurrentPeerTargets(
  currentMemberIds: Iterable<string>,
  raterUserId: string,
  ratedUserIds: Iterable<string>,
): { done: number; total: number } {
  const targetIds = new Set(currentMemberIds);
  targetIds.delete(raterUserId);
  const ratedIds = new Set(ratedUserIds);
  let done = 0;
  for (const targetId of targetIds) {
    if (ratedIds.has(targetId)) done += 1;
  }
  return { done, total: targetIds.size };
}
