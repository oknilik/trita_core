import type { TestType } from "@prisma/client";
import {
  getTestConfig,
  isLikertQuestion,
  type LikertQuestion,
} from "./questions";
import type { AssessmentForm } from "./questions/types";
import { normalizeDimensionKeys, normalizeFacetKeys } from "./hexaco";

// ============================================
// Likert scoring (TRITAN)
// ============================================

interface LikertAnswer {
  questionId: number;
  value: number; // 1-5
}

interface LikertScores {
  dimensions: Record<string, number>;
  facets: Record<string, Record<string, number>>;
}

function scoreLikert(
  testType: TestType,
  answers: LikertAnswer[]
): LikertScores {
  const config = getTestConfig(testType);
  const questions = config.questions.filter(isLikertQuestion) as LikertQuestion[];
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const totals: Record<string, { sum: number; count: number }> = {};
  const facetTotals: Record<string, Record<string, { sum: number; count: number }>> = {};

  for (const dim of config.dimensions) {
    totals[dim.code] = { sum: 0, count: 0 };
    if (dim.facets?.length) {
      facetTotals[dim.code] = {};
      for (const f of dim.facets) {
        facetTotals[dim.code][f.code] = { sum: 0, count: 0 };
      }
    }
  }

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    const value = question.reversed ? 6 - answer.value : answer.value;
    const dim = question.dimension;
    if (totals[dim]) {
      totals[dim].sum += value;
      totals[dim].count += 1;
    }
    if (question.facet && facetTotals[dim]?.[question.facet]) {
      facetTotals[dim][question.facet].sum += value;
      facetTotals[dim][question.facet].count += 1;
    }
  }

  // „Nincs mérve" ≠ 0 pont (2026-08-11). A korábbi `count === 0 ? 0 : …`
  // ág a meg nem válaszolt skálára KOHOLT, a valódi 0-tól megkülönböztet-
  // hetetlen nullát írt a tárolt score-JSON-ba — abból lett 0%-os sáv,
  // „figyelendő" badge, low-próza és fejlődési fókusz. A válasz nélküli
  // dimenzió/facet ezért teljesen KIMARAD a JSON-ból; az olvasók
  // (results/page.tsx, share, hiring, team/org aggregátumok, career
  // person.ts, PDF) mind `typeof … === "number"` kapuval dolgoznak, tehát
  // a hiányzó kulcsot hiányként — nem nullaként — kezelik.
  const score = (sum: number, count: number) =>
    Math.round(((sum / count - 1) / 4) * 100);

  const dimensions: Record<string, number> = {};
  for (const dim of config.dimensions) {
    const { sum, count } = totals[dim.code];
    if (count === 0) continue;
    dimensions[dim.code] = score(sum, count);
  }

  const facets: Record<string, Record<string, number>> = {};
  for (const [dimCode, facetMap] of Object.entries(facetTotals)) {
    const dimFacets: Record<string, number> = {};
    for (const [facetCode, { sum, count }] of Object.entries(facetMap)) {
      if (count === 0) continue;
      dimFacets[facetCode] = score(sum, count);
    }
    // Üresen maradt dimenzió-kulcs sem kerül a facets-be — a `{}` ugyanúgy
    // „megmért, de üres" látszatot keltene, mint a koholt 0.
    if (Object.keys(dimFacets).length > 0) facets[dimCode] = dimFacets;
  }

  return { dimensions, facets };
}

// ============================================
// Public API
// ============================================

// Provenance-pecsét: a tárolt score-JSON azonosítja, melyik bankkal és
// motor-verzióval született — bank-csere/újrapontozás esetén enélkül nem
// lehetne eldönteni, mely sorok érintettek.
export const SCORING_BANK_VERSION = "tsfi-v2";
export const SCORING_ENGINE_VERSION = 1;

// ── Bank-ujjlenyomat ────────────────────────────────────────────────────────
// A bankVersion kézzel karbantartott literál — egy item-kulcsolási szerkesztés
// (reversed-flip, dimenzió/facet-átsorolás) észrevétlenül átcsúszna alatta.
// A bankHash ezért a PONTOZÁST meghatározó mezőkből (id, reversed, dimension,
// facet) számolt, determinisztikus FNV-1a ujjlenyomat: modul-betöltéskor
// egyszer áll elő, és a bankVersion mellé kerül a score-JSON-ba. Az item
// SZÖVEGE szándékosan nem része — a megfogalmazás-finomítás nem érinti a
// pontozást. Függőség-mentes, olcsó (≈100 rövid sor hash-e).

/** 32 bites FNV-1a, 8 hexjegyű stringként. */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * Stabil ujjlenyomat egy item-lista pontozás-releváns mezőiből. Exportált,
 * hogy a unit-teszt szintetikus bankon bizonyíthassa: egy reversed-flip
 * megváltoztatja a hash-t.
 */
