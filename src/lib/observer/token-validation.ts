import type { InvitationStatus } from "@prisma/client";

export type ObserverTokenLifecycle =
  | "invalid_token"
  | "active"
  | "awaiting_approval"
  | "completed"
  | "canceled"
  | "expired";

export type ObserverTokenErrorCode =
  | "INVALID_TOKEN"
  | "ALREADY_USED"
  | "INVITE_CANCELED"
  | "INVITE_EXPIRED"
  | "INVITE_NOT_APPROVED"
  | "OBSERVER_MISMATCH";

export interface ObserverTokenSnapshot {
  status: InvitationStatus;
  expiresAt: Date;
  observerProfileId?: string | null;
}

export function resolveObserverTokenLifecycle(
  invitation: ObserverTokenSnapshot | null,
  now: Date = new Date(),
): ObserverTokenLifecycle {
  if (!invitation) return "invalid_token";
  if (invitation.status === "COMPLETED") return "completed";
  if (invitation.status === "CANCELED") return "canceled";
  if (invitation.status === "EXPIRED") return "expired";
  if (invitation.expiresAt < now) return "expired";
  // A jóváhagyásra váró (külső) meghívó NEM „aktív": a rater csak
  // jóváhagyott (PENDING) meghívóra küldhet be. Külön állapotként adjuk
  // vissza, hogy a beküldés-oldal 403-mal (INVITE_NOT_APPROVED) elutasítsa.
  if (invitation.status === "AWAITING_APPROVAL") return "awaiting_approval";
  return "active";
}

export function toObserverTokenErrorCode(
  lifecycle: Exclude<ObserverTokenLifecycle, "active">,
): ObserverTokenErrorCode {
  if (lifecycle === "invalid_token") return "INVALID_TOKEN";
  if (lifecycle === "completed") return "ALREADY_USED";
  if (lifecycle === "canceled") return "INVITE_CANCELED";
  if (lifecycle === "awaiting_approval") return "INVITE_NOT_APPROVED";
  return "INVITE_EXPIRED";
}

export function isObserverAssociationMismatch(
  invitationObserverProfileId: string | null | undefined,
  profileId: string,
): boolean {
  return Boolean(invitationObserverProfileId && invitationObserverProfileId !== profileId);
}

/**
 * Önhamisítás-védelem: a meghívó (értékelt) SOHA nem küldhet be a saját
 * meghívójára — semmilyen observer-típusnál (a külső/link-meghívónál sincs
 * observerProfileId, ezért az addressee-ellenőrzés önmagában nem fogja meg).
 * A beküldő feloldott profil-id-ját vetjük össze a meghívó inviterId-jával.
 */
export function isObserverSelfSubmission(
  viewerProfileId: string | null | undefined,
  inviterProfileId: string,
): boolean {
  return Boolean(viewerProfileId && viewerProfileId === inviterProfileId);
}
