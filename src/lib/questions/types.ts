import type { TestType } from "@prisma/client";
import type { Locale } from "@/lib/i18n";

// ============================================
// Question interfaces
// ============================================

export interface LikertQuestion {
  id: number;
  dimension: string;
  text: string;
  textByLocale?: Partial<Record<Locale, string>>;
  textObserver?: string;
  textObserverByLocale?: Partial<Record<Locale, string>>;
  reversed?: boolean;
}

export interface MBTIQuestion {
  id: number;
  dichotomy: "EI" | "SN" | "TF" | "JP";
  optionA: { text: string; pole: string };
  optionB: { text: string; pole: string };
  optionAByLocale?: Partial<Record<Locale, string>>;
  optionBByLocale?: Partial<Record<Locale, string>>;
  optionAObserver?: string;
  optionBObserver?: string;
  optionAObserverByLocale?: Partial<Record<Locale, string>>;
  optionBObserverByLocale?: Partial<Record<Locale, string>>;
}

export type Question = LikertQuestion | MBTIQuestion;

export function isMBTIQuestion(q: Question): q is MBTIQuestion {
  return "dichotomy" in q;
}

export function isLikertQuestion(q: Question): q is LikertQuestion {
  return "dimension" in q;
}

// ============================================
// Dimension configuration
// ============================================

export interface DimensionConfig {
  code: string;
  label: string;
  color: string;
  description: string;
  insights: { low: string; mid: string; high: string };
}

// ============================================
// Test configuration
// ============================================

export interface TestConfig {
  type: TestType;
  name: string;
  description: string;
  format: "likert" | "binary";
  dimensions: DimensionConfig[];
  questions: Question[];
}
