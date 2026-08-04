// ─────────────────────────────────────────────────────────────────────
// Observer-folyamat állapota a SELF-felületekhez (self/csapat szétválasztás,
// 2026-07-22 döntés).
//
// Consulting-led módban a szervezeti tag külső visszajelzése NEM személyes
// feladat, hanem csapat-folyamat: kampányhoz kötött, a szervezet indítja.
// A személyes felületek ezért nem „hiányként" mutatják, hanem állapotként:
//   - self_serve:  nem org-tag (vagy self-serve mód) → marad a személyes
//                  meghívó-flow, változatlanul.
//   - locked:      org-tag, még nincs observer-kampány → információs kártya.
//   - in_progress: aktív kampány observer-lépéssel → beérkezés-számláló.
//   - available:   a küszöb (OBSERVER_MIN_FOR_REVEAL) elérve → az önkép–
//                  külső kép összevetés megnyitható.
// ─────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import { InvitationStatus } from "@prisma/client";
import { isConsultingLed } from "@/lib/operating-mode";

/**
 * Ennyi beérkezett visszajelzésnél nyílik meg az önkép–külső kép összevetés
 * kampány-vezérelt (org) módban. Szakmai indok: a termék minden más mérése
 * (trust-kör, pulse, peer-szerepek) 3-as anonimitás-küszöböt ígér — két
 * értékelőnél a kitöltő félig beazonosítható, ami visszahat az őszinteségre.
 */
export const OBSERVER_MIN_FOR_REVEAL = 3;

export type ObserverFlowState = "self_serve" | "locked" | "in_progress" | "available";

export interface ObserverFlowStatus {
  state: ObserverFlowState;
  receivedCount: number;
  minForReveal: number;
  activeCampaignName: string | null;
}

export async function resolveObserverFlowStatus(
  profileId: string,
): Promise<ObserverFlowStatus> {
  const [orgMembershipCount, receivedCount] = await Promise.all([
    prisma.organizationMember.count({
      where: { userId: profileId, leftAt: null, role: { not: "ORG_CONSULTANT" } },
    }),
    prisma.observerAssessment.count({
      where: {
        invitation: { inviterId: profileId, status: InvitationStatus.COMPLETED },
      },
    }),
  ]);

  const orgGoverned = isConsultingLed() && orgMembershipCount > 0;
  if (!orgGoverned) {
    return {
      state: "self_serve",
      receivedCount,
      minForReveal: OBSERVER_MIN_FOR_REVEAL,
      activeCampaignName: null,
    };
  }

  if (receivedCount >= OBSERVER_MIN_FOR_REVEAL) {
    return {
      state: "available",
      receivedCount,
      minForReveal: OBSERVER_MIN_FOR_REVEAL,
      activeCampaignName: null,
    };
  }

  // Aktív kampány observer-lépéssel, amiben a user résztvevő?
  // (Több-lépéses kampánynál a type az ELSŐ lépés — a steps-ben keresünk,
  // a legacy type-ot fallbackként; minta: team-report psych-safety lookup.)
  const participant = await prisma.campaignParticipant.findFirst({
    where: {
      userId: profileId,
      campaign: {
        status: "ACTIVE",
        OR: [{ steps: { has: "OBSERVER_360" } }, { type: "OBSERVER_360" }],
      },
    },
    orderBy: { addedAt: "desc" },
    select: { campaign: { select: { name: true } } },
  });

  return {
    state: participant ? "in_progress" : "locked",
    receivedCount,
    minForReveal: OBSERVER_MIN_FOR_REVEAL,
    activeCampaignName: participant?.campaign.name ?? null,
  };
}
