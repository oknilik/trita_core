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

import { TRITAN_DIMENSION_FACETS, type TritanDimCode } from "@/lib/tritan";
import type { TeamRoleCode } from "@/lib/team-role-scoring";
import { dimStandardError } from "@/lib/psychometrics";

/** A results-oldal observer-szabálya: legalább 2 lezárt értékelés. */
export const DOSSIER_OBSERVER_MIN = 2;

/**
 * Önkép–külső kép eltérés-küszöb: a mérési hiba (SEM, rövid forma) alatt
 * a delta nem jel, hanem zaj — a korábbi fix 5 jóval a hiba alatt volt.
 * (A psychometrics-import a kérdésbankot is behúzza — kliens-komponens
 * futásidőben ne importálja ezt a modult, típusokat `import type`-pal vigyen.)
 */
export const DOSSIER_GAP_MIN_DELTA = Math.round(dimStandardError("short"));

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
  observerSuspectCount: number; // rater-minőség flaggel érintett értékelések (observer/rater-quality.ts) — csak darabszám
  observerShown: boolean;
  dims: DossierDimComparison[];
  topGaps: DossierDimComparison[]; // |delta| >= DOSSIER_GAP_MIN_DELTA (SEM), max 3
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
 * Observer-facetátlag a raterenkénti scores.facets JSON-okból
 * ({dim: {facetKód: 0–100}}). NULL, ha összesen DOSSIER_OBSERVER_MIN-nél
 * kevesebb válaszkészlet van. Egyébként facetenként LISTWISE: csak az az
 * érték kerül a kimenetbe, amelyhez legalább DOSSIER_OBSERVER_MIN
 * értékelőnél van szám — 1 fős „aggregátum" az egyéni választ fedné fel.
 * Hiánynál kulcs-kihagyás (facet és üresen maradt dimenzió is kimarad);
 * a facets nélküli (örökség) készletet tolerálja.
 */
export function computeObserverFacetAverages(
  order: TritanDimCode[],
  observerFacetSets: Array<Record<string, Record<string, number>> | undefined>,
): Record<string, Record<string, number>> | null {
  if (observerFacetSets.length < DOSSIER_OBSERVER_MIN) return null;

  const result: Record<string, Record<string, number>> = {};
  for (const code of order) {
    const facetCodes = TRITAN_DIMENSION_FACETS[code] ?? [];
    const dimResult: Record<string, number> = {};
    for (const facet of facetCodes) {
      let sum = 0;
      let n = 0;
      for (const set of observerFacetSets) {
        const v = set?.[code]?.[facet];
        if (typeof v === "number") {
          sum += v;
          n += 1;
        }
      }
      if (n >= DOSSIER_OBSERVER_MIN) dimResult[facet] = Math.round(sum / n);
    }
    if (Object.keys(dimResult).length > 0) result[code] = dimResult;
  }
  return result;
}

/**
 * Önkép vs. külső kép dimenziónként, TRITAN-sorrendben. Observer-átlag
 * nélkül (null) az observer/delta mezők null-ok. delta = observer − self.
 * Self-érték nélküli kód kimarad a sorokból (üres self → üres lista) —
 * a 0-s helyettesítés hamis −100-as deltát gyártana.
 */
export function computeDimComparisons(
  order: TritanDimCode[],
  selfDims: Record<string, number>,
  observerAvg: Record<string, number> | null,
): DossierDimComparison[] {
  return order.flatMap((code) => {
    const selfRaw = selfDims[code];
    if (typeof selfRaw !== "number") return [];
    const self = Math.round(selfRaw);
    const observer =
      observerAvg && typeof observerAvg[code] === "number"
        ? observerAvg[code]
        : null;
    return [
      {
        code,
        self,
        observer,
        delta: observer === null ? null : observer - self,
      },
    ];
  });
}

/**
 * A legnagyobb önkép–külső kép eltérések: |delta| szerint csökkenő, a
 * küszöb alattiakat (és az observer nélküli sorokat) kihagyva. A default
 * küszöb a mérési hiba (DOSSIER_GAP_MIN_DELTA) — paraméterrel felülírható.
 */
export function topGapDims(
  dims: DossierDimComparison[],
  n = 3,
  minAbsDelta = DOSSIER_GAP_MIN_DELTA,
): DossierDimComparison[] {
  return dims
    .filter((d) => d.delta !== null && Math.abs(d.delta) >= minAbsDelta)
    .sort((a, b) => Math.abs(b.delta!) - Math.abs(a.delta!))
    .slice(0, n);
}
