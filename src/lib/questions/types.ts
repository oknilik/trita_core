import type { TestType } from "@prisma/client";
import type { Locale } from "@/lib/i18n";

// ============================================
// Question interfaces
// ============================================

export interface LikertQuestion {
  id: number;
  dimension: string;
  facet?: string;
  aspect?: string;
  text: string;
  textByLocale?: Partial<Record<Locale, string>>;
  textObserver?: string;
  textObserverByLocale?: Partial<Record<Locale, string>>;
  reversed?: boolean;
}

export type Question = LikertQuestion;

export function isLikertQuestion(q: Question): q is LikertQuestion {
  return "dimension" in q;
}

// ============================================
// Facet/Aspect configuration (sub-dimensions)
// ============================================

export interface FacetConfig {
  code: string;
  label: string;
  labelByLocale?: Partial<Record<Locale, string>>;
}

export interface AspectConfig {
  code: string;
  label: string;
  labelByLocale?: Partial<Record<Locale, string>>;
}

// ============================================
// Dimension configuration
// ============================================

export interface DimensionConfig {
  code: string;
  label: string;
  labelByLocale?: Partial<Record<Locale, string>>;
  color: string;
  description: string;
  descriptionByLocale?: Partial<Record<Locale, string>>;
  insights: { low: string; mid: string; high: string };
  insightsByLocale?: Partial<Record<Locale, { low: string; mid: string; high: string }>>;
  facets?: FacetConfig[];
  aspects?: AspectConfig[];
}

// ============================================
// Test configuration
// ============================================

export interface TestConfig {
  type: TestType;
  name: string;
  description: string;
  format: "likert";
  dimensions: DimensionConfig[];
  questions: Question[];
}
