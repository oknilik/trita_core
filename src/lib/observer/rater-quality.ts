// ─────────────────────────────────────────────────────────────────────
// Rater-minőség detektor (halo / straight-line / fordított-item
// konzisztencia) — TISZTA modul, Prisma- és bank-mentes: a hívó adja a
// nyers válaszokat és az item-metaadatot (id → {reversed, dimension}).
//
// NEM kizárási szabály — csak minőség-JELZÉS a rater mellé. Az aggregált
// felszínen (member-dossier) kizárólag darabszámként jelenik meg;
// raterenkénti flag nevesítve SOHA nem kerül ki (anonimitás).
// ─────────────────────────────────────────────────────────────────────

export interface RaterAnswer {
  questionId: number;
  value: number; // nyers Likert-érték (1–5), fordítás ELŐTT
}

export interface RaterQualityItemMeta {
  reversed: boolean;
  dimension: string;
}

export type RaterQualityFlag = "flat" | "straightline" | "inconsistent";

export interface RaterQualityResult {
  /** Nyers válaszok populációs szórása; null = nincs értékelhető válasz. */
  itemSd: number | null;
  /** Leghosszabb azonos-érték sorozat a kitöltési (id-)sorrendben. */
  maxRun: number;
  /**
   * Dimenziónkénti |kulcsolt forward-átlag − kulcsolt fordított-átlag|
   * átlaga; null = egyetlen dimenzióban sincs mindkét irányú item.
   */
  reverseGap: number | null;
  flags: RaterQualityFlag[];
  suspect: boolean;
}

// ── Küszöbök (priorok, nem kalibrált értékek) ────────────────────────
// A 2026-08 team-intelligence audit P1-tétele alapján; validált norma
// híján szakértői priorok — az első éles eloszlás-adatok után érdemes
// újranézni őket. Mindegyik a KEREKÍTETT (2 tizedes) mutatóra fut, így a
// jelzés és a megjelenített érték sosem mond ellent egymásnak.

/**
 * Ez ALATT "flat": a nyers válaszok szórása lapos, halo-gyanús
 * válaszolást jelez (egy gondos, differenciált kitöltés tipikusan
 * 0,9–1,2 körüli szórást ad; a 0,55 a csupa-azonos + minimális
 * ingadozás sávot fogja meg).
 */
export const RATER_FLAT_SD_MAX = 0.55;

/**
 * Ettől (>=) "straightline": ennyi egymást követő azonos nyers érték a
 * kitöltési sorrendben már nem plauzibilis itemtartalom-vezérelt
 * válaszolásként (a bank irányt vált ennél sűrűbben).
 */
export const RATER_STRAIGHTLINE_RUN_MIN = 12;

/**
 * Ettől (>=) "inconsistent": a kulcsolt forward- és fordított-itemek
 * átlaga dimenziónként ennyire tér el — a fordított itemeket a kitöltő
 * jó eséllyel nem olvasta (tiszta beleegyezési torzítás ~2,0-t ad,
 * gondos kitöltés ~0–0,8-at).
 */
export const RATER_REVERSE_GAP_MIN = 1.6;

/**
 * Ennyi értékelhető item alatt egyáltalán nem flagelünk: torzó/degenerált
 * válaszsor minőségéről nincs értelmes kijelentés. Az éles formák 60/100
 * itemesek, így valós beadást ez a kapu nem érint.
 */
export const RATER_QUALITY_MIN_ITEMS = 10;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Item-metaadat térkép a kérdésbankból (szerkezetileg kompatibilis a
 * LikertQuestion-nel, de nem függ tőle — a modul bank-mentes marad).
 */
export function buildRaterQualityItemMeta(
  questions: ReadonlyArray<{ id: number; dimension: string; reversed?: boolean }>,
): Map<number, RaterQualityItemMeta> {
  const meta = new Map<number, RaterQualityItemMeta>();
  for (const q of questions) {
    meta.set(q.id, { reversed: q.reversed === true, dimension: q.dimension });
  }
  return meta;
}

