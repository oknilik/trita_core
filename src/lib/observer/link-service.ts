import { prisma } from "@/lib/prisma";
import {
  isObserverAssociationMismatch,
  resolveObserverTokenLifecycle,
  toObserverTokenErrorCode,
  type ObserverTokenErrorCode,
} from "./token-validation";

export type LinkObserverTokenResult =
  | {
      ok: true;
      invitationId: string;
      observerProfileId: string;
    }
  | {
      ok: false;
      code: ObserverTokenErrorCode;
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
      observerProfileId: true,
    },
  });

  const lifecycle = resolveObserverTokenLifecycle(invitation, options.now);
  if (lifecycle !== "active") {
    return {
      ok: false,
      code: toObserverTokenErrorCode(lifecycle),
    };
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