export function computeBankHash(
  questions: ReadonlyArray<Pick<LikertQuestion, "id" | "reversed" | "dimension" | "facet">>,
): string {
  const canonical = [...questions]
    .sort((a, b) => a.id - b.id)
    .map((q) => `${q.id}|${q.reversed ? 1 : 0}|${q.dimension}|${q.facet ?? ""}`)
    .join("\n");
  return fnv1a(canonical);
}

// Modul-betöltéskor számolt ujjlenyomat a (jelenleg egyetlen) TRITAN bankról.
export const SCORING_BANK_HASH = computeBankHash(
  getTestConfig("TRITAN" as TestType).questions.filter(isLikertQuestion),
);
// Ennyi beadott item fölött a kitöltés a teljes bank ("full") — a pecsét
// és az örökség-sorok questionCount-heurisztikája ugyanehhez köt.
export const SCORING_FULL_FORM_MIN_ITEMS = 100;

export type ScoreResult = {
  type: "likert";
  dimensions: Record<string, number>;
  facets?: Record<string, Record<string, number>>;
  /** Örökség: a korábbi motor üres aspects-et tárolt — olvasáskor tolerált. */
  aspects?: Record<string, Record<string, number>>;
  // Provenance-mezők — a pecsét bevezetése előtt tárolt sorokban hiányoznak.
  form?: AssessmentForm;
  bankVersion?: string;
  /** A bank item-kulcsolásának ujjlenyomata (computeBankHash) — a kézi
   *  bankVersion mellett a szerkesztés-driftet is detektálja. */
  bankHash?: string;
  engineVersion?: number;
};

export function calculateScores(
  testType: TestType,
  answers: LikertAnswer[]
): ScoreResult {
  const { dimensions, facets } = scoreLikert(testType, answers);
  return {
    type: "likert",
    dimensions,
    facets,
    // A beadott itemszám azonosítja a formát (60 = TSFI-S, 100 = teljes bank).
    form: answers.length >= SCORING_FULL_FORM_MIN_ITEMS ? "full" : "short",
    bankVersion: SCORING_BANK_VERSION,
    bankHash: SCORING_BANK_HASH,
    engineVersion: SCORING_ENGINE_VERSION,
  };
}

/**
 * A tárolt score-JSON KANONIKUS olvasója. Kezeli:
 * - beágyazott ScoreResult-ot: `{ type: "likert", dimensions: { X: 62, … } }`
 * - lapos örökség-formátumot: `{ X: 62, E: 45, … }`
 *
 * ÖRÖKSÉG-KULCSOK (2026-08-11): a belső dimenziókódok kivezetése előtt mentett
 * sorok az INTE/RESO/TEMP/ADAP/THOR/OPEN kulcsokat használják — ezeket a
 * `normalizeDimensionKeys` fordítja HEXACO-betűre, hogy a régi eredmények
 * változatlanul olvashatók maradjanak (migráció nélkül). Minden dimenzió-
 * olvasásnak ezen a függvényen kell átmennie; nyers `scores.dimensions`
 * hozzáférés örökség-soron hibás (üres) képet ad.
 */
export function extractDimensionScores(
  scores: unknown
): Record<string, number> | null {
  if (!scores || typeof scores !== "object") return null;
  const obj = scores as Record<string, unknown>;
  if ("dimensions" in obj && obj.dimensions && typeof obj.dimensions === "object") {
    const normalized = normalizeDimensionKeys(obj.dimensions as Record<string, unknown>);
    return Object.keys(normalized).length > 0 ? normalized : null;
  }
  // Lapos örökség-formátum: csak az ismert dim-kódok (kanonikus VAGY örökség)
  // kerülnek vissza — a tárolt JSON kísérő kulcsai (answers, questionCount, …)
  // nem szivárognak.
  const flat = normalizeDimensionKeys(obj);
  return Object.keys(flat).length > 0 ? flat : null;
}

/**
 * A tárolt score-JSON facet-bontásának kanonikus olvasója — ugyanaz az
 * örökség-kulcs normalizálás, mint a dimenzió-oldalon (a KÜLSŐ kulcs fordul,
 * a facet-kódok változatlanok). Nincs facet-bontás → null.
 */
export function extractFacetScores(
  scores: unknown
): Record<string, Record<string, number>> | null {
  if (!scores || typeof scores !== "object") return null;
  const obj = scores as Record<string, unknown>;
  if (!("facets" in obj) || !obj.facets || typeof obj.facets !== "object") return null;
  const normalized = normalizeFacetKeys(obj.facets as Record<string, unknown>);
  return Object.keys(normalized).length > 0 ? normalized : null;
}
