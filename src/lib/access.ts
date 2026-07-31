import { prisma } from "./prisma";
import { SELF_PAYWALL_ENABLED } from "./operating-mode";

/**
 * Hozzáférési szintek — alacsonyabbtól magasabbig.
 * A legmagasabb szintű hozzáférés nyer.
 *
 * A szintek NEVEI a korábbi, dobozos árazásból maradtak (Self Plus, Team
 * Snapshot…). Maga az árazási modell 2026-07-31-én kivezetésre került: a
 * hozzáférést ma a szervezeti/csapat-tagság adja, nem vásárlás. A nevek
 * lecserélése külön kör, mert 30+ helyen jelennek meg a felületen is.
 */
export type AccessLevel =
  | "none"
  | "self_start"
  | "self_plus"
  | "team_snapshot"
  | "team_deep_dive"
  | "team_pulse"
  | "org_insight"
  | "org_growth"
  | "org_partner";

const ACCESS_HIERARCHY: AccessLevel[] = [
  "none", "self_start", "self_plus",
  "team_snapshot", "team_deep_dive", "team_pulse",
  "org_insight", "org_growth", "org_partner",
];

/**
 * User egyéni hozzáférési szintje.
 *
 * A `Purchase`-alapú ág 2026-07-31-én megszűnt a modellel együtt (0 sor
 * mindhárom adatbázisban, a fizetés a platformon kívül történik). Ha a
 * paywall valaha visszakapcsol, a szervezeti/csapat-tagság adja a teljes
 * szintet — vásárlás-ellenőrzés nincs.
 */
export async function getSelfAccessLevel(userProfileId: string): Promise<AccessLevel> {
  // Paywall kikapcsolva: mindenki a teljes egyéni riportot kapja.
  // Visszakapcsolás: operating-mode.ts → SELF_PAYWALL_ENABLED = true.
  if (!SELF_PAYWALL_ENABLED) return "self_plus";

  const [orgMembership, teamMembership] = await Promise.all([
    prisma.organizationMember.findFirst({
      where: { userId: userProfileId, leftAt: null },
      select: { id: true },
    }),
    prisma.teamMember.findFirst({
      where: { userId: userProfileId },
      select: { id: true },
    }),
  ]);

  // A csapat-/org-tagság a személyes felületeken teljes szintet ad.
  if (orgMembership || teamMembership) return "self_plus";

  return "self_start";
}

/**
 * Van-e a usernek legalább az adott szintű hozzáférése?
 */
export function hasMinAccess(current: AccessLevel, required: AccessLevel): boolean {
  return ACCESS_HIERARCHY.indexOf(current) >= ACCESS_HIERARCHY.indexOf(required);
}