/**
 * Nyers válaszsor kinyerése a tárolt ObserverAssessment.scores JSON-ból
 * ({ ...ScoreResult, answers: {questionId, value}[] }). null = a sor nem
 * hordoz értékelhető válaszokat (örökség-formátum) — ilyenkor a rater
 * minősége nem ítélhető meg, a hívó hagyja ki az aggregátumból.
 */
export function extractRaterAnswers(scores: unknown): RaterAnswer[] | null {
  if (!scores || typeof scores !== "object") return null;
  const raw = (scores as { answers?: unknown }).answers;
  if (!Array.isArray(raw)) return null;
  const answers: RaterAnswer[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const { questionId, value } = entry as { questionId?: unknown; value?: unknown };
    if (typeof questionId === "number" && typeof value === "number") {
      answers.push({ questionId, value });
    }
  }
  return answers.length > 0 ? answers : null;
}

/**
 * Egy rater válaszsorának minőség-mutatói. Csak a metában létező, véges
 * értékű válaszok számítanak (a pontozó motor is így szűr).
 */
export function assessRaterQuality(
  answers: ReadonlyArray<RaterAnswer>,
  itemMeta: ReadonlyMap<number, RaterQualityItemMeta>,
): RaterQualityResult {
  const scored = answers
    .filter((a) => Number.isFinite(a.value) && itemMeta.has(a.questionId))
    .sort((a, b) => a.questionId - b.questionId);

  if (scored.length === 0) {
    return { itemSd: null, maxRun: 0, reverseGap: null, flags: [], suspect: false };
  }

  // (a) itemSd — a NYERS (fordítás előtti) értékek populációs szórása.
  const mean = scored.reduce((sum, a) => sum + a.value, 0) / scored.length;
  const variance =
    scored.reduce((sum, a) => sum + (a.value - mean) ** 2, 0) / scored.length;
  const itemSd = round2(Math.sqrt(variance));

  // (b) maxRun — leghosszabb azonos nyers érték az id-sorrendben.
  let maxRun = 1;
  let run = 1;
  for (let i = 1; i < scored.length; i += 1) {
    run = scored[i].value === scored[i - 1].value ? run + 1 : 1;
    if (run > maxRun) maxRun = run;
  }

  // (c) reverseGap — kulcsolt (fordított itemnél 6−érték) átlagok
  // eltérése irányonként, dimenziónként; csak ahol mindkét irányból van
  // item, az ilyen dimenziók |Δ|-inak átlaga.
  const byDim = new Map<
    string,
    { fwdSum: number; fwdN: number; revSum: number; revN: number }
  >();
  for (const a of scored) {
    const meta = itemMeta.get(a.questionId)!;
    const keyed = meta.reversed ? 6 - a.value : a.value;
    let bucket = byDim.get(meta.dimension);
    if (!bucket) {
      bucket = { fwdSum: 0, fwdN: 0, revSum: 0, revN: 0 };
      byDim.set(meta.dimension, bucket);
    }
    if (meta.reversed) {
      bucket.revSum += keyed;
      bucket.revN += 1;
    } else {
      bucket.fwdSum += keyed;
      bucket.fwdN += 1;
    }
  }
  const gaps: number[] = [];
  for (const b of byDim.values()) {
    if (b.fwdN > 0 && b.revN > 0) {
      gaps.push(Math.abs(b.fwdSum / b.fwdN - b.revSum / b.revN));
    }
  }
  const reverseGap =
    gaps.length > 0 ? round2(gaps.reduce((sum, g) => sum + g, 0) / gaps.length) : null;

  const flags: RaterQualityFlag[] = [];
  if (scored.length >= RATER_QUALITY_MIN_ITEMS) {
    if (itemSd < RATER_FLAT_SD_MAX) flags.push("flat");
    if (maxRun >= RATER_STRAIGHTLINE_RUN_MIN) flags.push("straightline");
    if (reverseGap !== null && reverseGap >= RATER_REVERSE_GAP_MIN) {
      flags.push("inconsistent");
    }
  }

  return { itemSd, maxRun, reverseGap, flags, suspect: flags.length > 0 };
}
