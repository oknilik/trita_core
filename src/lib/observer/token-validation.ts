import type { InvitationStatus } from "@prisma/client";

export type ObserverTokenLifecycle =
  | "invalid_token"
  | "active"
  | "completed"
  | "canceled"
  | "expired";

export type ObserverTokenErrorCode =
  | "INVALID_TOKEN"
  | "ALREADY_USED"
  | "INVITE_CANCELED"
  | "INVITE_EXPIRED"
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
  return "active";
}

export function toObserverTokenErrorCode(
  lifecycle: Exclude<ObserverTokenLifecycle, "active">,
): ObserverTokenErrorCode {
  if (lifecycle === "invalid_token") return "INVALID_TOKEN";
  if (lifecycle === "completed") return "ALREADY_USED";
  if (lifecycle === "canceled") return "INVITE_CANCELED";
  return "INVITE_EXPIRED";
}

export function isObserverAssociationMismatch(
  invitationObserverProfileId: string | null | undefined,
  profileId: string,
): boolean {
  return Boolean(invitationObserverProfileId && invitationObserverProfileId !== profileId);
}
