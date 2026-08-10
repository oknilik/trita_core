// ─────────────────────────────────────────────────────────────────────
// Közös, TISZTA statisztikai segédek a csapat-réteg dimenzió-számításaihoz
// (átlag, szórás). Prisma-mentes, kliens-oldalon és unit-tesztben is
// importálható — ezért él külön modulban, nem a Prismát behúzó
// team-stats.ts-ben.
//
// Miért mintaszórás (Bessel-korrekció, ÷(n−1)) és nem populációs (÷n):
// egy csapat kitöltései a teljes viselkedés-populáció MINTÁJA, nem maga a
// populáció. A ÷n becslő a mintánál lefelé torzít (a szórást alábecsli);
// kis n-nél (n=3–8, a tipikus csapatméret) ez ~10–18% eltérés. A ÷(n−1)
// a torzítatlan becslő. Egyetlen elemből nincs értelmezhető szórás → 0.
// ─────────────────────────────────────────────────────────────────────

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Mintaszórás Bessel-korrekcióval (÷(n−1)). n < 2 → 0.
 */
export function sampleStdDev(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (n - 1);
  return Math.sqrt(variance);
}
