// F3 — validáció és kalibráció.
//
// Két, egymástól független bizonyíték-forrás:
//  1) KALIBRÁCIÓ: a „dolgoztál hasonló szerepben — találó?" visszajelzések.
//     Foglalkozásonként találati arány, Wilson-féle alsó korláttal (kis N-nél a
//     nyers arány félrevezet: 1/1 = 100% nem bizonyíték).
//  2) KNOWN-GROUPS: azoknál, akik megadták a jelenlegi foglalkozásukat, a saját
//     foglalkozásuk hol áll a SAJÁT rangsorukban. Ha a motor mér valamit, a
//     saját szerep szisztematikusan feljebb kerül, mint véletlen esetén.

import { getOccupation } from "./catalog";
import { computeCareerFit } from "./engine";
import type { PersonInput } from "./types";

export interface FeedbackRow {
  occupationId: string;
  verdict: "accurate" | "inaccurate";
  fitScore: number;
}

export interface OccupationCalibration {
  occupationId: string;
  accurate: number;
  inaccurate: number;
  total: number;
  hitRate: number;
  /** Wilson-féle 95%-os alsó korlát — kis mintánál ez a becsületes szám */
  wilsonLow: number;
  avgFitScore: number;
  /** true, ha a találati arány alsó korlátja a véletlen (0.5) alatt van */
  belowChance: boolean;
}

/** Wilson-féle alsó konfidencia-korlát arányra (z = 1.96). */
export function wilsonLowerBound(successes: number, total: number, z = 1.96): number {
  if (total === 0) return 0;
  const p = successes / total;
  const denominator = 1 + (z * z) / total;
  const centre = p + (z * z) / (2 * total);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  return Math.max(0, (centre - margin) / denominator);
}

export function calibrateFeedback(rows: FeedbackRow[]): OccupationCalibration[] {
  const buckets = new Map<string, { accurate: number; inaccurate: number; scoreSum: number }>();
  for (const row of rows) {
    const entry = buckets.get(row.occupationId) ?? { accurate: 0, inaccurate: 0, scoreSum: 0 };
    if (row.verdict === "accurate") entry.accurate += 1;
    else entry.inaccurate += 1;
    entry.scoreSum += row.fitScore;
    buckets.set(row.occupationId, entry);
  }
  return [...buckets.entries()]
    .map(([occupationId, entry]) => {
      const total = entry.accurate + entry.inaccurate;
      const wilsonLow = wilsonLowerBound(entry.accurate, total);
      return {
        occupationId,
        accurate: entry.accurate,
        inaccurate: entry.inaccurate,
        total,
        hitRate: total > 0 ? entry.accurate / total : 0,
        wilsonLow,
        avgFitScore: total > 0 ? Math.round(entry.scoreSum / total) : 0,
        // Csak akkor jelzünk, ha a bizonytalanságot is figyelembe véve rossz:
        // a felső korlát a véletlen alatt van, tehát nem mintavételi zaj.
        belowChance: total >= 5 && wilsonLowerBound(entry.inaccurate, total) > 0.5,
      };
    })
    .sort((a, b) => b.total - a.total);
}

// ── Known-groups ────────────────────────────────────────────────────────────

export interface KnownGroupCase {
  /** a személy saját, megadott foglalkozása (katalógus-azonosító) */
  occupationId: string;
  person: PersonInput;
}

export interface KnownGroupsResult {
  n: number;
  /** a saját foglalkozás átlagos percentilise a saját rangsorban (0-100, magasabb = jobb) */
  meanPercentile: number;
  /** véletlen esetén ez 50 lenne */
  medianPercentile: number;
  /** hányad részüknél került a saját szerep a felső negyedbe */
  topQuartileShare: number;
  /** egymintás t-próba a percentilis 50-hez képest */
  t: number;
  /** Cohen d — hatásméret */
  d: number;
  /** foglalkozásonkénti bontás */
  perOccupation: Array<{ occupationId: string; n: number; meanPercentile: number }>;
}

