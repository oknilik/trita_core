export type Locale = "hu" | "en";

export const SUPPORTED_LOCALES: Locale[] = ["hu", "en"];
export const DEFAULT_LOCALE: Locale = "hu";

type LocaleRecord = Record<Locale, string>;

// ── Domain imports ──────────────────────────────────────────────────────────
import { commonTranslations } from "./common";
import { landingTranslations } from "./landing";
import { authTranslations } from "./auth";
import { assessmentTranslations } from "./assessment";
import { resultsTranslations } from "./results";
import { profileTranslations } from "./profile";
import { orgTranslations } from "./org";
import { notificationTranslations } from "./notifications";

// ── Merged dictionary ───────────────────────────────────────────────────────
// MÉLY összefésülés — a korábbi sekély spread a top-level névtér-ütközésnél
// (pl. results.ts és org.ts egyaránt definiált `dashboard` blokkot) a teljes
// korábbi blokkot ELDOBTA: ~80 dashboard.* kulcs tűnt el, a felületen nyers
// kulcsnevek jelentek meg (feedback form, journey-kártyák). A deep merge a
// levél-rekordokat ({hu, en}) egyben tartja, a névtereket összefésüli.
type TranslationNode = Record<string, unknown>;

function isLeafRecord(value: unknown): boolean {
  return value != null && typeof value === "object" && "hu" in (value as object);
}

function deepMergeTranslations(
  target: TranslationNode,
  source: TranslationNode,
): TranslationNode {
  for (const key of Object.keys(source)) {
    const incoming = source[key];
    const existing = target[key];
    if (
      incoming != null &&
      typeof incoming === "object" &&
      !isLeafRecord(incoming) &&
      existing != null &&
      typeof existing === "object" &&
      !isLeafRecord(existing)
    ) {
      deepMergeTranslations(existing as TranslationNode, incoming as TranslationNode);
    } else {
      target[key] = incoming;
    }
  }
  return target;
}

const translations = [
  commonTranslations,
  landingTranslations,
  authTranslations,
  assessmentTranslations,
  resultsTranslations,
  profileTranslations,
  orgTranslations,
  notificationTranslations,
].reduce<TranslationNode>(
  (merged, domain) => deepMergeTranslations(merged, domain as TranslationNode),
  {},
);

// ── Resolver ────────────────────────────────────────────────────────────────

function resolvePath(obj: unknown, path: string[]): LocaleRecord | undefined {
  let current: unknown = obj;
  for (const segment of path) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  if (
    current != null &&
    typeof current === "object" &&
    "hu" in (current as object)
  ) {
    return current as LocaleRecord;
  }
  return undefined;
}

// ── Public API ──────────────────────────────────────────────────────────────

export function t(key: string, locale: Locale): string {
  const segments = key.split(".");
  const record = resolvePath(translations, segments);
  if (!record) return key;
  return record[locale] ?? record[DEFAULT_LOCALE] ?? key;
}

export function tf(
  key: string,
  locale: Locale,
  vars: Record<string, string | number>,
): string {
  let text = t(key, locale);
  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

export function normalizeLocale(value?: string | null): Locale {
  if (!value) return DEFAULT_LOCALE;
  if (value === "hu") return "hu";
  if (value.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}
