import { prisma } from "./prisma";
import { getOrgSubscription, hasAccess, getPlanTier } from "./subscription";
import { SELF_PAYWALL_ENABLED } from "./operating-mode";

/**
 * Hozzáférési szintek — alacsonyabbtól magasabbig.
 * A legmagasabb szintű hozzáférés nyer.
 */
export type AccessLevel =
  | "none"
  | "self_start"
  | "self_plus"
  | "team_snapshot"
  | "team_deep_dive"
  | "team_pulse"       // Fázis 2
  | "org_insight"      // Fázis 3
  | "org_growth"       // Fázis 3
  | "org_partner";     // Fázis 3

const ACCESS_HIERARCHY: AccessLevel[] = [
  "none", "self_start", "self_plus",
  "team_snapshot", "team_deep_dive", "team_pulse",
  "org_insight", "org_growth", "org_partner",
];

function higherAccess(a: AccessLevel, b: AccessLevel): AccessLevel {
  return ACCESS_HIERARCHY.indexOf(a) >= ACCESS_HIERARCHY.indexOf(b) ? a : b;
}

/**
 * User egyéni hozzáférési szintje.
 */
export async function getSelfAccessLevel(userProfileId: string): Promise<AccessLevel> {
  // Paywall kikapcsolva: mindenki a teljes egyéni riportot kapja.
  // Visszakapcsolás: operating-mode.ts → SELF_PAYWALL_ENABLED = true.
  if (!SELF_PAYWALL_ENABLED) return "self_plus";

  const [selfPurchase, orgMembership, teamMembership] = await Promise.all([
    prisma.purchase.findFirst({
      where: {
        userProfileId,
        status: "completed",
        tier: { in: ["self_plus"] },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.organizationMember.findFirst({
      where: { userId: userProfileId, leftAt: null },
      select: { id: true },
    }),
    prisma.teamMember.findFirst({
      where: { userId: userProfileId },
      select: { id: true },
    }),
  ]);

  if (selfPurchase) return selfPurchase.tier as AccessLevel;

  // Team/org context includes self plus-level access for personal profile surfaces.
  if (orgMembership || teamMembership) return "self_plus";

  const teamPurchase = await prisma.purchase.findFirst({
    where: {
      userProfileId,
      status: "completed",
      tier: { in: ["team_snapshot", "team_deep_dive"] },
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
      tier: { in: ["team_snapshot", "team_deep_dive"] },
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
 * (getNextUpgrade törölve 2026-07-14 — nem volt fogyasztója; a parkolt
 * billing-világ árlistája a billing-v1-parked tagben él.)
 */
