import { prisma } from "@/lib/prisma";
import {
  isObserverAssociationMismatch,
  resolveObserverTokenLifecycle,
  toObserverTokenErrorCode,
  type ObserverTokenErrorCode,
} from "./token-validation";

export type LinkObserverTokenErrorCode = ObserverTokenErrorCode | "SELF_LINK_FORBIDDEN";

export type LinkObserverTokenResult =
  | {
      ok: true;
      invitationId: string;
      observerProfileId: string;
    }
  | {
      ok: false;
      code: LinkObserverTokenErrorCode;
    };

interface LinkObserverTokenOptions {
  token: string;
  profileId: string;
  now?: Date;
}

export async function linkObserverTokenToProfile(
  options: LinkObserverTokenOptions,
): Promise<LinkObserverTokenResult> {
  const invitation = await prisma.observerInvitation.findUnique({
    where: { token: options.token },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      inviterId: true,
      observerProfileId: true,
    },
  });

  if (!invitation) {
    return { ok: false, code: "INVALID_TOKEN" };
  }

  const lifecycle = resolveObserverTokenLifecycle(invitation, options.now);
  if (lifecycle !== "active") {
    return {
      ok: false,
      code: toObserverTokenErrorCode(lifecycle),
    };
  }

  // Self-guard: az ÉRTÉKELT (meghívó) nem claim-elheti a SAJÁT külső tokenjét
  // — a submit-oldali önhamisítás-tiltás (isObserverSelfSubmission) párja a
  // linkelésre. Enélkül a meghívó magához köthetné a tokent, ami az
  // addressee-alapú védelmeket zavarná össze.
  if (invitation.inviterId === options.profileId) {
    return { ok: false, code: "SELF_LINK_FORBIDDEN" };
  }

  if (isObserverAssociationMismatch(invitation.observerProfileId, options.profileId)) {
    return { ok: false, code: "OBSERVER_MISMATCH" };
  }

  if (invitation.observerProfileId !== options.profileId) {
    await prisma.observerInvitation.update({
      where: { id: invitation.id },
      data: { observerProfileId: options.profileId },
    });
  }

  return {
    ok: true,
    invitationId: invitation.id,
    observerProfileId: options.profileId,
  };
}

