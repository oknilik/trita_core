import { prisma } from "./prisma";
import { getOrgSubscription, hasAccess, getPlanTier } from "./subscription";

/**
 * Hozzáférési szintek — alacsonyabbtól magasabbig.
 * A legmagasabb szintű hozzáférés nyer.
 */
export type AccessLevel =
  | "none"
  | "self_start"
  | "self_plus"
  | "self_reflect"
  | "team_scan"
  | "team_deep_dive"
  | "team_pulse"       // Fázis 2
  | "org_insight"      // Fázis 3
  | "org_growth"       // Fázis 3
  | "org_partner";     // Fázis 3

const ACCESS_HIERARCHY: AccessLevel[] = [
  "none", "self_start", "self_plus", "self_reflect",
  "team_scan", "team_deep_dive", "team_pulse",
  "org_insight", "org_growth", "org_partner",
];

function higherAccess(a: AccessLevel, b: AccessLevel): AccessLevel {
  return ACCESS_HIERARCHY.indexOf(a) >= ACCESS_HIERARCHY.indexOf(b) ? a : b;
}

/**
 * User egyéni hozzáférési szintje.
 */
export async function getSelfAccessLevel(userProfileId: string): Promise<AccessLevel> {
  const selfPurchase = await prisma.purchase.findFirst({
    where: {
      userProfileId,
      status: "completed",
      tier: { in: ["self_plus", "self_reflect"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (selfPurchase) return selfPurchase.tier as AccessLevel;

  const teamPurchase = await prisma.purchase.findFirst({
    where: {
      userProfileId,
      status: "completed",
      tier: { in: ["team_scan", "team_deep_dive"] },
    },
  });

  if (teamPurchase) return "self_plus";

  return "self_start";
}

/**
 * User hozzáférési szintje egy adott csapathoz.
 */
export async function getTeamAccessLevel(userProfileId: string, teamId: string): Promise<AccessLevel> {
  let level: AccessLevel = "none";

  // 1. Org subscription (meglévő rendszer)
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { orgId: true },
  });

  if (team?.orgId) {
    const sub = await getOrgSubscription(team.orgId);
    if (sub && hasAccess(sub)) {
      const tier = getPlanTier(sub);
      if (tier === "org" || tier === "scale") {
        level = higherAccess(level, "org_insight");
      } else if (tier === "team") {
        level = higherAccess(level, "team_pulse");
      }
    }
  }

  // 2. One-time purchase a csapatra
  const teamPurchases = await prisma.purchase.findMany({
    where: {
      teamId,
      status: "completed",
      tier: { in: ["team_scan", "team_deep_dive"] },
    },
  });

  for (const p of teamPurchases) {
    level = higherAccess(level, p.tier as AccessLevel);
  }

  return level;
}

/**
 * Van-e a csapatnak felhasználatlan beépített Advisory session-je?
 */
export async function hasUnusedAdvisorySession(teamId: string): Promise<boolean> {
  const purchase = await prisma.purchase.findFirst({
    where: {
      teamId,
      tier: "team_deep_dive",
      status: "completed",
      includesAdvisory: true,
      advisoryUsed: false,
    },
  });
  return !!purchase;
}

/**
 * Jelöld meg a beépített Advisory session-t felhasználtként.
 */
export async function markAdvisoryUsed(teamId: string): Promise<void> {
  const purchase = await prisma.purchase.findFirst({
    where: {
      teamId,
      tier: "team_deep_dive",
      status: "completed",
      includesAdvisory: true,
      advisoryUsed: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (purchase) {
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { advisoryUsed: true },
    });
  }
}

/**
 * Van-e a usernek legalább az adott szintű hozzáférése?
 */
export function hasMinAccess(current: AccessLevel, required: AccessLevel): boolean {
  return ACCESS_HIERARCHY.indexOf(current) >= ACCESS_HIERARCHY.indexOf(required);
}

/**
 * Mi a következő természetes upgrade a jelenlegi szintről?
 */
export function getNextUpgrade(current: AccessLevel): { tier: string; label: string } | null {
  switch (current) {
    case "none":
    case "self_start":
      return { tier: "self_plus", label: "Self Plus (€49)" };
    case "self_plus":
    case "self_reflect":
      return { tier: "team_scan", label: "Team Scan (€490)" };
    case "team_scan":
      return { tier: "team_deep_dive", label: "Team Deep Dive (€990)" };
    case "team_deep_dive":
      return { tier: "team_pulse", label: "Team Pulse (€149/hó)" };
    case "team_pulse":
      return { tier: "org_insight", label: "Org Insight (€4 900/év)" };
    default:
      return null;
  }
}
