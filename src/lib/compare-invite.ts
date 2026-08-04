// ─────────────────────────────────────────────────────────────────────
// Valódi páros interakció-összehasonlítás (B1) — meghívó-életciklus.
//
// Elvek: a jutalom (az összehasonlítás) csak saját, teljes kitöltéssel
// nyílik meg mindkét félnek; kölcsönös consent; bármelyik fél bármikor
// visszavonhat; a partner számszerű pontszámai sosem jelennek meg a másik
// félnek — csak a szimuláció szövege és a glyph. Terv: tritanium.md (B1).
// ─────────────────────────────────────────────────────────────────────

export const COMPARE_INVITE_MAX_ACTIVE = 3;
export const COMPARE_INVITE_TTL_DAYS = 30;

export type CompareInviteState = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";

/**
 * A tárolt státusz + lejárat együttes feloldása. A lejárat lusta: a
 * PENDING sor EXPIRED-ként olvasódik a határidő után, külön írás nélkül
 * (az observer-invite mintája). ACCEPTED párra a lejárat nem vonatkozik.
 */
export function resolveCompareInviteState(
  invite: { status: string; expiresAt: Date },
  now: Date = new Date(),
): CompareInviteState {
  if (invite.status === "REVOKED") return "REVOKED";
  if (invite.status === "ACCEPTED") return "ACCEPTED";
  if (invite.status === "EXPIRED") return "EXPIRED";
  if (invite.expiresAt.getTime() <= now.getTime()) return "EXPIRED";
  return "PENDING";
}

export function compareInviteExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + COMPARE_INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}
