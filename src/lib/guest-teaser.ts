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

import { rankDimensionScores, TRITAN_ORDER } from "./tritan";

// Csak a hat kanonikus dimenzió (TRITAN_ORDER) szerepel a teaser-kimenetben.
//
// 2026-08-11: korábban a kiegészítő altruizmus-skála (`I`) pontszáma BENNE
// maradt a `dimensions` mapben, és csak a `ranked` szűrte ki — a típus-címke
// így védve volt, de az exportált alak hazudott: egy hetedik, sehol meg nem
// jelenített „dimenziót" kínált a hívóknak. A rövid forma azóta egyetlen
// altruizmus-itemet sem szolgál ki, tehát élő kitöltésből amúgy sem áll elő
// `I` — a szűrés a szerződést teszi őszintévé (és a régi, `I`-t is hordozó
// vendég-draftra is helyesen viselkedik).
const RANKABLE_DIM_CODES = new Set<string>(TRITAN_ORDER);

export interface TeaserScoringMetaItem {
  id: number;
  dimension: string;
  reversed: boolean;
}

export interface GuestTeaserScores {
  /**
   * Belső dimenziókód (INTE/RESO/…) → 0–100 pontszám — KIZÁRÓLAG a hat
   * kanonikus dimenzió. A kiegészítő skálák (pl. `I`) nem kerülnek bele:
   * a teaser-felület sem jeleníti meg őket, a `ranked` pedig eleve szűri.
   */
  dimensions: Record<string, number>;
  /**
   * Pontszám szerint csökkenő dimenzió-lista — holtversenynél a kanonikus
   * sorrend (TRITAN_ORDER) dönt, ugyanúgy, mint a regisztráció utáni
   * archetípus-számításnál (personality-type), hogy a claim után ne
   * „nevezhessen át" a típus.
   */
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
    if (!RANKABLE_DIM_CODES.has(code)) continue;
    dimensions[code] = Math.round(((sum / count - 1) / 4) * 100);
  }

  const ranked = rankDimensionScores(
    Object.entries(dimensions).map(([code, score]) => ({ code, score })),
  );

  return { dimensions, ranked };
}
