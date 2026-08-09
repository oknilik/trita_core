import type { Locale } from "@/lib/i18n";
import { getDimensionTier, type DimensionTier } from "@/lib/dimension-utils";
import { TRITAN_ORDER, TRITAN_DIM_ABBR, type TritanDimCode } from "@/lib/tritan";
import {
  SIMPLE_DIM_SENTENCE,
  SIMPLE_PATTERN,
  SIMPLE_POLES,
  SIMPLE_STRENGTH,
  SIMPLE_WATCH,
  SIMPLE_WATCH_BALANCED,
} from "./simple-copy";

// ─────────────────────────────────────────────────────────────────────
// Az EGYSZERŰ eredmény-nézet nézetmodellje.
//
// Semmilyen ÚJ mérésre nincs szüksége: ugyanazokból a dimenzió-
// pontszámokból dolgozik, amiket a részletes nézet is kap. A feladata
// az, hogy a hat számból három mondható állítást és hat kétpólusú sort
// állítson elő — determinisztikusan, hogy ugyanaz a profil mindig
// ugyanazt a szöveget kapja.
// ─────────────────────────────────────────────────────────────────────

/**
 * A pólus-kiemelés küszöbe. Szándékosan szűkebb, mint a szint-küszöb
 * (70/40): a 45–55 közti sávban egyik véglet kiemelése sem lenne
 * őszinte — ott tényleg „mindkettő, helyzettől függően" a válasz.
 */
export const NEAR_POLE_HIGH = 55;
export const NEAR_POLE_LOW = 45;

/**
 * E fölött a legalacsonyabb dimenzió sem „figyelendő": ilyenkor a
 * harmadik állítás hiány-nyelv helyett a kiegyensúlyozott profilról szól.
 */
export const BALANCED_WATCH_MIN = 60;

export interface SimpleDimensionInput {
  code: string;
  /** Lokalizált dimenzió-címke (a `tritan.ts` értéke) — ezt nem írjuk felül. */
  label: string;
  score: number;
}

export interface SimpleDimension {
  code: string;
  /** Egybetűs jelölés a sor elején (H · E · X · A · C · O). */
  letter: string;
  label: string;
  score: number;
  tier: DimensionTier;
  poleLow: string;
  poleHigh: string;
  /** Melyik pólus felé billen láthatóan; `null` = középmező. */
  near: "low" | "high" | null;
  sentence: string;
}

export type SimpleStatementKind = "strength" | "pattern" | "watch";

export interface SimpleStatement {
  kind: SimpleStatementKind;
  headline: string;
  body: string;
  /** A dimenzió, amiből az állítás származik — a forrás-chip tartalma. */
  source: { code: string; label: string } | null;
}

export interface SimpleSummary {
  /** Kanonikus H · E · X · A · C · O sorrendben. */
  dimensions: SimpleDimension[];
  /** Erősség → működésmód → figyelendő; üres, ha nincs értékelhető adat. */
  statements: SimpleStatement[];
}

function canonicalIndex(code: string): number {
  const i = (TRITAN_ORDER as readonly string[]).indexOf(code);
  return i === -1 ? TRITAN_ORDER.length : i;
}

function nearPole(score: number): "low" | "high" | null {
  if (score >= NEAR_POLE_HIGH) return "high";
  if (score <= NEAR_POLE_LOW) return "low";
  return null;
}

export function buildSimpleSummary(input: {
  dimensions: SimpleDimensionInput[];
  locale: Locale;
}): SimpleSummary {
  const { locale } = input;

  // Csak a hat fő dimenzió: az altruizmus (`I`) kiegészítő skála, a
  // részletes nézet külön kártyája — az egyszerű nézetbe nem kerül be.
  const main = input.dimensions.filter((d) => canonicalIndex(d.code) < TRITAN_ORDER.length);

  const dimensions: SimpleDimension[] = main
    .slice()
    .sort((a, b) => canonicalIndex(a.code) - canonicalIndex(b.code))
    .map((d) => {
      const tier = getDimensionTier(d.score);
      const poles = SIMPLE_POLES[d.code];
      const sentence = SIMPLE_DIM_SENTENCE[d.code]?.[tier]?.[locale] ?? "";
      return {
        code: d.code,
        letter: TRITAN_DIM_ABBR[d.code as TritanDimCode]?.[locale] ?? d.label.slice(0, 1),
        label: d.label,
        score: d.score,
        tier,
        poleLow: poles?.low[locale] ?? "",
        poleHigh: poles?.high[locale] ?? "",
        near: nearPole(d.score),
        sentence,
      };
    });

  // Rangsor: pont szerint csökkenő, azonos pontnál a kanonikus sorrend dönt
  // — így ugyanaz a profil mindig ugyanazt az állítás-hármast kapja.
  const ranked = main
    .slice()
    .sort((a, b) => b.score - a.score || canonicalIndex(a.code) - canonicalIndex(b.code));

  const statements: SimpleStatement[] = [];

  const top = ranked[0];
  if (top && SIMPLE_STRENGTH[top.code]) {
    statements.push({
      kind: "strength",
      headline: SIMPLE_STRENGTH[top.code].headline[locale],
      body: SIMPLE_STRENGTH[top.code].body[locale],
      source: { code: top.code, label: top.label },
    });
  }

  const second = ranked[1];
  if (second && SIMPLE_PATTERN[second.code]) {
    statements.push({
      kind: "pattern",
      headline: SIMPLE_PATTERN[second.code].headline[locale],
      body: SIMPLE_PATTERN[second.code].body[locale],
      source: { code: second.code, label: second.label },
    });
  }

  const lowest = ranked[ranked.length - 1];
  if (lowest && lowest !== top) {
    if (lowest.score >= BALANCED_WATCH_MIN) {
      // Kiegyensúlyozott profil: nincs mire „figyelni" — a hiány-nyelv itt
      // hamis lenne, ezért nincs forrás-dimenzió sem.
      statements.push({
        kind: "watch",
        headline: SIMPLE_WATCH_BALANCED.headline[locale],
        body: SIMPLE_WATCH_BALANCED.body[locale],
        source: null,
      });
    } else if (SIMPLE_WATCH[lowest.code]) {
      statements.push({
        kind: "watch",
        headline: SIMPLE_WATCH[lowest.code].headline[locale],
        body: SIMPLE_WATCH[lowest.code].body[locale],
        source: { code: lowest.code, label: lowest.label },
      });
    }
  }

  return { dimensions, statements };
}
