// ─────────────────────────────────────────────────────────────────────
// Vendég-teaser pontozás (/try záróoldal).
//
// A vendég válaszai csak localStorage-ban élnek (szerverre a claim előtt
// semmi nem megy) — az azonnali eredmény-ízelítőhöz ezért a pontozás
// kliens-oldalon fut. Hogy a ~1000 soros kérdésbank ne kerüljön a kliens
// bundle-be, a szerver-oldali oldal csak a minimális pontozási metát adja
// át (item-id → dimenzió + fordítottság), a számítás pedig a scoring.ts
// Likert-formuláját követi: fordított item 6−v, dimenzió-pontszám
// ((átlag − 1) / 4) × 100, kerekítve.
// ─────────────────────────────────────────────────────────────────────

export interface TeaserScoringMetaItem {
  id: number;
  dimension: string;
  reversed: boolean;
}

export interface GuestTeaserScores {
  /** Belső dimenziókód (INTE/RESO/…) → 0–100 pontszám. */
  dimensions: Record<string, number>;
  /** Pontszám szerint csökkenő dimenzió-lista (holtversenynél kód szerint stabil). */
  ranked: Array<{ code: string; score: number }>;
}

/**
 * A vendég-draft pontozása a szerverről kapott meta alapján.
 * `null`, ha a válaszkészlet hiányos vagy érvénytelen — ilyenkor a
 * záróoldal teaser nélkül, a korábbi viselkedéssel renderel.
 */
export function computeGuestTeaserScores(
  meta: ReadonlyArray<TeaserScoringMetaItem>,
  answers: Record<number, number> | null | undefined,
): GuestTeaserScores | null {
  if (!answers || meta.length === 0) return null;

  const totals: Record<string, { sum: number; count: number }> = {};

  for (const item of meta) {
    const raw = answers[item.id];
    if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 1 || raw > 5) {
      return null;
    }
    const value = item.reversed ? 6 - raw : raw;
    const bucket = (totals[item.dimension] ??= { sum: 0, count: 0 });
    bucket.sum += value;
    bucket.count += 1;
  }

  const dimensions: Record<string, number> = {};
  for (const [code, { sum, count }] of Object.entries(totals)) {
    dimensions[code] = Math.round(((sum / count - 1) / 4) * 100);
  }

  const ranked = Object.entries(dimensions)
    .map(([code, score]) => ({ code, score }))
    .sort((a, b) => b.score - a.score || a.code.localeCompare(b.code));

  return { dimensions, ranked };
}
