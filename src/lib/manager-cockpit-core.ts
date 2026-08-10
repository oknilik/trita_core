// ─────────────────────────────────────────────────────────────────────
// Manager-cockpit — TISZTA összegző logika (prisma-mentes, unit-tesztelhető).
// A DB-betöltés a manager-cockpit.ts-ben él; itt az él-megoszlás számítása
// és a csapat-rendezés / primary-választás szabálya lakik.
// ─────────────────────────────────────────────────────────────────────

import type { DynamicsEdgeType } from "./friction-model";

export interface DynamicsEdgeSplit {
  alignedCount: number;
  complementaryCount: number;
  frictionCount: number;
  /** Mért kapcsolati élek — trust-kör (vagy örökség observer) forrásból. */
  measuredEdgeCount: number;
  /** Becsült élek — profil-alapú (profile_estimate) forrásból. */
  estimatedEdgeCount: number;
}

/**
 * Él-típus darabszámok + mért/becsült forrás-megoszlás EGY menetben.
 * A "mért" definíció a team-report.ts-sel azonos: `trust_round` VAGY a
 * régi `observer` forrás; minden más (profile_estimate) becslés — így a
 * cockpit és a csapatriport ugyanazt a számot mutatja.
 */
export function splitDynamicsEdges(
  edges: ReadonlyArray<{ type: DynamicsEdgeType; source: string }>,
): DynamicsEdgeSplit {
  const split: DynamicsEdgeSplit = {
    alignedCount: 0,
    complementaryCount: 0,
    frictionCount: 0,
    measuredEdgeCount: 0,
    estimatedEdgeCount: 0,
  };
  for (const edge of edges) {
    if (edge.type === "aligned") split.alignedCount++;
    else if (edge.type === "complementary") split.complementaryCount++;
    else if (edge.type === "friction") split.frictionCount++;
    if (edge.source === "trust_round" || edge.source === "observer") {
      split.measuredEdgeCount++;
    } else {
      split.estimatedEdgeCount++;
    }
  }
  return split;
}

/**
 * Cockpit-rendezés: legalacsonyabb kitöltöttség előre (oda kell a figyelem).
 * Stabil — azonos kitöltöttségnél a betöltési sorrend marad; a bemenetet
 * nem mutálja.
 */
export function sortTeamsByCompletion<T extends { completionPct: number }>(
  teams: readonly T[],
): T[] {
  return [...teams].sort((a, b) => a.completionPct - b.completionPct);
}

/**
 * A cockpit "primary" (részletesen renderelt) csapata: a RENDEZETT lista
 * első eleme. Az oldal a kártyalista elejét és a részletes szekciókat
 * (tag-lista, dinamika-számok) ugyanarra a csapatra érti — korábban a
 * rendezés ELŐTTI lista [0]-ja volt, ami eltérő csapatot mutathatott.
 */
export function pickPrimaryTeam<T extends { completionPct: number }>(
  teams: readonly T[],
): T | null {
  return sortTeamsByCompletion(teams)[0] ?? null;
}
