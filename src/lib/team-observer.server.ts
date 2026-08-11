// ─────────────────────────────────────────────────────────────────────
// A csapat-szintű visszajelzési kultúra SZERVER-betöltője. A logika a
// Prisma-mentes `team-observer.ts`-ben él (a trust-network / member-dossier
// mintája szerint) — itt csak az adatgyűjtés van.
//
// HATÓKÖR-VÖRÖSVONAL: kizárólag KAMPÁNY-hatókörű observer-visszajelzés, és
// csak a csapat SAJÁT szervezetének kampányaiból. A tag privát (kampányon
// kívüli, személyes meghívós) visszajelzése a tagé — a manager-cockpit feed
// ugyanezt a határt húzza meg, és a csapatnézet sem törheti át.
// ─────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import { InvitationStatus } from "@prisma/client";
import { extractDimensionScores } from "@/lib/scoring";
import {
  computeTeamFeedbackCulture,
  type TeamFeedbackCulture,
  type TeamObserverMemberInput,
} from "@/lib/team-observer";

/**
 * @param orgId A csapat szervezete — a kampány-hatókör szűrője. `null`
 *   (org nélküli csapat) esetén nincs kampány, tehát nincs mit mutatni.
 */
export async function loadTeamFeedbackCulture(params: {
  orgId: string | null;
  members: Array<{ userId: string; scores: Record<string, number> | null }>;
}): Promise<TeamFeedbackCulture | null> {
  const { orgId, members } = params;
  if (!orgId || members.length === 0) return null;

  const userIds = members.map((m) => m.userId);
  const observerAssessments = await prisma.observerAssessment.findMany({
    where: {
      invitation: {
        inviterId: { in: userIds },
        status: InvitationStatus.COMPLETED,
        // A kampány-kötés a hatókör-vörösvonal: privát kör nem kerülhet be.
        campaign: { orgId },
      },
    },
    select: { scores: true, invitation: { select: { inviterId: true } } },
  });

  const setsByUser = new Map<string, Record<string, number>[]>();
  for (const assessment of observerAssessments) {
    // Kanonikus olvasó: az örökség-kulcsos (INTE/RESO/…) értékelések is
    // beszámítanak — nyers olvasással a régi körök némán kimaradnának.
    const dims = extractDimensionScores(assessment.scores);
    if (!dims) continue;
    const uid = assessment.invitation.inviterId;
    const list = setsByUser.get(uid) ?? [];
    list.push(dims);
    setsByUser.set(uid, list);
  }

  const input: TeamObserverMemberInput[] = members.map((m) => ({
    selfDims: m.scores,
    observerDimSets: setsByUser.get(m.userId) ?? [],
  }));

  return computeTeamFeedbackCulture(input);
}
