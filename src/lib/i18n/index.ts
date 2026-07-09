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
const translations = {
  ...commonTranslations,
  ...landingTranslations,
  ...authTranslations,
  ...assessmentTranslations,
  ...resultsTranslations,
  ...profileTranslations,
  ...orgTranslations,
  ...notificationTranslations,
} as const;

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
