// ─────────────────────────────────────────────────────────────────────
// Tag-dossié — TISZTA típusok + logika (Prisma-mentes, kliens-oldalon is
// importálható; a szerver-betöltő a member-dossier.server.ts-ben él, a
// trust-network.ts / team-role-peer.ts mintája szerint).
//
// A dossié egy szervezeti tag READ-ONLY összesítője org admin + tanácsadó
// számára. Láthatósági vörös vonalak (az assemblerben és a nézetben is
// tartandók): irányított trust-válasz SOHA; pszich. biztonság pulse SOHA
// személyi nézetben; anonim peer feedback tartalma SOHA (csak darabszám);
// observer egyéni válasz SOHA (csak aggregátum, min. DOSSIER_OBSERVER_MIN).
// ─────────────────────────────────────────────────────────────────────

import type { TritanDimCode } from "@/lib/tritan";
import type { TeamRoleCode } from "@/lib/team-role-scoring";

/** A results-oldal observer-szabálya: legalább 2 lezárt értékelés. */
export const DOSSIER_OBSERVER_MIN = 2;

export type DossierMeasurementKey =
  | "self"
  | "observer"
  | "teamRoleSelf"
  | "teamRolePeer"
  | "trustGiven"
  | "peerFeedback";

export interface DossierMeasurementStatus {
  key: DossierMeasurementKey;
  lastAt: string | null; // ISO
  count: number;
}

export interface DossierActiveCampaign {
  campaignId: string;
  name: string;
  currentStepType: string | null; // null = minden lépés kész
  stepIndex: number;
  stepCount: number;
}

export interface DossierHeader {
  userId: string;
  displayName: string;
  email: string | null;
  orgRole: string;
  joinedAt: string | null;
  teams: { id: string; name: string }[];
}

export interface DossierDimComparison {
  code: TritanDimCode;
  self: number;
  observer: number | null; // null = küszöb alatt
  delta: number | null; // observer - self
}

export interface DossierSelfVsExternal {
  hasSelf: boolean;
  selfCompletedAt: string | null;
  selfRoundCount: number;
  observerCount: number;
  observerShown: boolean;
  dims: DossierDimComparison[];
  topGaps: DossierDimComparison[]; // |delta| >= 5, max 3
  teamRole: {
    selfTop: { role: TeamRoleCode; score: number }[] | null;
    selfCompletedAt: string | null;
    peerRaterCount: number;
    peerTop: { role: TeamRoleCode; score: number }[]; // üres küszöb alatt
  };
}

export type DossierEdgeType = "aligned" | "complementary" | "friction";

export interface DossierEdge {
  otherUserId: string;
  otherName: string;
  type: DossierEdgeType;
  measured: boolean; // true = trust-körből; false = becslés
  mutual: boolean | null; // csak mért élnél értelmezett
}

export interface DossierTeamEmbeddedness {
  teamId: string;
  teamName: string;
  inboundCount: number;
  inboundMean: number | null; // null küszöb (TRUST_MIN_RATERS) alatt
  strongEdgeCount: number;
  isHub: boolean;
  isIsolated: boolean;
  edges: DossierEdge[];
}

export interface DossierFeedbackItem {
  kind: string;
  message: string;
  fromName: string;
  teamName: string;
  createdAt: string;
}

export interface DossierFeedback {
  namedItems: DossierFeedbackItem[]; // legfrissebb elöl, max 20
  anonymousCount: number; // tartalom SOHA
}

export interface SerializedMemberDossier {
  header: DossierHeader;
  participation: {
    statuses: DossierMeasurementStatus[];
    activeCampaigns: DossierActiveCampaign[];
  };
  selfVsExternal: DossierSelfVsExternal;
  embeddedness: DossierTeamEmbeddedness[];
  feedback: DossierFeedback;
  generatedAt: string;
}

// ── Tiszta függvények (unit-tesztelt) ────────────────────────────────

/**
 * Observer-dimenzióátlag. NULL, ha DOSSIER_OBSERVER_MIN-nél kevesebb
 * válaszkészlet van (az egyéni értékelő nem azonosítható). Egyébként
 * dimenziónként kerekített átlag; a hiányzó dimenziót az adott készletben
 * kihagyja (csak a jelenlévő értékekből számol átlagot).
 */
export function computeObserverAverage(
  order: TritanDimCode[],
  observerDimSets: Record<string, number>[],
): Record<string, number> | null {
  if (observerDimSets.length < DOSSIER_OBSERVER_MIN) return null;

  const result: Record<string, number> = {};
  for (const code of order) {
    let sum = 0;
    let n = 0;
    for (const set of observerDimSets) {
      const v = set[code];
      if (typeof v === "number") {
        sum += v;
        n += 1;
      }
    }
    if (n > 0) result[code] = Math.round(sum / n);
  }
  return result;
}

/**
 * Önkép vs. külső kép dimenziónként, TRITAN-sorrendben. Observer-átlag
 * nélkül (null) az observer/delta mezők null-ok. delta = observer − self.
 * Üres self → üres lista.
 */
export function computeDimComparisons(
  order: TritanDimCode[],
  selfDims: Record<string, number>,
  observerAvg: Record<string, number> | null,
): DossierDimComparison[] {
  if (Object.keys(selfDims).length === 0) return [];

  return order.map((code) => {
    const self = Math.round(selfDims[code] ?? 0);
    const observer =
      observerAvg && typeof observerAvg[code] === "number"
        ? observerAvg[code]
        : null;
    return {
      code,
      self,
      observer,
      delta: observer === null ? null : observer - self,
    };
  });
}

/**
 * A legnagyobb önkép–külső kép eltérések: |delta| szerint csökkenő, a
 * küszöb alattiakat (és az observer nélküli sorokat) kihagyva.
 */
export function topGapDims(
  dims: DossierDimComparison[],
  n = 3,
  minAbsDelta = 5,
): DossierDimComparison[] {
  return dims
    .filter((d) => d.delta !== null && Math.abs(d.delta) >= minAbsDelta)
    .sort((a, b) => Math.abs(b.delta!) - Math.abs(a.delta!))
    .slice(0, n);
}
