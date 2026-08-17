import { createHash } from "node:crypto";

const COMPARISON_DIMENSIONS = ["H", "E", "X", "A", "C", "O"] as const;

export interface TeamReportComparisonContributor {
  /** Csapaton belül stabil, egyirányú pszeudonim kulcs; nem nyers user ID. */
  key: string;
  /** A publikáláskor befagyasztott, összehasonlításhoz szükséges dimenziók. */
  dimensions: Record<string, number>;
}

export interface TeamReportComparisonBasis {
  version: 1;
  contributors: TeamReportComparisonContributor[];
}

/**
 * Stabil, csapat-specifikus közreműködő-kulcs riport-pillanatképekhez.
 *
 * A kulcs SHA-256(teamId + userId), domain-szeparált alakja. A UserProfile ID
 * nagy entrópiájú cuid, így a digest riport-hozzáférésből nem fejthető vissza;
 * a teamId miatt ugyanaz a személy más csapatban más kulcsot kap. Ez
 * pszeudonimizálás, nem anonimizálás — ezért a teljes comparisonBasis csak a
 * tanácsadói szerializációban jelenhet meg (team-report.ts redakciós kapu).
 */
export function teamReportContributorKey(teamId: string, userId: string): string {
  return createHash("sha256")
    .update("trita-team-report-contributor-v1\0")
    .update(teamId)
    .update("\0")
    .update(userId)
    .digest("hex");
}

/**
 * A stabil-mag újraszámításához szükséges minimális, befagyasztott alap.
 * Csak a hat fő dimenziót tartja meg; név, email, raw item és user ID nincs
 * benne. A sorrend determinisztikus, így a snapshot és a teszt diffje stabil.
 */
export function buildTeamReportComparisonBasis(
  teamId: string,
  members: ReadonlyArray<{
    userId: string;
    scores: Record<string, number> | null;
  }>,
): TeamReportComparisonBasis {
  const contributors = members
    .flatMap((member): TeamReportComparisonContributor[] => {
      if (!member.scores) return [];
      const dimensions: Record<string, number> = {};
      for (const code of COMPARISON_DIMENSIONS) {
        const value = member.scores[code];
        if (typeof value === "number" && Number.isFinite(value)) {
          dimensions[code] = value;
        }
      }
      if (Object.keys(dimensions).length === 0) return [];
      return [{
        key: teamReportContributorKey(teamId, member.userId),
        dimensions,
      }];
    })
    .sort((a, b) => a.key.localeCompare(b.key));

  return { version: 1, contributors };
}
