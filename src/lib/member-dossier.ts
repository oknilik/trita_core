// ─────────────────────────────────────────────────────────────────────
// Tag-dossié — TISZTA típusok + logika (Prisma-mentes, kliens-oldalon is
// importálható; a szerver-betöltő a member-dossier.server.ts-ben él, a
// trust-network.ts / team-role-peer.ts mintája szerint).
//
// A dossié egy szervezeti tag READ-ONLY összesítője kizárólag tanácsadói
// felületre. Láthatósági vörös vonalak (az assemblerben és a nézetben is
// tartandók): irányított trust-válasz SOHA; pszich. biztonság pulse SOHA
// személyi nézetben; anonim peer feedback tartalma SOHA (csak darabszám);
// observer egyéni válasz SOHA (csak aggregátum, min. DOSSIER_OBSERVER_MIN).
// ─────────────────────────────────────────────────────────────────────

import { HEXACO_DIMENSION_FACETS, type HexacoCode } from "@/lib/hexaco";
import type { TeamRoleCode } from "@/lib/team-role-scoring";
import { diffStandardError } from "@/lib/psychometrics";
import { MIN_RATERS_FOR_ANONYMOUS_AGGREGATE } from "@/lib/anonymity";

/**
 * Observer-aggregátum megjelenítési küszöbe a dossiéban: a kanonikus
 * anonimitás-padló (az observer egyéni válasza így sem közvetve nem
 * fejthető vissza — admin/tanácsadói nézetben sem).
 */
export const DOSSIER_OBSERVER_MIN = MIN_RATERS_FOR_ANONYMOUS_AGGREGATE;

/**
 * Önkép–külső kép eltérés-küszöb: az önkép és a külső (observer) átlag KÉT
 * FÜGGETLEN mérés, a különbségük hibája ezért √2·SEM (diffStandardError), nem
 * 1×SEM — ez alatt a delta nem jel, hanem zaj. (A korábbi 1×SEM ~40%-kal
 * alul-becsülte, így a mérési hibán belüli deltákat is „vakfoltként" hozta fel.)
 * BELSŐ küszöb: eldönti, mikor NE emeljünk ki eltérést; a felületen mérési-hiba
 * szám nem jelenik meg (2026-08-11 termék-döntés). ÉRTÉKE SZÁRMAZTATOTT, nem
 * literál: a 2026-08-11-i MÉRT reliabilitás-konstansokkal (r̄ = 0,264,
 * SD = 16,2 — ld. psychometrics.ts forrás-blokk) 14 → 11 lett. A psychometrics-import a
 * kérdésbankot is behúzza — kliens-komponens futásidőben ne importálja ezt a
 * modult, típusokat `import type`-pal vigyen.
 */
export const DOSSIER_GAP_MIN_DELTA = Math.round(diffStandardError("short"));

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
  code: HexacoCode;
  self: number;
  observer: number | null; // null = küszöb alatt
  delta: number | null; // observer - self
}

export interface DossierFacetComparison {
  dimensionCode: HexacoCode;
  code: string;
  self: number;
  observer: number | null; // null = küszöb alatt / nincs facet-lefedettség
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
  facets: DossierFacetComparison[];
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
  order: HexacoCode[],
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
    // Az anonimitás-padló PER-ÉRTÉK érvényes, nem csak a készletek számára:
    // ha egy dimenziót csak 1–2 értékelő adott meg (a többi kihagyta), akkor a
    // „csoportátlag" valójában 1–2 ember konkrét válasza lenne. Ugyanaz a
    // listwise szabály, mint a facet-siblingben (computeObserverFacetAverages).
    if (n >= DOSSIER_OBSERVER_MIN) result[code] = Math.round(sum / n);
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
  order: HexacoCode[],
  observerFacetSets: Array<Record<string, Record<string, number>> | undefined>,
): Record<string, Record<string, number>> | null {
  if (observerFacetSets.length < DOSSIER_OBSERVER_MIN) return null;

  const result: Record<string, Record<string, number>> = {};
  for (const code of order) {
    const facetCodes = HEXACO_DIMENSION_FACETS[code] ?? [];
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
  order: HexacoCode[],
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
 * Önkép vs. külső kép facetenként, dimenzió- és kérdésbank-sorrendben.
 * Csak a valóban mért self-facetek kerülnek ki; a külső érték hiánya null,
 * nem 0. Az observer-oldali anonimitás-padlót a hívó által átadott,
 * `computeObserverFacetAverages`-szel képzett aggregátum garantálja.
 */
export function computeFacetComparisons(
  order: HexacoCode[],
  selfFacets: Record<string, Record<string, number>>,
  observerAvg: Record<string, Record<string, number>> | null,
): DossierFacetComparison[] {
  return order.flatMap((dimensionCode) =>
    (HEXACO_DIMENSION_FACETS[dimensionCode] ?? []).flatMap((code) => {
      const selfRaw = selfFacets[dimensionCode]?.[code];
      if (typeof selfRaw !== "number") return [];
      const self = Math.round(selfRaw);
      const observerRaw = observerAvg?.[dimensionCode]?.[code];
      const observer = typeof observerRaw === "number" ? observerRaw : null;
      return [{
        dimensionCode,
        code,
        self,
        observer,
        delta: observer === null ? null : observer - self,
      }];
    }),
  );
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
