// ─────────────────────────────────────────────────────────────────────
// Norma-infrastruktúra — dimenzió-pontszám → populációs percentilis.
//
// Jelenleg NINCS aktív norma-tábla (ACTIVE_NORM_TABLE = null): a felület
// így semmit nem mutat, de a tábla feltöltésekor a percentilis-sorok
// automatikusan élesednek (DimensionAccordion). A táblát a pilot után a
// scripts/research/norms-from-results.ts kapuzott kimenetéből kell tölteni.
// A script csak explicit pilotkampány-scope, short forma, dokumentált forrás
// és n≥200 mellett bocsát ki jelöltet (version/source/n kötelező).
//
// Bank-mentes, kliens-oldalról is importálható modul.
// ─────────────────────────────────────────────────────────────────────

import type { HexacoCode } from "@/lib/hexaco";

export interface DimNorm {
  /** Minta-átlag a 0-100 skálán. */
  mean: number;
  /** Minta-szórás a 0-100 skálán (> 0). */
  sd: number;
}

export interface NormTable {
  /** Tábla-verzió (pl. "pilot-2026-09") — a megjelenítés hivatkozhat rá. */
  version: string;
  /** Honnan származik a minta (pl. "trita pilot, HU önkitöltők"). */
  source: string;
  /** Minta-elemszám. */
  n: number;
  /** Dimenziónkénti norma-paraméterek. */
  dims: Record<HexacoCode, DimNorm>;
}

export const ACTIVE_NORM_TABLE: NormTable | null = null;

export function hasNorms(): boolean {
  return ACTIVE_NORM_TABLE !== null;
}

/**
 * Standard normál eloszlásfüggvény Φ(z) — Abramowitz–Stegun 7.1.26
 * közelítés (|hiba| < 1.5e-7); percentilis-kerekítéshez bőven pontos.
 */
export function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

/**
 * Percentilis egy (mean, sd) normából, egészre kerekítve és 1..99 közé
 * vágva — "a kitöltők 0%-ánál / 100%-ánál magasabb" állítást sosem teszünk.
 * Érvénytelen normára (sd <= 0) null.
 */
export function percentileFromNorm(score: number, norm: DimNorm): number | null {
  if (!Number.isFinite(score) || !Number.isFinite(norm.mean) || norm.sd <= 0) {
    return null;
  }
  const p = Math.round(normalCdf((score - norm.mean) / norm.sd) * 100);
  return Math.min(99, Math.max(1, p));
}

/**
 * Percentilis egy dimenzió-pontszámra az aktív norma-táblából.
 * null, ha nincs aktív tábla vagy a dimenzió-kód ismeretlen — a hívó
 * felület ilyenkor nem renderel percentilis-sort.
 */
export function percentileForScore(dim: string, score: number): number | null {
  if (!ACTIVE_NORM_TABLE) return null;
  const norm = ACTIVE_NORM_TABLE.dims[dim as HexacoCode];
  if (!norm) return null;
  return percentileFromNorm(score, norm);
}
