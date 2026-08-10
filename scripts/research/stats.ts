// ─────────────────────────────────────────────────────────────────────
// Kis, tiszta statisztikai segédek a research-/kalibrációs scriptekhez.
// Prisma-mentes; SZÁNDÉKOSAN mintavételi (n−1) szórást számol — a norma-
// tábla és a kalibráció populáció-becslés, nem a src alatti (÷n) motorok
// leírója. Üres/elégtelen bemenetre NaN-t ad, a formázó „–"-t ír belőle.
// ─────────────────────────────────────────────────────────────────────

export function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Mintavételi szórás (n−1 nevező). n < 2 esetén NaN. */
export function sampleSd(values: readonly number[]): number {
  if (values.length < 2) return Number.NaN;
  const m = mean(values);
  const ss = values.reduce((sum, v) => sum + (v - m) * (v - m), 0);
  return Math.sqrt(ss / (values.length - 1));
}

/**
 * Percentilis lineáris interpolációval (R type-7, az elterjedt default).
 * p: 0–100. Üres bemenetre NaN; belül rendez, a bemenetet nem módosítja.
 */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = ((sorted.length - 1) * p) / 100;
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  const frac = idx - lower;
  return sorted[lower] + frac * (sorted[upper] - sorted[lower]);
}

export function median(values: readonly number[]): number {
  return percentile(values, 50);
}

export function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** Szám formázása táblázatba — nem-véges értékre (NaN, ±∞) „–". */
export function fmt(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "–";
  return value.toFixed(digits);
}

/** Egész százalék szövegként; 0 nevezőre „–". */
export function pct(count: number, total: number): string {
  if (total <= 0) return "–";
  return `${Math.round((count / total) * 100)}%`;
}