/**
 * A saját foglalkozás rangsor-percentilise: a teljes katalógusra kiszámolt
 * illeszkedésben hány százalék van alatta. Ha a motor nem mér semmit, ez
 * átlagosan 50 körül szór.
 *
 * A validáció KÉNYSZERÍTETTEN a kompozit stratégián és a TELJES katalóguson
 * fut. Az alapértelmezett (interest-led) ág mért érdeklődésnél 30–60 tételre
 * csonkolja a rangsort — egy pool-on kívüli saját foglalkozás így null-ként
 * kiesett, a percentilis pedig egy ELŐSZŰRT halmazon belül számolódott: a
 * nevező azokból a súlyokból származott, amiket éppen validálni akarunk
 * (körkörös, a statisztikát felfelé torzító számítás). Ugyanezért a vétók is
 * kimaradnak: egy vétóval kizárt saját szerep sem eshet ki az esetek közül.
 */
export function ownOccupationPercentile(
  person: PersonInput,
  occupationId: string,
): number | null {
  // Katalóguson kívüli azonosító (adathiba, örökség-kulcs): nem a motort
  // minősíti — ez maradhat kiesett eset.
  if (!getOccupation(occupationId)) return null;
  const result = computeCareerFit(
    { ...person, vetoes: [] },
    {
      limit: 10_000,
      diversify: false,
      strategy: "composite",
    },
  );
  const ranked = result.ranked;
  if (ranked.length < 2) return null;
  const index = ranked.findIndex((fit) => fit.id === occupationId);
  // Katalógusban létező, de a rangsorból mégis hiányzó saját szerep: ALSÓ
  // percentilisként számít, nem kiesett esetként — a kiesés a validációs
  // statisztikát javítaná, pont ott, ahol a motor a leggyengébb.
  if (index < 0) return 0;
  return ((ranked.length - 1 - index) / (ranked.length - 1)) * 100;
}

export function runKnownGroups(cases: KnownGroupCase[]): KnownGroupsResult {
  const percentiles: Array<{ occupationId: string; percentile: number }> = [];
  for (const item of cases) {
    const percentile = ownOccupationPercentile(item.person, item.occupationId);
    if (percentile !== null) {
      percentiles.push({ occupationId: item.occupationId, percentile });
    }
  }
  const values = percentiles.map((entry) => entry.percentile);
  const n = values.length;
  if (n === 0) {
    return {
      n: 0,
      meanPercentile: 0,
      medianPercentile: 0,
      topQuartileShare: 0,
      t: 0,
      d: 0,
      perOccupation: [],
    };
  }
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const sorted = [...values].sort((a, b) => a - b);
  const median =
    n % 2 === 1 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const variance =
    n > 1 ? values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1) : 0;
  const sd = Math.sqrt(variance);
  const t = sd > 0 ? (mean - 50) / (sd / Math.sqrt(n)) : 0;
  const d = sd > 0 ? (mean - 50) / sd : 0;

  const byOccupation = new Map<string, number[]>();
  for (const entry of percentiles) {
    const list = byOccupation.get(entry.occupationId) ?? [];
    list.push(entry.percentile);
    byOccupation.set(entry.occupationId, list);
  }

  return {
    n,
    meanPercentile: Math.round(mean * 10) / 10,
    medianPercentile: Math.round(median * 10) / 10,
    topQuartileShare:
      Math.round((values.filter((v) => v >= 75).length / n) * 1000) / 1000,
    t: Math.round(t * 100) / 100,
    d: Math.round(d * 100) / 100,
    perOccupation: [...byOccupation.entries()]
      .map(([occupationId, list]) => ({
        occupationId,
        n: list.length,
        meanPercentile:
          Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10,
      }))
      .sort((a, b) => b.n - a.n),
  };
}
